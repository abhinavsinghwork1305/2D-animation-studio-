/**
 * StoryForge – export.js
 * Server-side renderer. Keeps the original logo scene (renderFrame)
 * and adds story-aware rendering (renderStoryFrameNode / prepareStory).
 */

import { createCanvas } from 'canvas';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parseScript, totalDuration } from './story-parser.js';

export const SCENE = {
  width: 720,
  height: 1280,
  fps: 30,
  totalFrames: 1800,
};

const clamp01 = (t) => Math.max(0, Math.min(1, t));
const smoothstep = (t) => t * t * (3 - 2 * t);
const progress = (frame, start, end) =>
  clamp01((frame - start) / (end - start));

// ── Original logo-scene renderer ─────────────────────────────────────────────

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

// ── Story-aware renderer helpers (Node-compatible, no browser imports) ────────

const TAU = Math.PI * 2;
const tHex = (hex, d) => {
  const n = parseInt(hex.replace('#',''), 16), cap = v => v<0?0:v>255?255:v;
  return `rgb(${cap(((n>>16)&255)+d)},${cap(((n>>8)&255)+d)},${cap((n&255)+d)})`;
};
const BGP = {
  meadow:{s0:'#7ec8e3',s1:'#c8e6f5',g:'#4caf50',a:'#ffe082',m:false},
  sunset:{s0:'#e64a19',s1:'#ff8f00',g:'#6d4c41',a:'#fff176',m:false},
  night :{s0:'#0a1628',s1:'#1c2f4a',g:'#1a2340',a:'#b0c4de',m:true },
  storm :{s0:'#455a64',s1:'#607d8b',g:'#4e342e',a:'#eceff1',m:false},
  dawn  :{s0:'#ffe0b2',s1:'#fffde7',g:'#8d6e63',a:'#fff8e1',m:false},
};

function nBG(ctx, theme, lf, W, H) {
  const p=BGP[theme]||BGP.meadow, sg=ctx.createLinearGradient(0,0,0,H*0.70);
  sg.addColorStop(0,p.s0); sg.addColorStop(1,p.s1); ctx.fillStyle=sg; ctx.fillRect(0,0,W,H);
  if(p.m){
    for(let si=0;si<80;si++){const s1=(si*2654435761)>>>0,sx=((s1&0xffff)/65535)*W,sy=(((s1>>16)&0xffff)/65535)*H*0.65,sr=0.5+((si*1664525>>>0)&15)/15*1.5,tw=0.5+0.5*Math.sin(lf*0.05+si*0.7);ctx.fillStyle=`rgba(255,255,210,${(0.35+0.65*tw).toFixed(2)})`;ctx.beginPath();ctx.arc(sx,sy,sr,0,TAU);ctx.fill();}
    ctx.save();ctx.fillStyle='#fff9c4';ctx.shadowColor='#fff9c4';ctx.shadowBlur=30;ctx.beginPath();ctx.arc(W*0.78,H*0.11,34,0,TAU);ctx.fill();ctx.shadowBlur=0;ctx.restore();
  } else {
    const sy2=H*0.11+Math.sin((lf/400)*TAU)*4;ctx.save();ctx.fillStyle=p.a;ctx.shadowColor=p.a;ctx.shadowBlur=38;ctx.beginPath();ctx.arc(W*0.80,sy2,(theme==='sunset'?54:40),0,TAU);ctx.fill();ctx.shadowBlur=0;ctx.restore();
  }
  const cOff=(lf*0.22)%(W+220);ctx.save();ctx.fillStyle=theme==='storm'?'rgba(78,78,88,0.75)':'rgba(255,255,255,0.80)';
  for(let ci=0;ci<3;ci++){const cx=((ci*260+60+W-cOff)%(W+220))-110,cy=H*0.17+ci*48,cr=48+ci*14;ctx.beginPath();ctx.arc(cx,cy,cr*0.62,0,TAU);ctx.arc(cx+cr*0.58,cy-7,cr*0.78,0,TAU);ctx.arc(cx+cr*1.18,cy,cr*0.58,0,TAU);ctx.fill();}
  ctx.restore();
  const gY=H*0.72;ctx.save();ctx.fillStyle=p.g;ctx.beginPath();ctx.moveTo(0,gY+28);for(let gx=0;gx<=W;gx+=4)ctx.lineTo(gx,gY+Math.sin(gx*0.011+lf*0.004)*20+20);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
  const lg=ctx.createLinearGradient(0,gY+48,0,H);lg.addColorStop(0,p.g);lg.addColorStop(1,tHex(p.g,-35));ctx.fillStyle=lg;ctx.fillRect(0,gY+48,W,H);ctx.restore();
  const lc=theme==='night'?'#1b2a1a':theme==='storm'?'#3a3f44':'#2e7d32';ctx.save();
  [0.07,0.17,0.77,0.87,0.94].forEach((rx,ti)=>{const tx=rx*W,ty=gY+12+Math.sin(ti*1.4)*10,th=78+(ti%3)*18;ctx.fillStyle='#4e342e';ctx.fillRect(tx-5,ty-th,10,th);ctx.fillStyle=lc;ctx.beginPath();ctx.arc(tx,ty-th-18,28+(ti%2)*11,0,TAU);ctx.fill();});ctx.restore();
}

