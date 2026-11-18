// StoryForge – background painter (Canvas 2D only, no images)

var TAU = Math.PI * 2;

function clampNum(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

function tintHex(hex, delta) {
  var n = parseInt(hex.replace('#', ''), 16);
  var r = clampNum(((n >> 16) & 255) + delta, 0, 255);
  var g = clampNum(((n >> 8)  & 255) + delta, 0, 255);
  var b = clampNum(( n        & 255) + delta, 0, 255);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

var PALETTES = {
  meadow : { sky0: '#7ec8e3', sky1: '#c8e6f5', groundFill: '#4caf50', accentCol: '#ffe082', useMoon: false },
  sunset : { sky0: '#e64a19', sky1: '#ff8f00', groundFill: '#6d4c41', accentCol: '#fff176', useMoon: false },
  night  : { sky0: '#0a1628', sky1: '#1c2f4a', groundFill: '#1a2340', accentCol: '#b0c4de', useMoon: true  },
  storm  : { sky0: '#455a64', sky1: '#607d8b', groundFill: '#4e342e', accentCol: '#eceff1', useMoon: false },
  dawn   : { sky0: '#ffe0b2', sky1: '#fffde7', groundFill: '#8d6e63', accentCol: '#fff8e1', useMoon: false },
};

export function drawBackground(ctx, theme, frame, W, H) {
  var pal = PALETTES[theme] || PALETTES.meadow;

  var skyG = ctx.createLinearGradient(0, 0, 0, H * 0.70);
  skyG.addColorStop(0, pal.sky0);
  skyG.addColorStop(1, pal.sky1);
  ctx.fillStyle = skyG;
  ctx.fillRect(0, 0, W, H);

  if (pal.useMoon) {
    for (var si = 0; si < 90; si++) {
      var seed1 = (si * 2654435761) >>> 0;
      var sx = ((seed1 & 0xffff) / 65535) * W;
      var sy = (((seed1 >> 16) & 0xffff) / 65535) * H * 0.65;
      var sr = 0.5 + ((si * 1664525 >>> 0) & 15) / 15 * 1.5;
      var tw = 0.5 + 0.5 * Math.sin(frame * 0.05 + si * 0.7);
      ctx.fillStyle = 'rgba(255,255,210,' + (0.35 + 0.65 * tw).toFixed(2) + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, TAU);
      ctx.fill();
    }
    ctx.save();
    ctx.fillStyle   = '#fff9c4';
    ctx.shadowColor = '#fff9c4';
    ctx.shadowBlur  = 30;
    ctx.beginPath();
    ctx.arc(W * 0.78, H * 0.11, 34, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  } else {
    var sunY = H * 0.11 + Math.sin((frame / 400) * TAU) * 4;
    ctx.save();
    ctx.fillStyle   = pal.accentCol;
    ctx.shadowColor = pal.accentCol;
    ctx.shadowBlur  = 38;
    ctx.beginPath();
    ctx.arc(W * 0.80, sunY, (theme === 'sunset' ? 54 : 40), 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  var cloudColor = theme === 'storm' ? 'rgba(78,78,88,0.75)' : 'rgba(255,255,255,0.80)';
  var cOff = (frame * 0.22) % (W + 220);
  ctx.save();
  ctx.fillStyle = cloudColor;
  for (var ci = 0; ci < 3; ci++) {
    var cx = ((ci * 260 + 60 + W - cOff) % (W + 220)) - 110;
    var cy = H * 0.17 + ci * 48;
    var cr = 48 + ci * 14;
    ctx.beginPath();
    ctx.arc(cx,              cy,       cr * 0.62, 0, TAU);
    ctx.arc(cx + cr * 0.58,  cy - 7,  cr * 0.78, 0, TAU);
    ctx.arc(cx + cr * 1.18,  cy,      cr * 0.58, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  var groundY = H * 0.72;
  ctx.save();
  ctx.fillStyle = pal.groundFill;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 28);
  for (var gx = 0; gx <= W; gx += 4) {
    ctx.lineTo(gx, groundY + Math.sin(gx * 0.011 + frame * 0.004) * 20 + 20);
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  var lowerG = ctx.createLinearGradient(0, groundY + 48, 0, H);
  lowerG.addColorStop(0, pal.groundFill);
  lowerG.addColorStop(1, tintHex(pal.groundFill, -35));
  ctx.fillStyle = lowerG;
  ctx.fillRect(0, groundY + 48, W, H);
  ctx.restore();

  var leafCol  = theme === 'night' ? '#1b2a1a' : theme === 'storm' ? '#3a3f44' : '#2e7d32';
  var trunkCol = '#4e342e';
  ctx.save();
  var treeXR = [0.07, 0.17, 0.77, 0.87, 0.94];
  for (var ti = 0; ti < treeXR.length; ti++) {
    var tx = treeXR[ti] * W;
    var ty = groundY + 12 + Math.sin(ti * 1.4) * 10;
    var th = 78 + (ti % 3) * 18;
    ctx.fillStyle = trunkCol;
    ctx.fillRect(tx - 5, ty - th, 10, th);
    ctx.fillStyle = leafCol;
    ctx.beginPath();
    ctx.arc(tx, ty - th - 18, 28 + (ti % 2) * 11, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
