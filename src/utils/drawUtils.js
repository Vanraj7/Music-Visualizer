// =============================================
// drawUtils.js — expanded with all visualizers
// =============================================

// -----------------------------------------------
// SHARED HELPERS
// -----------------------------------------------
function mapRange(v, inMin, inMax, outMin, outMax) {
  return outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);
}

function getColor(colorMode, fraction, amplitude, alpha = 1) {
  if (colorMode === 'rainbow') {
    return `hsla(${fraction * 300}, 90%, ${45 + amplitude * 25}%, ${alpha})`;
  }
  if (colorMode === 'purple') {
    const r = Math.round(155 + 100 * amplitude);
    const g = Math.round(93  -  93 * amplitude);
    const b = Math.round(229 -  96 * amplitude);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (amplitude > 0.5) return `hsla(${40 + amplitude * 20}, 90%, 60%, ${alpha})`;
  return `hsla(${170 - amplitude * 20}, 90%, 60%, ${alpha})`;
}

// -----------------------------------------------
// CAMERA SHAKE STATE
// -----------------------------------------------
let shakeX = 0, shakeY = 0, shakeDuration = 0;

export function triggerShake(intensity = 8) {
  shakeX        = (Math.random() - 0.5) * intensity * 2;
  shakeY        = (Math.random() - 0.5) * intensity * 2;
  shakeDuration = 12;
}

function applyShake(ctx) {
  if (shakeDuration > 0) {
    const decay = shakeDuration / 12;
    ctx.translate(shakeX * decay, shakeY * decay);
    shakeDuration--;
    if (shakeDuration <= 0) { shakeX = 0; shakeY = 0; }
  }
}

// -----------------------------------------------
// 1. BARS
// -----------------------------------------------
export function drawBars(ctx, freqData, width, height, colorMode = 'cyan') {
  ctx.save();
  applyShake(ctx);
  ctx.fillStyle = 'rgba(10, 10, 15, 0.75)';
  ctx.fillRect(-50, -50, width + 100, height + 100);
  if (!freqData.length) { ctx.restore(); return; }

  const barCount = Math.min(Math.floor(freqData.length * 0.55), 128);
  const barWidth = (width / barCount) - 1.5;
  const gap = 1.5;

  for (let i = 0; i < barCount; i++) {
    const value = freqData[i];
    const barH  = (value / 255) * height * 0.85;
    const x     = i * (barWidth + gap);
    const y     = height - barH;
    const amp   = value / 255;
    const color = getColor(colorMode, i / barCount, amp);

    ctx.fillStyle = color;
    ctx.beginPath();
    const r = Math.min(barWidth / 2, 3);
    if (barH > r * 2) {
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barWidth - r, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
      ctx.lineTo(x + barWidth, height);
      ctx.lineTo(x, height);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
    } else {
      ctx.rect(x, y, barWidth, Math.max(barH, 1));
    }
    ctx.fill();

    if (barH > 2) {
      ctx.fillStyle = getColor(colorMode, i / barCount, amp, 0.12);
      ctx.fillRect(x, height + 2, barWidth, Math.min(barH * 0.3, 30));
    }
  }
  ctx.restore();
}

// -----------------------------------------------
// 2. WAVEFORM
// -----------------------------------------------
export function drawWaveform(ctx, waveData, width, height, colorMode = 'cyan') {
  ctx.save();
  applyShake(ctx);
  ctx.fillStyle = 'rgba(10, 10, 15, 0.6)';
  ctx.fillRect(-50, -50, width + 100, height + 100);
  if (!waveData.length) { ctx.restore(); return; }

  const midY = height / 2;
  const sliceWidth = width / waveData.length;
  const strokeMap = { cyan: '#00f5d4', purple: '#9b5de5' };

  ctx.lineWidth  = 2.5;
  ctx.shadowBlur = 12;

  if (colorMode === 'rainbow') {
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0,    '#f72585');
    grad.addColorStop(0.33, '#9b5de5');
    grad.addColorStop(0.66, '#00f5d4');
    grad.addColorStop(1,    '#f4b942');
    ctx.strokeStyle = grad;
    ctx.shadowColor = 'rgba(0,245,212,0.4)';
  } else {
    ctx.strokeStyle = strokeMap[colorMode] || '#00f5d4';
    ctx.shadowColor = strokeMap[colorMode] || '#00f5d4';
  }

  ctx.beginPath();
  for (let i = 0; i < waveData.length; i++) {
    const y = midY + ((waveData[i] / 128) - 1) * (height * 0.42);
    i === 0 ? ctx.moveTo(i * sliceWidth, y) : ctx.lineTo(i * sliceWidth, y);
  }
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(width, midY);
  ctx.stroke();
  ctx.restore();
}

// -----------------------------------------------
// 3. PARTICLES
// -----------------------------------------------
const particles = [];
const PARTICLE_COUNT = 220;

