// App.jsx — root component, wires all features together

import React, { useState, useCallback, useMemo } from 'react';
import { useAudioEngine }       from './hooks/useAudioEngine';
import { useID3Tags }           from './hooks/useID3Tags';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { VisualizerCanvas }     from './components/VisualizerCanvas';
import { AudioInput }           from './components/AudioInput';
import { Controls }             from './components/Controls';
import { FrequencyMeter }       from './components/FrequencyMeter';
import './styles/global.css';
import './App.css';

export default function App() {
  const [mode,        setMode]        = useState('bars');
  const [colorMode,   setColorMode]   = useState('cyan');
  const [sensitivity, setSensitivity] = useState(1);

  const audio    = useAudioEngine();
  const { tags, readTags } = useID3Tags();

  // When a file is loaded, also read its ID3 tags
  const handleLoadFile = useCallback((file) => {
    audio.loadFile(file);
    readTags(file);
  }, [audio, readTags]);

  // Mode cycle order for keyboard shortcut
  const MODES = ['bars','waveform','particles','circular','spectrogram','kaleidoscope'];
  const cycleMode = useCallback(() => {
    setMode(m => MODES[(MODES.indexOf(m) + 1) % MODES.length]);
  }, []); // eslint-disable-line

  // Keyboard shortcuts
  const shortcuts = useMemo(() => ({
    ' ':  () => audio.inputMode === 'file' ? audio.togglePlay() : null,
    'f':  () => document.fullscreenElement ? document.exitFullscreen() : document.querySelector('.visualizer-container')?.requestFullscreen(),
    'm':  cycleMode,
    'b':  () => setMode('bars'),
    'w':  () => setMode('waveform'),
    'p':  () => setMode('particles'),
    'c':  () => setMode('circular'),
    'g':  () => setMode('spectrogram'),
    'k':  () => setMode('kaleidoscope'),
    '1':  () => setColorMode('cyan'),
    '2':  () => setColorMode('purple'),
    '3':  () => setColorMode('rainbow'),
    'arrowup':   () => audio.updateVolume(Math.min(1,   audio.volume + 0.05)),
    'arrowdown': () => audio.updateVolume(Math.max(0,   audio.volume - 0.05)),
  }), [audio, cycleMode]);

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="app">
      {/* HEADER */}
      <header className="app__header">
        <div className="app__logo">
          <span className="app__logo-mark">◈</span>
          <span className="app__logo-text">SoundViz</span>
        </div>

        {/* Song Info (ID3 tags) */}
        {tags.title && (
          <div className="app__song-info">
            {tags.cover && <img src={tags.cover} alt="cover" className="app__song-cover" />}
            <div className="app__song-text">
              <span className="app__song-title">{tags.title}</span>
              {tags.artist && <span className="app__song-artist">{tags.artist}</span>}
            </div>
          </div>
        )}

        <p className="app__tagline">Real-time Music Visualizer</p>
      </header>

      {/* MAIN */}
      <main className="app__main">
        <section className="app__canvas-area">
          <VisualizerCanvas
            getFrequencyData={audio.getFrequencyData}
            getWaveformData={audio.getWaveformData}
            isActive={audio.isPlaying}
            mode={mode}
            colorMode={colorMode}
            sensitivity={sensitivity}
            audioCtxRef={audio.audioCtxRef}
          />
        </section>

        <aside className="app__sidebar">
          <div className="app__card">
            <h2 className="app__section-title">Audio Source</h2>
            <AudioInput
              inputMode={audio.inputMode}
              switchMode={audio.switchMode}
              audioSrc={audio.audioSrc}
              audioFile={audio.audioFile}
              isPlaying={audio.isPlaying}
              togglePlay={audio.togglePlay}
              loadFile={handleLoadFile}
              startMic={audio.startMic}
              stopMic={audio.stopMic}
              error={audio.error}
              audioElRef={audio.audioElRef}
            />
          </div>

          <FrequencyMeter
            getFrequencyData={audio.getFrequencyData}
            isActive={audio.isPlaying}
          />

          {/* Keyboard shortcuts card */}
          <div className="app__card app__shortcuts-card">
            <h2 className="app__section-title">Shortcuts</h2>
            <div className="shortcut-grid">
              {[
                ['Space', 'Play/Pause'],['F', 'Fullscreen'],['S', 'Screenshot'],
                ['R', 'Record'],['M', 'Cycle mode'],['B/W/P', 'Bars/Wave/Particles'],
                ['C/G/K', 'Radial/Spectro/Kaleido'],['1/2/3', 'Color schemes'],
                ['↑↓', 'Volume'],
              ].map(([key, desc]) => (
                <div key={key} className="shortcut-row">
                  <kbd>{key}</kbd><span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* CONTROLS */}
      <footer className="app__controls">
        <Controls
          mode={mode}           setMode={setMode}
          colorMode={colorMode} setColorMode={setColorMode}
          volume={audio.volume} setVolume={audio.updateVolume}
          sensitivity={sensitivity} setSensitivity={setSensitivity}
        />
      </footer>
    </div>
  );
}
