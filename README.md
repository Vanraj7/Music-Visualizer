# ◈ SoundViz — Music Visualizer

A real-time music visualizer built with **React**, the **Web Audio API**, and the **Canvas API**.
Supports live microphone input and local audio file playback with three visual modes and
three color schemes.

---

## Features

| Feature | Details |
|---|---|
| 🎤 Microphone input | Real-time audio from your mic |
| 🎵 File playback | Drag-and-drop or browse any audio file (MP3, WAV, OGG, FLAC…) |
| 📊 Bars visualizer | Classic frequency spectrum with glow |
| 〰 Waveform visualizer | Oscilloscope-style time-domain display |
| ✦ Particles visualizer | Frequency-reactive particle field |
| 🎨 Color schemes | Cyan, Purple, Rainbow |
| 🔊 Volume control | Gain node in the audio graph |
| 📈 Live analysis | Bass / Mid / Treble meters + Peak / Avg |
| 📱 Responsive | Works on mobile and desktop |

---

## Project Structure

```
music-visualizer/
├── public/
│   └── index.html              # HTML shell (loads Google Fonts)
├── src/
│   ├── components/
│   │   ├── AudioInput.jsx      # File drop-zone + mic toggle UI
│   │   ├── AudioInput.css
│   │   ├── Controls.jsx        # Mode/color/volume toolbar
│   │   ├── Controls.css
│   │   ├── FrequencyMeter.jsx  # Live Bass/Mid/Treble meters
│   │   ├── FrequencyMeter.css
│   │   ├── VisualizerCanvas.jsx # Canvas renderer + animation loop
│   │   └── VisualizerCanvas.css
│   ├── hooks/
│   │   ├── useAudioEngine.js   # Web Audio API: context, nodes, data
│   │   └── useAnimationLoop.js # requestAnimationFrame abstraction
│   ├── utils/
│   │   └── drawUtils.js        # Pure canvas drawing: bars/wave/particles
│   ├── styles/
│   │   └── global.css          # CSS custom properties + reset
│   ├── App.jsx                 # Root layout component
│   ├── App.css
│   └── index.js                # ReactDOM.createRoot entry point
├── package.json
└── README.md
```

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 16 or higher | https://nodejs.org |
| npm | comes with Node | — |
| VS Code | any recent | https://code.visualstudio.com |

To check existing versions:
```bash
node --version
npm --version
```

---

## Setup in VS Code — Step by Step

### 1. Open the project

```bash
# Option A: Clone / download and open
cd music-visualizer
code .

# Option B: Open from VS Code
# File → Open Folder → select the music-visualizer folder
```

### 2. Install dependencies

