import os
import shutil
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from preprocessing import validate_image_file, preprocess_image_bytes
from prediction import predict_from_features, get_loaded_model

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BACKEND_DIR)
FRONTEND_DIR = os.path.join(PROJECT_DIR, "frontend")
load_dotenv(os.path.join(PROJECT_DIR, ".env"))

BACKEND_HOST = os.getenv("BACKEND_HOST", "127.0.0.1")
try:
    BACKEND_PORT = int(os.getenv("PORT", os.getenv("BACKEND_PORT", "8000")))
except ValueError as error:
    raise ValueError("BACKEND_PORT must be an integer between 1 and 65535") from error
if not 1 <= BACKEND_PORT <= 65535:
    raise ValueError("BACKEND_PORT must be an integer between 1 and 65535")
BACKEND_RELOAD = os.getenv("BACKEND_RELOAD", "false").strip().lower() in {
    "1", "true", "yes", "on"
}

UPLOADS_DIR = os.path.join(BACKEND_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

app = FastAPI(
    title="CropSense AI API",
    description="Real-time crop disease diagnosis and severity prediction backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    get_loaded_model()

@app.get("/health")
def health_check():
    try:
        get_loaded_model()
        model_loaded = True
    except Exception:
        model_loaded = False
    return {
        "status": "ok",
        "message": "CropSense AI backend is running",
        "model_loaded": model_loaded
    }

@app.get("/classes")
def get_supported_classes():
    try:
        _, class_names = get_loaded_model()
        return {
            "success": True,
            "total_classes": len(class_names),
            "supported_crops": ["Tomato", "Potato", "Bell Pepper"],
            "classes": class_names
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to load class metadata: {str(e)}"
        )

@app.post("/predict")
async def predict_crop_disease(file: UploadFile = File(...)):
    filename = file.filename or "uploaded_leaf.jpg"
    contents = await file.read()
    
    is_valid, error_message = validate_image_file(filename, contents, max_size_mb=10)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    try:
        features = preprocess_image_bytes(contents)
        result = predict_from_features(features)
        
        safe_name = os.path.basename(filename).replace(" ", "_")
        saved_path = os.path.join(UPLOADS_DIR, safe_name)
        with open(saved_path, "wb") as f:
            f.write(contents)
            
        result["filename"] = safe_name
        return JSONResponse(status_code=status.HTTP_200_OK, content=result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=BACKEND_HOST,
        port=BACKEND_PORT,
        reload=BACKEND_RELOAD,
    )
