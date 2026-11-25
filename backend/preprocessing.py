import io
import numpy as np
from PIL import Image

def validate_image_file(filename, file_bytes, max_size_mb=10):
    if len(file_bytes) == 0:
        return False, "Uploaded file is empty"
    if len(file_bytes) > max_size_mb * 1024 * 1024:
        return False, f"File size exceeds maximum allowed limit of {max_size_mb} MB"
    valid_extensions = (".jpg", ".jpeg", ".png", ".webp")
    lower_name = filename.lower()
    if not any(lower_name.endswith(ext) for ext in valid_extensions):
        return False, "Unsupported file format. Please upload JPG, JPEG, PNG, or WEBP images"
    try:
        with Image.open(io.BytesIO(file_bytes)) as img:
            img.verify()
        return True, ""
    except Exception:
        return False, "File is not a valid or readable image"

def preprocess_image_bytes(file_bytes):
    with Image.open(io.BytesIO(file_bytes)) as raw_img:
        img = raw_img.convert("RGB").resize((64, 64), Image.Resampling.BILINEAR)
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
        features = np.concatenate([
            mean_rgb, std_rgb, mean_hsv, std_hsv,
            hist_r, hist_g, hist_b, hist_h,
            thumb_flat
        ])
        return features
