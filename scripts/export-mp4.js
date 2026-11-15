#!/usr/bin/env node
// StoryForge export runner – renders frames then stitches MP4
// npm run export   => dist/storyforge.mp4
// npm run test     => smoke test (10 frames only, skips encode)

import { createCanvas } from 'canvas';
import Ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderFrame, SCENE } from '../src/export.js';

const ROOT    = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FRAMES  = path.join(ROOT, 'frames');
const DISTDIR = path.join(ROOT, 'dist');
const OUTMP4  = path.join(DISTDIR, 'storyforge.mp4');
const ISTEST  = process.argv.includes('--test');
const N       = ISTEST ? 10 : SCENE.totalFrames;

if (!fs.existsSync(FRAMES))  fs.mkdirSync(FRAMES,  { recursive: true });
if (!fs.existsSync(DISTDIR)) fs.mkdirSync(DISTDIR, { recursive: true });

const cv  = createCanvas(SCENE.width, SCENE.height);
const ctx = cv.getContext('2d');

process.stdout.write(`[StoryForge] Rendering ${N} frames\n`);
for (let i = 0; i < N; i++) {
  renderFrame(ctx, i);
  fs.writeFileSync(
    path.join(FRAMES, `f${String(i).padStart(6,'0')}.png`),
    cv.toBuffer('image/png')
  );
  if (i % 30 === 0 || i === N-1)
    process.stdout.write(`  ${i+1}/${N}\r`);
}
process.stdout.write('\n[StoryForge] Frames written\n');

if (ISTEST) {
  process.stdout.write('[StoryForge] Smoke test OK\n');
  process.exit(0);
}

Ffmpeg()
  .input(path.join(FRAMES, 'f%06d.png'))
  .inputFPS(SCENE.fps)
  .videoCodec('libx264')
  .outputOptions(['-crf 18', '-preset slow', '-pix_fmt yuv420p', '-movflags +faststart'])
  .size(`${SCENE.width}x${SCENE.height}`)
  .fps(SCENE.fps)
  .output(OUTMP4)
  .on('end', () => {
    const kb = (fs.statSync(OUTMP4).size / 1024).toFixed(1);
    process.stdout.write(`[StoryForge] Export done: ${OUTMP4} (${kb} KB)\n`);
    for (const f of fs.readdirSync(FRAMES)) fs.unlinkSync(path.join(FRAMES, f));
    fs.rmdirSync(FRAMES);
  })
  .on('error', (e) => { process.stderr.write(`FFmpeg error: ${e.message}\n`); process.exit(1); })
  .run();
