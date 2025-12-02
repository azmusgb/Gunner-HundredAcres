// js/honey-hunt-enhanced.js
// Enhanced honey catch game with particles, animations, and juicy feedback

(function () {
  "use strict";

  const canvas = document.getElementById("honey-game");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  
  // Game elements
  const scoreEl = document.getElementById("score");
  const timerEl = document.getElementById("timer");
  const livesEl = document.getElementById("lives");
  const bestEl = document.getElementById("best");
  const messageEl = document.getElementById("gameMessage");
  
  // Buttons
  const startBtn = document.getElementById("startGame");
  const pauseBtn = document.getElementById("pauseGame");
  const resetBtn = document.getElementById("resetGame");
  
  // Sound elements (we'll create these if they don't exist)
  let audioContext;
  let sounds = {};

  // Enhanced game state
  const state = {
    running: false,
    paused: false,
    score: 0,
    lives: 3,
    timer: 60,
    best: 0,
    lastTime: 0,
    width: 400,
    height: 300,
    player: null,
    drops: [],
    leaves: [],
    particles: [],
    combos: [],
    shake: 0,
    glow: 0,
    level: 1,
    multiplier: 1,
    streak: 0,
    keys: {
      left: false,
      right: false
    },
    gameMode: 'normal' // 'normal', 'frenzy', 'boss'
  };

  // Color palette
  const colors = {
    honey: ['#FFD700', '#FFC107', '#FF9800'],
    leaf: ['#7CB342', '#8BC34A', '#9CCC65'],
    player: ['#FF9800', '#FF5722'],
    background: ['#FFF8E1', '#FFECB3', '#FFE082'],
    particle: ['#FFD54F', '#FFCA28', '#FFB300'],
    combo: ['#FF4081', '#E91E63', '#C2185B']
  };

  // Initialize Web Audio
  function initAudio() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      createSounds();
    } catch (e) {
      console.log("Web Audio API not supported");
    }
  }

  // Create simple synthesized sounds
  function createSounds() {
    if (!audioContext) return;
    
    const createBeep = (frequency, duration, type = 'sine') => {
      return () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      };
    };

    sounds = {
      collect: createBeep(523.25, 0.1, 'sine'),
      hurt: createBeep(220, 0.2, 'sawtooth'),
      powerup: createBeep(659.25, 0.3, 'triangle'),
      combobreak: createBeep(880, 0.5, 'square'),
      button: createBeep(349.23, 0.05, 'sine')
    };
  }

  function playSound(name) {
    if (sounds[name]) {
      try {
        sounds[name]();
      } catch (e) {
        // Sound failed, continue silently
      }
    }
  }

  // Enhanced clamp function
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // Lerp for smooth animations
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Easing functions
  function easeOutBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  function easeInOutQuad(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  }

  // Resize with responsive design
  function resizeCanvas() {
    const wrapper = canvas.parentElement;
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const displayWidth = Math.max(220, Math.min(800, rect.width));
    const displayHeight = displayWidth * 0.75;

    const scale = window.devicePixelRatio || 1;
    canvas.width = displayWidth * scale;
    canvas.height = displayHeight * scale;
    canvas.style.width = displayWidth + "px";
    canvas.style.height = displayHeight + "px";

    ctx.scale(scale, scale);
    state.width = displayWidth;
    state.height = displayHeight;

    if (state.player) {
      state.player.y = state.height - state.player.height - 28;
    }
  }

  // Enhanced player creation
  function createPlayer() {
    const w = state.width * 0.14;
    const h = state.height * 0.16;
    state.player = {
      x: state.width / 2 - w / 2,
      y: state.height - h - 28,
      width: w,
      height: h,
      speed: state.width * 0.5,
      velX: 0,
      targetX: state.width / 2 - w / 2,
      tilt: 0,
      bob: 0,
      trail: []
    };
  }

  // Particle system
  function createParticles(x, y, count, color, type = 'sparkle') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      const life = 0.5 + Math.random() * 0.5;
      
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: 2 + Math.random() * 4,
        color: color[Math.floor(Math.random() * color.length)],
        type,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
  }

  // Combo text effect
  function createCombo(x, y, text, color) {
    state.combos.push({
      x, y,
      text,
      color,
      life: 1,
      vy: -2,
      scale: 1
    });
  }

  // Reset game with effects
  function resetGameValues() {
    state.score = 0;
    state.lives = 3;
    state.timer = 60;
    state.drops = [];
    state.leaves = [];
    state.particles = [];
    state.combos = [];
    state.paused = false;
    state.lastTime = 0;
    state.shake = 0;
    state.glow = 0;
    state.level = 1;
    state.multiplier = 1;
    state.streak = 0;
    state.gameMode = 'normal';
    updateHUD();
    showMessage("Ready?", 1000);
  }

  // Best score handling
  function loadBest() {
    try {
      const stored = localStorage.getItem("honeyGameBest");
      state.best = stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      state.best = 0;
    }
    if (bestEl) bestEl.textContent = state.best.toString();
  }

  function saveBest() {
    if (state.score > state.best) {
      state.best = state.score;
      if (bestEl) bestEl.textContent = state.best.toString();
      try {
        localStorage.setItem("honeyGameBest", String(state.best));
      } catch {}
    }
  }

  // HUD update with animations
  function updateHUD() {
    if (scoreEl) {
      scoreEl.textContent = state.score.toString();
      if (state.score > 0) {
        scoreEl.style.transform = 'scale(1.1)';
        setTimeout(() => scoreEl.style.transform = 'scale(1)', 100);
      }
    }
    if (livesEl) livesEl.textContent = '❤️'.repeat(state.lives);
    if (timerEl) {
      const seconds = Math.max(0, Math.floor(state.timer));
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      timerEl.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      
      // Color warning
      if (seconds < 10) {
        timerEl.style.color = '#FF5252';
        timerEl.style.animation = seconds % 2 === 0 ? 'pulse 0.5s infinite' : 'none';
      } else {
        timerEl.style.color = '';
        timerEl.style.animation = '';
      }
    }
  }

  // Message display
  function showMessage(text, duration = 1500) {
    if (messageEl) {
      messageEl.textContent = text;
      messageEl.style.opacity = '1';
      messageEl.style.transform = 'translateY(0)';
      
      setTimeout(() => {
        messageEl.style.opacity = '0';
        messageEl.style.transform = 'translateY(-20px)';
      }, duration);
    }
  }

  // Enhanced spawn functions
  function spawnDrop() {
    const size = state.height * 0.05;
    const drop = {
      x: Math.random() * (state.width - size * 2) + size,
      y: -size,
      r: size,
      vy: state.height * (0.25 + Math.random() * 0.15 * state.level),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 2 + Math.random() * 3
    };
    
    // Add trail
    drop.trail = [];
    for (let i = 0; i < 3; i++) {
      drop.trail.push({ x: drop.x, y: drop.y });
    }
    
    state.drops.push(drop);
  }

  function spawnLeaf() {
    const w = state.width * 0.11;
    const h = state.height * 0.055;
    state.leaves.push({
      x: Math.random() * (state.width - w * 2) + w,
      y: -h,
      w, h,
      vy: state.height * (0.22 + Math.random() * 0.2 * state.level),
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      flip: Math.random() > 0.5 ? 1 : -1
    });
  }

  // Enhanced player movement with smooth physics
  function movePlayer(dt) {
    if (!state.player) return;
    
    const p = state.player;
    let dir = 0;
    if (state.keys.left) dir -= 1;
    if (state.keys.right) dir += 1;
    
    // Smooth acceleration
    const targetSpeed = dir * p.speed;
    p.velX = lerp(p.velX, targetSpeed, dt * 10);
    p.x += p.velX * dt;
    
    // Add tilt based on movement
    p.tilt = lerp(p.tilt, -dir * 0.3, dt * 8);
    
    // Bobbing animation
    p.bob += dt * 8;
    
    // Boundary clamping with bounce effect
    const margin = p.width * 0.4;
    if (p.x < margin) {
      p.x = margin;
      p.velX = Math.abs(p.velX) * 0.5; // Bounce
      createParticles(p.x, p.y + p.height/2, 5, colors.particle, 'bounce');
    } else if (p.x > state.width - margin - p.width) {
      p.x = state.width - margin - p.width;
      p.velX = -Math.abs(p.velX) * 0.5; // Bounce
      createParticles(p.x + p.width, p.y + p.height/2, 5, colors.particle, 'bounce');
    }
    
    // Trail effect
    p.trail.unshift({ x: p.x + p.width/2, y: p.y + p.height/2 });
    if (p.trail.length > 10) p.trail.pop();
  }

  // Update all game objects
  function updateObjects(dt) {
    // Spawn based on level
    const spawnRate = 1.0 + (state.level - 1) * 0.2;
    if (Math.random() < 1.2 * dt * spawnRate) spawnDrop();
    if (Math.random() < 0.4 * dt * spawnRate) spawnLeaf();
    
    // Update drops with trail
    state.drops.forEach((d) => {
      d.y += d.vy * dt;
      d.rotation += d.rotationSpeed * dt;
      d.wobble += d.wobbleSpeed * dt;
      
      // Update trail
      d.trail.unshift({ x: d.x, y: d.y });
      if (d.trail.length > 5) d.trail.pop();
    });
    
    // Update leaves
    state.leaves.forEach((l) => {
      l.y += l.vy * dt;
      l.rot += l.rotSpeed * dt;
    });
    
    // Update particles
    state.particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 9.8 * dt; // Gravity
      p.life -= dt;
      p.rotation += p.rotationSpeed * dt;
    });
    
    // Update combo texts
    state.combos.forEach((c) => {
      c.y += c.vy * dt;
      c.life -= dt;
      c.scale = easeOutBack(1 - c.life);
    });
    
    // Filter out old objects
    state.drops = state.drops.filter((d) => d.y < state.height + d.r * 2);
    state.leaves = state.leaves.filter((l) => l.y < state.height + l.h * 2);
    state.particles = state.particles.filter((p) => p.life > 0);
    state.combos = state.combos.filter((c) => c.life > 0);
  }

  // Enhanced collision detection
  function checkCollisions() {
    if (!state.player) return;
    const p = state.player;
    
    // Honey drops collision
    for (let i = state.drops.length - 1; i >= 0; i--) {
      const d = state.drops[i];
      const dx = (d.x - (p.x + p.width/2)) / (p.width * 0.5);
      const dy = (d.y - (p.y + p.height/2)) / (p.height * 0.5);
      
      if (dx * dx + dy * dy < 1) {
        // Collect drop
        state.drops.splice(i, 1);
        
        // Score calculation
        const baseScore = 10;
        const comboBonus = Math.floor(state.streak / 5) * 5;
        const score = baseScore * state.multiplier + comboBonus;
        
        state.score += score;
        state.streak++;
        
        // Create effects
        createParticles(d.x, d.y, 15, colors.honey, 'collect');
        createCombo(d.x, d.y, `+${score}`, colors.combo);
        
        // Sound
        playSound('collect');
        
        // Screen shake and glow
        state.shake = 0.3;
        state.glow = 1.0;
        
        // Combo messages
        if (state.streak % 10 === 0) {
          showMessage(`${state.streak} COMBO!`, 800);
          playSound('powerup');
          state.multiplier = Math.min(3, Math.floor(state.streak / 10) + 1);
        }
        
        // Level up
        if (state.score >= state.level * 500) {
          state.level++;
          showMessage(`Level ${state.level}!`, 1200);
          playSound('powerup');
        }
        
        updateHUD();
      }
    }
    
    // Leaves collision
    for (let i = state.leaves.length - 1; i >= 0; i--) {
      const l = state.leaves[i];
      const px = p.x + p.width * 0.5;
      const py = p.y + p.height * 0.5;
      
      // Simple AABB with rotation
      const dx = Math.abs(l.x - px);
      const dy = Math.abs(l.y - py);
      
      if (dx < (p.width * 0.4 + l.w * 0.5) && dy < (p.height * 0.4 + l.h * 0.5)) {
        state.leaves.splice(i, 1);
        state.lives--;
        state.streak = 0;
        state.multiplier = 1;
        
        // Create effects
        createParticles(l.x, l.y, 10, colors.leaf, 'hit');
        state.shake = 0.5;
        
        // Sound
        playSound('hurt');
        
        updateHUD();
        
        if (state.lives <= 0) {
          createParticles(p.x + p.width/2, p.y + p.height/2, 30, colors.player, 'death');
          setTimeout(() => endGame(), 500);
          return;
        }
      }
    }
  }

  // Update timer with time acceleration
  function updateTimer(dt) {
    state.timer -= dt;
    if (state.timer <= 0) {
      state.timer = 0;
      endGame();
    }
  }

  /* ========= ENHANCED DRAWING ========= */
  function drawBackground() {
    const w = state.width;
    const h = state.height;
    
    // Clear with fade for glow effect
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(255, 248, 225, ${0.1 + state.glow * 0.1})`;
    ctx.fillRect(0, 0, w, h);
    
    // Animated gradient background
    const time = Date.now() * 0.001;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, `hsl(50, 100%, ${95 + Math.sin(time) * 5}%)`);
    gradient.addColorStop(0.4, `hsl(45, 100%, ${85 + Math.cos(time * 0.7) * 5}%)`);
    gradient.addColorStop(1, `hsl(40, 100%, ${80 + Math.sin(time * 0.5) * 5}%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    // Sun with glow
    ctx.save();
    ctx.globalAlpha = 0.6 + Math.sin(time) * 0.2;
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(w * 0.9, h * 0.15, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Animated clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const clouds = [
      { x: (w * 0.2 + time * 10) % (w + 100) - 50, y: h * 0.16 },
      { x: (w * 0.5 + time * 8) % (w + 100) - 50, y: h * 0.12 },
      { x: (w * 0.8 + time * 6) % (w + 100) - 50, y: h * 0.18 }
    ];
    
    clouds.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 25, 0, Math.PI * 2);
      ctx.arc(c.x + 20, c.y + 5, 20, 0, Math.PI * 2);
      ctx.arc(c.x - 15, c.y + 10, 18, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Ground with texture
    ctx.fillStyle = '#C5E1A5';
    ctx.fillRect(0, h * 0.8, w, h * 0.2);
    
    // Grass detail
    ctx.strokeStyle = '#9CCC65';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 10) {
      const height = 5 + Math.sin(time + i * 0.1) * 3;
      ctx.beginPath();
      ctx.moveTo(i, h * 0.8);
      ctx.quadraticCurveTo(i + 5, h * 0.8 - height, i + 10, h * 0.8);
      ctx.stroke();
    }
  }

  function drawParticles() {
    state.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      
      if (p.type === 'sparkle') {
        // Star shape for sparkles
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5;
          const radius = p.size;
          ctx.lineTo(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius
          );
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // Circle for other particles
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  function drawDrops() {
    state.drops.forEach((d) => {
      // Draw trail
      ctx.strokeStyle = 'rgba(255, 208, 72, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(d.trail[0].x, d.trail[0].y);
      for (let i = 1; i < d.trail.length; i++) {
        ctx.lineTo(d.trail[i].x, d.trail[i].y);
      }
      ctx.stroke();
      
      // Draw drop with glow
      ctx.save();
      ctx.translate(d.x, d.y + Math.sin(d.wobble) * 3);
      ctx.rotate(d.rotation);
      
      // Glow effect
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 15;
      ctx.fillStyle = `hsl(45, 100%, ${60 + Math.sin(d.wobble * 2) * 10}%)`;
      
      ctx.beginPath();
      ctx.moveTo(0, -d.r * 0.6);
      ctx.quadraticCurveTo(-d.r, 0, 0, d.r);
      ctx.quadraticCurveTo(d.r, 0, 0, -d.r * 0.6);
      ctx.fill();
      
      // Highlight
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(-d.r * 0.3, -d.r * 0.3, d.r * 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }

  function drawLeaves() {
    state.leaves.forEach((l) => {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rot);
      ctx.scale(l.flip, 1);
      
      // Leaf with gradient
      const gradient = ctx.createLinearGradient(-l.w/2, 0, l.w/2, 0);
      gradient.addColorStop(0, '#8BC34A');
      gradient.addColorStop(1, '#7CB342');
      ctx.fillStyle = gradient;
      
      // Veins
      ctx.strokeStyle = '#689F38';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.moveTo(-l.w/2, 0);
      ctx.quadraticCurveTo(0, -l.h/2, l.w/2, 0);
      ctx.quadraticCurveTo(0, l.h/2, -l.w/2, 0);
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();
    });
  }

  function drawPlayer() {
    const p = state.player;
    if (!p) return;
    
    ctx.save();
    
    // Apply screen shake
    if (state.shake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * state.shake * 10,
        (Math.random() - 0.5) * state.shake * 10
      );
      state.shake = Math.max(0, state.shake - 0.05);
    }
    
    // Apply glow
    if (state.glow > 0) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = state.glow * 20;
      state.glow = Math.max(0, state.glow - 0.05);
    }
    
    // Draw trail
    ctx.strokeStyle = 'rgba(255, 152, 0, 0.2)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.trail[0].x, p.trail[0].y);
    for (let i = 1; i < p.trail.length; i++) {
      ctx.lineTo(p.trail[i].x, p.trail[i].y);
    }
    ctx.stroke();
    
    // Apply transformations
    ctx.translate(p.x + p.width/2, p.y + p.height/2 + Math.sin(p.bob) * 3);
    ctx.rotate(p.tilt);
    
    // Body with gradient
    const bodyGradient = ctx.createLinearGradient(-p.width/2, 0, p.width/2, 0);
    bodyGradient.addColorStop(0, '#FF9800');
    bodyGradient.addColorStop(1, '#FF5722');
    ctx.fillStyle = bodyGradient;
    
    ctx.beginPath();
    ctx.roundRect(-p.width/2, -p.height/3, p.width, p.height * 0.7, 15);
    ctx.fill();
    
    // Head
    ctx.fillStyle = '#FF9800';
    ctx.beginPath();
    ctx.arc(0, -p.height * 0.22, p.height * 0.22, 0, Math.PI * 2);
    ctx.fill();
    
    // Ears
    ctx.beginPath();
    ctx.arc(-p.width * 0.2, -p.height * 0.35, p.height * 0.09, 0, Math.PI * 2);
    ctx.arc(p.width * 0.2, -p.height * 0.35, p.height * 0.09, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes (animated)
    const eyeY = -p.height * 0.26 + Math.sin(p.bob * 2) * 1;
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.arc(-p.width * 0.07, eyeY, p.height * 0.03, 0, Math.PI * 2);
    ctx.arc(p.width * 0.07, eyeY, p.height * 0.03, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye highlights
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-p.width * 0.08, eyeY - 1, 1, 0, Math.PI * 2);
    ctx.arc(p.width * 0.06, eyeY - 1, 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Nose
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.arc(0, -p.height * 0.2, p.height * 0.04, 0, Math.PI * 2);
    ctx.fill();
    
    // Honey jar
    const jarW = p.width * 0.32;
    const jarH = p.height * 0.25;
    const jx = -jarW/2;
    const jy = p.height * 0.12;
    
    // Jar glass
    ctx.fillStyle = 'rgba(154, 106, 59, 0.8)';
    ctx.beginPath();
    ctx.roundRect(jx, jy, jarW, jarH, 8);
    ctx.fill();
    
    // Honey level (animated)
    const honeyLevel = 0.6 + Math.sin(p.bob) * 0.1;
    ctx.fillStyle = '#FFC107';
    ctx.beginPath();
    ctx.roundRect(jx + 2, jy + jarH * (1 - honeyLevel), jarW - 4, jarH * honeyLevel, 6);
    ctx.fill();
    
    // Jar rim
    ctx.fillStyle = '#795548';
    ctx.beginPath();
    ctx.roundRect(jx - 2, jy - 3, jarW + 4, 6, 3);
    ctx.fill();
    
    ctx.restore();
  }

  function drawCombos() {
    state.combos.forEach((c) => {
      ctx.save();
      ctx.globalAlpha = c.life;
      ctx.translate(c.x, c.y);
      ctx.scale(c.scale, c.scale);
      
      // Text with outline
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = c.color;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 4;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.strokeText(c.text, 0, 0);
      ctx.fillText(c.text, 0, 0);
      
      ctx.restore();
    });
  }

  function drawHUD() {
    // Draw multiplier badge
    if (state.multiplier > 1) {
      ctx.save();
      ctx.fillStyle = colors.combo[0];
      ctx.beginPath();
      ctx.roundRect(10, 10, 40, 40, 20);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`x${state.multiplier}`, 30, 30);
      ctx.restore();
    }
    
    // Draw streak
    if (state.streak > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 64, 129, ${0.3 + Math.sin(Date.now() * 0.01) * 0.2})`;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(`${state.streak} streak`, state.width - 10, 10);
      ctx.restore();
    }
    
    // Draw level
    ctx.save();
    ctx.fillStyle = '#FF9800';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`Level ${state.level}`, state.width / 2, 10);
    ctx.restore();
  }

  function draw() {
    // Clear with fade
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 248, 225, 0.1)';
    ctx.fillRect(0, 0, state.width, state.height);
    
    // Set composite for glow effects
    ctx.globalCompositeOperation = 'lighter';
    
    drawBackground();
    drawParticles();
    drawDrops();
    drawLeaves();
    drawPlayer();
    drawCombos();
    
    // Reset composite for HUD
    ctx.globalCompositeOperation = 'source-over';
    drawHUD();
  }

  /* ========= GAME LOOP ========= */
  let frameId = null;

  function gameLoop(timestamp) {
    if (!state.running) return;

    const dt = state.lastTime ? Math.min(0.1, (timestamp - state.lastTime) / 1000) : 0;
    state.lastTime = timestamp;

    if (!state.paused) {
      movePlayer(dt);
      updateObjects(dt);
      checkCollisions();
      updateTimer(dt);
    }

    draw();

    if (state.running) {
      frameId = requestAnimationFrame(gameLoop);
    }
  }

  /* ========= GAME CONTROL ========= */
  function startGame() {
    playSound('button');
    if (!state.player) createPlayer();
    resetGameValues();
    state.running = true;
    state.paused = false;
    if (frameId) cancelAnimationFrame(frameId);
    state.lastTime = 0;
    showMessage("Go!", 800);
    frameId = requestAnimationFrame(gameLoop);
  }

  function pauseGame() {
    if (!state.running) return;
    state.paused = !state.paused;
    playSound('button');
    if (state.paused) {
      showMessage("Paused", Infinity);
    } else {
      showMessage("", 0);
    }
  }

  function resetGame() {
    playSound('button');
    state.running = false;
    state.paused = false;
    if (frameId) cancelAnimationFrame(frameId);
    resetGameValues();
    createPlayer();
    showMessage("", 0);
    draw();
  }

  function endGame() {
    state.running = false;
    state.paused = false;
    saveBest();
    if (frameId) cancelAnimationFrame(frameId);
    
    const messages = [
      "Great Job!",
      "Sweet Success!",
      "Honey Harvested!",
      "Bee-utiful!"
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    showMessage(`${message} Score: ${state.score}`, 3000);
    
    draw();
  }

  /* ========= ENHANCED INPUT ========= */
  function onKeyDown(e) {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      state.keys.left = true;
    } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      state.keys.right = true;
    } else if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      if (!state.running) {
        startGame();
      } else {
        pauseGame();
      }
    } else if (e.key === "r" || e.key === "R") {
      resetGame();
    }
  }

  function onKeyUp(e) {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      state.keys.left = false;
    } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      state.keys.right = false;
    }
  }

  function onCanvasClick(evt) {
    const rect = canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    
    // Split into thirds for better mobile control
    const third = rect.width / 3;
    if (x < third) {
      state.keys.left = true;
      state.keys.right = false;
      setTimeout(() => (state.keys.left = false), 150);
    } else if (x > third * 2) {
      state.keys.right = true;
      state.keys.left = false;
      setTimeout(() => (state.keys.right = false), 150);
    } else {
      // Center tap to pause/start
      if (!state.running) {
        startGame();
      } else {
        pauseGame();
      }
    }
  }

  function onCanvasTouch(evt) {
    evt.preventDefault();
    const touch = evt.touches[0];
    onCanvasClick(touch);
  }

  /* ========= INITIALIZATION ========= */
  function init() {
    resizeCanvas();
    createPlayer();
    loadBest();
    initAudio();
    updateHUD();
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      #score { transition: transform 0.1s ease; }
      #timer { transition: all 0.3s ease; }
    `;
    document.head.appendChild(style);
    
    draw();

    // Event listeners
    window.addEventListener("resize", () => {
      resizeCanvas();
      if (!state.running) draw();
    });

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("click", onCanvasClick);
    canvas.addEventListener("touchstart", onCanvasTouch);
    canvas.addEventListener("touchmove", (e) => e.preventDefault());
    
    // Button events with hover effects
    [startBtn, pauseBtn, resetBtn].forEach(btn => {
      if (btn) {
        btn.addEventListener("click", () => playSound('button'));
        btn.addEventListener("mouseenter", () => {
          btn.style.transform = 'scale(1.05)';
        });
        btn.addEventListener("mouseleave", () => {
          btn.style.transform = 'scale(1)';
        });
      }
    });

    if (startBtn) startBtn.addEventListener("click", startGame);
    if (pauseBtn) pauseBtn.addEventListener("click", pauseGame);
    if (resetBtn) resetBtn.addEventListener("click", resetGame);
  }

  // Initialize when ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
