// =============================================
// useAudioEngine.js
// Custom hook that encapsulates ALL Web Audio API
// logic: context, analyser, source nodes, and
// real-time frequency/waveform data extraction.
// =============================================

import { useRef, useState, useCallback, useEffect } from 'react';

// FFT size determines frequency resolution.
// 2048 gives 1024 frequency bins — a good balance
// of resolution vs. performance.
const FFT_SIZE = 2048;

export function useAudioEngine() {
  // ---- Audio Context & Node refs ----
  const audioCtxRef    = useRef(null); // AudioContext instance
  const analyserRef    = useRef(null); // AnalyserNode (reads frequency/time data)
  const sourceRef      = useRef(null); // Current audio source node
  const mediaStreamRef = useRef(null); // MediaStream for microphone

  // ---- Audio Element ref (for file playback) ----
  const audioElRef = useRef(null);

  // ---- State ----
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [inputMode,    setInputMode]    = useState('file'); // 'file' | 'mic'
  const [audioFile,    setAudioFile]    = useState(null);   // File object
  const [audioSrc,     setAudioSrc]     = useState('');     // Object URL
  const [error,        setError]        = useState(null);
  const [isReady,      setIsReady]      = useState(false);  // Context initialized?
  const [volume,       setVolume]       = useState(1);      // 0–1
  const gainRef        = useRef(null);                      // GainNode for volume

  // ---- Initialise AudioContext ----
  // AudioContext must be created after a user gesture (browser policy).
  const initAudioContext = useCallback(() => {
    if (audioCtxRef.current) return; // already created

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      setError('Web Audio API is not supported in this browser.');
      return;
    }

    const ctx      = new AudioContext();
    const analyser = ctx.createAnalyser();
    const gain     = ctx.createGain();

    // FFT and smoothing settings
    analyser.fftSize               = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.82; // 0 = no smoothing, 1 = max smoothing

    // Signal path: source → gain → analyser → speakers
    gain.connect(analyser);
    analyser.connect(ctx.destination);

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    gainRef.current     = gain;

    setIsReady(true);
  }, []);

  // ---- Disconnect previous source ----
  const disconnectSource = useCallback(() => {
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch (_) {}
      sourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // ---- Connect microphone ----
  const startMic = useCallback(async () => {
    initAudioContext();
    disconnectSource();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaStreamRef.current = stream;

      // Resume context if suspended (autoplay policy)
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }

      const micSource = audioCtxRef.current.createMediaStreamSource(stream);
      micSource.connect(gainRef.current);
      sourceRef.current = micSource;

      setIsPlaying(true);
      setError(null);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permissions.');
      console.error('Mic error:', err);
    }
  }, [initAudioContext, disconnectSource]);

  // ---- Stop microphone ----
  const stopMic = useCallback(() => {
    disconnectSource();
    setIsPlaying(false);
  }, [disconnectSource]);

  // ---- Load an audio file ----
  const loadFile = useCallback((file) => {
    if (!file) return;
    // Revoke previous object URL to free memory
    if (audioSrc) URL.revokeObjectURL(audioSrc);

    const url = URL.createObjectURL(file);
    setAudioFile(file);
    setAudioSrc(url);
    setIsPlaying(false);
    setError(null);
  }, [audioSrc]);

  // ---- Play / Pause file playback ----
  const togglePlay = useCallback(async () => {
    if (!audioElRef.current || !audioSrc) return;

    initAudioContext();

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    // If no media element source yet, create one and wire it up
    if (!sourceRef.current) {
      const mediaSource = ctx.createMediaElementSource(audioElRef.current);
      mediaSource.connect(gainRef.current);
      sourceRef.current = mediaSource;
    }

    if (audioElRef.current.paused) {
      await audioElRef.current.play();
      setIsPlaying(true);
    } else {
      audioElRef.current.pause();
      setIsPlaying(false);
    }
  }, [audioSrc, initAudioContext]);

  // ---- Update volume ----
  const updateVolume = useCallback((v) => {
    setVolume(v);
    if (gainRef.current) gainRef.current.gain.value = v;
  }, []);

  // ---- Switch input mode ----
  const switchMode = useCallback((mode) => {
    disconnectSource();
    setIsPlaying(false);
    setInputMode(mode);
    setError(null);
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
    }
  }, [disconnectSource]);

  // ---- Read frequency data (for visualizers) ----
  // Returns a Uint8Array of length analyser.frequencyBinCount
  const getFrequencyData = useCallback(() => {
    if (!analyserRef.current) return new Uint8Array(0);
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    return data;
  }, []);

  // ---- Read time-domain (waveform) data ----
  const getWaveformData = useCallback(() => {
    if (!analyserRef.current) return new Uint8Array(0);
    const data = new Uint8Array(analyserRef.current.fftSize);
    analyserRef.current.getByteTimeDomainData(data);
    return data;
  }, []);

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      disconnectSource();
      if (audioSrc) URL.revokeObjectURL(audioSrc);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    isPlaying, inputMode, audioFile, audioSrc,
    error, isReady, volume,
    // Refs
    audioElRef,
    analyserRef,
    audioCtxRef,   // exposed for MediaRecorder in useRecorder
    // Actions
    startMic, stopMic, loadFile,
    togglePlay, updateVolume, switchMode,
    // Data readers
    getFrequencyData, getWaveformData,
  };
}
