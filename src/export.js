/**
 * StoryForge – Server-side frame renderer
 * Uses node-canvas to render every frame to PNG files in /frames/
 */

import { createCanvas } from 'canvas';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ── Inline scene constants & render function ─────────────────────────────
// (Duplicated here so this module works in pure Node without a browser DOM)

export const SCENE = {
  width: 720,
  height: 1280,
  fps: 30,
  totalFrames: 180,
};

const clamp01 = (t) => Math.max(0, Math.min(1, t));
const lerp = (a, b, t) => a + (b - a) * clamp01(t);
const smoothstep = (t) => t * t * (3 - 2 * t);
const progress = (frame, start, end) =>
  clamp01((frame - start) / (end - start));

const STAR_COUNT = 220;
const stars = Array.from({ length: STAR_COUNT }, (_, i) => {
  const seed = (i * 2654435761) >>> 0;
  return {
    x: ((seed & 0xffff) / 0xffff) * 720,
    y: (((seed >> 16) & 0xffff) / 0xffff) * 1280,
    r: 0.4 + ((seed & 0x0f) / 15) * 1.6,
    twinkleOffset: (seed & 0x3f) / 63,
    speed: 0.08 + ((seed & 0x07) / 7) * 0.14,
  };
});

const NEBULA_COUNT = 70;
const nebulaParticles = Array.from({ length: NEBULA_COUNT }, (_, i) => {
  const seed = (i * 1664525 + 1013904223) >>> 0;
  return {
    x: 60 + ((seed & 0xffff) / 0xffff) * 600,
    baseY: 700 + (((seed >> 16) & 0xffff) / 0xffff) * 400,
    r: 3 + ((seed & 0x1f) / 31) * 22,
    hue: 240 + ((seed & 0x3f) / 63) * 80,
    alpha: 0.03 + ((seed & 0x0f) / 15) * 0.09,
    riseSpeed: 0.4 + ((seed & 0x07) / 7) * 0.6,
  };
});

export function renderFrame(ctx, frame) {
  const W = SCENE.width;
  const H = SCENE.height;

  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#05030f');
  bg.addColorStop(0.5, '#0d0520');
  bg.addColorStop(1, '#020208');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const nebulaFade = smoothstep(progress(frame, 0, 40));
  nebulaParticles.forEach((p) => {
    const drift = (frame * p.riseSpeed) % H;
    const py = ((p.baseY - drift) % H + H) % H;
    const grd = ctx.createRadialGradient(p.x, py, 0, p.x, py, p.r);
    grd.addColorStop(0, `hsla(${p.hue},80%,60%,${p.alpha * nebulaFade})`);
    grd.addColorStop(1, `hsla(${p.hue},80%,60%,0)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(p.x, py, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  const starFade = smoothstep(progress(frame, 0, 50));
  stars.forEach((s) => {
    const twinkle = 0.5 + 0.5 * Math.sin((frame * s.speed + s.twinkleOffset * Math.PI * 2) * 2);
    const alpha = starFade * (0.4 + 0.6 * twinkle);
    ctx.fillStyle = `rgba(210,210,255,${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  const logoFade = smoothstep(progress(frame, 30, 90));
  const shimmer = 1 + 0.06 * Math.sin((frame / SCENE.totalFrames) * Math.PI * 8);
  if (logoFade > 0.01) {
    const haloGrd = ctx.createRadialGradient(W/2, H*0.38, 0, W/2, H*0.38, 260*shimmer);
    haloGrd.addColorStop(0, `rgba(139,92,246,${0.18*logoFade})`);
    haloGrd.addColorStop(0.5, `rgba(109,40,217,${0.08*logoFade})`);
    haloGrd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = haloGrd;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = logoFade;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold 94px Arial`;
    ctx.shadowColor = `hsl(263,90%,65%)`;
    ctx.shadowBlur = 48 * shimmer;
    ctx.fillStyle = '#c4b5fd';
    ctx.fillText('STORY', W/2, H*0.355);
    ctx.fillText('FORGE', W/2, H*0.415);
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ede9fe';
    ctx.fillText('STORY', W/2, H*0.355);
    ctx.fillText('FORGE', W/2, H*0.415);
    ctx.restore();
  }

  const tagFade = smoothstep(progress(frame, 60, 100));
  if (tagFade > 0.01) {
    const fullTag = 'Code-Generated 2D Animation Studio';
    const charCount = Math.floor(fullTag.length * smoothstep(progress(frame, 65, 120)));
    ctx.save();
    ctx.globalAlpha = tagFade;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `300 28px Arial`;
    ctx.fillStyle = '#a78bfa';
    ctx.shadowColor = 'rgba(167,139,250,0.6)';
    ctx.shadowBlur = 14;
    ctx.fillText(fullTag.slice(0, charCount), W/2, H*0.5);
    ctx.restore();
  }

  const ruleFade = smoothstep(progress(frame, 85, 115));
  if (ruleFade > 0.01) {
    ctx.save();
    ctx.globalAlpha = ruleFade * 0.6;
    const ruleY = H * 0.535;
    const ruleW = 320 * smoothstep(progress(frame, 90, 125));
    const ruleGrd = ctx.createLinearGradient(W/2-ruleW/2, ruleY, W/2+ruleW/2, ruleY);
    ruleGrd.addColorStop(0, 'transparent');
    ruleGrd.addColorStop(0.5, '#8b5cf6');
    ruleGrd.addColorStop(1, 'transparent');
    ctx.strokeStyle = ruleGrd;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W/2 - ruleW/2, ruleY);
    ctx.lineTo(W/2 + ruleW/2, ruleY);
    ctx.stroke();
    ctx.restore();
  }

  const badgeFade = smoothstep(progress(frame, 100, 140));
  if (badgeFade > 0.01) {
    ctx.save();
    ctx.globalAlpha = badgeFade;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `400 20px Arial`;
    ctx.fillStyle = 'rgba(196,181,253,0.55)';
    ctx.fillText('v1.0  •  720 × 1280  •  30 fps', W/2, H*0.575);
    ctx.restore();
  }

  const fadeOut = smoothstep(progress(frame, 150, 180));
  if (fadeOut > 0.01) {
    ctx.save();
    ctx.globalAlpha = fadeOut * 0.95;
    ctx.fillStyle = '#05030f';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
