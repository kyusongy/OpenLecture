"""Process user-provided icon image into all Tauri icon sizes."""

from PIL import Image
import os

ICON_DIR = os.path.join(os.path.dirname(__file__), "..", "src-tauri", "icons")
SOURCE = os.path.join(os.path.dirname(__file__), "..", "icon_source.png")


def autocrop(img):
    """Remove white/near-white border around the image."""
    # Convert to RGBA if needed
    img = img.convert("RGBA")

    # Find bounding box of non-white pixels
    pixels = img.load()
    w, h = img.size

    def is_background(pixel):
        # Consider near-white and transparent as background
        if pixel[3] < 128:  # transparent
            return True
        return pixel[0] > 235 and pixel[1] > 235 and pixel[2] > 235

    top, bottom, left, right = h, 0, w, 0
    for y in range(h):
        for x in range(w):
            if not is_background(pixels[x, y]):
                top = min(top, y)
                bottom = max(bottom, y)
                left = min(left, x)
                right = max(right, x)

    # Add small padding (2%)
    pad = int(max(right - left, bottom - top) * 0.02)
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(w, right + pad)
    bottom = min(h, bottom + pad)

    cropped = img.crop((left, top, right + 1, bottom + 1))

    # Make it square by centering
    cw, ch = cropped.size
    side = max(cw, ch)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(cropped, ((side - cw) // 2, (side - ch) // 2))

    return square


def create_icns(icon_1024, path):
    import subprocess
    import tempfile

    iconset = os.path.join(tempfile.mkdtemp(), "icon.iconset")
    os.makedirs(iconset)

    sizes = [
        (16, "16x16", 1),
        (32, "16x16", 2),
        (32, "32x32", 1),
        (64, "32x32", 2),
        (128, "128x128", 1),
        (256, "128x128", 2),
        (256, "256x256", 1),
        (512, "256x256", 2),
        (512, "512x512", 1),
        (1024, "512x512", 2),
    ]

    for px, name, scale in sizes:
        resized = icon_1024.resize((px, px), Image.LANCZOS)
        suffix = "@2x" if scale == 2 else ""
        resized.save(os.path.join(iconset, f"icon_{name}{suffix}.png"))

    subprocess.run(["iconutil", "-c", "icns", iconset, "-o", path], check=True)


def create_ico(icon_1024, path):
    sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    imgs = [icon_1024.resize(s, Image.LANCZOS) for s in sizes]
    imgs[0].save(path, format="ICO", sizes=sizes)


def main():
    os.makedirs(ICON_DIR, exist_ok=True)

    img = Image.open(SOURCE).convert("RGBA")
    print(f"Source: {img.size[0]}x{img.size[1]}")

    # Make square if not already
    w, h = img.size
    if w != h:
        side = max(w, h)
        square = Image.new("RGBA", (side, side), (253, 243, 217, 255))
        square.paste(img, ((side - w) // 2, (side - h) // 2))
        img = square

    # Resize to 1024 as master
    icon_1024 = img.resize((1024, 1024), Image.LANCZOS)

    # Save PNG sizes Tauri needs
    for sz in [32, 128, 256]:
        name = f"{sz}x{sz}.png" if sz != 256 else "128x128@2x.png"
        resized = icon_1024.resize((sz, sz), Image.LANCZOS)
        resized.save(os.path.join(ICON_DIR, name))
        print(f"  -> {name}")

    icon_512 = icon_1024.resize((512, 512), Image.LANCZOS)
    icon_512.save(os.path.join(ICON_DIR, "icon.png"))
    print("  -> icon.png")

    create_icns(icon_1024, os.path.join(ICON_DIR, "icon.icns"))
    print("  -> icon.icns")

    create_ico(icon_1024, os.path.join(ICON_DIR, "icon.ico"))
    print("  -> icon.ico")

    print("Done!")


if __name__ == "__main__":
    main()