export function initParticles(width, height) {
  particles.length = 0;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createParticle(width, height, true));
  }
}

function createParticle(width, height, randomY = false) {
  return {
    x: Math.random() * width,
    y: randomY ? Math.random() * height : height + 5,
    vx: (Math.random() - 0.5) * 1.5,
    vy: -(Math.random() * 2 + 0.5),
    size: Math.random() * 3 + 1,
    life: 1,
    decay: Math.random() * 0.008 + 0.003,
    hue: Math.random() * 360,
    freqBand: Math.floor(Math.random() * 60),
  };
}

export function drawParticles(ctx, freqData, width, height, colorMode = 'cyan') {
  ctx.save();
  applyShake(ctx);
  ctx.fillStyle = 'rgba(10, 10, 15, 0.25)';
  ctx.fillRect(-50, -50, width + 100, height + 100);

  const avg = freqData.length
    ? freqData.reduce((s, v) => s + v, 0) / freqData.length / 255 : 0;

  for (let i = 0; i < particles.length; i++) {
    const p   = particles[i];
    const amp = freqData.length ? freqData[p.freqBand] / 255 : 0;
    p.x    += p.vx * (1 + amp * 4);
    p.y    += p.vy * (1 + amp * 5 + avg * 3);
    p.life -= p.decay * (1 + amp);
    if (p.life <= 0 || p.y < -10 || p.x < -10 || p.x > width + 10) {
      particles[i] = createParticle(width, height);
      continue;
    }
    const color = getColor(colorMode, p.freqBand / 60, amp, p.life);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.5 + amp * 0.8), 0, Math.PI * 2);
    ctx.fillStyle   = color;
    ctx.shadowBlur  = 8 + amp * 12;
    ctx.shadowColor = color;
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

