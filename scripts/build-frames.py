# Exports the logo-free intro video as WebP frame sets for the scroll-scrubbed canvas.
#   d  desktop: the whole frame, 1600x900
#   m  mobile:  a crop of the horizontal band a portrait screen ever shows (x 12%-76%), 900 tall
# 900p keeps every frame cheap enough to decode and draw that scrubbing stays smooth (full 1080p
# was 44% more work per frame and made the intro lag); gentle compression (q78-80) keeps the
# dark smoke free of blocking and banding.
# Frames go in a versioned folder (frames/v3/...): change VERSION whenever the frames change,
# so browsers and CDN caches can never keep showing an older set.
# Also writes the poster (first frame) and the background still (last frame).
# Usage: python scripts/build-frames.py video-src/intro-clean.mp4 public
import json, os, sys
import cv2

src, out = sys.argv[1], sys.argv[2]
VERSION = 'v3'
SETS = {
    'd': {'crop': [0.0, 0.0, 1.0, 1.0], 'height': 900, 'quality': 80},
    'm': {'crop': [0.12, 0.0, 0.76, 1.0], 'height': 900, 'quality': 78},
}

cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS)
frames = []
while True:
    ok, f = cap.read()
    if not ok:
        break
    frames.append(f)
H, W = frames[0].shape[:2]

manifest = {'fps': fps, 'count': len(frames), 'source': [W, H], 'sets': {}}
for name, s in SETS.items():
    x0, y0, x1, y1 = s['crop']
    cx0, cx1, cy0, cy1 = round(x0 * W), round(x1 * W), round(y0 * H), round(y1 * H)
    h = s['height']
    w = round((cx1 - cx0) * h / (cy1 - cy0))
    d = os.path.join(out, 'frames', VERSION, name)
    os.makedirs(d, exist_ok=True)
    total = 0
    for i, f in enumerate(frames):
        im = f[cy0:cy1, cx0:cx1]
        if im.shape[1] != w or im.shape[0] != h:
            im = cv2.resize(im, (w, h), interpolation=cv2.INTER_AREA)
        p = os.path.join(d, f'{i:04d}.webp')
        cv2.imwrite(p, im, [cv2.IMWRITE_WEBP_QUALITY, s['quality']])
        total += os.path.getsize(p)
    manifest['sets'][name] = {'path': f'/frames/{VERSION}/{name}/', 'size': [w, h], 'crop': s['crop'], 'bytes': total}
    print(name, f'{w}x{h}', f'{total / 1e6:.1f} MB')

os.makedirs(os.path.join(out, 'video'), exist_ok=True)
cv2.imwrite(os.path.join(out, 'video', 'poster.jpg'), frames[0], [cv2.IMWRITE_JPEG_QUALITY, 90])
cv2.imwrite(os.path.join(out, 'video', 'final.jpg'), frames[-1], [cv2.IMWRITE_JPEG_QUALITY, 92])
with open(os.path.join(out, 'frames', 'manifest.json'), 'w') as fh:
    json.dump(manifest, fh)
print('frames', len(frames), 'fps', fps)
