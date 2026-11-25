import os
import json
import numpy as np

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
MODEL_PATH = os.path.join(PROJECT_ROOT, "MLModel", "trained_models", "cropsense_model_weights.npz")
CLASS_PATH = os.path.join(PROJECT_ROOT, "MLModel", "trained_models", "class_names.json")

CACHED_WEIGHTS = None
CACHED_CLASSES = None

DISEASE_METADATA = {
    "Early Blight": {
        "botanical": "Solanum lycopersicum",
        "description": "Early Blight produces concentric brown ring spots on mature leaves, leading to yellowing chlorosis and premature defoliation.",
        "treatment": "Prune infected lower foliage immediately and apply approved copper-based or Mancozeb protective fungicides during dry morning conditions.",
        "prevention": "Ensure good spacing between plants, avoid overhead watering, and practice 3-year crop rotation away from solanaceous plants."
    },
    "Late Blight": {
        "botanical": "Solanum tuberosum",
        "description": "Late Blight is an aggressive water mold infection causing rapidly expanding dark water-soaked lesions and white fungal sporulation.",
        "treatment": "Apply targeted systemic fungicides containing Chlorothalonil or Metalaxyl immediately and safely destroy heavily infected leaves off-field.",
        "prevention": "Plant certified resistant seed tubers, maintain wide canopy spacing for air circulation, and avoid overhead sprinkling during humid mornings."
    },
    "Bacterial Spot": {
        "botanical": "Capsicum annuum / Solanum lycopersicum",
        "description": "Bacterial Spot causes small water-soaked circular lesions that turn dark brown with chlorotic yellow halos, causing premature leaf drop.",
        "treatment": "Apply copper bactericide combined with Mancozeb at the very first sight of spotting and avoid touching wet leaves.",
        "prevention": "Use certified disease-free seeds, avoid furrow splashing, and rotate fields away from nightshade crops for at least two years."
    },
    "Leaf Mold": {
        "botanical": "Solanum lycopersicum",
        "description": "Leaf Mold causes pale yellow spots on upper foliage and olive-green to brown velvety fungal growth on leaf undersides under high humidity.",
        "treatment": "Improve greenhouse and field ventilation, prune lower leaves to increase airflow, and apply protective sulfur or copper fungicides.",
        "prevention": "Maintain relative humidity below 85 percent and use drip irrigation to keep plant leaves completely dry."
    },
    "Septoria Leaf Spot": {
        "botanical": "Solanum lycopersicum",
        "description": "Septoria causes numerous small circular spots with dark brown margins and gray centers containing tiny black pycnidia fungal fruiting bodies.",
        "treatment": "Remove lower infected foliage and spray copper fungicides or chlorothalonil weekly during wet spells.",
        "prevention": "Apply organic mulch around plant bases to prevent soil-splash and eliminate solanaceous weed hosts."
    },
    "Spider Mites": {
        "botanical": "Solanum lycopersicum",
        "description": "Spider mite feeding produces fine yellow stippling and webbing on leaf undersides, leading to bronzing, drying, and defoliation.",
        "treatment": "Spray insecticidal soap, neem oil, or selective miticides on leaf undersides and introduce predatory beneficial mites.",
        "prevention": "Keep plants well-watered to prevent drought stress and regularly hose down dust in surrounding field rows."
    },
    "Target Spot": {
        "botanical": "Solanum lycopersicum",
        "description": "Target Spot manifests as brown circular lesions with distinct concentric rings on leaves and stems, resulting in severe canopy thinning.",
        "treatment": "Apply registered broad-spectrum fungicides such as azoxystrobin and remove crop residues after harvest.",
        "prevention": "Ensure adequate plant spacing, maintain weed-free crop rows, and rotate away from susceptible host crops."
    },
    "Yellow Leaf Curl Virus": {
        "botanical": "Solanum lycopersicum",
        "description": "Transmitted by whiteflies, this viral disease causes severe upward leaf cupping, stunted bushy growth, and severe blossom drop.",
        "treatment": "There is no cure for viral plant infections. Remove and destroy infected plants immediately and manage whitefly populations.",
        "prevention": "Use fine insect-exclusion netting in nurseries, install yellow sticky traps, and plant TYLCV-resistant crop hybrids."
    },
    "Mosaic Virus": {
        "botanical": "Solanum lycopersicum",
        "description": "Mosaic Virus causes mottled light and dark green patterns on leaves, distortion, blistering, and reduced plant vigor.",
        "treatment": "Discard and burn infected plants off-field. Wash hands and disinfect pruning tools with a 10 percent milk or bleach solution.",
        "prevention": "Avoid handling plants after using tobacco products and purchase certified virus-free seed stock."
    },
    "Healthy": {
        "botanical": "Vigorous Plant Canopy",
        "description": "Foliage exhibits uniform chlorophyll density, vigorous vein morphology, and zero visible necrotic or chlorotic lesions.",
        "treatment": "No curative fungicides required. Maintain balanced soil fertility, steady moisture, and routine agronomic scouting.",
        "prevention": "Continue standard field management, regular 7-day visual scouting, and balanced drip or furrow irrigation."
    }
}

def get_loaded_model():
    global CACHED_WEIGHTS, CACHED_CLASSES
    if CACHED_WEIGHTS is None or CACHED_CLASSES is None:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(CLASS_PATH):
            raise FileNotFoundError("Model weights or class_names.json not found in MLModel/trained_models")
        CACHED_WEIGHTS = np.load(MODEL_PATH)
        with open(CLASS_PATH, "r", encoding="utf-8") as f:
            CACHED_CLASSES = json.load(f)
    return CACHED_WEIGHTS, CACHED_CLASSES

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

def lookup_metadata(disease_name, crop_name):
    if "healthy" in disease_name.lower():
        return DISEASE_METADATA["Healthy"]
    for key, meta in DISEASE_METADATA.items():
        if key.lower() in disease_name.lower():
            return meta
    return {
        "botanical": f"{crop_name} foliage",
        "description": f"Symptom patterns identify {disease_name} affecting {crop_name} leaves.",
        "treatment": "Consult local agronomy extension officers for recommended local fungicide and bactericide sprays.",
        "prevention": "Maintain clean field sanitation, prune lower leaves, and practice crop rotation."
    }

def predict_from_features(features):
    weights, class_names = get_loaded_model()
    x_norm = (features - weights["mu"]) / weights["sigma"]
    z1 = np.dot(x_norm, weights["W1"]) + weights["b1"]
    a1 = np.maximum(0, z1)
    z2 = np.dot(a1, weights["W2"]) + weights["b2"]
    exp_z = np.exp(z2 - np.max(z2))
    probs = exp_z / np.sum(exp_z)
    best_idx = int(np.argmax(probs))
    confidence = float(probs[best_idx])
    raw_class = class_names[best_idx]
    crop, disease, status = parse_class_name(raw_class)
    metadata = lookup_metadata(disease, crop)
    top_indices = np.argsort(probs)[::-1][:3]
    top_predictions = []
    for idx in top_indices:
        c_crop, c_dis, _ = parse_class_name(class_names[idx])
        top_predictions.append({
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
        "botanical": metadata["botanical"],
        "description": metadata["description"],
        "treatment": metadata["treatment"],
        "prevention": metadata["prevention"],
        "top_predictions": top_predictions
    }
