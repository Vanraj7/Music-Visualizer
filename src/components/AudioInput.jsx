// =============================================
// AudioInput.jsx
// Handles user input: switching between file
// and microphone modes, drag-and-drop file
// loading, and play/pause controls.
// =============================================

import React, { useRef, useState, useCallback } from 'react';
import './AudioInput.css';

// ---- Icon Components ----
const MicIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const FileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

/**
 * @prop {string}   inputMode   - 'file' | 'mic'
 * @prop {Function} switchMode  - (mode) => void
 * @prop {string}   audioSrc    - Object URL of loaded file
 * @prop {object}   audioFile   - File object
 * @prop {boolean}  isPlaying
 * @prop {Function} togglePlay
 * @prop {Function} loadFile    - (File) => void
 * @prop {Function} startMic
 * @prop {Function} stopMic
 * @prop {string|null} error
 * @prop {React.Ref}   audioElRef - Ref for <audio> element
 */
export function AudioInput({
  inputMode, switchMode,
  audioSrc, audioFile, isPlaying,
  togglePlay, loadFile,
  startMic, stopMic,
  error, audioElRef,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // ---- Drag & Drop handlers ----
  const handleDragOver  = useCallback((e) => { e.preventDefault(); setIsDragging(true);  }, []);
  const handleDragLeave = useCallback(()  => { setIsDragging(false); }, []);
  const handleDrop      = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) loadFile(file);
  }, [loadFile]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    // Reset input so same file can be reselected
    e.target.value = '';
  }, [loadFile]);

  const handleMicToggle = useCallback(() => {
    if (isPlaying) stopMic();
    else           startMic();
  }, [isPlaying, startMic, stopMic]);

  return (
    <div className="audio-input">
      {/* ---- Mode Tabs ---- */}
      <div className="audio-input__tabs">
        <button
          className={`audio-input__tab ${inputMode === 'file' ? 'audio-input__tab--active' : ''}`}
          onClick={() => switchMode('file')}
        >
          <FileIcon /> File
        </button>
        <button
          className={`audio-input__tab ${inputMode === 'mic' ? 'audio-input__tab--active' : ''}`}
          onClick={() => switchMode('mic')}
        >
          <MicIcon active={false} /> Microphone
        </button>
      </div>

      {/* ---- File Mode ---- */}
      {inputMode === 'file' && (
        <div className="audio-input__file-area">
          {/* Drop zone */}
          <div
            className={`audio-input__dropzone ${isDragging ? 'audio-input__dropzone--dragging' : ''} ${audioFile ? 'audio-input__dropzone--loaded' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            {audioFile ? (
              <div className="audio-input__file-info">
                <span className="audio-input__file-name">{audioFile.name}</span>
                <span className="audio-input__file-hint">Click to change</span>
              </div>
            ) : (
              <div className="audio-input__empty">
                <UploadIcon />
                <p>Drop an audio file here</p>
                <span>or click to browse</span>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="visually-hidden"
            onChange={handleFileChange}
          />

          {/* Hidden audio element for MediaElementSource */}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio ref={audioElRef} src={audioSrc} loop />

          {/* Play / Pause button */}
          {audioFile && (
            <button
              className={`audio-input__play-btn ${isPlaying ? 'audio-input__play-btn--playing' : ''}`}
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
          )}
        </div>
      )}

      {/* ---- Mic Mode ---- */}
      {inputMode === 'mic' && (
        <div className="audio-input__mic-area">
          <button
            className={`audio-input__mic-btn ${isPlaying ? 'audio-input__mic-btn--active' : ''}`}
            onClick={handleMicToggle}
            aria-label={isPlaying ? 'Stop microphone' : 'Start microphone'}
          >
            <span className="audio-input__mic-icon">
              <MicIcon active={isPlaying} />
              {isPlaying && <span className="audio-input__mic-ring" />}
            </span>
            <span>{isPlaying ? 'Stop Listening' : 'Start Listening'}</span>
          </button>
          {isPlaying && (
            <p className="audio-input__mic-status">
              <span className="audio-input__live-dot" />
              Live — make some noise!
            </p>
          )}
        </div>
      )}

      {/* ---- Error Display ---- */}
      {error && (
        <div className="audio-input__error" role="alert">
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
