// game.js — Honey Pot Catch (isolated, production-ready)
// Owns ONLY the Honey Pot Catch canvas + HUD IDs.
// Does NOT control site-wide nav, cover, modals, or audio systems.
'use strict';

(function () {
  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  function isMobileDevice() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const touch =
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || 'ontouchstart' in window;
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
      (touch && window.innerWidth <= 900)
    );
  }

  class FrameRateLimiter {
    constructor(targetFPS = 60) {
      this.setTarget(targetFPS);
      this.lastFrameTime = 0;
    }
    setTarget(targetFPS) {
      const fps = Number(targetFPS) || 60;
      this.targetFPS = clamp(fps, 10, 120);
      this.frameInterval = 1000 / this.targetFPS;
    }
    shouldRender(ts) {
      if (ts - this.lastFrameTime >= this.frameInterval) {
        this.lastFrameTime = ts;
        return true;
      }
      return false;
    }
    reset() {
      this.lastFrameTime = 0;
    }
  }

  function shakeElement(el, intensity = 5, duration = 260) {
    if (!el || !el.style) return;
    const base = el.style.transform || '';
    const start = nowMs();

    function tick(t) {
      const p = (t - start) / duration;
      if (p >= 1) {
        el.style.transform = base;
        return;
      }
      const k = 1 - p;
      const dx = (Math.random() - 0.5) * intensity * k;
      const dy = (Math.random() - 0.5) * intensity * k;
      el.style.transform = `${base} translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Best-effort: unlock iOS audio context (if a site audio manager exists, we won't fight it)
  function unlockAudioOnce() {
    if (unlockAudioOnce._done) return;
    unlockAudioOnce._done = true;

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;

      const ctx = unlockAudioOnce._ctx || new AC();
      unlockAudioOnce._ctx = ctx;

      const resume = () => {
        try {
          if (ctx.state === 'suspended') ctx.resume();
          // tiny blip (inaudible) to fully unlock on some Safari versions
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          g.gain.value = 0.0001;
          o.connect(g).connect(ctx.destination);
          o.start();
          o.stop(ctx.currentTime + 0.02);
        } catch (_) {}
      };

      resume();
      window.removeEventListener('touchstart', resume);
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('click', resume);
    } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // Enhanced Honey Catch Game
  // ---------------------------------------------------------------------------
function EnhancedHoneyCatchGame() {
  console.log('[HoneyCatch] Init…');

  // DOM (required IDs)
  const canvas = document.getElementById('honey-game');
  if (!canvas) {
    console.error('[HoneyCatch] #honey-game canvas not found.');
    return null;
  }

  // iOS Safari: hard-stop long-press loupe/callout on the canvas
  const stop = (e) => {
    // Only block interactions intended for gameplay
    e.preventDefault();
  };
  canvas.addEventListener('contextmenu', stop, { passive: false });
  canvas.addEventListener('selectstart', stop, { passive: false });
  canvas.addEventListener('touchstart', stop, { passive: false });
  canvas.addEventListener('touchmove', stop, { passive: false });

  // Use desynchronized where supported for lower latency on mobile
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) {
    console.error('[HoneyCatch] 2D context not available.');
    return null;
  }


    const scoreSpan = document.getElementById('score-count');
    const timeSpan = document.getElementById('time-count');
    const livesSpan = document.getElementById('catch-lives');
    const startBtn = document.getElementById('start-catch');
    const pauseBtn = document.getElementById('pause-catch');
    const overlay = document.getElementById('catch-overlay');
    const overlayLine = document.getElementById('catch-countdown');
    const overlayHint = document.getElementById('catch-hint');
    const card = document.getElementById('catch-card');
    const multiplierSpan = document.getElementById('catch-multiplier');
    const comboSpan = document.getElementById('catch-combo');
    const statusEl = document.getElementById('catchStatus');

    const joystick = document.getElementById('catchJoystick');
    const joystickKnob =
      document.getElementById('catchJoystickKnob') ||
      (joystick ? joystick.querySelector('.joystick-handle, .joystick-knob') : null);
    const timeBar = document.getElementById('catch-timebar');
    const lifeBar = document.getElementById('catch-life-bar');
    const modeButtons = Array.from(document.querySelectorAll('[data-catch-mode]'));
    const modeDescription = document.getElementById('catch-mode-description');
    const bestScoreEl = document.getElementById('catch-best');

    const MODES = {
      calm: {
        label: 'Calm Stroll',
        time: 70,
        lives: 4,
        spawnScale: 0.92,
        speedScale: 0.92,
        scoreScale: 0.95,
        hint: 'A relaxed 70 second run with extra hearts.',
      },
      brisk: {
        label: 'Adventure',
        time: 60,
        lives: 3,
        spawnScale: 1,
        speedScale: 1,
        scoreScale: 1,
        hint: 'Balanced pace. Great for personal bests.',
      },
      rush: {
        label: 'Honey Rush',
        time: 50,
        lives: 2,
        spawnScale: 1.14,
        speedScale: 1.08,
        scoreScale: 1.12,
        hint: 'Short, spicy, and higher scoring.',
      },
    };
    // Canvas sizing: CSS px coordinates, DPR drawing buffer
    let W = 0;
    let H = 0;
    let DPR = 1;

    const bgCanvas = document.createElement('canvas');
    const bg = bgCanvas.getContext('2d');

    function resizeCanvas() {
  // Debounce resize to prevent thrashing
  if (resizeCanvas._debounce) {
    clearTimeout(resizeCanvas._debounce);
  }
  resizeCanvas._debounce = setTimeout(() => {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, Math.floor(rect.width));
    const cssH = Math.max(1, Math.floor(rect.height || rect.width * 0.62));
    
    // Prevent unnecessary resizes
    if (cssW === W && cssH === H) return;
    
    DPR = window.devicePixelRatio || 1;
    W = cssW;
    H = cssH;
    
    // Set canvas size only if changed
    if (canvas.width !== Math.floor(cssW * DPR) || 
        canvas.height !== Math.floor(cssH * DPR)) {
      canvas.width = Math.floor(cssW * DPR);
      canvas.height = Math.floor(cssH * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    
    // Resize background canvas
    if (bgCanvas.width !== cssW || bgCanvas.height !== cssH) {
      bgCanvas.width = cssW;
      bgCanvas.height = cssH;
      drawBackgroundOnce();
    }
    
    // Keep Pooh positioned
    state.poohX = clamp(state.poohX || cssW / 2, state.poohW / 2, cssW - state.poohW / 2);
    state.poohY = cssH - 70;
    
  }, 100); // 100ms debounce
}
    // Draw background into bgCanvas (CSS px)
    function drawBackgroundOnce() {
      if (!bg) return;

      // sky
      const sky = bg.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#87CEEB');
      sky.addColorStop(0.62, '#B3E5FC');
      sky.addColorStop(1, '#E3F2FD');
      bg.fillStyle = sky;
      bg.fillRect(0, 0, W, H);

      // sun
      bg.save();
      bg.shadowColor = 'rgba(255, 215, 0, 0.45)';
      bg.shadowBlur = 28;
      bg.fillStyle = '#FFEB3B';
      bg.beginPath();
      bg.arc(80, 80, 26, 0, Math.PI * 2);
      bg.fill();
      bg.restore();

      // clouds
      bg.fillStyle = 'rgba(255,255,255,0.9)';
      const clouds = [
        { x: W * 0.25, y: 70, s: 1.0 },
        { x: W * 0.62, y: 112, s: 1.15 },
        { x: W * 0.82, y: 64, s: 0.92 },
      ];
      clouds.forEach((c) => {
        bg.save();
        bg.translate(c.x, c.y);
        bg.scale(c.s, c.s);
        bg.beginPath();
        bg.arc(0, 0, 18, 0, Math.PI * 2);
        bg.arc(22, -10, 22, 0, Math.PI * 2);
        bg.arc(46, 0, 18, 0, Math.PI * 2);
        bg.fill();
        bg.restore();
      });

      // ground
      const groundH = 72;
      const groundY = H - groundH;
      const ground = bg.createLinearGradient(0, groundY, 0, H);
      ground.addColorStop(0, '#8BC34A');
      ground.addColorStop(1, '#689F38');
      bg.fillStyle = ground;
      bg.fillRect(0, groundY, W, groundH);

      // trees
      bg.fillStyle = '#8B4513';
      bg.fillRect(90, groundY - 120, 24, 140);
      bg.fillRect(W - 120, groundY - 110, 26, 130);
      bg.fillStyle = '#2E7D32';
      bg.beginPath();
      bg.arc(102, groundY - 130, 52, 0, Math.PI * 2);
      bg.arc(W - 107, groundY - 125, 48, 0, Math.PI * 2);
      bg.fill();
    }

    // -------------------------------------------------------------------------
    // Particles (simple + fast)
    // -------------------------------------------------------------------------
    const particles = [];
    const MAX_PARTICLES = isMobileDevice() ? 90 : 220;

    function burst(x, y, count, color) {
      for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) break;
        const a = Math.random() * Math.PI * 2;
        const s = 1.5 + Math.random() * 3.2;
        particles.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 1.2,
          life: 1,
          decay: 0.03 + Math.random() * 0.03,
          r: 2 + Math.random() * 4,
          color,
        });
      }
    }

    function updateParticles(dt) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.08 * dt;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.life -= p.decay * dt;
        if (p.life <= 0) particles.splice(i, 1);
      }
    }

    function renderParticles() {
      ctx.save();
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // -------------------------------------------------------------------------
    // Power-ups
    // -------------------------------------------------------------------------
    const powerUpTypes = {
      heart: { color: '#FF6B6B', icon: '❤️', duration: 0 },
      shield: { color: '#4285F4', icon: '🛡️', duration: 5000 },
      clock: { color: '#4CAF50', icon: '⏱️', duration: 0 },
      star: { color: '#FFD700', icon: '⭐', duration: 8000 },
      lightning: { color: '#9C27B0', icon: '⚡', duration: 6000 },
    };

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------
    const frameLimiter = new FrameRateLimiter(isMobileDevice() ? 30 : 60);

    const state = {
      running: false,
      paused: false,
      over: false,

      score: 0,
      timeLeft: 60,
      lives: 3,

      combos: 0,
      multiplier: 1,
      streak: 0,
      lastCatchAt: 0,

      poohX: 0,
      poohY: 0,
      poohW: 58,
      poohH: 58,

      invincible: false,
      invincibleUntil: 0,
      doublePoints: false,
      doublePointsUntil: 0,
      slowMo: false,
      slowMoUntil: 0,

      honeyRushUntil: 0,
      bestScore: 0,

      mode: 'calm',
      modeCfg: MODES.calm,

      difficulty: 0,

      lastTs: nowMs(),
      rafId: null,
      timerId: null,
      countdownId: null,
      overlayT: null,

      pots: [],
      bees: [],
      powerUps: [],

      // joystick
      joyActive: false,
      joyPointerId: null,
      joyCenterX: 0,
      joyCenterY: 0,
      joyDx: 0,
      joyDy: 0,
    };

    function syncHUD() {
      if (scoreSpan) scoreSpan.textContent = String(state.score);
      if (timeSpan) timeSpan.textContent = String(state.timeLeft);
      if (livesSpan) livesSpan.textContent = String(state.lives);
      if (comboSpan) comboSpan.textContent = String(state.combos || 0);
      if (multiplierSpan) multiplierSpan.textContent = String(Math.round(state.multiplier * 10) / 10);
      if (pauseBtn) pauseBtn.setAttribute('aria-pressed', state.paused ? 'true' : 'false');
      if (bestScoreEl) bestScoreEl.textContent = String(state.bestScore);

      const timePct = clamp((state.timeLeft / state.modeCfg.time) * 100, 0, 100);
      if (timeBar) {
        timeBar.style.setProperty('--w', `${timePct}%`);
        timeBar.style.width = `${timePct}%`;
      }

      const lifePct = clamp((state.lives / state.modeCfg.lives) * 100, 0, 100);
      if (lifeBar) {
        lifeBar.style.setProperty('--w', `${lifePct}%`);
        lifeBar.style.width = `${lifePct}%`;
      }
    }

    function setStatus(text) {
      if (statusEl) statusEl.textContent = text;
    }

    function setOverlay(line, hint, persistent = false, duration = 1500) {
      if (!overlay || !overlayLine || !overlayHint) return;

      overlayLine.textContent = line || '';
      overlayHint.textContent = hint || '';
      overlay.classList.add('active');

      if (state.overlayT) clearTimeout(state.overlayT);

      if (!persistent) {
        state.overlayT = setTimeout(() => {
          overlay.classList.remove('active');
        }, duration);
      }
    }

    function setMode(modeKey) {
      const cfg = MODES[modeKey] || MODES.calm;
      state.mode = modeKey in MODES ? modeKey : 'calm';
      state.modeCfg = cfg;

      modeButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.catchMode === state.mode));
      if (modeDescription) modeDescription.textContent = cfg.hint;

      if (!state.running) {
        state.timeLeft = cfg.time;
        state.lives = cfg.lives;
        syncHUD();
      }
    }

    function loadBestScore() {
      try {
        const stored = Number(localStorage.getItem('catchBest') || '0');
        if (!Number.isNaN(stored) && stored > 0) {
          state.bestScore = stored;
        }
      } catch (_) {}
    }

    function maybeUpdateBest(score) {
      if (score <= state.bestScore) return false;
      state.bestScore = score;
      try {
        localStorage.setItem('catchBest', String(score));
      } catch (_) {}
      syncHUD();
      return true;
    }

    // -------------------------------------------------------------------------
    // Spawn + collisions
    // -------------------------------------------------------------------------
    function spawnPot() {
      const rushActive = state.honeyRushUntil > Date.now();
      const goldenChance = 0.16 + state.difficulty * 0.02 + (rushActive ? 0.35 : 0);
      const type = Math.random() < goldenChance ? 'golden' : 'normal';

      state.pots.push({
        x: 20 + Math.random() * (W - 40),
        y: -18,
        r: 14,
        vy: (2.2 + Math.random() * (1.6 + state.difficulty * 0.22)) * state.modeCfg.speedScale,
        type,
      });
    }

    function spawnBee() {
      const angryChance = state.difficulty >= 2 ? 0.22 : 0.08;
      const type = Math.random() < angryChance ? 'angry' : 'normal';

      state.bees.push({
        x: 20 + Math.random() * (W - 40),
        y: -18,
        r: 14,
        vy: (2.9 + Math.random() * (1.8 + state.difficulty * 0.22)) * state.modeCfg.speedScale,
        type,
        vx: 0,
      });
    }

    function spawnPowerUp() {
      const keys = Object.keys(powerUpTypes);
      const type = keys[(Math.random() * keys.length) | 0];
      state.powerUps.push({
        x: 24 + Math.random() * (W - 48),
        y: -18,
        r: 14,
        vy: (2.0 + Math.random() * 1.2) * state.modeCfg.speedScale,
        type,
      });
    }

    function hitPooh(x, y, r) {
      const cx = state.poohX;
      const cy = state.poohY - state.poohH * 0.5;
      const hw = state.poohW * 0.5;
      const hh = state.poohH * 0.5;

      // circle-vs-AABB
      const nx = clamp(x, cx - hw, cx + hw);
      const ny = clamp(y, cy - hh, cy + hh);
      const dx = x - nx;
      const dy = y - ny;
      return dx * dx + dy * dy <= r * r;
    }

    function applyPowerUp(type) {
      const now = Date.now();
      if (type === 'heart') {
        state.lives = Math.min(5, state.lives + 1);
        syncHUD();
        setOverlay('Sweet!', 'A little extra heart for Pooh.', false, 900);
        return;
      }
      if (type === 'clock') {
        state.timeLeft += 10;
        syncHUD();
        setOverlay('Bonus time!', '+10 seconds.', false, 900);
        return;
      }
      if (type === 'shield') {
        state.invincible = true;
        state.invincibleUntil = now + powerUpTypes.shield.duration;
        setOverlay('Shield!', 'Bees can’t hurt you for a bit.', false, 900);
        return;
      }
      if (type === 'star') {
        state.doublePoints = true;
        state.doublePointsUntil = now + powerUpTypes.star.duration;
        setOverlay('Double points!', 'Honey is extra sweet right now.', false, 900);
        return;
      }
      if (type === 'lightning') {
        state.slowMo = true;
        state.slowMoUntil = now + powerUpTypes.lightning.duration;
        setOverlay('Slow motion!', 'Everything slows down.', false, 900);
      }
    }

    function triggerHoneyRush() {
      state.honeyRushUntil = Date.now() + 5200;
      setOverlay('Honey rush!', 'Golden pots pouring in. Bees ease up briefly.', false, 1100);
      if (window.audioManager && typeof window.audioManager.playTone === 'function') {
        window.audioManager.playTone([523.25, 659.25], 0.12);
      }
    }

    // -------------------------------------------------------------------------
    // Rendering (CSS px coords)
    // -------------------------------------------------------------------------
    function drawPooh() {
      const x = state.poohX;
      const y = state.poohY;
      const w = state.poohW;
      const h = state.poohH;

      // shadow
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(x, y + 18, w * 0.42, h * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // body
      const bodyGrad = ctx.createLinearGradient(0, y - h, 0, y);
      bodyGrad.addColorStop(0, '#FFC107');
      bodyGrad.addColorStop(1, '#FF9800');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h, w, h, 16);
      ctx.fill();

      // belly
      ctx.fillStyle = 'rgba(255, 216, 166, 0.95)';
      ctx.beginPath();
      ctx.ellipse(x, y - h * 0.35, w * 0.28, h * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();

      // shirt
      ctx.fillStyle = '#D62E2E';
      ctx.fillRect(x - w / 2, y - h * 0.25, w, h * 0.25);

      // face
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x - w * 0.18, y - h * 0.72, 2.5, 0, Math.PI * 2);
      ctx.arc(x + w * 0.18, y - h * 0.72, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // nose
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.arc(x, y - h * 0.58, 4.2, 0, Math.PI * 2);
      ctx.fill();

      // invincibility ring
      if (state.invincible) {
        ctx.save();
        const a = 0.45 + Math.sin(Date.now() / 180) * 0.25;
        ctx.strokeStyle = `rgba(66,133,244,${a})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y - h * 0.55, w * 0.55, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    function drawPot(p) {
      const x = p.x;
      const y = p.y;

      // glow for golden
      if (p.type === 'golden') {
        ctx.save();
        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        ctx.shadowBlur = 14;
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const grad = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, 16);
      grad.addColorStop(0, '#FFEB3B');
      grad.addColorStop(0.75, '#FFD54F');
      grad.addColorStop(1, '#FFB300');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // lid
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x - 8, y - 14, 16, 4);
      ctx.fillRect(x - 4, y - 17, 8, 3);

      // honey drip
      ctx.fillStyle = '#FF9800';
      ctx.beginPath();
      ctx.ellipse(x, y + 4, 6, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawBee(b) {
      const x = b.x;
      const y = b.y + Math.sin(Date.now() / 90 + x) * 2.5;

      // wings
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(x - 10, y - 10, 8, 0, Math.PI * 2);
      ctx.arc(x + 10, y - 10, 8, 0, Math.PI * 2);
      ctx.fill();

      // body
      const grad = ctx.createRadialGradient(x, y, 2, x, y, 14);
      grad.addColorStop(0, '#FFEB3B');
      grad.addColorStop(1, '#FF9800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();

      // stripes
      ctx.fillStyle = '#000';
      ctx.fillRect(x - 6, y - 6, 4, 10);
      ctx.fillRect(x + 2, y - 6, 4, 10);

      // eyes
      ctx.beginPath();
      ctx.arc(x - 4, y - 3, 2, 0, Math.PI * 2);
      ctx.arc(x + 4, y - 3, 2, 0, Math.PI * 2);
      ctx.fill();

      if (b.type === 'angry') {
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💢', x, y - 18);
      }
    }

    function drawPowerUp(pu) {
      const cfg = powerUpTypes[pu.type];
      if (!cfg) return;
      const x = pu.x;
      const y = pu.y + Math.sin(Date.now() / 300 + x) * 3;

      ctx.save();
      ctx.fillStyle = cfg.color + '33';
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = cfg.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#111';
      ctx.fillText(cfg.icon, x, y + 0.5);
      ctx.restore();
    }

    function drawUI() {
      if (state.combos >= 3) {
        ctx.save();
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.shadowBlur = 12;
        ctx.fillText(`${state.combos} Combo!  x${Math.round(state.multiplier * 10) / 10}`, W / 2, 52);
        ctx.restore();
      }
      if (state.streak >= 6) {
        ctx.save();
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4CAF50';
        ctx.fillText(`🔥 ${state.streak} streak`, W / 2, H - 18);
        ctx.restore();
      }
    }

    // -------------------------------------------------------------------------
    // Game update
    // -------------------------------------------------------------------------
    function update(dt) {
      if (!state.running || state.paused || state.over) return;

      const scale = state.slowMo ? 0.55 : 1;
      const step = (dt / 16) * scale;

      // timers
      const wall = Date.now();
      if (state.invincible && wall > state.invincibleUntil) state.invincible = false;
      if (state.doublePoints && wall > state.doublePointsUntil) state.doublePoints = false;
      if (state.slowMo && wall > state.slowMoUntil) state.slowMo = false;

      // joystick motion
      if (state.joyActive) {
        const maxD = 40;
        const speed = 10 + state.difficulty * 1.2;
        const dx = clamp(state.joyDx, -maxD, maxD) / maxD;
        state.poohX += dx * speed * step;
        state.poohX = clamp(state.poohX, state.poohW / 2, W - state.poohW / 2);
      }

      // combos decay
      if (state.combos > 0 && wall - state.lastCatchAt > 2000) {
        state.combos = 0;
        state.multiplier = 1;
        state.streak = 0;
        syncHUD();
      }

      // spawn cadence
      const potCap = 12;
      const beeCap = 7;
      const powCap = 3;

      const rushActive = state.honeyRushUntil > Date.now();
      const spawnScale = state.modeCfg.spawnScale || 1;

      const potChance = (0.05 + state.difficulty * 0.01 + (rushActive ? 0.08 : 0)) * spawnScale;
      if (state.pots.length < potCap && Math.random() < potChance) spawnPot();

      const beeChance = (0.02 + state.difficulty * 0.006) * spawnScale * (rushActive ? 0.75 : 1);
      if (state.bees.length < beeCap && Math.random() < beeChance) spawnBee();

      const powerChance = 0.01 * spawnScale;
      if (state.powerUps.length < powCap && Math.random() < powerChance) spawnPowerUp();

      // move pots
      for (let i = state.pots.length - 1; i >= 0; i--) {
        const p = state.pots[i];
        p.y += p.vy * step;

        if (hitPooh(p.x, p.y, p.r)) {
          let points = p.type === 'golden' ? 50 : 10;
          if (state.doublePoints) points *= 2;

          // combo logic
          const t = Date.now();
          if (t - state.lastCatchAt < 2000) {
            state.combos++;
            state.streak++;
            state.multiplier = clamp(1 + state.combos * 0.12, 1, 5);
          } else {
            state.combos = 1;
            state.streak = 1;
            state.multiplier = 1.12;
          }
          state.lastCatchAt = t;

          if (state.streak >= 6 && state.honeyRushUntil < Date.now()) {
            triggerHoneyRush();
          }

          points = Math.round(points * state.multiplier);
          state.score += points;

          burst(p.x, p.y, p.type === 'golden' ? 18 : 10, p.type === 'golden' ? '#FFD700' : '#FFD54F');
          state.pots.splice(i, 1);

          if (window.audioManager && typeof window.audioManager.playGameSound === 'function') {
            window.audioManager.playGameSound('collect');
          }
          syncHUD();
          continue;
        }

        if (p.y > H + 22) {
          if (state.streak > 0) state.streak = 0;
          state.pots.splice(i, 1);
        }
      }

      // move bees
      for (let i = state.bees.length - 1; i >= 0; i--) {
        const b = state.bees[i];

        // angry bees drift toward Pooh a bit
        if (b.type === 'angry') {
          const toward = (state.poohX - b.x) * 0.015;
          b.vx = clamp(b.vx + toward, -2.2, 2.2);
          b.x += b.vx * step;
          b.x = clamp(b.x, 16, W - 16);
        }

        b.y += b.vy * step;

        if (!state.invincible && hitPooh(b.x, b.y, b.r)) {
          const dmg = b.type === 'angry' ? 2 : 1;
          state.lives -= dmg;

          burst(b.x, b.y, 12, '#FF6B6B');
          state.bees.splice(i, 1);

          // reset combos
          state.combos = 0;
          state.multiplier = 1;
          state.streak = 0;

          syncHUD();
          setOverlay('Ouch!', `A bee buzzed Pooh. Hearts: ${state.lives}.`, false, 1200);
          shakeElement(card, 6, 220);

          if (window.audioManager && typeof window.audioManager.playGameSound === 'function') {
            window.audioManager.playGameSound('damage');
          }

          if (state.lives <= 0) {
            endGame(false);
          }
          continue;
        }

        if (b.y > H + 22) {
          state.bees.splice(i, 1);
        }
      }

      // move powerups
      for (let i = state.powerUps.length - 1; i >= 0; i--) {
        const pu = state.powerUps[i];
        pu.y += pu.vy * step;

        if (hitPooh(pu.x, pu.y, pu.r)) {
          applyPowerUp(pu.type);
          burst(pu.x, pu.y, 14, powerUpTypes[pu.type]?.color || '#FFFFFF');
          state.powerUps.splice(i, 1);

          if (window.audioManager && typeof window.audioManager.playGameSound === 'function') {
            window.audioManager.playGameSound('powerup');
          }
          continue;
        }

        if (pu.y > H + 22) {
          state.powerUps.splice(i, 1);
        }
      }

      updateParticles(step);
    }

    function render() {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(bgCanvas, 0, 0);

      for (const p of state.pots) drawPot(p);
      for (const b of state.bees) drawBee(b);
      for (const pu of state.powerUps) drawPowerUp(pu);

      renderParticles();
      drawPooh();
      drawUI();
    }

    function loop(ts) {
      if (!frameLimiter.shouldRender(ts)) {
        state.rafId = requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min(100, ts - state.lastTs);
      state.lastTs = ts;

      update(dt);
      render();

      state.rafId = requestAnimationFrame(loop);
    }

    // -------------------------------------------------------------------------
    // Controls
    // -------------------------------------------------------------------------
    function setPoohFromClientX(clientX) {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      state.poohX = clamp(x, state.poohW / 2, W - state.poohW / 2);
    }

    function onKeyDown(ev) {
      if (!state.running || state.paused || state.over) return;
      const step = 26 + state.difficulty * 2;

      if (ev.key === 'ArrowLeft') {
        state.poohX = clamp(state.poohX - step, state.poohW / 2, W - state.poohW / 2);
      } else if (ev.key === 'ArrowRight') {
        state.poohX = clamp(state.poohX + step, state.poohW / 2, W - state.poohW / 2);
      } else if (ev.key === ' ') {
        burst(state.poohX, state.poohY - 20, 10, '#FFFFFF');
      }
    }

    function onMouseMove(ev) {
      if (!state.running || state.paused || state.over) return;
      setPoohFromClientX(ev.clientX);
    }

    function onTouchMove(ev) {
      if (!state.running || state.paused || state.over) return;
      if (!ev.touches || ev.touches.length === 0) return;
      ev.preventDefault();
      setPoohFromClientX(ev.touches[0].clientX);
    }

    function setupJoystick() {
      if (!joystick || !joystickKnob) return;

      const maxD = 40;

      function updateKnob(dx) {
        const x = clamp(dx, -maxD, maxD);
        joystickKnob.style.transform = `translate(${x}px, 0px)`;
      }

      function startJoy(e) {
        if (!state.running || state.paused || state.over) return;
        state.joyActive = true;
        state.joyPointerId = e.pointerId ?? null;

        const r = joystick.getBoundingClientRect();
        state.joyCenterX = r.left + r.width / 2;
        state.joyCenterY = r.top + r.height / 2;

        joystick.setPointerCapture?.(e.pointerId);
        updateJoy(e);
      }

      function updateJoy(e) {
        if (!state.joyActive) return;
        if (state.joyPointerId != null && e.pointerId != null && e.pointerId !== state.joyPointerId) return;

        const dx = e.clientX - state.joyCenterX;
        const dy = e.clientY - state.joyCenterY;
        state.joyDx = clamp(dx, -maxD, maxD);
        state.joyDy = clamp(dy, -maxD, maxD);
        updateKnob(state.joyDx);
      }

      function endJoy(e) {
        if (state.joyPointerId != null && e.pointerId != null && e.pointerId !== state.joyPointerId) return;
        state.joyActive = false;
        state.joyPointerId = null;
        state.joyDx = 0;
        state.joyDy = 0;
        updateKnob(0);
      }

      joystick.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        startJoy(e);
      });

      window.addEventListener(
        'pointermove',
        (e) => {
          if (!state.joyActive) return;
          updateJoy(e);
        },
        { passive: false }
      );

      window.addEventListener('pointerup', (e) => {
        if (!state.joyActive) return;
        endJoy(e);
      });
      window.addEventListener('pointercancel', (e) => {
        if (!state.joyActive) return;
        endJoy(e);
      });
    }

    // -------------------------------------------------------------------------
    // Start / pause / end
    // -------------------------------------------------------------------------
    function resetGameState() {
      state.score = 0;
      state.timeLeft = state.modeCfg.time;
      state.lives = state.modeCfg.lives;
      state.combos = 0;
      state.multiplier = 1;
      state.streak = 0;
      state.lastCatchAt = 0;

      state.invincible = false;
      state.doublePoints = false;
      state.slowMo = false;

      state.honeyRushUntil = 0;

      state.difficulty = 0;

      state.pots.length = 0;
      state.bees.length = 0;
      state.powerUps.length = 0;
      particles.length = 0;

      state.over = false;
      state.paused = false;

      state.poohX = W / 2;
      state.poohY = H - 70;

      syncHUD();
    }

    function startTimer() {
      clearInterval(state.timerId);
      state.timerId = setInterval(() => {
        if (!state.running || state.paused || state.over) return;

        state.timeLeft -= 1;

        // ramp difficulty every 15 seconds
        const totalTime = state.modeCfg.time;
        const elapsed = totalTime - state.timeLeft;
        state.difficulty = Math.floor(elapsed / 15);

        syncHUD();

        if (state.timeLeft <= 0) {
          endGame(true);
        }
      }, 1000);
    }

    function startGame() {
      unlockAudioOnce();

      if (state.running && !state.over) return;

      resetGameState();
      syncHUD();

      let c = 3;
      setOverlay('Starting in 3…', 'Get Pooh ready to move.', true);
      clearInterval(state.countdownId);

      state.countdownId = setInterval(() => {
        c -= 1;
        if (c > 0) {
          setOverlay(`Starting in ${c}…`, 'Catch honey, dodge bees.', true);
          if (window.audioManager && typeof window.audioManager.playTone === 'function') {
            window.audioManager.playTone([440], 0.08);
          }
        } else {
          clearInterval(state.countdownId);
          state.countdownId = null;

          state.running = true;
          state.paused = false;
          state.over = false;

          setOverlay('Go!', 'Keep Pooh under the falling honey.', false, 900);
          setStatus('Go!');

          startTimer();

          frameLimiter.reset();
          state.lastTs = nowMs();

          if (!state.rafId) state.rafId = requestAnimationFrame(loop);

          if (window.audioManager && typeof window.audioManager.playTone === 'function') {
            window.audioManager.playTone([523, 659, 784], 0.12);
          }
        }
      }, 750);
    }

    function setPaused(paused) {
      if (!state.running || state.over) return;

      state.paused = !!paused;
      if (pauseBtn) pauseBtn.setAttribute('aria-pressed', state.paused ? 'true' : 'false');

      if (state.paused) {
        setOverlay('Paused', 'Tap pause again to continue.', true);
        setStatus('Paused');
      } else {
        if (overlay) overlay.classList.remove('active');
        setStatus('Playing…');
      }

      if (window.audioManager && typeof window.audioManager.playSound === 'function') {
        window.audioManager.playSound('click');
      }
    }

    function togglePause() {
      if (!state.running || state.over) return;
      setPaused(!state.paused);
    }

    function endGame(timeExpired) {
      if (!state.running || state.over) return;

      state.over = true;
      state.running = false;

      clearInterval(state.timerId);
      state.timerId = null;

      clearInterval(state.countdownId);
      state.countdownId = null;

      const bonus =
        (state.lives >= state.modeCfg.lives ? 100 : 0) +
        (state.combos >= 10 ? 50 : 0) +
        (state.streak >= 15 ? 75 : 0);

      const finalScore = Math.round((state.score + bonus) * (state.modeCfg.scoreScale || 1));
      const isBest = maybeUpdateBest(finalScore);

      setOverlay(
        timeExpired ? "Time's up!" : 'Bees win this round!',
        `Final Score: ${finalScore}${bonus ? ` (+${bonus} bonus)` : ''}${isBest ? ' — New best!' : ''}`,
        true
      );
      setStatus('Game over.');
      shakeElement(card, 7, 260);

      burst(W / 2, H / 2, 40, timeExpired ? '#FFD700' : '#FF6B6B');

      if (window.audioManager && typeof window.audioManager.playGameSound === 'function') {
        window.audioManager.playGameSound(timeExpired ? 'victory' : 'defeat');
      }

      // Keep loop running briefly to show particles; then stop to save battery
      setTimeout(() => {
        stopLoop();
      }, 2500);
    }

    function stopLoop() {
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
      }
    }

    // -------------------------------------------------------------------------
    // Wiring
    // -------------------------------------------------------------------------
    document.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });

    // Touch start: move Pooh + unlock audio
    canvas.addEventListener(
      'touchstart',
      (ev) => {
        unlockAudioOnce();
        if (!ev.touches || ev.touches.length === 0) return;
        setPoohFromClientX(ev.touches[0].clientX);
      },
      { passive: true }
    );

    // Pointer down: quick reposition (mobile/desktop)
    canvas.addEventListener(
      'pointerdown',
      (ev) => {
        unlockAudioOnce();
        if (!state.running || state.paused || state.over) return;
        setPoohFromClientX(ev.clientX);
      },
      { passive: true }
    );

    if (startBtn) startBtn.addEventListener('click', startGame);
    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);

    modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const modeKey = btn.dataset.catchMode;
        setMode(modeKey);
        setStatus(`${state.modeCfg.label} mode armed.`);
        setOverlay(state.modeCfg.label, state.modeCfg.hint, false, 900);
      });
    });

    // Global unlock hooks (first interaction anywhere)
