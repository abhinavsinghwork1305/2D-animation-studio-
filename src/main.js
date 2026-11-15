/**
 * StoryForge – Browser preview entry point
 * Runs the animation loop on the canvas rendered in index.html
 */

import { renderFrame, SCENE } from './scene.js';

const canvas = document.getElementById('storyforge-canvas');
if (!canvas) {
  throw new Error('[StoryForge] Canvas element #storyforge-canvas not found');
}

canvas.width = SCENE.width;
canvas.height = SCENE.height;

const ctx = canvas.getContext('2d');

let frame = 0;
let lastTime = null;
const frameDuration = 1000 / SCENE.fps; // ms per frame

function loop(now) {
  if (lastTime === null) lastTime = now;
  const delta = now - lastTime;

  if (delta >= frameDuration - 1) {
    renderFrame(ctx, frame % SCENE.totalFrames);
    frame += Math.round(delta / frameDuration);
    lastTime = now;
  }

  requestAnimationFrame(loop);
}

// Render frame 0 immediately so the canvas is never blank
renderFrame(ctx, 0);
requestAnimationFrame(loop);

// ── Keyboard shortcut: Ctrl+U to trigger export hint ────────────────────
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'u') {
    e.preventDefault();
    alert(
      'To export the MP4, run:\n\n  npm run export\n\nin your terminal.\n\nThe file will be saved as dist/storyforge.mp4'
    );
  }
});

// ── Log studio info ──────────────────────────────────────────────────────
console.log(
  `%c🎬 StoryForge Studio`,
  'color:#a78bfa;font-size:1.2em;font-weight:bold'
);
console.log(
  `Scene: ${SCENE.width}×${SCENE.height} | ${SCENE.fps} fps | ${SCENE.totalFrames} frames`
);
console.log('Press Ctrl+U to get export instructions.');
