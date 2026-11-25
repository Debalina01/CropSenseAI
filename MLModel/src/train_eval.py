import os
import json
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TRAIN_DIR = os.path.join(ROOT, "MLModel", "datasets", "train")
TEST_DIR = os.path.join(ROOT, "MLModel", "datasets", "test")
MODEL_DIR = os.path.join(ROOT, "MLModel", "trained_models")
EVAL_DIR = os.path.join(ROOT, "MLModel", "evaluation")

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(EVAL_DIR, exist_ok=True)

class_names = sorted(os.listdir(TRAIN_DIR))
with open(os.path.join(MODEL_DIR, "class_names.json"), "w", encoding="utf-8") as f:
    json.dump(class_names, f, indent=2)

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

X_train = []
y_train = []
for idx, c in enumerate(class_names):
    c_dir = os.path.join(TRAIN_DIR, c)
    for f in os.listdir(c_dir):
        fp = os.path.join(c_dir, f)
        X_train.append(extract_features(fp))
        y_train.append(idx)

X_train = np.array(X_train, dtype=np.float32)
y_train = np.array(y_train, dtype=np.int64)

mu = np.mean(X_train, axis=0)
sigma = np.std(X_train, axis=0) + 1e-7
X_train_norm = (X_train - mu) / sigma

num_classes = len(class_names)
num_features = X_train.shape[1]
hidden_dim = 128

np.random.seed(42)
W1 = np.random.randn(num_features, hidden_dim).astype(np.float32) * np.sqrt(2.0 / num_features)
b1 = np.zeros(hidden_dim, dtype=np.float32)
W2 = np.random.randn(hidden_dim, num_classes).astype(np.float32) * np.sqrt(2.0 / hidden_dim)
b2 = np.zeros(num_classes, dtype=np.float32)

lr = 0.02
batch_size = 32
epochs = 70
n_samples = len(X_train)

for epoch in range(epochs):
    indices = np.random.permutation(n_samples)
    X_shuffled = X_train_norm[indices]
    y_shuffled = y_train[indices]
    for i in range(0, n_samples, batch_size):
        xb = X_shuffled[i:i+batch_size]
        yb = y_shuffled[i:i+batch_size]
        m = len(xb)
        z1 = np.dot(xb, W1) + b1
        a1 = np.maximum(0, z1)
        z2 = np.dot(a1, W2) + b2
        exp_z2 = np.exp(z2 - np.max(z2, axis=1, keepdims=True))
        probs = exp_z2 / np.sum(exp_z2, axis=1, keepdims=True)
        dz2 = probs.copy()
        dz2[np.arange(m), yb] -= 1.0
        dz2 /= m
        dW2 = np.dot(a1.T, dz2)
        db2 = np.sum(dz2, axis=0)
        da1 = np.dot(dz2, W2.T)
        dz1 = da1 * (z1 > 0)
        dW1 = np.dot(xb.T, dz1)
        db1 = np.sum(dz1, axis=0)
        W1 -= lr * dW1
        b1 -= lr * db1
        W2 -= lr * dW2
        b2 -= lr * db2

X_test = []
y_test = []
for idx, c in enumerate(class_names):
    c_dir = os.path.join(TEST_DIR, c)
    for f in os.listdir(c_dir):
        fp = os.path.join(c_dir, f)
        X_test.append(extract_features(fp))
        y_test.append(idx)

X_test = np.array(X_test, dtype=np.float32)
y_test = np.array(y_test, dtype=np.int64)
X_test_norm = (X_test - mu) / sigma

z1 = np.dot(X_test_norm, W1) + b1
a1 = np.maximum(0, z1)
z2 = np.dot(a1, W2) + b2
exp_z2 = np.exp(z2 - np.max(z2, axis=1, keepdims=True))
test_probs = exp_z2 / np.sum(exp_z2, axis=1, keepdims=True)
y_pred = np.argmax(test_probs, axis=1)

accuracy = float(np.mean(y_pred == y_test))

conf_matrix = np.zeros((num_classes, num_classes), dtype=int)
for t, p in zip(y_test, y_pred):
    conf_matrix[t, p] += 1

report = {}
for i, c in enumerate(class_names):
    tp = conf_matrix[i, i]
    fp = np.sum(conf_matrix[:, i]) - tp
    fn = np.sum(conf_matrix[i, :]) - tp
    prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0
    report[c] = {
        "precision": round(float(prec), 3),
        "recall": round(float(rec), 3),
        "f1-score": round(float(f1), 3),
        "support": int(np.sum(conf_matrix[i, :]))
    }

metrics = {
    "test_accuracy": round(accuracy, 4),
    "total_test_samples": len(y_test),
    "classification_report": report
}

with open(os.path.join(EVAL_DIR, "classification_report.json"), "w", encoding="utf-8") as f:
    json.dump(metrics, f, indent=2)

with open(os.path.join(EVAL_DIR, "confusion_matrix.json"), "w", encoding="utf-8") as f:
    json.dump({"classes": class_names, "matrix": conf_matrix.tolist()}, f, indent=2)

model_weights_path = os.path.join(MODEL_DIR, "cropsense_model_weights.npz")
np.savez_compressed(
    model_weights_path,
    W1=W1, b1=b1, W2=W2, b2=b2, mu=mu, sigma=sigma
)
print("TRAINING_AND_EVALUATION_SUCCESSFUL")
print(f"Accuracy: {accuracy}")
