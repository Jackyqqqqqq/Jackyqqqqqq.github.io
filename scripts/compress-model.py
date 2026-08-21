import json
import struct
from io import BytesIO
from pathlib import Path

from PIL import Image

SRC = Path("tmp/profile-character.source.glb")
DST = Path("public/models/profile-character.glb")
MAX_SIZE = 1024
QUALITY = {
    "baseColorTexture": 72,
    "normalTexture": 88,
    "metallicRoughnessTexture": 78,
    "default": 75,
}


def read_glb(path: Path):
    data = path.read_bytes()
    magic, version, length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF":
        raise SystemExit("not a glb")
    offset = 12
    json_bytes = bin_bytes = b""
    while offset < length:
        chunk_len, chunk_type = struct.unpack_from("<I4s", data, offset)
        offset += 8
        chunk = data[offset : offset + chunk_len]
        offset += chunk_len
        if chunk_type == b"JSON":
            json_bytes = chunk
        elif chunk_type == b"BIN\x00":
            bin_bytes = chunk
    return json.loads(json_bytes.decode("utf-8")), bin_bytes


def pad4(blob: bytes, fill: bytes) -> bytes:
    extra = (4 - (len(blob) % 4)) % 4
    return blob + fill * extra


def slot_for_image(gltf: dict, image_index: int) -> str:
    texture_ids = {
        i for i, tex in enumerate(gltf.get("textures", [])) if tex.get("source") == image_index
    }
    for material in gltf.get("materials", []):
        pbr = material.get("pbrMetallicRoughness", {})
        if pbr.get("baseColorTexture", {}).get("index") in texture_ids:
            return "baseColorTexture"
        if pbr.get("metallicRoughnessTexture", {}).get("index") in texture_ids:
            return "metallicRoughnessTexture"
        if material.get("normalTexture", {}).get("index") in texture_ids:
            return "normalTexture"
    return "default"


def compress_image(raw: bytes, slot: str) -> tuple[bytes, str]:
    image = Image.open(BytesIO(raw))
    image.thumbnail((MAX_SIZE, MAX_SIZE), Image.Resampling.LANCZOS)
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    out = BytesIO()
    image.save(out, format="WEBP", quality=QUALITY.get(slot, QUALITY["default"]), method=6)
    return out.getvalue(), "image/webp"


def main():
    gltf, bin_blob = read_glb(SRC)
    views = gltf.get("bufferViews", [])
    images = gltf.get("images", [])
    used_by_image = {}
    for index, image in enumerate(images):
        if "bufferView" in image:
            used_by_image[image["bufferView"]] = index

    parts: list[bytes] = []
    cursor = 0
    for view_index, view in enumerate(views):
        start = view.get("byteOffset", 0)
        length = view["byteLength"]
        chunk = bin_blob[start : start + length]
        if view_index in used_by_image:
            slot = slot_for_image(gltf, used_by_image[view_index])
            chunk, mime = compress_image(chunk, slot)
            images[used_by_image[view_index]]["mimeType"] = mime
        padding = (4 - (len(chunk) % 4)) % 4
        view["byteOffset"] = cursor
        view["byteLength"] = len(chunk)
        view["buffer"] = 0
        parts.append(chunk + b"\x00" * padding)
        cursor += len(chunk) + padding

    new_bin = b"".join(parts)
    gltf["buffers"] = [{"byteLength": len(new_bin)}]
    json_bytes = pad4(json.dumps(gltf, separators=(",", ":")).encode("utf-8"), b" ")
    new_bin = pad4(new_bin, b"\x00")
    header = struct.pack("<4sII", b"glTF", 2, 12 + 8 + len(json_bytes) + 8 + len(new_bin))
    json_chunk = struct.pack("<I4s", len(json_bytes), b"JSON") + json_bytes
    bin_chunk = struct.pack("<I4s", len(new_bin), b"BIN\x00") + new_bin
    DST.write_bytes(header + json_chunk + bin_chunk)
    print(f"{SRC.stat().st_size} -> {DST.stat().st_size} bytes")


if __name__ == "__main__":
    main()

