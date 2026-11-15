#!/usr/bin/env node
/**
 * StoryForge export runner
 *
 * Usage:
 *   npm run export                   – logo scene  -> dist/storyforge.mp4
 *   npm run export:ep1               – episode 1   -> dist/episode1.mp4
 *   npm run export:ep2               – episode 2   -> dist/episode2.mp4
 *   npm run export:ep3               – episode 3   -> dist/episode3.mp4
 *   npm run test                     – smoke test (10 frames, no encode)
 *
 *   node scripts/export-mp4.js --script story.txt --out dist/my.mp4
 *   node scripts/export-mp4.js --script story.txt --audio voice.mp3 --out out.mp4
 */

import { createCanvas } from 'canvas';
import Ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderFrame, renderStoryFrameNode, prepareStory, SCENE } from '../src/export.js';

const ROOT    = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FRAMES  = path.join(ROOT, 'frames');
const DISTDIR = path.join(ROOT, 'dist');
const ISTEST  = process.argv.includes('--test');

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : null;
}
const scriptFile = getArg('--script');
const audioFile  = getArg('--audio');
const outFile    = getArg('--out');

let scenes      = null;
let totalFrames = SCENE.totalFrames;

if (scriptFile) {
  const scriptText = fs.readFileSync(path.resolve(scriptFile), 'utf8');
  const prepared   = prepareStory(scriptText);
  scenes           = prepared.scenes;
  totalFrames      = prepared.totalFrames;
  process.stdout.write(`[StoryForge] Script loaded: ${scenes.length} scenes, ${(totalFrames / SCENE.fps).toFixed(1)}s\n`);
}

const N      = ISTEST ? 10 : totalFrames;
const OUTMP4 = outFile ? path.resolve(outFile) : path.join(DISTDIR, 'storyforge.mp4');

if (!fs.existsSync(FRAMES))  fs.mkdirSync(FRAMES,  { recursive: true });
if (!fs.existsSync(DISTDIR)) fs.mkdirSync(DISTDIR, { recursive: true });

const cv  = createCanvas(SCENE.width, SCENE.height);
const ctx = cv.getContext('2d');

process.stdout.write(`[StoryForge] Rendering ${N} frames\n`);
for (let i = 0; i < N; i++) {
  if (scenes) {
    renderStoryFrameNode(ctx, i, scenes);
  } else {
    renderFrame(ctx, i % 180);
  }
  fs.writeFileSync(
    path.join(FRAMES, `f${String(i).padStart(6,'0')}.png`),
    cv.toBuffer('image/png')
  );
  if (i % 30 === 0 || i === N-1)
    process.stdout.write(`  frame ${i + 1}/${N}\r`);
}
process.stdout.write('\n[StoryForge] Frames written\n');

if (ISTEST) {
  process.stdout.write('[StoryForge] Smoke test OK\n');
  process.exit(0);
}

const ff = Ffmpeg()
  .input(path.join(FRAMES, 'f%06d.png'))
  .inputFPS(SCENE.fps);

if (audioFile && fs.existsSync(path.resolve(audioFile))) {
  ff.input(path.resolve(audioFile));
  process.stdout.write(`[StoryForge] Mixing audio: ${audioFile}\n`);
}

ff
  .videoCodec('libx264')
  .outputOptions(['-crf 18', '-preset slow', '-pix_fmt yuv420p', '-movflags +faststart'])
  .size(`${SCENE.width}x${SCENE.height}`)
  .fps(SCENE.fps)
  .output(OUTMP4)
  .on('end', () => {
    const kb = (fs.statSync(OUTMP4).size / 1024).toFixed(1);
    process.stdout.write(`[StoryForge] Export done: ${OUTMP4} (${kb} KB)\n`);
    for (const f of fs.readdirSync(FRAMES)) fs.unlinkSync(path.join(FRAMES, f));
    try { fs.rmdirSync(FRAMES); } catch (_) {}
  })
  .on('error', (e) => { process.stderr.write(`FFmpeg error: ${e.message}\n`); process.exit(1); })
  .run();
