# CropSense AI — Crop Disease Detection
<img width="1633" height="897" alt="project" src="https://github.com/user-attachments/assets/7fdb02c4-98db-4e4c-b136-16905204767d" />
CropSense AI is a mobile-responsive web application for classifying crop-leaf images. The frontend lets users upload or select a sample image, sends it to a FastAPI backend, and displays the predicted crop, disease class, confidence, and related guidance in a React diagnostic dashboard.

Important: The current model classifies disease categories but does not measure disease severity or lesion area. Results are informational and should not replace expert agricultural advice.

🚀 Live Application

Click here to use CropSense AI

🛠️ Technology Stack

Frontend: React, JavaScript, HTML, CSS, Tailwind CSS

Backend: Python, FastAPI

Machine Learning: NumPy, Neural Network

Image Processing: Color Statistics, Color Histograms

Deployment: Render

Version Control: Git & GitHub

📁 Project Structure

Crop Disease Severity Detection/
├── frontend/
│   ├── assets/
│   ├── css/style.css
│   ├── js/script.js
│   ├── dashboard/src/
│   ├── package.json
│   └── index.html
├── backend/
│   ├── main.py
│   ├── prediction.py
│   ├── preprocessing.py
│   ├── requirements.txt
│   └── uploads/
└── MLModel/
    ├── datasets/
    ├── evaluation/
    ├── src/
    │   ├── plot_matrix.py
    │   ├── predict.py
    │   └── train_eval.py
    └── trained_models/

✨ Key Features

Upload crop-leaf images.

Select sample leaf images.

Predict crop and disease categories.

Display prediction confidence.

Provide general disease guidance.

Mobile-responsive diagnostic dashboard.

REST API integration using FastAPI.

🧠 Machine Learning Model

The current model uses:

Image color statistics.

Color histograms.

A small neural network implemented using NumPy.

The checked-in model currently supports 15 classes across:

Tomato

Potato

Bell Pepper

Note: This is not a MobileNetV2 model and does not currently calculate disease severity.

💻 Run Locally

Requirements: Python and Node.js.

1. Build the frontend

cd frontend
npm ci
npm run build

2. Set up the backend

cd ..\backend

if (-not (Test-Path ..\.env)) {
    Copy-Item ..\.env.example ..\.env
}

py -m venv .venv
.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
pip install -r requirements.txt

3. Start the application

python main.py

Open:

Application: http://127.0.0.1:8000

API Documentation: http://127.0.0.1:8000/docs

☁️ Deployment

The application is deployed using Render.

Live URL: https://cropsense-ai-wyh2.onrender.com/

The included render.yaml configures the Render web service to install dependencies, build the React dashboard, start the FastAPI backend, and check the /health endpoint.

🔗 API Endpoints

Method

Endpoint

Purpose

GET

/health

Checks API and model availability

GET

/classes

Lists supported disease classes

POST

/predict

Predicts disease from an uploaded image

Supported formats: JPG, JPEG, PNG, WEBP.

Maximum upload size: 10 MB.

📊 Train and Evaluate

Training requires class-specific image folders under:

MLModel/datasets/train/
MLModel/datasets/test/

Run training from the project root:

python MLModel\src\train_eval.py

Generate the confusion matrix:

python MLModel\src\plot_matrix.py

Run a prediction:

python MLModel\src\predict.py path\to\leaf_image.jpg

⚠️ Limitations

The model classifies disease categories but does not measure disease severity.

Prediction confidence does not represent real-world accuracy.

Model performance should be validated using representative field images.

Treatment recommendations are general guidance, not professional agricultural diagnoses.

👩‍💻 Project Purpose

CropSense AI aims to make crop disease identification more accessible through machine learning and web technology, helping users identify possible crop diseases from leaf images.

Developed with ❤️ using React, FastAPI, P