Open the integrated terminal in VS Code (**Ctrl+`** or **Terminal → New Terminal**):

```bash
npm install
```

This installs React, ReactDOM, and react-scripts (~250 MB). Takes 30–60 seconds.

### 3. Start the development server

```bash
npm start
```

The app automatically opens at **http://localhost:3000** in your default browser.

> **Hot reload** is enabled — any file change reflects instantly without refreshing.

### 4. Test the app

**Testing with a file:**
1. Click the **File** tab (it's selected by default)
2. Drag an `.mp3` or `.wav` file onto the drop zone, or click to browse
3. Click the **▶ Play** button
4. Watch the visualizer animate to your music!

**Testing with microphone:**
1. Click the **Microphone** tab
2. Click **Start Listening**
3. Allow microphone access when the browser prompts
4. Speak or play music near your mic — the visualizer responds in real time

**Switching modes:**
- Use the **Bars / Wave / Particles** buttons in the Controls bar
- Use the color swatches to change the color scheme

---

## VS Code Recommended Extensions

Install these for the best development experience:

| Extension | ID | Purpose |
|---|---|---|
| ESLint | `dbaeumer.vscode-eslint` | Lint JS/JSX in real time |
| Prettier | `esbenp.prettier-vscode` | Auto-format on save |
| ES7+ React Snippets | `dsznajder.es7-react-js-snippets` | Fast component boilerplate |
| Auto Rename Tag | `formulahendry.auto-rename-tag` | Rename JSX tags in pairs |

Install in one go via the terminal:
```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension formulahendry.auto-rename-tag
```

---

## Development Build

Already running with `npm start`. Features:
- **Hot Module Replacement** (instant updates)
- **Source maps** (see original code in DevTools)
- **Unminified output** (readable in the browser)
- **Error overlay** (compile errors shown in-browser)

### Useful debug tips

Open **Chrome DevTools → Sources** to set breakpoints in your hooks.

In the **Console**, you can inspect the audio graph:
```javascript
// After audio starts, from App context (not available directly, for reference)
// The AudioContext and AnalyserNode are in useAudioEngine's refs.
```

---

## Production Build

```bash
npm run build
```

Creates an optimized `build/` folder:
- Minified JS and CSS
- Tree-shaking (dead code removed)
- Asset hashing for cache busting

**Serve locally to test the production build:**
```bash
npx serve -s build
# Opens at http://localhost:3000 (or next available port)
```

**Deploy to any static host:**
- **Vercel**: `npx vercel --prod` from the project root
- **Netlify**: drag the `build/` folder to netlify.com/drop
- **GitHub Pages**: use `gh-pages` npm package

---

## How It Works (Architecture)

```
User Gesture
    │
    ▼
AudioContext (created once, on first interaction)
    │
    ├─ [File mode]  MediaElementSource ──┐
    └─ [Mic mode]   MediaStreamSource ───┤
                                         ▼
                                    GainNode (volume)
                                         │
                                         ▼
                                    AnalyserNode (FFT)
                                         │
                                         ├── getByteFrequencyData() → bars/particles
                                         └── getByteTimeDomainData() → waveform
                                         │
                                         ▼
                                    AudioDestination (speakers)

VisualizerCanvas
    │
    └─ useAnimationLoop (rAF)
           │
           └─ drawBars() / drawWaveform() / drawParticles()
                  │
                  └─ reads AnalyserNode data every frame
```

### Key design decisions

- **`useAudioEngine`** owns all Web Audio API state in refs (not React state) to avoid re-renders during audio processing.
- **`useAnimationLoop`** always runs (even when paused) to show the idle breathing animation.
- **`drawUtils.js`** is pure functions with zero React dependencies — easy to unit test or reuse.
- **Particle state** is a plain mutable array (not React state) so particles update at 60fps without triggering re-renders.
- **`ResizeObserver`** keeps the canvas pixel-perfect as the window resizes.

---

## Browser Compatibility

| Browser | Support |
|---|---|
| Chrome 66+ | ✅ Full |
| Firefox 76+ | ✅ Full |
| Edge 79+ | ✅ Full |
| Safari 14.1+ | ✅ Full (requires webkit prefix, handled) |
| Mobile Chrome | ✅ Full |
| Mobile Safari | ⚠ Mic works, file drag-drop not available |

> **Note:** The Web Audio API requires a user gesture before the AudioContext can start.
> This is a browser security policy — the app handles it automatically.

---

## Common Issues & Fixes

| Issue | Fix |
|---|---|
| "Microphone access denied" | Allow mic in browser settings: `chrome://settings/content/microphone` |
| No sound from file | Check browser isn't muted; try a different audio format |
| Visualizer not responding | Ensure you clicked Play/Start before interacting |
| Canvas is blank | Resize the window to trigger a resize event; check console for errors |
| `npm install` fails | Try `node --version` — ensure Node 16+. Delete `node_modules/` and retry. |

---

## Customisation Ideas

- **Add more visualizers**: Create a new case in `drawUtils.js` and add the button in `Controls.jsx`
- **Add equalizer**: Insert `BiquadFilterNode`s between the gain and analyser
- **Record output**: Use `MediaRecorder` on the `AudioContext.destination` stream
- **MIDI control**: Listen to `navigator.requestMIDIAccess()` to control volume/mode
- **Beat detection**: Detect peaks in the bass band to trigger effects on-beat

---

## License

MIT — free to use, modify, and distribute.
