// Builds every intro asset from the source robot video:
//   1. scripts/remove-logo.py  -> video-src/intro-clean.mp4  (Gemini logo removed)
//   2. scripts/build-frames.py -> public/frames/{d,m}/*.webp, manifest.json, public/video/poster.jpg, final.jpg
// Needs a Python with OpenCV (cv2) and numpy. Set PYTHON if `python` on PATH lacks them, e.g.
//   PYTHON=C:/Users/you/anaconda3/python npm run encode
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';

const python = process.env.PYTHON || 'python';
const run = (args) => execFileSync(python, ['-I', ...args], { stdio: 'inherit' });

const src = readdirSync('.').find((f) => f.startsWith('Robot_reaching') && f.endsWith('.mp4'));
if (!src) throw new Error('Source video not found in project root');

if (!existsSync('video-src/intro-clean.mp4') || process.argv.includes('--force')) {
  run(['scripts/remove-logo.py', ffmpeg, src, 'video-src/intro-clean.mp4']);
}
rmSync('public/frames', { recursive: true, force: true });
run(['scripts/build-frames.py', 'video-src/intro-clean.mp4', 'public']);
