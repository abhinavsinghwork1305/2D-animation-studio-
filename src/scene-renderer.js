// StoryForge scene-renderer – composes background + characters + subtitles

import { drawBackground } from './bg-draw.js';
import { drawCharacter, drawSubtitle } from './char-draw.js';

var FW = 720, FH = 1280, FPS = 30;

var CHAR_LIST = [
  { skin: '#f5c5a3', shirt: '#c62828', pant: '#1a237e', rx: 0.35 },
  { skin: '#d4a574', shirt: '#2e7d32', pant: '#4a148c', rx: 0.65 },
];

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function smth(t) { t = clamp01(t); return t*t*(3-2*t); }
function prog(fr, s, e) { return smth((fr-s)/(e-s)); }

function sceneAt(scenes, frame) {
  for (var i = 0; i < scenes.length; i++) {
    if (frame < scenes[i].endFrame) return scenes[i];
  }
  return scenes[scenes.length - 1];
}

function localFr(sc, frame) { return frame - sc.startFrame; }

function pickAction(mood, lf) {
  if (mood === 'excited') return lf % 60 < 30 ? 'run' : 'jump';
  if (mood === 'tense')   return 'run';
  if (mood === 'happy')   return lf % 90 < 45 ? 'walk' : 'talk';
  if (mood === 'sad')     return lf % 80 < 40 ? 'idle' : 'talk';
  return lf % 100 < 50 ? 'idle' : 'talk';
}

function camXY(sc, lf) {
  var total = sc.endFrame - sc.startFrame;
  var pct   = lf / total;
  var pX    = (sc.index % 2 === 0 ? 1 : -1) * 20 * pct;
  var zoom  = 1 + 0.04 * Math.sin(pct * Math.PI);
  return { x: pX, z: zoom };
}

function fadeAlpha(sc, frame) {
  var lf    = localFr(sc, frame);
  var total = sc.endFrame - sc.startFrame;
  var inEnd = Math.min(20, Math.floor(total * 0.15));
  var outSt = Math.max(total - 20, Math.floor(total * 0.85));
  var a = 1;
  if (lf < inEnd) a = lf / inEnd;
  else if (lf > outSt) a = 1 - (lf - outSt) / (total - outSt);
  return clamp01(a);
}

function subChunk(sc, frame) {
  var lf    = localFr(sc, frame);
  var total = sc.endFrame - sc.startFrame;
  var words = sc.fullText.split(' ').filter(Boolean);
  if (!words.length) return sc.heading;
  var wi    = Math.floor((lf / total) * words.length);
  wi = wi < 0 ? 0 : wi >= words.length ? words.length - 1 : wi;
  var N = 8;
  var st = Math.floor(wi / N) * N;
  return words.slice(st, st + N).join(' ');
}

/**
 * Render a full 720x1280 story frame.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} frame
 * @param {Array} scenes
 */
export function renderStoryFrame(ctx, frame, scenes) {
  if (!scenes || !scenes.length) {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, FW, FH);
    return;
  }

  var sc   = sceneAt(scenes, frame);
  var lf   = localFr(sc, frame);
  var cam  = camXY(sc, lf);
  var ta   = fadeAlpha(sc, frame);
  var nCh  = Math.min(CHAR_LIST.length, sc.index + 1);

  ctx.clearRect(0, 0, FW, FH);
  ctx.save();
  ctx.translate(FW/2 + cam.x, FH/2);
  ctx.scale(cam.z, cam.z);
  ctx.translate(-FW/2, -FH/2);

  drawBackground(ctx, sc.background || 'meadow', lf, FW, FH);

  var gY = FH * 0.72 + 170;
  for (var ci = 0; ci < nCh; ci++) {
    var cc  = CHAR_LIST[ci];
    var rxF = nCh === 1 ? 0.50 : cc.rx;
    drawCharacter(ctx, rxF * FW, gY, 1.1, lf, sc.mood, pickAction(sc.mood, lf), ci === 0 ? 1 : -1, cc.skin, cc.shirt, cc.pant);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.fillRect(0, 0, FW, 70);
  ctx.fillStyle = '#e0d0ff';
  ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(sc.heading.substring(0, 50), FW/2, 35);

  ctx.restore();

  if (ta < 0.98) {
    ctx.save(); ctx.globalAlpha = 1 - ta; ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, FW, FH); ctx.restore();
  }

  drawSubtitle(ctx, subChunk(sc, frame), FW, FH, ta);
}

export var STORY_SCENE = { width: FW, height: FH, fps: FPS };
