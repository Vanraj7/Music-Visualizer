// =============================================
// useKeyboardShortcuts.js
// Global keyboard shortcut handler.
// Attaches a keydown listener on mount and
// dispatches to the provided action map.
// =============================================

import { useEffect } from 'react';

/**
 * @param {Object} actions - Map of key → handler function
 * Example: { ' ': togglePlay, 'f': toggleFullscreen, 'b': () => setMode('bars') }
 * @param {boolean} enabled - Whether shortcuts are active
 */
export function useKeyboardShortcuts(actions, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKey = (e) => {
      // Don't fire when user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      if (actions[key]) {
        e.preventDefault();
        actions[key](e);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [actions, enabled]);
}
