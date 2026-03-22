import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';

// ── GET /api/protected/doctors ──────────────────────────────────────────────
export const getDoctors = async (req: AuthRequest, res: Response) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR', isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: { firstName: 'asc' },
    });
    res.json({ success: true, data: doctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch doctors' });
  }
};

// ── POST /api/protected/predict ─────────────────────────────────────────────
export const submitPrediction = async (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.user!.id;
    const { doctorId, ...featureData } = req.body;

    if (!doctorId) {
      return res.status(400).json({ success: false, error: 'doctorId is required' });
    }

    // Forward features to ML service
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000/predict';
    const mlResponse = await fetch(mlServiceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(featureData),
    });

    if (!mlResponse.ok) {
      throw new Error(`ML Service responded with status: ${mlResponse.status}`);
    }

    const mlResult: { prediction: string; status: string } = await mlResponse.json() as any;

    // Persist the prediction
    const prediction = await prisma.prediction.create({
      data: {
        patientId,
        doctorId: Number(doctorId),
        result: mlResult.prediction,
        Age: featureData.Age ?? 0,
        Gender: featureData.Gender ?? 0,
        Country: featureData.Country ?? 0,
        Smoking_History: featureData.Smoking_History ?? 0,
        Tumor_Size_mm: featureData.Tumor_Size_mm ?? 0,
        Mutation_Status: featureData.Mutation_Status ?? 0,
        Treatment_Type: featureData.Treatment_Type ?? 0,
        Survival_Months: featureData.Survival_Months ?? 0,
        Smoking_Pack_Years: featureData.Smoking_Pack_Years ?? 0,
        Biomarker_Status: featureData.Biomarker_Status ?? 0,
        ECOG_Performance_Status: featureData.ECOG_Performance_Status ?? 0,
        Hemoglobin_Level: featureData.Hemoglobin_Level ?? 0,
        White_Blood_Cell_Count: featureData.White_Blood_Cell_Count ?? 0,
        Platelet_Count: featureData.Platelet_Count ?? 0,
        Calcium_Level: featureData.Calcium_Level ?? 0,
        Albumin_Level: featureData.Albumin_Level ?? 0,
        LDH_Level: featureData.LDH_Level ?? 0,
        Creatinine_Level: featureData.Creatinine_Level ?? 0,
        Glucose_Level: featureData.Glucose_Level ?? 0,
        Cholesterol_Level: featureData.Cholesterol_Level ?? 0,
        Bilirubin_Level: featureData.Bilirubin_Level ?? 0,
        AST_Level: featureData.AST_Level ?? 0,
        ALT_Level: featureData.ALT_Level ?? 0,
        Sodium_Level: featureData.Sodium_Level ?? 0,
        Potassium_Level: featureData.Potassium_Level ?? 0,
        Chloride_Level: featureData.Chloride_Level ?? 0,
        Urea_Level: featureData.Urea_Level ?? 0,
        Uric_Acid_Level: featureData.Uric_Acid_Level ?? 0,
        Magnesium_Level: featureData.Magnesium_Level ?? 0,
        Phosphorus_Level: featureData.Phosphorus_Level ?? 0,
        Iron_Level: featureData.Iron_Level ?? 0,
        Ferritin_Level: featureData.Ferritin_Level ?? 0,
        Transferrin_Level: featureData.Transferrin_Level ?? 0,
        CRP_Level: featureData.CRP_Level ?? 0,
        ESR_Level: featureData.ESR_Level ?? 0,
        Procalcitonin_Level: featureData.Procalcitonin_Level ?? 0,
        Vitamin_D_Level: featureData.Vitamin_D_Level ?? 0,
        Vitamin_B12_Level: featureData.Vitamin_B12_Level ?? 0,
        Folate_Level: featureData.Folate_Level ?? 0,
        TSH_Level: featureData.TSH_Level ?? 0,
        Free_T3_Level: featureData.Free_T3_Level ?? 0,
        Free_T4_Level: featureData.Free_T4_Level ?? 0,
        Cortisol_Level: featureData.Cortisol_Level ?? 0,
        Insulin_Level: featureData.Insulin_Level ?? 0,
        HbA1c_Level: featureData.HbA1c_Level ?? 0,
        Triglycerides_Level: featureData.Triglycerides_Level ?? 0,
        HDL_Level: featureData.HDL_Level ?? 0,
        LDL_Level: featureData.LDL_Level ?? 0,
        Total_Protein_Level: featureData.Total_Protein_Level ?? 0,
        Globulin_Level: featureData.Globulin_Level ?? 0,
        Alkaline_Phosphatase_Level: featureData.Alkaline_Phosphatase_Level ?? 0,
        GGT_Level: featureData.GGT_Level ?? 0,
      },
    });

    res.json({ success: true, data: { prediction: mlResult.prediction, predictionId: prediction.id } });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

// ── GET /api/protected/doctor/predictions ───────────────────────────────────
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
