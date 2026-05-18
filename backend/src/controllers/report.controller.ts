import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';
import path from 'path';
import fs from 'fs';

export const uploadReport = async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.user!.id;
    const { doctorId, reportType = 'Clinical' } = req.body;
    const file = req.file;

    if (!doctorId) {
      return res.status(400).json({ success: false, error: 'doctorId is required' });
    }

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const fileBuffer = fs.readFileSync(file.path);

    const report = await prisma.report.create({
      data: {
        patientId,
        doctorId: Number(doctorId),
        fileName: file.originalname,
        filePath: file.path,
        fileType: file.mimetype,
        reportType: reportType, // Store the report type
        fileContent: fileBuffer,
      },
    });

    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Upload report error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload report' });
  }
};

export const getPatientReports = async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.user!.id;
    const reports = await prisma.report.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Get patient reports error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
};

export const getDoctorReports = async (req: AuthRequest, res: Response) => {
  try {
    const doctorId = req.user!.id;
    const { patientId } = req.params;

    const reports = await prisma.report.findMany({
      where: {
        doctorId,
        patientId: Number(patientId),
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Get doctor reports error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
};

export const getAllDoctorReports = async (req: AuthRequest, res: Response) => {
  try {
    const doctorId = req.user!.id;
    const reports = await prisma.report.findMany({
      where: { doctorId },
      include: {
        patient: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Get all doctor reports error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
};

export const parseReport = async (req: AuthRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const report = await prisma.report.findUnique({
      where: { id: Number(reportId) },
    });

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL_PARSE || 'http://127.0.0.1:8000/parse-report';
    const absolutePath = path.resolve(report.filePath);
    
    console.log(`[ParseReport] ID: ${reportId}, Path: ${absolutePath}, Type: ${report.reportType}`);

    // Use a promise-based wrapper for http.request for better compatibility
    const mlData = await new Promise((resolve, reject) => {
      const url = new URL(mlServiceUrl);
      const postData = JSON.stringify({ 
        filePath: absolutePath,
        fileName: report.fileName,
        fileBase64: report.fileContent ? Buffer.from(report.fileContent).toString('base64') : null
      });
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = require('http').request(options, (res: any) => {
        let body = '';
        res.on('data', (chunk: string) => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error('Invalid JSON from ML service'));
            }
          } else {
            reject(new Error(`ML Service responded with status: ${res.statusCode}`));
          }
        });
      });

      req.on('error', (e: Error) => reject(e));
      req.write(postData);
      req.end();
    }) as any;

    // Filter extracted fields based on report type
    const filteredData = filterExtractedFields(mlData.data || {}, report.reportType);

    console.log(`[ParseReport] Success, extracted ${Object.keys(mlData.data || {}).length} fields, filtered to ${Object.keys(filteredData).length} for report type: ${report.reportType}`);
    res.json({ success: true, data: filteredData });
  } catch (error) {
    console.error('[ParseReport] Controller Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to parse report' 
    });
  }
};

// Helper function to filter extracted fields based on report type
const filterExtractedFields = (data: Record<string, any>, reportType: string): Record<string, any> => {
  // Clinical-specific fields that should only be included for Clinical reports
  const clinicalSymptomFields = [
    'Symptom_Smoking', 'Yellow_Fingers', 'Anxiety', 'Peer_Pressure',
    'Chronic_Disease', 'Fatigue', 'Allergy', 'Wheezing',
    'Coughing', 'Shortness_Of_Breath', 'Swallowing_Difficulty', 'Chest_Pain'
  ];

  const bloodChemistryFields = [
    'Hemoglobin_Level', 'White_Blood_Cell_Count', 'Platelet_Count',
    'Albumin_Level', 'LDH_Level', 'Calcium_Level', 'Creatinine_Level',
    'Glucose_Level', 'Potassium_Level', 'Sodium_Level', 'Phosphorus_Level',
    'Alkaline_Phosphatase_Level', 'Alanine_Aminotransferase_Level',
    'Aspartate_Aminotransferase_Level'
  ];

  const clinicalOnlyFields = [...clinicalSymptomFields, ...bloodChemistryFields];

  // If it's not a Clinical report, exclude clinical-specific fields
  if (reportType !== 'Clinical') {
    const filtered: Record<string, any> = {};
    Object.keys(data).forEach(key => {
      if (!clinicalOnlyFields.includes(key)) {
        filtered[key] = data[key];
      }
    });
    return filtered;
  }

  // For Clinical reports, return all fields
  return data;
};

export const getReportFile = async (req: AuthRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const report = await prisma.report.findUnique({
      where: { id: Number(reportId) },
    });

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Authorization check
    if (req.user!.role === 'PATIENT' && report.patientId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    if (req.user!.role === 'DOCTOR' && report.doctorId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    if (report.fileContent) {
      console.log(`Serving report ${report.id} from database (${report.fileContent.length} bytes)`);
      res.setHeader('Content-Type', report.fileType || 'application/pdf');
      res.setHeader('Content-Length', report.fileContent.length);
      res.setHeader('Content-Disposition', `inline; filename="${report.fileName}"`);
      return res.end(Buffer.from(report.fileContent));
    }

    const absolutePath = path.resolve(report.filePath);
    if (!fs.existsSync(absolutePath)) {
      console.error(`File not found on disk: ${absolutePath}`);
      return res.status(404).json({ success: false, error: 'File not found on disk and no DB content available' });
    }

    res.sendFile(absolutePath);
  } catch (error) {
    console.error('Get report file error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch report file' });
  }
};

export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const report = await prisma.report.findUnique({
      where: { id: Number(reportId) },
    });

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    if (userRole === 'DOCTOR' && report.doctorId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    if (userRole === 'PATIENT' && report.patientId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const absolutePath = path.resolve(report.filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await prisma.report.delete({
      where: { id: Number(reportId) },
    });

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete report' });
  }
};

export const updateReportStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const report = await prisma.report.findUnique({
      where: { id: Number(reportId) },
    });

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    if (userRole === 'DOCTOR' && report.doctorId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    if (userRole === 'PATIENT' && report.patientId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const updatedReport = await prisma.report.update({
      where: { id: Number(reportId) },
      data: { status },
    });

    res.json({ success: true, data: updatedReport });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update report status' });
  }
};