// Touch start: move Pooh + unlock audio (and block iOS long-press loupe)
canvas.addEventListener(
  'touchstart',
  (ev) => {
    unlockAudioOnce();
    ev.preventDefault(); // <-- critical (requires passive:false)
    if (!ev.touches || ev.touches.length === 0) return;
    setPoohFromClientX(ev.touches[0].clientX);
  },
  { passive: false }
);
    window.addEventListener('pointerdown', unlockAudioOnce, { passive: true, once: true });
    window.addEventListener('click', unlockAudioOnce, { passive: true, once: true });

    setupJoystick();

    loadBestScore();
    setMode(state.mode);

    // Resize once now and again shortly after layout settles (mobile Safari)
    resizeCanvas();
    setTimeout(resizeCanvas, 50);
    setTimeout(resizeCanvas, 250);
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Initial HUD/overlay
    syncHUD();
    setOverlay('Ready when you are.', `Press Start to begin a ${state.modeCfg.label} run.`, true);
    setStatus('Ready.');

    // Render idle frame
    render();

    // Cleanup
    function destroy() {
      try {
        document.removeEventListener('keydown', onKeyDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('resize', resizeCanvas);

        clearInterval(state.timerId);
        clearInterval(state.countdownId);

        stopLoop();
      } catch (_) {}
    }

    // Expose minimal API for debugging (optional)
    return {
      start: startGame,
      pause: () => setPaused(true),
      resume: () => setPaused(false),
      togglePause,
      destroy,
      resize: resizeCanvas,
      getState: () => ({ ...state }),
    };
  }

  // ---------------------------------------------------------------------------
  // Bootstrap only the Honey Catch game. No site UI here.
  // ---------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    try {
      if (document.getElementById('honey-game')) {
        window.__HoneyCatch = EnhancedHoneyCatchGame();
      }
    } catch (err) {
      console.error('[HoneyCatch] failed to initialize:', err);
    }
  });
})();