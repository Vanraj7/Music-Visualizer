// =============================================
// useAnimationLoop.js
// A clean abstraction around requestAnimationFrame.
// Calls `callback` on every animation frame while
// `active` is true. Automatically cleans up on
// unmount or when `active` changes to false.
// =============================================

import { useEffect, useRef } from 'react';

/**
 * @param {Function} callback - Called every frame. Receives `deltaTime` in ms.
 * @param {boolean}  active   - Whether the loop should run.
 */
export function useAnimationLoop(callback, active) {
  const rafRef      = useRef(null);  // requestAnimationFrame ID
  const callbackRef = useRef(callback); // Always-fresh callback reference
  const lastTimeRef = useRef(null);    // Timestamp of previous frame

  // Keep callbackRef current without restarting the loop
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) {
      // Cancel any running frame
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return;
    }

    const loop = (timestamp) => {
      // Calculate time since last frame (for frame-rate independent animations)
      const delta = lastTimeRef.current ? timestamp - lastTimeRef.current : 0;
      lastTimeRef.current = timestamp;

      callbackRef.current(delta);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    // Cleanup when active goes false or component unmounts
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, [active]);
}
