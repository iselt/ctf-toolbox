#!/usr/bin/env python3
"""Generate the app icon set (icns / ico / pngs) for Tauri from a geometric design."""
import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICON_DIR = os.path.join(ROOT, "src-tauri", "icons")
PUBLIC = os.path.join(ROOT, "public")

BG = (10, 14, 20, 255)
GREEN = (74, 222, 128, 255)
GREEN_DIM = (34, 82, 53, 255)


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = size / 1024.0

    # background: full-bleed dark square with a subtle inner border
    d.rectangle([0, 0, size - 1, size - 1], fill=BG)
    border = max(2, round(18 * s))
    d.rectangle(
        [border, border, size - 1 - border, size - 1 - border],
        outline=GREEN_DIM,
        width=max(1, round(6 * s)),
    )

    # faint terminal scanline texture
    step = max(8, round(64 * s))
    for y in range(round(96 * s), size - round(96 * s), step):
        d.line([round(96 * s), y, size - round(96 * s), y], fill=(20, 27, 36, 90), width=max(1, round(2 * s)))

    # glyph: terminal chevron ">" + underscore "_"
    lw = max(4, round(96 * s))
    cx = round(430 * s)
    cy = round(512 * s)
    arm = round(175 * s)
    d.line([cx - arm, cy - arm, cx, cy], fill=GREEN, width=lw)
    d.line([cx - arm + round(lw * 0.9), cy - arm, cx + round(lw * 0.1), cy - round(lw * 0.05)], fill=GREEN, width=lw)
    d.line([cx, cy, cx - arm, cy + arm], fill=GREEN, width=lw)
    d.line([cx - arm + round(lw * 0.9), cy + arm, cx + round(lw * 0.1), cy + round(lw * 0.05)], fill=GREEN, width=lw)
    # underscore (offset right, thick)
    d.line([cx + round(80 * s), cy + arm, cx + round(330 * s), cy + arm], fill=GREEN, width=lw)
    d.line([cx + round(80 * s), cy + arm + round(lw * 0.5), cx + round(330 * s), cy + arm + round(lw * 0.5)], fill=GREEN, width=round(lw * 0.5))

    return img


def main() -> None:
    os.makedirs(ICON_DIR, exist_ok=True)
    big = draw_icon(1024)

    big.save(os.path.join(ICON_DIR, "icon.png"))
    big.save(os.path.join(ICON_DIR, "icon.icns"), format="ICNS")
    big.save(
        os.path.join(ICON_DIR, "icon.ico"),
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    for name, sz in [("32x32.png", 32), ("128x128.png", 128), ("128x128@2x.png", 256)]:
        big.resize((sz, sz), Image.LANCZOS).save(os.path.join(ICON_DIR, name))

    os.makedirs(PUBLIC, exist_ok=True)
    big.resize((512, 512), Image.LANCZOS).save(os.path.join(PUBLIC, "icon.png"))
    print("icons written to", ICON_DIR)


if __name__ == "__main__":
    main()
