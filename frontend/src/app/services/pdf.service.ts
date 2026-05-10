import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  constructor() {}

  /**
   * Generates a PDF from an HTML element
   * @param elementId The ID of the element to capture
   * @param fileName The name of the resulting PDF file
   */
  async generatePdfFromElement(elementId: string, fileName: string): Promise<void> {
    const data = document.getElementById(elementId);
    if (!data) {
      console.error(`Element with id ${elementId} not found`);
      return;
    }

    try {
      const canvas = await html2canvas(data, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgWidth = 208;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const contentDataURL = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const position = 0;
      
      pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  }

  /**
   * Generates a structured PDF for medical assessment
   * @param assessmentData The data to include in the PDF
   * @param patientName The name of the patient
   * @param doctorName The name of the doctor
   * @param result The prediction result
   * @param fieldGroups Optional field groups for better labeling and organization
   */
  generateAssessmentPdf(assessmentData: any, patientName: string, doctorName: string, result?: string, fieldGroups?: any[]): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const date = new Date().toLocaleDateString();
    
    // Header
    doc.setFillColor(14, 165, 233); // #0ea5e9
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('OncoStage AI', 20, 25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Clinical Assessment Report', 20, 32);
    
    // Date
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.text(`Date: ${date}`, pageWidth - 50, 50, { align: 'right' });
    
    // Patient & Doctor Info
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Information', 20, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${patientName}`, 20, 68);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Practitioner Information', pageWidth / 2, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`Doctor: Dr. ${doctorName}`, pageWidth / 2, 68);
    
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(20, 78, pageWidth - 20, 78);
    
    // Clinical Data Summary Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Clinical Data Summary', 20, 90);
    
    let y = 100;
    doc.setFontSize(10);
    
    if (fieldGroups && fieldGroups.length > 0) {
      // Use field groups to organize data
      fieldGroups.forEach(group => {
        // Check if group has any fields with data
        const groupFieldsWithData = group.fields.filter((f: any) => {
          const val = assessmentData[f.key];
          return val !== undefined && val !== null && val.toString().trim() !== '';
        });

        if (groupFieldsWithData.length > 0) {
          // Check for page break before group title
          if (y > 250) {
            doc.addPage();
            y = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(14, 165, 233);
          doc.text(group.label, 20, y);
          y += 7;
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'normal');

          groupFieldsWithData.forEach((field: any) => {
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
            const val = assessmentData[field.key];
            const displayVal = (field.isBinary || field.label.includes('0/1')) 
              ? (val == 1 ? 'Yes' : 'No') 
              : val;
            
            doc.text(`${field.label}:`, 25, y);
            doc.setFont('helvetica', 'bold');
            doc.text(`${displayVal}`, 100, y);
            doc.setFont('helvetica', 'normal');
            y += 7;
          });
          y += 5; // Space between groups
        }
      });
    } else {
      // Fallback: Simple list of items
      const items = Object.entries(assessmentData);
      items.forEach(([key, value]) => {
        if (typeof value !== 'object' && key !== 'patientId' && key !== 'doctorId' && value !== null && value !== undefined && value.toString().trim() !== '') {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          const label = key.replace(/_/g, ' ');
          doc.text(`${label}:`, 25, y);
          doc.setFont('helvetica', 'bold');
          doc.text(`${value}`, 80, y);
          doc.setFont('helvetica', 'normal');
          y += 7;
        }
      });
    }
    
    if (result) {
      // Ensure prediction result is on a new page if needed or has space
      if (y > 240) {
        doc.addPage();
        y = 20;
      } else {
        y += 10;
      }
      
      doc.setFillColor(240, 253, 244); // light green
      doc.rect(20, y, pageWidth - 40, 30, 'F');
      doc.setDrawColor(34, 197, 94); // green
      doc.rect(20, y, pageWidth - 40, 30, 'S');
      
      doc.setTextColor(21, 128, 61);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('AI PREDICTION RESULT', 25, y + 12);
      doc.setFontSize(18);
      doc.text(result, 25, y + 22);
    }
    
    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        'This report is generated by OncoStage AI. Medical disclaimer: Always consult with a qualified professional.',
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    const fileName = `Assessment_${patientName.replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  }

  /**
   * Generates a sample medical report PDF for testing auto-fill functionality
   * @param riskLevel 'low' | 'medium' | 'high'
   */
  generateSampleMedicalReport(riskLevel: 'low' | 'medium' | 'high' = 'medium'): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header - Professional look
    let headerColor = [30, 41, 59]; // Default Slate 800
    if (riskLevel === 'low') headerColor = [22, 163, 74]; // Green 600
    if (riskLevel === 'high') headerColor = [220, 38, 38]; // Red 600
    
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('CITY GENERAL HOSPITAL', 20, 30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Oncology Department | ${riskLevel.toUpperCase()} RISK SAMPLE`, 20, 38);
    
    // Report Title
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CLINICAL DIAGNOSTIC REPORT', pageWidth / 2, 65, { align: 'center' });
    
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 70, pageWidth - 20, 70);
    
    // Mock Patient Info
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('PATIENT NAME:', 20, 80);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(riskLevel === 'low' ? 'Alice Low-Risk' : riskLevel === 'high' ? 'Robert High-Risk' : 'John Medium-Risk', 60, 80);
    
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text('PATIENT ID:', 20, 87);
    doc.setTextColor(30, 41, 59);
    doc.text(`P-${riskLevel.toUpperCase()}-001`, 60, 87);
    
    doc.setTextColor(71, 85, 105);
    doc.text('DATE OF BIRTH:', pageWidth / 2, 80);
    doc.setTextColor(30, 41, 59);
    const age = riskLevel === 'low' ? 30 : riskLevel === 'high' ? 75 : 55;
    doc.text(`(Age: ${age})`, pageWidth / 2 + 40, 80);
    
    doc.setTextColor(71, 85, 105);
    doc.text('REPORT DATE:', pageWidth / 2, 87);
    doc.setTextColor(30, 41, 59);
    doc.text(new Date().toLocaleDateString(), pageWidth / 2 + 40, 87);
    
    doc.line(20, 95, pageWidth - 20, 95);
    
    // Clinical Findings Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Laboratory & Clinical Findings', 20, 105);
    
    const startY = 115;
    const rowHeight = 8;
    const col1 = 25;
    const col2 = 100;
    const col3 = 150;
    
    // Table Header
    doc.setFillColor(248, 250, 252);
    doc.rect(20, startY - 7, pageWidth - 40, rowHeight, 'F');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('PARAMETER', col1, startY);
    doc.text('VALUE', col2, startY);
    doc.text('REFERENCE RANGE', col3, startY);
    
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    
    let findings: any[] = [];
    if (riskLevel === 'low') {
      findings = [
        { p: 'Age', v: '30', r: 'N/A' },
        { p: 'Smoking History', v: 'No (0)', r: '0-1' },
        { p: 'Tumor Size', v: '5 mm', r: '< 10' },
        { p: 'Hemoglobin', v: '16.0 g/dL', r: '13.5-17.5' },
        { p: 'LDH Level', v: '150 U/L', r: '140-280' },
        { p: 'Performance Status', v: '100', r: '0-100' },
        { p: 'Symptoms', v: 'None', r: 'N/A' }
      ];
    } else if (riskLevel === 'high') {
      findings = [
        { p: 'Age', v: '75', r: 'N/A' },
        { p: 'Smoking History', v: 'Yes (1)', r: '0-1' },
        { p: 'Smoking Pack Years', v: '50', r: '< 5' },
        { p: 'Tumor Size', v: '55 mm', r: '< 10' },
        { p: 'Hemoglobin', v: '11.5 g/dL', r: '13.5-17.5' },
        { p: 'LDH Level', v: '600 U/L', r: '140-280' },
        { p: 'ECOG Status', v: '3', r: '0-5' },
        { p: 'Symptoms', v: 'Chest Pain, Shortness of Breath', r: 'N/A' },
        { p: 'Comorbidities', v: 'Hypertension, COPD', r: 'N/A' }
      ];
    } else {
      findings = [
        { p: 'Age', v: '55', r: 'N/A' },
        { p: 'Smoking History', v: 'Yes (1)', r: '0-1' },
        { p: 'Smoking Pack Years', v: '10', r: '< 5' },
        { p: 'Tumor Size', v: '20 mm', r: '< 10' },
        { p: 'Hemoglobin', v: '15.0 g/dL', r: '13.5-17.5' },
        { p: 'LDH Level', v: '180 U/L', r: '140-280' },
        { p: 'Performance Status', v: '90', r: '0-100' },
        { p: 'Symptoms', v: 'Cough', r: 'N/A' }
      ];
    }
    
    let currentY = startY + rowHeight;
    findings.forEach((item, index) => {
      if (index % 2 === 1) {
        doc.setFillColor(252, 253, 254);
        doc.rect(20, currentY - 7, pageWidth - 40, rowHeight, 'F');
      }
      doc.text(item.p, col1, currentY);
      doc.setFont('helvetica', 'bold');
      doc.text(item.v, col2, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(item.r, col3, currentY);
      currentY += rowHeight;
    });
    
    // Final Footer
    doc.setFontSize(8);
    doc.text(`REPORT GENERATED FOR TESTING - FILENAME: ${riskLevel}_risk_sample.pdf`, pageWidth / 2, 285, { align: 'center' });
    
    doc.save(`${riskLevel}_risk_sample.pdf`);
  }
}
