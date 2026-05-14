FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for some python packages
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Train the model and generate model.pkl and model_features.pkl
RUN python lungcancer.py

EXPOSE 8000

CMD ["python", "app.py"]
