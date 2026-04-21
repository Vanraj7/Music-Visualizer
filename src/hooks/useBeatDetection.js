// =============================================
// useBeatDetection.js
// Detects beats (kick drum / bass transients)
// by watching for sudden energy spikes in the
// low-frequency (bass) band.
//
// Algorithm:
//   1. Compute current bass energy (sum of low bins)
//   2. Keep a rolling average of recent bass energy
//   3. If current energy > threshold × average → beat!
//   4. Enforce a minimum gap between beats (cooldown)
// =============================================

import { useRef, useCallback } from 'react';

const COOLDOWN_MS  = 280;   // Minimum ms between detected beats (~214 BPM max)
const THRESHOLD    = 1.45;  // Current energy must be this × average to count
const HISTORY_SIZE = 43;    // Rolling window size (~43 frames ≈ ~700ms at 60fps)
const BASS_BINS    = 12;    // How many low-frequency FFT bins to watch

export function useBeatDetection() {
  const historyRef   = useRef(new Float32Array(HISTORY_SIZE)); // Rolling energy history
  const historyIdx   = useRef(0);
  const lastBeatTime = useRef(0);
  const bpmHistory   = useRef([]);  // Timestamps of recent beats for BPM calc
  const bpmRef       = useRef(0);

  /**
   * Call every animation frame with the current frequency data.
   * Returns true if a beat was detected this frame.
   * @param {Uint8Array} freqData
   * @returns {boolean}
   */
  const detectBeat = useCallback((freqData) => {
    if (!freqData || freqData.length < BASS_BINS) return false;

    // 1. Compute current bass energy (RMS of low bins)
    let energy = 0;
    for (let i = 0; i < BASS_BINS; i++) {
      energy += (freqData[i] / 255) ** 2;
    }
    energy = Math.sqrt(energy / BASS_BINS);

    // 2. Store in rolling history
    historyRef.current[historyIdx.current] = energy;
    historyIdx.current = (historyIdx.current + 1) % HISTORY_SIZE;

    // 3. Compute rolling average
    let avg = 0;
    for (let i = 0; i < HISTORY_SIZE; i++) avg += historyRef.current[i];
    avg /= HISTORY_SIZE;

    // 4. Beat = energy spike above threshold, respecting cooldown
    const now = performance.now();
    if (
      energy > avg * THRESHOLD &&
      energy > 0.1 &&                         // ignore near-silence
      now - lastBeatTime.current > COOLDOWN_MS
    ) {
      lastBeatTime.current = now;

      // BPM tracking: keep last 8 beat timestamps
      bpmHistory.current.push(now);
      if (bpmHistory.current.length > 8) bpmHistory.current.shift();

      // Compute BPM from average interval between recent beats
      if (bpmHistory.current.length >= 2) {
        const intervals = [];
        for (let i = 1; i < bpmHistory.current.length; i++) {
          intervals.push(bpmHistory.current[i] - bpmHistory.current[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        bpmRef.current = Math.round(60000 / avgInterval);
      }

      return true; // Beat detected!
    }

    return false;
  }, []);

  const getBPM = useCallback(() => bpmRef.current, []);

  return { detectBeat, getBPM };
}
