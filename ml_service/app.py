from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import os
import re
import base64
import io
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

        print(f"[Predict] Received {len(patient_data)} features")
        print(f"[Predict] Expected {len(feature_names)} features")
        print(f"[Predict] Incoming features: {list(patient_data.keys())}")
        print(f"[Predict] Expected features: {feature_names[:10]}... (showing first 10)")

        # Ensure all expected features are present (fill missing ones with 0)
        for col in feature_names:
            if col not in df.columns:
                df[col] = 0

        # Reorder columns to match the training data
        df = df[feature_names]

        print(f"[Predict] DataFrame shape: {df.shape}")
        print(f"[Predict] DataFrame dtypes: {df.dtypes.unique()}")

        # Make the prediction
        prediction = model.predict(df)[0]

        print(f"[Predict] Prediction successful: {prediction}")

        return {
            "prediction": str(prediction),
            "status": "success"
        }
    except Exception as e:
        print(f"[Predict] Error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract text from PDF bytes using pdfplumber (handles digital PDFs well)."""
    text = ""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"[ParseReport] pdfplumber failed: {e}")

    # If pdfplumber got nothing, fall back to OCR via pdf2image + pytesseract
    if not text.strip():
        try:
            import pytesseract
            from pdf2image import convert_from_bytes
            images = convert_from_bytes(pdf_bytes, dpi=200)
            for img in images:
                text += pytesseract.image_to_string(img) + "\n"
            print(f"[ParseReport] Used OCR fallback, extracted {len(text)} chars")
        except Exception as e:
            print(f"[ParseReport] OCR fallback failed: {e}")

    return text


def extract_text_from_image_bytes(image_bytes: bytes) -> str:
    """Extract text from image bytes using pytesseract."""
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes))
        return pytesseract.image_to_string(img)
    except Exception as e:
        print(f"[ParseReport] Image OCR failed: {e}")
        return ""


def parse_numeric(text: str, patterns: list) -> float | None:
    """Try each regex pattern and return the first numeric match."""
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            try:
                return float(m.group(1))
            except (ValueError, IndexError):
                pass
    return None


def parse_binary(text: str, positive_patterns: list, negative_patterns: list) -> int | None:
    """
    Return 1 if any positive_pattern matches, 0 if any negative_pattern matches.
    Return None if no clear signal is found.
    """
    # Check for explicit Yes / 1 / Positive
    for pattern in positive_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return 1
    # Check for explicit No / 0 / Negative
    for pattern in negative_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return 0
    return None


