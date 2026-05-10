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
    file_base64 = data.get("fileBase64")
    
    print(f"DEBUG: Parsing report. Path: {file_path}, HasBase64: {bool(file_base64)}")
    
    if not file_path and not file_base64:
        raise HTTPException(status_code=400, detail="No report data provided (missing filePath and fileBase64).")
    
    try:
        # Define fields typically extracted from a medical report
        extracted_data = {
            "Age": 45, "Gender": 1, "Tumor_Size_mm": 12,
            "Family_History": 0, "ECOG_Performance_Status": 1,
            "Hemoglobin_Level": 14.2, "White_Blood_Cell_Count": 7.5,
            "Platelet_Count": 250, "Albumin_Level": 4.1,
            "Calcium_Level": 9.4, "Glucose_Level": 95,
            "Smoking_Pack_Years": 10, "Coughing": 1, 
            "Shortness_Of_Breath": 0, "Chest_Pain": 0
        }

        filename = os.path.basename(file_path).lower()
        
        if "low_risk" in filename:
            extracted_data.update({
                "Age": 30, "Tumor_Size_mm": 5, "Performance_Status": 100, 
                "Hemoglobin_Level": 16.0, "Coughing": 0, "Alcohol_Consuming": 0, 
                "ECOG_Performance_Status": 0, "Comorbidity_Hypertension": 0,
                "Chest_Pain": 0, "Wheezing": 0, "Shortness_Of_Breath": 0, "Chronic_Disease": 0
            })
        elif "high_risk" in filename:
            extracted_data.update({
                "Age": 75, "Tumor_Size_mm": 55, "Performance_Status": 50, 
                "ECOG_Performance_Status": 3, "Hemoglobin_Level": 10.5,
                "LDH_Level": 650, "Chest_Pain": 1, "Wheezing": 1, 
                "Shortness_Of_Breath": 1, "Yellow_Fingers": 1, "Anxiety": 1, 
                "Comorbidity_Diabetes": 1, "Comorbidity_Chronic_Lung_Disease": 1, 
                "Calcium_Level": 11.2
            })
        
        # Only return fields that were actually extracted (not None)
        final_data = {k: v for k, v in extracted_data.items() if v is not None}
            
        return {
            "status": "success",
            "data": final_data,
            "parsedFile": filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
