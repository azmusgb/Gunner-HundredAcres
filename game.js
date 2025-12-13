// game.js — Honey Pot Catch (improved version)
'use strict';

(function () {
  // ---------------------------------------------------------------------------
  // Improved Utilities
  // ---------------------------------------------------------------------------
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  function isMobileDevice() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const touch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || 
                  'ontouchstart' in window ||
                  window.DocumentTouch && document instanceof DocumentTouch;
    return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
            (touch && window.innerWidth <= 900));
  }

  class FrameRateLimiter {
    constructor(targetFPS = 60) {
      this.setTarget(targetFPS);
      this.lastFrameTime = 0;
      this.frameCount = 0;
      this.lastFpsUpdate = 0;
      this.currentFPS = 0;
    }
    
    setTarget(targetFPS) {
      const fps = Number(targetFPS) || 60;
      this.targetFPS = clamp(fps, 10, 120);
      this.frameInterval = 1000 / this.targetFPS;
    }
    
    shouldRender(ts) {
      this.frameCount++;
      if (ts - this.lastFpsUpdate >= 1000) {
        this.currentFPS = Math.round((this.frameCount * 1000) / (ts - this.lastFpsUpdate));
        this.frameCount = 0;
        this.lastFpsUpdate = ts;
      }
      
      if (ts - this.lastFrameTime >= this.frameInterval) {
        this.lastFrameTime = ts;
        return true;
      }
      return false;
    }
    
    reset() {
      this.lastFrameTime = 0;
      this.frameCount = 0;
      this.lastFpsUpdate = nowMs();
    }
    
    getFPS() {
      return this.currentFPS;
    }
  }

  function smoothLerp(current, target, factor = 0.2) {
    return current + (target - current) * factor;
  }

  // ---------------------------------------------------------------------------
  // Enhanced Honey Catch Game
  // ---------------------------------------------------------------------------
  function EnhancedHoneyCatchGame() {
    console.log('[HoneyCatch] Enhanced Init…');

    // DOM Elements with null checks
    const canvas = document.getElementById('honey-game');
    if (!canvas) {
      console.error('[HoneyCatch] #honey-game canvas not found.');
      return null;
    }

    // Get context with better options
    const ctx = canvas.getContext('2d', { 
      alpha: true, 
      desynchronized: true,
      powerPreference: 'low-power' // Better for mobile
    });
    
    if (!ctx) {
      console.error('[HoneyCatch] 2D context not available.');
      return null;
    }

    // Get DOM elements safely
    const getElement = (id) => {
      const el = document.getElementById(id);
      if (!el) console.warn(`[HoneyCatch] Element #${id} not found`);
      return el;
    };

    const scoreSpan = getElement('score-count');
    const timeSpan = getElement('time-count');
    const livesSpan = getElement('catch-lives');
    const startBtn = getElement('start-catch');
    const pauseBtn = getElement('pause-catch');
    const overlay = getElement('catch-overlay');
    const overlayLine = getElement('catch-countdown');
    const overlayHint = getElement('catch-hint');
    const card = document.querySelector('.game-card');
    const multiplierSpan = getElement('catch-multiplier');
    const comboSpan = getElement('catch-combo');
    const statusEl = getElement('catchStatus');
    const joystick = getElement('catchJoystick');
    const joystickKnob = joystick ? joystick.querySelector('.joystick-knob') : null;
    const timeBar = getElement('catch-timebar');
    const lifeBar = getElement('catch-life-bar');
    const modeButtons = Array.from(document.querySelectorAll('[data-catch-mode]'));
    const modeDescription = getElement('catch-mode-description');
    const bestScoreEl = getElement('catch-best');

    // Game Modes
    const MODES = {
      calm: {
        label: 'Calm Stroll',
        time: 70,
        lives: 4,
        spawnScale: 0.92,
        speedScale: 0.92,
        scoreScale: 0.95,
        honeyValue: 10,
        goldenValue: 50,
        hint: 'A relaxed 70 second run with extra hearts.',
      },
      brisk: {
        label: 'Adventure',
        time: 60,
        lives: 3,
        spawnScale: 1,
        speedScale: 1,
        scoreScale: 1,
        honeyValue: 15,
        goldenValue: 75,
        hint: 'Balanced pace. Great for personal bests.',
      },
      rush: {
        label: 'Honey Rush',
        time: 50,
        lives: 2,
        spawnScale: 1.14,
        speedScale: 1.08,
        scoreScale: 1.12,
        honeyValue: 20,
        goldenValue: 100,
        hint: 'Short, spicy, and higher scoring.',
      },
    };

    // Canvas variables
    let W = 0;
    let H = 0;
    let DPR = 1;
    let targetWidth = 0;
    let targetHeight = 0;

    // Background canvas for optimization
    const bgCanvas = document.createElement('canvas');
    const bgCtx = bgCanvas.getContext('2d');

    // Improved resize function
    function resizeCanvas() {
      if (resizeCanvas.debounceTimer) {
        clearTimeout(resizeCanvas.debounceTimer);
      }
      
      resizeCanvas.debounceTimer = setTimeout(() => {
        const container = canvas.parentElement;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const cssW = Math.max(300, Math.floor(rect.width));
        const cssH = Math.max(200, Math.floor(rect.height || cssW * 0.66));
        
        // Avoid unnecessary resizes
        if (cssW === W && cssH === H) return;
        
        DPR = window.devicePixelRatio || 1;
        W = cssW;
        H = cssH;
        
        // Set canvas display size (CSS)
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
        
        // Set canvas drawing buffer size
        const bufferWidth = Math.floor(cssW * DPR);
        const bufferHeight = Math.floor(cssH * DPR);
        
        if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
          canvas.width = bufferWidth;
          canvas.height = bufferHeight;
          ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        }
        
        // Resize background canvas (CSS pixels for drawing)
        if (bgCanvas.width !== cssW || bgCanvas.height !== cssH) {
          bgCanvas.width = cssW;
          bgCanvas.height = cssH;
          drawBackground();
        }
        
        // Update game state for new dimensions
        if (state.pooh) {
          state.pooh.x = clamp(state.pooh.x || cssW / 2, state.pooh.width / 2, cssW - state.pooh.width / 2);
          state.pooh.y = cssH - 70;
        }
        
        console.log(`[HoneyCatch] Resized to ${cssW}x${cssH} (DPR: ${DPR})`);
      }, 150);
    }

    // Draw optimized background
    function drawBackground() {
      if (!bgCtx) return;
      
      // Clear
      bgCtx.clearRect(0, 0, W, H);
      
      // Sky gradient
      const skyGradient = bgCtx.createLinearGradient(0, 0, 0, H);
      skyGradient.addColorStop(0, '#87CEEB');
      skyGradient.addColorStop(0.6, '#B3E5FC');
      skyGradient.addColorStop(1, '#E3F2FD');
      bgCtx.fillStyle = skyGradient;
      bgCtx.fillRect(0, 0, W, H);
      
      // Sun with glow
      bgCtx.save();
      bgCtx.shadowColor = 'rgba(255, 215, 0, 0.4)';
      bgCtx.shadowBlur = 25;
      bgCtx.fillStyle = '#FFEB3B';
      bgCtx.beginPath();
      bgCtx.arc(W * 0.15, H * 0.15, Math.min(W, H) * 0.07, 0, Math.PI * 2);
      bgCtx.fill();
      bgCtx.restore();
      
      // Ground
      const groundHeight = Math.max(60, H * 0.15);
      const groundY = H - groundHeight;
      const groundGradient = bgCtx.createLinearGradient(0, groundY, 0, H);
      groundGradient.addColorStop(0, '#8BC34A');
      groundGradient.addColorStop(1, '#689F38');
      bgCtx.fillStyle = groundGradient;
      bgCtx.fillRect(0, groundY, W, groundHeight);
      
      // Simple clouds (3 max for performance)
      bgCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      const clouds = [
        { x: W * 0.3, y: H * 0.2, size: 0.8 },
        { x: W * 0.6, y: H * 0.3, size: 1.0 },
        { x: W * 0.8, y: H * 0.15, size: 0.7 }
      ];
      
      clouds.forEach(cloud => {
        const size = Math.min(W, H) * 0.05 * cloud.size;
        bgCtx.save();
        bgCtx.translate(cloud.x, cloud.y);
        bgCtx.beginPath();
        bgCtx.arc(0, 0, size, 0, Math.PI * 2);
        bgCtx.arc(size * 1.2, -size * 0.5, size * 1.1, 0, Math.PI * 2);
        bgCtx.arc(size * 2.4, 0, size, 0, Math.PI * 2);
        bgCtx.fill();
        bgCtx.restore();
      });
    }

    // -------------------------------------------------------------------------
    // Game State Object
    // -------------------------------------------------------------------------
    const state = {
      // Game status
      running: false,
      paused: false,
      gameOver: false,
      
      // Player stats
      score: 0,
      timeLeft: 60,
      lives: 3,
      combos: 0,
      multiplier: 1,
      streak: 0,
      lastCatchTime: 0,
      
      // Player object
      pooh: {
        x: 0,
        y: 0,
        width: 58,
        height: 58,
        targetX: 0,
        speed: 12
      },
      
      // Power-ups
      invincible: false,
      invincibleUntil: 0,
      doublePoints: false,
      doublePointsUntil: 0,
      slowMo: false,
      slowMoUntil: 0,
      honeyRushUntil: 0,
      
      // Game objects
      pots: [],
      bees: [],
      powerUps: [],
      particles: [],
      
      // Game settings
      mode: 'calm',
      modeCfg: MODES.calm,
      difficulty: 0,
      bestScore: 0,
      
      // Timing
      lastUpdateTime: nowMs(),
      frameId: null,
      timerId: null,
      countdownId: null,
      overlayTimer: null,
      
      // Controls
      joyActive: false,
      joyPointerId: null,
      joyCenterX: 0,
      joyCenterY: 0,
      joyDx: 0,
      joyDy: 0,
      keys: {}
    };

    // Frame limiter
    const frameLimiter = new FrameRateLimiter(isMobileDevice() ? 30 : 60);

    // -------------------------------------------------------------------------
    // Particles System
    // -------------------------------------------------------------------------
    class ParticleSystem {
      constructor(maxParticles = 200) {
        this.particles = [];
        this.maxParticles = maxParticles;
      }
      
      burst(x, y, count, color, options = {}) {
        const { size = 4, speed = 3, gravity = 0.1, decay = 0.03 } = options;
        
        for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
          const angle = Math.random() * Math.PI * 2;
          const velocity = speed * (0.5 + Math.random() * 0.5);
          
          this.particles.push({
            x, y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            life: 1,
            decay: decay * (0.8 + Math.random() * 0.4),
            size: size * (0.5 + Math.random()),
            color,
            gravity
          });
        }
      }
      
      update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += p.gravity * dt;
          
          // Apply friction
          p.vx *= 0.98;
          p.vy *= 0.98;
          
          p.life -= p.decay * dt;
          
          if (p.life <= 0 || p.y > H + 50 || p.x < -50 || p.x > W + 50) {
            this.particles.splice(i, 1);
          }
        }
      }
      
      render() {
        ctx.save();
        for (const p of this.particles) {
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      
      clear() {
        this.particles.length = 0;
      }
    }

    const particles = new ParticleSystem(isMobileDevice() ? 150 : 300);

    // -------------------------------------------------------------------------
    // Power-ups Configuration
    // -------------------------------------------------------------------------
    const POWER_UPS = {
      heart: { 
        color: '#FF6B6B', 
        icon: '❤️', 
        duration: 0,
        value: 1 
      },
      shield: { 
        color: '#4285F4', 
        icon: '🛡️', 
        duration: 5000 
      },
      clock: { 
        color: '#4CAF50', 
        icon: '⏱️', 
        duration: 0,
        value: 10 
      },
      star: { 
        color: '#FFD700', 
        icon: '⭐', 
        duration: 8000 
      },
      lightning: { 
        color: '#9C27B0', 
        icon: '⚡', 
        duration: 6000 
      }
    };

    // -------------------------------------------------------------------------
    // HUD and UI Functions
    // -------------------------------------------------------------------------
    function updateHUD() {
      if (scoreSpan) scoreSpan.textContent = state.score.toLocaleString();
      if (timeSpan) timeSpan.textContent = Math.max(0, state.timeLeft);
      if (livesSpan) livesSpan.textContent = state.lives;
      if (comboSpan) comboSpan.textContent = state.combos;
      if (multiplierSpan) {
        const mult = Math.round(state.multiplier * 10) / 10;
        multiplierSpan.textContent = mult % 1 === 0 ? mult : mult.toFixed(1);
      }
      if (bestScoreEl) bestScoreEl.textContent = state.bestScore.toLocaleString();
      if (pauseBtn) {
        pauseBtn.setAttribute('aria-pressed', state.paused ? 'true' : 'false');
        pauseBtn.querySelector('i').className = state.paused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
      }

      // Update progress bars
      const timePercent = clamp((state.timeLeft / state.modeCfg.time) * 100, 0, 100);
      if (timeBar) {
        timeBar.style.width = `${timePercent}%`;
        timeBar.style.setProperty('--w', `${timePercent}%`);
      }

      const lifePercent = clamp((state.lives / state.modeCfg.lives) * 100, 0, 100);
      if (lifeBar) {
        lifeBar.style.width = `${lifePercent}%`;
        lifeBar.style.setProperty('--w', `${lifePercent}%`);
      }
    }

    function setStatus(message, type = 'info') {
      if (!statusEl) return;
      
      statusEl.textContent = message;
      statusEl.className = 'tip';
      
      // Add visual feedback based on type
      if (type === 'success') {
        statusEl.style.color = '#4CAF50';
        statusEl.style.fontWeight = 'bold';
      } else if (type === 'error') {
        statusEl.style.color = '#f44336';
        statusEl.style.fontWeight = 'bold';
      } else if (type === 'warning') {
        statusEl.style.color = '#FF9800';
      } else {
        statusEl.style.color = '';
        statusEl.style.fontWeight = '';
      }
      
      // Auto-clear after 3 seconds for non-persistent messages
      if (type !== 'persistent') {
        clearTimeout(setStatus.timer);
        setStatus.timer = setTimeout(() => {
          if (statusEl && !state.running) {
            statusEl.textContent = 'Ready to play';
            statusEl.style.color = '';
          }
        }, 3000);
      }
    }

    function showOverlay(title, subtitle, duration = 1500) {
      if (!overlay || !overlayLine || !overlayHint) return;
      
      overlayLine.textContent = title;
      overlayHint.textContent = subtitle;
      overlay.classList.add('active');
      
      if (state.overlayTimer) {
        clearTimeout(state.overlayTimer);
      }
      
      if (duration > 0) {
        state.overlayTimer = setTimeout(() => {
          overlay.classList.remove('active');
        }, duration);
      }
    }

    function hideOverlay() {
      if (overlay) {
        overlay.classList.remove('active');
      }
      if (state.overlayTimer) {
        clearTimeout(state.overlayTimer);
        state.overlayTimer = null;
      }
    }

    // -------------------------------------------------------------------------
    // Game Mode Management
    // -------------------------------------------------------------------------
    function setGameMode(modeKey) {
      if (!MODES[modeKey]) {
        modeKey = 'calm';
      }
      
      state.mode = modeKey;
      state.modeCfg = MODES[modeKey];
      
      // Update UI
      modeButtons.forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.catchMode === modeKey);
      });
      
      if (modeDescription) {
        modeDescription.textContent = state.modeCfg.hint;
      }
      
      // Reset game state if not running
      if (!state.running) {
        state.timeLeft = state.modeCfg.time;
        state.lives = state.modeCfg.lives;
        updateHUD();
      }
      
      console.log(`[HoneyCatch] Mode set to: ${state.modeCfg.label}`);
    }

    // -------------------------------------------------------------------------
    // Score Management
    // -------------------------------------------------------------------------
    function loadBestScore() {
      try {
        const saved = localStorage.getItem('honeyCatchBestScore');
        if (saved) {
          const score = parseInt(saved, 10);
          if (!isNaN(score)) {
            state.bestScore = score;
          }
        }
      } catch (e) {
        console.warn('[HoneyCatch] Could not load best score:', e);
      }
    }

    function saveBestScore(score) {
      if (score <= state.bestScore) return false;
      
      state.bestScore = score;
      
      try {
        localStorage.setItem('honeyCatchBestScore', score.toString());
        return true;
      } catch (e) {
        console.warn('[HoneyCatch] Could not save best score:', e);
        return false;
      }
    }

    // -------------------------------------------------------------------------
    // Spawn Functions
    // -------------------------------------------------------------------------
    function spawnHoneyPot() {
      const rushActive = Date.now() < state.honeyRushUntil;
      const goldenChance = 0.15 + (state.difficulty * 0.02) + (rushActive ? 0.3 : 0);
      const isGolden = Math.random() < goldenChance;
      
      state.pots.push({
        x: 20 + Math.random() * (W - 40),
        y: -20,
        radius: 14,
        speed: (2 + Math.random() * 1.5) * state.modeCfg.speedScale,
        type: isGolden ? 'golden' : 'normal',
        wobble: Math.random() * Math.PI * 2
      });
    }

    function spawnBee() {
      const angryChance = state.difficulty >= 2 ? 0.2 : 0.1;
      const isAngry = Math.random() < angryChance;
      
      state.bees.push({
        x: 20 + Math.random() * (W - 40),
        y: -20,
        radius: 12,
        speed: (2.5 + Math.random() * 1.5) * state.modeCfg.speedScale,
        type: isAngry ? 'angry' : 'normal',
        wobble: Math.random() * Math.PI * 2,
        vx: 0
      });
    }

    function spawnPowerUp() {
      const keys = Object.keys(POWER_UPS);
      const type = keys[Math.floor(Math.random() * keys.length)];
      
      state.powerUps.push({
        x: 24 + Math.random() * (W - 48),
        y: -20,
        radius: 14,
        speed: (1.8 + Math.random() * 1) * state.modeCfg.speedScale,
        type: type,
        wobble: Math.random() * Math.PI * 2
      });
    }

    // -------------------------------------------------------------------------
    // Collision Detection
    // -------------------------------------------------------------------------
    function checkCollision(x1, y1, r1, x2, y2, r2) {
      const dx = x1 - x2;
      const dy = y1 - y2;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < (r1 + r2);
    }

    function checkPoohCollision(x, y, radius) {
      const poohX = state.pooh.x;
      const poohY = state.pooh.y - state.pooh.height * 0.4;
      const poohWidth = state.pooh.width * 0.7;
      const poohHeight = state.pooh.height * 0.7;
      
      // Circle vs rounded rectangle collision
      const closestX = clamp(x, poohX - poohWidth / 2, poohX + poohWidth / 2);
      const closestY = clamp(y, poohY - poohHeight / 2, poohY + poohHeight / 2);
      
      const dx = x - closestX;
      const dy = y - closestY;
      
      return (dx * dx + dy * dy) <= (radius * radius);
    }

    // -------------------------------------------------------------------------
    // Power-up Effects
    // -------------------------------------------------------------------------
    function applyPowerUp(type) {
      const now = Date.now();
      const config = POWER_UPS[type];
      
      if (!config) return;
      
      switch (type) {
        case 'heart':
          state.lives = Math.min(state.modeCfg.lives + 2, state.lives + 1);
          showOverlay('Extra Heart!', 'Pooh feels refreshed', 1000);
          break;
          
        case 'shield':
          state.invincible = true;
          state.invincibleUntil = now + config.duration;
          showOverlay('Shield Activated!', 'Bees can\'t hurt you', 1000);
          break;
          
        case 'clock':
          state.timeLeft = Math.min(state.modeCfg.time, state.timeLeft + config.value);
          showOverlay('Bonus Time!', `+${config.value} seconds`, 1000);
          break;
          
        case 'star':
          state.doublePoints = true;
          state.doublePointsUntil = now + config.duration;
          showOverlay('Double Points!', 'All honey is extra sweet', 1000);
          break;
          
        case 'lightning':
          state.slowMo = true;
          state.slowMoUntil = now + config.duration;
          showOverlay('Slow Motion!', 'Everything slows down', 1000);
          break;
      }
      
      updateHUD();
      
      // Visual feedback
      particles.burst(state.pooh.x, state.pooh.y - 30, 15, config.color, {
        size: 5,
        speed: 4,
        gravity: 0.05
      });
    }

    // -------------------------------------------------------------------------
    // Drawing Functions
    // -------------------------------------------------------------------------
    function drawPooh() {
      const x = state.pooh.x;
      const y = state.pooh.y;
      const w = state.pooh.width;
      const h = state.pooh.height;
      
      // Shadow
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(x, y + 15, w * 0.4, h * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Body
      const bodyGradient = ctx.createLinearGradient(x - w/2, y - h, x - w/2, y);
      bodyGradient.addColorStop(0, '#FFC107');
      bodyGradient.addColorStop(1, '#FF9800');
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.roundRect(x - w/2, y - h, w, h, 12);
      ctx.fill();
      
      // Shirt
      ctx.fillStyle = '#D62E2E';
      ctx.fillRect(x - w/2, y - h * 0.7, w, h * 0.25);
      
      // Belly
      ctx.fillStyle = 'rgba(255, 216, 166, 0.9)';
      ctx.beginPath();
      ctx.ellipse(x, y - h * 0.5, w * 0.25, h * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x - w * 0.2, y - h * 0.8, 2.5, 0, Math.PI * 2);
      ctx.arc(x + w * 0.2, y - h * 0.8, 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Nose
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.arc(x, y - h * 0.65, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Invincibility effect
      if (state.invincible) {
        ctx.save();
        const alpha = 0.4 + Math.sin(Date.now() / 150) * 0.3;
        ctx.strokeStyle = `rgba(66, 133, 244, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(66, 133, 244, 0.5)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x, y - h * 0.5, w * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    function drawHoneyPot(pot) {
      const x = pot.x + Math.sin(pot.wobble + Date.now() / 500) * 2;
      const y = pot.y;
      const isGolden = pot.type === 'golden';
      
      // Glow for golden pots
      if (isGolden) {
        ctx.save();
        ctx.shadowColor = 'rgba(255, 215, 0, 0.7)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(x, y, pot.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      
      // Pot body
      const gradient = ctx.createRadialGradient(
        x - 3, y - 3, 1,
        x, y, pot.radius
      );
      gradient.addColorStop(0, '#FFEB3B');
      gradient.addColorStop(0.8, '#FFD54F');
      gradient.addColorStop(1, '#FFB300');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, pot.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Pot outline
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Lid
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x - 7, y - 12, 14, 3);
      ctx.fillRect(x - 3, y - 15, 6, 3);
      
      // Honey drip
      ctx.fillStyle = '#FF9800';
      ctx.beginPath();
      ctx.ellipse(x, y + 3, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawBee(bee) {
      const x = bee.x + Math.sin(bee.wobble + Date.now() / 300) * 3;
      const y = bee.y + Math.cos(bee.wobble * 1.5 + Date.now() / 400) * 2;
      
      // Wings
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const wingTime = Date.now() / 80;
      const wingOffset = Math.sin(wingTime) * 3;
      
      ctx.beginPath();
      ctx.arc(x - 9, y - 8 + wingOffset, 7, 0, Math.PI * 2);
      ctx.arc(x + 9, y - 8 - wingOffset, 7, 0, Math.PI * 2);
      ctx.fill();
      
      // Body
      const bodyGradient = ctx.createRadialGradient(x, y, 2, x, y, 10);
      bodyGradient.addColorStop(0, '#FFEB3B');
      bodyGradient.addColorStop(1, '#FF9800');
      
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Stripes
      ctx.fillStyle = '#000';
      ctx.fillRect(x - 5, y - 5, 3, 8);
      ctx.fillRect(x + 2, y - 5, 3, 8);
      
      // Eyes
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x - 3, y - 2, 1.5, 0, Math.PI * 2);
      ctx.arc(x + 3, y - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Angry face
      if (bee.type === 'angry') {
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💢', x, y - 20);
      }
    }

    function drawPowerUp(pu) {
      const x = pu.x + Math.sin(pu.wobble + Date.now() / 600) * 3;
      const y = pu.y;
      const config = POWER_UPS[pu.type];
      
      if (!config) return;
      
      // Glow
      ctx.save();
      ctx.shadowColor = config.color + '80';
      ctx.shadowBlur = 10;
      ctx.fillStyle = config.color + '40';
      ctx.beginPath();
      ctx.arc(x, y, pu.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Outline
      ctx.strokeStyle = config.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, pu.radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Icon
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#111';
      ctx.fillText(config.icon, x, y);
    }

    // -------------------------------------------------------------------------
    // Game Loop Functions
    // -------------------------------------------------------------------------
    function updateGame(dt) {
      if (!state.running || state.paused || state.gameOver) return;
      
      // Apply slow motion if active
      const timeScale = state.slowMo ? 0.5 : 1.0;
      const scaledDt = dt * timeScale;
      
      // Update Pooh position with smoothing
      state.pooh.targetX = clamp(state.pooh.targetX, state.pooh.width/2, W - state.pooh.width/2);
      state.pooh.x = smoothLerp(state.pooh.x, state.pooh.targetX, 0.2);
      
      // Update power-up timers
      const now = Date.now();
      if (state.invincible && now > state.invincibleUntil) {
        state.invincible = false;
      }
      if (state.doublePoints && now > state.doublePointsUntil) {
        state.doublePoints = false;
      }
      if (state.slowMo && now > state.slowMoUntil) {
        state.slowMo = false;
      }
      
      // Spawn objects
      updateSpawning(scaledDt);
      
      // Update objects
      updateObjects(scaledDt);
      
      // Update particles
      particles.update(scaledDt);
      
      // Update combo timer
      if (state.combos > 0 && now - state.lastCatchTime > 2000) {
        state.combos = 0;
        state.multiplier = 1;
        state.streak = 0;
        updateHUD();
      }
    }

    function updateSpawning(dt) {
      const rushActive = Date.now() < state.honeyRushUntil;
      const spawnRate = state.modeCfg.spawnScale;
      
      // Honey pots
      if (state.pots.length < 10 && Math.random() < 0.04 * spawnRate * dt) {
        spawnHoneyPot();
      }
      
      // Bees (less during honey rush)
      const beeChance = rushActive ? 0.02 : 0.03;
      if (state.bees.length < 6 && Math.random() < beeChance * spawnRate * dt) {
        spawnBee();
      }
      
      // Power-ups
      if (state.powerUps.length < 3 && Math.random() < 0.01 * spawnRate * dt) {
        spawnPowerUp();
      }
    }

    function updateObjects(dt) {
      const now = Date.now();
      
      // Update honey pots
      for (let i = state.pots.length - 1; i >= 0; i--) {
        const pot = state.pots[i];
        pot.y += pot.speed * dt;
        pot.wobble += 0.05 * dt;
        
        // Check collision with Pooh
        if (checkPoohCollision(pot.x, pot.y, pot.radius)) {
          handlePotCollected(pot, i);
          continue;
        }
        
        // Remove if off screen
        if (pot.y > H + 30) {
          state.pots.splice(i, 1);
          // Break streak if pot is missed
          if (state.streak > 0) {
            state.streak = 0;
          }
        }
      }
      
      // Update bees
      for (let i = state.bees.length - 1; i >= 0; i--) {
        const bee = state.bees[i];
        bee.y += bee.speed * dt;
        bee.wobble += 0.03 * dt;
        
        // Angry bees chase Pooh
        if (bee.type === 'angry') {
          const dx = state.pooh.x - bee.x;
          bee.vx += Math.sign(dx) * 0.02 * dt;
          bee.vx = clamp(bee.vx, -2, 2);
          bee.x += bee.vx * dt;
          bee.x = clamp(bee.x, 20, W - 20);
        }
        
        // Check collision with Pooh
        if (!state.invincible && checkPoohCollision(bee.x, bee.y, bee.radius)) {
          handleBeeCollision(bee, i);
          continue;
        }
        
        // Remove if off screen
        if (bee.y > H + 30) {
          state.bees.splice(i, 1);
        }
      }
      
      // Update power-ups
      for (let i = state.powerUps.length - 1; i >= 0; i--) {
        const pu = state.powerUps[i];
        pu.y += pu.speed * dt;
        pu.wobble += 0.02 * dt;
        
        // Check collision with Pooh
        if (checkPoohCollision(pu.x, pu.y, pu.radius)) {
          applyPowerUp(pu.type);
          state.powerUps.splice(i, 1);
          continue;
        }
        
        // Remove if off screen
        if (pu.y > H + 30) {
          state.powerUps.splice(i, 1);
        }
      }
    }

    function handlePotCollected(pot, index) {
      const isGolden = pot.type === 'golden';
      let points = isGolden ? state.modeCfg.goldenValue : state.modeCfg.honeyValue;
      
      // Apply multiplier
      if (state.doublePoints) points *= 2;
      points = Math.round(points * state.multiplier);
      
      // Update score
      state.score += points;
      
      // Update combo
      const now = Date.now();
      if (now - state.lastCatchTime < 2000) {
        state.combos++;
        state.streak++;
        state.multiplier = clamp(1 + state.combos * 0.15, 1, 5);
      } else {
        state.combos = 1;
        state.streak = 1;
        state.multiplier = 1.15;
      }
      state.lastCatchTime = now;
      
      // Trigger honey rush on long streaks
      if (state.streak >= 8 && Date.now() > state.honeyRushUntil) {
        state.honeyRushUntil = Date.now() + 6000;
        showOverlay('Honey Rush!', 'Golden pots everywhere!', 1500);
      }
      
      // Visual effects
      particles.burst(pot.x, pot.y, isGolden ? 20 : 12, 
                     isGolden ? '#FFD700' : '#FFD54F',
                     { size: isGolden ? 5 : 3, speed: 4 });
      
      // Remove pot
      state.pots.splice(index, 1);
      
      // Update HUD
      updateHUD();
      
      // Audio feedback
      if (window.audioManager && typeof window.audioManager.playGameSound === 'function') {
        window.audioManager.playGameSound(isGolden ? 'golden' : 'collect');
      }
    }

    function handleBeeCollision(bee, index) {
      const damage = bee.type === 'angry' ? 2 : 1;
      state.lives -= damage;
      
      // Reset combo
      state.combos = 0;
      state.multiplier = 1;
      state.streak = 0;
      
      // Visual effects
      particles.burst(bee.x, bee.y, 15, '#FF6B6B', { size: 4, speed: 3 });
      
      // Remove bee
      state.bees.splice(index, 1);
      
      // Update HUD
      updateHUD();
      
      // Show feedback
      if (state.lives <= 0) {
        endGame(false);
      } else {
        showOverlay('Ouch!', `Bee stung Pooh! ${state.lives} ${state.lives === 1 ? 'life' : 'lives'} left`, 1200);
        
        // Shake effect
        if (card) {
          card.style.animation = 'shake 0.3s ease-in-out';
          setTimeout(() => {
            card.style.animation = '';
          }, 300);
        }
      }
      
      // Audio feedback
      if (window.audioManager && typeof window.audioManager.playGameSound === 'function') {
        window.audioManager.playGameSound('damage');
      }
    }

    function renderGame() {
      // Clear canvas
      ctx.clearRect(0, 0, W, H);
      
      // Draw background
      if (bgCanvas) {
        ctx.drawImage(bgCanvas, 0, 0);
      }
      
      // Draw game objects
      state.pots.forEach(pot => drawHoneyPot(pot));
      state.bees.forEach(bee => drawBee(bee));
      state.powerUps.forEach(pu => drawPowerUp(pu));
      
      // Draw particles
      particles.render();
      
      // Draw Pooh
      drawPooh();
      
      // Draw UI text
      drawGameUI();
    }

    function drawGameUI() {
      // Draw combo text if active
      if (state.combos >= 3) {
        ctx.save();
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(`${state.combos} Combo! ×${state.multiplier.toFixed(1)}`, W / 2, 40);
        ctx.restore();
      }
      
      // Draw active power-ups
      const now = Date.now();
      const activeEffects = [];
      
      if (state.doublePoints && now < state.doublePointsUntil) {
        const seconds = Math.ceil((state.doublePointsUntil - now) / 1000);
        activeEffects.push(`⭐ ${seconds}s`);
      }
      if (state.invincible && now < state.invincibleUntil) {
        const seconds = Math.ceil((state.invincibleUntil - now) / 1000);
        activeEffects.push(`🛡️ ${seconds}s`);
      }
      if (state.slowMo && now < state.slowMoUntil) {
        const seconds = Math.ceil((state.slowMoUntil - now) / 1000);
        activeEffects.push(`⚡ ${seconds}s`);
      }
      
      if (activeEffects.length > 0) {
        ctx.save();
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0b2d17';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 3;
        activeEffects.forEach((effect, i) => {
          ctx.fillText(effect, 10, 25 + i * 20);
        });
        ctx.restore();
      }
    }

    // -------------------------------------------------------------------------
    // Game Control Functions
    // -------------------------------------------------------------------------
    function startGame() {
      if (state.running && !state.gameOver) return;
      
      // Reset game state
      resetGame();
      
      // Start countdown
      let countdown = 3;
      showOverlay(`Starting in ${countdown}...`, 'Get ready!', 0);
      setStatus('Get ready...', 'warning');
      
      const countdownInterval = setInterval(() => {
        countdown--;
        
        if (countdown > 0) {
          showOverlay(`Starting in ${countdown}...`, 'Get ready!', 0);
        } else {
          clearInterval(countdownInterval);
          
          // Start the game
          state.running = true;
          state.gameOver = false;
          state.paused = false;
          
          showOverlay('Go!', 'Catch honey, avoid bees!', 800);
          setStatus('Game in progress', 'success');
          
          // Start game timer
          startGameTimer();
          
          // Start game loop if not already running
          if (!state.frameId) {
            gameLoop();
          }
          
          // Audio feedback
          if (window.audioManager && typeof window.audioManager.playTone === 'function') {
            window.audioManager.playTone([523.25, 659.25, 783.99], 0.15);
          }
        }
      }, 1000);
    }

    function resetGame() {
      // Clear all game objects
      state.pots.length = 0;
      state.bees.length = 0;
      state.powerUps.length = 0;
      particles.clear();
      
      // Reset game state
      state.score = 0;
      state.timeLeft = state.modeCfg.time;
      state.lives = state.modeCfg.lives;
      state.combos = 0;
      state.multiplier = 1;
      state.streak = 0;
      state.lastCatchTime = 0;
      state.difficulty = 0;
      
      // Reset power-ups
      state.invincible = false;
      state.doublePoints = false;
      state.slowMo = false;
      state.honeyRushUntil = 0;
      
      // Reset Pooh position
      state.pooh.x = W / 2;
      state.pooh.y = H - 70;
      state.pooh.targetX = W / 2;
      
      // Clear timers
      if (state.timerId) {
        clearInterval(state.timerId);
        state.timerId = null;
      }
      
      if (state.countdownId) {
        clearInterval(state.countdownId);
        state.countdownId = null;
      }
      
      // Update HUD
      updateHUD();
    }

    function startGameTimer() {
      if (state.timerId) {
        clearInterval(state.timerId);
      }
      
      state.timerId = setInterval(() => {
        if (!state.running || state.paused || state.gameOver) return;
        
        state.timeLeft--;
        
        // Increase difficulty every 15 seconds
        const elapsed = state.modeCfg.time - state.timeLeft;
        state.difficulty = Math.floor(elapsed / 15);
        
        updateHUD();
        
        if (state.timeLeft <= 0) {
          endGame(true);
        }
      }, 1000);
    }

    function togglePause() {
      if (!state.running || state.gameOver) return;
      
      state.paused = !state.paused;
      
      if (state.paused) {
        showOverlay('Paused', 'Click pause again to resume', 0);
        setStatus('Game paused', 'warning');
      } else {
        hideOverlay();
        setStatus('Game resumed', 'success');
      }
      
      updateHUD();
    }

    function endGame(timeExpired) {
      if (!state.running || state.gameOver) return;
      
      state.running = false;
      state.gameOver = true;
      
      // Clear timers
      if (state.timerId) {
        clearInterval(state.timerId);
        state.timerId = null;
      }
      
      // Calculate final score with bonuses
      const bonuses = {
        lives: Math.max(0, state.lives - 1) * 25,
        combo: state.combos >= 10 ? 50 : 0,
        streak: state.streak >= 15 ? 75 : 0,
        difficulty: state.difficulty * 20
      };
      
      const totalBonus = Object.values(bonuses).reduce((a, b) => a + b, 0);
      const finalScore = Math.round((state.score + totalBonus) * state.modeCfg.scoreScale);
      
      // Check if new high score
      const isNewBest = saveBestScore(finalScore);
      
      // Show game over screen
      const message = timeExpired ? "Time's Up!" : "Game Over!";
      const details = `Final Score: ${finalScore}${totalBonus > 0 ? ` (+${totalBonus} bonus)` : ''}${isNewBest ? ' - New Best!' : ''}`;
      
      showOverlay(message, details, 0);
      setStatus(`Game Over - Score: ${finalScore}`, 'error');
      
      // Celebration particles
      particles.burst(W / 2, H / 2, 50, timeExpired ? '#4CAF50' : '#FF9800', {
        size: 6,
        speed: 6,
        gravity: 0.1
      });
      
      // Audio feedback
      if (window.audioManager && typeof window.audioManager.playGameSound === 'function') {
        window.audioManager.playGameSound(timeExpired ? 'victory' : 'defeat');
      }
    }

    // -------------------------------------------------------------------------
    // Input Handling
    // -------------------------------------------------------------------------
    function handlePointerDown(e) {
      if (!state.running || state.paused || state.gameOver) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      
      state.pooh.targetX = clamp(x, state.pooh.width/2, W - state.pooh.width/2);
    }

    function handleMouseMove(e) {
      if (!state.running || state.paused || state.gameOver) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      
      state.pooh.targetX = clamp(x, state.pooh.width/2, W - state.pooh.width/2);
    }

    function handleTouchMove(e) {
      if (!state.running || state.paused || state.gameOver) return;
      if (!e.touches || e.touches.length === 0) return;
      
      e.preventDefault();
      
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      
      state.pooh.targetX = clamp(x, state.pooh.width/2, W - state.pooh.width/2);
    }

    function handleKeyDown(e) {
      if (!state.running || state.paused || state.gameOver) return;
      
      const step = 25;
      
      switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          state.pooh.targetX = Math.max(state.pooh.width/2, state.pooh.targetX - step);
          e.preventDefault();
          break;
          
        case 'ArrowRight':
        case 'd':
        case 'D':
          state.pooh.targetX = Math.min(W - state.pooh.width/2, state.pooh.targetX + step);
          e.preventDefault();
          break;
          
        case ' ':
          // Optional: add a dash/boost
          particles.burst(state.pooh.x, state.pooh.y - 20, 10, '#FFFFFF', {
            size: 3,
            speed: 2
          });
          e.preventDefault();
          break;
      }
    }

    // -------------------------------------------------------------------------
    // Joystick Controls
    // -------------------------------------------------------------------------
    function setupJoystick() {
      if (!joystick || !joystickKnob) return;
      
      const maxDistance = 40;
      
      function updateKnobPosition(dx) {
        const x = clamp(dx, -maxDistance, maxDistance);
        joystickKnob.style.transform = `translate(${x}px, 0px)`;
      }
      
      function startJoystick(e) {
        if (!state.running || state.paused || state.gameOver) return;
        
        state.joyActive = true;
        state.joyPointerId = e.pointerId;
        
        const rect = joystick.getBoundingClientRect();
        state.joyCenterX = rect.left + rect.width / 2;
        state.joyCenterY = rect.top + rect.height / 2;
        
        if (joystick.setPointerCapture) {
          joystick.setPointerCapture(e.pointerId);
        }
        
        updateJoystick(e);
      }
      
      function updateJoystick(e) {
        if (!state.joyActive) return;
        if (state.joyPointerId !== null && e.pointerId !== state.joyPointerId) return;
        
        const dx = e.clientX - state.joyCenterX;
        state.joyDx = clamp(dx, -maxDistance, maxDistance);
        updateKnobPosition(state.joyDx);
        
        // Update Pooh target based on joystick
        const speed = 15;
        state.pooh.targetX += (state.joyDx / maxDistance) * speed;
        state.pooh.targetX = clamp(state.pooh.targetX, state.pooh.width/2, W - state.pooh.width/2);
      }
      
      function endJoystick(e) {
        if (state.joyPointerId !== null && e.pointerId !== state.joyPointerId) return;
        
        state.joyActive = false;
        state.joyPointerId = null;
        state.joyDx = 0;
        state.joyDy = 0;
        updateKnobPosition(0);
      }
      
      // Event listeners
      joystick.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        startJoystick(e);
      });
      
      window.addEventListener('pointermove', (e) => {
        if (!state.joyActive) return;
        updateJoystick(e);
      });
      
      window.addEventListener('pointerup', endJoystick);
      window.addEventListener('pointercancel', endJoystick);
    }

    // -------------------------------------------------------------------------
    // Game Loop
    // -------------------------------------------------------------------------
    function gameLoop(timestamp) {
      if (!state.frameId) {
        state.frameId = requestAnimationFrame(gameLoop);
      }
      
      if (!frameLimiter.shouldRender(timestamp)) {
        state.frameId = requestAnimationFrame(gameLoop);
        return;
      }
      
      const dt = Math.min(100, timestamp - state.lastUpdateTime);
      state.lastUpdateTime = timestamp;
      
      updateGame(dt);
      renderGame();
      
      state.frameId = requestAnimationFrame(gameLoop);
    }

    // -------------------------------------------------------------------------
    // Initialization
    // -------------------------------------------------------------------------
    function initialize() {
      console.log('[HoneyCatch] Initializing game...');
      
      // Load best score
      loadBestScore();
      
      // Set initial mode
      setGameMode('calm');
      
      // Setup controls
      setupJoystick();
      
      // Add event listeners
      canvas.addEventListener('pointerdown', handlePointerDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('keydown', handleKeyDown);
      
      if (startBtn) {
        startBtn.addEventListener('click', startGame);
      }
      
      if (pauseBtn) {
        pauseBtn.addEventListener('click', togglePause);
      }
      
      // Mode buttons
      modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.dataset.catchMode;
          setGameMode(mode);
          setStatus(`${MODES[mode].label} mode selected`, 'info');
          showOverlay(MODES[mode].label, MODES[mode].hint, 1200);
        });
      });
      
      // Initial resize and render
      resizeCanvas();
      renderGame();
      
      // Show ready message
      setStatus('Ready to play - Select a mode and press Start', 'info');
      showOverlay('Honey Pot Catch', 'Select a mode and press Start to play', 0);
      
      // Handle window resize
      window.addEventListener('resize', resizeCanvas);
      
      console.log('[HoneyCatch] Game initialized successfully');
    }

    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------
    function cleanup() {
      console.log('[HoneyCatch] Cleaning up...');
      
      // Stop game loop
      if (state.frameId) {
        cancelAnimationFrame(state.frameId);
        state.frameId = null;
      }
      
      // Clear timers
      if (state.timerId) {
        clearInterval(state.timerId);
        state.timerId = null;
      }
      
      if (state.countdownId) {
        clearInterval(state.countdownId);
        state.countdownId = null;
      }
      
      if (state.overlayTimer) {
        clearTimeout(state.overlayTimer);
        state.overlayTimer = null;
      }
      
      // Remove event listeners
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', resizeCanvas);
      
      if (startBtn) {
        startBtn.removeEventListener('click', startGame);
      }
      
      if (pauseBtn) {
        pauseBtn.removeEventListener('click', togglePause);
      }
    }

    // Initialize the game
    initialize();

    // Return public API
    return {
      startGame,
      togglePause,
      setGameMode,
      getState: () => ({ ...state }),
      cleanup
    };
  }

  // ---------------------------------------------------------------------------
  // Bootstrap the game when DOM is ready
  // ---------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    try {
      if (document.getElementById('honey-game')) {
        window.honeyCatchGame = EnhancedHoneyCatchGame();
        console.log('[HoneyCatch] Game loaded and ready');
      }
    } catch (err) {
      console.error('[HoneyCatch] Failed to initialize:', err);
    }
  });
})();