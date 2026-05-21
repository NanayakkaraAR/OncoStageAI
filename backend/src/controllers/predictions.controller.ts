import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';

export const getPatientPredictions = async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.user!.id;

    const predictions = await prisma.prediction.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = predictions.length;
    const completed = total; 
    const pending = 0;       

    res.json({ success: true, data: { predictions, stats: { total, completed, pending } } });
  } catch (error) {
    console.error('Patient predictions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch patient predictions' });
  }
};

export const getAssignedDoctor = async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.user!.id;

    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(new Date(now).setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    const rows = await prisma.$queryRaw<
      { id: number; firstName: string; lastName: string; email: string }[]
    >`
      SELECT u.id, u."firstName", u."lastName", u.email,
             (SELECT COUNT(*)::int FROM messages WHERE "senderId" = u.id AND "receiverId" = ${patientId} AND "isRead" = false) as "unreadCount"
      FROM doctor_patient_assignments dpa
      JOIN users u ON u.id = dpa."doctorId"
      WHERE dpa."patientId" = ${patientId} AND dpa."weekStartDate" = ${weekStart}
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Get assigned doctor error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch assigned doctor' });
  }
};

export const assignDoctor = async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.user!.id;
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ success: false, error: 'doctorId is required' });
    }

    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(new Date(now).setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    // 1. Cleanup: Remove all appointments from previous weeks
    await prisma.$executeRaw`DELETE FROM doctor_patient_assignments WHERE "weekStartDate" < ${weekStart}`;

    // 2. Check Capacity: Ensure doctor doesn't exceed 10 appointments this week
    // Exclude the current patient if they are already assigned to this doctor
    const currentCountRows = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int as count FROM doctor_patient_assignments 
      WHERE "doctorId" = ${Number(doctorId)} 
      AND "weekStartDate" = ${weekStart}
      AND "patientId" != ${patientId}
    `;
    
    if (currentCountRows[0].count >= 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'This doctor has reached the maximum weekly limit of 10 appointments. Please try again next week or choose another doctor.' 
      });
    }

    await prisma.$executeRaw`
      INSERT INTO doctor_patient_assignments ("doctorId", "patientId", "assignedAt", "weekStartDate")
      VALUES (${Number(doctorId)}, ${patientId}, NOW(), ${weekStart})
      ON CONFLICT ("patientId")
      DO UPDATE SET "doctorId" = ${Number(doctorId)}, "assignedAt" = NOW(), "weekStartDate" = ${weekStart}
    `;

    const rows = await prisma.$queryRaw<
      { id: number; firstName: string; lastName: string; email: string }[]
    >`
      SELECT id, "firstName", "lastName", email FROM users WHERE id = ${Number(doctorId)} LIMIT 1
    `;

    res.json({ success: true, data: rows[0] ?? null });
  } catch (error) {
    console.error('Assign doctor error:', error);
    res.status(500).json({ success: false, error: 'Failed to assign doctor' });
  }
};

