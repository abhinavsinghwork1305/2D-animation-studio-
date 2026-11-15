/**
 * StoryForge – Polished animated scene definition
 * Vertical 720 × 1280 px | 30 fps | 180 frames (~6 s loop)
 *
 * Scene breakdown:
 *  0–30   : Deep-space background + star field fades in
 *  0–60   : Particle nebula drifts upward
 *  30–90  : "STORYFORGE" logo draws on with glow
 *  60–120 : Subtitle types in letter-by-letter
 *  90–150 : Shimmer pulse around logo
 *  150–180: Everything gently fades out before loop restart
 */

export const SCENE = {
  width: 720,
  height: 1280,
  fps: 30,
  totalFrames: 180,
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Clamp t to [0,1] */
const clamp01 = (t) => Math.max(0, Math.min(1, t));

/** Linear interpolation */
const lerp = (a, b, t) => a + (b - a) * clamp01(t);

/** Smooth-step easing */
const smoothstep = (t) => t * t * (3 - 2 * t);

/** Map frame range to 0→1 progress */
const progress = (frame, start, end) =>
  clamp01((frame - start) / (end - start));

// ── Star field ─────────────────────────────────────────────────────────────

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

// ── Nebula particles ───────────────────────────────────────────────────────

const NEBULA_COUNT = 70;
const nebulaParticles = Array.from({ length: NEBULA_COUNT }, (_, i) => {
  const seed = (i * 1664525 + 1013904223) >>> 0;
  return {
    x: 60 + ((seed & 0xffff) / 0xffff) * 600,
    baseY: 700 + (((seed >> 16) & 0xffff) / 0xffff) * 400,
    r: 3 + ((seed & 0x1f) / 31) * 22,
    hue: 240 + ((seed & 0x3f) / 63) * 80, // indigo→violet
    alpha: 0.03 + ((seed & 0x0f) / 15) * 0.09,
    riseSpeed: 0.4 + ((seed & 0x07) / 7) * 0.6,
  };
});

// ── Main render function ───────────────────────────────────────────────────

/**
 * Render a single frame onto the provided 2D canvas context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} frame  0-indexed frame number
 */
export function renderFrame(ctx, frame) {
  const { width: W, height: H } = SCENE;
  const t = frame / SCENE.totalFrames; // 0→1 over full loop

  // ── 1. Background gradient ───────────────────────────────────────────────
  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#05030f');
  bg.addColorStop(0.5, '#0d0520');
  bg.addColorStop(1, '#020208');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── 2. Nebula blobs ──────────────────────────────────────────────────────
  const nebulaFade = smoothstep(progress(frame, 0, 40));
  ctx.save();
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
  ctx.restore();

  // ── 3. Star field ────────────────────────────────────────────────────────
  const starFade = smoothstep(progress(frame, 0, 50));
  ctx.save();
  stars.forEach((s) => {
    const twinkle =
      0.5 +
      0.5 *
        Math.sin(
          (frame * s.speed + s.twinkleOffset * Math.PI * 2) * 2
        );
    const alpha = starFade * (0.4 + 0.6 * twinkle);
    ctx.fillStyle = `rgba(210,210,255,${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // ── 4. Logo glow halo ────────────────────────────────────────────────────
  const logoFade = smoothstep(progress(frame, 30, 90));
  const shimmer =
    1 + 0.06 * Math.sin((frame / SCENE.totalFrames) * Math.PI * 8);
  if (logoFade > 0.01) {
    ctx.save();
    const haloGrd = ctx.createRadialGradient(
      W / 2, H * 0.38, 0,
      W / 2, H * 0.38, 260 * shimmer
    );
    haloGrd.addColorStop(0, `rgba(139,92,246,${0.18 * logoFade})`);
    haloGrd.addColorStop(0.5, `rgba(109,40,217,${0.08 * logoFade})`);
    haloGrd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = haloGrd;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // ── 5. Logo text ─────────────────────────────────────────────────────────
  if (logoFade > 0.01) {
    ctx.save();
    ctx.globalAlpha = logoFade;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outer glow pass
    ctx.font = `bold 94px 'Arial Black', 'Arial', sans-serif`;
    ctx.shadowColor = `hsl(263,90%,65%)`;
    ctx.shadowBlur = 48 * shimmer;
    ctx.fillStyle = '#c4b5fd';
    ctx.fillText('STORY', W / 2, H * 0.355);
    ctx.fillText('FORGE', W / 2, H * 0.415);

    // Crisp inner pass
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ede9fe';
    ctx.fillText('STORY', W / 2, H * 0.355);
    ctx.fillText('FORGE', W / 2, H * 0.415);

    ctx.restore();
  }

  // ── 6. Tagline typed in ──────────────────────────────────────────────────
  const tagFade = smoothstep(progress(frame, 60, 100));
  if (tagFade > 0.01) {
    const fullTag = 'Code-Generated 2D Animation Studio';
    const charCount = Math.floor(
      fullTag.length * smoothstep(progress(frame, 65, 120))
    );
    const tagText = fullTag.slice(0, charCount);

    ctx.save();
    ctx.globalAlpha = tagFade;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `300 28px 'Arial', sans-serif`;
    ctx.fillStyle = '#a78bfa';
    ctx.shadowColor = 'rgba(167,139,250,0.6)';
    ctx.shadowBlur = 14;
    ctx.fillText(tagText, W / 2, H * 0.5);
    ctx.restore();
  }

  // ── 7. Decorative horizontal rule ────────────────────────────────────────
  const ruleFade = smoothstep(progress(frame, 85, 115));
  if (ruleFade > 0.01) {
    ctx.save();
    ctx.globalAlpha = ruleFade * 0.6;
    const ruleY = H * 0.535;
    const ruleW = 320 * smoothstep(progress(frame, 90, 125));
    const ruleGrd = ctx.createLinearGradient(
      W / 2 - ruleW / 2, ruleY,
      W / 2 + ruleW / 2, ruleY
    );
    ruleGrd.addColorStop(0, 'transparent');
    ruleGrd.addColorStop(0.5, '#8b5cf6');
    ruleGrd.addColorStop(1, 'transparent');
    ctx.strokeStyle = ruleGrd;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - ruleW / 2, ruleY);
    ctx.lineTo(W / 2 + ruleW / 2, ruleY);
    ctx.stroke();
    ctx.restore();
  }

  // ── 8. Version / badge ───────────────────────────────────────────────────
  const badgeFade = smoothstep(progress(frame, 100, 140));
  if (badgeFade > 0.01) {
    ctx.save();
    ctx.globalAlpha = badgeFade;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `400 20px 'Arial', monospace`;
    ctx.fillStyle = 'rgba(196,181,253,0.55)';
    ctx.fillText('v1.0  •  720 × 1280  •  30 fps', W / 2, H * 0.575);
    ctx.restore();
  }

  // ── 9. Global fade-out at end of loop ────────────────────────────────────
  const fadeOut = smoothstep(progress(frame, 150, 180));
  if (fadeOut > 0.01) {
    ctx.save();
    ctx.globalAlpha = fadeOut * 0.95;
    ctx.fillStyle = '#05030f';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
