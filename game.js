// game.js — Honey Pot Catch (Ultimate Enhanced Edition) - Fixed Version
'use strict';

(function () {
  // ---------------------------------------------------------------------------
  // Enhanced Utilities
  // ---------------------------------------------------------------------------
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  // Screen Reader Announcement Function
  function announceToScreenReader(message, priority = 'polite') {
    // Create aria-live region for screen readers
    let liveRegion = document.getElementById('sr-announcements');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'sr-announcements';
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.padding = '0';
      liveRegion.style.overflow = 'hidden';
      liveRegion.style.clip = 'rect(0, 0, 0, 0)';
      liveRegion.style.whiteSpace = 'nowrap';
      liveRegion.style.border = '0';
      document.body.appendChild(liveRegion);
    }
    
    // Update content
    liveRegion.textContent = message;
    
    // Clear after a moment for repeated announcements
    if (liveRegion._clearTimeout) clearTimeout(liveRegion._clearTimeout);
    liveRegion._clearTimeout = setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }

  // Enhanced Object Pooling System
  class ObjectPool {
    constructor(createFn, resetFn, initialSize = 50) {
      this.createFn = createFn;
      this.resetFn = resetFn;
      this.pool = [];
      this.active = [];
      this.maxSize = initialSize * 2;
      
      for (let i = 0; i < initialSize; i++) {
        this.pool.push(createFn());
      }
    }
    
    get() {
      if (this.pool.length > 0) {
        const obj = this.pool.pop();
        this.active.push(obj);
        return obj;
      } else if (this.active.length + this.pool.length < this.maxSize) {
        const obj = this.createFn();
        this.active.push(obj);
        return obj;
      } else {
        // Recycle oldest active object
        const recycled = this.active.shift();
        if (this.resetFn) this.resetFn(recycled);
        this.active.push(recycled);
        return recycled;
      }
    }
    
    release(obj) {
      const index = this.active.indexOf(obj);
      if (index > -1) {
        this.active.splice(index, 1);
      }
      
      if (this.resetFn) {
        this.resetFn(obj);
      }
      
      if (this.pool.length < this.maxSize) {
        this.pool.push(obj);
      }
    }
    
    releaseAll() {
      for (const obj of this.active) {
        if (this.resetFn) {
          this.resetFn(obj);
        }
        if (this.pool.length < this.maxSize) {
          this.pool.push(obj);
        }
      }
      this.active.length = 0;
    }
    
    getActiveCount() {
      return this.active.length;
    }
    
    getPoolSize() {
      return this.pool.length + this.active.length;
    }
    
    optimize() {
      // Keep only 75% of inactive pool
      const targetSize = Math.floor(this.maxSize * 0.75);
      if (this.pool.length > targetSize) {
        this.pool.length = targetSize;
      }
    }
  }

  function isMobileDevice() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const touch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || 
                  'ontouchstart' in window ||
                  (window.DocumentTouch && document instanceof DocumentTouch);
    return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
            (touch && window.innerWidth <= 900));
  }

  // Enhanced FrameRateLimiter with adaptive FPS and performance monitoring
  class FrameRateLimiter {
    constructor(targetFPS = 60) {
      this.setTarget(targetFPS);
      this.lastFrameTime = 0;
      this.frameCount = 0;
      this.lastFpsUpdate = 0;
      this.currentFPS = targetFPS;
      this.frameTimes = [];
      this.maxFrameTime = 0;
      this.lowFpsCount = 0;
      this.adaptiveMode = true;
      this.originalTarget = targetFPS;
    }
    
    setTarget(targetFPS) {
      const fps = Number(targetFPS) || 60;
      this.originalTarget = clamp(fps, 10, 120);
      this.targetFPS = this.originalTarget;
      this.frameInterval = 1000 / this.targetFPS;
    }
    
    shouldRender(ts) {
      this.frameCount++;
      
      // Update FPS counter every second
      if (ts - this.lastFpsUpdate >= 1000) {
        this.currentFPS = Math.round((this.frameCount * 1000) / (ts - this.lastFpsUpdate));
        this.frameCount = 0;
        this.lastFpsUpdate = ts;
        
        // Adaptive frame rate adjustment
        if (this.adaptiveMode && this.currentFPS < this.targetFPS * 0.7) {
          this.lowFpsCount++;
          if (this.lowFpsCount >= 3) {
            const newFPS = Math.max(30, Math.floor(this.targetFPS * 0.8));
            if (newFPS !== this.targetFPS) {
              this.targetFPS = newFPS;
              this.frameInterval = 1000 / this.targetFPS;
              console.log(`[Performance] Adaptive FPS: ${newFPS}`);
            }
          }
        } else if (this.lowFpsCount > 0) {
          this.lowFpsCount = Math.max(0, this.lowFpsCount - 1);
        }
      }
      
      // Track frame times for performance monitoring
      if (this.lastFrameTime > 0) {
        const frameTime = ts - this.lastFrameTime;
        this.frameTimes.push(frameTime);
        if (this.frameTimes.length > 60) {
          this.frameTimes.shift();
        }
        this.maxFrameTime = Math.max(...this.frameTimes);
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
      this.frameTimes = [];
      this.maxFrameTime = 0;
      this.lowFpsCount = 0;
      this.targetFPS = this.originalTarget;
      this.frameInterval = 1000 / this.targetFPS;
    }
    
    getFPS() {
      return this.currentFPS;
    }
    
    getAverageFrameTime() {
      if (this.frameTimes.length === 0) return 0;
      return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    }
    
    getPerformanceGrade() {
      const avg = this.getAverageFrameTime();
      if (avg <= 16.67) return 'A'; // 60 FPS
      if (avg <= 33.33) return 'B'; // 30 FPS
      if (avg <= 50) return 'C'; // 20 FPS
      return 'D'; // < 20 FPS
    }
  }

  function smoothLerp(current, target, factor = 0.2) {
    return current + (target - current) * factor;
  }

  // Particle System with enhanced effects
  class ParticleSystem {
    constructor(maxParticles = 200) {
      this.particles = [];
      this.maxParticles = maxParticles;
      this.emitters = [];
      this.particlePool = new ObjectPool(
        () => ({
          x: 0, y: 0, vx: 0, vy: 0, life: 1, decay: 0.03,
          size: 4, color: '#FFFFFF', gravity: 0.1, rotation: 0, rotationSpeed: 0,
          startSize: 4, endSize: 0, trail: []
        }),
        (p) => {
          p.x = 0; p.y = 0; p.vx = 0; p.vy = 0; p.life = 1;
          p.trail = [];
        }
      );
    }
    
    burst(x, y, count, color, options = {}) {
      const { 
        size = 4, 
        speed = 3, 
        gravity = 0.1, 
        decay = 0.03,
        spread = 360,
        minSpeed = 0.5,
        rotation = 0,
        rotationSpeed = 2,
        endSize = 0
      } = options;
      
      for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
        const particle = this.particlePool.get();
        
        const angle = (Math.random() * spread * Math.PI / 180) - (spread * Math.PI / 360);
        const velocity = minSpeed + Math.random() * (speed - minSpeed);
        
        particle.x = x;
        particle.y = y;
        particle.vx = Math.cos(angle) * velocity;
        particle.vy = Math.sin(angle) * velocity;
        particle.life = 1;
        particle.decay = decay * (0.8 + Math.random() * 0.4);
        particle.startSize = size * (0.5 + Math.random());
        particle.endSize = endSize;
        particle.size = particle.startSize;
        particle.color = color;
        particle.gravity = gravity;
        particle.rotation = rotation;
        particle.rotationSpeed = (Math.random() - 0.5) * rotationSpeed * 2;
        particle.trail = [];
        
        this.particles.push(particle);
      }
    }
    
    emitter(x, y, options = {}) {
      const emitter = {
        x, y,
        rate: options.rate || 10,
        lastEmit: 0,
        color: options.color || '#FFFFFF',
        size: options.size || 3,
        speed: options.speed || 1,
        active: true,
        duration: options.duration || -1,
        startTime: nowMs()
      };
      
      this.emitters.push(emitter);
      return emitter;
    }
    
    update(dt) {
      // Update emitters
      for (let i = this.emitters.length - 1; i >= 0; i--) {
        const emitter = this.emitters[i];
        
        // Check if emitter should be removed
        if (emitter.duration > 0 && nowMs() - emitter.startTime > emitter.duration) {
          emitter.active = false;
        }
        
        if (!emitter.active) {
          this.emitters.splice(i, 1);
          continue;
        }
        
        // Emit particles
        const shouldEmit = nowMs() - emitter.lastEmit > (1000 / emitter.rate);
        if (shouldEmit && this.particles.length < this.maxParticles) {
          this.burst(emitter.x, emitter.y, 1, emitter.color, {
            size: emitter.size,
            speed: emitter.speed,
            spread: 360
          });
          emitter.lastEmit = nowMs();
        }
      }
      
      // Update particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        
        // Store trail position
        if (p.trail.length < 5) {
          p.trail.push({ x: p.x, y: p.y, life: p.life });
        } else {
          p.trail.shift();
          p.trail.push({ x: p.x, y: p.y, life: p.life });
        }
        
        // Update position
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        
        // Update rotation
        p.rotation += p.rotationSpeed * dt;
        
        // Apply air resistance
        p.vx *= 0.98;
        p.vy *= 0.98;
        
        // Update size
        p.size = p.startSize + (p.endSize - p.startSize) * (1 - p.life);
        
        p.life -= p.decay * dt;
        
        if (p.life <= 0 || p.y > window.innerHeight + 50 || p.x < -50 || p.x > window.innerWidth + 50) {
          this.particlePool.release(p);
          this.particles.splice(i, 1);
        }
      }
    }
    
    render(ctx) {
      ctx.save();
      
      // Render particle trails
      for (const p of this.particles) {
        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          
          for (let i = 1; i < p.trail.length; i++) {
            const trailPoint = p.trail[i];
            ctx.lineTo(trailPoint.x, trailPoint.y);
          }
          
          ctx.strokeStyle = p.color + '40';
          ctx.lineWidth = p.size * 0.5;
          ctx.stroke();
        }
      }
      
      // Render particles
      for (const p of this.particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        // Draw different shapes based on particle type
        if (p.color.includes('FFD700')) { // Golden particles
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
          
          // Inner glow
          ctx.globalAlpha = p.life * 0.5;
          ctx.fillStyle = '#FFF9C4';
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.color.includes('FF6B6B')) { // Heart particles
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.bezierCurveTo(p.size, -p.size, p.size, p.size * 0.3, 0, p.size);
          ctx.bezierCurveTo(-p.size, p.size * 0.3, -p.size, -p.size, 0, -p.size);
          ctx.fill();
        } else if (p.color.includes('4285F4')) { // Shield particles
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.globalAlpha = p.life * 0.7;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Default circular particle
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      
      ctx.restore();
    }
    
    clear() {
      for (const p of this.particles) {
        this.particlePool.release(p);
      }
      this.particles.length = 0;
      this.emitters.length = 0;
    }
    
    getCount() {
      return this.particles.length;
    }
  }

  // Score Popup System
  class ScorePopupSystem {
    constructor() {
      this.popups = [];
      this.popupPool = new ObjectPool(
        () => ({
          x: 0, y: 0, value: 0, type: 'normal', life: 1,
          velocity: { x: 0, y: -2 }, scale: 1, rotation: 0
        }),
        (p) => {
          p.x = 0; p.y = 0; p.value = 0; p.type = 'normal';
          p.life = 1; p.velocity = { x: 0, y: -2 }; p.scale = 1; p.rotation = 0;
        }
      );
    }
    
    create(x, y, value, type = 'normal') {
      const popup = this.popupPool.get();
      popup.x = x;
      popup.y = y;
      popup.value = value;
      popup.type = type;
      popup.life = 1;
      popup.velocity = {
        x: (Math.random() - 0.5) * 1.5,
        y: -2 - Math.random() * 1.5
      };
      popup.scale = 1;
      popup.rotation = (Math.random() - 0.5) * 0.2;
      
      // Different initial values based on type
      switch (type) {
        case 'golden':
          popup.scale = 1.3;
          popup.velocity.y *= 1.2;
          break;
        case 'combo':
          popup.scale = 1.5;
          popup.velocity.y *= 1.5;
          break;
        case 'power':
          popup.scale = 1.2;
          break;
      }
      
      this.popups.push(popup);
      
      // Create visual DOM element for screen readers
      if (window.siteManager && window.siteManager.toast) {
        const message = `+${value} points${type === 'golden' ? ' (Golden Pot!)' : type === 'combo' ? ' (Combo!)' : ''}`;
        window.siteManager.toast.show(message, 'info', 1000);
      }
      
      return popup;
    }
    
    update(dt) {
      for (let i = this.popups.length - 1; i >= 0; i--) {
        const popup = this.popups[i];
        
        // Update position
        popup.x += popup.velocity.x * dt;
        popup.y += popup.velocity.y * dt;
        
        // Add some horizontal drift
        popup.velocity.x *= 0.99;
        
        // Update scale and rotation
        popup.scale = Math.max(0.5, popup.scale - 0.01 * dt);
        popup.rotation *= 0.95;
        
        // Fade out
        popup.life -= 0.02 * dt;
        
        if (popup.life <= 0) {
          this.popupPool.release(popup);
          this.popups.splice(i, 1);
        }
      }
    }
    
    render(ctx) {
      ctx.save();
      
      for (const popup of this.popups) {
        ctx.globalAlpha = Math.max(0, popup.life);
        ctx.translate(popup.x, popup.y);
        ctx.scale(popup.scale, popup.scale);
        ctx.rotate(popup.rotation);
        
        // Choose color and style based on type
        let color, shadow;
        switch (popup.type) {
          case 'golden':
            color = '#FFD700';
            shadow = 'rgba(255, 215, 0, 0.7)';
            break;
          case 'combo':
            color = '#4CAF50';
            shadow = 'rgba(76, 175, 80, 0.7)';
            break;
          case 'power':
            color = '#9C27B0';
            shadow = 'rgba(156, 39, 176, 0.7)';
            break;
          default:
            color = '#FFD54F';
            shadow = 'rgba(255, 213, 79, 0.7)';
        }
        
        // Draw shadow
        ctx.shadowColor = shadow;
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 2;
        
        // Draw text
        ctx.font = `bold ${18 + (popup.type === 'combo' ? 6 : 0)}px 'Playfair Display', serif`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${popup.value}`, 0, 0);
        
        // Add extra effect for combos
        if (popup.type === 'combo') {
          ctx.globalAlpha = popup.life * 0.5;
          ctx.font = 'bold 14px Arial';
          ctx.fillText('COMBO!', 0, 20);
        }
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      
      ctx.restore();
    }
    
    clear() {
      for (const popup of this.popups) {
        this.popupPool.release(popup);
      }
      this.popups.length = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Enhanced Honey Catch Game
  // ---------------------------------------------------------------------------
  function EnhancedHoneyCatchGame() {
    console.log('[HoneyCatch] Ultimate Enhanced Edition Initializing…');

    const PLAYER_GROUND_OFFSET = 70;
    const MAX_TRAIL_LENGTH = 8;
    const SAVE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    const PERFORMANCE_MONITORING = true;

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
      powerPreference: 'high-performance'
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

    // Core game elements
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
    
    // Enhanced UI elements
    const fpsSpan = document.createElement('span');
    fpsSpan.id = 'catch-fps';
    fpsSpan.textContent = '60';
    
    // Add FPS to HUD if it exists
    const hudStats = document.querySelector('.game-hud');
    if (hudStats) {
      const fpsStat = document.createElement('span');
      fpsStat.className = 'hud-stat';
      fpsStat.innerHTML = '<span class="hud-pill">FPS: <span id="catch-fps">60</span></span>';
      hudStats.appendChild(fpsStat);
    }

    // Create additional UI elements if they don't exist
    const createButton = (id, icon, text, className = 'btn-secondary') => {
      let btn = getElement(id);
      if (!btn && card) {
        btn = document.createElement('button');
        btn.id = id;
        btn.className = `${className} btn-small`;
        btn.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
        btn.setAttribute('aria-label', text);
        
        let controls = document.querySelector('.game-extra-controls');
        if (!controls) {
          const gameControls = document.querySelector('.game-controls');
          if (gameControls) {
            controls = document.createElement('div');
            controls.className = 'game-extra-controls';
            gameControls.appendChild(controls);
          }
        }
        
        if (controls) {
          controls.appendChild(btn);
        }
      }
      return btn;
    };

    const statsBtn = createButton('stats-button', 'fa-chart-bar', 'Stats');
    const saveBtn = createButton('save-button', 'fa-save', 'Save');
    const shareBtn = createButton('share-button', 'fa-share-alt', 'Share');
    const restartBtn = createButton('restart-button', 'fa-rotate-right', 'Restart');

    // Game Modes with enhanced properties
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
        color: '#4CAF50',
        difficultyCurve: 0.8,
        beeAggression: 0.3
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
        color: '#2196F3',
        difficultyCurve: 1.0,
        beeAggression: 0.5
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
        color: '#FF5722',
        difficultyCurve: 1.3,
        beeAggression: 0.7
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

    // Object Pools with optimized sizes
    const potPool = new ObjectPool(
      () => ({ 
        x: 0, y: 0, radius: 14, speed: 0, type: 'normal', 
        wobble: 0, baseSpeed: 0, wobbleSpeed: 0.02, rotation: 0,
        glow: 0, collected: false, trail: []
      }),
      (obj) => { 
        obj.x = 0; obj.y = 0; obj.type = 'normal'; 
        obj.glow = 0; obj.collected = false; obj.trail = [];
      },
      40
    );

    const beePool = new ObjectPool(
      () => ({ 
        x: 0, y: 0, radius: 12, speed: 0, type: 'normal', 
        wobble: 0, vx: 0, baseSpeed: 0, wobbleSpeed: 0.03, 
        rotation: 0, aggression: 0, targetX: 0, trail: []
      }),
      (obj) => { 
        obj.x = 0; obj.y = 0; obj.type = 'normal'; obj.vx = 0; 
        obj.aggression = 0; obj.targetX = 0; obj.trail = [];
      },
      30
    );

    const powerUpPool = new ObjectPool(
      () => ({ 
        x: 0, y: 0, radius: 14, speed: 0, type: 'heart', 
        wobble: 0, rotation: 0, glow: 0, pulse: 0, trail: []
      }),
      (obj) => { 
        obj.x = 0; obj.y = 0; obj.type = 'heart'; 
        obj.glow = 0; obj.pulse = 0; obj.trail = [];
      },
      20
    );

    // -------------------------------------------------------------------------
    // Game State Object with enhanced properties
    // -------------------------------------------------------------------------
    const state = {
      // Game status
      running: false,
      paused: false,
      gameOver: false,
      countdown: false,
      initialized: false,
      
      // Player stats
      score: 0,
      timeLeft: 60,
      lives: 3,
      combos: 0,
      multiplier: 1,
      streak: 0,
      lastCatchTime: 0,
      totalBonuses: 0,
      perfectCatches: 0,
      missedPots: 0,
      highestMultiplier: 1,
      
      // Player object with enhanced properties
      pooh: {
        x: 0,
        y: 0,
        width: 58,
        height: 58,
        targetX: 0,
        speed: 12,
        trail: [],
        dashCooldown: 0,
        dashPower: 0,
        invincibleFlash: 0,
        celebration: false,
        celebrationTime: 0
      },
      
      // Power-ups with enhanced tracking
      invincible: false,
      invincibleUntil: 0,
      doublePoints: false,
      doublePointsUntil: 0,
      slowMo: false,
      slowMoUntil: 0,
      honeyRushUntil: 0,
      magnet: false,
      magnetUntil: 0,
      activePowerUps: new Set(),
      
      // Game objects (using pools)
      pots: [],
      bees: [],
      powerUps: [],
      particles: [],
      scorePopups: [],
      
      // Game settings
      mode: 'calm',
      modeCfg: MODES.calm,
      difficulty: 0,
      bestScore: 0,
      totalGamesPlayed: 0,
      
      // Enhanced statistics
      stats: {
        potsCaught: 0,
        goldenPotsCaught: 0,
        beesAvoided: 0,
        powerUpsCollected: 0,
        gamesPlayed: 0,
        totalScore: 0,
        totalTimePlayed: 0,
        highestCombo: 0,
        highestStreak: 0,
        perfectGames: 0,
        totalBeesEncountered: 0,
        totalPowerUpsSpawned: 0,
        averageScore: 0,
        fastestGame: Infinity,
        longestGame: 0
      },
      
      // Timing
      lastUpdateTime: nowMs(),
      frameId: null,
      timerId: null,
      countdownId: null,
      overlayTimer: null,
      gameStartTime: 0,
      gameElapsedTime: 0,
      performanceSampleTime: 0,
      
      // Controls
      joyActive: false,
      joyPointerId: null,
      joyCenterX: 0,
      joyCenterY: 0,
      joyDx: 0,
      joyDy: 0,
      keys: {},
      isPointerDown: false,
      lastInputWasTouch: false,
      inputSmoothing: 0.22,
      
      // Gamepad
      gamepadIndex: null,
      gamepadPolling: false,
      
      // Performance
      performanceStats: {
        objectCount: 0,
        frameRate: 60,
        averageFrameTime: 16.67,
        performanceGrade: 'A',
        lastOptimization: 0,
        memoryUsage: 0
      },
      
      // Visual effects
      screenShake: 0,
      screenShakeIntensity: 0,
      colorShift: 0,
      postProcessing: {
        bloom: false,
        bloomIntensity: 0,
        vignette: true,
        chromaticAberration: false
      },
      
      // Achievement tracking
      achievements: {
        firstGame: false,
        highScore: false,
        perfectGame: false,
        comboMaster: false,
        speedRunner: false,
        collector: false
      },
      
      // Session data
      sessionId: Date.now().toString(36) + Math.random().toString(36).substr(2),
      sessionStartTime: Date.now(),
      sessionScore: 0
    };

    // Enhanced particle system
    const particles = new ParticleSystem(isMobileDevice() ? 150 : 300);
    
    // Score popup system
    const scorePopups = new ScorePopupSystem();
    
    // Frame limiter with adaptive FPS
    const frameLimiter = new FrameRateLimiter(isMobileDevice() ? 30 : 60);

    // -------------------------------------------------------------------------
    // Enhanced Power-ups Configuration
    // -------------------------------------------------------------------------
    const POWER_UPS = {
      heart: { 
        color: '#FF6B6B', 
        icon: '❤️', 
        duration: 0,
        value: 1,
        name: 'Extra Heart',
        rarity: 0.2,
        effect: 'heal'
      },
      shield: { 
        color: '#4285F4', 
        icon: '🛡️', 
        duration: 5000,
        name: 'Shield',
        rarity: 0.15,
        effect: 'invincibility'
      },
      clock: { 
        color: '#4CAF50', 
        icon: '⏱️', 
        duration: 0,
        value: 10,
        name: 'Bonus Time',
        rarity: 0.25,
        effect: 'time'
      },
      star: { 
        color: '#FFD700', 
        icon: '⭐', 
        duration: 8000,
        name: 'Double Points',
        rarity: 0.15,
        effect: 'multiplier'
      },
      lightning: { 
        color: '#9C27B0', 
        icon: '⚡', 
        duration: 6000,
        name: 'Slow Motion',
        rarity: 0.1,
        effect: 'slowmo'
      },
      magnet: { 
        color: '#FF9800', 
        icon: '🧲', 
        duration: 7000,
        name: 'Honey Magnet',
        rarity: 0.1,
        effect: 'magnet'
      },
      bomb: { 
        color: '#F44336', 
        icon: '💣', 
        duration: 0,
        name: 'Bee Bomb',
        rarity: 0.05,
        effect: 'clearBees'
      }
    };

    // -------------------------------------------------------------------------
    // Enhanced Statistics Management
    // -------------------------------------------------------------------------
    function loadStatistics() {
      try {
        const saved = localStorage.getItem('honeyCatch_stats_v2');
        if (saved) {
          const statsData = JSON.parse(saved);
          Object.assign(state.stats, statsData);
        }
      } catch (e) {
        console.warn('[HoneyCatch] Could not load statistics:', e);
      }
    }

    function saveStatistics() {
      try {
        // Calculate averages
        if (state.stats.gamesPlayed > 0) {
          state.stats.averageScore = Math.round(state.stats.totalScore / state.stats.gamesPlayed);
        }
        
        localStorage.setItem('honeyCatch_stats_v2', JSON.stringify(state.stats));
        return true;
      } catch (e) {
        console.warn('[HoneyCatch] Could not save statistics:', e);
        return false;
      }
    }

    function updateStat(type, value = 1) {
      if (state.stats[type] !== undefined) {
        state.stats[type] += value;
        
        // Update high scores
        if (type === 'highestCombo' && value > state.stats.highestCombo) {
          state.stats.highestCombo = value;
        }
        if (type === 'highestStreak' && value > state.stats.highestStreak) {
          state.stats.highestStreak = value;
        }
        
        saveStatistics();
      }
    }

    // -------------------------------------------------------------------------
    // Save/Load Game State
    // -------------------------------------------------------------------------
    function saveGameState() {
      if (!state.running || state.gameOver) return false;
      
      const saveData = {
        score: state.score,
        timeLeft: state.timeLeft,
        lives: state.lives,
        mode: state.mode,
        difficulty: state.difficulty,
        combos: state.combos,
        streak: state.streak,
        multiplier: state.multiplier,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      try {
        localStorage.setItem('honeyCatch_save', JSON.stringify(saveData));
        setStatus('Game saved', 'success');
        announceToScreenReader('Game saved');
        return true;
      } catch (e) {
        console.warn('[HoneyCatch] Could not save game:', e);
        setStatus('Failed to save game', 'error');
        return false;
      }
    }

    function loadGameState() {
      try {
        const saved = localStorage.getItem('honeyCatch_save');
        if (!saved) return false;
        
        const data = JSON.parse(saved);
        
        // Check if save is not too old
        if (Date.now() - data.timestamp > SAVE_TIMEOUT) {
          localStorage.removeItem('honeyCatch_save');
          setStatus('Saved game expired', 'warning');
          return false;
        }
        
        // Check version compatibility
        if (data.version !== '1.0') {
          setStatus('Save file incompatible', 'warning');
          return false;
        }
        
        if (confirm('Load saved game? Current progress will be lost.')) {
          state.score = data.score;
          state.timeLeft = data.timeLeft;
          state.lives = data.lives;
          state.difficulty = data.difficulty || 0;
          state.combos = data.combos || 0;
          state.streak = data.streak || 0;
          state.multiplier = data.multiplier || 1;
          setGameMode(data.mode);
          
          updateHUD();
          setStatus('Game loaded', 'success');
          announceToScreenReader('Game loaded');
          
          return true;
        }
      } catch (e) {
        console.warn('[HoneyCatch] Could not load game:', e);
        setStatus('Failed to load game', 'error');
      }
      return false;
    }

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
        pauseBtn.setAttribute('aria-label', state.paused ? 'Resume game' : 'Pause game');
      }

      // Update progress bars
      const timePercent = clamp((state.timeLeft / state.modeCfg.time) * 100, 0, 100);
      if (timeBar) {
        timeBar.style.width = `${timePercent}%`;
        timeBar.style.setProperty('--w', `${timePercent}%`);
        timeBar.style.backgroundColor = state.modeCfg.color;
      }

      const lifePercent = clamp((state.lives / state.modeCfg.lives) * 100, 0, 100);
      if (lifeBar) {
        lifeBar.style.width = `${lifePercent}%`;
        lifeBar.style.setProperty('--w', `${lifePercent}%`);
        lifeBar.style.backgroundColor = lifePercent < 30 ? '#FF6B6B' : '#4CAF50';
      }

      // Update performance stats
      state.performanceStats.objectCount = 
        state.pots.length + state.bees.length + state.powerUps.length + particles.getCount();
      state.performanceStats.frameRate = frameLimiter.getFPS();
      state.performanceStats.averageFrameTime = frameLimiter.getAverageFrameTime();
    }

    function setStatus(message, type = 'info') {
      if (!statusEl) return;

      statusEl.textContent = message;
      statusEl.className = 'tip';

      const typeClass = {
        success: 'tip--success',
        error: 'tip--error',
        warning: 'tip--warning',
        info: ''
      }[type];

      if (typeClass) {
        statusEl.classList.add(typeClass);
      }

      // Announce to screen reader for important messages
      if (type === 'error' || type === 'success') {
        announceToScreenReader(message);
      }

      // Auto-clear after 3 seconds for non-persistent messages
      if (type !== 'persistent') {
        clearTimeout(setStatus.timer);
        setStatus.timer = setTimeout(() => {
          if (statusEl && !state.running) {
            statusEl.textContent = 'Ready to play';
            statusEl.className = 'tip';
          }
        }, 3000);
      }
    }

    function showOverlay(title, subtitle, duration = 1500) {
      if (!overlay || !overlayLine || !overlayHint) return;
      
      overlayLine.textContent = title;
      overlayHint.textContent = subtitle;
      overlay.classList.add('active');
      
      // Announce to screen reader
      announceToScreenReader(`${title}. ${subtitle}`, 'assertive');
      
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

    function showStatisticsModal() {
      const modal = document.createElement('div');
      modal.className = 'stats-modal';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      modal.style.display = 'flex';
      modal.style.justifyContent = 'center';
      modal.style.alignItems = 'center';
      modal.style.zIndex = '1000';
      
      modal.innerHTML = `
        <div class="stats-content" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
          border-radius: 15px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          color: white;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 style="margin: 0; font-size: 1.5rem; color: white;">Game Statistics</h3>
            <button id="close-stats" style="
              background: none;
              border: none;
              color: white;
              font-size: 1.5rem;
              cursor: pointer;
              padding: 0.5rem;
            ">×</button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div class="stat-card" style="background: rgba(255, 255, 255, 0.1); padding: 1rem; border-radius: 10px;">
              <div style="font-size: 0.9rem; opacity: 0.9;">Games Played</div>
              <div style="font-size: 2rem; font-weight: bold;">${state.stats.gamesPlayed || 0}</div>
            </div>
            <div class="stat-card" style="background: rgba(255, 255, 255, 0.1); padding: 1rem; border-radius: 10px;">
              <div style="font-size: 0.9rem; opacity: 0.9;">Total Score</div>
              <div style="font-size: 2rem; font-weight: bold;">${state.stats.totalScore || 0}</div>
            </div>
            <div class="stat-card" style="background: rgba(255, 255, 255, 0.1); padding: 1rem; border-radius: 10px;">
              <div style="font-size: 0.9rem; opacity: 0.9;">Honey Pots</div>
              <div style="font-size: 2rem; font-weight: bold;">${state.stats.potsCaught || 0}</div>
            </div>
            <div class="stat-card" style="background: rgba(255, 255, 255, 0.1); padding: 1rem; border-radius: 10px;">
              <div style="font-size: 0.9rem; opacity: 0.9;">Golden Pots</div>
              <div style="font-size: 2rem; font-weight: bold;">${state.stats.goldenPotsCaught || 0}</div>
            </div>
            <div class="stat-card" style="background: rgba(255, 255, 255, 0.1); padding: 1rem; border-radius: 10px;">
              <div style="font-size: 0.9rem; opacity: 0.9;">Power-ups</div>
              <div style="font-size: 2rem; font-weight: bold;">${state.stats.powerUpsCollected || 0}</div>
            </div>
            <div class="stat-card" style="background: rgba(255, 255, 255, 0.1); padding: 1rem; border-radius: 10px;">
              <div style="font-size: 0.9rem; opacity: 0.9;">Highest Combo</div>
              <div style="font-size: 2rem; font-weight: bold;">${state.stats.highestCombo || 0}</div>
            </div>
            <div class="stat-card" style="background: rgba(255, 255, 255, 0.1); padding: 1rem; border-radius: 10px;">
              <div style="font-size: 0.9rem; opacity: 0.9;">Highest Streak</div>
              <div style="font-size: 2rem; font-weight: bold;">${state.stats.highestStreak || 0}</div>
            </div>
            <div class="stat-card" style="background: rgba(255, 255, 255, 0.1); padding: 1rem; border-radius: 10px;">
              <div style="font-size: 0.9rem; opacity: 0.9;">Bees Avoided</div>
              <div style="font-size: 2rem; font-weight: bold;">${state.stats.beesAvoided || 0}</div>
            </div>
          </div>
          <div style="margin-top: 1.5rem; text-align: center;">
            <div style="font-size: 0.9rem; opacity: 0.8;">Performance</div>
            <div style="display: flex; justify-content: space-around; margin-top: 0.5rem;">
              <span>Objects: ${state.performanceStats.objectCount}</span>
              <span>FPS: ${state.performanceStats.frameRate}</span>
              <span>Frame: ${Math.round(state.performanceStats.averageFrameTime)}ms</span>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Close button functionality
      const closeBtn = modal.querySelector('#close-stats');
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      // Close on outside click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
      
      // Close on Escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          document.body.removeChild(modal);
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
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
        btn.setAttribute('aria-pressed', btn.dataset.catchMode === modeKey);
      });
      
      if (modeDescription) {
        modeDescription.textContent = state.modeCfg.hint;
      }
      
      // Update background
      drawBackground();
      
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

    function shareScore() {
      const text = `I scored ${state.score} points in Honey Pot Catch (${state.modeCfg.label} mode)! Can you beat me?`;
      const url = window.location.href;
      
      if (navigator.share) {
        navigator.share({
          title: 'Honey Pot Catch',
          text: text,
          url: url
        }).then(() => {
          setStatus('Score shared!', 'success');
        }).catch((err) => {
          console.log('Sharing cancelled:', err);
        });
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(`${text} ${url}`)
          .then(() => {
            setStatus('Score copied to clipboard!', 'success');
            announceToScreenReader('Score copied to clipboard');
          })
          .catch(() => {
            setStatus('Failed to copy score', 'error');
          });
      } else {
        // Fallback: open mailto link
        const mailtoLink = `mailto:?subject=My Honey Pot Catch Score&body=${encodeURIComponent(text + ' ' + url)}`;
        window.open(mailtoLink, '_blank');
        setStatus('Share dialog opened', 'info');
      }
    }

    // -------------------------------------------------------------------------
    // Background Drawing
    // -------------------------------------------------------------------------
    function drawBackground() {
      if (!bgCtx) return;
      
      // Set background canvas size
      bgCanvas.width = W;
      bgCanvas.height = H;
      
      // Clear background
      bgCtx.clearRect(0, 0, W, H);
      
      // Create gradient background
      const gradient = bgCtx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(0.7, '#98D8E8');
      gradient.addColorStop(1, '#B0E0E6');
      
      bgCtx.fillStyle = gradient;
      bgCtx.fillRect(0, 0, W, H);
      
      // Draw clouds
      drawClouds();
      
      // Draw ground
      drawGround();
      
      // Draw trees
      drawTrees();
    }
    
    function drawClouds() {
      const cloudCount = Math.floor(W / 200);
      for (let i = 0; i < cloudCount; i++) {
        const x = (i * W / cloudCount + (Date.now() * 0.01) % W) % (W + 200) - 100;
        const y = 40 + Math.sin(i * 2.5) * 20;
        const size = 30 + Math.sin(i * 3) * 10;
        
        bgCtx.save();
        bgCtx.globalAlpha = 0.8;
        bgCtx.fillStyle = '#FFFFFF';
        
        // Draw cloud with multiple circles
        bgCtx.beginPath();
        bgCtx.arc(x, y, size, 0, Math.PI * 2);
        bgCtx.arc(x + size * 0.7, y - size * 0.3, size * 0.8, 0, Math.PI * 2);
        bgCtx.arc(x + size * 1.4, y, size * 0.9, 0, Math.PI * 2);
        bgCtx.arc(x + size * 0.7, y + size * 0.3, size * 0.7, 0, Math.PI * 2);
        bgCtx.fill();
        bgCtx.restore();
      }
    }
    
    function drawGround() {
      const groundY = H - PLAYER_GROUND_OFFSET + 20;
      
      // Grass
      bgCtx.fillStyle = '#7CFC00';
      bgCtx.fillRect(0, groundY, W, H - groundY);
      
      // Grass details
      bgCtx.strokeStyle = '#32CD32';
      bgCtx.lineWidth = 1;
      for (let i = 0; i < W; i += 3) {
        const height = 3 + Math.sin(i * 0.1 + Date.now() * 0.002) * 2;
        bgCtx.beginPath();
        bgCtx.moveTo(i, groundY);
        bgCtx.lineTo(i, groundY - height);
        bgCtx.stroke();
      }
    }
    
    function drawTrees() {
      const treeCount = Math.floor(W / 150);
      for (let i = 0; i < treeCount; i++) {
        const x = (i * W / treeCount) % W;
        const y = H - PLAYER_GROUND_OFFSET + 10;
        const height = 40 + Math.sin(i * 5) * 10;
        const width = 15 + Math.sin(i * 3) * 5;
        
        // Tree trunk
        bgCtx.fillStyle = '#8B4513';
        bgCtx.fillRect(x - width/2, y - height, width, height);
        
        // Tree foliage
        bgCtx.fillStyle = '#228B22';
        bgCtx.beginPath();
        bgCtx.arc(x, y - height - 15, 25, 0, Math.PI * 2);
        bgCtx.fill();
      }
    }

    // -------------------------------------------------------------------------
    // Spawn Functions with Object Pooling
    // -------------------------------------------------------------------------
    function spawnHoneyPot() {
      const rushActive = Date.now() < state.honeyRushUntil;
      const goldenChance = 0.15 + (state.difficulty * 0.02) + (rushActive ? 0.3 : 0);
      const isGolden = Math.random() < goldenChance;
      
      const pot = potPool.get();
      pot.x = 20 + Math.random() * (W - 40);
      pot.y = -20;
      pot.radius = 14;
      pot.baseSpeed = (2 + Math.random() * 1.5) * state.modeCfg.speedScale;
      pot.speed = pot.baseSpeed;
      pot.type = isGolden ? 'golden' : 'normal';
      pot.wobble = Math.random() * Math.PI * 2;
      
      state.pots.push(pot);
      return pot;
    }

    function spawnBee() {
      const angryChance = state.difficulty >= 2 ? 0.2 : 0.1;
      const isAngry = Math.random() < angryChance;
      
      const bee = beePool.get();
      bee.x = 20 + Math.random() * (W - 40);
      bee.y = -20;
      bee.radius = 12;
      bee.baseSpeed = (2.5 + Math.random() * 1.5) * state.modeCfg.speedScale;
      bee.speed = bee.baseSpeed;
      bee.type = isAngry ? 'angry' : 'normal';
      bee.wobble = Math.random() * Math.PI * 2;
      bee.vx = 0;
      
      state.bees.push(bee);
      updateStat('beesAvoided', 1);
      return bee;
    }

    function spawnPowerUp() {
      const keys = Object.keys(POWER_UPS);
      const type = keys[Math.floor(Math.random() * keys.length)];
      
      const powerUp = powerUpPool.get();
      powerUp.x = 24 + Math.random() * (W - 48);
      powerUp.y = -20;
      powerUp.radius = 14;
      powerUp.speed = (1.8 + Math.random() * 1) * state.modeCfg.speedScale;
      powerUp.type = type;
      powerUp.wobble = Math.random() * Math.PI * 2;
      
      state.powerUps.push(powerUp);
      return powerUp;
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
      
      updateStat('powerUpsCollected', 1);
      
      switch (type) {
        case 'heart':
          state.lives = Math.min(state.modeCfg.lives + 2, state.lives + 1);
          showOverlay('Extra Heart!', 'Pooh feels refreshed', 1000);
          announceToScreenReader('Extra heart collected');
          break;
          
        case 'shield':
          state.invincible = true;
          state.invincibleUntil = now + config.duration;
          showOverlay('Shield Activated!', 'Bees can\'t hurt you', 1000);
          announceToScreenReader('Shield activated');
          break;
          
        case 'clock':
          state.timeLeft = Math.min(state.modeCfg.time, state.timeLeft + config.value);
          showOverlay('Bonus Time!', `+${config.value} seconds`, 1000);
          announceToScreenReader(`Bonus time added: ${config.value} seconds`);
          break;
          
        case 'star':
          state.doublePoints = true;
          state.doublePointsUntil = now + config.duration;
          showOverlay('Double Points!', 'All honey is extra sweet', 1000);
          announceToScreenReader('Double points activated');
          break;
          
        case 'lightning':
          state.slowMo = true;
          state.slowMoUntil = now + config.duration;
          showOverlay('Slow Motion!', 'Everything slows down', 1000);
          announceToScreenReader('Slow motion activated');
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
    function drawPoohTrail() {
      if (!state.running || state.paused) return;
      
      // Add current position to trail
      state.pooh.trail.push({
        x: state.pooh.x,
        y: state.pooh.y - state.pooh.height * 0.4,
        alpha: 1,
        size: state.pooh.width * 0.3
      });
      
      // Keep trail length manageable
      if (state.pooh.trail.length > MAX_TRAIL_LENGTH) {
        state.pooh.trail.shift();
      }
      
      // Draw trail with fading effect
      ctx.save();
      state.pooh.trail.forEach((pos, i) => {
        const alpha = (i / state.pooh.trail.length) * 0.3;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FF9800';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    function drawPooh() {
      const x = state.pooh.x;
      const y = state.pooh.y;
      const w = state.pooh.width;
      const h = state.pooh.height;
      
      // Draw trail first (behind Pooh)
      drawPoohTrail();
      
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
      ctx.fillStyle = state.modeCfg.color || '#D62E2E';
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
    function updateGame(frameDt) {
      if (!state.running || state.paused || state.gameOver) return;

      // Apply slow motion if active
      const timeScale = state.slowMo ? 0.5 : 1.0;
      const scaledDt = frameDt * timeScale;

      // Update Pooh position with smoothing
      state.pooh.targetX = clamp(state.pooh.targetX, state.pooh.width/2, W - state.pooh.width/2);
      state.pooh.x = smoothLerp(state.pooh.x, state.pooh.targetX, 0.22);
      
      // Update power-up timers
      const now = Date.now();
      if (state.invincible && now > state.invincibleUntil) {
        state.invincible = false;
        announceToScreenReader('Shield expired');
      }
      if (state.doublePoints && now > state.doublePointsUntil) {
        state.doublePoints = false;
        announceToScreenReader('Double points expired');
      }
      if (state.slowMo && now > state.slowMoUntil) {
        state.slowMo = false;
        announceToScreenReader('Slow motion expired');
      }
      
      // Update difficulty
      updateDifficulty();
      
      // Spawn objects
      updateSpawning(scaledDt);
      
      // Update objects
      updateObjects(scaledDt);
      
      // Update particles
      particles.update(scaledDt);
      scorePopups.update(scaledDt);
      
      // Update combo timer
      if (state.combos > 0 && now - state.lastCatchTime > 2000) {
        state.combos = 0;
        state.multiplier = 1;
        state.streak = 0;
        updateHUD();
      }
    }

    function updateDifficulty() {
      const elapsed = state.modeCfg.time - state.timeLeft;
      
      // Progressive difficulty scaling
      if (elapsed > 45 && state.difficulty < 3) {
        state.difficulty = 3;
        showOverlay('Extreme!', 'Maximum speed!', 1000);
        announceToScreenReader('Maximum difficulty!');
      } else if (elapsed > 30 && state.difficulty < 2) {
        state.difficulty = 2;
        showOverlay('Hard!', 'Bees are faster!', 1000);
        announceToScreenReader('Hard difficulty!');
      } else if (elapsed > 15 && state.difficulty < 1) {
        state.difficulty = 1;
        showOverlay('Moderate', 'Game is speeding up!', 1000);
        announceToScreenReader('Moderate difficulty');
      }
    }

    function updateSpawning(dt) {
      const rushActive = Date.now() < state.honeyRushUntil;
      const spawnRate = state.modeCfg.spawnScale * (1 + state.difficulty * 0.2);

      // Honey pots
      const honeyChance = 0.02 * spawnRate * dt;
      if (state.pots.length < 12 && Math.random() < honeyChance) {
        spawnHoneyPot();
      }

      // Bees (less during honey rush)
      const beeChance = (rushActive ? 0.008 : 0.012) * spawnRate * dt;
      if (state.bees.length < 8 && Math.random() < beeChance) {
        spawnBee();
      }

      // Power-ups
      const powerChance = 0.004 * spawnRate * dt;
      if (state.powerUps.length < 4 && Math.random() < powerChance) {
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
        
        // Apply difficulty speed increase
        if (state.difficulty > 0) {
          pot.speed = pot.baseSpeed * (1 + state.difficulty * 0.2);
        }
        
        // Check collision with Pooh
        if (checkPoohCollision(pot.x, pot.y, pot.radius)) {
          handlePotCollected(pot, i);
          continue;
        }
        
        // Remove if off screen
        if (pot.y > H + 30) {
          potPool.release(pot);
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
        
        // Apply difficulty speed increase
        if (state.difficulty > 0) {
          bee.speed = bee.baseSpeed * (1 + state.difficulty * 0.3);
        }
        
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
          beePool.release(bee);
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
          powerUpPool.release(pu);
          state.powerUps.splice(i, 1);
          continue;
        }
        
        // Remove if off screen
        if (pu.y > H + 30) {
          powerUpPool.release(pu);
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
      
      // Create score popup
      scorePopups.create(pot.x, pot.y, points, isGolden ? 'golden' : state.combos >= 5 ? 'combo' : 'normal');
      
      // Update statistics
      updateStat('potsCaught', 1);
      updateStat('totalScore', points);
      if (isGolden) {
        updateStat('goldenPotsCaught', 1);
      }
      
      // Update combo
      const now = Date.now();
      if (now - state.lastCatchTime < 2000) {
        state.combos++;
        state.streak++;
        state.multiplier = clamp(1 + state.combos * 0.15, 1, 5);
        
        // Update highest combo
        if (state.combos > state.stats.highestCombo) {
          updateStat('highestCombo', state.combos);
        }
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
        announceToScreenReader('Honey rush activated!');
      }
      
      // Update highest streak
      if (state.streak > state.stats.highestStreak) {
        updateStat('highestStreak', state.streak);
      }
      
      // Visual effects
      particles.burst(pot.x, pot.y, isGolden ? 20 : 12, 
                     isGolden ? '#FFD700' : '#FFD54F',
                     { size: isGolden ? 5 : 3, speed: 4 });
      
      // Release pot back to pool
      potPool.release(pot);
      state.pots.splice(index, 1);
      
      // Update HUD
      updateHUD();
      
      // Audio feedback (if available)
      if (window.audioManager && typeof window.audioManager.playGameSound === 'function') {
        window.audioManager.playGameSound(isGolden ? 'golden' : 'collect');
      } else {
        // Fallback: play simple tones
        try {
          const audioContext = window.audioContext || (window.AudioContext && new AudioContext());
          if (audioContext) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = isGolden ? 800 : 600;
            gainNode.gain.value = 0.1;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
          }
        } catch (e) {
          console.log('Audio fallback failed:', e);
        }
      }
      
      // Announce to screen reader
      announceToScreenReader(`${isGolden ? 'Golden pot' : 'Honey pot'} collected! ${points} points`);
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
      
      // Release bee back to pool
      beePool.release(bee);
      state.bees.splice(index, 1);
      
      // Update HUD
      updateHUD();
      
      // Show feedback
      if (state.lives <= 0) {
        endGame(false);
      } else {
        const livesText = `${state.lives} ${state.lives === 1 ? 'life' : 'lives'} left`;
        showOverlay('Ouch!', `Bee stung Pooh! ${livesText}`, 1200);
        announceToScreenReader(`Bee stung! ${livesText}`);
        
        // Shake effect
        if (card) {
          card.style.animation = 'shake 0.3s ease-in-out';
          setTimeout(() => {
            card.style.animation = '';
          }, 300);
        }
      }
      
      // Audio feedback (if available)
      if (window.audioManager && typeof window.audioManager.playGameSound === 'function') {
        window.audioManager.playGameSound('damage');
      } else {
        // Fallback
        try {
          const audioContext = window.audioContext || (window.AudioContext && new AudioContext());
          if (audioContext) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 300;
            gainNode.gain.value = 0.1;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
          }
        } catch (e) {
          console.log('Audio fallback failed:', e);
        }
      }
    }

    function renderGame() {
      // Clear canvas
      ctx.clearRect(0, 0, W, H);
      
      // Draw background
      if (bgCanvas && bgCanvas.width > 0 && bgCanvas.height > 0) {
        ctx.drawImage(bgCanvas, 0, 0, W, H);
      }
      
      // Draw game objects
      state.pots.forEach(pot => drawHoneyPot(pot));
      state.bees.forEach(bee => drawBee(bee));
      state.powerUps.forEach(pu => drawPowerUp(pu));
      
      // Draw particles
      particles.render(ctx);
      
      // Draw score popups
      scorePopups.render(ctx);
      
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
      
      // Draw performance overlay (debug mode)
      if (localStorage.getItem('debugMode') === 'true') {
        ctx.save();
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFF';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 2;
        
        const stats = [
          `FPS: ${frameLimiter.getFPS()}`,
          `Objects: ${state.performanceStats.objectCount}`,
          `Pots: ${potPool.getActiveCount()}/${potPool.getPoolSize()}`,
          `Bees: ${beePool.getActiveCount()}/${beePool.getPoolSize()}`,
          `Power-ups: ${powerUpPool.getActiveCount()}/${powerUpPool.getPoolSize()}`,
          `Particles: ${particles.getCount()}`
        ];
        
        stats.forEach((stat, i) => {
          ctx.fillText(stat, W - 10, 20 + i * 16);
        });
        
        ctx.restore();
      }
    }

    // -------------------------------------------------------------------------
    // Game Control Functions
    // -------------------------------------------------------------------------
    function startGame() {
      if (state.running && !state.gameOver) return;
      
      // Try to load saved game first
      if (!state.running && loadGameState()) {
        // Game was loaded, just resume
        state.running = true;
        state.gameOver = false;
        state.paused = false;
        
        showOverlay('Game Loaded!', 'Continue your adventure!', 1000);
        setStatus('Game loaded and resumed', 'success');
        
        // Start game timer
        startGameTimer();
        
        // Start game loop if not already running
        if (!state.frameId) {
          gameLoop();
        }
        return;
      }
      
      // Otherwise start new game
      resetGame();
      
      // Start countdown
      let countdown = 3;
      showOverlay(`Starting in ${countdown}...`, 'Get ready!', 0);
      setStatus('Get ready...', 'warning');
      announceToScreenReader(`Starting in ${countdown}`);
      
      const countdownInterval = setInterval(() => {
        countdown--;
        
        if (countdown > 0) {
          showOverlay(`Starting in ${countdown}...`, 'Get ready!', 0);
          announceToScreenReader(`${countdown}`);
        } else {
          clearInterval(countdownInterval);
          
          // Start the game
          state.running = true;
          state.gameOver = false;
          state.paused = false;
          state.gameStartTime = Date.now();
          
          // Update statistics
          updateStat('gamesPlayed', 1);
          
          showOverlay('Go!', 'Catch honey, avoid bees!', 800);
          setStatus('Game in progress', 'success');
          announceToScreenReader('Game started!');
          
          // Start game timer
          startGameTimer();
          
          // Start game loop if not already running
          if (!state.frameId) {
            gameLoop();
          }
          
          // Audio feedback (if available)
          if (window.audioManager && typeof window.audioManager.playTone === 'function') {
            window.audioManager.playTone([523.25, 659.25, 783.99], 0.15);
          } else {
            // Fallback
            try {
              const audioContext = window.audioContext || (window.AudioContext && new AudioContext());
              if (audioContext) {
                [523.25, 659.25, 783.99].forEach((freq, i) => {
                  setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    oscillator.frequency.value = freq;
                    gainNode.gain.value = 0.1;
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.1);
                  }, i * 100);
                });
              }
            } catch (e) {
              console.log('Audio fallback failed:', e);
            }
          }
        }
      }, 1000);
    }

    function resetGame() {
      // Clear all game objects using pools
      state.pots.forEach(pot => potPool.release(pot));
      state.pots.length = 0;
      
      state.bees.forEach(bee => beePool.release(bee));
      state.bees.length = 0;
      
      state.powerUps.forEach(pu => powerUpPool.release(pu));
      state.powerUps.length = 0;
      
      particles.clear();
      scorePopups.clear();
      
      // Reset game state
      state.score = 0;
      state.timeLeft = state.modeCfg.time;
      state.lives = state.modeCfg.lives;
      state.combos = 0;
      state.multiplier = 1;
      state.streak = 0;
      state.lastCatchTime = 0;
      state.difficulty = 0;
      state.totalBonuses = 0;
      
      // Reset Pooh trail
      state.pooh.trail = [];
      
      // Reset power-ups
      state.invincible = false;
      state.doublePoints = false;
      state.slowMo = false;
      state.honeyRushUntil = 0;
      
      // Reset Pooh position
      state.pooh.x = W / 2;
      state.pooh.y = H - PLAYER_GROUND_OFFSET;
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
        
        // Update total time played
        state.stats.totalTimePlayed++;
        
        updateHUD();
        
        // Auto-save every 30 seconds
        if (state.timeLeft % 30 === 0) {
          saveGameState();
        }
        
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
        announceToScreenReader('Game paused');
        
        // Auto-save when paused
        saveGameState();
      } else {
        hideOverlay();
        setStatus('Game resumed', 'success');
        announceToScreenReader('Game resumed');
      }
      
      updateHUD();
    }

    function endGame(timeExpired) {
      if (!state.running || state.gameOver) return;
      
      state.running = false;
      state.gameOver = true;
      
      // Calculate game duration
      const gameDuration = Date.now() - state.gameStartTime;
      state.stats.totalTimePlayed += Math.floor(gameDuration / 1000);
      
      // Clear timers
      if (state.timerId) {
        clearInterval(state.timerId);
        state.timerId = null;
      }
      
      // Clear saved game
      try {
        localStorage.removeItem('honeyCatch_save');
      } catch (e) {
        console.warn('Could not clear saved game:', e);
      }
      
      // Calculate final score with bonuses
      const bonuses = {
        lives: Math.max(0, state.lives - 1) * 25,
        combo: state.combos >= 10 ? 50 : 0,
        streak: state.streak >= 15 ? 75 : 0,
        difficulty: state.difficulty * 20,
        timeBonus: Math.max(0, Math.floor(state.timeLeft / 5)) * 5
      };
      
      const totalBonus = Object.values(bonuses).reduce((a, b) => a + b, 0);
      state.totalBonuses = totalBonus;
      const finalScore = Math.round((state.score + totalBonus) * state.modeCfg.scoreScale);
      
      // Update total score in stats
      updateStat('totalScore', finalScore);
      
      // Check if new high score
      const isNewBest = saveBestScore(finalScore);
      
      // Save statistics
      saveStatistics();
      
      // Show game over screen
      const message = timeExpired ? "Time's Up!" : "Game Over!";
      const details = `Final Score: ${finalScore}${totalBonus > 0 ? ` (+${totalBonus} bonus)` : ''}${isNewBest ? ' - New Best!' : ''}`;
      
      showOverlay(message, details, 0);
      setStatus(`Game Over - Score: ${finalScore}`, 'error');
      announceToScreenReader(`${message} Final score: ${finalScore} points${isNewBest ? '. New high score!' : ''}`);
      
      // Celebration particles
      particles.burst(W / 2, H / 2, 50, timeExpired ? '#4CAF50' : '#FF9800', {
        size: 6,
        speed: 6,
        gravity: 0.1
      });
      
      // Release all objects back to pools
      state.pots.forEach(pot => potPool.release(pot));
      state.pots.length = 0;
      
      state.bees.forEach(bee => beePool.release(bee));
      state.bees.length = 0;
      
      state.powerUps.forEach(pu => powerUpPool.release(pu));
      state.powerUps.length = 0;
      
      // Audio feedback (if available)
      if (window.audioManager && typeof window.audioManager.playGameSound === 'function') {
        window.audioManager.playGameSound(timeExpired ? 'victory' : 'defeat');
      } else {
        // Fallback
        try {
          const audioContext = window.audioContext || (window.AudioContext && new AudioContext());
          if (audioContext) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = timeExpired ? 1000 : 300;
            gainNode.gain.value = 0.1;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
          }
        } catch (e) {
          console.log('Audio fallback failed:', e);
        }
      }
    }

    // -------------------------------------------------------------------------
    // Input Handling
    // -------------------------------------------------------------------------
    function updateTargetFromClientX(clientX) {
      const rect = canvas.getBoundingClientRect();
      const logicalX = clientX - rect.left;

      state.pooh.targetX = clamp(logicalX, state.pooh.width/2, W - state.pooh.width/2);
    }

    function handlePointerDown(e) {
      if (!state.running || state.paused || state.gameOver) return;

      state.isPointerDown = true;
      state.lastInputWasTouch = e.pointerType === 'touch';

      updateTargetFromClientX(e.clientX);
    }

    function handlePointerUp() {
      state.isPointerDown = false;
    }

    function handleMouseMove(e) {
      if (!state.running || state.paused || state.gameOver) return;

      const isDragging = state.isPointerDown || e.buttons > 0;

      if (!isDragging) {
        if (state.lastInputWasTouch) return;
        return;
      }

      updateTargetFromClientX(e.clientX);
    }

    function handleTouchStart(e) {
      if (!state.running || state.paused || state.gameOver) return;
      if (!e.touches || e.touches.length === 0) return;

      state.isPointerDown = true;
      state.lastInputWasTouch = true;

      const touch = e.touches[0];
      updateTargetFromClientX(touch.clientX);
    }

    function handleTouchMove(e) {
      if (!state.running || state.paused || state.gameOver) return;
      if (!e.touches || e.touches.length === 0) return;

      e.preventDefault();
      state.lastInputWasTouch = true;
      state.isPointerDown = true;

      const touch = e.touches[0];
      updateTargetFromClientX(touch.clientX);
    }

    function handleTouchEnd() {
      state.isPointerDown = false;
    }

    function handleKeyDown(e) {
      // Global keyboard shortcuts
      switch(e.key) {
        case 'Escape':
          if (state.running && !state.gameOver) {
            togglePause();
            e.preventDefault();
          }
          break;
          
        case '1':
        case '2':
        case '3':
          if (!state.running) {
            const modes = ['calm', 'brisk', 'rush'];
            const modeIndex = parseInt(e.key) - 1;
            if (modes[modeIndex]) {
              setGameMode(modes[modeIndex]);
              e.preventDefault();
            }
          }
          break;
          
        case 'd':
        case 'D':
          if (e.ctrlKey && e.shiftKey) {
            // Ctrl+Shift+D: Toggle debug mode
            const debugMode = localStorage.getItem('debugMode') === 'true';
            localStorage.setItem('debugMode', !debugMode);
            setStatus(`Debug mode ${!debugMode ? 'enabled' : 'disabled'}`, 'info');
            e.preventDefault();
          }
          break;
      }
      
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
          // Space bar: dash/boost
          particles.burst(state.pooh.x, state.pooh.y - 20, 10, '#FFFFFF', {
            size: 3,
            speed: 2
          });
          e.preventDefault();
          break;
          
        case 's':
        case 'S':
          if (e.ctrlKey) {
            // Ctrl+S: Quick save
            saveGameState();
            e.preventDefault();
          }
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
    // Gamepad Support
    // -------------------------------------------------------------------------
    function setupGamepad() {
      window.addEventListener('gamepadconnected', (e) => {
        state.gamepadIndex = e.gamepad.index;
        setStatus('Gamepad connected', 'success');
        announceToScreenReader('Gamepad connected');
      });
      
      window.addEventListener('gamepaddisconnected', () => {
        state.gamepadIndex = null;
        setStatus('Gamepad disconnected', 'warning');
        announceToScreenReader('Gamepad disconnected');
      });
    }
    
    function checkGamepad() {
      if (state.gamepadIndex === null || !state.running || state.paused) return;
      
      const gamepad = navigator.getGamepads()[state.gamepadIndex];
      if (!gamepad) return;
      
      // Use left stick for movement
      const axisX = gamepad.axes[0];
      if (Math.abs(axisX) > 0.1) {
        const speed = 20;
        state.pooh.targetX += axisX * speed;
        state.pooh.targetX = clamp(state.pooh.targetX, state.pooh.width/2, W - state.pooh.width/2);
      }
      
      // Check buttons
      if (gamepad.buttons[0].pressed) {
        // A button - dash/boost
        particles.burst(state.pooh.x, state.pooh.y - 20, 10, '#FFFFFF', {
          size: 3,
          speed: 2
        });
      }
      
      if (gamepad.buttons[9].pressed) {
        // Start button - pause
        togglePause();
      }
    }

    // -------------------------------------------------------------------------
    // Canvas Resize Function
    // -------------------------------------------------------------------------
    function resizeCanvas() {
      if (!canvas) return;
      
      const container = canvas.parentElement;
      if (!container) return;
      
      // Get container dimensions
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // Calculate target dimensions (maintain aspect ratio)
      const targetAspect = 4/3;
      let width = containerWidth;
      let height = containerHeight;
      
      if (width / height > targetAspect) {
        width = Math.floor(height * targetAspect);
      } else {
        height = Math.floor(width / targetAspect);
      }
      
      // Set canvas dimensions
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      // Set actual canvas resolution (retina support)
      DPR = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      
      // Update global dimensions
      W = canvas.width;
      H = canvas.height;
      
      // Scale context for retina displays
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      
      // Update Pooh position
      state.pooh.x = W / (2 * DPR);
      state.pooh.y = H / DPR - PLAYER_GROUND_OFFSET;
      state.pooh.targetX = state.pooh.x;
      
      // Redraw background
      drawBackground();
      
      // Re-render game
      renderGame();
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

      const dtMs = Math.min(100, timestamp - state.lastUpdateTime);
      state.lastUpdateTime = timestamp;
      const normalizedDt = clamp(dtMs / (1000 / 60), 0, 3);

      // Check gamepad input
      checkGamepad();
      
      updateGame(normalizedDt);
      renderGame();

      state.frameId = requestAnimationFrame(gameLoop);
    }

    // -------------------------------------------------------------------------
    // Initialization
    // -------------------------------------------------------------------------
    function initialize() {
      console.log('[HoneyCatch] Ultimate Edition Initializing...');
      
      // Load saved data
      loadBestScore();
      loadStatistics();
      loadGameState(); // Try to load saved game
      
      // Set initial mode
      setGameMode('calm');
