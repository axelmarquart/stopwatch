"""Einmalig lokal ausgeführtes Hilfsskript zur Erzeugung der PWA-App-Icons.

Kein Teil der Laufzeit-App und kein Build-Schritt fuer GitHub Pages -
das Skript wird von Hand ausgefuehrt (`python tools/generate_icons.py`)
und erzeugt icons/icon-192.png und icons/icon-512.png, die als fertige
statische Dateien committet werden.

Zeichnet ein einfaches flaches Stoppuhr-Symbol: Kreis-Ring, Krone/Knopf
oben und ein Zeiger, mit ca. 80% Safe-Area-Padding fuer maskable Icons.
"""

import os
from PIL import Image, ImageDraw

# Muss zu manifest.json / style.css theme_color passen.
BACKGROUND_COLOR = (79, 70, 229)   # Indigo
FOREGROUND_COLOR = (255, 255, 255)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ICONS_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "icons")


def draw_stopwatch_icon(size):
    img = Image.new("RGB", (size, size), BACKGROUND_COLOR)
    draw = ImageDraw.Draw(img)

    center = size / 2
    # 80% Safe-Area-Padding fuer maskable Icons (Android beschneidet den Rand).
    radius = size * 0.32
    stroke_width = max(2, round(size * 0.045))

    # Krone/Knopf oben auf der Stoppuhr.
    crown_width = size * 0.14
    crown_height = size * 0.07
    crown_top = center - radius - crown_height * 1.6
    draw.rounded_rectangle(
        [center - crown_width / 2, crown_top, center + crown_width / 2, crown_top + crown_height],
        radius=crown_height / 2,
        fill=FOREGROUND_COLOR,
    )

    # Aeusserer Ring des Ziffernblatts.
    draw.ellipse(
        [center - radius, center - radius, center + radius, center + radius],
        outline=FOREGROUND_COLOR,
        width=stroke_width,
    )

    # Zeiger (zeigt leicht nach rechts oben, wie bei einer laufenden Uhr).
    hand_length = radius * 0.65
    hand_end_x = center + hand_length * 0.7
    hand_end_y = center - hand_length * 0.7
    draw.line([center, center, hand_end_x, hand_end_y], fill=FOREGROUND_COLOR, width=stroke_width)

    # Mittelpunkt-Nabe.
    hub_radius = stroke_width * 0.9
    draw.ellipse(
        [center - hub_radius, center - hub_radius, center + hub_radius, center + hub_radius],
        fill=FOREGROUND_COLOR,
    )

    return img


def main():
    os.makedirs(ICONS_DIR, exist_ok=True)
    for size in (192, 512):
        icon = draw_stopwatch_icon(size)
        out_path = os.path.join(ICONS_DIR, f"icon-{size}.png")
        icon.save(out_path, "PNG")
        print(f"Geschrieben: {out_path}")


if __name__ == "__main__":
    main()
