// ============================================
// HONEY HUNT GAME - FULLSCREEN VERSION
// Version 2.0 - Enhanced with all features
// ============================================

(function () {
  "use strict";

  // =========== GAME CONSTANTS ===========
  const DIFFICULTY_SETTINGS = {
    easy: {
      dropSpeed: 0.2,
      leafSpeed: 0.18,
      spawnRate: 0.6,
      lives: 5,
      dropValue: 15,
      leafPenalty: 0.5,
      comboTime: 5
    },
    normal: {
      dropSpeed: 0.3,
      leafSpeed: 0.25,
      spawnRate: 1.0,
      lives: 3,
      dropValue: 10,
      leafPenalty: 1,
      comboTime: 4
    },
    hard: {
      dropSpeed: 0.4,
      leafSpeed: 0.35,
      spawnRate: 1.5,
      lives: 2,
      dropValue: 8,
      leafPenalty: 2,
      comboTime: 3
    }
  };

  const COLORS = {
    honey: ['#FFD700', '#FFC107', '#FF9800', '#FFB300'],
    leaf: ['#7CB342', '#8BC34A', '#9CCC65', '#AED581'],
    player: ['#FF9800', '#FF5722', '#F4511E'],
    background: ['#FFF8E1', '#FFECB3', '#FFE082', '#FFD54F'],
    particle: {
      honey: ['#FFD54F', '#FFCA28', '#FFB300', '#FFA000'],
      leaf: ['#9CCC65', '#8BC34A', '#7CB342', '#689F38'],
      combo: ['#FF4081', '#E91E63', '#C2185B', '#AD1457']
    },
    ui: {
      primary: '#FFC42B',
      secondary: '#7CB342',
      danger: '#FF5252',
      success: '#4CAF50',
      warning: '#FFB300'
    }
  };

  // =========== GAME STATE ===========
  const gameState = {
    // Core state
    running: false,
    paused: false,
    arcadeMode: false,
    initialized: false,
    
    // Game stats
    score: 0,
    lives: 3,
    timer: 60,
    best: 0,
    level: 1,
    multiplier: 1,
    streak: 0,
    comboTime: 0,
    totalDrops: 0,
    totalLeaves: 0,
    
    // Objects
    player: null,
    drops: [],
    leaves: [],
    particles: [],
    combos: [],
    powerups: [],
    
    // Effects
    shake: 0,
    glow: 0,
    slowMo: 0,
    
    // Settings
    difficulty: 'normal',
    soundEnabled: true,
    effectsEnabled: true,
    defaultTimer: 60,
    
    // Input
    keys: {
      left: false,
      right: false,
      pause: false
    },
    
    // Performance
    lastTime: 0,
    frameCount: 0,
    fps: 60,
    
    // Screen
    width: 800,
    height: 500,
    pixelRatio: 1
  };

  // =========== DOM ELEMENTS ===========
  let canvas, ctx;
  let scoreEl, timerEl, livesEl, bestEl, comboEl, statusEl;
  let startBtn, pauseBtn, resetBtn, arcadeBtn, soundToggle, effectsToggle;
  let difficultySelect, leftBtn, rightBtn, dropBtn;
  let gameOverlay, gameMessage;
  let audioSystem;

  function getElementByIds(ids) {
    return ids.map(id => document.getElementById(id)).find(Boolean) || null;
  }

  // =========== AUDIO SYSTEM ===========
  class AudioSystem {
    constructor() {
      this.context = null;
      this.sounds = {};
      this.enabled = true;
      this.init();
    }

    init() {
      try {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.createSounds();
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
        this.enabled = false;
      }
    }

    createSounds() {
      if (!this.context) return;

      const createTone = (freq, duration, type = 'sine', volume = 0.3) => {
        return () => {
          if (!this.enabled || !this.context) return;
          
          const oscillator = this.context.createOscillator();
          const gainNode = this.context.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(this.context.destination);
          
          oscillator.frequency.value = freq;
          oscillator.type = type;
          
          const now = this.context.currentTime;
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
          
          oscillator.start(now);
          oscillator.stop(now + duration);
        };
      };

      this.sounds = {
        collect: createTone(523.25, 0.15, 'sine', 0.4),
        bigCollect: createTone(659.25, 0.3, 'sine', 0.5),
        hurt: createTone(220, 0.25, 'sawtooth', 0.3),
        powerup: createTone(784, 0.5, 'triangle', 0.4),
        combobreak: createTone(880, 0.6, 'square', 0.5),
        button: createTone(349.23, 0.1, 'sine', 0.3),
        start: createTone(523.25, 0.8, 'sine', 0.5),
        gameover: createTone(196, 1.0, 'sawtooth', 0.4),
        levelup: createTone(1046.5, 0.8, 'sine', 0.5),
        streak: createTone(1318.51, 0.4, 'square', 0.4)
      };
    }

    play(name) {
      if (this.sounds[name] && gameState.soundEnabled) {
        try {
          this.sounds[name]();
        } catch (error) {
          // Silent fallback
        }
      }
    }

    toggle(enabled) {
      this.enabled = enabled;
      gameState.soundEnabled = enabled;
    }
  }

  // =========== PARTICLE SYSTEM ===========
  class ParticleSystem {
    static createParticle(x, y, type, count = 1) {
      const particles = [];
      const colors = COLORS.particle[type] || COLORS.particle.honey;
      
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = type === 'combo' ? 3 + Math.random() * 3 : 1 + Math.random() * 3;
        const life = 0.6 + Math.random() * 0.4;
        const size = type === 'combo' ? 4 + Math.random() * 4 : 2 + Math.random() * 3;
        
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          maxLife: life,
          size,
          color: colors[Math.floor(Math.random() * colors.length)],
          type,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.3,
          gravity: type === 'combo' ? 0.5 : 0.2
        });
      }
      
      return particles;
    }

    static updateParticles(particles, dt) {
      particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * 9.8 * dt;
        p.life -= dt;
        p.rotation += p.rotationSpeed * dt;
        
        // Fade out
        p.alpha = p.life / p.maxLife;
        
        // Shrink
        p.currentSize = p.size * (0.3 + 0.7 * p.alpha);
      });
    }

    static drawParticles(ctx, particles) {
      particles.forEach(p => {
        if (p.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        if (p.type === 'combo') {
          // Star shape for combo particles
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            const radius = p.currentSize;
            ctx.lineTo(
              Math.cos(angle) * radius,
              Math.sin(angle) * radius
            );
            const innerAngle = angle + Math.PI / 5;
            ctx.lineTo(
              Math.cos(innerAngle) * radius * 0.5,
              Math.sin(innerAngle) * radius * 0.5
            );
          }
          ctx.closePath();
          ctx.fill();
        } else {
          // Circle for regular particles
          ctx.beginPath();
          ctx.arc(0, 0, p.currentSize, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      });
    }
  }

  // =========== COMBO SYSTEM ===========
  class ComboSystem {
    static createCombo(x, y, text, type = 'score') {
      const colors = {
        score: COLORS.ui.primary,
        streak: COLORS.particle.combo[0],
        level: COLORS.ui.success,
        powerup: COLORS.ui.warning
      };
      
      gameState.combos.push({
        x, y,
        text,
        color: colors[type] || colors.score,
        life: 1.5,
        vy: -1.5,
        vx: (Math.random() - 0.5) * 0.5,
        scale: 0.5,
        type,
        opacity: 1
      });
    }

    static updateCombos(combos, dt) {
      combos.forEach(c => {
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.life -= dt * 0.5;
        c.scale = 0.5 + (1 - c.life) * 0.8;
        c.opacity = Math.min(1, c.life * 2);
      });
    }

    static drawCombos(ctx, combos) {
      combos.forEach(c => {
        if (c.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = c.opacity;
        ctx.translate(c.x, c.y);
        ctx.scale(c.scale, c.scale);
        
        // Text with glow effect
        ctx.font = `bold ${c.type === 'streak' ? '28' : '24'}px 'Lato', sans-serif`;
        ctx.fillStyle = c.color;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 6;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.strokeText(c.text, 0, 0);
        ctx.fillText(c.text, 0, 0);
        
        // Extra glow for streak combos
        if (c.type === 'streak') {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 3;
          ctx.strokeText(c.text, 0, 0);
        }
        
        ctx.restore();
      });
    }
  }

  // =========== GAME OBJECTS ===========
  class Player {
    constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.speed = 400;
      this.velX = 0;
      this.targetX = x;
      this.tilt = 0;
      this.bob = 0;
      this.trail = [];
      this.maxTrail = 12;
      this.collectRadius = Math.min(width, height) * 0.4;
    }

    update(dt, keys, gameWidth) {
      // Movement
      let dir = 0;
      if (keys.left) dir -= 1;
      if (keys.right) dir += 1;
      
      // Smooth acceleration
      const targetSpeed = dir * this.speed;
      this.velX += (targetSpeed - this.velX) * dt * 12;
      this.x += this.velX * dt;
      
      // Boundaries
      const margin = this.width * 0.4;
      this.x = Math.max(margin, Math.min(gameWidth - margin - this.width, this.x));
      
      // Animations
      this.tilt = dir * 0.4;
      this.bob += dt * 10;
      
      // Update trail
      this.trail.unshift({
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        life: 1
      });
      
      // Fade out trail
      this.trail.forEach(point => point.life -= dt * 2);
      if (this.trail.length > this.maxTrail) this.trail.pop();
      this.trail = this.trail.filter(point => point.life > 0);
    }

    draw(ctx) {
      const bobOffset = Math.sin(this.bob) * 4;
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2 + bobOffset;
      
      // Draw trail
      if (this.trail.length > 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (let i = 0; i < this.trail.length - 1; i++) {
          const point = this.trail[i];
          const nextPoint = this.trail[i + 1];
          
          const alpha = point.life * 0.3;
          const width = 6 * point.life;
          
          ctx.strokeStyle = `rgba(255, 196, 43, ${alpha})`;
          ctx.lineWidth = width;
          
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(nextPoint.x, nextPoint.y);
          ctx.stroke();
        }
        ctx.restore();
      }
      
      // Save context for player transformation
      ctx.save();
      
      // Apply screen shake
      if (gameState.shake > 0) {
        ctx.translate(
          (Math.random() - 0.5) * gameState.shake * 20,
          (Math.random() - 0.5) * gameState.shake * 20
        );
      }
      
      // Apply glow effect
      if (gameState.glow > 0) {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = gameState.glow * 30;
      }
      
      // Position and rotate
      ctx.translate(centerX, centerY);
      ctx.rotate(this.tilt * 0.3);
      
      // Body
      const bodyGradient = ctx.createLinearGradient(
        -this.width / 2, 0,
        this.width / 2, 0
      );
      bodyGradient.addColorStop(0, '#FF9800');
      bodyGradient.addColorStop(0.5, '#FF5722');
      bodyGradient.addColorStop(1, '#FF9800');
      ctx.fillStyle = bodyGradient;
      
      // Rounded rectangle body (with fallback)
      if (ctx.roundRect) {
        ctx.roundRect(
          -this.width / 2,
          -this.height / 3,
          this.width,
          this.height * 0.7,
          15
        );
      } else {
        ctx.fillRect(
          -this.width / 2,
          -this.height / 3,
          this.width,
          this.height * 0.7
        );
      }
      ctx.fill();
      
      // Head
      ctx.fillStyle = '#FF9800';
      ctx.beginPath();
      ctx.arc(0, -this.height * 0.22, this.height * 0.22, 0, Math.PI * 2);
      ctx.fill();
      
      // Ears
      ctx.beginPath();
      ctx.arc(-this.width * 0.18, -this.height * 0.35, this.height * 0.09, 0, Math.PI * 2);
      ctx.arc(this.width * 0.18, -this.height * 0.35, this.height * 0.09, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyes
      const eyeY = -this.height * 0.26 + Math.sin(this.bob * 2) * 2;
      ctx.fillStyle = '#5D4037';
      ctx.beginPath();
      ctx.arc(-this.width * 0.07, eyeY, this.height * 0.035, 0, Math.PI * 2);
      ctx.arc(this.width * 0.07, eyeY, this.height * 0.035, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(-this.width * 0.08, eyeY - 1.5, 1.5, 0, Math.PI * 2);
      ctx.arc(this.width * 0.06, eyeY - 1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Nose
      ctx.fillStyle = '#5D4037';
      ctx.beginPath();
      ctx.arc(0, -this.height * 0.2, this.height * 0.045, 0, Math.PI * 2);
      ctx.fill();
      
      // Honey jar
      const jarWidth = this.width * 0.35;
      const jarHeight = this.height * 0.28;
      const jarX = -jarWidth / 2;
      const jarY = this.height * 0.15;
      
      // Jar glass
      ctx.fillStyle = 'rgba(154, 106, 59, 0.7)';
      if (ctx.roundRect) {
        ctx.roundRect(jarX, jarY, jarWidth, jarHeight, 8);
      } else {
        ctx.fillRect(jarX, jarY, jarWidth, jarHeight);
      }
      ctx.fill();
      
      // Honey level (animated)
      const honeyLevel = 0.65 + Math.sin(this.bob) * 0.08;
      ctx.fillStyle = '#FFC107';
      const honeyHeight = jarHeight * honeyLevel;
      if (ctx.roundRect) {
        ctx.roundRect(
          jarX + 2,
          jarY + jarHeight - honeyHeight,
          jarWidth - 4,
          honeyHeight,
          6
        );
      } else {
        ctx.fillRect(
          jarX + 2,
          jarY + jarHeight - honeyHeight,
          jarWidth - 4,
          honeyHeight
        );
      }
      ctx.fill();
      
      // Jar rim
      ctx.fillStyle = '#795548';
      if (ctx.roundRect) {
        ctx.roundRect(jarX - 3, jarY - 4, jarWidth + 6, 8, 4);
      } else {
        ctx.fillRect(jarX - 3, jarY - 4, jarWidth + 6, 8);
      }
      ctx.fill();
      
      // Restore context
      ctx.restore();
    }
  }

  class HoneyDrop {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = Math.random() * 12 + 8;
      this.speed = DIFFICULTY_SETTINGS[gameState.difficulty].dropSpeed * 150;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.2;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 2 + Math.random() * 3;
      this.value = DIFFICULTY_SETTINGS[gameState.difficulty].dropValue;
    }

    update(dt) {
      this.y += this.speed * dt;
      this.rotation += this.rotationSpeed * dt;
      this.wobble += this.wobbleSpeed * dt;
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y + Math.sin(this.wobble) * 5);
      ctx.rotate(this.rotation);
      
      // Honey drop shape with gradient
      const gradient = ctx.createRadialGradient(
        0, -this.radius * 0.3, 0,
        0, 0, this.radius
      );
      gradient.addColorStop(0, '#FFD700');
      gradient.addColorStop(0.5, '#FFC107');
      gradient.addColorStop(1, '#FF9800');
      
      ctx.fillStyle = gradient;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15;
      
      ctx.beginPath();
      ctx.moveTo(0, -this.radius * 0.6);
      ctx.quadraticCurveTo(-this.radius, 0, 0, this.radius);
      ctx.quadraticCurveTo(this.radius, 0, 0, -this.radius * 0.6);
      ctx.fill();
      
      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
  }

  class Leaf {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = Math.random() * 25 + 20;
      this.height = this.width * 0.6;
      this.speed = DIFFICULTY_SETTINGS[gameState.difficulty].leafSpeed * 150;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.15;
      this.flip = Math.random() > 0.5 ? 1 : -1;
      this.penalty = DIFFICULTY_SETTINGS[gameState.difficulty].leafPenalty;
    }

    update(dt) {
      this.y += this.speed * dt;
      this.rotation += this.rotationSpeed * dt;
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(this.flip, 1);
      
      // Leaf gradient
      const gradient = ctx.createLinearGradient(
        -this.width / 2, 0,
        this.width / 2, 0
      );
      gradient.addColorStop(0, '#8BC34A');
      gradient.addColorStop(1, '#7CB342');
      
      ctx.fillStyle = gradient;
      
      // Leaf shape
      ctx.beginPath();
      ctx.moveTo(-this.width / 2, 0);
      ctx.quadraticCurveTo(0, -this.height / 2, this.width / 2, 0);
      ctx.quadraticCurveTo(0, this.height / 2, -this.width / 2, 0);
      ctx.fill();
      
      // Leaf vein
      ctx.strokeStyle = '#689F38';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-this.width / 3, 0);
      ctx.lineTo(this.width / 3, 0);
      ctx.stroke();
      
      ctx.restore();
    }
  }

  // =========== GAME FUNCTIONS ===========
  function initGame() {
    // Get DOM elements (support fullscreen and embedded variants)
    canvas = getElementByIds(['honeyCanvas', 'honey-game']);
    if (!canvas) return; // Page doesn't include the game
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context not supported!');
      return;
    }
    
    // Get UI elements
    scoreEl = getElementByIds(['scoreValue', 'score']);
    timerEl = getElementByIds(['timeValue', 'timer']);
    livesEl = getElementByIds(['livesValue', 'lives']);
    bestEl = getElementByIds(['bestValue', 'best']);
    comboEl = getElementByIds(['comboValue']);
    statusEl = getElementByIds(['statusText']);
    gameOverlay = document.querySelector('.canvas-overlay');
    gameMessage = document.getElementById('gameMessage');

    // Get buttons
    startBtn = getElementByIds(['startBtn', 'startGame']);
    pauseBtn = getElementByIds(['pauseBtn', 'pauseGame']);
    resetBtn = getElementByIds(['resetBtn', 'resetGame']);
    arcadeBtn = document.getElementById('arcadeModeBtn');
    soundToggle = document.getElementById('soundToggle');
    effectsToggle = document.getElementById('streakSoundToggle');
    difficultySelect = document.getElementById('difficultySelect');
    leftBtn = document.getElementById('leftBtn');
    rightBtn = document.getElementById('rightBtn');
    dropBtn = document.getElementById('dropBtn');

    // Initialize audio system
    window.audioSystem = new AudioSystem();

    // Respect any timer hint in the DOM (e.g., 45s embedded mode)
    const initialTimerText = timerEl?.textContent;
    const hintedSeconds = initialTimerText ? parseInt(initialTimerText.replace(/\D/g, ''), 10) : NaN;
    if (!Number.isNaN(hintedSeconds) && hintedSeconds > 0) {
      gameState.timer = hintedSeconds;
      gameState.defaultTimer = hintedSeconds;
    }

    // Load best score
    loadBestScore();
    
    // Setup canvas
    resizeCanvas();
    
    // Create initial player
    createPlayer();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initial draw
    draw();
    
    // Mark as initialized
    gameState.initialized = true;
    
    console.log('Honey Hunt Game initialized successfully!');
  }

  function createPlayer() {
    const width = gameState.width * 0.12;
    const height = gameState.height * 0.14;
    gameState.player = new Player(
      gameState.width / 2 - width / 2,
      gameState.height - height - 20,
      width,
      height
    );
  }

  function resizeCanvas() {
    const container = document.getElementById('canvasContainer') || canvas.parentElement;
    const rect = container?.getBoundingClientRect();
    if (!rect) return;

    gameState.width = Math.floor(rect.width);
    gameState.height = Math.floor(rect.height);
    
    // Set canvas dimensions
    canvas.width = gameState.width;
    canvas.height = gameState.height;
    
    // Update player position
    if (gameState.player) {
      gameState.player.y = gameState.height - gameState.player.height - 20;
    }
    
    console.log(`Canvas resized to: ${gameState.width}x${gameState.height}`);
  }

  function loadBestScore() {
    try {
      const stored = localStorage.getItem('honeyGameBest');
      gameState.best = stored ? parseInt(stored, 10) : 0;
      updateBestDisplay();
    } catch (error) {
      console.warn('Failed to load best score:', error);
      gameState.best = 0;
    }
  }

  function saveBestScore() {
    if (gameState.score > gameState.best) {
      gameState.best = gameState.score;
      try {
        localStorage.setItem('honeyGameBest', gameState.best.toString());
        updateBestDisplay();
      } catch (error) {
        console.warn('Failed to save best score:', error);
      }
    }
  }

  function updateBestDisplay() {
    if (bestEl) bestEl.textContent = gameState.best;
    const bestScoreDisplay = document.getElementById('bestScoreDisplay');
    if (bestScoreDisplay) bestScoreDisplay.textContent = gameState.best;
  }

  function updateUI() {
    // Update score with animation
    if (scoreEl) {
      scoreEl.textContent = gameState.score;
      scoreEl.classList.add('score-updated');
      setTimeout(() => scoreEl.classList.remove('score-updated'), 300);
    }
    
    // Update timer
    if (timerEl) {
      const seconds = Math.max(0, Math.floor(gameState.timer));
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      timerEl.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;

      // Warning colors
      if (seconds < 10 && !gameState.arcadeMode) {
        timerEl.style.color = COLORS.ui.danger;
        timerEl.parentElement?.parentElement?.style.setProperty('border-color', COLORS.ui.danger);
      } else {
        timerEl.style.color = '';
        timerEl.parentElement?.parentElement?.style.removeProperty('border-color');
      }
    }
    
    // Update lives
    if (livesEl) {
      livesEl.textContent = gameState.lives;
      livesEl.style.color = gameState.lives <= 1 ? COLORS.ui.danger : COLORS.ui.primary;
    }
    
    // Update combo
    if (comboEl) {
      comboEl.textContent = `x${gameState.multiplier}`;
      const comboPill = document.getElementById('comboPill');
      if (comboPill) {
        comboPill.style.display = gameState.multiplier > 1 ? 'flex' : 'none';
      }
    }
    
    // Update status if needed
    if (statusEl && !gameState.running && !gameState.paused) {
      statusEl.textContent = "Press 'Start Hunt' to begin!";
    }
  }

  function updateStatus(message, duration = 3000) {
    if (!statusEl) return;

    statusEl.textContent = message;

    if (duration > 0) {
      setTimeout(() => {
        if (statusEl.textContent === message) {
          if (gameState.running && !gameState.paused) {
            statusEl.textContent = `Catch honey! Avoid leaves! Level ${gameState.level}`;
          } else if (gameState.paused) {
            statusEl.textContent = 'Game Paused';
          } else {
            statusEl.textContent = "Press 'Start Hunt' to begin!";
          }
        }
      }, duration);
    }
  }

  function spawnObjects(dt) {
    const settings = DIFFICULTY_SETTINGS[gameState.difficulty];
    const levelMultiplier = 1 + (gameState.level - 1) * 0.2;
    
    // Spawn honey drops
    if (Math.random() < settings.spawnRate * levelMultiplier * dt * 1.2) {
      const x = Math.random() * (gameState.width - 40) + 20;
      gameState.drops.push(new HoneyDrop(x, -20));
      gameState.totalDrops++;
    }
    
    // Spawn leaves
    if (Math.random() < settings.spawnRate * levelMultiplier * dt * 0.4) {
      const x = Math.random() * (gameState.width - 60) + 30;
      gameState.leaves.push(new Leaf(x, -30));
      gameState.totalLeaves++;
    }
  }

  function updateObjects(dt) {
    // Update drops
    gameState.drops.forEach(drop => drop.update(dt));
    gameState.drops = gameState.drops.filter(drop => drop.y < gameState.height + 50);
    
    // Update leaves
    gameState.leaves.forEach(leaf => leaf.update(dt));
    gameState.leaves = gameState.leaves.filter(leaf => leaf.y < gameState.height + 50);
    
    // Update particles
    ParticleSystem.updateParticles(gameState.particles, dt);
    gameState.particles = gameState.particles.filter(p => p.life > 0);
    
    // Update combos
    ComboSystem.updateCombos(gameState.combos, dt);
    gameState.combos = gameState.combos.filter(c => c.life > 0);
    
    // Update combo timer
    if (gameState.streak > 0) {
      gameState.comboTime -= dt;
      if (gameState.comboTime <= 0) {
        resetCombo();
      }
    }
    
    // Update effects
    gameState.shake = Math.max(0, gameState.shake - dt * 2);
    gameState.glow = Math.max(0, gameState.glow - dt * 3);
  }

  function checkCollisions() {
    if (!gameState.player) return;
    
    const player = gameState.player;
    
    // Check honey drops
    for (let i = gameState.drops.length - 1; i >= 0; i--) {
      const drop = gameState.drops[i];
      const dx = drop.x - (player.x + player.width / 2);
      const dy = drop.y - (player.y + player.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < player.collectRadius) {
        // Collect drop
        gameState.drops.splice(i, 1);
        
        // Calculate score
        const baseScore = drop.value;
        const streakBonus = Math.min(50, Math.floor(gameState.streak / 5) * 5);
        const score = Math.floor((baseScore + streakBonus) * gameState.multiplier);
        
        // Update game state
        gameState.score += score;
        gameState.streak++;
        gameState.comboTime = DIFFICULTY_SETTINGS[gameState.difficulty].comboTime;
        
        // Update multiplier
        updateMultiplier();
        
        // Create effects
        if (gameState.effectsEnabled) {
          gameState.particles.push(...ParticleSystem.createParticle(
            drop.x, drop.y, 'honey', 12
          ));
        }
        
        ComboSystem.createCombo(drop.x, drop.y, `+${score}`, 'score');
        
        // Sound
        audioSystem.play(gameState.streak % 10 === 0 ? 'bigCollect' : 'collect');
        
        // Screen effects
        gameState.shake = 0.2;
        gameState.glow = 0.8;
        
        // Check for level up
        checkLevelUp();
        
        // Update UI
        updateUI();
      }
    }
    
    // Check leaves
    for (let i = gameState.leaves.length - 1; i >= 0; i--) {
      const leaf = gameState.leaves[i];
      const playerCenterX = player.x + player.width / 2;
      const playerCenterY = player.y + player.height / 2;
      
      // Simple AABB collision
      const halfWidth = (player.width * 0.4 + leaf.width * 0.5);
      const halfHeight = (player.height * 0.4 + leaf.height * 0.5);
      const dx = Math.abs(leaf.x - playerCenterX);
      const dy = Math.abs(leaf.y - playerCenterY);
      
      if (dx < halfWidth && dy < halfHeight) {
        // Hit leaf
        gameState.leaves.splice(i, 1);
        gameState.lives -= leaf.penalty;
        resetCombo();
        
        // Create effects
        if (gameState.effectsEnabled) {
          gameState.particles.push(...ParticleSystem.createParticle(
            leaf.x, leaf.y, 'leaf', 8
          ));
        }
        
        // Sound
        audioSystem.play('hurt');
        
        // Screen shake
        gameState.shake = 0.5;
        
        // Update UI
        updateUI();
        updateStatus('Oh bother! Watch out for leaves!', 1500);
        
        // Check for game over
        if (gameState.lives <= 0) {
          gameOver();
          return;
        }
      }
    }
  }

  function updateMultiplier() {
    const newMultiplier = Math.min(4, 1 + Math.floor(gameState.streak / 10));
    
    if (newMultiplier > gameState.multiplier) {
      gameState.multiplier = newMultiplier;
      
      // Celebration for new multiplier
      if (gameState.effectsEnabled) {
        gameState.particles.push(...ParticleSystem.createParticle(
          gameState.width / 2, gameState.height / 2, 'combo', 20
        ));
      }
      
      ComboSystem.createCombo(
        gameState.width / 2, 
        gameState.height / 2, 
        `x${gameState.multiplier} MULTIPLIER!`,
        'streak'
      );
      
      audioSystem.play('streak');
      updateStatus(`x${gameState.multiplier} Multiplier! Keep it up!`, 2000);
    }
  }

  function resetCombo() {
    if (gameState.streak >= 10) {
      ComboSystem.createCombo(
        gameState.width / 2,
        gameState.height / 2,
        `Streak: ${gameState.streak}`,
        'streak'
      );
      audioSystem.play('combobreak');
    }
    
    gameState.streak = 0;
    gameState.multiplier = 1;
    gameState.comboTime = 0;
  }

  function checkLevelUp() {
    const nextLevel = Math.floor(gameState.score / 500) + 1;
    
    if (nextLevel > gameState.level) {
      gameState.level = nextLevel;
      
      // Level up celebration
      ComboSystem.createCombo(
        gameState.width / 2,
        gameState.height / 3,
        `LEVEL ${gameState.level}!`,
        'level'
      );
      
      audioSystem.play('levelup');
      updateStatus(`Level Up! Now at level ${gameState.level}`, 2500);
      
      // Extra life every 3 levels
      if (gameState.level % 3 === 0) {
        gameState.lives = Math.min(5, gameState.lives + 1);
        updateStatus(`Bonus life! Now at ${gameState.lives} lives`, 2000);
      }
    }
  }

  function updateTimer(dt) {
    if (gameState.arcadeMode) {
      // In arcade mode, timer counts up (survival time)
      gameState.timer += dt;
    } else {
      // In normal mode, timer counts down
      gameState.timer -= dt;
      if (gameState.timer <= 0) {
        gameState.timer = 0;
        gameOver();
      }
    }
  }

  function draw() {
    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(255, 248, 225, 0.1)';
    ctx.fillRect(0, 0, gameState.width, gameState.height);
    
    // Set blend mode for particles
    ctx.globalCompositeOperation = 'lighter';
    
    // Draw background
    drawBackground();
    
    // Draw particles
    ParticleSystem.drawParticles(ctx, gameState.particles);
    
    // Draw game objects
    gameState.drops.forEach(drop => drop.draw(ctx));
    gameState.leaves.forEach(leaf => leaf.draw(ctx));
    
    // Draw player
    if (gameState.player) {
      gameState.player.draw(ctx);
    }
    
    // Draw combos
    ComboSystem.drawCombos(ctx, gameState.combos);
    
    // Reset blend mode for HUD
    ctx.globalCompositeOperation = 'source-over';
    
    // Draw HUD overlay
    drawHUDOverlay();
    
    // Draw game overlay if needed
    if (!gameState.running || gameState.paused) {
      drawGameOverlay();
    }
  }

  function drawBackground() {
    const w = gameState.width;
    const h = gameState.height;
    
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
    skyGradient.addColorStop(0, '#FFF8E1');
    skyGradient.addColorStop(0.4, '#FFECB3');
    skyGradient.addColorStop(1, '#FFE082');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, w, h);
    
    // Sun
    const time = Date.now() * 0.001;
    ctx.save();
    ctx.globalAlpha = 0.6 + Math.sin(time) * 0.2;
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(w * 0.85, h * 0.15, Math.min(w, h) * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    const clouds = [
      { x: (w * 0.2 + time * 30) % (w + 200) - 100, y: h * 0.15, size: 0.8 },
      { x: (w * 0.5 + time * 25) % (w + 200) - 100, y: h * 0.1, size: 1.0 },
      { x: (w * 0.7 + time * 20) % (w + 200) - 100, y: h * 0.18, size: 0.9 }
    ];
    
    clouds.forEach(cloud => {
      if (cloud.x < -100 || cloud.x > w + 100) return;
      
      const size = 30 * cloud.size;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, size, 0, Math.PI * 2);
      ctx.arc(cloud.x + size * 0.8, cloud.y + size * 0.1, size * 0.85, 0, Math.PI * 2);
      ctx.arc(cloud.x - size * 0.7, cloud.y + size * 0.15, size * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Ground
    ctx.fillStyle = '#C5E1A5';
    ctx.fillRect(0, h * 0.82, w, h * 0.18);
    
    // Grass detail
    ctx.strokeStyle = '#9CCC65';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < w; i += 15) {
      const height = 8 + Math.sin(time + i * 0.1) * 5;
      ctx.beginPath();
      ctx.moveTo(i, h * 0.82);
      ctx.quadraticCurveTo(i + 7.5, h * 0.82 - height, i + 15, h * 0.82);
      ctx.stroke();
    }
  }

  function drawHUDOverlay() {
    // Draw multiplier badge
    if (gameState.multiplier > 1) {
      ctx.save();
      
      // Background circle
      ctx.fillStyle = COLORS.particle.combo[0];
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(60, 60, 25, 0, Math.PI * 2);
      ctx.fill();
      
      // Text
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 22px Lato, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`x${gameState.multiplier}`, 60, 60);
      
      ctx.restore();
    }
    
    // Draw streak counter
    if (gameState.streak > 0) {
      ctx.save();
      
      const alpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
      ctx.fillStyle = `rgba(255, 64, 129, ${alpha})`;
      ctx.font = 'bold 18px Lato, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(`${gameState.streak} streak`, gameState.width - 20, 20);
      
      ctx.restore();
    }
    
    // Draw level indicator
    ctx.save();
    
    ctx.fillStyle = COLORS.ui.primary;
    ctx.font = 'bold 20px Lato, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`Level ${gameState.level}`, gameState.width / 2, 20);
    
    ctx.restore();
  }

  function drawGameOverlay() {
    if (!gameOverlay || !gameMessage) return;
    
    // Show overlay
    gameOverlay.classList.add('active');
    
    // Set message
    if (!gameState.running && gameState.initialized) {
      gameMessage.textContent = 'Press "Start Hunt" to begin!';
    } else if (gameState.paused) {
      gameMessage.textContent = 'Game Paused';
    }
  }

  function hideGameOverlay() {
    if (gameOverlay) {
      gameOverlay.classList.remove('active');
    }
  }

  // =========== GAME CONTROL FUNCTIONS ===========
  function startGame() {
    if (!gameState.initialized) return;
    
    // Reset game state
    gameState.running = true;
    gameState.paused = false;
    gameState.score = 0;
    gameState.lives = DIFFICULTY_SETTINGS[gameState.difficulty].lives;
    gameState.timer = gameState.arcadeMode ? 0 : gameState.defaultTimer;
    gameState.level = 1;
    gameState.multiplier = 1;
    gameState.streak = 0;
    gameState.comboTime = 0;
    gameState.totalDrops = 0;
    gameState.totalLeaves = 0;
    
    // Clear game objects
    gameState.drops = [];
    gameState.leaves = [];
    gameState.particles = [];
    gameState.combos = [];
    
    // Create new player
    createPlayer();
    
    // Update UI
    updateUI();
    updateStatus('Go! Catch that sweet honey!', 2000);
    
    // Sound
    audioSystem.play('start');
    
    // Hide overlay
    hideGameOverlay();
    
    // Update button text
    if (startBtn) {
      startBtn.innerHTML = '<i class="fa-solid fa-redo"></i><span>Restart</span>';
    }
    
    // Start game loop
    gameState.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    console.log('Game started!');
  }

  function pauseGame() {
    if (!gameState.running) return;
    
    gameState.paused = !gameState.paused;
    
    if (gameState.paused) {
      updateStatus('Game Paused', Infinity);
      audioSystem.play('button');
      
      if (pauseBtn) {
        pauseBtn.innerHTML = '<i class="fa-solid fa-play"></i><span>Resume</span>';
      }
      
      drawGameOverlay();
    } else {
      updateStatus('Game Resumed!', 1500);
      
      if (pauseBtn) {
        pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i><span>Pause</span>';
      }
      
      hideGameOverlay();
      gameState.lastTime = performance.now();
      requestAnimationFrame(gameLoop);
    }
  }

  function resetGame() {
    gameState.running = false;
    gameState.paused = false;
    gameState.arcadeMode = false;
    
    // Reset to initial state
    gameState.score = 0;
    gameState.lives = DIFFICULTY_SETTINGS[gameState.difficulty].lives;
    gameState.timer = gameState.defaultTimer;
    gameState.level = 1;
    gameState.multiplier = 1;
    gameState.streak = 0;
    gameState.comboTime = 0;
    
    // Clear objects
    gameState.drops = [];
    gameState.leaves = [];
    gameState.particles = [];
    gameState.combos = [];
    
    // Create new player
    createPlayer();
    
    // Update UI
    updateUI();
    updateStatus('Ready to play? Press Start!', 0);
    
    // Sound
    audioSystem.play('button');
    
    // Reset buttons
    if (startBtn) {
      startBtn.innerHTML = '<i class="fa-solid fa-play"></i><span>Start Hunt</span>';
    }
    if (pauseBtn) {
      pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i><span>Pause</span>';
    }
    if (arcadeBtn) {
      arcadeBtn.classList.remove('arcade-mode');
      arcadeBtn.innerHTML = '<i class="fa-solid fa-gamepad"></i><span>Arcade Mode</span>';
    }
    
    // Draw initial state
    draw();
    drawGameOverlay();
    
    console.log('Game reset!');
  }

  function toggleArcadeMode() {
    gameState.arcadeMode = !gameState.arcadeMode;
    audioSystem.play('powerup');
    
    if (arcadeBtn) {
      if (gameState.arcadeMode) {
        arcadeBtn.classList.add('arcade-mode');
        arcadeBtn.innerHTML = '<i class="fa-solid fa-fire"></i><span>Arcade ON</span>';
        updateStatus('ARCADE MODE! Survive as long as you can!', 3000);
      } else {
        arcadeBtn.classList.remove('arcade-mode');
        arcadeBtn.innerHTML = '<i class="fa-solid fa-gamepad"></i><span>Arcade Mode</span>';
        updateStatus('Back to normal mode', 1500);
      }
    }
    
    resetGame();
  }

  function gameOver() {
    gameState.running = false;
    gameState.paused = false;
    
    // Save best score
    saveBestScore();
    
    // Final effects
    if (gameState.effectsEnabled && gameState.player) {
      const x = gameState.player.x + gameState.player.width / 2;
      const y = gameState.player.y + gameState.player.height / 2;
      gameState.particles.push(...ParticleSystem.createParticle(x, y, 'honey', 30));
    }
    
    // Sound
    audioSystem.play('gameover');
    
    // Update status
    const messages = [
      "Sweet harvest!",
      "Bee-utiful score!",
      "What a honey pot!",
      "You're a honey hero!",
      "Deliciously done!"
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    if (gameState.arcadeMode) {
      const minutes = Math.floor(gameState.timer / 60);
      const seconds = Math.floor(gameState.timer % 60);
      updateStatus(
        `${message} Survived: ${minutes}:${seconds.toString().padStart(2, '0')} | Score: ${gameState.score}`,
        5000
      );
    } else {
      updateStatus(`${message} Final Score: ${gameState.score}`, 5000);
    }
    
    // Draw final state
    draw();
    drawGameOverlay();
    
    console.log('Game over! Final score:', gameState.score);
  }

  // =========== GAME LOOP ===========
  function gameLoop(currentTime) {
    if (!gameState.running) return;
    
    // Calculate delta time
    const dt = gameState.lastTime 
      ? Math.min(0.1, (currentTime - gameState.lastTime) / 1000)
      : 0.016;
    
    gameState.lastTime = currentTime;
    gameState.frameCount++;
    
    // Update FPS counter every second
    if (gameState.frameCount % 60 === 0) {
      gameState.fps = Math.round(1 / dt);
    }
    
    if (!gameState.paused) {
      // Update player
      if (gameState.player) {
        gameState.player.update(dt, gameState.keys, gameState.width);
      }
      
      // Spawn objects
      spawnObjects(dt);
      
      // Update objects
      updateObjects(dt);
      
      // Check collisions
      checkCollisions();
      
      // Update timer
      updateTimer(dt);
      
      // Update UI
      updateUI();
    }
    
    // Draw everything
    draw();
    
    // Continue game loop
    if (gameState.running) {
      requestAnimationFrame(gameLoop);
    }
  }

  // =========== EVENT HANDLERS ===========
  function setupEventListeners() {
    // Window resize
    window.addEventListener('resize', debounce(() => {
      resizeCanvas();
      if (!gameState.running) draw();
    }, 250));
    
    // Keyboard controls
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Canvas click for desktop
    canvas.addEventListener('click', handleCanvasClick);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Control buttons
    if (startBtn) startBtn.addEventListener('click', startGame);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseGame);
    if (resetBtn) resetBtn.addEventListener('click', resetGame);
    if (arcadeBtn) arcadeBtn.addEventListener('click', toggleArcadeMode);
    
    // Settings
    if (soundToggle) {
      soundToggle.addEventListener('change', (e) => {
        gameState.soundEnabled = e.target.checked;
        audioSystem.toggle(e.target.checked);
      });
    }
    
    if (effectsToggle) {
      effectsToggle.addEventListener('change', (e) => {
        gameState.effectsEnabled = e.target.checked;
      });
    }
    
    if (difficultySelect) {
      difficultySelect.addEventListener('change', (e) => {
        gameState.difficulty = e.target.value;
        updateStatus(`Difficulty set to: ${e.target.value}`, 1500);
        if (gameState.running) resetGame();
      });
    }
    
    // Touch controls
    if (leftBtn) {
      leftBtn.addEventListener('mousedown', () => gameState.keys.left = true);
      leftBtn.addEventListener('mouseup', () => gameState.keys.left = false);
      leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        gameState.keys.left = true;
      });
      leftBtn.addEventListener('touchend', () => gameState.keys.left = false);
    }
    
    if (rightBtn) {
      rightBtn.addEventListener('mousedown', () => gameState.keys.right = true);
      rightBtn.addEventListener('mouseup', () => gameState.keys.right = false);
      rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        gameState.keys.right = true;
      });
      rightBtn.addEventListener('touchend', () => gameState.keys.right = false);
    }
    
    if (dropBtn) {
      dropBtn.addEventListener('click', () => {
        if (!gameState.running) {
          startGame();
        } else {
          pauseGame();
        }
      });
    }
    
    // Button hover effects
    const buttons = document.querySelectorAll('.btn, .touch-btn');
    buttons.forEach(btn => {
      btn.addEventListener('mousedown', () => {
        btn.style.transform = 'scale(0.95)';
      });
      btn.addEventListener('mouseup', () => {
        btn.style.transform = '';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
    
    // Prevent context menu on canvas
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    console.log('Event listeners setup complete');
  }

  function handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        gameState.keys.left = true;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        gameState.keys.right = true;
        break;
      case ' ':
      case 'Space':
        e.preventDefault();
        if (!gameState.running) {
          startGame();
        } else {
          pauseGame();
        }
        break;
      case 'Escape':
        if (gameState.running) pauseGame();
        break;
      case 'r':
      case 'R':
        if (e.ctrlKey) resetGame();
        break;
      case 'm':
      case 'M':
        toggleArcadeMode();
        break;
    }
  }

  function handleKeyUp(e) {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        gameState.keys.left = false;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        gameState.keys.right = false;
        break;
    }
  }

  function handleCanvasClick(e) {
    if (!gameState.running) {
      startGame();
      return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;
    
    // Left third: move left
    if (x < third) {
      gameState.keys.left = true;
      gameState.keys.right = false;
      setTimeout(() => gameState.keys.left = false, 200);
    }
    // Right third: move right
    else if (x > third * 2) {
      gameState.keys.right = true;
      gameState.keys.left = false;
      setTimeout(() => gameState.keys.right = false, 200);
    }
    // Middle third: pause/resume
    else {
      pauseGame();
    }
  }

  function handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleCanvasClick(touch);
    }
  }

  function handleTouchMove(e) {
    e.preventDefault();
  }

  function handleTouchEnd(e) {
    e.preventDefault();
    // Reset movement keys when touch ends
    gameState.keys.left = false;
    gameState.keys.right = false;
  }

  // =========== UTILITY FUNCTIONS ===========
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // =========== INITIALIZATION ===========
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }

  // Export for debugging (optional)
  window.honeyGame = {
    state: gameState,
    start: startGame,
    pause: pauseGame,
    reset: resetGame,
    toggleArcade: toggleArcadeMode
  };

})();
