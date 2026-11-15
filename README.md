# StoryForge v2 – Script-to-Animated-Video Studio

A beginner-friendly, Node.js-powered 2D animation studio.
Paste a story script, upload a voice-over, and export a fully-animated
vertical 720 x 1280 MP4 — no paid AI services required.

---

## What it does

1. **Script parser** — splits any plain-text story into scenes automatically.
2. **Background painter** — five animated themes (meadow, sunset, night, storm, dawn).
3. **Animated characters** — 2D cartoon characters with walk, run, jump, talk and idle cycles.
4. **Subtitles** — word-by-word subtitle bar synced to scene progress.
5. **Camera movement** — per-scene pan and zoom.
6. **Scene transitions** — smooth fade in/out between every scene.
7. **Audio mixing** — optional voice-over mixed into the MP4 via FFmpeg.
8. **Dashboard** — browser UI with script input, audio upload, scene list and export commands.

---

## Project layout

```
storyforge/
├── index.html              # Dashboard (browser UI)
├── package.json            # NPM scripts
├── vite.config.js          # Vite dev-server config
├── src/
│   ├── main.js             # Browser entry point + dashboard wiring
│   ├── scene.js            # Original logo animation (browser)
│   ├── story-parser.js     # Splits script into scene objects
│   ├── bg-draw.js          # Animated background themes
│   ├── char-draw.js        # 2D character + subtitle renderer
│   ├── scene-renderer.js   # Composes a full story frame (browser)
│   └── export.js           # Node-side renderer (story + logo)
├── scripts/
│   └── export-mp4.js       # Renders frames and stitches MP4
├── samples/
│   ├── episode1.txt        # Sample story: The Lost Key
│   ├── episode2.txt        # Sample story: The Storm Cloud
│   └── episode3.txt        # Sample story: The Brave Little Star
└── dist/
    └── *.mp4               # Generated MP4 files (git-ignored)
```

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18 or later | nodejs.org |
| npm | 9 or later | bundled with Node |
| FFmpeg | any recent | must be on your PATH |

**Install FFmpeg:**

- macOS (Homebrew): `brew install ffmpeg`
- Ubuntu/Debian: `sudo apt install ffmpeg`
- Windows: download from ffmpeg.org and add the `bin` folder to your PATH.

---

## Setup

```bash
npm install
```

On Linux, the `canvas` package needs system libraries:

```bash
sudo apt install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

---

## Browser dashboard

```bash
npm run dev
```

Open http://localhost:5173 in your browser. You will see:

- **Script** box — paste your story or load one of the sample episodes.
- **Parse Script** — splits the text into scenes and starts the animated preview.
- **Voice-over Audio** — drag-and-drop or click to load an MP3/WAV for preview.
- **Scenes list** — click any scene to jump to it.
- **Playback controls** — Pause, Restart, Prev Scene, Next Scene.
- **Export** section — shows the terminal commands to run for final MP4 export.

---

## Exporting MP4s

### Pre-made sample episodes (no audio)

```bash
npm run export:ep1    # dist/episode1.mp4  (~60 s)
npm run export:ep2    # dist/episode2.mp4  (~60 s)
npm run export:ep3    # dist/episode3.mp4  (~60 s)

# Export all three at once
npm run export:all
```

### Your own script

```bash
node scripts/export-mp4.js --script path/to/story.txt --out dist/my-episode.mp4
```

### Your own script + voice-over audio

```bash
node scripts/export-mp4.js --script path/to/story.txt --audio path/to/voice.mp3 --out dist/my-episode.mp4
```

The exporter will:
1. Parse the script into scenes.
2. Render every frame at 30 fps to a temporary `frames/` folder.
3. Stitch the frames into a 720 x 1280 H.264 MP4 via FFmpeg.
4. If `--audio` is supplied, mix it into the video track.
5. Delete the temporary frame files and report the output path.

---

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server — open http://localhost:5173 |
| `npm run build` | Build static site to dist/ |
| `npm run export` | Logo scene — dist/storyforge.mp4 |
| `npm run export:ep1` | Episode 1 — dist/episode1.mp4 |
| `npm run export:ep2` | Episode 2 — dist/episode2.mp4 |
| `npm run export:ep3` | Episode 3 — dist/episode3.mp4 |
| `npm run export:all` | All three episodes |
| `npm test` | Smoke test (10 frames, no encode) |
| `npm run test:ep1` | Smoke test episode 1 |

---

## Output specification

| Property | Value |
|----------|-------|
| Resolution | 720 x 1280 (vertical portrait) |
| Frame rate | 30 fps |
| Duration | ~60 s (depends on script length) |
| Codec | H.264 |
| Pixel format | yuv420p |
| Quality | CRF 18 (near lossless) |

---

## Reusing for future episodes

1. Create a new `.txt` file in `samples/` with your story.
2. Separate each scene with a `SCENE N:` heading or two blank lines.
3. Run: `node scripts/export-mp4.js --script samples/my-story.txt --out dist/my-story.mp4`
4. Add an audio file with `--audio path/to/voice.mp3` for narration.

No code changes are required for new content.

---

## Remaining manual steps / API keys

**No API keys are needed.** All animation is generated with the Canvas 2D API.

1. **FFmpeg** must be installed on your machine (see Prerequisites).
2. **node-canvas** needs system libraries on Linux (see Setup).
3. **Voice-over audio** must be recorded separately (Audacity, your phone, etc.)
   and provided via the `--audio` flag or uploaded in the dashboard for preview.
4. **Background music / sound effects** can be added by passing a mixed audio file
   that already includes music behind the narration.

The exported MP4 files in `dist/` are git-ignored. Play them in VLC, QuickTime, or any media player.
