from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "outputs" / "images" / "tin-hoc-tre-em-example-v2.png"
LOGO = ROOT / "assets" / "brand" / "logo-primary.png"

W, H = 1200, 1200
BLUE = "#3155A4"
LIGHT_BLUE = "#EAF7FF"
SKY = "#5EB9F0"
NAVY = "#26364F"
ORANGE = "#F9A51A"
CTA = "#0077C8"
MUTED = "#60697B"
WHITE = "#FFFFFF"


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(f"C:/Windows/Fonts/{name}", size)


FONT_BLACK = font("arialbd.ttf", 72)
FONT_TITLE = font("arialbd.ttf", 92)
FONT_SUB = font("arialbd.ttf", 42)
FONT_BODY = font("arial.ttf", 30)
FONT_BODY_BOLD = font("arialbd.ttf", 31)
FONT_SMALL = font("arial.ttf", 25)
FONT_SMALL_BOLD = font("arialbd.ttf", 25)


def rounded(draw, xy, r, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)


def center_text(draw, y, text, fnt, fill, max_width=None):
    bbox = draw.textbbox((0, 0), text, font=fnt)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    draw.text((x, y), text, font=fnt, fill=fill)


def paste_logo(img):
    logo = Image.open(LOGO).convert("RGBA")
    logo.thumbnail((120, 132), Image.Resampling.LANCZOS)
    # Put the official mark on a white badge so it remains crisp.
    badge = Image.new("RGBA", (156, 156), (255, 255, 255, 0))
    d = ImageDraw.Draw(badge)
    d.rounded_rectangle((0, 0, 156, 156), radius=30, fill=WHITE)
    badge.alpha_composite(logo, ((156 - logo.width) // 2, (156 - logo.height) // 2))
    img.alpha_composite(badge, (58, 50))


def draw_children_scene(draw):
    # Main illustration panel.
    rounded(draw, (84, 438, 1116, 766), 44, "#FFFFFF", "#BFE9FF", 3)

    # Screen and desk.
    rounded(draw, (413, 500, 790, 682), 26, NAVY)
    rounded(draw, (438, 526, 765, 646), 12, "#EAF7FF")
    draw.rectangle((560, 682, 646, 712), fill=NAVY)
    rounded(draw, (363, 708, 840, 735), 14, ORANGE)

    # Simple UI cards on screen.
    rounded(draw, (462, 548, 568, 619), 10, "#FFFFFF")
    rounded(draw, (588, 548, 742, 575), 8, SKY)
    rounded(draw, (588, 590, 710, 614), 8, ORANGE)

    # Two friendly learner icons.
    for cx, shirt in [(295, "#5EB9F0"), (905, "#FAB758")]:
        draw.ellipse((cx - 46, 522, cx + 46, 614), fill="#FFD8B8")
        draw.arc((cx - 50, 505, cx + 50, 575), 180, 360, fill=NAVY, width=12)
        rounded(draw, (cx - 70, 617, cx + 70, 720), 36, shirt)
        draw.ellipse((cx - 20, 558, cx - 10, 568), fill=NAVY)
        draw.ellipse((cx + 10, 558, cx + 20, 568), fill=NAVY)
        draw.arc((cx - 20, 570, cx + 20, 596), 0, 180, fill=NAVY, width=3)

    # Floating icons.
    for x, y, label, color in [
        (165, 466, "ABC", ORANGE),
        (830, 456, "PPT", SKY),
        (950, 657, "PC", CTA),
        (252, 676, "W", CTA),
    ]:
        rounded(draw, (x, y, x + 98, y + 62), 16, color)
        bbox = draw.textbbox((0, 0), label, font=FONT_SMALL_BOLD)
        draw.text((x + (98 - bbox[2]) / 2, y + (62 - bbox[3]) / 2 - 2), label, font=FONT_SMALL_BOLD, fill=WHITE)


def main():
    img = Image.new("RGBA", (W, H), "#F0F8FE")
    draw = ImageDraw.Draw(img)

    # Background accents.
    draw.ellipse((-160, -140, 420, 420), fill="#D7F0FF")
    draw.ellipse((850, -70, 1320, 400), fill="#FFF0CC")
    draw.polygon([(0, 930), (1200, 760), (1200, 1200), (0, 1200)], fill="#E5F4FD")

    paste_logo(img)

    draw.text((238, 62), "TRUNG TÂM TIN HỌC", font=FONT_BODY_BOLD, fill=BLUE)
    draw.text((238, 99), "SAO VIỆT BIÊN HÒA", font=font("arialbd.ttf", 48), fill=NAVY)
    rounded(draw, (880, 62, 1135, 122), 30, ORANGE)
    draw.text((918, 78), "CHO TRẺ EM", font=FONT_SMALL_BOLD, fill=NAVY)

    center_text(draw, 210, "TIN HỌC TRẺ EM", FONT_TITLE, NAVY)
    center_text(draw, 320, "Học vui - Hiểu dễ - Thực hành ngay", FONT_SUB, BLUE)

    draw_children_scene(draw)

    # Benefit badges.
    benefits = [
        ("Làm quen máy tính", 108),
        ("Word, PowerPoint", 418),
        ("Tư duy công nghệ", 760),
    ]
    for text, x in benefits:
        rounded(draw, (x, 814, x + 330, 882), 34, WHITE, "#BFE9FF", 2)
        draw.ellipse((x + 22, 836, x + 52, 866), fill=ORANGE)
        draw.text((x + 68, 834), text, font=FONT_SMALL_BOLD, fill=NAVY)

    # Contact footer.
    rounded(draw, (84, 940, 1116, 1124), 38, BLUE)
    draw.text((128, 977), "Hotline: 093 11 44 858", font=font("arialbd.ttf", 46), fill=WHITE)
    draw.text(
        (128, 1044),
        "Địa chỉ: 91 Đoàn Văn Cự, Tam Hiệp, Thành phố Đồng Nai",
        font=FONT_BODY,
        fill=WHITE,
    )
    rounded(draw, (845, 970, 1068, 1032), 31, ORANGE)
    draw.text((892, 986), "TƯ VẤN LỚP", font=FONT_SMALL_BOLD, fill=NAVY)

    img.convert("RGB").save(OUT, quality=95)
    print(OUT)


if __name__ == "__main__":
    main()
