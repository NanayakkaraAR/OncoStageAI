import { Request, Response } from 'express';

// Define the expected input from the frontend/patient
interface PredictionRequest {
  Age: number;
  Gender: number;
  Country: number;
  Smoking_History: number;
  Tumor_Size_mm: number;
  Mutation_Status: number;
  Treatment_Type: number;
  Survival_Months: number;
  Smoking_Pack_Years: number;
  Biomarker_Status: number;
  ECOG_Performance_Status: number;
  Hemoglobin_Level: number;
  White_Blood_Cell_Count: number;
  Platelet_Count: number;
  Calcium_Level: number;
  Albumin_Level: number;
  LDH_Level: number;
  Creatinine_Level: number;
  Glucose_Level: number;
  Cholesterol_Level: number;
  Bilirubin_Level: number;
  AST_Level: number;
  ALT_Level: number;
  Sodium_Level: number;
  Potassium_Level: number;
  Chloride_Level: number;
  Urea_Level: number;
  Uric_Acid_Level: number;
  Magnesium_Level: number;
  Phosphorus_Level: number;
  Iron_Level: number;
  Ferritin_Level: number;
  Transferrin_Level: number;
  CRP_Level: number;
  ESR_Level: number;
  Procalcitonin_Level: number;
  Vitamin_D_Level: number;
  Vitamin_B12_Level: number;
  Folate_Level: number;
  TSH_Level: number;
  Free_T3_Level: number;
  Free_T4_Level: number;
  Cortisol_Level: number;
  Insulin_Level: number;
  HbA1c_Level: number;
  Triglycerides_Level: number;
  HDL_Level: number;
  LDL_Level: number;
  Total_Protein_Level: number;
  Globulin_Level: number;
  Alkaline_Phosphatase_Level: number;
  GGT_Level: number;
}

export const predictLungCancerStage = async (req: Request, res: Response) => {
  try {
    const patientData: Partial<PredictionRequest> = req.body;

    // Send the data forward to the Python FastAPI ML service running on port 8000
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000/predict';
    
    const mlResponse = await fetch(mlServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });

    if (!mlResponse.ok) {
        throw new Error(`ML Service responded with status: ${mlResponse.status}`);
    }

    const result = await mlResponse.json();

    // Send the prediction back to the client
    res.json({
        success: true,
        data: result
    });

  } catch (error) {
    console.error('Prediction Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error while communicating with ML service',
    });
  }
};
