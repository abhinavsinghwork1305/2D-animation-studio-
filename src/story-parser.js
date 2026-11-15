// StoryForge – story-parser.js
// Splits a plain-text script into scene data objects.

var BREAK_LINE_RE = /^(\s*[-*]{3,}\s*$|scene\s*\d*[:\-\s]|^\[scene|\[chapter)/i;

var MOOD_MAP = {
  excited : ['adventure','amazing','wow','fantastic','rush','burst','fly','zoom','leap','thrill'],
  happy   : ['happy','joy','laugh','smile','cheer','love','wonderful','celebrate','delight','fun'],
  sad     : ['sad','cry','tear','lost','alone','dark','miss','grief','sorrow','lonely','afraid'],
  tense   : ['danger','run','chase','hide','fast','quick','hurry','panic','escape','trouble'],
  calm    : ['peace','quiet','soft','gentle','slow','rest','sleep','dream','serene','still'],
};

var BG_FOR_MOOD = {
  excited : 'sunset',
  happy   : 'meadow',
  sad     : 'night',
  tense   : 'storm',
  calm    : 'dawn',
};

function detectMood(text) {
  var lower = text.toLowerCase();
  var best = 'calm', bestScore = 0;
  var moods = Object.keys(MOOD_MAP);
  for (var mi = 0; mi < moods.length; mi++) {
    var words = MOOD_MAP[moods[mi]];
    var score = 0;
    for (var wi = 0; wi < words.length; wi++) {
      if (lower.indexOf(words[wi]) !== -1) score++;
    }
    if (score > bestScore) { bestScore = score; best = moods[mi]; }
  }
  return best;
}

function estimateSecs(text) {
  var wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.ceil((wordCount / 150) * 60) + 1);
}

/**
 * Parse a script string into scene objects.
 * @param {string} script
 * @param {number} fps
 * @returns {Array}
 */
export function parseScript(script, fps) {
  fps = fps || 30;
  if (!script || !script.trim()) return [];

  var rawBlocks = [];
  var current = [];
  var blankStreak = 0;

  function pushBlock() {
    var trimmed = current.join('\n').trim();
    if (trimmed.length > 0) rawBlocks.push(trimmed);
    current = [];
  }

  var scriptLines = script.split('\n');
  for (var li = 0; li < scriptLines.length; li++) {
    var line = scriptLines[li];
    var isBlank = line.trim() === '';
    var isBreak = BREAK_LINE_RE.test(line.trim());

    if (isBreak) {
      pushBlock();
      current.push(line);
      blankStreak = 0;
    } else if (isBlank) {
      blankStreak++;
      if (blankStreak >= 2) { pushBlock(); blankStreak = 0; }
      else current.push(line);
    } else {
      blankStreak = 0;
      current.push(line);
    }
  }
  pushBlock();

  if (rawBlocks.length === 0) rawBlocks.push(script.trim());

  var cursor = 0;
  return rawBlocks.map(function(block, idx) {
    var allLines  = block.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
    var heading   = allLines[0] || ('Scene ' + (idx + 1));
    var bodyLines = allLines.length > 1 ? allLines.slice(1) : allLines;
    var fullText  = bodyLines.join(' ');
    var mood      = detectMood(fullText);
    var dur       = estimateSecs(fullText);
    var start     = cursor;
    cursor       += dur;
    return {
      index: idx, heading: heading, lines: bodyLines, fullText: fullText,
      durationSec: dur, startSec: start, endSec: cursor,
      mood: mood, background: BG_FOR_MOOD[mood],
      startFrame: Math.round(start * fps),
      endFrame:   Math.round(cursor * fps),
    };
  });
}

export function totalDuration(scenes) {
  if (!scenes || !scenes.length) return 0;
  return scenes[scenes.length - 1].endSec;
}