// -----------------------------------------------
// 4. CIRCULAR / RADIAL BARS  ← NEW
// -----------------------------------------------
export function drawCircular(ctx, freqData, width, height, colorMode = 'cyan') {
  ctx.save();
  applyShake(ctx);
  ctx.fillStyle = 'rgba(10, 10, 15, 0.55)';
  ctx.fillRect(-50, -50, width + 100, height + 100);
  if (!freqData.length) { ctx.restore(); return; }

  const cx      = width  / 2;
  const cy      = height / 2;
  const radius  = Math.min(width, height) * 0.28;
  const maxBarH = Math.min(width, height) * 0.22;
  const barCount = 128;
  const angleStep = (Math.PI * 2) / barCount;

  for (let i = 0; i < barCount; i++) {
    const value    = freqData[Math.floor(i * freqData.length / barCount / 1.8)];
    const amp      = value / 255;
    const barH     = amp * maxBarH;
    const angle    = i * angleStep - Math.PI / 2;
    const color    = getColor(colorMode, i / barCount, amp);

    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * (radius + barH);
    const y2 = cy + Math.sin(angle) * (radius + barH);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth   = Math.max(2, (Math.PI * 2 * radius) / barCount - 1);
    ctx.strokeStyle = color;
    ctx.shadowBlur  = amp > 0.5 ? 12 : 4;
    ctx.shadowColor = color;
    ctx.stroke();
  }

  // Inner circle pulsing
  const avgAmp     = freqData.reduce((s, v) => s + v, 0) / freqData.length / 255;
  const innerR     = radius * (0.55 + avgAmp * 0.45);
  const t          = Date.now() * 0.001;
  const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
  centerGrad.addColorStop(0,   getColor(colorMode, (t * 0.1) % 1, avgAmp, 0.7));
  centerGrad.addColorStop(0.6, getColor(colorMode, (t * 0.1) % 1, avgAmp, 0.2));
  centerGrad.addColorStop(1,   'rgba(10,10,15,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle  = centerGrad;
  ctx.shadowBlur = 0;
  ctx.fill();

  ctx.restore();
}

// -----------------------------------------------
// 5. SPECTROGRAM  ← NEW
// -----------------------------------------------
let spectrogramCanvas = null, spectrogramCtx = null;
let spectrogramW = 0, spectrogramH = 0;

export function initSpectrogram(width, height) {
  spectrogramCanvas        = document.createElement('canvas');
  spectrogramCanvas.width  = width;
  spectrogramCanvas.height = height;
  spectrogramCtx           = spectrogramCanvas.getContext('2d');
  spectrogramW = width;
  spectrogramH = height;
}

export function drawSpectrogram(ctx, freqData, width, height, colorMode = 'cyan') {
  if (!spectrogramCanvas || spectrogramW !== width || spectrogramH !== height) {
    initSpectrogram(width, height);
  }
  const sCtx = spectrogramCtx;

  // Scroll left 1px
  sCtx.drawImage(spectrogramCanvas, -1, 0);
  sCtx.clearRect(width - 1, 0, 1, height);

  // Draw new column
  for (let i = 0; i < height; i++) {
    const binIndex = Math.floor((1 - i / height) * freqData.length * 0.55);
    const amp      = (freqData[binIndex] || 0) / 255;
    if (amp < 0.02) continue;

    let h, s, l;
    if (colorMode === 'rainbow') {
      h = (1 - i / height) * 260; s = 90; l = 30 + amp * 45;
    } else if (colorMode === 'purple') {
      h = 270 + amp * 60; s = 80; l = 20 + amp * 50;
    } else {
      h = 180 + amp * 40; s = 90; l = 10 + amp * 60;
    }
    sCtx.fillStyle = `hsla(${h},${s}%,${l}%,${0.3 + amp * 0.7})`;
    sCtx.fillRect(width - 1, i, 1, 1);
  }

  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(spectrogramCanvas, 0, 0);

  // Labels
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.font      = '10px monospace';
  [{ label: '20Hz', y: height - 4 }, { label: '1kHz', y: height * 0.45 }, { label: '20kHz', y: 12 }]
    .forEach(({ label, y }) => ctx.fillText(label, 4, y));
}

// -----------------------------------------------
// 6. KALEIDOSCOPE  ← NEW
// -----------------------------------------------
export function drawKaleidoscope(ctx, freqData, waveData, width, height, colorMode = 'cyan') {
  ctx.save();
  applyShake(ctx);
  ctx.fillStyle = 'rgba(10, 10, 15, 0.35)';
  ctx.fillRect(-50, -50, width + 100, height + 100);

  const cx     = width  / 2;
  const cy     = height / 2;
  const slices = 8;
  const angle  = (Math.PI * 2) / slices;
  const maxR   = Math.min(cx, cy) * 0.95;
  const avgAmp = freqData.length
    ? freqData.slice(0, 30).reduce((s, v) => s + v, 0) / 30 / 255 : 0;

  for (let s = 0; s < slices; s++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(s * angle);
    if (s % 2 === 1) ctx.scale(-1, 1);

    ctx.beginPath();
    for (let i = 0; i < waveData.length; i++) {
      const fraction = i / waveData.length;
      const wAmp     = ((waveData[i] / 128) - 1) * 0.3;
      const fIdx     = Math.floor(fraction * Math.min(freqData.length * 0.5, 80));
      const fAmp     = (freqData[fIdx] || 0) / 255;
      const r        = fraction * maxR * (0.7 + fAmp * 0.4 + wAmp);
      const a        = (fraction - 0.5) * angle;
      const x        = Math.cos(a) * r;
      const y        = Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }

    const grad = ctx.createLinearGradient(0, 0, maxR * 0.7, 0);
    if (colorMode === 'rainbow') {
      grad.addColorStop(0,   `hsla(${s*45},90%,50%,0)`);
      grad.addColorStop(0.3, `hsla(${s*45},90%,60%,0.85)`);
      grad.addColorStop(1,   `hsla(${(s*45+60)%360},90%,50%,0)`);
    } else if (colorMode === 'purple') {
      grad.addColorStop(0,   'rgba(155,93,229,0)');
      grad.addColorStop(0.4, `rgba(${155+avgAmp*100},${93-avgAmp*50},229,0.85)`);
      grad.addColorStop(1,   'rgba(247,37,133,0)');
    } else {
      grad.addColorStop(0,   'rgba(0,245,212,0)');
      grad.addColorStop(0.4, `rgba(0,${200+avgAmp*55},${180+avgAmp*75},0.85)`);
      grad.addColorStop(1,   'rgba(244,185,66,0)');
    }

    ctx.strokeStyle = grad;
    ctx.lineWidth   = 1.5 + avgAmp * 2;
    ctx.shadowBlur  = 8 + avgAmp * 16;
    ctx.shadowColor = colorMode === 'purple' ? '#9b5de5' : '#00f5d4';
    ctx.stroke();
    ctx.restore();
  }

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 3 + avgAmp * 6, 0, Math.PI * 2);
  ctx.fillStyle   = colorMode === 'purple' ? '#f72585' : '#00f5d4';
  ctx.shadowBlur  = 20;
  ctx.shadowColor = ctx.fillStyle;
  ctx.fill();
  ctx.restore();
}

// -----------------------------------------------
// BEAT FLASH OVERLAY
// -----------------------------------------------
export function drawBeatFlash(ctx, width, height, colorMode = 'cyan') {
  const colors = {
    cyan:    'rgba(0, 245, 212, 0.08)',
    purple:  'rgba(155, 93, 229, 0.10)',
    rainbow: 'rgba(247, 37, 133, 0.09)',
  };
  ctx.fillStyle = colors[colorMode] || colors.cyan;
  ctx.fillRect(0, 0, width, height);

  const cx   = width / 2;
  const cy   = height / 2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.6);
  grad.addColorStop(0, colors[colorMode] || colors.cyan);
  grad.addColorStop(1, 'rgba(10,10,15,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}
