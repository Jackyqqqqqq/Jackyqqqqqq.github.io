"""Prepare a white-background portrait for deterministic local TripoSR use."""

from collections import deque
from pathlib import Path
import sys

import numpy as np
from PIL import Image


def remove_edge_background(image: Image.Image) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA")).copy()
    rgb = rgba[:, :, :3]
    near_white = (rgb.min(axis=2) > 238) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 18)
    height, width = near_white.shape
    visited = np.zeros((height, width), dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        queue.append((0, x))
        queue.append((height - 1, x))
    for y in range(height):
        queue.append((y, 0))
        queue.append((y, width - 1))

    while queue:
        y, x = queue.popleft()
        if y < 0 or y >= height or x < 0 or x >= width:
            continue
        if visited[y, x] or not near_white[y, x]:
            continue
        visited[y, x] = True
        queue.extend(((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)))

    rgba[visited, 3] = 0
    return Image.fromarray(rgba, "RGBA")


def prepare(source: Path, destination: Path, size: int = 512) -> None:
    cutout = remove_edge_background(Image.open(source))
    alpha = np.asarray(cutout.getchannel("A"))
    ys, xs = np.nonzero(alpha > 0)
    if not len(xs):
        raise ValueError("No foreground was detected in the source image.")

    cropped = cutout.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    target = int(size * 0.84)
    scale = min(target / cropped.width, target / cropped.height)
    resized = cropped.resize(
        (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", (size, size), (127, 127, 127, 255))
    offset = ((size - resized.width) // 2, (size - resized.height) // 2)
    canvas.alpha_composite(resized, offset)
    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(destination, quality=95)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: prepare_triposr_input.py SOURCE DESTINATION")
    prepare(Path(sys.argv[1]), Path(sys.argv[2]))