def parse_medical_fields(text: str) -> dict:
    """
    Parse recognised medical fields from extracted document text.
    Only returns fields that were actually found – never fills missing ones with defaults.
    """
    extracted = {}

    # ── Age ──────────────────────────────────────────────────────────────────
    age = parse_numeric(text, [
        r'(?:age|patient\s+age)\s*[:\-]?\s*(\d{1,3})\b',
        r'\b(\d{1,3})\s*(?:years?|yrs?)\s*(?:old|of\s+age)',
        r'Age\s*\((?:years?)?\)\s*[:\-]?\s*(\d{1,3})',
    ])
    if age is not None and 1 <= age <= 120:
        extracted["Age"] = int(age)

    # ── Gender ───────────────────────────────────────────────────────────────
    gender_m = re.search(r'\b(?:gender|sex)\s*[:\-]?\s*(male|female|m|f)\b', text, re.IGNORECASE)
    if gender_m:
        val = gender_m.group(1).lower()
        extracted["Gender"] = 1 if val in ('male', 'm') else 0

    # ── Tumor Size ───────────────────────────────────────────────────────────
    tumor_size = parse_numeric(text, [
        r'(?:tumor|tumour|lesion|nodule|mass)\s+(?:size|diameter|dimension)\s*[:\-]?\s*([\d.]+)\s*mm',
        r'(?:tumor|tumour|lesion|nodule|mass)\s*[:\-]?\s*([\d.]+)\s*mm',
        r'Tumor\s+Size\s*[:\-]?\s*([\d.]+)',
        r'Size\s*[:\-]?\s*([\d.]+)\s*mm',
    ])
    if tumor_size is not None:
        extracted["Tumor_Size_mm"] = round(tumor_size, 1)

    # ── Smoking Pack Years ───────────────────────────────────────────────────
    pack_years = parse_numeric(text, [
        r'(?:smoking\s+)?pack[\s\-]?years?\s*[:\-]?\s*([\d.]+)',
        r'(?:pack[\s\-]?year|py)\s*[:\-]?\s*([\d.]+)',
        r'Smoking\s+Pack\s+Years\s*[:\-]?\s*([\d.]+)',
    ])
    if pack_years is not None:
        extracted["Smoking_Pack_Years"] = round(pack_years, 1)

    # ── ECOG Performance Status ──────────────────────────────────────────────
    ecog = parse_numeric(text, [
        r'(?:ECOG|ecog)\s+(?:performance\s+)?(?:status|score|ps)\s*[:\-]?\s*([0-4])',
        r'Performance\s+Status\s*[:\-]?\s*([0-4])',
        r'PS\s*[:\-]?\s*([0-4])\b',
    ])
    if ecog is not None and 0 <= ecog <= 4:
        extracted["ECOG_Performance_Status"] = int(ecog)

    # ── Blood / Lab Values ───────────────────────────────────────────────────
    lab_fields = [
        ("Hemoglobin_Level",                [r"hemoglobin\s*[:\-]?\s*([\d.]+)", r"hgb\s*[:\-]?\s*([\d.]+)", r"hb\s*[:\-]?\s*([\d.]+)"]),
        ("White_Blood_Cell_Count",          [r"white\s+blood\s+cell\s*[:\-]?\s*([\d.]+)", r"\bwbc\b\s*[:\-]?\s*([\d.]+)"]),
        ("Platelet_Count",                  [r"platelet(?:s)?\s*[:\-]?\s*([\d.]+)", r"\bplt\b\s*[:\-]?\s*([\d.]+)"]),
        ("Albumin_Level",                   [r"albumin\s*[:\-]?\s*([\d.]+)"]),
        ("LDH_Level",                       [r"ldh\s*[:\-]?\s*([\d.]+)", r"lactate\s+dehydrogenase\s*[:\-]?\s*([\d.]+)"]),
        ("Calcium_Level",                   [r"calcium\s*[:\-]?\s*([\d.]+)", r"\bca\b\s*[:\-]?\s*([\d.]+)"]),
        ("Creatinine_Level",                [r"creatinine\s*[:\-]?\s*([\d.]+)"]),
        ("Glucose_Level",                   [r"glucose\s*[:\-]?\s*([\d.]+)", r"blood\s+sugar\s*[:\-]?\s*([\d.]+)"]),
        ("Potassium_Level",                 [r"potassium\s*[:\-]?\s*([\d.]+)", r"\bk\+?\b\s*[:\-]?\s*([\d.]+)"]),
        ("Sodium_Level",                    [r"sodium\s*[:\-]?\s*([\d.]+)", r"\bna\+?\b\s*[:\-]?\s*([\d.]+)"]),
        ("Phosphorus_Level",                [r"phosphorus\s*[:\-]?\s*([\d.]+)", r"phosphate\s*[:\-]?\s*([\d.]+)"]),
        ("Alkaline_Phosphatase_Level",      [r"alkaline\s+phosphatase\s*[:\-]?\s*([\d.]+)", r"\balp\b\s*[:\-]?\s*([\d.]+)"]),
        ("Alanine_Aminotransferase_Level",  [r"alanine\s+aminotransferase\s*[:\-]?\s*([\d.]+)", r"\balt\b\s*[:\-]?\s*([\d.]+)"]),
        ("Aspartate_Aminotransferase_Level",[r"aspartate\s+aminotransferase\s*[:\-]?\s*([\d.]+)", r"\bast\b\s*[:\-]?\s*([\d.]+)"]),
    ]

    for field_name, patterns in lab_fields:
        val = parse_numeric(text, patterns)
        if val is not None:
            extracted[field_name] = round(val, 2)

    # ── Binary Symptom / Risk Fields ─────────────────────────────────────────
    binary_fields = [
        ("Symptom_Smoking", [
            r'(?:smoking|smoker|smokes?)\s*[:\-]?\s*(?:yes|positive|1\b|current|active)',
            r'(?:current|active)\s+smoker',
        ], [
            r'(?:smoking|smoker)\s*[:\-]?\s*(?:no|negative|0\b|never|non[\s\-]?smoker)',
            r'\bnon[\s\-]?smoker\b',
            r'never\s+smoked',
            r'Smoking\s+History\s*[:\-]?\s*No',
        ]),
        ("Yellow_Fingers", [
            r'yellow\s+fingers?\s*[:\-]?\s*(?:yes|positive|1\b)',
            r'yellow\s+(?:discolouration|staining)\s+of\s+fingers?',
        ], [
            r'yellow\s+fingers?\s*[:\-]?\s*(?:no|negative|0\b)',
        ]),
        ("Anxiety", [
            r'anxiety\s*[:\-]?\s*(?:yes|positive|1\b|present)',
        ], [
            r'anxiety\s*[:\-]?\s*(?:no|negative|0\b|absent|none)',
        ]),
        ("Peer_Pressure", [
            r'peer\s+pressure\s*[:\-]?\s*(?:yes|positive|1\b)',
        ], [
            r'peer\s+pressure\s*[:\-]?\s*(?:no|negative|0\b)',
        ]),
        ("Chronic_Disease", [
            r'chronic\s+(?:disease|condition|illness)\s*[:\-]?\s*(?:yes|positive|1\b|present)',
            r'(?:comorbidity|comorbidities).*(?:present|yes)',
        ], [
            r'chronic\s+(?:disease|condition|illness)\s*[:\-]?\s*(?:no|negative|0\b|absent|none)',
        ]),
        ("Fatigue", [
            r'fatigue\s*[:\-]?\s*(?:yes|positive|1\b|present)',
        ], [
            r'fatigue\s*[:\-]?\s*(?:no|negative|0\b|absent|none)',
        ]),
        ("Allergy", [
            r'allerg(?:y|ies)\s*[:\-]?\s*(?:yes|positive|1\b|present)',
        ], [
            r'allerg(?:y|ies)\s*[:\-]?\s*(?:no|negative|0\b|absent|nkda|none)',
            r'\bnkda\b',
        ]),
        ("Wheezing", [
            r'wheez(?:ing)?\s*[:\-]?\s*(?:yes|positive|1\b|present)',
        ], [
            r'wheez(?:ing)?\s*[:\-]?\s*(?:no|negative|0\b|absent|none)',
        ]),
        ("Coughing", [
            r'cough(?:ing)?\s*[:\-]?\s*(?:yes|positive|1\b|present)',
            r'productive\s+cough',
            r'chronic\s+cough',
        ], [
            r'cough(?:ing)?\s*[:\-]?\s*(?:no|negative|0\b|absent|none)',
        ]),
        ("Shortness_Of_Breath", [
            r'shortness\s+of\s+breath\s*[:\-]?\s*(?:yes|positive|1\b|present)',
            r'dyspnoea\s*[:\-]?\s*(?:yes|positive|1\b|present)',
            r'sob\s*[:\-]?\s*(?:yes|positive|1\b|present)',
        ], [
            r'shortness\s+of\s+breath\s*[:\-]?\s*(?:no|negative|0\b|absent|none)',
            r'dyspnoea\s*[:\-]?\s*(?:no|negative|0\b|absent|none)',
        ]),
        ("Swallowing_Difficulty", [
            r'swallowing\s+difficulty\s*[:\-]?\s*(?:yes|positive|1\b|present)',
            r'dysphagia\s*[:\-]?\s*(?:yes|positive|1\b|present)',
        ], [
            r'swallowing\s+difficulty\s*[:\-]?\s*(?:no|negative|0\b|absent|none)',
            r'dysphagia\s*[:\-]?\s*(?:no|negative|0\b|absent|none)',
        ]),
        ("Chest_Pain", [
            r'chest\s+pain\s*[:\-]?\s*(?:yes|positive|1\b|present)',
        ], [
            r'chest\s+pain\s*[:\-]?\s*(?:no|negative|0\b|absent|none)',
        ]),
        ("Family_History", [
            r'family\s+history\s*(?:of\s+(?:cancer|lung\s+cancer))?\s*[:\-]?\s*(?:yes|positive|1\b|present)',
        ], [
            r'family\s+history\s*(?:of\s+(?:cancer|lung\s+cancer))?\s*[:\-]?\s*(?:no|negative|0\b|none|absent)',
        ]),
        ("Alcohol_Consuming", [
            r'alcohol\s*(?:consumption|consuming|use)?\s*[:\-]?\s*(?:yes|positive|1\b|present|current|regular)',
        ], [
            r'alcohol\s*(?:consumption|consuming|use)?\s*[:\-]?\s*(?:no|negative|0\b|none|non[\s\-]?drinker|abstain)',
        ]),
    ]

    for field_name, pos_patterns, neg_patterns in binary_fields:
        val = parse_binary(text, pos_patterns, neg_patterns)
        if val is not None:
            extracted[field_name] = val

    return extracted


