# ◈ SoundViz — Music Visualizer

A real-time music visualizer built with **React**, the **Web Audio API**, and the **Canvas API**.
Supports live microphone input and local audio file playback with **6 visual modes**, beat detection, BPM counter, video recording, screenshots, fullscreen, keyboard shortcuts, and live frequency analysis.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🎤 Microphone input | Real-time audio from your mic |
| 🎵 File playback | Drag-and-drop or browse any audio file (MP3, WAV, OGG, FLAC…) |
| 🏷️ ID3 Tag Reader | Automatically reads song Title, Artist, and Cover Art from MP3 files |
| 📊 Bars visualizer | Classic frequency spectrum with rounded bars and glow |
| 〰 Waveform visualizer | Oscilloscope-style time-domain display |
| ✦ Particles visualizer | Frequency-reactive particle field |
| ⭕ Radial / Circular | 128 frequency bars arranged in a full circle with pulsing center |
| 🌡️ Spectrogram | Scrolling heat map — frequency on Y axis, time scrolling left |
| 🔮 Kaleidoscope | 8-way mirrored psychedelic mandala driven by waveform + frequency |
| 🥁 Beat Detection | Detects kick drums using rolling energy threshold algorithm |
| 💓 Camera Shake | Screen shakes on every detected beat, decays over 12 frames |
| 🎵 BPM Counter | Live BPM display in the canvas HUD, auto-fades after 3 seconds |
| 🎨 Color schemes | Cyan, Purple, Rainbow — applied across all visualizers |
| 🔊 Volume control | Gain node in the audio signal chain |
| 🎚️ Sensitivity control | Amplify quiet audio (0.5x to 3x) so visuals react to soft sounds |
| 📈 Live Analysis | Real-time Bass / Mid / Treble meters + Peak / Avg percentage |
| 📸 Screenshot | Save current canvas frame as PNG with one keypress |
| 🎬 Video Recording | Record canvas + audio as WebM video, auto-downloads on stop |
| ⛶ Fullscreen | True browser fullscreen mode |
| ⌨️ Keyboard Shortcuts | Full keyboard control for all modes, colors, and actions |
| 📱 Responsive | Works on mobile and desktop |

---

## 🖥️ Visualizer Modes

| Mode | Shortcut | Description |
|---|---|---|
| **Bars** | B | Classic frequency spectrum bars with rounded tops and reflection |
| **Waveform** | W | Oscilloscope time-domain waveform with glow trail |
| **Particles** | P | Frequency-reactive particles that shoot upward on beat |
| **Radial** | C | 128 bars in a circle with pulsing center gradient |
| **Spectrogram** | G | Scrolling heat map showing frequency content over time |
| **Kaleidoscope** | K | 8-way mirrored mandala that morphs with the music |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| Space | Play / Pause |
| F | Toggle Fullscreen |
| S | Screenshot (saves PNG) |
| R | Start / Stop Recording (saves WebM) |
| M | Cycle through all visualizer modes |
| B | Bars mode |
| W | Waveform mode |
| P | Particles mode |
| C | Radial / Circular mode |
| G | Spectrogram mode |
| K | Kaleidoscope mode |
| 1 | Cyan color scheme |
| 2 | Purple color scheme |
| 3 | Rainbow color scheme |
| Arrow Up | Volume up |
| Arrow Down | Volume down |

---

## 📁 Project Structure

```
music-visualizer/
├── public/
│   └── index.html                    # HTML shell (loads Google Fonts)
├── src/
│   ├── components/
│   │   ├── AudioInput.jsx            # File drop-zone + mic toggle UI
│   │   ├── AudioInput.css
│   │   ├── Controls.jsx              # Mode / color / volume / sensitivity toolbar
│   │   ├── Controls.css
│   │   ├── FrequencyMeter.jsx        # Live Bass / Mid / Treble analysis panel
│   │   ├── FrequencyMeter.css
│   │   ├── VisualizerCanvas.jsx      # Canvas renderer + HUD (BPM, record, screenshot, fullscreen)
│   │   └── VisualizerCanvas.css
│   ├── hooks/
│   │   ├── useAudioEngine.js         # Web Audio API: context, nodes, mic/file routing
│   │   ├── useAnimationLoop.js       # requestAnimationFrame abstraction with delta time
│   │   ├── useBeatDetection.js       # Rolling energy beat detector + BPM calculator
│   │   ├── useRecorder.js            # MediaRecorder canvas+audio to WebM video export
│   │   ├── useKeyboardShortcuts.js   # Global keydown shortcut dispatcher
│   │   └── useID3Tags.js             # Binary ID3v2 tag parser (title, artist, cover art)
│   ├── utils/
│   │   └── drawUtils.js              # All canvas draw functions: bars, waveform, particles,
│   │                                 #   circular, spectrogram, kaleidoscope, beat flash, shake
│   ├── styles/
│   │   └── global.css                # CSS custom properties, reset, grain texture
│   ├── App.jsx                       # Root layout, keyboard wiring, song info display
│   ├── App.css
│   └── index.js                      # ReactDOM.createRoot entry point
├── package.json
└── README.md
```

