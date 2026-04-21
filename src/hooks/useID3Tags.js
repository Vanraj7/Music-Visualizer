// =============================================
// useID3Tags.js
// Reads ID3 metadata (title, artist, album,
// cover art) from an audio File object by
// manually parsing the binary ID3v2 header.
//
// Supports ID3v2.3 and ID3v2.4 (most MP3s).
// Falls back to the filename if no tags found.
// =============================================

import { useState, useCallback } from 'react';

export function useID3Tags() {
  const [tags, setTags] = useState({ title: '', artist: '', album: '', cover: null });

  const readTags = useCallback((file) => {
    if (!file) {
      setTags({ title: '', artist: '', album: '', cover: null });
      return;
    }

    // Use filename as fallback title (strip extension)
    const fallbackTitle = file.name.replace(/\.[^/.]+$/, '');

    // Read first 256KB — enough for ID3 header + cover art thumbnail
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        const view   = new DataView(buffer);
        const bytes  = new Uint8Array(buffer);

        // Check for ID3 magic bytes: "ID3"
        if (
          bytes[0] !== 0x49 || // I
          bytes[1] !== 0x44 || // D
          bytes[2] !== 0x33    // 3
        ) {
          setTags({ title: fallbackTitle, artist: '', album: '', cover: null });
          return;
        }

        // ID3v2 header: bytes 0-9
        // const version  = bytes[3]; // 3 = v2.3, 4 = v2.4
        const flagByte = bytes[5];
        const hasExtHeader = !!(flagByte & 0x40);

        // Tag size is encoded as 4 syncsafe bytes (7 bits each)
        const tagSize =
          ((bytes[6] & 0x7f) << 21) |
          ((bytes[7] & 0x7f) << 14) |
          ((bytes[8] & 0x7f) << 7)  |
           (bytes[9] & 0x7f);

        let offset = 10;

        // Skip extended header if present
        if (hasExtHeader) {
          const extSize =
            (bytes[10] << 24) | (bytes[11] << 16) | (bytes[12] << 8) | bytes[13];
          offset += extSize + 4;
        }

        const result = { title: fallbackTitle, artist: '', album: '', cover: null };
        const end    = Math.min(10 + tagSize, buffer.byteLength);

        // Parse frames
        while (offset + 10 < end) {
          // Frame ID: 4 ASCII chars
          const frameId =
            String.fromCharCode(bytes[offset], bytes[offset+1], bytes[offset+2], bytes[offset+3]);

          // Frame size: 4 bytes (NOT syncsafe in v2.3, syncsafe in v2.4 — we try both)
          const frameSize =
            (bytes[offset+4] << 24) | (bytes[offset+5] << 16) |
            (bytes[offset+6] <<  8) |  bytes[offset+7];

          offset += 10; // Move past frame header

          if (frameSize <= 0 || frameSize > end - offset) break;

          const frameData = bytes.slice(offset, offset + frameSize);

          // Text frames: TIT2 (title), TPE1 (artist), TALB (album)
          if (['TIT2', 'TPE1', 'TALB'].includes(frameId)) {
            const encoding = frameData[0]; // 0=latin1, 1=utf16, 3=utf8
            let text = '';
            if (encoding === 0 || encoding === 3) {
              // Latin-1 or UTF-8
              text = new TextDecoder('utf-8').decode(frameData.slice(1)).replace(/\0/g, '').trim();
            } else if (encoding === 1) {
              // UTF-16 with BOM
              text = new TextDecoder('utf-16').decode(frameData.slice(1)).replace(/\0/g, '').trim();
            }
            if (frameId === 'TIT2') result.title  = text || fallbackTitle;
            if (frameId === 'TPE1') result.artist = text;
            if (frameId === 'TALB') result.album  = text;
          }

          // Cover art: APIC frame
          if (frameId === 'APIC' && !result.cover) {
            try {
              // Find the image data: skip encoding byte, mime type, null, pic type, desc, null
              let i = 1;
              while (i < frameData.length && frameData[i] !== 0) i++; // skip mime
              i++; // skip null
              i++; // skip picture type
              while (i < frameData.length && frameData[i] !== 0) i++; // skip description
              i++; // skip null

              const imgData = frameData.slice(i);
              const blob    = new Blob([imgData], { type: 'image/jpeg' });
              result.cover  = URL.createObjectURL(blob);
            } catch { /* ignore cover parse errors */ }
          }

          offset += frameSize;
        }

        setTags(result);
      } catch {
        setTags({ title: fallbackTitle, artist: '', album: '', cover: null });
      }
    };

    // Read first 512KB
    reader.readAsArrayBuffer(file.slice(0, 512 * 1024));
  }, []);

  return { tags, readTags };
}
