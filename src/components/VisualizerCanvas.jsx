// =============================================
// VisualizerCanvas.jsx — expanded with beat
// detection, camera shake, screenshot, recording,
// fullscreen, and all new visualizer modes.
// =============================================

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useAnimationLoop }  from '../hooks/useAnimationLoop';
import { useBeatDetection }  from '../hooks/useBeatDetection';
import { useRecorder }       from '../hooks/useRecorder';
import {
  drawBars, drawWaveform, drawParticles,
  drawCircular, drawSpectrogram, drawKaleidoscope,
  drawBeatFlash, triggerShake,
  initParticles, initSpectrogram,
} from '../utils/drawUtils';
import './VisualizerCanvas.css';

export function VisualizerCanvas({
  getFrequencyData, getWaveformData,
  isActive, mode = 'bars', colorMode = 'cyan',
  sensitivity = 1,
  audioCtxRef,         // passed from App for recording
}) {
  const canvasRef      = useRef(null);
  const containerRef   = useRef(null);
  const particlesInit  = useRef(false);
  const spectroInit    = useRef(false);
  const beatFlash      = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bpm,          setBpm]          = useState(null);
  const bpmDisplayTimer = useRef(null);

  const { detectBeat, getBPM } = useBeatDetection();
  const { isRecording, startRecording, stopRecording, takeScreenshot } = useRecorder();

  // ---- Resize (debounced) ----
  const resizeCanvas = useCallback(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const { width, height } = container.getBoundingClientRect();
    if (canvas.width !== Math.floor(width) || canvas.height !== Math.floor(height)) {
      canvas.width  = Math.floor(width);
      canvas.height = Math.floor(height);
      if (mode === 'particles')    { initParticles(canvas.width, canvas.height);   particlesInit.current = true; }
      if (mode === 'spectrogram')  { initSpectrogram(canvas.width, canvas.height); spectroInit.current   = true; }
    }
  }, [mode]);

  useEffect(() => {
    resizeCanvas();
    let timer;
    const ro = new ResizeObserver(() => { clearTimeout(timer); timer = setTimeout(resizeCanvas, 50); });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => { ro.disconnect(); clearTimeout(timer); };
  }, [resizeCanvas]);

  // Re-init mode-specific state when mode changes
  useEffect(() => {
    if (mode === 'particles' && canvasRef.current && !particlesInit.current) {
      initParticles(canvasRef.current.width, canvasRef.current.height);
      particlesInit.current = true;
    }
    if (mode !== 'particles') particlesInit.current = false;
    if (mode === 'spectrogram' && canvasRef.current && !spectroInit.current) {
      initSpectrogram(canvasRef.current.width, canvasRef.current.height);
      spectroInit.current = true;
    }
    if (mode !== 'spectrogram') spectroInit.current = false;
  }, [mode]);

  // Fullscreen change listener
  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  // ---- Fullscreen toggle ----
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // ---- Screenshot ----
  const handleScreenshot = useCallback(() => {
    takeScreenshot(canvasRef.current);
  }, [takeScreenshot]);

  // ---- Recording ----
  const handleRecord = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording(canvasRef.current, audioCtxRef?.current, 30);
    }
  }, [isRecording, startRecording, stopRecording, audioCtxRef]);

  // ---- Draw loop ----
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;

    // Apply sensitivity to freq data
    const rawFreq = getFrequencyData();
    const freqData = new Uint8Array(rawFreq.length);
    for (let i = 0; i < rawFreq.length; i++) {
      freqData[i] = Math.min(255, rawFreq[i] * sensitivity);
    }

    if (!isActive) {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
      ctx.fillRect(0, 0, width, height);
      const idle = new Uint8Array(512);
      for (let i = 0; i < idle.length; i++) {
        idle[i] = 128 + Math.sin(Date.now() * 0.001 + i * 0.05) * 3;
      }
      drawWaveform(ctx, idle, width, height, colorMode);
      return;
    }

    // Beat detection
    const isBeat = detectBeat(freqData);
    if (isBeat) {
      triggerShake(6);
      beatFlash.current = true;
      const detectedBPM = getBPM();
      if (detectedBPM > 40 && detectedBPM < 250) {
        setBpm(detectedBPM);
        clearTimeout(bpmDisplayTimer.current);
        bpmDisplayTimer.current = setTimeout(() => setBpm(null), 3000);
      }
    }

    // Draw selected visualizer
    const waveData = getWaveformData();
    switch (mode) {
      case 'bars':         drawBars(ctx, freqData, width, height, colorMode);                          break;
      case 'waveform':     drawWaveform(ctx, waveData, width, height, colorMode);                      break;
      case 'particles':    drawParticles(ctx, freqData, width, height, colorMode);                     break;
      case 'circular':     drawCircular(ctx, freqData, width, height, colorMode);                      break;
      case 'spectrogram':  drawSpectrogram(ctx, freqData, width, height, colorMode);                   break;
      case 'kaleidoscope': drawKaleidoscope(ctx, freqData, waveData, width, height, colorMode);        break;
      default:             drawBars(ctx, freqData, width, height, colorMode);
    }

    // Beat flash overlay
    if (beatFlash.current) {
      drawBeatFlash(ctx, width, height, colorMode);
      beatFlash.current = false;
    }
  }, [isActive, mode, colorMode, sensitivity, getFrequencyData, getWaveformData, detectBeat, getBPM]);

  useAnimationLoop(draw, true);

  return (
    <div ref={containerRef} className={`visualizer-container ${isFullscreen ? 'visualizer-container--fs' : ''}`}>
      <canvas ref={canvasRef} className="visualizer-canvas" />

      {/* ---- HUD Toolbar ---- */}
      <div className="visualizer-hud">
        {/* BPM Badge */}
        {bpm && (
          <div className="visualizer-bpm">
            <span className="visualizer-bpm__dot" />
            {bpm} BPM
          </div>
        )}

        <div className="visualizer-hud__actions">
          {/* Screenshot */}
          <button className="hud-btn" onClick={handleScreenshot} title="Screenshot (S)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>

          {/* Record */}
          <button
            className={`hud-btn ${isRecording ? 'hud-btn--recording' : ''}`}
            onClick={handleRecord}
            title={isRecording ? 'Stop recording (R)' : 'Record (R)'}
          >
            {isRecording
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="7"/></svg>
            }
          </button>

          {/* Fullscreen */}
          <button className="hud-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
            {isFullscreen
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
