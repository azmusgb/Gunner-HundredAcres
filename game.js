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
  console.log("Initializing enhanced Honey Catch Game...");

  const canvas = document.getElementById("honey-game");
  if (!canvas) {
    console.error("Honey catch game canvas not found!");
    return;
  }

  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  const IS_MOBILE = isMobileDevice();
  const frameLimiter = new FrameRateLimiter(window.GAME_FPS_TARGET);

  // UI elements (IDs required by your HTML)
  const scoreSpan = document.getElementById("score-count");
  const timeSpan = document.getElementById("time-count");
  const livesSpan = document.getElementById("catch-lives");
  const startBtn = document.getElementById("start-catch");
  const pauseBtn = document.getElementById("pause-catch");
  const catchOverlay = document.getElementById("catch-overlay");
  const catchCountdown = document.getElementById("catch-countdown");
  const catchHint = document.getElementById("catch-hint");
  const catchCard = document.getElementById("catch-card");
  const multiplierDisplay = document.getElementById("catch-multiplier");
  const comboDisplay = document.getElementById("catch-combo");

  // Use your existing joystick in HTML (do NOT create a second one)
  const joystickEl = document.getElementById("catchJoystick");

  // Performance / rendering hints
  canvas.style.imageRendering = IS_MOBILE ? "pixelated" : "auto";
  ctx.imageSmoothingEnabled = !IS_MOBILE;

  // ---------------------------------------------------------------------------
  // ✅ DPR-safe canvas sizing (fixes “blank/soft canvas” on iOS)
  // We run the game in CSS pixels (cw/ch) and scale via setTransform(dpr,...)
  // ---------------------------------------------------------------------------
  let dpr = 1;
  let cw = 0; // CSS px width
  let ch = 0; // CSS px height

  // Offscreen background (rendered once per resize)
  let bgCanvas = null;
  let bgCtx = null;

  function ensureCanvasCSSHeight() {
    // If CSS doesn’t force a height, iOS may collapse it.
    // Prefer controlling via CSS; this is just a last-resort guard.
    const rect = canvas.getBoundingClientRect();
    if (rect.height < 120) {
      canvas.style.height = "360px";
    }
  }

  function resizeCanvas() {
    ensureCanvasCSSHeight();

    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;

    cw = Math.max(1, Math.floor(rect.width));
    ch = Math.max(1, Math.floor(rect.height));

    canvas.width = Math.floor(cw * dpr);
    canvas.height = Math.floor(ch * dpr);

    // 1 unit in canvas space == 1 CSS px
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // rebuild background buffer at device resolution but draw in CSS px coords
    bgCanvas = document.createElement("canvas");
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;
    bgCtx = bgCanvas.getContext("2d", { alpha: true });

    // Normalize bg context to CSS px as well
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawCatchBackgroundTo(bgCtx, cw, ch);

    // Keep Pooh near bottom on resize
    gameState.poohY = ch - 22;
    gameState.poohX = clamp(gameState.poohX || cw / 2, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);

    // Let particles know the canvas changed
    if (catchParticles && typeof catchParticles.clear === "function") {
      // keep it simple—clear prevents artifacts after orientation change
      catchParticles.clear();
    }
  }

  // Run once now and on resize
  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  // ---------------------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------------------
  const catchParticles = new EnhancedParticleSystem(canvas);

  const gameState = {
    score: 0,
    timeLeft: 60,
    lives: 3,
    gameRunning: false,

    timerInterval: null,
    countdownInterval: null,
    overlayTimeout: null,

    lastFrameTime: performance.now(),
    startedAt: 0,

    poohX: 0,
    poohY: 0,
    poohWidth: 60,
    poohHeight: 60,

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

  // Pools (simple, fast)
  const honeyPotPool = makePool();
  const beePool = makePool();
  const powerUpPool = makePool();

  // Power-ups
  const powerUpTypes = {
    heart: { color: "#FF6B6B", icon: "❤️", effect: "addLife", duration: 0 },
    shield: { color: "#4285F4", icon: "🛡️", effect: "invincibility", duration: 5000 },
    clock: { color: "#4CAF50", icon: "⏱️", effect: "addTime", duration: 0 },
    star: { color: "#FFD700", icon: "⭐", effect: "doublePoints", duration: 8000 },
    lightning: { color: "#9C27B0", icon: "⚡", effect: "slowMotion", duration: 6000 }
  };

  // Sprite cache (uses Sprites.* if available, otherwise draws fallbacks)
  const spriteCache = {
    pooh: null,
    honey: Object.create(null),
    bee: null,
    powerUp: Object.create(null),

    getPooh() {
      if (this.pooh) return this.pooh;
      const c = document.createElement("canvas");
      c.width = 80; c.height = 80;
      const cctx = c.getContext("2d");

      const sprite = window.Sprites?.pooh;
      if (sprite && sprite.complete && sprite.naturalWidth > 0) {
        cctx.save();
        cctx.shadowColor = "rgba(0,0,0,0.35)";
        cctx.shadowBlur = 10;
        cctx.drawImage(sprite, 10, 10, 60, 60);
        cctx.restore();
      } else {
        drawEnhancedPoohFallback(cctx);
      }

      this.pooh = c;
      return c;
    },

    getHoney(type = "normal") {
      if (this.honey[type]) return this.honey[type];
      const c = document.createElement("canvas");
      c.width = 32; c.height = 32;
      const cctx = c.getContext("2d");

      const sprite = window.Sprites?.honey;
      if (sprite && sprite.complete && sprite.naturalWidth > 0) {
        cctx.drawImage(sprite, 0, 0, 32, 32);
      } else {
        drawEnhancedHoneyPotFallback(cctx, type);
      }

      this.honey[type] = c;
      return c;
    },

    getBee() {
      if (this.bee) return this.bee;
      const c = document.createElement("canvas");
      c.width = 30; c.height = 30;
      const cctx = c.getContext("2d");
      drawEnhancedBee(cctx);
      this.bee = c;
      return c;
    },

    getPowerUp(type) {
      if (this.powerUp[type]) return this.powerUp[type];
      const c = document.createElement("canvas");
      c.width = 30; c.height = 30;
      const cctx = c.getContext("2d");
      drawPowerUp(cctx, type, powerUpTypes);
      this.powerUp[type] = c;
      return c;
    }
  };

  // Initial size (must happen before we use cw/ch)
  resizeCanvas();

  // ---------------------------------------------------------------------------
  // UI helpers
  // ---------------------------------------------------------------------------
  function setEnhancedCatchOverlay(line, sub, persistent = false, duration = 1600) {
    if (!catchOverlay || !catchCountdown || !catchHint) return;
    catchCountdown.textContent = line;
    catchHint.textContent = sub || "";
    catchOverlay.classList.add("active");

    if (gameState.overlayTimeout) clearTimeout(gameState.overlayTimeout);
    if (!persistent) {
      gameState.overlayTimeout = setTimeout(() => {
        catchOverlay.classList.remove("active");
      }, duration);
    }
  }

  function syncEnhancedCatchStats() {
    if (scoreSpan) scoreSpan.textContent = String(gameState.score);
    if (timeSpan) timeSpan.textContent = String(gameState.timeLeft);
    if (livesSpan) livesSpan.textContent = String(gameState.lives);

    if (multiplierDisplay) {
      multiplierDisplay.textContent = String(Math.round(gameState.multiplier * 10) / 10);
    }
    if (comboDisplay) {
      comboDisplay.textContent = String(gameState.combos);
    }
  }

  syncEnhancedCatchStats();
  setEnhancedCatchOverlay("Ready when you are.", "Press start to begin a calm 60 second run.", true);

  // ---------------------------------------------------------------------------
  // Game loop
  // ---------------------------------------------------------------------------
  let rafId = null;

  function gameLoop(ts) {
    if (frameLimiter.shouldRender(ts)) {
      const delta = Math.min(100, ts - gameState.lastFrameTime);
      gameState.lastFrameTime = ts;

      if (gameState.gameRunning) updateEnhancedCatchGame(delta);
      renderEnhancedCatchGame();
    }
    rafId = requestAnimationFrame(gameLoop);
  }

  rafId = requestAnimationFrame(gameLoop);

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------
  function updateEnhancedCatchGame(delta) {
    const now = Date.now();
    const deltaTime = delta / 16.6667;

    // timers
    if (gameState.isInvincible && now > gameState.invincibilityEnd) gameState.isInvincible = false;
    if (gameState.doublePoints && now > gameState.doublePointsEnd) gameState.doublePoints = false;
    if (gameState.slowMotion && now > gameState.slowMotionEnd) gameState.slowMotion = false;

    // combo decay
    if (gameState.combos > 0 && now - gameState.lastCatchTime > 2000) {
      gameState.combos = 0;
      gameState.multiplier = 1;
      gameState.streak = 0;
    }

    // effects expire
    for (let i = gameState.effects.length - 1; i >= 0; i--) {
      if (now - gameState.effects[i].start > gameState.effects[i].duration) {
        gameState.effects.splice(i, 1);
      }
    }

    // difficulty scaling (gentle)
    const elapsed = (now - gameState.startedAt) / 1000;
    const potSpawn = 0.035 + Math.min(0.02, elapsed * 0.0006);
    const beeSpawn = 0.016 + Math.min(0.016, elapsed * 0.00045);
    const powerSpawn = 0.009;

    // honey pots
    honeyPotPool.update((pot) => {
      const speed = gameState.slowMotion ? pot.speed * 0.5 : pot.speed;
      pot.y += speed * deltaTime;

      // collision
      if (
        pot.y > gameState.poohY - gameState.poohHeight &&
        pot.x > gameState.poohX - gameState.poohWidth / 2 &&
        pot.x < gameState.poohX + gameState.poohWidth / 2
      ) {
        let points = pot.type === "golden" ? 50 : 10;
        if (gameState.doublePoints) points *= 2;
        points = Math.round(points * gameState.multiplier);

        gameState.score += points;

        if (now - gameState.lastCatchTime < 2000) {
          gameState.combos++;
          gameState.streak++;
          gameState.multiplier = Math.min(5, 1 + gameState.combos * 0.12);
        } else {
          gameState.combos = 1;
          gameState.streak = 1;
          gameState.multiplier = 1.1;
        }
        gameState.lastCatchTime = now;

        pot.active = false;
        createCatchEffect(pot.x, pot.y, points);

        if (window.audioManager) {
          window.audioManager.playGameSound?.("collect");
          if (gameState.combos > 3) window.audioManager.playTone?.([523, 659, 784], 0.12);
        }

        syncEnhancedCatchStats();
        return;
      }

      // miss
      if (pot.y > ch + 30) {
        pot.active = false;
        if (gameState.streak > 0) {
          gameState.streak = 0;
          createMissEffect(pot.x, ch - 40);
        }
      }
    });

    // bees
    beePool.update((bee) => {
      const speed = gameState.slowMotion ? bee.speed * 0.5 : bee.speed;
      bee.y += speed * deltaTime;

      // chase for angry bees
      if (bee.type === "angry") {
        const dx = gameState.poohX - bee.x;
        const dy = (gameState.poohY - gameState.poohHeight / 2) - bee.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const chase = 0.06 * deltaTime;
        bee.x += (dx / dist) * chase * 60;
        bee.y += (dy / dist) * chase * 60;
      }

      // collision
      if (
        !gameState.isInvincible &&
        bee.y > gameState.poohY - gameState.poohHeight &&
        bee.x > gameState.poohX - gameState.poohWidth / 2 &&
        bee.x < gameState.poohX + gameState.poohWidth / 2
      ) {
        gameState.lives -= bee.type === "angry" ? 2 : 1;
        bee.active = false;

        createDamageEffect(bee.x, bee.y);

        gameState.combos = 0;
        gameState.multiplier = 1;
        gameState.streak = 0;

        syncEnhancedCatchStats();
        setEnhancedCatchOverlay("Ouch! A bee buzzed Pooh.", `Hearts remaining: ${gameState.lives}.`, false, 1400);
        shakeElement(catchCard);

        if (window.audioManager) window.audioManager.playGameSound?.("damage");
        if (gameState.lives <= 0) endEnhancedGame(false);
        return;
      }

      if (bee.y > ch + 30) bee.active = false;
    });

    // power-ups
    powerUpPool.update((p) => {
      const speed = gameState.slowMotion ? p.speed * 0.5 : p.speed;
      p.y += speed * deltaTime;

      if (
        p.y > gameState.poohY - gameState.poohHeight &&
        p.x > gameState.poohX - gameState.poohWidth / 2 &&
        p.x < gameState.poohX + gameState.poohWidth / 2
      ) {
        applyPowerUp(p.type);
        p.active = false;
        createPowerUpEffect(p.x, p.y, p.type);
        if (window.audioManager) window.audioManager.playGameSound?.("powerup");
      }

      if (p.y > ch + 30) p.active = false;
    });

    // spawns (cap actives)
    if (honeyPotPool.activeCount() < 12 && Math.random() < potSpawn) {
      const type = Math.random() < 0.22 ? "golden" : "normal";
      honeyPotPool.get({
        x: rand(20, cw - 20),
        y: -20,
        speed: rand(2.2, 3.8),
        type,
        active: true
      });
    }

    if (beePool.activeCount() < 7 && Math.random() < beeSpawn) {
      const angryChance = Math.min(0.22, elapsed * 0.006);
      const type = Math.random() < angryChance ? "angry" : "normal";
      beePool.get({
        x: rand(20, cw - 20),
        y: -20,
        speed: rand(3.0, 4.6),
        type,
        active: true,
        vx: 0,
        vy: 0
      });
    }

    if (powerUpPool.activeCount() < 3 && Math.random() < powerSpawn) {
      const keys = Object.keys(powerUpTypes);
      const type = keys[(Math.random() * keys.length) | 0];
      powerUpPool.get({
        x: rand(20, cw - 20),
        y: -20,
        speed: rand(2.1, 3.0),
        type,
        active: true
      });
    }

    // particles
    catchParticles.update(delta);
  }

  // ---------------------------------------------------------------------------
  // Render (all in CSS px coordinates)
  // ---------------------------------------------------------------------------
  function renderEnhancedCatchGame() {
    ctx.clearRect(0, 0, cw, ch);

    // background
    if (bgCanvas) {
      // bg canvas is DPR-sized; ctx is scaled to CSS px; drawImage fits CSS px
      ctx.drawImage(bgCanvas, 0, 0, cw, ch);
    }

    drawEnhancedEffects();
    drawEnhancedPooh();
    drawEnhancedHoneyPots();
    drawEnhancedBees();
    drawEnhancedPowerUps();
    catchParticles.render();
    drawEnhancedCatchUI();
  }

  function drawEnhancedPooh() {
    const sprite = spriteCache.getPooh();
    const yTop = gameState.poohY - gameState.poohHeight;

    ctx.save();

    if (gameState.isInvincible) {
      const blink = Math.sin(Date.now() / 100) > 0;
      if (blink) ctx.globalAlpha = 0.55;
    }

    // shadow
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    ctx.globalAlpha = 0.25;
    ctx.drawImage(sprite, gameState.poohX - gameState.poohWidth / 2, yTop + 5, gameState.poohWidth, gameState.poohHeight);
    ctx.restore();

    // main
    ctx.globalAlpha = 1;
    ctx.drawImage(sprite, gameState.poohX - gameState.poohWidth / 2, yTop, gameState.poohWidth, gameState.poohHeight);

    // shield ring
    if (gameState.isInvincible) {
      ctx.strokeStyle = `rgba(66,133,244,${0.45 + Math.sin(Date.now() / 200) * 0.25})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(gameState.poohX, yTop + gameState.poohHeight / 2, gameState.poohWidth / 2 + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawEnhancedHoneyPots() {
    honeyPotPool.update((pot) => {
      if (!pot.active) return;
      const sprite = spriteCache.getHoney(pot.type);
      ctx.drawImage(sprite, pot.x - 16, pot.y - 16);

      if (pot.type === "golden") {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.drawImage(sprite, pot.x - 16, pot.y - 13);
        ctx.restore();
      }
    });
  }

  function drawEnhancedBees() {
    const sprite = spriteCache.getBee();
    beePool.update((bee) => {
      if (!bee.active) return;

      ctx.save();
      const wobble = Math.sin(Date.now() / 110 + bee.x) * 3;
      ctx.translate(bee.x, bee.y + wobble);
      ctx.drawImage(sprite, -15, -15);
      ctx.restore();

      if (bee.type === "angry") {
        ctx.save();
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("💢", bee.x, bee.y - 20);
        ctx.restore();
      }
    });
  }

  function drawEnhancedPowerUps() {
    powerUpPool.update((p) => {
      if (!p.active) return;

      const sprite = spriteCache.getPowerUp(p.type);
      const float = Math.sin(Date.now() / 500 + p.x) * 5;

      ctx.save();
      ctx.drawImage(sprite, p.x - 15, p.y - 15 + float);
      ctx.shadowColor = powerUpTypes[p.type].color;
      ctx.shadowBlur = 15;
      ctx.drawImage(sprite, p.x - 15, p.y - 15 + float);
      ctx.restore();
    });
  }

  function drawEnhancedEffects() {
    const now = Date.now();
    for (const effect of gameState.effects) {
      const p = (now - effect.start) / effect.duration;

      if (effect.type === "catch") {
        const radius = 20 * (1 - p);
        const g = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, radius);
        g.addColorStop(0, "rgba(255,215,0,0.75)");
        g.addColorStop(1, "rgba(255,215,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (effect.type === "damage") {
        const radius = 16 * (1 - p);
        const g = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, radius);
        g.addColorStop(0, "rgba(255,107,107,0.75)");
        g.addColorStop(1, "rgba(255,107,107,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (effect.type === "score") {
        const y = effect.y - p * 28;
        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.font = "bold 20px Arial";
        ctx.fillStyle = effect.color || "#FFD700";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(effect.text, effect.x, y);
        ctx.restore();
      }
    }
  }

  function drawEnhancedCatchUI() {
    // Optional—keep this light since your HUD is in DOM already
    // (You can remove entirely if you don’t want any canvas UI)
  }

  // ---------------------------------------------------------------------------
  // Effects + power-ups
  // ---------------------------------------------------------------------------
  function createCatchEffect(x, y, points) {
    gameState.effects.push({ type: "catch", x, y, start: Date.now(), duration: 500 });
    gameState.effects.push({ type: "score", x, y: y - 18, text: `+${points}`, start: Date.now(), duration: 900, color: "#FFD700" });

    for (let i = 0; i < 8; i++) {
      catchParticles.createParticle(x, y, "honey", {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4 - 2
      });
    }
  }

  function createDamageEffect(x, y) {
    gameState.effects.push({ type: "damage", x, y, start: Date.now(), duration: 500 });

    for (let i = 0; i < 7; i++) {
      catchParticles.createParticle(x, y, "fire", {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4
      });
    }
  }

  function createMissEffect(x, y) {
    gameState.effects.push({ type: "score", x, y, text: "Miss!", start: Date.now(), duration: 700, color: "#FFFFFF" });
  }

  function createPowerUpEffect(x, y, type) {
    const p = powerUpTypes[type];
    if (!p) return;

    for (let i = 0; i < 12; i++) {
      catchParticles.createParticle(x, y, "sparkle", {
        x: (Math.random() - 0.5) * 6,
        y: (Math.random() - 0.5) * 6 - 2
      });
    }

    gameState.effects.push({
      type: "score",
      x,
      y: y - 28,
      text: `${p.icon} ${type}`,
      start: Date.now(),
      duration: 950,
      color: p.color
    });
  }

  function applyPowerUp(type) {
    const now = Date.now();
    switch (type) {
      case "heart":
        gameState.lives = Math.min(5, gameState.lives + 1);
        syncEnhancedCatchStats();
        break;
      case "shield":
        gameState.isInvincible = true;
        gameState.invincibilityEnd = now + powerUpTypes.shield.duration;
        break;
      case "clock":
        gameState.timeLeft += 10;
        syncEnhancedCatchStats();
        break;
      case "star":
        gameState.doublePoints = true;
        gameState.doublePointsEnd = now + powerUpTypes.star.duration;
        break;
      case "lightning":
        gameState.slowMotion = true;
        gameState.slowMotionEnd = now + powerUpTypes.lightning.duration;
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------
  function startEnhancedGame() {
    if (gameState.gameRunning || gameState.countdownInterval) return;

    // reset
    gameState.score = 0;
    gameState.lives = 3;
    gameState.timeLeft = 60;
    gameState.combos = 0;
    gameState.multiplier = 1;
    gameState.streak = 0;
    gameState.lastCatchTime = 0;
    gameState.effects = [];
    gameState.isInvincible = false;
    gameState.doublePoints = false;
    gameState.slowMotion = false;

    honeyPotPool.reset();
    beePool.reset();
    powerUpPool.reset();
    catchParticles.clear();

    resizeCanvas();

    syncEnhancedCatchStats();

    // countdown
    let count = 3;
    setEnhancedCatchOverlay("Starting in 3...", "Get Pooh ready to move.", true);

    gameState.countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setEnhancedCatchOverlay(`Starting in ${count}...`, "Catch honey, dodge bees.", true);
        window.audioManager?.playTone?.([440, 440, 440], 0.08);
      } else {
        clearInterval(gameState.countdownInterval);
        gameState.countdownInterval = null;

        setEnhancedCatchOverlay("Go!", "Keep Pooh under the falling honey.", false, 900);
        gameState.gameRunning = true;
        gameState.startedAt = Date.now();

        clearInterval(gameState.timerInterval);
        gameState.timerInterval = setInterval(() => {
          gameState.timeLeft--;
          syncEnhancedCatchStats();
          if (gameState.timeLeft <= 0) endEnhancedGame(true);
        }, 1000);

        window.audioManager?.playTone?.([523, 659, 784], 0.14);
      }
    }, 800);
  }

  function endEnhancedGame(timeExpired) {
    if (!gameState.gameRunning) return;

    gameState.gameRunning = false;
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;

    // bonus
    let finalScore = gameState.score;
    let bonus = 0;
    if (gameState.lives === 3) bonus += 100;
    if (gameState.combos > 10) bonus += 50;
    if (gameState.streak > 15) bonus += 75;
    finalScore += bonus;

    setEnhancedCatchOverlay(
      timeExpired ? "Time's up!" : "Ouch! The bees won this round.",
      `Final Score: ${finalScore}${bonus ? ` (+${bonus} bonus)` : ""}`,
      true
    );

    shakeElement(catchCard);

    if (window.audioManager) {
      window.audioManager.playGameSound?.(timeExpired ? "victory" : "defeat");
    }
  }

  function toggleEnhancedPause() {
    if (!gameState.gameRunning && gameState.timeLeft > 0 && gameState.lives > 0) {
      // resume
      gameState.gameRunning = true;
      if (!gameState.timerInterval) {
        gameState.timerInterval = setInterval(() => {
          gameState.timeLeft--;
          syncEnhancedCatchStats();
          if (gameState.timeLeft <= 0) endEnhancedGame(true);
        }, 1000);
      }
      catchOverlay?.classList.remove("active");
      pauseBtn?.setAttribute("aria-pressed", "false");
    } else if (gameState.gameRunning) {
      // pause
      gameState.gameRunning = false;
      clearInterval(gameState.timerInterval);
      gameState.timerInterval = null;
      setEnhancedCatchOverlay("Paused", "Tap start or pause to continue when ready.", true);
      pauseBtn?.setAttribute("aria-pressed", "true");
    }
    window.audioManager?.playSound?.("click");
  }

  // Keyboard
  document.addEventListener("keydown", (ev) => {
    if (!gameState.gameRunning) return;
    const step = 26;

    if (ev.key === "ArrowLeft") {
      gameState.poohX = clamp(gameState.poohX - step, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
    } else if (ev.key === "ArrowRight") {
      gameState.poohX = clamp(gameState.poohX + step, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
    }
  });

  // Mouse / touch direct control on canvas
  canvas.addEventListener("mousemove", (ev) => {
    if (!gameState.gameRunning) return;
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    gameState.poohX = clamp(x, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
  });

  canvas.addEventListener("touchstart", (ev) => {
    if (!gameState.gameRunning) return;
    ev.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = ev.touches[0];
    const x = t.clientX - rect.left;
    gameState.poohX = clamp(x, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
  }, { passive: false });

  canvas.addEventListener("touchmove", (ev) => {
    if (!gameState.gameRunning) return;
    ev.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = ev.touches[0];
    const x = t.clientX - rect.left;
    gameState.poohX = clamp(x, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
  }, { passive: false });

  // Joystick (uses your existing #catchJoystick DOM)
  if (IS_MOBILE && joystickEl) {
    let dragging = false;

    joystickEl.addEventListener("touchstart", (ev) => {
      ev.preventDefault();
      dragging = true;
      joystickEl.classList.add("active");
    }, { passive: false });

    document.addEventListener("touchmove", (ev) => {
      if (!dragging || !gameState.gameRunning) return;
      ev.preventDefault();

      const rect = joystickEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const t = ev.touches[0];

      const dx = t.clientX - cx;
      const dy = t.clientY - cy;

      const dist = Math.hypot(dx, dy);
      const maxDist = 40;

      const nx = dist > 0 ? dx / Math.max(dist, 1) : 0;
      const power = Math.min(1, dist / maxDist);

      const speed = 18; // tune
      gameState.poohX = clamp(
        gameState.poohX + nx * power * speed,
        gameState.poohWidth / 2,
        cw - gameState.poohWidth / 2
      );
    }, { passive: false });

    document.addEventListener("touchend", () => {
      dragging = false;
      joystickEl.classList.remove("active");
    });
  }

  // Buttons
  startBtn?.addEventListener("click", startEnhancedGame);
  pauseBtn?.addEventListener("click", toggleEnhancedPause);

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------
  window.addEventListener("beforeunload", () => {
    if (rafId) cancelAnimationFrame(rafId);
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    if (gameState.countdownInterval) clearInterval(gameState.countdownInterval);
  });

  console.log("Enhanced Honey Catch Game initialized");

  // ---------------------------------------------------------------------------
  // Small helpers (kept inside to stay “isolated”)
  // ---------------------------------------------------------------------------
  function makePool() {
    return {
      pool: [],
      active: 0,
      get(obj) {
        let item;
        if (this.active < this.pool.length) {
          item = this.pool[this.active];
          Object.assign(item, obj);
        } else {
          item = obj;
          this.pool.push(item);
        }
        this.active++;
        return item;
      },
      update(fn) {
        for (let i = 0; i < this.active; i++) {
          const it = this.pool[i];
          if (it.active) fn(it, i);
        }
        // compact from end (cheap)
        let write = 0;
        for (let i = 0; i < this.active; i++) {
          const it = this.pool[i];
          if (it.active) {
            if (write !== i) this.pool[write] = it;
            write++;
          }
        }
        this.active = write;
      },
      reset() {
        for (let i = 0; i < this.pool.length; i++) this.pool[i].active = false;
        this.active = 0;
      },
      activeCount() {
        return this.active;
      }
    };
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  // Background painter (one-time into bgCtx)
  function drawCatchBackgroundTo(g, w, h) {
    // sky
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#87CEEB");
    sky.addColorStop(0.6, "#B3E5FC");
    sky.addColorStop(1, "#E3F2FD");
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);

    // sun
    g.save();
    g.shadowColor = "#FFD700";
    g.shadowBlur = 50;
    g.fillStyle = "#FFEB3B";
    g.beginPath();
    g.arc(80, 80, 35, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // clouds (simple)
    g.save();
    g.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 3; i++) {
      const x = 60 + i * (w * 0.32);
      const y = 60 + Math.sin(i) * 18;
      g.beginPath();
      g.arc(x, y, 18, 0, Math.PI * 2);
      g.arc(x + 24, y - 10, 24, 0, Math.PI * 2);
      g.arc(x + 48, y, 18, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();

    // ground
    const groundH = 70;
    const groundY = h - groundH;

    const grd = g.createLinearGradient(0, groundY, 0, h);
    grd.addColorStop(0, "#8BC34A");
    grd.addColorStop(1, "#689F38");
    g.fillStyle = grd;
    g.fillRect(0, groundY, w, groundH);

    // trees (scaled a bit)
    g.fillStyle = "#8B4513";
    g.fillRect(w * 0.18, h * 0.45, 28, h * 0.25);
    g.fillStyle = "#2E7D32";
    g.beginPath();
    g.arc(w * 0.18 + 14, h * 0.42, 55, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#A0522D";
    g.fillRect(w * 0.78, h * 0.50, 30, h * 0.22);
    g.fillStyle = "#388E3C";
    g.beginPath();
    g.arc(w * 0.78 + 15, h * 0.47, 50, 0, Math.PI * 2);
    g.fill();
  }

  // Fallback drawings
  function drawEnhancedPoohFallback(g) {
    const grad = g.createLinearGradient(0, 0, 0, 80);
    grad.addColorStop(0, "#FFC107");
    grad.addColorStop(1, "#FF9800");

    g.fillStyle = grad;
    g.beginPath();
    g.arc(40, 40, 30, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#FFD8A6";
    g.beginPath();
    g.ellipse(40, 48, 18, 12, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#D62E2E";
    g.fillRect(20, 55, 40, 15);

    g.fillStyle = "#000";
    g.beginPath();
    g.arc(32, 32, 3, 0, Math.PI * 2);
    g.arc(48, 32, 3, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#8B4513";
    g.beginPath();
    g.arc(40, 40, 5, 0, Math.PI * 2);
    g.fill();

    g.strokeStyle = "#000";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(40, 46, 10, 0.2, Math.PI - 0.2);
    g.stroke();
  }

  function drawEnhancedHoneyPotFallback(g, type = "normal") {
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "#FFEB3B");
    grad.addColorStop(0.7, "#FFD54F");
    grad.addColorStop(1, "#FFB300");

    g.fillStyle = grad;
    g.beginPath();
    g.arc(16, 16, 16, 0, Math.PI * 2);
    g.fill();

    g.strokeStyle = "#8B4513";
    g.lineWidth = 3;
    g.stroke();

    g.fillStyle = "#8B4513";
    g.fillRect(8, 6, 16, 5);
    g.fillRect(12, 3, 8, 3);

    g.fillStyle = "#FF9800";
    g.beginPath();
    g.ellipse(16, 22, 7, 10, 0, 0, Math.PI * 2);
    g.fill();

    if (type === "golden") {
      g.strokeStyle = "#FFD700";
      g.lineWidth = 2;
      g.setLineDash([2, 2]);
      g.beginPath();
      g.arc(16, 16, 18, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
    }
  }

  function drawEnhancedBee(g) {
    const grad = g.createRadialGradient(15, 15, 0, 15, 15, 12);
    grad.addColorStop(0, "#FFEB3B");
    grad.addColorStop(1, "#FF9800");

    g.fillStyle = grad;
    g.beginPath();
    g.arc(15, 15, 12, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#000";
    g.fillRect(8, 10, 5, 8);
    g.fillRect(18, 10, 5, 8);

    g.beginPath();
    g.arc(12, 12, 2, 0, Math.PI * 2);
    g.arc(18, 12, 2, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "rgba(255,255,255,0.8)";
    g.beginPath();
    g.arc(8, 5, 8, 0, Math.PI * 2);
    g.arc(22, 5, 8, 0, Math.PI * 2);
    g.fill();
  }

  function drawPowerUp(g, type, types) {
    const p = types[type];
    if (!p) return;

    g.fillStyle = p.color + "33";
    g.beginPath();
    g.arc(15, 15, 15, 0, Math.PI * 2);
    g.fill();

    g.strokeStyle = p.color;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(15, 15, 14, 0, Math.PI * 2);
    g.stroke();

    g.font = "18px Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(p.icon, 15, 15);
  }
}
  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------
  function startEnhancedGame() {
    if (gameState.gameRunning || gameState.countdownInterval) return;

    // reset
    gameState.score = 0;
    gameState.lives = 3;
    gameState.timeLeft = 60;
    gameState.combos = 0;
    gameState.multiplier = 1;
    gameState.streak = 0;
    gameState.lastCatchTime = 0;
    gameState.effects = [];
    gameState.isInvincible = false;
    gameState.doublePoints = false;
    gameState.slowMotion = false;

    honeyPotPool.reset();
    beePool.reset();
    powerUpPool.reset();
    catchParticles.clear();

    resizeCanvas();

    syncEnhancedCatchStats();

    // countdown
    let count = 3;
    setEnhancedCatchOverlay("Starting in 3...", "Get Pooh ready to move.", true);

    gameState.countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setEnhancedCatchOverlay(`Starting in ${count}...`, "Catch honey, dodge bees.", true);
        window.audioManager?.playTone?.([440, 440, 440], 0.08);
      } else {
        clearInterval(gameState.countdownInterval);
        gameState.countdownInterval = null;

        setEnhancedCatchOverlay("Go!", "Keep Pooh under the falling honey.", false, 900);
        gameState.gameRunning = true;
        gameState.startedAt = Date.now();

        clearInterval(gameState.timerInterval);
        gameState.timerInterval = setInterval(() => {
          gameState.timeLeft--;
          syncEnhancedCatchStats();
          if (gameState.timeLeft <= 0) endEnhancedGame(true);
        }, 1000);

        window.audioManager?.playTone?.([523, 659, 784], 0.14);
      }
    }, 800);
  }

  function endEnhancedGame(timeExpired) {
    if (!gameState.gameRunning) return;

    gameState.gameRunning = false;
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;

    // bonus
    let finalScore = gameState.score;
    let bonus = 0;
    if (gameState.lives === 3) bonus += 100;
    if (gameState.combos > 10) bonus += 50;
    if (gameState.streak > 15) bonus += 75;
    finalScore += bonus;

    setEnhancedCatchOverlay(
      timeExpired ? "Time's up!" : "Ouch! The bees won this round.",
      `Final Score: ${finalScore}${bonus ? ` (+${bonus} bonus)` : ""}`,
      true
    );

    shakeElement(catchCard);

    if (window.audioManager) {
      window.audioManager.playGameSound?.(timeExpired ? "victory" : "defeat");
    }
  }

  function toggleEnhancedPause() {
    if (!gameState.gameRunning && gameState.timeLeft > 0 && gameState.lives > 0) {
      // resume
      gameState.gameRunning = true;
      if (!gameState.timerInterval) {
        gameState.timerInterval = setInterval(() => {
          gameState.timeLeft--;
          syncEnhancedCatchStats();
          if (gameState.timeLeft <= 0) endEnhancedGame(true);
        }, 1000);
      }
      catchOverlay?.classList.remove("active");
      pauseBtn?.setAttribute("aria-pressed", "false");
    } else if (gameState.gameRunning) {
      // pause
      gameState.gameRunning = false;
      clearInterval(gameState.timerInterval);
      gameState.timerInterval = null;
      setEnhancedCatchOverlay("Paused", "Tap start or pause to continue when ready.", true);
      pauseBtn?.setAttribute("aria-pressed", "true");
    }
    window.audioManager?.playSound?.("click");
  }

  // Keyboard
  document.addEventListener("keydown", (ev) => {
    if (!gameState.gameRunning) return;
    const step = 26;

    if (ev.key === "ArrowLeft") {
      gameState.poohX = clamp(gameState.poohX - step, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
    } else if (ev.key === "ArrowRight") {
      gameState.poohX = clamp(gameState.poohX + step, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
    }
  });

  // Mouse / touch direct control on canvas
  canvas.addEventListener("mousemove", (ev) => {
    if (!gameState.gameRunning) return;
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    gameState.poohX = clamp(x, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
  });

  canvas.addEventListener("touchstart", (ev) => {
    if (!gameState.gameRunning) return;
    ev.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = ev.touches[0];
    const x = t.clientX - rect.left;
    gameState.poohX = clamp(x, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
  }, { passive: false });

  canvas.addEventListener("touchmove", (ev) => {
    if (!gameState.gameRunning) return;
    ev.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = ev.touches[0];
    const x = t.clientX - rect.left;
    gameState.poohX = clamp(x, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
  }, { passive: false });

  // Joystick (uses your existing #catchJoystick DOM)
  if (IS_MOBILE && joystickEl) {
    let dragging = false;

    joystickEl.addEventListener("touchstart", (ev) => {
      ev.preventDefault();
      dragging = true;
      joystickEl.classList.add("active");
    }, { passive: false });

    document.addEventListener("touchmove", (ev) => {
      if (!dragging || !gameState.gameRunning) return;
      ev.preventDefault();

      const rect = joystickEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const t = ev.touches[0];

      const dx = t.clientX - cx;
      const dy = t.clientY - cy;

      const dist = Math.hypot(dx, dy);
      const maxDist = 40;

      const nx = dist > 0 ? dx / Math.max(dist, 1) : 0;
      const power = Math.min(1, dist / maxDist);

      const speed = 18; // tune
      gameState.poohX = clamp(
        gameState.poohX + nx * power * speed,
        gameState.poohWidth / 2,
        cw - gameState.poohWidth / 2
      );
    }, { passive: false });

    document.addEventListener("touchend", () => {
      dragging = false;
      joystickEl.classList.remove("active");
    });
  }

  // Buttons
  startBtn?.addEventListener("click", startEnhancedGame);
  pauseBtn?.addEventListener("click", toggleEnhancedPause);

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------
  window.addEventListener("beforeunload", () => {
    if (rafId) cancelAnimationFrame(rafId);
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    if (gameState.countdownInterval) clearInterval(gameState.countdownInterval);
  });

  console.log("Enhanced Honey Catch Game initialized");

  // ---------------------------------------------------------------------------
  // Small helpers (kept inside to stay “isolated”)
  // ---------------------------------------------------------------------------
  function makePool() {
    return {
      pool: [],
      active: 0,
      get(obj) {
        let item;
        if (this.active < this.pool.length) {
          item = this.pool[this.active];
          Object.assign(item, obj);
        } else {
          item = obj;
          this.pool.push(item);
        }
        this.active++;
        return item;
      },
      update(fn) {
        for (let i = 0; i < this.active; i++) {
          const it = this.pool[i];
          if (it.active) fn(it, i);
        }
        // compact from end (cheap)
        let write = 0;
        for (let i = 0; i < this.active; i++) {
          const it = this.pool[i];
          if (it.active) {
            if (write !== i) this.pool[write] = it;
            write++;
          }
        }
        this.active = write;
      },
      reset() {
        for (let i = 0; i < this.pool.length; i++) this.pool[i].active = false;
        this.active = 0;
      },
      activeCount() {
        return this.active;
      }
    };
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  // Background painter (one-time into bgCtx)
  function drawCatchBackgroundTo(g, w, h) {
    // sky
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#87CEEB");
    sky.addColorStop(0.6, "#B3E5FC");
    sky.addColorStop(1, "#E3F2FD");
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);

    // sun
    g.save();
    g.shadowColor = "#FFD700";
    g.shadowBlur = 50;
    g.fillStyle = "#FFEB3B";
    g.beginPath();
    g.arc(80, 80, 35, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // clouds (simple)
    g.save();
    g.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 3; i++) {
      const x = 60 + i * (w * 0.32);
      const y = 60 + Math.sin(i) * 18;
      g.beginPath();
      g.arc(x, y, 18, 0, Math.PI * 2);
      g.arc(x + 24, y - 10, 24, 0, Math.PI * 2);
      g.arc(x + 48, y, 18, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();

    // ground
    const groundH = 70;
    const groundY = h - groundH;

    const grd = g.createLinearGradient(0, groundY, 0, h);
    grd.addColorStop(0, "#8BC34A");
    grd.addColorStop(1, "#689F38");
    g.fillStyle = grd;
    g.fillRect(0, groundY, w, groundH);

    // trees (scaled a bit)
    g.fillStyle = "#8B4513";
    g.fillRect(w * 0.18, h * 0.45, 28, h * 0.25);
    g.fillStyle = "#2E7D32";
    g.beginPath();
    g.arc(w * 0.18 + 14, h * 0.42, 55, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#A0522D";
    g.fillRect(w * 0.78, h * 0.50, 30, h * 0.22);
    g.fillStyle = "#388E3C";
    g.beginPath();
    g.arc(w * 0.78 + 15, h * 0.47, 50, 0, Math.PI * 2);
    g.fill();
  }

  // Fallback drawings
  function drawEnhancedPoohFallback(g) {
    const grad = g.createLinearGradient(0, 0, 0, 80);
    grad.addColorStop(0, "#FFC107");
    grad.addColorStop(1, "#FF9800");

    g.fillStyle = grad;
    g.beginPath();
    g.arc(40, 40, 30, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#FFD8A6";
    g.beginPath();
    g.ellipse(40, 48, 18, 12, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#D62E2E";
    g.fillRect(20, 55, 40, 15);

    g.fillStyle = "#000";
    g.beginPath();
    g.arc(32, 32, 3, 0, Math.PI * 2);
    g.arc(48, 32, 3, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#8B4513";
    g.beginPath();
    g.arc(40, 40, 5, 0, Math.PI * 2);
    g.fill();

    g.strokeStyle = "#000";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(40, 46, 10, 0.2, Math.PI - 0.2);
    g.stroke();
  }

  function drawEnhancedHoneyPotFallback(g, type = "normal") {
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "#FFEB3B");
    grad.addColorStop(0.7, "#FFD54F");
    grad.addColorStop(1, "#FFB300");

    g.fillStyle = grad;
    g.beginPath();
    g.arc(16, 16, 16, 0, Math.PI * 2);
    g.fill();

    g.strokeStyle = "#8B4513";
    g.lineWidth = 3;
    g.stroke();

    g.fillStyle = "#8B4513";
    g.fillRect(8, 6, 16, 5);
    g.fillRect(12, 3, 8, 3);

    g.fillStyle = "#FF9800";
    g.beginPath();
    g.ellipse(16, 22, 7, 10, 0, 0, Math.PI * 2);
    g.fill();

    if (type === "golden") {
      g.strokeStyle = "#FFD700";
      g.lineWidth = 2;
      g.setLineDash([2, 2]);
      g.beginPath();
      g.arc(16, 16, 18, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
    }
  }

  function drawEnhancedBee(g) {
    const grad = g.createRadialGradient(15, 15, 0, 15, 15, 12);
    grad.addColorStop(0, "#FFEB3B");
    grad.addColorStop(1, "#FF9800");

    g.fillStyle = grad;
    g.beginPath();
    g.arc(15, 15, 12, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#000";
    g.fillRect(8, 10, 5, 8);
    g.fillRect(18, 10, 5, 8);

    g.beginPath();
    g.arc(12, 12, 2, 0, Math.PI * 2);
    g.arc(18, 12, 2, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "rgba(255,255,255,0.8)";
    g.beginPath();
    g.arc(8, 5, 8, 0, Math.PI * 2);
    g.arc(22, 5, 8, 0, Math.PI * 2);
    g.fill();
  }

  function drawPowerUp(g, type, types) {
    const p = types[type];
    if (!p) return;

    g.fillStyle = p.color + "33";
    g.beginPath();
    g.arc(15, 15, 15, 0, Math.PI * 2);
    g.fill();

    g.strokeStyle = p.color;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(15, 15, 14, 0, Math.PI * 2);
    g.stroke();

    g.font = "18px Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(p.icon, 15, 15);
  }
}
    if (beePool.activeCount() < 7 && Math.random() < beeSpawn) {
      const angryChance = Math.min(0.22, elapsed * 0.006);
      const type = Math.random() < angryChance ? "angry" : "normal";
      beePool.get({
        x: rand(20, cw - 20),
        y: -20,
        speed: rand(3.0, 4.6),
        type,
        active: true,
        vx: 0,
        vy: 0
      });
    }

    if (powerUpPool.activeCount() < 3 && Math.random() < powerSpawn) {
      const keys = Object.keys(powerUpTypes);
      const type = keys[(Math.random() * keys.length) | 0];
      powerUpPool.get({
        x: rand(20, cw - 20),
        y: -20,
        speed: rand(2.1, 3.0),
        type,
        active: true
      });
    }

    // particles
    catchParticles.update(delta);
  }

  // ---------------------------------------------------------------------------
  // Render (all in CSS px coordinates)
  // ---------------------------------------------------------------------------
  function renderEnhancedCatchGame() {
    ctx.clearRect(0, 0, cw, ch);

    // background
    if (bgCanvas) {
      // bg canvas is DPR-sized; ctx is scaled to CSS px; drawImage fits CSS px
      ctx.drawImage(bgCanvas, 0, 0, cw, ch);
    }

    drawEnhancedEffects();
    drawEnhancedPooh();
    drawEnhancedHoneyPots();
    drawEnhancedBees();
    drawEnhancedPowerUps();
    catchParticles.render();
    drawEnhancedCatchUI();
  }

  function drawEnhancedPooh() {
    const sprite = spriteCache.getPooh();
    const yTop = gameState.poohY - gameState.poohHeight;

    ctx.save();

    if (gameState.isInvincible) {
      const blink = Math.sin(Date.now() / 100) > 0;
      if (blink) ctx.globalAlpha = 0.55;
    }

    // shadow
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    ctx.globalAlpha = 0.25;
    ctx.drawImage(sprite, gameState.poohX - gameState.poohWidth / 2, yTop + 5, gameState.poohWidth, gameState.poohHeight);
    ctx.restore();

    // main
    ctx.globalAlpha = 1;
    ctx.drawImage(sprite, gameState.poohX - gameState.poohWidth / 2, yTop, gameState.poohWidth, gameState.poohHeight);

    // shield ring
    if (gameState.isInvincible) {
      ctx.strokeStyle = `rgba(66,133,244,${0.45 + Math.sin(Date.now() / 200) * 0.25})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(gameState.poohX, yTop + gameState.poohHeight / 2, gameState.poohWidth / 2 + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawEnhancedHoneyPots() {
    honeyPotPool.update((pot) => {
      if (!pot.active) return;
      const sprite = spriteCache.getHoney(pot.type);
      ctx.drawImage(sprite, pot.x - 16, pot.y - 16);

      if (pot.type === "golden") {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.drawImage(sprite, pot.x - 16, pot.y - 13);
        ctx.restore();
      }
    });
  }

  function drawEnhancedBees() {
    const sprite = spriteCache.getBee();
    beePool.update((bee) => {
      if (!bee.active) return;

      ctx.save();
      const wobble = Math.sin(Date.now() / 110 + bee.x) * 3;
      ctx.translate(bee.x, bee.y + wobble);
      ctx.drawImage(sprite, -15, -15);
      ctx.restore();

      if (bee.type === "angry") {
        ctx.save();
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("💢", bee.x, bee.y - 20);
        ctx.restore();
      }
    });
  }

  function drawEnhancedPowerUps() {
    powerUpPool.update((p) => {
      if (!p.active) return;

      const sprite = spriteCache.getPowerUp(p.type);
      const float = Math.sin(Date.now() / 500 + p.x) * 5;

      ctx.save();
      ctx.drawImage(sprite, p.x - 15, p.y - 15 + float);
      ctx.shadowColor = powerUpTypes[p.type].color;
      ctx.shadowBlur = 15;
      ctx.drawImage(sprite, p.x - 15, p.y - 15 + float);
      ctx.restore();
    });
  }

  function drawEnhancedEffects() {
    const now = Date.now();
    for (const effect of gameState.effects) {
      const p = (now - effect.start) / effect.duration;

      if (effect.type === "catch") {
        const radius = 20 * (1 - p);
        const g = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, radius);
        g.addColorStop(0, "rgba(255,215,0,0.75)");
        g.addColorStop(1, "rgba(255,215,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (effect.type === "damage") {
        const radius = 16 * (1 - p);
        const g = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, radius);
        g.addColorStop(0, "rgba(255,107,107,0.75)");
        g.addColorStop(1, "rgba(255,107,107,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (effect.type === "score") {
        const y = effect.y - p * 28;
        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.font = "bold 20px Arial";
        ctx.fillStyle = effect.color || "#FFD700";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(effect.text, effect.x, y);
        ctx.restore();
      }
    }
  }

  function drawEnhancedCatchUI() {
    // Optional—keep this light since your HUD is in DOM already
    // (You can remove entirely if you don’t want any canvas UI)
  }

  // ---------------------------------------------------------------------------
  // Effects + power-ups
  // ---------------------------------------------------------------------------
  function createCatchEffect(x, y, points) {
    gameState.effects.push({ type: "catch", x, y, start: Date.now(), duration: 500 });
    gameState.effects.push({ type: "score", x, y: y - 18, text: `+${points}`, start: Date.now(), duration: 900, color: "#FFD700" });

    for (let i = 0; i < 8; i++) {
      catchParticles.createParticle(x, y, "honey", {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4 - 2
      });
    }
  }

  function createDamageEffect(x, y) {
    gameState.effects.push({ type: "damage", x, y, start: Date.now(), duration: 500 });

    for (let i = 0; i < 7; i++) {
      catchParticles.createParticle(x, y, "fire", {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4
      });
    }
  }

  function createMissEffect(x, y) {
    gameState.effects.push({ type: "score", x, y, text: "Miss!", start: Date.now(), duration: 700, color: "#FFFFFF" });
  }

  function createPowerUpEffect(x, y, type) {
    const p = powerUpTypes[type];
    if (!p) return;

    for (let i = 0; i < 12; i++) {
      catchParticles.createParticle(x, y, "sparkle", {
        x: (Math.random() - 0.5) * 6,
        y: (Math.random() - 0.5) * 6 - 2
      });
    }

    gameState.effects.push({
      type: "score",
      x,
      y: y - 28,
      text: `${p.icon} ${type}`,
      start: Date.now(),
      duration: 950,
      color: p.color
    });
  }

  function applyPowerUp(type) {
    const now = Date.now();
    switch (type) {
      case "heart":
        gameState.lives = Math.min(5, gameState.lives + 1);
        syncEnhancedCatchStats();
        break;
      case "shield":
        gameState.isInvincible = true;
        gameState.invincibilityEnd = now + powerUpTypes.shield.duration;
        break;
      case "clock":
        gameState.timeLeft += 10;
        syncEnhancedCatchStats();
        break;
      case "star":
        gameState.doublePoints = true;
        gameState.doublePointsEnd = now + powerUpTypes.star.duration;
        break;
      case "lightning":
        gameState.slowMotion = true;
        gameState.slowMotionEnd = now + powerUpTypes.lightning.duration;
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------
  function startEnhancedGame() {
    if (gameState.gameRunning || gameState.countdownInterval) return;

    // reset
    gameState.score = 0;
    gameState.lives = 3;
    gameState.timeLeft = 60;
    gameState.combos = 0;
    gameState.multiplier = 1;
    gameState.streak = 0;
    gameState.lastCatchTime = 0;
    gameState.effects = [];
    gameState.isInvincible = false;
    gameState.doublePoints = false;
    gameState.slowMotion = false;

    honeyPotPool.reset();
    beePool.reset();
    powerUpPool.reset();
    catchParticles.clear();

    resizeCanvas();

    syncEnhancedCatchStats();

    // countdown
    let count = 3;
    setEnhancedCatchOverlay("Starting in 3...", "Get Pooh ready to move.", true);

    gameState.countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setEnhancedCatchOverlay(`Starting in ${count}...`, "Catch honey, dodge bees.", true);
        window.audioManager?.playTone?.([440, 440, 440], 0.08);
      } else {
        clearInterval(gameState.countdownInterval);
        gameState.countdownInterval = null;

        setEnhancedCatchOverlay("Go!", "Keep Pooh under the falling honey.", false, 900);
        gameState.gameRunning = true;
        gameState.startedAt = Date.now();

        clearInterval(gameState.timerInterval);
        gameState.timerInterval = setInterval(() => {
          gameState.timeLeft--;
          syncEnhancedCatchStats();
          if (gameState.timeLeft <= 0) endEnhancedGame(true);
        }, 1000);

        window.audioManager?.playTone?.([523, 659, 784], 0.14);
      }
    }, 800);
  }

  function endEnhancedGame(timeExpired) {
    if (!gameState.gameRunning) return;

    gameState.gameRunning = false;
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;

    // bonus
    let finalScore = gameState.score;
    let bonus = 0;
    if (gameState.lives === 3) bonus += 100;
    if (gameState.combos > 10) bonus += 50;
    if (gameState.streak > 15) bonus += 75;
    finalScore += bonus;

    setEnhancedCatchOverlay(
      timeExpired ? "Time's up!" : "Ouch! The bees won this round.",
      `Final Score: ${finalScore}${bonus ? ` (+${bonus} bonus)` : ""}`,
      true
    );

    shakeElement(catchCard);

    if (window.audioManager) {
      window.audioManager.playGameSound?.(timeExpired ? "victory" : "defeat");
    }
  }

  function toggleEnhancedPause() {
    if (!gameState.gameRunning && gameState.timeLeft > 0 && gameState.lives > 0) {
      // resume
      gameState.gameRunning = true;
      if (!gameState.timerInterval) {
        gameState.timerInterval = setInterval(() => {
          gameState.timeLeft--;
          syncEnhancedCatchStats();
          if (gameState.timeLeft <= 0) endEnhancedGame(true);
        }, 1000);
      }
      catchOverlay?.classList.remove("active");
      pauseBtn?.setAttribute("aria-pressed", "false");
    } else if (gameState.gameRunning) {
      // pause
      gameState.gameRunning = false;
      clearInterval(gameState.timerInterval);
      gameState.timerInterval = null;
      setEnhancedCatchOverlay("Paused", "Tap start or pause to continue when ready.", true);
      pauseBtn?.setAttribute("aria-pressed", "true");
    }
    window.audioManager?.playSound?.("click");
  }

  // Keyboard
  document.addEventListener("keydown", (ev) => {
    if (!gameState.gameRunning) return;
    const step = 26;

    if (ev.key === "ArrowLeft") {
      gameState.poohX = clamp(gameState.poohX - step, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
    } else if (ev.key === "ArrowRight") {
      gameState.poohX = clamp(gameState.poohX + step, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
    }
  });

  // Mouse / touch direct control on canvas
  canvas.addEventListener("mousemove", (ev) => {
    if (!gameState.gameRunning) return;
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    gameState.poohX = clamp(x, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
  });

  canvas.addEventListener("touchstart", (ev) => {
    if (!gameState.gameRunning) return;
    ev.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = ev.touches[0];
    const x = t.clientX - rect.left;
    gameState.poohX = clamp(x, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
  }, { passive: false });

  canvas.addEventListener("touchmove", (ev) => {
    if (!gameState.gameRunning) return;
    ev.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = ev.touches[0];
    const x = t.clientX - rect.left;
    gameState.poohX = clamp(x, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
  }, { passive: false });

  // Joystick (uses your existing #catchJoystick DOM)
  if (IS_MOBILE && joystickEl) {
    let dragging = false;

    joystickEl.addEventListener("touchstart", (ev) => {
      ev.preventDefault();
      dragging = true;
      joystickEl.classList.add("active");
    }, { passive: false });

    document.addEventListener("touchmove", (ev) => {
      if (!dragging || !gameState.gameRunning) return;
      ev.preventDefault();

      const rect = joystickEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const t = ev.touches[0];

      const dx = t.clientX - cx;
      const dy = t.clientY - cy;

      const dist = Math.hypot(dx, dy);
      const maxDist = 40;

      const nx = dist > 0 ? dx / Math.max(dist, 1) : 0;
      const power = Math.min(1, dist / maxDist);

      const speed = 18; // tune
      gameState.poohX = clamp(
        gameState.poohX + nx * power * speed,
        gameState.poohWidth / 2,
        cw - gameState.poohWidth / 2
      );
    }, { passive: false });

    document.addEventListener("touchend", () => {
      dragging = false;
      joystickEl.classList.remove("active");
    });
  }

  // Buttons
  startBtn?.addEventListener("click", startEnhancedGame);
  pauseBtn?.addEventListener("click", toggleEnhancedPause);

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------
  window.addEventListener("beforeunload", () => {
    if (rafId) cancelAnimationFrame(rafId);
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    if (gameState.countdownInterval) clearInterval(gameState.countdownInterval);
  });

  console.log("Enhanced Honey Catch Game initialized");

  // ---------------------------------------------------------------------------
  // Small helpers (kept inside to stay “isolated”)
  // ---------------------------------------------------------------------------
  function makePool() {
    return {
      pool: [],
      active: 0,
      get(obj) {
        let item;
        if (this.active < this.pool.length) {
          item = this.pool[this.active];
          Object.assign(item, obj);
        } else {
          item = obj;
          this.pool.push(item);
        }
        this.active++;
        return item;
      },
      update(fn) {
        for (let i = 0; i < this.active; i++) {
          const it = this.pool[i];
          if (it.active) fn(it, i);
        }
        // compact from end (cheap)
        let write = 0;
        for (let i = 0; i < this.active; i++) {
          const it = this.pool[i];
          if (it.active) {
            if (write !== i) this.pool[write] = it;
            write++;
          }
        }
        this.active = write;
      },
      reset() {
        for (let i = 0; i < this.pool.length; i++) this.pool[i].active = false;
        this.active = 0;
      },
      activeCount() {
        return this.active;
      }
    };
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  // Background painter (one-time into bgCtx)
  function drawCatchBackgroundTo(g, w, h) {
    // sky
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#87CEEB");
    sky.addColorStop(0.6, "#B3E5FC");
    sky.addColorStop(1, "#E3F2FD");
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);

    // sun
    g.save();
    g.shadowColor = "#FFD700";
    g.shadowBlur = 50;
    g.fillStyle = "#FFEB3B";
    g.beginPath();
    g.arc(80, 80, 35, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // clouds (simple)
    g.save();
    g.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 3; i++) {
      const x = 60 + i * (w * 0.32);
      const y = 60 + Math.sin(i) * 18;
      g.beginPath();
      g.arc(x, y, 18, 0, Math.PI * 2);
      g.arc(x + 24, y - 10, 24, 0, Math.PI * 2);
      g.arc(x + 48, y, 18, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();

    // ground
    const groundH = 70;
    const groundY = h - groundH;

    const grd = g.createLinearGradient(0, groundY, 0, h);
    grd.addColorStop(0, "#8BC34A");
    grd.addColorStop(1, "#689F38");
    g.fillStyle = grd;
    g.fillRect(0, groundY, w, groundH);

    // trees (scaled a bit)
    g.fillStyle = "#8B4513";
    g.fillRect(w * 0.18, h * 0.45, 28, h * 0.25);
    g.fillStyle = "#2E7D32";
    g.beginPath();
    g.arc(w * 0.18 + 14, h * 0.42, 55, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#A0522D";
    g.fillRect(w * 0.78, h * 0.50, 30, h * 0.22);
    g.fillStyle = "#388E3C";
    g.beginPath();
    g.arc(w * 0.78 + 15, h * 0.47, 50, 0, Math.PI * 2);
    g.fill();
  }

  // Fallback drawings
  function drawEnhancedPoohFallback(g) {
    const grad = g.createLinearGradient(0, 0, 0, 80);
    grad.addColorStop(0, "#FFC107");
    grad.addColorStop(1, "#FF9800");

    g.fillStyle = grad;
    g.beginPath();
    g.arc(40, 40, 30, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#FFD8A6";
    g.beginPath();
    g.ellipse(40, 48, 18, 12, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#D62E2E";
    g.fillRect(20, 55, 40, 15);

    g.fillStyle = "#000";
    g.beginPath();
    g.arc(32, 32, 3, 0, Math.PI * 2);
    g.arc(48, 32, 3, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#8B4513";
    g.beginPath();
    g.arc(40, 40, 5, 0, Math.PI * 2);
    g.fill();

    g.strokeStyle = "#000";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(40, 46, 10, 0.2, Math.PI - 0.2);
    g.stroke();
  }

  function drawEnhancedHoneyPotFallback(g, type = "normal") {
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "#FFEB3B");
    grad.addColorStop(0.7, "#FFD54F");
    grad.addColorStop(1, "#FFB300");

    g.fillStyle = grad;
    g.beginPath();
    g.arc(16, 16, 16, 0, Math.PI * 2);
    g.fill();

    g.strokeStyle = "#8B4513";
    g.lineWidth = 3;
    g.stroke();

    g.fillStyle = "#8B4513";
    g.fillRect(8, 6, 16, 5);
    g.fillRect(12, 3, 8, 3);

    g.fillStyle = "#FF9800";
    g.beginPath();
    g.ellipse(16, 22, 7, 10, 0, 0, Math.PI * 2);
    g.fill();

    if (type === "golden") {
      g.strokeStyle = "#FFD700";
      g.lineWidth = 2;
      g.setLineDash([2, 2]);
      g.beginPath();
      g.arc(16, 16, 18, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
    }
  }

  function drawEnhancedBee(g) {
    const grad = g.createRadialGradient(15, 15, 0, 15, 15, 12);
    grad.addColorStop(0, "#FFEB3B");
    grad.addColorStop(1, "#FF9800");

    g.fillStyle = grad;
    g.beginPath();
    g.arc(15, 15, 12, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#000";
    g.fillRect(8, 10, 5, 8);
    g.fillRect(18, 10, 5, 8);

    g.beginPath();
    g.arc(12, 12, 2, 0, Math.PI * 2);
    g.arc(18, 12, 2, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "rgba(255,255,255,0.8)";
    g.beginPath();
    g.arc(8, 5, 8, 0, Math.PI * 2);
    g.arc(22, 5, 8, 0, Math.PI * 2);
    g.fill();
  }

  function drawPowerUp(g, type, types) {
    const p = types[type];
    if (!p) return;

    g.fillStyle = p.color + "33";
    g.beginPath();
    g.arc(15, 15, 15, 0, Math.PI * 2);
    g.fill();

    g.strokeStyle = p.color;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(15, 15, 14, 0, Math.PI * 2);
    g.stroke();

    g.font = "18px Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(p.icon, 15, 15);
  }
}
  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------
  function startEnhancedGame() {
    if (gameState.gameRunning || gameState.countdownInterval) return;

    // reset
    gameState.score = 0;
    gameState.lives = 3;
    gameState.timeLeft = 60;
    gameState.combos = 0;
    gameState.multiplier = 1;
    gameState.streak = 0;
    gameState.lastCatchTime = 0;
    gameState.effects = [];
    gameState.isInvincible = false;
    gameState.doublePoints = false;
    gameState.slowMotion = false;

    honeyPotPool.reset();
    beePool.reset();
    powerUpPool.reset();
    catchParticles.clear();

    resizeCanvas();

    syncEnhancedCatchStats();

    // countdown
    let count = 3;
    setEnhancedCatchOverlay("Starting in 3...", "Get Pooh ready to move.", true);

    gameState.countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setEnhancedCatchOverlay(`Starting in ${count}...`, "Catch honey, dodge bees.", true);
        window.audioManager?.playTone?.([440, 440, 440], 0.08);
      } else {
        clearInterval(gameState.countdownInterval);
        gameState.countdownInterval = null;

        setEnhancedCatchOverlay("Go!", "Keep Pooh under the falling honey.", false, 900);
        gameState.gameRunning = true;
        gameState.startedAt = Date.now();

        clearInterval(gameState.timerInterval);
        gameState.timerInterval = setInterval(() => {
          gameState.timeLeft--;
          syncEnhancedCatchStats();
          if (gameState.timeLeft <= 0) endEnhancedGame(true);
        }, 1000);

        window.audioManager?.playTone?.([523, 659, 784], 0.14);
      }
    }, 800);
  }

  function endEnhancedGame(timeExpired) {
    if (!gameState.gameRunning) return;

    gameState.gameRunning = false;
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;

    // bonus
    let finalScore = gameState.score;
    let bonus = 0;
    if (gameState.lives === 3) bonus += 100;
    if (gameState.combos > 10) bonus += 50;
    if (gameState.streak > 15) bonus += 75;
    finalScore += bonus;

    setEnhancedCatchOverlay(
      timeExpired ? "Time's up!" : "Ouch! The bees won this round.",
      `Final Score: ${finalScore}${bonus ? ` (+${bonus} bonus)` : ""}`,
      true
    );

    shakeElement(catchCard);

    if (window.audioManager) {
      window.audioManager.playGameSound?.(timeExpired ? "victory" : "defeat");
    }
  }

  function toggleEnhancedPause() {
    if (!gameState.gameRunning && gameState.timeLeft > 0 && gameState.lives > 0) {
      // resume
      gameState.gameRunning = true;
      if (!gameState.timerInterval) {
        gameState.timerInterval = setInterval(() => {
          gameState.timeLeft--;
          syncEnhancedCatchStats();
          if (gameState.timeLeft <= 0) endEnhancedGame(true);
        }, 1000);
      }
      catchOverlay?.classList.remove("active");
      pauseBtn?.setAttribute("aria-pressed", "false");
    } else if (gameState.gameRunning) {
      // pause
      gameState.gameRunning = false;
      clearInterval(gameState.timerInterval);
      gameState.timerInterval = null;
      setEnhancedCatchOverlay("Paused", "Tap start or pause to continue when ready.", true);
      pauseBtn?.setAttribute("aria-pressed", "true");
    }
    window.audioManager?.playSound?.("click");
  }

  // Keyboard
  document.addEventListener("keydown", (ev) => {
    if (!gameState.gameRunning) return;
    const step = 26;

    if (ev.key === "ArrowLeft") {
      gameState.poohX = clamp(gameState.poohX - step, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
    } else if (ev.key === "ArrowRight") {
      gameState.poohX = clamp(gameState.poohX + step, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
    }
  });

  // Mouse / touch direct control on canvas
  canvas.addEventListener("mousemove", (ev) => {
    if (!gameState.gameRunning) return;
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    gameState.poohX = clamp(x, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
  });

  canvas.addEventListener("touchstart", (ev) => {
    if (!gameState.gameRunning) return;
    ev.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = ev.touches[0];
    const x = t.clientX - rect.left;
    gameState.poohX = clamp(x, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
  }, { passive: false });

  canvas.addEventListener("touchmove", (ev) => {
    if (!gameState.gameRunning) return;
    ev.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const t = ev.touches[0];
    const x = t.clientX - rect.left;
    gameState.poohX = clamp(x, gameState.poohWidth / 2, cw - gameState.poohWidth / 2);
  }, { passive: false });

  // Joystick (uses your existing #catchJoystick DOM)
  if (IS_MOBILE && joystickEl) {
    let dragging = false;

    joystickEl.addEventListener("touchstart", (ev) => {
      ev.preventDefault();
      dragging = true;
      joystickEl.classList.add("active");
    }, { passive: false });

    document.addEventListener("touchmove", (ev) => {
      if (!dragging || !gameState.gameRunning) return;
      ev.preventDefault();

      const rect = joystickEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const t = ev.touches[0];

      const dx = t.clientX - cx;
      const dy = t.clientY - cy;

      const dist = Math.hypot(dx, dy);
      const maxDist = 40;

      const nx = dist > 0 ? dx / Math.max(dist, 1) : 0;
      const power = Math.min(1, dist / maxDist);

      const speed = 18; // tune
      gameState.poohX = clamp(
        gameState.poohX + nx * power * speed,
        gameState.poohWidth / 2,
        cw - gameState.poohWidth / 2
      );
    }, { passive: false });

    document.addEventListener("touchend", () => {
      dragging = false;
      joystickEl.classList.remove("active");
    });
  }

  // Buttons
  startBtn?.addEventListener("click", startEnhancedGame);
  pauseBtn?.addEventListener("click", toggleEnhancedPause);

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------
  window.addEventListener("beforeunload", () => {
    if (rafId) cancelAnimationFrame(rafId);
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    if (gameState.countdownInterval) clearInterval(gameState.countdownInterval);
  });

  console.log("Enhanced Honey Catch Game initialized");

  // ---------------------------------------------------------------------------
  // Small helpers (kept inside to stay “isolated”)
  // ---------------------------------------------------------------------------
  function makePool() {
    return {
      pool: [],
      active: 0,
      get(obj) {
        let item;
        if (this.active < this.pool.length) {
          item = this.pool[this.active];
          Object.assign(item, obj);
        } else {
          item = obj;
          this.pool.push(item);
        }
        this.active++;
        return item;
      },
      update(fn) {
        for (let i = 0; i < this.active; i++) {
          const it = this.pool[i];
          if (it.active) fn(it, i);
        }
        // compact from end (cheap)
        let write = 0;
        for (let i = 0; i < this.active; i++) {
          const it = this.pool[i];
          if (it.active) {
            if (write !== i) this.pool[write] = it;
            write++;
          }
        }
        this.active = write;
      },
      reset() {
        for (let i = 0; i < this.pool.length; i++) this.pool[i].active = false;
        this.active = 0;
      },
      activeCount() {
        return this.active;
      }
    };
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  // Background painter (one-time into bgCtx)
  function drawCatchBackgroundTo(g, w, h) {
    // sky
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#87CEEB");
    sky.addColorStop(0.6, "#B3E5FC");
    sky.addColorStop(1, "#E3F2FD");
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);

    // sun
    g.save();
    g.shadowColor = "#FFD700";
    g.shadowBlur = 50;
    g.fillStyle = "#FFEB3B";
    g.beginPath();
    g.arc(80, 80, 35, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // clouds (simple)
    g.save();
    g.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 3; i++) {
      const x = 60 + i * (w * 0.32);
      const y = 60 + Math.sin(i) * 18;
      g.beginPath();
      g.arc(x, y, 18, 0, Math.PI * 2);
      g.arc(x + 24, y - 10, 24, 0, Math.PI * 2);
      g.arc(x + 48, y, 18, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();

    // ground
    const groundH = 70;
    const groundY = h - groundH;

    const grd = g.createLinearGradient(0, groundY, 0, h);
    grd.addColorStop(0, "#8BC34A");
    grd.addColorStop(1, "#689F38");
    g.fillStyle = grd;
    g.fillRect(0, groundY, w, groundH);

    // trees (scaled a bit)
    g.fillStyle = "#8B4513";
    g.fillRect(w * 0.18, h * 0.45, 28, h * 0.25);
    g.fillStyle = "#2E7D32";
    g.beginPath();
    g.arc(w * 0.18 + 14, h * 0.42, 55, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#A0522D";
    g.fillRect(w * 0.78, h * 0.50, 30, h * 0.22);
    g.fillStyle = "#388E3C";
    g.beginPath();
    g.arc(w * 0.78 + 15, h * 0.47, 50, 0, Math.PI * 2);
    g.fill();
  }

  // Fallback drawings
  function drawEnhancedPoohFallback(g) {
    const grad = g.createLinearGradient(0, 0, 0, 80);
    grad.addColorStop(0, "#FFC107");
    grad.addColorStop(1, "#FF9800");

    g.fillStyle = grad;
    g.beginPath();
    g.arc(40, 40, 30, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#FFD8A6";
    g.beginPath();
    g.ellipse(40, 48, 18, 12, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#D62E2E";
    g.fillRect(20, 55, 40, 15);

    g.fillStyle = "#000";
    g.beginPath();
    g.arc(32, 32, 3, 0, Math.PI * 2);
    g.arc(48, 32, 3, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#8B4513";
    g.beginPath();
    g.arc(40, 40, 5, 0, Math.PI * 2);
    g.fill();

    g.strokeStyle = "#000";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(40, 46, 10, 0.2, Math.PI - 0.2);
    g.stroke();
  }

  function drawEnhancedHoneyPotFallback(g, type = "normal") {
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "#FFEB3B");
    grad.addColorStop(0.7, "#FFD54F");
    grad.addColorStop(1, "#FFB300");

    g.fillStyle = grad;
    g.beginPath();
    g.arc(16, 16, 16, 0, Math.PI * 2);
    g.fill();

    g.strokeStyle = "#8B4513";
    g.lineWidth = 3;
    g.stroke();

    g.fillStyle = "#8B4513";
    g.fillRect(8, 6, 16, 5);
    g.fillRect(12, 3, 8, 3);

    g.fillStyle = "#FF9800";
    g.beginPath();
    g.ellipse(16, 22, 7, 10, 0, 0, Math.PI * 2);
    g.fill();

    if (type === "golden") {
      g.strokeStyle = "#FFD700";
      g.lineWidth = 2;
      g.setLineDash([2, 2]);
      g.beginPath();
      g.arc(16, 16, 18, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
    }
  }

  function drawEnhancedBee(g) {
    const grad = g.createRadialGradient(15, 15, 0, 15, 15, 12);
    grad.addColorStop(0, "#FFEB3B");
    grad.addColorStop(1, "#FF9800");

    g.fillStyle = grad;
    g.beginPath();
    g.arc(15, 15, 12, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "#000";
    g.fillRect(8, 10, 5, 8);
    g.fillRect(18, 10, 5, 8);

    g.beginPath();
    g.arc(12, 12, 2, 0, Math.PI * 2);
    g.arc(18, 12, 2, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = "rgba(255,255,255,0.8)";
    g.beginPath();
    g.arc(8, 5, 8, 0, Math.PI * 2);
    g.arc(22, 5, 8, 0, Math.PI * 2);
    g.fill();
  }

  function drawPowerUp(g, type, types) {
    const p = types[type];
    if (!p) return;

    g.fillStyle = p.color + "33";
    g.beginPath();
    g.arc(15, 15, 15, 0, Math.PI * 2);
    g.fill();

    g.strokeStyle = p.color;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(15, 15, 14, 0, Math.PI * 2);
    g.stroke();

    g.font = "18px Arial";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(p.icon, 15, 15);
  }
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
