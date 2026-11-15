/**
 * StoryForge – Browser entry point (dashboard + animation loop)
 */

import { renderFrame, SCENE } from './scene.js';
import { parseScript, totalDuration } from './story-parser.js';
import { renderStoryFrame, STORY_SCENE } from './scene-renderer.js';

const canvas = document.getElementById('storyforge-canvas');
if (!canvas) {
  throw new Error('[StoryForge] Canvas element #storyforge-canvas not found');
}

const ctx = canvas.getContext('2d');

// ── Mutable state ─────────────────────────────────────────────────────────────
let scenes = null;
let totalFrames = SCENE.totalFrames;
let frame = 0;
let running = true;
let storyMode = false;
let audioEl = null;
let lastTime = null;
let frameDuration = 1000 / SCENE.fps;

// ── Animation loop ────────────────────────────────────────────────────────────

function loop(now) {
  if (!running) { lastTime = null; requestAnimationFrame(loop); return; }
  if (lastTime === null) lastTime = now;
  const delta = now - lastTime;
  if (delta >= frameDuration - 1) {
    if (storyMode && scenes && scenes.length) {
      renderStoryFrame(ctx, frame % totalFrames, scenes);
    } else {
      renderFrame(ctx, frame % SCENE.totalFrames);
    }
    frame = (frame + Math.max(1, Math.round(delta / frameDuration)));
    lastTime = now;
    updateIndicator();
  }
  requestAnimationFrame(loop);
}

renderFrame(ctx, 0);
requestAnimationFrame(loop);

// ── Scene indicator ───────────────────────────────────────────────────────────
function updateIndicator() {
  const el = document.getElementById('scind');
  if (!el) return;
  if (!storyMode || !scenes || !scenes.length) {
    el.textContent = 'Frame ' + frame + ' — Story mode off';
    return;
  }
  let sc = scenes[0];
  for (let i = 0; i < scenes.length; i++) {
    if (frame < scenes[i].endFrame) { sc = scenes[i]; break; }
  }
  el.textContent = 'Scene ' + (sc.index + 1) + '/' + scenes.length + ' | ' + sc.heading.substring(0, 32) + ' | f' + frame;
}

// ── Status helper ─────────────────────────────────────────────────────────────
function setStatus(msg, cls) {
  const el = document.getElementById('stat');
  if (!el) return;
  el.textContent = msg;
  el.className = cls || '';
}

// ── Scene list population ─────────────────────────────────────────────────────
function populateSceneList() {
  const ul = document.getElementById('sclist');
  if (!ul || !scenes) return;
  ul.innerHTML = '';
  scenes.forEach(function(sc) {
    const li = document.createElement('li');
    li.innerHTML = '<div class="st">Scene ' + (sc.index + 1) + ': ' + sc.heading.substring(0, 40) + '</div>'
      + '<div class="sm">' + sc.durationSec + 's | mood: ' + sc.mood + '</div>';
    li.addEventListener('click', function() {
      ul.querySelectorAll('li').forEach(function(x) { x.classList.remove('on'); });
      li.classList.add('on');
      frame = sc.startFrame;
      if (audioEl) { audioEl.currentTime = sc.startSec; if (running) audioEl.play().catch(function() {}); }
    });
    ul.appendChild(li);
  });
}

// ── Parse button ──────────────────────────────────────────────────────────────
const btnParse = document.getElementById('btnParse');
if (btnParse) btnParse.addEventListener('click', function() {
  const ta = document.getElementById('scin');
  const text = ta ? ta.value.trim() : '';
  if (!text) { setStatus('Please paste a script first.', 'er'); return; }
  try {
    scenes = parseScript(text, SCENE.fps);
    if (!scenes.length) { setStatus('No scenes found. Add SCENE headings or blank lines between scenes.', 'er'); return; }
    totalFrames = Math.round(totalDuration(scenes) * SCENE.fps);
    canvas.width  = STORY_SCENE.width;
    canvas.height = STORY_SCENE.height;
    frameDuration = 1000 / STORY_SCENE.fps;
    storyMode = true;
    frame     = 0;
    populateSceneList();
    setStatus('Parsed ' + scenes.length + ' scenes — ' + (totalFrames / SCENE.fps).toFixed(1) + ' s total.', 'ok');
  } catch(e) {
    setStatus('Parse error: ' + e.message, 'er');
  }
});

