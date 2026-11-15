// StoryForge – char-draw.js
// Draws a 2D animated character and subtitle bar on a Canvas context.

var PI2 = Math.PI * 2;

function toneAdjust(hex, d) {
  var n = parseInt(hex.slice(1), 16);
  var cap = function(v) { return v < 0 ? 0 : v > 255 ? 255 : v; };
  return 'rgb(' + cap(((n>>16)&255)+d) + ',' + cap(((n>>8)&255)+d) + ',' + cap((n&255)+d) + ')';
}

function wave(f, p) { return Math.sin((f / p) * PI2); }
function pulse(f, p) { return 0.5 + 0.5 * Math.sin((f / p) * PI2); }

export function drawCharacter(ctx, x, y, sc, fr, mood, act, dir, skin, shirt, pant) {
  sc = sc || 1; fr = fr || 0; mood = mood || 'calm'; act = act || 'idle'; dir = dir || 1;
  skin = skin || '#f5c5a3'; shirt = shirt || '#5c6bc0'; pant = pant || '#37474f';

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * sc, sc);

  var BH = 88, HR = 16, NH = 10, LH = 58, BW = 34, AL = 48, SX = 20;
  var bob = 0, lL = 0, rL = 0, lA = 0, rA = 0, jY = 0, tk = 0;

  if (act === 'walk') {
    bob = wave(fr, 15) * 4; lL = wave(fr, 15) * 0.52; rL = -lL; lA = -lL * 0.6; rA = lL * 0.6;
  } else if (act === 'run') {
    bob = -Math.abs(wave(fr, 10)) * 5; lL = wave(fr, 10) * 0.87; rL = -lL; lA = -lL * 0.8; rA = lL * 0.8;
  } else if (act === 'jump') {
    jY = -Math.abs(wave(fr, 30)) * 42; lA = -0.6; rA = -0.6;
  } else if (act === 'talk') {
    bob = wave(fr, 40) * 2; tk = pulse(fr, 8) * 0.55; rA = wave(fr, 38) * 0.22;
  } else {
    bob = wave(fr, 60) * 3; lA = wave(fr, 90) * 0.08; rA = -lA;
  }

  var bY = jY, tY = bY - LH - BH, hY = tY - NH - HR + bob;

  [[lL, -BW/4],[rL, BW/4]].forEach(function(pair, li) {
    ctx.save(); ctx.translate(pair[1], bY - LH/2 + bob/2); ctx.rotate(pair[0]);
    ctx.fillStyle = li === 0 ? pant : toneAdjust(pant, 18);
    ctx.beginPath(); ctx.roundRect(-6, -LH/2, 12, LH, 4); ctx.fill();
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.ellipse(0, LH/2, 9, 5, 0, 0, PI2); ctx.fill();
    ctx.restore();
  });

  ctx.fillStyle = shirt; ctx.beginPath(); ctx.roundRect(-BW/2, tY+bob, BW, BH, 7); ctx.fill();

  [[lA,-SX],[rA,SX]].forEach(function(pair) {
    ctx.save(); ctx.translate(pair[1], tY+11+bob); ctx.rotate(pair[0]);
    ctx.fillStyle = skin; ctx.beginPath(); ctx.roundRect(-4, 0, 9, AL, 4); ctx.fill();
    ctx.restore();
  });

  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, hY, HR, 0, PI2); ctx.fill();
  ctx.fillStyle = '#3e2723'; ctx.beginPath(); ctx.arc(0, hY, HR, Math.PI, PI2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, hY-HR+3, HR+4, Math.PI*1.08, PI2*0.94); ctx.fill();

  var eY = hY - 3;
  var blH = pulse(fr, 120) > 0.96 ? 1 : (mood === 'sad' ? 2.5 : 6);
  ctx.fillStyle = '#1a1a2e';
  [-7, 7].forEach(function(ex) { ctx.beginPath(); ctx.ellipse(ex, eY, 3.5, blH/2, 0, 0, PI2); ctx.fill(); });

  var bt = mood === 'sad' ? 0.3 : mood === 'tense' ? -0.28 : mood === 'excited' ? -0.15 : 0;
  ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 2.2;
  [-7, 7].forEach(function(ex, bi) {
    ctx.save(); ctx.translate(ex, eY-7); ctx.rotate(bt * (bi===0?1:-1));
    ctx.beginPath(); ctx.moveTo(-4.5, 0); ctx.lineTo(4.5, 0); ctx.stroke(); ctx.restore();
  });

  var mY = hY + 9;
  ctx.lineWidth = 2; ctx.strokeStyle = '#9a4a2a'; ctx.beginPath();
  if (tk > 0.08) {
    ctx.ellipse(0, mY+2, 6, 5*tk, 0, 0, Math.PI); ctx.stroke(); ctx.fillStyle = '#7a0000'; ctx.fill();
  } else {
    var sd = (mood === 'happy' || mood === 'excited') ? 1 : mood === 'sad' ? -1 : 0;
    ctx.moveTo(-6, mY); ctx.quadraticCurveTo(0, mY+sd*5, 6, mY); ctx.stroke();
  }
  ctx.restore();
}

export function drawSubtitle(ctx, text, W, H, alpha) {
  if (!text) return;
  alpha = (alpha === undefined) ? 1 : alpha;
  if (alpha <= 0) return;
  var PAD = 20, BH = 70, ry = H - BH - 24;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,0.60)';
  ctx.beginPath(); ctx.roundRect(PAD, ry, W - PAD*2, BH, 10); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 5;
  ctx.font = "500 21px 'Segoe UI', Arial, sans-serif";
  var maxW = W - PAD*2 - 20, words = text.split(' '), lines = [], cur = '';
  words.forEach(function(w) {
    var t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) {
      lines.push(cur); cur = w;
    } else { cur = t; }
  });
  if (cur) lines.push(cur);
  if (lines.length > 2) lines = lines.slice(0, 2);
  var lh = BH / (lines.length + 1);
  lines.forEach(function(ln, i) { ctx.fillText(ln, W/2, ry + lh*(i+1)); });
  ctx.restore();
}