const CD=[{skin:'#f5c5a3',shirt:'#c62828',pant:'#1a237e',rx:0.35},{skin:'#d4a574',shirt:'#2e7d32',pant:'#4a148c',rx:0.65}];

function nCh(ctx,x,y,sc,fr,mood,act,dir,skin,shirt,pant){
  ctx.save();ctx.translate(x,y);ctx.scale((dir||1)*sc,sc);
  const BH=88,HR=16,NH=10,LH=58,BW=34,AL=48,SX=20;let bob=0,lL=0,rL=0,lA=0,rA=0,jY=0,tk=0;
  const pw=(f,p2)=>Math.sin((f/p2)*TAU),os2=(f,p2)=>0.5+0.5*Math.sin((f/p2)*TAU);
  if(act==='walk'){bob=pw(fr,15)*4;lL=pw(fr,15)*0.52;rL=-lL;lA=-lL*0.6;rA=lL*0.6;}else if(act==='run'){bob=-Math.abs(pw(fr,10))*5;lL=pw(fr,10)*0.87;rL=-lL;lA=-lL*0.8;rA=lL*0.8;}else if(act==='jump'){jY=-Math.abs(pw(fr,30))*42;lA=-0.6;rA=-0.6;}else if(act==='talk'){bob=pw(fr,40)*2;tk=os2(fr,8)*0.55;rA=pw(fr,38)*0.22;}else{bob=pw(fr,60)*3;lA=pw(fr,90)*0.08;rA=-lA;}
  const bY=jY,tY=bY-LH-BH,hY=tY-NH-HR+bob;
  [[lL,-BW/4],[rL,BW/4]].forEach(([ang,ox],li)=>{ctx.save();ctx.translate(ox,bY-LH/2+bob/2);ctx.rotate(ang);ctx.fillStyle=li===0?pant:tHex(pant,18);ctx.beginPath();ctx.roundRect(-6,-LH/2,12,LH,4);ctx.fill();ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.ellipse(0,LH/2,9,5,0,0,TAU);ctx.fill();ctx.restore();});
  ctx.fillStyle=shirt;ctx.beginPath();ctx.roundRect(-BW/2,tY+bob,BW,BH,7);ctx.fill();
  [[lA,-SX],[rA,SX]].forEach(([ang,ox])=>{ctx.save();ctx.translate(ox,tY+11+bob);ctx.rotate(ang);ctx.fillStyle=skin;ctx.beginPath();ctx.roundRect(-4,0,9,AL,4);ctx.fill();ctx.restore();});
  ctx.fillStyle=skin;ctx.beginPath();ctx.arc(0,hY,HR,0,TAU);ctx.fill();
  ctx.fillStyle='#3e2723';ctx.beginPath();ctx.arc(0,hY,HR,Math.PI,TAU);ctx.fill();ctx.beginPath();ctx.arc(0,hY-HR+3,HR+4,Math.PI*1.08,TAU*0.94);ctx.fill();
  const eY=hY-3,blH=os2(fr,120)>0.96?1:(mood==='sad'?2.5:6);ctx.fillStyle='#1a1a2e';[-7,7].forEach(ex=>{ctx.beginPath();ctx.ellipse(ex,eY,3.5,blH/2,0,0,TAU);ctx.fill();});
  const bt=mood==='sad'?0.3:mood==='tense'?-0.28:mood==='excited'?-0.15:0;ctx.strokeStyle='#4e342e';ctx.lineWidth=2.2;[-7,7].forEach((ex,bi)=>{ctx.save();ctx.translate(ex,eY-7);ctx.rotate(bt*(bi===0?1:-1));ctx.beginPath();ctx.moveTo(-4.5,0);ctx.lineTo(4.5,0);ctx.stroke();ctx.restore();});
  const mY=hY+9;ctx.lineWidth=2;ctx.strokeStyle='#9a4a2a';ctx.beginPath();if(tk>0.08){ctx.ellipse(0,mY+2,6,5*tk,0,0,Math.PI);ctx.stroke();ctx.fillStyle='#7a0000';ctx.fill();}else{const sd=(mood==='happy'||mood==='excited')?1:mood==='sad'?-1:0;ctx.moveTo(-6,mY);ctx.quadraticCurveTo(0,mY+sd*5,6,mY);ctx.stroke();}
  ctx.restore();
}

