"""
AKBai Logo Generator v7 — Consistent Proportions

Sources:
- new-logo-source.png (light, stacked with wordmark)
- logo-transparent.png (transparent bg mark)
- Marks extracted from previously generated files for dark/honey color variants

All marks are resized to EXACTLY the same pixel size before compositing,
ensuring consistent proportions across every variant.
"""

from PIL import Image, ImageFilter
import numpy as np
from collections import deque

OUT = 'c:/Users/Anton del Rosario/akbai/brand/Logo Files/'

CREAM = (253, 249, 242)
DARK = (7, 16, 30)
HONEY = (245, 158, 11)


def extract_floodfill(img, body_threshold=40):
    """Extract mark via flood-fill, returning tight-cropped RGBA."""
    arr = np.array(img).astype(float)
    corners = [arr[5, 5, :3], arr[5, -5, :3], arr[-5, 5, :3], arr[-5, -5, :3]]
    bg = np.mean(corners, axis=0)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    dist = np.sqrt((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2)
    body = dist > body_threshold
    h, w = body.shape
    vis = np.zeros((h, w), dtype=bool)
    ext = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        for ye in [0, h - 1]:
            if not body[ye, x] and not vis[ye, x]:
                q.append((ye, x)); vis[ye, x] = True; ext[ye, x] = True
    for y in range(h):
        for xe in [0, w - 1]:
            if not body[y, xe] and not vis[y, xe]:
                q.append((y, xe)); vis[y, xe] = True; ext[y, xe] = True
    while q:
        cy, cx = q.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not vis[ny, nx] and not body[ny, nx]:
                vis[ny, nx] = True; ext[ny, nx] = True; q.append((ny, nx))
    alpha = (~ext).astype(np.uint8) * 255
    alpha_img = Image.fromarray(alpha, 'L').filter(ImageFilter.GaussianBlur(1.5))
    result = np.array(img).copy()
    result[:, :, 3] = np.array(alpha_img)
    out = Image.fromarray(result, 'RGBA')
    bbox = out.getbbox()
    return out.crop(bbox) if bbox else out


def extract_wordmark(src):
    """Extract wordmark from light source."""
    region = src.crop((260, 725, 870, 840))
    arr = np.array(region).astype(float)
    bg = np.array([253.5, 248.5, 242.5])
    dist = np.sqrt(np.sum((arr[:, :, :3] - bg) ** 2, axis=2))
    alpha = np.clip((dist - 35) / 25, 0, 1) * 255
    alpha_img = Image.fromarray(alpha.astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(0.5))
    result = np.array(region).copy()
    result[:, :, 3] = np.array(alpha_img)
    rf = result.astype(float)
    a = rf[:, :, 3] / 255.0
    for c in range(3):
        rf[:, :, c] = np.where(a > 0.05,
            np.clip((rf[:, :, c] - bg[c] * (1 - a)) / np.maximum(a, 0.05), 0, 255), 0)
    out = Image.fromarray(np.clip(rf, 0, 255).astype(np.uint8), 'RGBA')
    bbox = out.getbbox()
    return out.crop(bbox) if bbox else out


def make_exact_size(mark, target_px):
    """
    Resize mark so its LARGEST dimension = target_px exactly.
    Returns the resized mark (not on a canvas).
    """
    w, h = mark.size
    scale = target_px / max(w, h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    return mark.resize((new_w, new_h), Image.LANCZOS)


def center_on(canvas_size, *items_with_offsets):
    """Generic centering helper."""
    pass


def wm_for_dark(wm):
    arr = np.array(wm).astype(float)
    result = arr.copy()
    for y in range(arr.shape[0]):
        for x in range(arr.shape[1]):
            if arr[y, x, 3] < 20: continue
            r, g, b = arr[y, x, :3]
            sat = max(r, g, b) - min(r, g, b)
            if sat > 50 and r > g: continue
            else: result[y, x, :3] = [230, 226, 219]
    return Image.fromarray(result.astype(np.uint8), 'RGBA')


def wm_white(wm):
    arr = np.array(wm)
    result = arr.copy()
    mask = arr[:, :, 3] > 10
    result[mask, 0] = 255
    result[mask, 1] = 255
    result[mask, 2] = 255
    return Image.fromarray(result, 'RGBA')


def honey_gradient(size):
    w, h = size
    arr = np.zeros((h, w, 4), dtype=np.uint8)
    for y in range(h):
        t = y / h
        arr[y, :, 0] = int(250 - t * 30)
        arr[y, :, 1] = int(178 - t * 40)
        arr[y, :, 2] = int(45 - t * 20)
        arr[y, :, 3] = 255
    return Image.fromarray(arr, 'RGBA')


def paste_centered(canvas, element):
    cw, ch = canvas.size
    ew, eh = element.size
    canvas.paste(element, ((cw - ew) // 2, (ch - eh) // 2), element)
    return canvas


# =============================================
# COMPOSITING FUNCTIONS
# =============================================

def gen_mark(name, mark_sized, canvas_size, bg):
    """Mark centered on background."""
    if isinstance(bg, tuple):
        c = Image.new('RGBA', canvas_size, bg + (255,))
    else:
        c = bg.resize(canvas_size, Image.LANCZOS)
    paste_centered(c, mark_sized)
    c.convert('RGB').save(OUT + name)
    print(f"  {name}")


def gen_horizontal(name, mark_sized, wm_sized, canvas_size, bg):
    """Horizontal: mark + gap + wordmark, centered."""
    if isinstance(bg, tuple):
        c = Image.new('RGBA', canvas_size, bg + (255,))
    else:
        c = bg.resize(canvas_size, Image.LANCZOS)

    gap = int(canvas_size[1] * 0.07)
    tw = mark_sized.size[0] + gap + wm_sized.size[0]
    sx = (canvas_size[0] - tw) // 2
    my = (canvas_size[1] - mark_sized.size[1]) // 2
    wy = (canvas_size[1] - wm_sized.size[1]) // 2

    c.paste(mark_sized, (sx, my), mark_sized)
    c.paste(wm_sized, (sx + mark_sized.size[0] + gap, wy), wm_sized)
    c.convert('RGB').save(OUT + name)
    print(f"  {name}")


def gen_stacked(name, mark_sized, wm_sized, canvas_size, bg):
    """Stacked: mark above wordmark, centered."""
    if isinstance(bg, tuple):
        c = Image.new('RGBA', canvas_size, bg + (255,))
    else:
        c = bg.resize(canvas_size, Image.LANCZOS)

    gap = int(canvas_size[0] * 0.04)
    th = mark_sized.size[1] + gap + wm_sized.size[1]
    sy = (canvas_size[1] - th) // 2
    mx = (canvas_size[0] - mark_sized.size[0]) // 2
    wx = (canvas_size[0] - wm_sized.size[0]) // 2

    c.paste(mark_sized, (mx, sy), mark_sized)
    c.paste(wm_sized, (wx, sy + mark_sized.size[1] + gap), wm_sized)
    c.convert('RGB').save(OUT + name)
    print(f"  {name}")


# =============================================
# MAIN
# =============================================

def main():
    print("=== AKBai Logo Generator v7 (Fixed Proportions) ===\n")

    # --- Load sources ---
    src_light = Image.open(OUT + 'new-logo-source.png').convert('RGBA')
    src_transparent = Image.open(OUT + 'logo-transparent.png').convert('RGBA')

    # --- Extract marks from existing generated files (Gemini sources were deleted) ---
    print("Extracting marks...")

    # Light: from original source
    mark_light_region = src_light.crop((230, 120, 920, 720))
    mark_light = extract_floodfill(mark_light_region, 40)

    # Dark: extract from existing Icon_512 (dark bg)
    mark_dark = extract_floodfill(
        Image.open(OUT + 'AKBai_Icon_512.png').convert('RGBA'), 35)

    # Honey: extract from existing Mark_Honey (honey bg)
    mark_honey = extract_floodfill(
        Image.open(OUT + 'AKBai_Mark_Honey.png').convert('RGBA'), 30)

    # Transparent: trim
    mark_trans = src_transparent
    bbox = mark_trans.getbbox()
    if bbox:
        mark_trans = mark_trans.crop(bbox)

    print(f"  Light:  {mark_light.size}")
    print(f"  Dark:   {mark_dark.size}")
    print(f"  Honey:  {mark_honey.size}")
    print(f"  Trans:  {mark_trans.size}")

    # --- Extract wordmark ---
    wm = extract_wordmark(src_light)
    wm_dk = wm_for_dark(wm)
    wm_wh = wm_white(wm)
    print(f"  WM:     {wm.size}")

    # =============================================
    # DEFINE CONSISTENT SIZES (pixels)
    # All marks resized to same px BEFORE compositing
    # =============================================

    # Canvas sizes
    MSIZE = (1800, 1800)
    HSIZE = (3600, 1200)
    SSIZE = (2400, 2400)
    ISIZE = (1536, 1536)

    # Target mark sizes in pixels for each layout
    MARK_PX = 1100       # marks on 1800 canvas = ~61% fill
    HMARK_PX = 660       # mark height in horizontal (1200 high) = ~55%
    SMARK_PX = 950       # mark in stacked (2400 wide) = ~40%
    IMARK_PX = 920       # mark in icon (1536) = ~60%
    HWM_PX = 540         # wordmark height in horizontal (~82% of mark)
    SWM_PX = 480         # wordmark height in stacked (visually matches mark width)

    # --- Pre-size all marks to exact pixel sizes ---
    print(f"\nSizing marks to {MARK_PX}px (mark), {HMARK_PX}px (horizontal), {SMARK_PX}px (stacked), {IMARK_PX}px (icon)...")

    # For marks (square canvas)
    m_light = make_exact_size(mark_light, MARK_PX)
    m_dark = make_exact_size(mark_dark, MARK_PX)
    m_honey = make_exact_size(mark_honey, MARK_PX)

    # For horizontal logos
    hm_light = make_exact_size(mark_light, HMARK_PX)
    hm_dark = make_exact_size(mark_dark, HMARK_PX)
    hm_honey = make_exact_size(mark_honey, HMARK_PX)

    # For stacked logos
    sm_light = make_exact_size(mark_light, SMARK_PX)
    sm_dark = make_exact_size(mark_dark, SMARK_PX)
    sm_honey = make_exact_size(mark_honey, SMARK_PX)

    # For icons
    im_light = make_exact_size(mark_light, IMARK_PX)
    im_dark = make_exact_size(mark_dark, IMARK_PX)
    im_honey = make_exact_size(mark_honey, IMARK_PX)

    # Wordmark sizes
    hwm = make_exact_size(wm, HWM_PX)
    hwm_dk = make_exact_size(wm_dk, HWM_PX)
    hwm_wh = make_exact_size(wm_wh, HWM_PX)
    swm = make_exact_size(wm, SWM_PX)
    swm_dk = make_exact_size(wm_dk, SWM_PX)
    swm_wh = make_exact_size(wm_wh, SWM_PX)

    # =============================================
    # GENERATE
    # =============================================

    print("\n--- MARKS (4) ---")
    gen_mark('AKBai_Mark_OnLight.png', m_light, MSIZE, CREAM)
    gen_mark('AKBai_Mark_OnDark.png', m_dark, MSIZE, DARK)
    gen_mark('AKBai_Mark_Honey.png', m_honey, MSIZE, HONEY)
    gen_mark('AKBai_Mark_OnGradient.png', m_honey, MSIZE, honey_gradient(MSIZE))

    print("\n--- HORIZONTAL LOGOS (4) ---")
    gen_horizontal('AKBai_Logo_Primary_OnLight.png', hm_light, hwm, HSIZE, CREAM)
    gen_horizontal('AKBai_Logo_Primary_OnDark.png', hm_dark, hwm_dk, HSIZE, DARK)
    gen_horizontal('AKBai_Logo_Primary_OnGradient.png', hm_honey, hwm_wh, HSIZE, honey_gradient(HSIZE))
    # AKBai_Logo_White.png — removed per Anton

    print("\n--- STACKED LOGOS (3) ---")
    gen_stacked('AKBai_Logo_Stacked_OnLight.png', sm_light, swm, SSIZE, CREAM)
    gen_stacked('AKBai_Logo_Stacked_OnDark.png', sm_dark, swm_dk, SSIZE, DARK)
    gen_stacked('AKBai_Logo_Stacked_OnGradient.png', sm_honey, swm_wh, SSIZE, honey_gradient(SSIZE))

    print("\n--- ICONS (3) ---")
    gen_mark('AKBai_Icon_512_Light.png', im_light, ISIZE, CREAM)
    gen_mark('AKBai_Icon_512.png', im_dark, ISIZE, DARK)
    gen_mark('AKBai_Icon_512_Honey.png', im_honey, ISIZE, HONEY)

    # logo-transparent.png stays as-is (source file)

    print("\n=== 13 FILES GENERATED + logo-transparent.png = 14 TOTAL ===")

    # Verification
    print("\n--- VERIFICATION ---")
    for f in ['AKBai_Mark_OnLight.png', 'AKBai_Mark_OnDark.png',
              'AKBai_Mark_Honey.png', 'AKBai_Mark_OnGradient.png',
              'AKBai_Icon_512.png', 'AKBai_Icon_512_Honey.png']:
        img = Image.open(OUT + f).convert('RGBA')
        arr = np.array(img)
        corners = [arr[5,5,:3], arr[5,-5,:3], arr[-5,5,:3], arr[-5,-5,:3]]
        bg = np.mean(corners, axis=0).astype(float)
        dist = np.sqrt(np.sum((arr[:,:,:3].astype(float) - bg)**2, axis=2))
        mask = dist > 25
        rows = np.any(mask, axis=1)
        cols = np.any(mask, axis=0)
        if np.any(rows) and np.any(cols):
            y1, y2 = np.where(rows)[0][[0,-1]]
            x1, x2 = np.where(cols)[0][[0,-1]]
            fill = max(x2-x1, y2-y1) / min(img.size) * 100
            print(f"  {f:<40} {fill:.1f}% fill")


if __name__ == '__main__':
    main()
