from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

assets = Path(__file__).resolve().parents[1] / 'public' / 'assets'
source = Image.open(assets / 'cloak.png').convert('RGB')
pixels = np.asarray(source).astype(np.float32)
r, g, b = pixels[..., 0], pixels[..., 1], pixels[..., 2]
green = (g > r * 1.08) & (g > b * 1.04) & (g < 165)
height, width = green.shape
mask = np.zeros((height, width), dtype=np.uint8)
for y in range(height):
    xs = np.flatnonzero(green[y])
    if len(xs) > 8:
        left, right = int(np.quantile(xs, .01)), int(np.quantile(xs, .99))
        mask[y, max(0, left - 6):min(width, right + 7)] = 255
alpha = Image.fromarray(mask).filter(ImageFilter.GaussianBlur(4))
cutout = source.convert('RGBA')
cutout.putalpha(alpha)
cutout.save(assets / 'cloak-cutout.png')
