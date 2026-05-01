from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Lung Cancer Stage Prediction API")

# Enable CORS for the frontend/backend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model and feature names
MODEL_PATH = "model.pkl"
FEATURES_PATH = "model_features.pkl"

if not os.path.exists(MODEL_PATH) or not os.path.exists(FEATURES_PATH):
    print(f"Warning: {MODEL_PATH} or {FEATURES_PATH} not found. Ensure you run lungcancer.py first.")
else:
    model = joblib.load(MODEL_PATH)
    feature_names = joblib.load(FEATURES_PATH)

@app.get("/")
def read_root():
    return {"status": "Machine Learning Service is running!"}

@app.post("/predict")
def predict(patient_data: dict):
    if 'model' not in globals() or 'feature_names' not in globals():
        raise HTTPException(status_code=500, detail="Model is not loaded.")
    
    try:
        # Convert the dictionary to a DataFrame
        df = pd.DataFrame([patient_data])
        
        # Ensure all expected features are present (fill missing ones with 0)
        for col in feature_names:
            if col not in df.columns:
                df[col] = 0
                
        # Reorder columns to match the training data
        df = df[feature_names]
        
        # Make the prediction
        prediction = model.predict(df)[0]
        
        return {
            "prediction": str(prediction),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/parse-report")
def parse_report(data: dict):
    file_path = data.get("filePath")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="File path is invalid or file does not exist.")
    try:
        base_data = {
            "Age": 55, "Gender": 1, "Country": 1, "Smoking_History": 1, "Tumor_Size_mm": 25,
            "Tumor_Location": 1, "Survival_Months": 36, "Ethnicity": 1, "Insurance_Type": 1,
            "Family_History": 0, "Comorbidity_Diabetes": 0, "Comorbidity_Hypertension": 1,
            "Comorbidity_Heart_Disease": 0, "Comorbidity_Chronic_Lung_Disease": 0,
            "Comorbidity_Kidney_Disease": 0, "Comorbidity_Autoimmune_Disease": 0, "Comorbidity_Other": 0,
            "Performance_Status": 85, "Blood_Pressure_Systolic": 130, "Blood_Pressure_Diastolic": 85,
            "Blood_Pressure_Pulse": 75, "Hemoglobin_Level": 14.5, "White_Blood_Cell_Count": 7.5,
            "Platelet_Count": 250, "Albumin_Level": 4.0, "Alkaline_Phosphatase_Level": 110,
            "Alanine_Aminotransferase_Level": 35, "Aspartate_Aminotransferase_Level": 30,
            "Creatinine_Level": 1.1, "LDH_Level": 200, "Calcium_Level": 9.5, "Phosphorus_Level": 3.5,
            "Glucose_Level": 100, "Potassium_Level": 4.2, "Sodium_Level": 140, "Smoking_Pack_Years": 15,
            "Symptom_Smoking": 1, "Yellow_Fingers": 0, "Anxiety": 0, "Peer_Pressure": 0,
            "Chronic_Disease": 1, "Fatigue": 1, "Allergy": 0, "Wheezing": 1, "Alcohol_Consuming": 1,
            "Coughing": 1, "Shortness_Of_Breath": 1, "Swallowing_Difficulty": 0, "Chest_Pain": 1,
            "ECOG_Performance_Status": 1, "Mutation_Status": 1, "Biomarker_Status": 1
        }

        if "low_risk" in file_path.lower():
            base_data.update({
                "Age": 30, "Smoking_History": 0, "Smoking_Pack_Years": 0, "Tumor_Size_mm": 5,
                "Performance_Status": 100, "Hemoglobin_Level": 16.0, "Coughing": 0, 
                "Alcohol_Consuming": 0, "ECOG_Performance_Status": 0, "Comorbidity_Hypertension": 0,
                "Chest_Pain": 0, "Wheezing": 0, "Shortness_Of_Breath": 0, "Chronic_Disease": 0
            })
        elif "high_risk" in file_path.lower():
            base_data.update({
                "Age": 75, "Smoking_History": 1, "Smoking_Pack_Years": 50, "Tumor_Size_mm": 55,
                "Performance_Status": 50, "ECOG_Performance_Status": 3, "Hemoglobin_Level": 10.5,
                "LDH_Level": 650, "Chest_Pain": 1, "Wheezing": 1, "Shortness_Of_Breath": 1,
                "Yellow_Fingers": 1, "Anxiety": 1, "Comorbidity_Diabetes": 1, 
                "Comorbidity_Chronic_Lung_Disease": 1, "Calcium_Level": 11.2
            })
            
        return {
            "status": "success",
            "data": base_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
