// =============================================
// FrequencyMeter.jsx
// A small live stats panel: shows peak frequency,
// average amplitude, and a mini stereo-meter bar.
// Purely cosmetic / informational.
// =============================================

import React, { useEffect, useRef, useState } from 'react';
import { useAnimationLoop } from '../hooks/useAnimationLoop';
import './FrequencyMeter.css';

/**
 * @prop {Function} getFrequencyData
 * @prop {boolean}  isActive
 */
export function FrequencyMeter({ getFrequencyData, isActive }) {
  const [stats, setStats] = useState({ avg: 0, peak: 0, bass: 0, mid: 0, treble: 0 });
  const frameSkip = useRef(0); // Only update state every N frames for performance

  const update = () => {
    // Throttle: update stats every 3 frames (~20fps) to avoid excessive re-renders
    frameSkip.current++;
    if (frameSkip.current < 3) return;
    frameSkip.current = 0;

    const data = getFrequencyData();
    if (!data.length) return;

    const total = data.length;

    // Divide frequency bins into bass / mid / treble bands
    const bassEnd   = Math.floor(total * 0.08);  // ~0–200Hz
    const midEnd    = Math.floor(total * 0.40);  // ~200Hz–2kHz
    // treble = rest                              // ~2kHz–20kHz

    let sum = 0, peak = 0, bassSum = 0, midSum = 0, trebleSum = 0;

    for (let i = 0; i < total; i++) {
      const v = data[i];
      sum += v;
      if (v > peak) peak = v;
      if (i < bassEnd)                      bassSum   += v;
      else if (i < midEnd)                  midSum    += v;
      else                                  trebleSum += v;
    }

    setStats({
      avg:    Math.round((sum    / total)                   / 255 * 100),
      peak:   Math.round(peak                               / 255 * 100),
      bass:   Math.round((bassSum   / bassEnd)              / 255 * 100),
      mid:    Math.round((midSum    / (midEnd - bassEnd))   / 255 * 100),
      treble: Math.round((trebleSum / (total - midEnd))     / 255 * 100),
    });
  };

  useAnimationLoop(update, isActive);

  // Reset when stopped
  useEffect(() => {
    if (!isActive) setStats({ avg: 0, peak: 0, bass: 0, mid: 0, treble: 0 });
  }, [isActive]);

  return (
    <div className="freq-meter">
      <span className="freq-meter__title">Live Analysis</span>

      <div className="freq-meter__bands">
        <Band label="Bass"   value={stats.bass}   color="var(--accent-pink)"   />
        <Band label="Mid"    value={stats.mid}    color="var(--accent-purple)" />
        <Band label="Treble" value={stats.treble} color="var(--accent-cyan)"   />
      </div>

      <div className="freq-meter__stats">
        <Stat label="AVG" value={`${stats.avg}%`}  />
        <Stat label="PK"  value={`${stats.peak}%`} accent />
      </div>
    </div>
  );
}

function Band({ label, value, color }) {
  return (
    <div className="freq-meter__band">
      <span className="freq-meter__band-label">{label}</span>
      <div className="freq-meter__bar-track">
        <div
          className="freq-meter__bar-fill"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="freq-meter__band-value">{value}</span>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className={`freq-meter__stat ${accent ? 'freq-meter__stat--accent' : ''}`}>
      <span className="freq-meter__stat-label">{label}</span>
      <span className="freq-meter__stat-value">{value}</span>
    </div>
  );
}
