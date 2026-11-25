import os
import shutil
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from preprocessing import validate_image_file, preprocess_image_bytes
from prediction import predict_from_features, get_loaded_model

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