function nSub(ctx,text,W,H,alpha){if(!text||alpha<=0)return;const PAD=20,BH=70,ry=H-BH-24;ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='rgba(0,0,0,0.60)';ctx.beginPath();ctx.roundRect(PAD,ry,W-PAD*2,BH,10);ctx.fill();ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='rgba(0,0,0,0.9)';ctx.shadowBlur=5;ctx.font='500 21px Arial';const maxW=W-PAD*2-20,words=text.split(' ').filter(Boolean);let lines=[],cur='';words.forEach(w=>{const t=cur?cur+' '+w:w;if(ctx.measureText(t).width>maxW&&cur){lines.push(cur);cur=w;}else cur=t;});if(cur)lines.push(cur);if(lines.length>2)lines=lines.slice(0,2);const lh=BH/(lines.length+1);lines.forEach((ln,i)=>ctx.fillText(ln,W/2,ry+lh*(i+1)));ctx.restore();}

function scAt(scenes,f){for(let i=0;i<scenes.length;i++){if(f<scenes[i].endFrame)return scenes[i];}return scenes[scenes.length-1];}
function c01(v){return v<0?0:v>1?1:v;}

/** Render a story frame in Node. */
export function renderStoryFrameNode(ctx, frame, scenes) {
  const W=SCENE.width,H=SCENE.height;
  if(!scenes||!scenes.length){ctx.fillStyle='#0a0a0f';ctx.fillRect(0,0,W,H);return;}
  const sc=scAt(scenes,frame),lf=frame-sc.startFrame,tot=sc.endFrame-sc.startFrame;
  const pct=tot>0?lf/tot:0,panX=(sc.index%2===0?1:-1)*20*pct,zoom=1+0.04*Math.sin(pct*Math.PI);
  const inE=Math.min(20,Math.floor(tot*0.15)),outS=Math.max(tot-20,Math.floor(tot*0.85));
  let ta=1;if(lf<inE)ta=lf/inE;else if(lf>outS)ta=1-(lf-outS)/(tot-outS);ta=c01(ta);
  ctx.clearRect(0,0,W,H);ctx.save();ctx.translate(W/2+panX,H/2);ctx.scale(zoom,zoom);ctx.translate(-W/2,-H/2);
  nBG(ctx,sc.background||'meadow',lf,W,H);
  const nC=Math.min(CD.length,sc.index+1),gY=H*0.72+170;
  for(let ci=0;ci<nC;ci++){const cc=CD[ci],rxF=nC===1?0.50:cc.rx;const pickA=(m,f)=>m==='excited'?f%60<30?'run':'jump':m==='tense'?'run':m==='happy'?f%90<45?'walk':'talk':f%100<50?'idle':'talk';nCh(ctx,rxF*W,gY,1.1,lf,sc.mood,pickA(sc.mood,lf),ci===0?1:-1,cc.skin,cc.shirt,cc.pant);}
  ctx.fillStyle='rgba(0,0,0,0.42)';ctx.fillRect(0,0,W,70);ctx.fillStyle='#e0d0ff';ctx.font='bold 24px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(sc.heading.substring(0,50),W/2,35);
  ctx.restore();
  if(ta<0.98){ctx.save();ctx.globalAlpha=1-ta;ctx.fillStyle='#000000';ctx.fillRect(0,0,W,H);ctx.restore();}
  const ws=sc.fullText.split(' ').filter(Boolean);let subT=sc.heading;if(ws.length){const wi=Math.floor(pct*ws.length),st=Math.floor(wi/8)*8;subT=ws.slice(st,st+8).join(' ');}
  nSub(ctx,subT,W,H,ta);
}

/** Parse a script and return scenes + totalFrames ready for export. */
export function prepareStory(scriptText) {
  const scenes=parseScript(scriptText,SCENE.fps),dur=totalDuration(scenes);
  return { scenes, totalFrames: Math.round(dur*SCENE.fps) };
}
