// game.js — Honey Pot Catch (isolated)
// Owns ONLY the Honey Pot Catch game canvas + its HUD IDs.
// It must not control site-wide nav, cover, modals, or audio.
/* eslint-disable no-console */
'use strict';

(function () {
  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  class FrameRateLimiter {
    constructor(targetFPS = 60) {
      this.targetFPS = targetFPS;
      this.frameInterval = 1000 / targetFPS;
      this.lastFrameTime = 0;
      this.fps = 0;
      this.lastFPSUpdate = 0;
    }

    shouldRender(timestamp) {
      if (timestamp - this.lastFrameTime >= this.frameInterval) {
        this.fps = 1000 / Math.max(1, (timestamp - this.lastFrameTime));
        this.lastFrameTime = timestamp;

        if (window.DEBUG_MODE && timestamp - this.lastFPSUpdate > 1000) {
          this.lastFPSUpdate = timestamp;
          console.log(`FPS: ${Math.round(this.fps)}`);
        }
        return true;
      }
      return false;
    }

    getFPS() {
      return Math.round(this.fps);
    }

    reset() {
      this.lastFrameTime = 0;
    }
  }

  function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const touchPoints = navigator.maxTouchPoints || ('ontouchstart' in window);
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
      (touchPoints && window.innerWidth <= 768)
    );
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function shakeElement(el, intensity = 5, duration = 300) {
    if (!el || !el.style) return;

    const originalTransform = el.style.transform || '';
    const startTime = Date.now();

    function animateShake() {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        const shakeX = (Math.random() - 0.5) * intensity * (1 - progress);
        const shakeY = (Math.random() - 0.5) * intensity * (1 - progress);
        el.style.transform = `${originalTransform} translate(${shakeX}px, ${shakeY}px)`;
        requestAnimationFrame(animateShake);
      } else {
        el.style.transform = originalTransform;
      }
    }

    animateShake();
  }

  // Defaults (script.js no longer sets these)
  const IS_MOBILE = isMobileDevice();
  window.MAX_PARTICLES = window.MAX_PARTICLES ?? (IS_MOBILE ? 60 : 180);
  window.GAME_FPS_TARGET = window.GAME_FPS_TARGET ?? (IS_MOBILE ? 30 : 60);

  // ---------------------------------------------------------------------------
  // Particle system
  // ---------------------------------------------------------------------------
  class EnhancedParticleSystem {
    constructor(canvas, maxParticles = window.MAX_PARTICLES) {
      this.canvas = canvas;
      this.ctx = canvas ? canvas.getContext('2d') : null;
      this.maxParticles = maxParticles;
      this.particles = [];
      this.emitters = [];
      this.particleTypes = {
        honey: { color: '#FFD54F', size: { min: 3, max: 8 }, life: 1.5 },
        sparkle: { color: '#FFFFFF', size: { min: 2, max: 4 }, life: 0.8 },
        fire: { color: '#FF6B6B', size: { min: 4, max: 10 }, life: 1.2 },
        leaf: { color: '#4CAF50', size: { min: 4, max: 8 }, life: 2.0 },
        magic: { color: '#BA68C8', size: { min: 3, max: 6 }, life: 1.0 }
      };
    }

    createParticle(x, y, type = 'honey', velocity = null) {
      if (this.particles.length >= this.maxParticles) return null;

      const config = this.particleTypes[type] || this.particleTypes.honey;
      const size = config.size.min + Math.random() * (config.size.max - config.size.min);

      const particle = {
        x, y,
        vx: velocity ? velocity.x : (Math.random() - 0.5) * 4,
        vy: velocity ? velocity.y : (Math.random() - 0.5) * 4 - 2,
        life: config.life,
        maxLife: config.life,
        decay: 0.02 + Math.random() * 0.02,
        size,
        color: config.color,
        type,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1
      };

      this.particles.push(particle);
      return particle;
    }

    update(delta) {
      const now = Date.now();

      // Emitters (kept for future expansion; safe even if none exist)
      for (let i = this.emitters.length - 1; i >= 0; i--) {
        const emitter = this.emitters[i];
        if (!emitter.active || (now - emitter.startTime) > emitter.duration) {
          this.emitters.splice(i, 1);
          continue;
        }
        if (now - emitter.lastEmission > 1000 / emitter.rate) {
          for (let j = 0; j < Math.floor(emitter.rate / 30); j++) {
            this.createParticle(emitter.x, emitter.y, emitter.type);
          }
          emitter.lastEmission = now;
        }
      }

      // Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.life -= p.decay;
        p.rotation += p.rotationSpeed;
        p.vx *= 0.99;
        p.vy *= 0.99;

        if (p.life <= 0) this.particles.splice(i, 1);
      }
    }

    render() {
      if (!this.ctx) return;

      this.ctx.save();
      this.particles.forEach(p => {
        const alpha = p.life / p.maxLife;

        switch (p.type) {
          case 'sparkle':
            this.ctx.globalAlpha = alpha * 0.8;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 10 * alpha;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            break;

          case 'leaf':
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
            break;

          default:
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
      });
      this.ctx.restore();
    }

    clear() {
      this.particles = [];
      this.emitters = [];
    }
  }

  // ---------------------------------------------------------------------------
  // Game
  // ---------------------------------------------------------------------------
  function initEnhancedHoneyCatchGame() {
    console.log('Initializing Honey Pot Catch...');

    const canvas = document.getElementById('honey-game');
    if (!canvas) {
      console.error('Honey catch game canvas not found!');
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      console.error('2D context not available!');
      return;
    }

    // Cache canvas (logical space)
    const catchBackgroundCanvas = document.createElement('canvas');
    const catchBgCtx = catchBackgroundCanvas.getContext('2d');

    // Logical (CSS pixel) game size
    let W = 0;
    let H = 0;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      W = Math.max(1, Math.round(rect.width));
      H = Math.max(1, Math.round(rect.height));

      // Backing store (device pixels)
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);

      // Draw in CSS pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Cache canvas in logical pixels
      catchBackgroundCanvas.width = W;
      catchBackgroundCanvas.height = H;

      buildCatchBackgroundCache();
    }

    window.addEventListener('resize', resizeCanvas);

    // Performance optimizations
    canvas.style.imageRendering = IS_MOBILE ? 'pixelated' : 'auto';
    ctx.imageSmoothingEnabled = !IS_MOBILE;

    const frameLimiter = new FrameRateLimiter(window.GAME_FPS_TARGET);

    // UI elements
    const scoreSpan = document.getElementById('score-count');
    const timeSpan = document.getElementById('time-count');
    const livesSpan = document.getElementById('catch-lives');
    const startBtn = document.getElementById('start-catch');
    const pauseBtn = document.getElementById('pause-catch');
    const catchOverlay = document.getElementById('catch-overlay');
    const catchCountdown = document.getElementById('catch-countdown');
    const catchHint = document.getElementById('catch-hint');
    const catchCard = document.getElementById('catch-card');
    const multiplierDisplay = document.getElementById('catch-multiplier');
    const comboDisplay = document.getElementById('catch-combo');

    // Safety: if critical HUD is missing, still run game but log clearly
    if (!scoreSpan || !timeSpan || !livesSpan || !startBtn || !pauseBtn) {
      console.warn('Some HUD elements are missing. Check IDs in index.html.');
    }

    // Power-ups
    const powerUpTypes = {
      heart: { color: '#FF6B6B', icon: '❤️', effect: 'addLife', duration: 0 },
      shield: { color: '#4285F4', icon: '🛡️', effect: 'invincibility', duration: 5000 },
      clock: { color: '#4CAF50', icon: '⏱️', effect: 'addTime', duration: 0 },
      star: { color: '#FFD700', icon: '⭐', effect: 'doublePoints', duration: 8000 },
      lightning: { color: '#9C27B0', icon: '⚡', effect: 'slowMotion', duration: 6000 }
    };

    // Optional sprites
    const Sprites = window.Sprites || {};

    // Particles
    const catchParticles = new EnhancedParticleSystem(canvas);

    // Game state (ALL in logical pixels)
    const gameState = {
      score: 0,
      timeLeft: 60,
      lives: 3,
      gameRunning: false,
      timerInterval: null,
      countdownInterval: null,
      overlayTimeout: null,

      lastFrameTime: performance.now(),

      poohX: 0,
      poohY: 0,
      poohWidth: 60,
      poohHeight: 60,

      honeyPots: [],
      bees: [],
      powerUps: [],
      combos: 0,
      multiplier: 1,
      lastCatchTime: 0,
      streak: 0,

      effects: [],

      isInvincible: false,
      invincibilityEnd: 0,
      doublePoints: false,
      doublePointsEnd: 0,
      slowMotion: false,
      slowMotionEnd: 0
    };

    // Pools (simple & fast)
    const honeyPotPool = {
      pool: [],
      active: 0,
      get(x, y, speed, type = 'normal') {
        let pot;
        if (this.active < this.pool.length) {
          pot = this.pool[this.active];
          Object.assign(pot, { x, y, speed, type, active: true });
        } else {
          pot = { x, y, speed, type, active: true };
          this.pool.push(pot);
        }
        this.active++;
        return pot;
      },
      updateAll(callback) {
        for (let i = 0; i < this.active; i++) {
          const pot = this.pool[i];
          if (pot.active) callback(pot);
        }
      },
      reset() {
        for (let i = 0; i < this.pool.length; i++) this.pool[i].active = false;
        this.active = 0;
      }
    };

    const beePool = {
      pool: [],
      active: 0,
      get(x, y, speed, type = 'normal') {
        let bee;
        if (this.active < this.pool.length) {
          bee = this.pool[this.active];
          Object.assign(bee, { x, y, speed, type, active: true, vx: 0, vy: 0 });
        } else {
          bee = { x, y, speed, type, active: true, vx: 0, vy: 0 };
          this.pool.push(bee);
        }
        this.active++;
        return bee;
      },
      updateAll(callback) {
        for (let i = 0; i < this.active; i++) {
          const bee = this.pool[i];
          if (bee.active) callback(bee);
        }
      },
      reset() {
        for (let i = 0; i < this.pool.length; i++) this.pool[i].active = false;
        this.active = 0;
      }
    };

    const powerUpPool = {
      pool: [],
      active: 0,
      get(x, y, speed, type) {
        let p;
        if (this.active < this.pool.length) {
          p = this.pool[this.active];
          Object.assign(p, { x, y, speed, type, active: true });
        } else {
          p = { x, y, speed, type, active: true };
          this.pool.push(p);
        }
        this.active++;
        return p;
      },
      updateAll(callback) {
        for (let i = 0; i < this.active; i++) {
          const p = this.pool[i];
          if (p.active) callback(p);
        }
      },
      reset() {
        for (let i = 0; i < this.pool.length; i++) this.pool[i].active = false;
        this.active = 0;
      }
    };

    // Sprite cache (optional image usage, otherwise fallbacks)
    const spriteCache = {
      pooh: null,
      honey: {},
      bee: null,
      power: {},

      renderPooh() {
        if (this.pooh) return this.pooh;

        const c = document.createElement('canvas');
        c.width = 80;
        c.height = 80;
        const g = c.getContext('2d');

        const img = Sprites.pooh;
        if (img && img.complete && img.naturalWidth > 0) {
          g.save();
          g.shadowColor = 'rgba(0,0,0,0.35)';
          g.shadowBlur = 10;
          g.drawImage(img, 10, 10, 60, 60);
          g.restore();
        } else {
          drawPoohFallback(g);
        }

        this.pooh = c;
        return c;
      },

      renderHoney(type = 'normal') {
        if (this.honey[type]) return this.honey[type];

        const c = document.createElement('canvas');
        c.width = 32;
        c.height = 32;
        const g = c.getContext('2d');

        const img = Sprites.honey;
        if (img && img.complete && img.naturalWidth > 0) {
          g.drawImage(img, 0, 0, 32, 32);
        } else {
          drawHoneyFallback(g, type);
        }

        this.honey[type] = c;
        return c;
      },

      renderBee() {
        if (this.bee) return this.bee;

        const c = document.createElement('canvas');
        c.width = 30;
        c.height = 30;
        const g = c.getContext('2d');
        drawBeeFallback(g);
        this.bee = c;
        return c;
      },

      renderPower(type) {
        if (this.power[type]) return this.power[type];

        const c = document.createElement('canvas');
        c.width = 30;
        c.height = 30;
        const g = c.getContext('2d');
        drawPowerIcon(g, type);
        this.power[type] = c;
        return c;
      }
    };

    function drawPoohFallback(g) {
      const grad = g.createLinearGradient(0, 0, 0, 80);
      grad.addColorStop(0, '#FFC107');
      grad.addColorStop(1, '#FF9800');

      g.fillStyle = grad;
      g.beginPath();
      g.arc(40, 40, 30, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = '#FFD8A6';
      g.beginPath();
      g.ellipse(40, 48, 18, 12, 0, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = '#D62E2E';
      g.fillRect(20, 55, 40, 15);

      g.fillStyle = '#000';
      g.beginPath();
      g.arc(32, 32, 3, 0, Math.PI * 2);
      g.arc(48, 32, 3, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = '#8B4513';
      g.beginPath();
      g.arc(40, 40, 5, 0, Math.PI * 2);
      g.fill();

      g.strokeStyle = '#000';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(40, 46, 10, 0.2, Math.PI - 0.2, false);
      g.stroke();

      g.fillStyle = '#FF9800';
      g.beginPath();
      g.arc(25, 20, 10, 0, Math.PI * 2);
      g.arc(55, 20, 10, 0, Math.PI * 2);
      g.fill();
    }

    function drawHoneyFallback(g, type = 'normal') {
      const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, '#FFEB3B');
      grad.addColorStop(0.7, '#FFD54F');
      grad.addColorStop(1, '#FFB300');

      g.fillStyle = grad;
      g.beginPath();
      g.arc(16, 16, 16, 0, Math.PI * 2);
      g.fill();

      g.strokeStyle = '#8B4513';
      g.lineWidth = 3;
      g.stroke();

      g.fillStyle = '#8B4513';
      g.fillRect(8, 6, 16, 5);
      g.fillRect(12, 3, 8, 3);

      g.fillStyle = '#FF9800';
      g.beginPath();
      g.ellipse(16, 22, 7, 10, 0, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = 'rgba(255,255,255,0.8)';
      g.beginPath();
      g.arc(10, 10, 4, 0, Math.PI * 2);
      g.fill();

      if (type === 'golden') {
        g.strokeStyle = '#FFD700';
        g.lineWidth = 2;
        g.setLineDash([2, 2]);
        g.beginPath();
        g.arc(16, 16, 18, 0, Math.PI * 2);
        g.stroke();
        g.setLineDash([]);
      }
    }

    function drawBeeFallback(g) {
      const grad = g.createRadialGradient(15, 15, 0, 15, 15, 12);
      grad.addColorStop(0, '#FFEB3B');
      grad.addColorStop(1, '#FF9800');

      g.fillStyle = grad;
      g.beginPath();
      g.arc(15, 15, 12, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = '#000';
      g.fillRect(8, 10, 5, 8);
      g.fillRect(18, 10, 5, 8);

      g.beginPath();
      g.arc(12, 12, 2, 0, Math.PI * 2);
      g.arc(18, 12, 2, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = 'rgba(255,255,255,0.8)';
      g.beginPath();
      g.arc(8, 5, 8, 0, Math.PI * 2);
      g.arc(22, 5, 8, 0, Math.PI * 2);
      g.fill();
    }

    function drawPowerIcon(g, type) {
      const p = powerUpTypes[type];
      if (!p) return;

      g.fillStyle = p.color + '33';
      g.beginPath();
      g.arc(15, 15, 15, 0, Math.PI * 2);
      g.fill();

      g.strokeStyle = p.color;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(15, 15, 14, 0, Math.PI * 2);
      g.stroke();

      g.font = '18px Arial';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = '#111';
      g.fillText(p.icon, 15, 15);
    }

    // -----------------------------------------------------------------------
    // Overlay + HUD
    // -----------------------------------------------------------------------
    function setOverlay(line, sub, persistent = false, duration = 1600) {
      if (!catchOverlay || !catchCountdown || !catchHint) return;

      catchCountdown.textContent = line;
      catchHint.textContent = sub || '';
      catchOverlay.classList.add('active');

      if (gameState.overlayTimeout) clearTimeout(gameState.overlayTimeout);
      if (!persistent) {
        gameState.overlayTimeout = setTimeout(() => {
          catchOverlay.classList.remove('active');
        }, duration);
      }
    }

    function syncStats() {
      if (scoreSpan) scoreSpan.textContent = String(gameState.score);
      if (timeSpan) timeSpan.textContent = String(gameState.timeLeft);
      if (livesSpan) livesSpan.textContent = String(gameState.lives);

      if (multiplierDisplay) {
        multiplierDisplay.textContent = `x${(Math.round(gameState.multiplier * 10) / 10).toFixed(1).replace('.0', '')}`;
        multiplierDisplay.style.display = gameState.multiplier > 1 ? 'inline' : 'none';
      }
      if (comboDisplay) {
        comboDisplay.textContent = `${gameState.combos} Combo`;
        comboDisplay.style.display = gameState.combos > 1 ? 'inline' : 'none';
      }
    }

    // -----------------------------------------------------------------------
    // Background cache
    // -----------------------------------------------------------------------
    function buildCatchBackgroundCache() {
      if (!catchBgCtx) return;

      // Sky
      const sky = catchBgCtx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#87CEEB');
      sky.addColorStop(0.6, '#B3E5FC');
      sky.addColorStop(1, '#E3F2FD');
      catchBgCtx.fillStyle = sky;
      catchBgCtx.fillRect(0, 0, W, H);

      // Sun
      catchBgCtx.save();
      catchBgCtx.shadowColor = '#FFD700';
      catchBgCtx.shadowBlur = 40;
      catchBgCtx.fillStyle = '#FFEB3B';
      catchBgCtx.beginPath();
      catchBgCtx.arc(80, 80, 35, 0, Math.PI * 2);
      catchBgCtx.fill();

      catchBgCtx.strokeStyle = '#FFD700';
      catchBgCtx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const x1 = 80 + Math.cos(ang) * 35;
        const y1 = 80 + Math.sin(ang) * 35;
        const x2 = 80 + Math.cos(ang) * 55;
        const y2 = 80 + Math.sin(ang) * 55;
        catchBgCtx.beginPath();
        catchBgCtx.moveTo(x1, y1);
        catchBgCtx.lineTo(x2, y2);
        catchBgCtx.stroke();
      }
      catchBgCtx.restore();

      // Clouds
      drawClouds(catchBgCtx);

      // Ground
      const groundH = 70;
      const groundY = H - groundH;
      const ground = catchBgCtx.createLinearGradient(0, groundY, 0, H);
      ground.addColorStop(0, '#8BC34A');
      ground.addColorStop(1, '#689F38');
      catchBgCtx.fillStyle = ground;
      catchBgCtx.fillRect(0, groundY, W, groundH);

      // Grass detail
      catchBgCtx.fillStyle = '#7CB342';
      for (let x = 0; x < W; x += 10) {
        const hh = 10 + Math.random() * 20;
        const sway = Math.sin(x * 0.1) * 4;
        catchBgCtx.fillRect(x + sway, groundY, 3, -hh);
      }

      drawFlowers(catchBgCtx, groundY);
      drawTrees(catchBgCtx);
    }

    function drawClouds(g) {
      g.save();
      g.fillStyle = 'rgba(255,255,255,0.9)';

      for (let i = 0; i < 3; i++) {
        const x = 50 + i * 200;
        const y = 60 + Math.sin(i) * 20;
        g.beginPath();
        g.arc(x, y, 20, 0, Math.PI * 2);
        g.arc(x + 25, y - 10, 25, 0, Math.PI * 2);
        g.arc(x + 50, y, 20, 0, Math.PI * 2);
        g.fill();
      }

      g.globalAlpha = 0.7;
      for (let i = 0; i < 2; i++) {
        const x = 150 + i * 250;
        const y = 120 + Math.cos(i) * 15;
        g.beginPath();
        g.arc(x, y, 25, 0, Math.PI * 2);
        g.arc(x + 30, y - 15, 30, 0, Math.PI * 2);
        g.arc(x + 60, y, 25, 0, Math.PI * 2);
        g.fill();
      }

      g.restore();
    }

    function drawFlowers(g, groundY) {
      const flowers = [
        { x: 100, color: '#FF5252', size: 6 },
        { x: 180, color: '#FF4081', size: 5 },
        { x: 260, color: '#E040FB', size: 7 },
        { x: 340, color: '#536DFE', size: 6 },
        { x: 420, color: '#00BCD4', size: 5 },
        { x: 500, color: '#4CAF50', size: 6 }
      ];

      flowers.forEach(f => {
        g.save();
        g.translate(clamp(f.x, 30, W - 30), groundY - 15);

        g.strokeStyle = '#4CAF50';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(0, -25);
        g.stroke();

        const petals = 5 + Math.floor(Math.random() * 3);
        for (let p = 0; p < petals; p++) {
          const ang = (p / petals) * Math.PI * 2;
          g.fillStyle = f.color;
          g.beginPath();
          g.ellipse(
            Math.cos(ang) * f.size,
            Math.sin(ang) * f.size,
            f.size * 0.8,
            f.size * 0.5,
            ang,
            0,
            Math.PI * 2
          );
          g.fill();
        }

        g.fillStyle = '#FFD54F';
        g.beginPath();
        g.arc(0, 0, f.size * 0.6, 0, Math.PI * 2);
        g.fill();

        g.restore();
      });
    }

    function drawTrees(g) {
      // Tree left
      g.fillStyle = '#8B4513';
      g.fillRect(90, 160, 28, 160);
      g.fillStyle = '#2E7D32';
      g.beginPath();
      g.arc(104, 140, 55, 0, Math.PI * 2);
      g.fill();

      // Tree right
      g.fillStyle = '#A0522D';
      g.fillRect(W - 120, 190, 30, 130);
      g.fillStyle = '#388E3C';
      g.beginPath();
      g.arc(W - 105, 165, 50, 0, Math.PI * 2);
      g.fill();
    }

    function drawBackground() {
      ctx.drawImage(catchBackgroundCanvas, 0, 0);
    }

    // -----------------------------------------------------------------------
    // Effects
    // -----------------------------------------------------------------------
    function createCatchEffect(x, y, points) {
      gameState.effects.push({ type: 'catch', x, y, start: Date.now(), duration: 500 });
      gameState.effects.push({ type: 'score', x, y: y - 20, text: `+${points}`, start: Date.now(), duration: 1000 });

      for (let i = 0; i < 8; i++) {
        catchParticles.createParticle(x, y, 'honey', {
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 4 - 2
        });
      }
    }

    function createDamageEffect(x, y) {
      gameState.effects.push({ type: 'damage', x, y, start: Date.now(), duration: 500 });
      for (let i = 0; i < 6; i++) {
        catchParticles.createParticle(x, y, 'fire', {
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 4
        });
      }
    }

    function createMissEffect(x, y) {
      gameState.effects.push({ type: 'score', x, y: y - 20, text: 'Miss!', start: Date.now(), duration: 800 });
    }

    function createPowerUpEffect(x, y, type) {
      const p = powerUpTypes[type];
      if (!p) return;

      // A little CSS ripple (optional)
      const parent = canvas.parentElement;
      if (parent) {
        const ring = document.createElement('div');
        ring.style.cssText = `
          position: absolute;
          left: ${x - 25}px;
          top: ${y - 25}px;
          width: 50px;
          height: 50px;
          border: 3px solid ${p.color};
          border-radius: 50%;
          animation: rippleEffect 0.6s ease-out;
          pointer-events: none;
          z-index: 5;
        `;
        parent.appendChild(ring);
        setTimeout(() => ring.remove(), 650);
      }

      for (let i = 0; i < 12; i++) {
        catchParticles.createParticle(x, y, 'sparkle', {
          x: (Math.random() - 0.5) * 6,
          y: (Math.random() - 0.5) * 6 - 2
        });
      }

      gameState.effects.push({
        type: 'score',
        x,
        y: y - 30,
        text: `${p.icon} ${type.charAt(0).toUpperCase()}${type.slice(1)}`,
        start: Date.now(),
        duration: 1000
      });
    }

    function drawEffects() {
      const now = Date.now();
      for (let i = gameState.effects.length - 1; i >= 0; i--) {
        const e = gameState.effects[i];
        const t = (now - e.start) / e.duration;
        if (t >= 1) {
          gameState.effects.splice(i, 1);
          continue;
        }

        if (e.type === 'catch' || e.type === 'damage') {
          const radius = (e.type === 'catch' ? 20 : 15) * (1 - t);
          const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, radius);
          if (e.type === 'catch') {
            grad.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
            grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
          } else {
            grad.addColorStop(0, 'rgba(255, 107, 107, 0.8)');
            grad.addColorStop(1, 'rgba(255, 107, 107, 0)');
          }
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        if (e.type === 'score') {
          ctx.save();
          ctx.font = 'bold 20px Arial';
          ctx.fillStyle = '#FFD700';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.globalAlpha = 1 - t;
          ctx.fillText(e.text, e.x, e.y - t * 30);
          ctx.restore();
        }
      }
    }

    // -----------------------------------------------------------------------
    // Power-ups
    // -----------------------------------------------------------------------
    function applyPowerUp(type) {
      const now = Date.now();
      switch (type) {
        case 'heart':
          gameState.lives = Math.min(5, gameState.lives + 1);
          syncStats();
          break;
        case 'shield':
          gameState.isInvincible = true;
          gameState.invincibilityEnd = now + powerUpTypes.shield.duration;
          break;
        case 'clock':
          gameState.timeLeft += 10;
          syncStats();
          break;
        case 'star':
          gameState.doublePoints = true;
          gameState.doublePointsEnd = now + powerUpTypes.star.duration;
          break;
        case 'lightning':
          gameState.slowMotion = true;
          gameState.slowMotionEnd = now + powerUpTypes.lightning.duration;
          break;
      }
    }

    // -----------------------------------------------------------------------
    // Draw entities
    // -----------------------------------------------------------------------
    function drawPooh() {
      const spr = spriteCache.renderPooh();
      const poohTop = gameState.poohY - gameState.poohHeight;

      ctx.save();

      if (gameState.isInvincible) {
        const blink = Math.sin(Date.now() / 100) > 0;
        if (blink) ctx.globalAlpha = 0.55;
      }

      // Shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      ctx.globalAlpha = 0.25;
      ctx.drawImage(spr, gameState.poohX - gameState.poohWidth / 2, poohTop + 6, gameState.poohWidth, gameState.poohHeight);
      ctx.restore();

      // Sprite
      ctx.globalAlpha = 1;
      ctx.drawImage(spr, gameState.poohX - gameState.poohWidth / 2, poohTop, gameState.poohWidth, gameState.poohHeight);

      // Shield ring
      if (gameState.isInvincible) {
        ctx.strokeStyle = `rgba(66, 133, 244, ${0.5 + Math.sin(Date.now() / 200) * 0.3})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(gameState.poohX, poohTop + gameState.poohHeight / 2, gameState.poohWidth / 2 + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
      drawPowerUpIndicators();
    }

    function drawPowerUpIndicators() {
      let x = 20;
      const y = 40;
      const now = Date.now();

      function drawOne(type, secs) {
        const p = powerUpTypes[type];
        if (!p) return;
        ctx.save();
        ctx.fillStyle = p.color + '33';
        ctx.beginPath();
        ctx.arc(x + 15, y + 15, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + 15, y + 15, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#111';
        ctx.fillText(p.icon, x + 15, y + 15);

        ctx.font = '10px Arial';
        ctx.fillStyle = '#111';
        ctx.fillText(`${secs}s`, x + 15, y + 35);

        ctx.restore();
        x += 40;
      }

      if (gameState.isInvincible) {
        const s = Math.ceil((gameState.invincibilityEnd - now) / 1000);
        if (s > 0) drawOne('shield', s);
      }
      if (gameState.doublePoints) {
        const s = Math.ceil((gameState.doublePointsEnd - now) / 1000);
        if (s > 0) drawOne('star', s);
      }
      if (gameState.slowMotion) {
        const s = Math.ceil((gameState.slowMotionEnd - now) / 1000);
        if (s > 0) drawOne('lightning', s);
      }
    }

    function drawHoneyPots() {
      honeyPotPool.updateAll((pot) => {
        const spr = spriteCache.renderHoney(pot.type);
        ctx.drawImage(spr, pot.x - 16, pot.y - 16);
        if (pot.type === 'golden') {
          ctx.save();
          ctx.globalAlpha = 0.25;
          ctx.drawImage(spr, pot.x - 16, pot.y - 12);
          ctx.restore();
        }
      });
    }

    function drawBees() {
      beePool.updateAll((bee) => {
        const spr = spriteCache.renderBee();

        ctx.save();
        const wobble = Math.sin(Date.now() / 100 + bee.x) * 3;
        ctx.translate(bee.x, bee.y + wobble);

        if (bee.vx || bee.vy) {
          const ang = Math.atan2(bee.vy, bee.vx);
          ctx.rotate(ang);
        }

        ctx.drawImage(spr, -15, -15);
        ctx.restore();

        if (bee.type === 'angry') {
          ctx.save();
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('💢', bee.x, bee.y - 20);
          ctx.restore();
        }
      });
    }

    function drawPowerUps() {
      powerUpPool.updateAll((p) => {
        const spr = spriteCache.renderPower(p.type);
        ctx.save();
        const float = Math.sin(Date.now() / 500 + p.x) * 5;

        ctx.drawImage(spr, p.x - 15, p.y - 15 + float);

        ctx.shadowColor = powerUpTypes[p.type].color;
        ctx.shadowBlur = 15;
        ctx.drawImage(spr, p.x - 15, p.y - 15 + float);

        ctx.restore();
      });
    }

    function drawUI() {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = '#4E342E';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${gameState.score}`, 20, 30);

      ctx.textAlign = 'left';
      ctx.fillText(`Time: ${gameState.timeLeft}s`, W - 150, 30);

      ctx.textAlign = 'center';
      ctx.fillText(`Lives: ${gameState.lives}`, W / 2, 30);

      ctx.restore();

      if (gameState.combos > 1) {
        ctx.save();
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;

        ctx.fillText(`${gameState.combos} Combo!`, W / 2, 70);

        ctx.font = 'bold 18px Arial';
        ctx.fillText(`x${(Math.round(gameState.multiplier * 10) / 10)} Multiplier`, W / 2, 100);

        ctx.restore();
      }

      if (gameState.streak > 3) {
        ctx.save();
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#4CAF50';
        ctx.textAlign = 'center';
        ctx.fillText(`🔥 ${gameState.streak} Catch Streak!`, W / 2, H - 20);
        ctx.restore();
      }
    }

    // -----------------------------------------------------------------------
    // Update
    // -----------------------------------------------------------------------
    function update(deltaMs) {
      if (!gameState.gameRunning) return;

      const now = Date.now();
      const delta = Math.min(deltaMs, 100);
      const dt = delta / 16;

      // Timers
      if (gameState.isInvincible && now > gameState.invincibilityEnd) gameState.isInvincible = false;
      if (gameState.doublePoints && now > gameState.doublePointsEnd) gameState.doublePoints = false;
      if (gameState.slowMotion && now > gameState.slowMotionEnd) gameState.slowMotion = false;

      // Combo decay
      if (gameState.combos > 0 && now - gameState.lastCatchTime > 2000) {
        gameState.combos = 0;
        gameState.multiplier = 1;
        gameState.streak = 0;
      }

      // Honey pots
      honeyPotPool.updateAll((pot) => {
        const speed = gameState.slowMotion ? pot.speed * 0.5 : pot.speed;
        pot.y += speed * dt;

        // Catch check (simple AABB-ish)
        const poohLeft = gameState.poohX - gameState.poohWidth / 2;
        const poohRight = gameState.poohX + gameState.poohWidth / 2;
        const poohTop = gameState.poohY - gameState.poohHeight;

        if (pot.y > poohTop && pot.x > poohLeft && pot.x < poohRight) {
          let points = pot.type === 'golden' ? 50 : 10;
          if (gameState.doublePoints) points *= 2;
          points = Math.round(points * gameState.multiplier);

          gameState.score += points;

          // Combo logic
          if (now - gameState.lastCatchTime < 2000) {
            gameState.combos++;
            gameState.streak++;
            gameState.multiplier = Math.min(5, 1 + gameState.combos * 0.1);
          } else {
            gameState.combos = 1;
            gameState.streak = 1;
            gameState.multiplier = 1.1;
          }

          gameState.lastCatchTime = now;
          pot.active = false;

          createCatchEffect(pot.x, pot.y, points);

          if (window.audioManager?.playGameSound) window.audioManager.playGameSound('collect');
          syncStats();
          return;
        }

        if (pot.y > H + 20) {
          pot.active = false;
          if (gameState.streak > 0) {
            gameState.streak = 0;
            createMissEffect(pot.x, pot.y);
          }
        }
      });

      // Bees
      beePool.updateAll((bee) => {
        const speed = gameState.slowMotion ? bee.speed * 0.5 : bee.speed;
        bee.y += speed * dt;

        if (bee.type === 'angry') {
          const dx = gameState.poohX - bee.x;
          const dy = (gameState.poohY - gameState.poohHeight / 2) - bee.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0) {
            const chase = 0.05 * dt;
            bee.vx = (dx / dist) * chase;
            bee.vy = (dy / dist) * chase;
            bee.x += bee.vx;
            bee.y += bee.vy;
          }
        }

        const poohLeft = gameState.poohX - gameState.poohWidth / 2;
        const poohRight = gameState.poohX + gameState.poohWidth / 2;
        const poohTop = gameState.poohY - gameState.poohHeight;

        if (!gameState.isInvincible && bee.y > poohTop && bee.x > poohLeft && bee.x < poohRight) {
          gameState.lives -= (bee.type === 'angry' ? 2 : 1);
          bee.active = false;

          createDamageEffect(bee.x, bee.y);

          gameState.combos = 0;
          gameState.multiplier = 1;
          gameState.streak = 0;

          syncStats();
          setOverlay('Ouch! A bee buzzed Pooh.', `Hearts remaining: ${gameState.lives}.`, false, 1400);
          shakeElement(catchCard);

          if (window.audioManager?.playGameSound) window.audioManager.playGameSound('damage');
          if (gameState.lives <= 0) endGame(false);
          return;
        }

        if (bee.y > H + 20) bee.active = false;
      });

      // Power-ups
      powerUpPool.updateAll((p) => {
        const speed = gameState.slowMotion ? p.speed * 0.5 : p.speed;
        p.y += speed * dt;

        const poohLeft = gameState.poohX - gameState.poohWidth / 2;
        const poohRight = gameState.poohX + gameState.poohWidth / 2;
        const poohTop = gameState.poohY - gameState.poohHeight;

        if (p.y > poohTop && p.x > poohLeft && p.x < poohRight) {
          applyPowerUp(p.type);
          p.active = false;
          createPowerUpEffect(p.x, p.y, p.type);
          if (window.audioManager?.playGameSound) window.audioManager.playGameSound('powerup');
          return;
        }

        if (p.y > H + 20) p.active = false;
      });

      // Spawns (use logical W/H)
      if (honeyPotPool.active < 10 && Math.random() < 0.04) {
        const types = ['normal', 'normal', 'normal', 'golden']; // 25% golden
        const type = types[Math.floor(Math.random() * types.length)];
        honeyPotPool.get(Math.random() * (W - 40) + 20, -20, 2 + Math.random() * 1.5, type);
      }

      if (beePool.active < 6 && Math.random() < 0.02) {
        const type = (Math.random() < 0.25 ? 'angry' : 'normal');
        beePool.get(Math.random() * (W - 40) + 20, -20, 3 + Math.random() * 1.5, type);
      }

      if (powerUpPool.active < 3 && Math.random() < 0.01) {
        const keys = Object.keys(powerUpTypes);
        const type = keys[Math.floor(Math.random() * keys.length)];
        powerUpPool.get(Math.random() * (W - 40) + 20, -20, 2 + Math.random(), type);
      }

      catchParticles.update(delta);
    }

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    function render() {
      // Clear in logical space (IMPORTANT with DPR transform)
      ctx.clearRect(0, 0, W, H);

      drawBackground();
      drawEffects();
      drawPooh();
      drawHoneyPots();
      drawBees();
      drawPowerUps();
      catchParticles.render();
      drawUI();
    }

    // -----------------------------------------------------------------------
    // Loop
    // -----------------------------------------------------------------------
    let rafId = null;

    function loop(ts) {
      if (frameLimiter.shouldRender(ts)) {
        const delta = ts - gameState.lastFrameTime;
        gameState.lastFrameTime = ts;

        if (gameState.gameRunning) update(delta);
        render();
      }
      rafId = requestAnimationFrame(loop);
    }

    // -----------------------------------------------------------------------
    // Start/End/Pause
    // -----------------------------------------------------------------------
    function startGame() {
      if (gameState.gameRunning || gameState.countdownInterval) return;

      // Reset
      gameState.score = 0;
      gameState.lives = 3;
      gameState.timeLeft = 60;
      gameState.combos = 0;
      gameState.multiplier = 1;
      gameState.streak = 0;
      gameState.effects = [];

      honeyPotPool.reset();
      beePool.reset();
      powerUpPool.reset();
      catchParticles.clear();

      gameState.poohX = W / 2;
      gameState.poohY = H - 80;

      syncStats();

      let count = 3;
      setOverlay('Starting in 3...', 'Get Pooh ready to move.', true);

      gameState.countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
          setOverlay(`Starting in ${count}...`, 'Catch honey, dodge bees.', true);
          window.audioManager?.playTone?.([440, 440, 440], 0.1);
        } else {
          clearInterval(gameState.countdownInterval);
          gameState.countdownInterval = null;

          setOverlay('Go!', 'Keep Pooh under the falling honey.', false, 900);
          gameState.gameRunning = true;

          clearInterval(gameState.timerInterval);
          gameState.timerInterval = setInterval(() => {
            gameState.timeLeft--;
            syncStats();

            if (gameState.timeLeft <= 0) endGame(true);

            if (gameState.timeLeft % 15 === 0 && gameState.timeLeft < 60) {
              setOverlay('Getting faster!', 'Stay focused!', false, 1200);
            }
          }, 1000);

          window.audioManager?.playTone?.([523, 659, 784], 0.2);
        }
      }, 800);
    }

    function endGame(timeExpired) {
      if (!gameState.gameRunning) return;

      gameState.gameRunning = false;
      clearInterval(gameState.timerInterval);
      gameState.timerInterval = null;

      let finalScore = gameState.score;
      let bonus = 0;
      if (gameState.lives === 3) bonus += 100;
      if (gameState.combos > 10) bonus += 50;
      if (gameState.streak > 15) bonus += 75;
      finalScore += bonus;

      setOverlay(
        timeExpired ? "Time's up!" : 'Ouch! The bees won this round.',
        `Final Score: ${finalScore}${bonus > 0 ? ` (+${bonus} bonus)` : ''}`,
        true
      );

      shakeElement(catchCard);

      if (window.audioManager?.playGameSound) {
        window.audioManager.playGameSound(timeExpired ? 'victory' : 'defeat');
      }

      // Optional: show a game-over overlay div if your CSS supports it
      showGameOverScreen(finalScore, bonus);
    }

    function togglePause() {
      // Resume
      if (!gameState.gameRunning && gameState.timeLeft > 0 && gameState.lives > 0) {
        gameState.gameRunning = true;
        if (!gameState.timerInterval) {
          gameState.timerInterval = setInterval(() => {
            gameState.timeLeft--;
            syncStats();
            if (gameState.timeLeft <= 0) endGame(true);
          }, 1000);
        }
        catchOverlay?.classList.remove('active');
        if (pauseBtn) pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        window.audioManager?.playSound?.('click');
        return;
      }

      // Pause
      if (gameState.gameRunning) {
        gameState.gameRunning = false;
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
        setOverlay('Paused', 'Tap Start or Pause to continue.', true);
        if (pauseBtn) pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        window.audioManager?.playSound?.('click');
      }
    }

    function showGameOverScreen(finalScore, bonus) {
      const parent = canvas.parentElement;
      if (!parent) return;

      const existing = parent.querySelector('.catch-game-over');
      if (existing) existing.remove();

      const screen = document.createElement('div');
      screen.className = 'catch-game-over';
      screen.style.opacity = '0';
      screen.style.transform = 'translateY(10px)';

      screen.innerHTML = `
        <div class="catch-game-over-content">
          <div class="catch-game-over-title">Game Over</div>
          <div class="catch-game-over-stats">
            <div class="catch-stat">
              <div class="catch-stat-label">Final Score</div>
              <div class="catch-stat-value">${finalScore}</div>
            </div>
            <div class="catch-stat">
              <div class="catch-stat-label">Highest Combo</div>
              <div class="catch-stat-value">${gameState.combos}</div>
            </div>
            <div class="catch-stat">
              <div class="catch-stat-label">Longest Streak</div>
              <div class="catch-stat-value">${gameState.streak}</div>
            </div>
            ${bonus > 0 ? `
              <div class="catch-stat bonus">
                <div class="catch-stat-label">Bonus</div>
                <div class="catch-stat-value">+${bonus}</div>
              </div>
            ` : ''}
          </div>
          <div class="catch-game-over-actions">
            <button class="catch-game-over-btn restart" type="button" data-restart>
              <i class="fas fa-redo"></i> Play Again
            </button>
            <button class="catch-game-over-btn menu" type="button" data-menu>
              <i class="fas fa-home"></i> Main Menu
            </button>
          </div>
        </div>
      `;

      parent.appendChild(screen);

      const reveal = () => {
        screen.style.opacity = '1';
        screen.style.transform = 'translateY(0)';
      };
      setTimeout(reveal, 20);

      screen.querySelector('[data-restart]')?.addEventListener('click', () => {
        screen.remove();
        startGame();
      });

      screen.querySelector('[data-menu]')?.addEventListener('click', () => {
        screen.remove();
        returnToMenu();
      });
    }

    function returnToMenu() {
      gameState.gameRunning = false;
      clearInterval(gameState.timerInterval);
      clearInterval(gameState.countdownInterval);
      gameState.timerInterval = null;
      gameState.countdownInterval = null;

      gameState.score = 0;
      gameState.lives = 3;
      gameState.timeLeft = 60;
      gameState.combos = 0;
      gameState.multiplier = 1;
      gameState.streak = 0;
      gameState.effects = [];

      honeyPotPool.reset();
      beePool.reset();
      powerUpPool.reset();
      catchParticles.clear();

      gameState.poohX = W / 2;
      gameState.poohY = H - 80;

      syncStats();
      setOverlay('Ready when you are.', 'Press Start to begin a calm 60 second run.', true);

      if (pauseBtn) pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }

    // -----------------------------------------------------------------------
    // Controls
    // -----------------------------------------------------------------------
    function setPoohX(x) {
      gameState.poohX = clamp(x, gameState.poohWidth / 2, W - gameState.poohWidth / 2);
    }

    document.addEventListener('keydown', (ev) => {
      if (!gameState.gameRunning) return;
      const step = 25;
      if (ev.key === 'ArrowLeft') setPoohX(gameState.poohX - step);
      if (ev.key === 'ArrowRight') setPoohX(gameState.poohX + step);
      if (ev.key === ' ') {
        // dash sparkles
        for (let i = 0; i < 10; i++) {
          catchParticles.createParticle(gameState.poohX, gameState.poohY, 'sparkle', {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 8 - 4
          });
        }
      }
    });

    canvas.addEventListener('mousemove', (ev) => {
      if (!gameState.gameRunning) return;
      const rect = canvas.getBoundingClientRect();
      setPoohX(ev.clientX - rect.left);
    });

    canvas.addEventListener('touchstart', (ev) => {
      if (!gameState.gameRunning) return;
      ev.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const t = ev.touches[0];
      setPoohX(t.clientX - rect.left);
    }, { passive: false });

    canvas.addEventListener('touchmove', (ev) => {
      if (!gameState.gameRunning) return;
      ev.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const t = ev.touches[0];
      setPoohX(t.clientX - rect.left);
    }, { passive: false });

    // Virtual joystick: use existing #catchJoystick if present, else create
    function setupJoystick() {
      let joystick = document.getElementById('catchJoystick');

      if (!joystick) {
        joystick = document.createElement('div');
        joystick.id = 'catchJoystick';
        joystick.className = 'virtual-joystick';
        joystick.innerHTML = `<div class="joystick-base"></div><div class="joystick-handle"></div>`;
        canvas.parentElement?.appendChild(joystick);
      }

      const handle = joystick.querySelector('.joystick-handle');
      const base = joystick.querySelector('.joystick-base');

      let dragging = false;

      function onStart(e) {
        if (!gameState.gameRunning) return;
        dragging = true;
        joystick.classList.add('active');
        e.preventDefault();
      }

      function onMove(e) {
        if (!dragging || !gameState.gameRunning) return;
        e.preventDefault();

        const rect = joystick.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const t = e.touches ? e.touches[0] : e;
        const dx = t.clientX - cx;
        const dy = t.clientY - cy;

        const dist = Math.hypot(dx, dy);
        const max = 40;
        const ratio = dist > 0 ? Math.min(1, dist / max) : 0;
        const angle = Math.atan2(dy, dx);

        const mx = Math.cos(angle) * max * ratio;
        const my = Math.sin(angle) * max * ratio;

        if (handle) {
          handle.style.transform = `translate(${mx}px, ${my}px)`;
        }

        const speed = 15;
        setPoohX(gameState.poohX + (mx / max) * speed);
      }

      function onEnd() {
        dragging = false;
        joystick.classList.remove('active');
        if (handle) handle.style.transform = '';
      }

      joystick.addEventListener('touchstart', onStart, { passive: false });
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
      document.addEventListener('touchcancel', onEnd);

      // Hide joystick on non-mobile
      joystick.style.display = IS_MOBILE ? '' : 'none';
      if (base) base.setAttribute('aria-hidden', 'true');
      if (handle) handle.setAttribute('aria-hidden', 'true');
    }

    // Buttons
    startBtn?.addEventListener('click', () => {
      // remove any game over screen
      canvas.parentElement?.querySelector('.catch-game-over')?.remove();
      startGame();
    });

    pauseBtn?.addEventListener('click', () => togglePause());

    // Cleanup
    window.addEventListener('beforeunload', () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (gameState.timerInterval) clearInterval(gameState.timerInterval);
      if (gameState.countdownInterval) clearInterval(gameState.countdownInterval);
    });

    // -----------------------------------------------------------------------
    // Boot
    // -----------------------------------------------------------------------
    resizeCanvas(); // sets W/H + builds background cache
    gameState.poohX = W / 2;
    gameState.poohY = H - 80;

    syncStats();
    setOverlay('Ready when you are.', 'Press Start to begin a calm 60 second run.', true);

    if (IS_MOBILE) setupJoystick();

    rafId = requestAnimationFrame(loop);

    console.log('Honey Pot Catch initialized');
  }

  // ---------------------------------------------------------------------------
  // Bootstrap only the Honey Catch game. No site UI here.
  // ---------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    try {
      initEnhancedHoneyCatchGame();
    } catch (err) {
      console.error('Honey Catch game failed to initialize:', err);
    }
  });

})();