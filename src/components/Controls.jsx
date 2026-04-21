// Controls.jsx — expanded with new visualizer modes + sensitivity

import React from 'react';
import './Controls.css';

const BarChartIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="9" width="4" height="12"/><rect x="10" y="5" width="4" height="16"/><rect x="17" y="2" width="4" height="19"/>
  </svg>
);
const WaveIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12 C5 4, 8 4, 11 12 C14 20, 17 20, 20 12"/>
  </svg>
);
const SparkleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const CircleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21"/>
    <line x1="3" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21" y2="12"/>
  </svg>
);
const HeatIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="2" y1="14" x2="22" y2="14"/>
  </svg>
);
const KaleidoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 22 20 2 20"/><line x1="12" y1="2" x2="12" y2="20"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const VolumeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);
const SensitivityIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const MODES = [
  { id: 'bars',         label: 'Bars',        Icon: BarChartIcon },
  { id: 'waveform',     label: 'Wave',        Icon: WaveIcon     },
  { id: 'particles',    label: 'Particles',   Icon: SparkleIcon  },
  { id: 'circular',     label: 'Radial',      Icon: CircleIcon   },
  { id: 'spectrogram',  label: 'Spectro',     Icon: HeatIcon     },
  { id: 'kaleidoscope', label: 'Kaleido',     Icon: KaleidoIcon  },
];

const COLOR_MODES = [
  { id: 'cyan',    label: 'Cyan',    swatch: 'linear-gradient(135deg, #00f5d4, #00b4d8)' },
  { id: 'purple',  label: 'Purple',  swatch: 'linear-gradient(135deg, #9b5de5, #f72585)' },
  { id: 'rainbow', label: 'Rainbow', swatch: 'linear-gradient(135deg, #f72585, #9b5de5, #00f5d4, #f4b942)' },
];

export function Controls({ mode, setMode, colorMode, setColorMode, volume, setVolume, sensitivity, setSensitivity }) {
  return (
    <div className="controls">
      {/* Mode */}
      <div className="controls__section">
        <span className="controls__label">Visualizer</span>
        <div className="controls__btn-group">
          {MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`controls__btn ${mode === id ? 'controls__btn--active' : ''}`}
              onClick={() => setMode(id)}
              title={label}
            >
              <Icon /><span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className="controls__section">
        <span className="controls__label">Color</span>
        <div className="controls__swatches">
          {COLOR_MODES.map(({ id, label, swatch }) => (
            <button
              key={id}
              className={`controls__swatch ${colorMode === id ? 'controls__swatch--active' : ''}`}
              style={{ background: swatch }}
              onClick={() => setColorMode(id)}
              title={label}
            />
          ))}
        </div>
      </div>

      {/* Volume */}
      <div className="controls__section controls__section--slider">
        <span className="controls__label"><VolumeIcon /> Vol</span>
        <input type="range" className="controls__slider" min="0" max="1" step="0.01"
          value={volume} onChange={e => setVolume(parseFloat(e.target.value))} />
        <span className="controls__value">{Math.round(volume * 100)}%</span>
      </div>

      {/* Sensitivity */}
      <div className="controls__section controls__section--slider">
        <span className="controls__label"><SensitivityIcon /> Sens</span>
        <input type="range" className="controls__slider" min="0.5" max="3" step="0.1"
          value={sensitivity} onChange={e => setSensitivity(parseFloat(e.target.value))} />
        <span className="controls__value">{sensitivity.toFixed(1)}x</span>
      </div>

      {/* Keyboard hint */}
      <div className="controls__shortcuts">
        <span title="Space=play  F=fullscreen  S=screenshot  R=record  B/W/P/C/G/K=modes">⌨ shortcuts</span>
      </div>
    </div>
  );
}
