import os
import json
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EVAL_DIR = os.path.join(ROOT, "MLModel", "evaluation")

with open(os.path.join(EVAL_DIR, "confusion_matrix.json"), "r", encoding="utf-8") as f:
    data = json.load(f)

classes = data["classes"]
matrix = np.array(data["matrix"])
n = len(classes)

cell_size = 36
margin_left = 220
margin_top = 40
margin_bottom = 220
margin_right = 40

width = margin_left + n * cell_size + margin_right
height = margin_top + n * cell_size + margin_bottom

img = Image.new("RGB", (width, height), (255, 255, 255))
draw = ImageDraw.Draw(img)

max_val = max(1, np.max(matrix))

for i in range(n):
    for j in range(n):
        val = matrix[i, j]
        intensity = int(255 * (1.0 - (val / max_val)))
        r = intensity
        g = 200 + int(55 * (1.0 - (val / max_val)))
        b = intensity
        x0 = margin_left + j * cell_size
        y0 = margin_top + i * cell_size
        x1 = x0 + cell_size
        y1 = y0 + cell_size
        draw.rectangle([x0, y0, x1, y1], fill=(r, g, b), outline=(220, 220, 220))
        if val > 0:
            draw.text((x0 + 10, y0 + 10), str(val), fill=(20, 20, 20))

draw.text((margin_left, 10), "Predicted Class ->", fill=(40, 40, 40))
draw.text((10, margin_top - 20), "Actual Class v", fill=(40, 40, 40))

for i, c in enumerate(classes):
    y = margin_top + i * cell_size + 10
    draw.text((10, y), c, fill=(30, 30, 30))
    x = margin_left + i * cell_size + 4
    draw.text((x, margin_top + n * cell_size + 10 + (i % 3) * 16), c[:14], fill=(30, 30, 30))

img.save(os.path.join(EVAL_DIR, "confusion_matrix.png"))
print("Saved confusion_matrix.png")
