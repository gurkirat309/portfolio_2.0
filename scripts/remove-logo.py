# Removes the static semi-transparent Gemini logo (bottom right) from the intro video.
# The logo is a fixed white overlay at ~27% opacity; its per-pixel opacity map is scripts/logo-alpha.npy,
# measured by regression over all 358 frames. Fine detail comes from reversing the blend, broad tones
# from an inpainted fill, and a 2px edge band is inpainted last.
# Usage: python scripts/remove-logo.py <ffmpeg> <source.mp4> <out.mp4>
import cv2, sys, glob, numpy as np
X0,Y0=1690,850
import os
a=np.load(os.path.join(os.path.dirname(os.path.abspath(__file__)),'logo-alpha.npy')); WHITE=255.0
core=(a>0.12).astype(np.uint8)
n,lab,stats,_=cv2.connectedComponentsWithStats(core)
keep=1+np.argmax(stats[1:,cv2.CC_STAT_AREA]); core=(lab==keep).astype(np.uint8)
region=cv2.dilate(core,np.ones((5,5),np.uint8))
med=float(np.median(a[core>0]))
ar=np.where(core>0, np.maximum(a, 0) , a)*region
ar=np.where(a>0.2, med, ar)                  # flat interior, measured soft edge
ar=cv2.GaussianBlur(ar,(0,0),0.5)*region
A=ar[...,None].astype(np.float32)
edge=(cv2.dilate(core,np.ones((5,5),np.uint8))-cv2.erode(core,np.ones((5,5),np.uint8)))*255
H,W=a.shape
fillmask=cv2.dilate(core,np.ones((7,7),np.uint8))*255
R=cv2.GaussianBlur(cv2.dilate(core,np.ones((9,9),np.uint8)).astype(np.float32),(0,0),2)[...,None]
def clean(f):
    p=f[Y0:Y0+H,X0:X0+W].astype(np.float32)
    u=(p-WHITE*A)/(1-A)                                   # reverse blend: keeps fine detail
    fill=cv2.inpaint(f[Y0:Y0+H,X0:X0+W],fillmask,5,cv2.INPAINT_TELEA).astype(np.float32)  # smooth tones
    u=u-cv2.GaussianBlur(u-fill,(0,0),4)                   # low frequencies from the fill, detail from u
    b=u*R+p*(1-R)
    b=np.clip(b,0,255).astype(np.uint8)
    b=cv2.inpaint(b,edge.astype(np.uint8),3,cv2.INPAINT_TELEA)
    f[Y0:Y0+H,X0:X0+W]=b
    return f
src, out = sys.argv[2], sys.argv[3]
c = cv2.VideoCapture(src)
fps = c.get(cv2.CAP_PROP_FPS)
import subprocess
enc = subprocess.Popen([sys.argv[1], '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', '1920x1080', '-r', str(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
n = 0
while True:
    ok, f = c.read()
    if not ok: break
    enc.stdin.write(clean(f).tobytes()); n += 1
enc.stdin.close(); enc.wait()
print('cleaned', n, 'frames ->', out)
