// =============================================
// useRecorder.js
// Records the canvas + audio into a WebM video
// using the MediaRecorder API.
//
// Flow:
//   1. Capture canvas stream (captureStream)
//   2. Capture audio output stream (from AudioContext dest)
//   3. Combine tracks into one MediaStream
//   4. Feed into MediaRecorder → collect chunks
//   5. On stop: assemble Blob → trigger download
// =============================================

import { useRef, useState, useCallback } from 'react';

export function useRecorder() {
  const recorderRef  = useRef(null);
  const chunksRef    = useRef([]);
  const [isRecording, setIsRecording] = useState(false);

  /**
   * Start recording.
   * @param {HTMLCanvasElement} canvas       - The visualizer canvas element
   * @param {AudioContext}      audioCtx     - The Web Audio context
   * @param {number}            fps          - Canvas capture frame rate (default 30)
   */
  const startRecording = useCallback((canvas, audioCtx, fps = 30) => {
    if (!canvas || isRecording) return;

    chunksRef.current = [];

    // 1. Get canvas video stream
    const canvasStream = canvas.captureStream(fps);

    // 2. Get audio output stream (what the user hears)
    let combinedStream;
    try {
      const audioDestination = audioCtx.createMediaStreamDestination();
      // Re-connect gain → new destination to capture audio
      // Note: we add the audio track to the canvas stream
      combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks(),
      ]);
    } catch {
      // If audio capture fails, record video-only
      combinedStream = canvasStream;
    }

    // 3. Choose best supported format
    const mimeType = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ].find(m => MediaRecorder.isTypeSupported(m)) || '';

    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 4_000_000, // 4 Mbps — good quality
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `soundviz-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      chunksRef.current = [];
    };

    recorder.start(100); // Collect data every 100ms
    recorderRef.current = recorder;
    setIsRecording(true);
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      recorderRef.current = null;
      setIsRecording(false);
    }
  }, [isRecording]);

  /**
   * Save the current canvas frame as a PNG screenshot.
   * @param {HTMLCanvasElement} canvas
   */
  const takeScreenshot = useCallback((canvas) => {
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a   = document.createElement('a');
    a.href    = url;
    a.download = `soundviz-${Date.now()}.png`;
    a.click();
  }, []);

  return { isRecording, startRecording, stopRecording, takeScreenshot };
}
