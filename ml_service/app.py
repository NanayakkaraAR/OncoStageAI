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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