export const getDoctors = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(new Date(now).setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    const doctors = await prisma.$queryRaw<any[]>`
      SELECT u.id, u."firstName", u."lastName", u.email,
             (SELECT COUNT(*)::int FROM doctor_patient_assignments dpa 
              WHERE dpa."doctorId" = u.id AND dpa."weekStartDate" = ${weekStart}) as "appointmentCount"
      FROM users u
      WHERE u.role = 'DOCTOR' AND u."isActive" = true
      ORDER BY u."firstName" ASC
    `;
    res.json({ success: true, data: doctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch doctors' });
  }
};

export const submitPrediction = async (req: AuthRequest, res: Response) => {
  try {
    let patientId = req.user!.id;
    const { doctorId, patientId: bodyPatientId, ...featureData } = req.body;

    // If doctor is submitting, use patientId from body
    if (req.user!.role === 'DOCTOR' && bodyPatientId) {
      patientId = Number(bodyPatientId);
    }

    if (!doctorId) {
      return res.status(400).json({ success: false, error: 'doctorId is required' });
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000/predict';
    
    // Sanitize featureData for ML Service (ensure all numbers)
    const sanitizedFeatures: any = {};
    Object.keys(featureData).forEach(key => {
      const val = featureData[key];
      if (val !== null && val !== undefined && val !== '') {
        sanitizedFeatures[key] = Number(val);
      }
    });

    console.log('[Prediction] Sending to ML Service:', sanitizedFeatures);

    let mlResult: any;
    try {
      mlResult = await new Promise((resolve, reject) => {
        const url = new URL(mlServiceUrl);
        const postData = JSON.stringify(sanitizedFeatures);
        
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
              reject(new Error(`AI Service responded with status: ${res.statusCode}`));
            }
          });
        });

        req.on('error', (e: Error) => reject(e));
        req.write(postData);
        req.end();
      });
    } catch (err: any) {
      console.error('[Prediction] ML Service error:', err);
      return res.status(502).json({ 
        success: false, 
        error: `Could not connect to AI Service: ${err.message}` 
      });
    }

    const prediction = await prisma.prediction.create({
      data: {
        patientId,
        doctorId: Number(doctorId),
        result: mlResult.prediction,
        Age: Number(featureData.Age) || 0,
        Gender: Number(featureData.Gender) || 0,
        Country: Number(featureData.Country) || 0,
        Smoking_History: Number(featureData.Smoking_History) || 0,
        Tumor_Size_mm: Number(featureData.Tumor_Size_mm) || 0,
        Mutation_Status: Number(featureData.Mutation_Status) || 0,
        Treatment_Type: Number(featureData.Treatment_Type) || 0,
        Survival_Months: Number(featureData.Survival_Months) || 0,
        Smoking_Pack_Years: Number(featureData.Smoking_Pack_Years) || 0,
        Biomarker_Status: Number(featureData.Biomarker_Status) || 0,
        ECOG_Performance_Status: Number(featureData.ECOG_Performance_Status) || 0,
        Hemoglobin_Level: Number(featureData.Hemoglobin_Level) || 0,
        White_Blood_Cell_Count: Number(featureData.White_Blood_Cell_Count) || 0,
        Platelet_Count: Number(featureData.Platelet_Count) || 0,
        Calcium_Level: Number(featureData.Calcium_Level) || 0,
        Albumin_Level: Number(featureData.Albumin_Level) || 0,
        LDH_Level: Number(featureData.LDH_Level) || 0,
        Creatinine_Level: Number(featureData.Creatinine_Level) || 0,
        Glucose_Level: Number(featureData.Glucose_Level) || 0,
        Cholesterol_Level: Number(featureData.Cholesterol_Level) || 0,
        Bilirubin_Level: Number(featureData.Bilirubin_Level) || 0,
        AST_Level: Number(featureData.AST_Level ?? featureData.Aspartate_Aminotransferase_Level ?? 0),
        ALT_Level: Number(featureData.ALT_Level ?? featureData.Alanine_Aminotransferase_Level ?? 0),
        Sodium_Level: Number(featureData.Sodium_Level) || 0,
        Potassium_Level: Number(featureData.Potassium_Level) || 0,
        Chloride_Level: Number(featureData.Chloride_Level) || 0,
        Urea_Level: Number(featureData.Urea_Level) || 0,
        Uric_Acid_Level: Number(featureData.Uric_Acid_Level) || 0,
        Magnesium_Level: Number(featureData.Magnesium_Level) || 0,
        Phosphorus_Level: Number(featureData.Phosphorus_Level) || 0,
        Iron_Level: Number(featureData.Iron_Level) || 0,
        Ferritin_Level: Number(featureData.Ferritin_Level) || 0,
        Transferrin_Level: Number(featureData.Transferrin_Level) || 0,
        CRP_Level: Number(featureData.CRP_Level) || 0,
        ESR_Level: Number(featureData.ESR_Level) || 0,
        Procalcitonin_Level: Number(featureData.Procalcitonin_Level) || 0,
        Vitamin_D_Level: Number(featureData.Vitamin_D_Level) || 0,
        Vitamin_B12_Level: Number(featureData.Vitamin_B12_Level) || 0,
        Folate_Level: Number(featureData.Folate_Level) || 0,
        TSH_Level: Number(featureData.TSH_Level) || 0,
        Free_T3_Level: Number(featureData.Free_T3_Level) || 0,
        Free_T4_Level: Number(featureData.Free_T4_Level) || 0,
        Cortisol_Level: Number(featureData.Cortisol_Level) || 0,
        Insulin_Level: Number(featureData.Insulin_Level) || 0,
        HbA1c_Level: Number(featureData.HbA1c_Level) || 0,
        Triglycerides_Level: Number(featureData.Triglycerides_Level) || 0,
        HDL_Level: Number(featureData.HDL_Level) || 0,
        LDL_Level: Number(featureData.LDL_Level) || 0,
        Total_Protein_Level: Number(featureData.Total_Protein_Level) || 0,
        Globulin_Level: Number(featureData.Globulin_Level) || 0,
        Alkaline_Phosphatase_Level: Number(featureData.Alkaline_Phosphatase_Level) || 0,
        GGT_Level: Number(featureData.GGT_Level) || 0,
      },
    });

    const fullPrediction = await prisma.prediction.findUnique({
      where: { id: prediction.id },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    res.json({ success: true, data: fullPrediction });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

export const getDoctorPredictions = async (req: AuthRequest, res: Response) => {
  try {
    const doctorId = req.user!.id;

    const predictions = await prisma.prediction.findMany({
      where: { doctorId },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: predictions });
  } catch (error) {
    console.error('Doctor predictions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch predictions' });
  }
};

export const updatePredictionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const predictionId = Number(req.params.id);
  const { status, doctorComments, doctorRecommendation } = req.body;

    if (!predictionId) {
      return res.status(400).json({ success: false, error: 'Prediction ID is required' });
    }

    const prediction = await prisma.prediction.update({
      where: { id: predictionId },
      data: {
        status: status ?? undefined,
        doctorComments: doctorComments ?? undefined,
        doctorRecommendation: doctorRecommendation ?? undefined,
      },
    });

    res.json({ success: true, data: prediction });
  } catch (error) {
    console.error('Update prediction status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
};

export const getDoctorPatients = async (req: AuthRequest, res: Response) => {
  try {
    const doctorId = req.user!.id;

    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(new Date(now).setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    const rows = await prisma.$queryRaw<
      { id: number; firstName: string; lastName: string; email: string }[]
    >`
      SELECT u.id, u."firstName", u."lastName", u.email,
             (SELECT COUNT(*)::int FROM messages WHERE "senderId" = u.id AND "receiverId" = ${doctorId} AND "isRead" = false) as "unreadCount"
      FROM doctor_patient_assignments dpa
      JOIN users u ON u.id = dpa."patientId"
      WHERE dpa."doctorId" = ${doctorId} AND dpa."weekStartDate" = ${weekStart}
    `;

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get doctor patients error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch patients' });
  }
};