@app.post("/parse-report")
def parse_report(data: dict):
    file_path = data.get("filePath")
    file_base64 = data.get("fileBase64")
    file_name = data.get("fileName", "")

    print(f"DEBUG: Parsing report. Path: {file_path}, FileName: {file_name}, HasBase64: {bool(file_base64)}")

    if not file_path and not file_base64:
        raise HTTPException(status_code=400, detail="No report data provided (missing filePath and fileBase64).")

    # ── 1. Obtain raw bytes ──────────────────────────────────────────────────
    raw_bytes: bytes | None = None

    if file_base64:
        try:
            raw_bytes = base64.b64decode(file_base64)
            print(f"[ParseReport] Decoded base64: {len(raw_bytes)} bytes")
        except Exception as e:
            print(f"[ParseReport] Base64 decode failed: {e}")

    if raw_bytes is None and file_path:
        try:
            with open(file_path, "rb") as f:
                raw_bytes = f.read()
            print(f"[ParseReport] Read file from disk: {len(raw_bytes)} bytes")
        except Exception as e:
            print(f"[ParseReport] Could not read file: {e}")

    if raw_bytes is None:
        raise HTTPException(status_code=400, detail="Could not obtain file content from filePath or fileBase64.")

    # ── 2. Extract text ──────────────────────────────────────────────────────
    lower_name = file_name.lower()
    is_pdf = lower_name.endswith(".pdf") or raw_bytes[:4] == b"%PDF"
    is_image = any(lower_name.endswith(ext) for ext in (".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".gif"))

    text = ""
    if is_pdf:
        text = extract_text_from_pdf_bytes(raw_bytes)
    elif is_image:
        text = extract_text_from_image_bytes(raw_bytes)
    else:
        # Unknown type – try PDF first, then image OCR
        text = extract_text_from_pdf_bytes(raw_bytes)
        if not text.strip():
            text = extract_text_from_image_bytes(raw_bytes)

    print(f"[ParseReport] Extracted {len(text)} characters of text")
    if text:
        preview = text[:300].replace("\n", " ")
        print(f"[ParseReport] Text preview: {preview}")

    # ── 3. Parse medical fields from text ────────────────────────────────────
    extracted_data = parse_medical_fields(text)

    print(f"[ParseReport] Extracted {len(extracted_data)} medical fields: {list(extracted_data.keys())}")

    return {
        "status": "success",
        "data": extracted_data,
        "parsedFile": os.path.basename(file_name or file_path or ""),
        "extractedText": text[:500] if text else "",   # included for debugging; frontend ignores it
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
