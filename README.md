# StoryForge – Code-Generated 2D Animation Studio

A lightweight, Node.js-powered 2D animation studio that renders polished
vertical scenes (720 × 1280) and exports them as MP4 files.

---

## Project structure

```
storyforge/
├── index.html          # Browser preview page
├── package.json        # NPM config + scripts
├── vite.config.js      # Vite dev-server config
├── src/
│   ├── main.js         # Browser animation loop (canvas)
│   ├── scene.js        # Scene definition – browser version
│   └── export.js       # Scene definition – Node / export version
├── scripts/
│   └── export-mp4.js   # Export pipeline (node-canvas + FFmpeg)
└── dist/
    └── storyforge.mp4  # Generated after `npm run export`
```

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | ≥ 18 | https://nodejs.org |
| **npm** | ≥ 9 | bundled with Node |
| **FFmpeg** | any recent | must be on PATH |

### Install FFmpeg

- **macOS** (Homebrew): `brew install ffmpeg`
- **Ubuntu/Debian**: `sudo apt install ffmpeg`
- **Windows**: download from https://ffmpeg.org/download.html and add to PATH

---

## Setup

```bash
# 1. Install Node dependencies
npm install

# 2. Start the browser preview (live canvas animation)
npm run dev
#    Open http://localhost:3000

# 3. Export the scene as an MP4
npm run export
#    Output: dist/storyforge.mp4
```

---

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server with live canvas preview |
| `npm run build` | Build static site to `dist/` |
| `npm run preview` | Preview the built site locally |
| `npm run export` | Render all 180 frames + encode `dist/storyforge.mp4` |
| `npm test` | Smoke test – renders 10 frames only, no MP4 |

---

## Scene specification

| Property | Value |
|----------|-------|
| Resolution | 720 × 1280 (vertical / portrait) |
| Frame rate | 30 fps |
| Duration | 6 seconds (180 frames, seamless loop) |
| Format | H.264 MP4, yuv420p, CRF 18 |

### Animation timeline

| Frames | Element |
|--------|---------|
| 0 – 50 | Star field + nebula fade in |
| 30 – 90 | "STORYFORGE" logo draws on with purple glow |
| 60 – 120 | Tagline types in letter by letter |
| 85 – 125 | Decorative rule extends |
| 100 – 140 | Version badge fades in |
| 150 – 180 | Full scene fades out before loop restart |

---

## Remaining manual steps

1. **Install FFmpeg** (see Prerequisites above) – required for `npm run export`.
2. Run `npm install` once to fetch `canvas` and `fluent-ffmpeg`.
3. On Linux, `canvas` may need system libraries: `sudo apt install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`
4. The exported MP4 (`dist/storyforge.mp4`) is git-ignored. Play it in any modern media player.
