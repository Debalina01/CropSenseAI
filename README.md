# CropSense AI — Crop Disease Detection
<img width="1633" height="897" alt="project" src="https://github.com/user-attachments/assets/7fdb02c4-98db-4e4c-b136-16905204767d" />
CropSense AI is a mobile-responsive web application for classifying crop-leaf images. The frontend lets users upload or select a sample image, sends it to a FastAPI backend, and displays the predicted crop, disease class, confidence, and related guidance in a React diagnostic dashboard.

> **Important:** The current model classifies disease categories but does not measure disease severity or lesion area. Results are informational and should not replace expert agricultural advice.

## Project structure

```text
Crop Disease Severity Detection/
├── frontend/
│   ├── assets/                 # Page imagery and sample leaf images
│   ├── css/style.css
│   ├── js/script.js
│   ├── dashboard/src/          # React prediction dashboard (Tailwind CSS, Lucide React)
│   ├── package.json
│   └── index.html
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── prediction.py           # Loads model and returns predictions
│   ├── preprocessing.py        # Validates and extracts image features
│   ├── requirements.txt
│   └── uploads/                # Uploaded images saved by the API
└── MLModel/
    ├── datasets/               # Dataset folders for training and evaluation
    ├── evaluation/             # Reports and confusion matrix
    ├── src/
    │   ├── plot_matrix.py
    │   ├── predict.py
    │   └── train_eval.py
    └── trained_models/         # Model weights and class names
```

The current model uses image color statistics, color histograms, and a small neural network implemented with NumPy. It is not a MobileNetV2 model. The checked-in model currently covers 15 classes across tomato, potato, and bell pepper.

## Run locally

You need Python and Node.js installed. The backend serves the frontend as well, so you only need one terminal and one server.

### Install dependencies and run the app

From the project root, run these commands in PowerShell:

```powershell
cd frontend
npm ci
npm run build
cd ..\backend
if (-not (Test-Path ..\.env)) { Copy-Item ..\.env.example ..\.env }
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python main.py
```

If PowerShell prevents the virtual environment from activating, allow scripts for this terminal session and activate it again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

The app and API are available at `http://127.0.0.1:8000`; interactive API documentation is at `http://127.0.0.1:8000/docs`. Keep the terminal open while using the app. Press `Ctrl+C` to stop the server.

The root `.env` file sets `BACKEND_HOST`, `BACKEND_PORT`, and `BACKEND_RELOAD`. The local settings use `127.0.0.1`, port `8000`, and reload enabled; without a `.env` file, the backend defaults to `127.0.0.1:8000` with reload disabled. Restart the server after changing settings.

## Deploy on Render

The included `render.yaml` configures a Render web service. Push the project to a GitHub repository, then in Render choose **New → Blueprint**, connect the repository, and deploy the detected `cropsense-ai` service. Render installs the backend dependencies, builds the React dashboard, starts the app, and checks `/health`. Open the URL Render provides when deployment finishes.

The deployed service binds to `0.0.0.0` and uses Render's `PORT` environment variable. The local `.env` is intentionally ignored by Git; configure deployment values through the hosting provider's environment settings instead.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Reports whether the API and model are available |
| `GET` | `/classes` | Lists supported disease classes |
| `POST` | `/predict` | Predicts from an uploaded image in the `file` form field |

`/predict` accepts JPG, JPEG, PNG, or WEBP images up to 10 MB.

## Train and evaluate

Training requires class subfolders containing images under both `MLModel/datasets/train/` and `MLModel/datasets/test/`. The matching class-folder names should be the same in each directory. The existing dataset is organized by disease class.

With the backend virtual environment activated, run from the project root:

```powershell
python MLModel\src\train_eval.py
```

This writes updated weights and class names to `MLModel/trained_models/`, along with evaluation reports in `MLModel/evaluation/`. To regenerate the confusion-matrix image after evaluation:

```powershell
python MLModel\src\plot_matrix.py
```

To run a prediction from the command line:

```powershell
python MLModel\src\predict.py path\to\leaf_image.jpg
```

## Notes

- The API loads the model from `MLModel/trained_models/` when it starts. Ensure the model weights and `class_names.json` are present.
- Model confidence is not the same as real-world accuracy. Validate performance with representative field images before relying on predictions.
- Treatment and prevention text is general guidance; consult a qualified local agricultural specialist for diagnosis and treatment decisions.
