#!/usr/bin/env python3
"""
Generate PWA icons from SVG template
Requires: pip install Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow is required. Install with: pip install Pillow")
    exit(1)

def create_icon(size, filename):
    """Create an icon with 'PL' text on red background"""
    # Create image with red background
    img = Image.new('RGB', (size, size), color='#DC143C')
    draw = ImageDraw.Draw(img)

    # Try to use a font, fallback to default if not available
    try:
        # Try to use a bold font
        font_size = int(size * 0.4)
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("arialbd.ttf", font_size)
        except:
            # Fallback to default font
            font = ImageFont.load_default()

    # Draw white 'PL' text
    text = "PL"
    # Get text bounding box
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # Center the text
    x = (size - text_width) / 2
    y = (size - text_height) / 2

    draw.text((x, y), text, fill='white', font=font)
    img.save(filename)
    print(f"Created {filename} ({size}x{size})")

if __name__ == "__main__":
    # Generate all required icons
    create_icon(16, "favicon-16x16.png")
    create_icon(32, "favicon-32x32.png")
    create_icon(192, "icon-192.png")
    create_icon(512, "icon-512.png")

    print("\nIcons generated successfully!")
    print("Note: You may need to rename favicon files to .ico format")