// ── Clear button ──────────────────────────────────────────────────────────────
const btnClr = document.getElementById('btnClr');
if (btnClr) btnClr.addEventListener('click', function() {
  const ta = document.getElementById('scin');
  if (ta) ta.value = '';
  scenes = null; storyMode = false; frame = 0;
  canvas.width  = SCENE.width;
  canvas.height = SCENE.height;
  frameDuration = 1000 / SCENE.fps;
  renderFrame(ctx, 0);
  const ul = document.getElementById('sclist');
  if (ul) ul.innerHTML = '<li style="color:var(--dim);font-size:.78rem">No scenes yet. Parse a script first.</li>';
  setStatus('Ready.');
});

// ── Playback controls ─────────────────────────────────────────────────────────
const btnPlay = document.getElementById('btnPlay');
if (btnPlay) btnPlay.addEventListener('click', function() {
  running = !running;
  btnPlay.textContent = running ? 'Pause' : 'Play';
  btnPlay.classList.toggle('on', running);
  if (audioEl) { running ? audioEl.play().catch(function() {}) : audioEl.pause(); }
});

const btnRst = document.getElementById('btnRst');
if (btnRst) btnRst.addEventListener('click', function() {
  frame = 0;
  if (audioEl) { audioEl.currentTime = 0; if (running) audioEl.play().catch(function() {}); }
});

const btnPrev = document.getElementById('btnPrev');
if (btnPrev) btnPrev.addEventListener('click', function() {
  if (!scenes || !scenes.length) return;
  let idx = 0;
  for (let i = 0; i < scenes.length; i++) { if (frame >= scenes[i].startFrame) idx = i; }
  idx = Math.max(0, idx - 1);
  frame = scenes[idx].startFrame;
  if (audioEl) { audioEl.currentTime = scenes[idx].startSec; if (running) audioEl.play().catch(function() {}); }
});

const btnNext = document.getElementById('btnNext');
if (btnNext) btnNext.addEventListener('click', function() {
  if (!scenes || !scenes.length) return;
  let idx = scenes.length - 1;
  for (let i = 0; i < scenes.length; i++) { if (frame < scenes[i].endFrame) { idx = Math.min(scenes.length - 1, i + 1); break; } }
  frame = scenes[idx].startFrame;
  if (audioEl) { audioEl.currentTime = scenes[idx].startSec; if (running) audioEl.play().catch(function() {}); }
});

// ── Audio upload ──────────────────────────────────────────────────────────────
const audioFileEl = document.getElementById('audioFile');
if (audioFileEl) audioFileEl.addEventListener('change', function() {
  const f = audioFileEl.files[0];
  if (!f) return;
  if (audioEl) { audioEl.pause(); audioEl.src = ''; }
  audioEl = new Audio(URL.createObjectURL(f));
  const aok = document.getElementById('aok');
  if (aok) { aok.textContent = 'Loaded: ' + f.name; aok.style.display = 'block'; }
  setStatus('Audio ready: ' + f.name + '. Press Play to preview.', 'ok');
});

// ── Sample loaders ────────────────────────────────────────────────────────────
document.querySelectorAll('.sbtn[data-ep]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    const ep = btn.getAttribute('data-ep');
    fetch('/samples/episode' + ep + '.txt')
      .then(function(r) { return r.text(); })
      .then(function(txt) {
        const ta = document.getElementById('scin');
        if (ta) ta.value = txt;
        setStatus('Sample episode ' + ep + ' loaded. Click Parse Script.', 'ok');
      })
      .catch(function() {
        setStatus('Could not fetch sample. Paste manually from samples/episode' + ep + '.txt', 'er');
      });
  });
});

// ── Copy command button ───────────────────────────────────────────────────────
const btnCopy = document.getElementById('btnCopy');
if (btnCopy) btnCopy.addEventListener('click', function() {
  const cmd = 'node scripts/export-mp4.js --script samples/episode1.txt --out dist/episode1.mp4';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(cmd).then(function() { setStatus('Command copied!', 'ok'); });
  } else {
    setStatus(cmd, 'ok');
  }
});

// ── Keyboard shortcut ─────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'u') {
    e.preventDefault();
    alert(
      'Export commands:\n\n  npm run export:ep1\n  npm run export:ep2\n  npm run export:ep3\n\nOr: node scripts/export-mp4.js --script story.txt --audio voice.mp3 --out out.mp4'
    );
  }
});

console.log('%cStoryForge v2', 'color:#a78bfa;font-size:1.2em;font-weight:bold');
console.log('720x1280 | 30 fps | Ctrl+U = export hint');