---

## 🛠️ Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 16 or higher | https://nodejs.org |
| npm | comes with Node | — |
| VS Code | any recent | https://code.visualstudio.com |

Check your versions:
```bash
node --version
npm --version
```

---

## 🚀 Setup and Run

### 1. Install dependencies
```bash
npm install
```
Downloads around 1500 packages into node_modules. Takes 1–3 minutes on first run.

### 2. Start the development server
```bash
npm start
```
Opens **http://localhost:3000** automatically with hot reload enabled.

---

## 🧪 Testing the App

**File playback:**
1. Click the **File** tab (default)
2. Drag an .mp3 or .wav file onto the drop zone, or click to browse
3. If the file has ID3 tags, the song title, artist, and cover art appear in the header
4. Click Play — the visualizer animates to your music

**Microphone:**
1. Click the **Microphone** tab
2. Click **Start Listening** and allow mic access
3. Speak or play music near your mic

**Beat detection:**
- On every kick drum hit the screen briefly flashes and shakes
- A BPM badge appears in the top-left corner of the canvas

**Recording:**
- Press R to start — the record button turns red and pulses
- Press R again to stop — a .webm video file downloads automatically

**Screenshot:**
- Press S at any time — a .png of the current canvas downloads instantly

---

## 🏗️ Architecture

```
User Gesture
    │
    ▼
AudioContext (created once on first interaction)
    │
    ├─ [File mode]  MediaElementSource ──┐
    └─ [Mic mode]   MediaStreamSource ───┤
                                         ▼
                                    GainNode (volume + sensitivity)
                                         │
                                         ▼
                                    AnalyserNode (FFT size: 2048)
                                         │
                                         ├── getByteFrequencyData()  → bars, particles,
                                         │     circular, spectrogram, kaleidoscope, beat detect
                                         └── getByteTimeDomainData() → waveform, kaleidoscope
                                         │
                                         ▼
                                    AudioDestination (speakers)

VisualizerCanvas
    │
    ├─ useAnimationLoop (rAF, 60fps)
    │       │
    │       ├─ useBeatDetection → triggerShake() + drawBeatFlash()
    │       └─ drawUtils.js → selected visualizer function
    │
    └─ HUD overlay (BPM badge, screenshot btn, record btn, fullscreen btn)
```

### Key design decisions

- **All audio state in refs** — useAudioEngine stores the AudioContext and nodes in refs, not React state, so the 60fps audio loop never triggers component re-renders.
- **useAnimationLoop always runs** — even when paused, so the idle breathing animation plays.
- **drawUtils.js is pure JS** — zero React dependencies, easy to unit test or extend.
- **Particle and spectrogram state are plain mutable objects** — updating at 60fps without React overhead.
- **Beat detection uses rolling energy** — compares current bass energy to a 43-frame rolling average; fires when energy exceeds 1.45x the average with a 280ms cooldown.
- **ID3 parsing is done in the browser** — reads the binary File object directly, no server or library needed.

---

## 📦 Build Commands

| Command | Purpose |
|---|---|
| npm start | Dev server at localhost:3000 with hot reload |
| npm run build | Production build to build/ folder (minified, hashed) |
| npx serve -s build | Preview the production build locally |

---

## 🌐 Deploy

**Vercel (recommended):**
```bash
npx vercel --prod
```

**Netlify:**
Drag the build/ folder to https://netlify.com/drop

**GitHub Pages:**
```bash
npm install --save-dev gh-pages
```
Add to package.json:
```json
"homepage": "https://YOUR_USERNAME.github.io/music-visualizer",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```
Then run:
```bash
npm run deploy
```

---

## 🌍 Browser Compatibility

| Browser | Support |
|---|---|
| Chrome 66+ | Full |
| Firefox 76+ | Full |
| Edge 79+ | Full |
| Safari 14.1+ | Full |
| Mobile Chrome | Full |
| Mobile Safari | Mic works; drag-and-drop not available |

---

## 🔧 Common Issues and Fixes

| Issue | Fix |
|---|---|
| react-scripts not found | Run npm install first |
| npm install only installs 7 packages | Delete package-lock.json and node_modules/, then re-run npm install |
| Microphone access denied | Allow mic in browser: chrome://settings/content/microphone |
| Visualizer not reacting | Make sure you clicked Play or Start Listening first |
| Canvas is blank | Resize the window to trigger ResizeObserver; check browser console |
| Recording has no audio | Some browsers restrict audio capture — Chrome works best |
| ID3 tags not showing | Only ID3v2 tags in MP3 files are supported |

---

## 💡 Further Customisation Ideas

- **Equalizer** — Insert BiquadFilterNodes between the gain and analyser nodes
- **MIDI control** — Use navigator.requestMIDIAccess() to map knobs to volume/mode
- **Playlist** — Queue multiple files and auto-advance
- **Custom themes** — Add a color picker with CSS variable overrides
- **3D mode** — Replace the 2D canvas with a Three.js scene

---

## 📄 License

MIT — free to use, modify, and distribute.
