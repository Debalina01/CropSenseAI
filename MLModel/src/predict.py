import os
import sys
import json
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(ROOT, "MLModel", "trained_models", "cropsense_model_weights.npz")
CLASS_PATH = os.path.join(ROOT, "MLModel", "trained_models", "class_names.json")

def load_model_and_classes():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(CLASS_PATH):
        raise FileNotFoundError("Model weights or class_names.json not found in MLModel/trained_models")
    weights = np.load(MODEL_PATH)
    with open(CLASS_PATH, "r", encoding="utf-8") as f:
        class_names = json.load(f)
    return weights, class_names

def extract_features(img_path):
    img = Image.open(img_path).convert("RGB").resize((64, 64), Image.Resampling.BILINEAR)
    arr = np.array(img, dtype=np.float32) / 255.0
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    mean_rgb = [float(np.mean(r)), float(np.mean(g)), float(np.mean(b))]
    std_rgb = [float(np.std(r)), float(np.std(g)), float(np.std(b))]
    hsv = img.convert("HSV")
    hsv_arr = np.array(hsv, dtype=np.float32) / 255.0
    mean_hsv = [float(np.mean(hsv_arr[:, :, 0])), float(np.mean(hsv_arr[:, :, 1])), float(np.mean(hsv_arr[:, :, 2]))]
    std_hsv = [float(np.std(hsv_arr[:, :, 0])), float(np.std(hsv_arr[:, :, 1])), float(np.std(hsv_arr[:, :, 2]))]
    hist_r, _ = np.histogram(r, bins=16, range=(0, 1), density=True)
    hist_g, _ = np.histogram(g, bins=16, range=(0, 1), density=True)
    hist_b, _ = np.histogram(b, bins=16, range=(0, 1), density=True)
    hist_h, _ = np.histogram(hsv_arr[:, :, 0], bins=16, range=(0, 1), density=True)
    thumb = img.resize((16, 16), Image.Resampling.BILINEAR)
    thumb_flat = (np.array(thumb, dtype=np.float32) / 255.0).flatten()
    return np.concatenate([
        mean_rgb, std_rgb, mean_hsv, std_hsv,
        hist_r, hist_g, hist_b, hist_h,
        thumb_flat
    ])

def parse_class_name(raw_name):
    clean = raw_name.replace("___", "_").replace("__", "_")
    parts = clean.split("_")
    crop = parts[0]
    if crop.lower() == "pepper":
        crop = "Bell Pepper"
        disease_parts = parts[2:] if len(parts) > 2 else parts[1:]
    else:
        disease_parts = parts[1:]
    disease_text = " ".join(disease_parts).strip()
    if "healthy" in disease_text.lower():
        disease_name = "None (Healthy Foliage)"
        status = "Healthy"
    else:
        disease_name = disease_text.title()
        status = "Infected"
    return crop, disease_name, status

def predict_single_image(image_path):
    if not os.path.exists(image_path):
        return {"success": False, "error": f"Image file not found: {image_path}"}
    try:
        weights, class_names = load_model_and_classes()
        feat = extract_features(image_path)
        x_norm = (feat - weights["mu"]) / weights["sigma"]
        z1 = np.dot(x_norm, weights["W1"]) + weights["b1"]
        a1 = np.maximum(0, z1)
        z2 = np.dot(a1, weights["W2"]) + weights["b2"]
        exp_z = np.exp(z2 - np.max(z2))
        probs = exp_z / np.sum(exp_z)
        best_idx = int(np.argmax(probs))
        confidence = float(probs[best_idx])
        raw_class = class_names[best_idx]
        crop, disease, status = parse_class_name(raw_class)
        top_indices = np.argsort(probs)[::-1][:3]
        top_preds = []
        for idx in top_indices:
            c_crop, c_dis, _ = parse_class_name(class_names[idx])
            top_preds.append({
                "class_name": class_names[idx],
                "crop": c_crop,
                "disease": c_dis,
                "confidence": round(float(probs[idx]), 4)
            })
        return {
            "success": True,
            "crop": crop,
            "disease": disease,
            "status": status,
            "confidence": round(confidence, 4),
            "raw_class": raw_class,
            "top_predictions": top_preds
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    if len(sys.argv) < 2:
        print("Usage: python predict.py <path_to_leaf_image>")
        sys.exit(1)
    img_path = sys.argv[1]
    res = predict_single_image(img_path)
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    main()
