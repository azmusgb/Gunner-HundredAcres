// js/honey-hunt.js
// Enhanced fullscreen honey hunt game with all features

(function () {
  "use strict";

  // Get canvas and context
  const canvas = document.getElementById("honeyCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // HUD Elements
  const scoreEl = document.getElementById("scoreValue");
  const timerEl = document.getElementById("timeValue");
  const livesEl = document.getElementById("livesValue");
  const bestEl = document.getElementById("bestValue");
  const comboEl = document.getElementById("comboValue");
  const statusEl = document.getElementById("statusText");
  const bestLabel = document.getElementById("bestLabel");

  // Control Elements
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resetBtn = document.getElementById("resetBtn");
  const difficultySelect = document.getElementById("difficultySelect");
  const arcadeModeBtn = document.getElementById("arcadeModeBtn");
  const streakSoundToggle = document.getElementById("streakSoundToggle");

  // Touch Controls
  const leftBtn = document.getElementById("leftBtn");
  const rightBtn = document.getElementById("rightBtn");
  const dropBtn = document.getElementById("dropBtn");

  // Audio Context
  let audioContext;
  let sounds = {};

  // Game State
  const state = {
    running: false,
    paused: false,
    arcade: false,
    score: 0,
    lives: 3,
    timer: 60,
    best: 0,
    lastTime: 0,
    width: 800,
    height: 500,
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
    comboTime: 0,
    difficulty: 'normal',
    keys: {
      left: false,
      right: false
    },
    hudAnimations: {
      score: false,
      combo: false
    }
  };

  // Difficulty Settings
  const difficulties = {
    easy: { dropSpeed: 0.25, leafSpeed: 0.22, spawnRate: 0.8, lifeCount: 5 },
    normal: { dropSpeed: 0.3, leafSpeed: 0.25, spawnRate: 1.0, lifeCount: 3 },
    hard: { dropSpeed: 0.4, leafSpeed: 0.3, spawnRate: 1.5, lifeCount: 2 }
  };

  // Color Palette
  const colors = {
    honey: ['#FFD700', '#FFC107', '#FF9800'],
    leaf: ['#7CB342', '#8BC34A', '#9CCC65'],
    player: ['#FF9800', '#FF5722'],
    background: ['#FFF8E1', '#FFECB3', '#FFE082'],
    particle: ['#FFD54F', '#FFCA28', '#FFB300'],
    combo: ['#FF4081', '#E91E63', '#C2185B'],
    ui: {
      primary: '#FFC42B',
      secondary: '#7CB342',
      danger: '#FF5252',
      success: '#4CAF50'
    }
  };

  /* ========= INITIALIZATION ========= */

  function initAudio() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      createSounds();
    } catch (e) {
      console.log("Audio not available");
    }
  }

  function createSounds() {
    if (!audioContext) return;
    
    const createBeep = (frequency, duration, type = 'sine', volume = 0.3) => {
      return () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
      };
    };

    sounds = {
      collect: createBeep(523.25, 0.1, 'sine'),
      hurt: createBeep(220, 0.2, 'sawtooth'),
      powerup: createBeep(659.25, 0.3, 'triangle'),
      combobreak: createBeep(880, 0.5, 'square'),
      button: createBeep(349.23, 0.05, 'sine'),
      start: createBeep(523.25, 0.5, 'sine'),
      gameover: createBeep(220, 1.0, 'sawtooth')
    };
  }

  function playSound(name) {
    if (sounds[name] && streakSoundToggle?.checked !== false) {
      try {
        sounds[name]();
      } catch (e) {
        // Silent fallback
      }
    }
  }

  /* ========= CANVAS & RESIZE ========= */

  function resizeCanvas() {
    const container = document.getElementById('canvasContainer');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const displayWidth = Math.floor(rect.width);
    const displayHeight = Math.floor(rect.height);

    canvas.width = displayWidth;
    canvas.height = displayHeight;
    
    state.width = displayWidth;
    state.height = displayHeight;

    if (state.player) {
      state.player.y = state.height - state.player.height - 20;
    }
  }

  /* ========= GAME OBJECTS ========= */

  function createPlayer() {
    const w = state.width * 0.12;
    const h = state.height * 0.14;
    state.player = {
      x: state.width / 2 - w / 2,
      y: state.height - h - 20,
      width: w,
      height: h,
      speed: state.width * 0.6,
      velX: 0,
      tilt: 0,
      bob: 0,
      trail: []
    };
  }

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

  /* ========= GAME LOGIC ========= */

  function resetGameValues() {
    const diff = difficulties[state.difficulty];
    
    state.score = 0;
    state.lives = diff.lifeCount;
    state.timer = state.arcade ? 999 : 60;
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
    state.comboTime = 0;
    
    updateHUD();
    updateStatus("Ready to hunt? Press Start!");
  }

  function loadBest() {
    try {
      const stored = localStorage.getItem("honeyGameBest");
      state.best = stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      state.best = 0;
    }
    updateBestDisplay();
  }

  function saveBest() {
    if (state.score > state.best) {
      state.best = state.score;
      updateBestDisplay();
      try {
        localStorage.setItem("honeyGameBest", String(state.best));
      } catch {}
    }
  }

  function updateBestDisplay() {
    if (bestEl) bestEl.textContent = state.best.toString();
    if (bestLabel) {
      const span = bestLabel.querySelector('span');
      if (span) span.textContent = `Best: ${state.best} pts`;
    }
  }

  function updateHUD() {
    if (scoreEl) {
      scoreEl.textContent = state.score.toString();
      if (state.hudAnimations.score) {
        scoreEl.classList.add('score-updated');
        setTimeout(() => scoreEl.classList.remove('score-updated'), 300);
      }
    }
    if (livesEl) {
      livesEl.textContent = state.lives.toString();
      livesEl.style.color = state.lives <= 1 ? colors.ui.danger : colors.ui.primary;
    }
    if (timerEl) {
      const seconds = Math.max(0, Math.floor(state.timer));
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      timerEl.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      
      if (seconds < 10 && !state.arcade) {
        timerEl.style.color = colors.ui.danger;
        timerEl.style.animation = seconds % 2 === 0 ? 'pulse 0.5s infinite' : 'none';
      } else {
        timerEl.style.color = '';
        timerEl.style.animation = '';
      }
    }
    if (comboEl) {
      comboEl.textContent = `x${state.multiplier}`;
      comboEl.parentElement.parentElement.style.display = state.multiplier > 1 ? 'flex' : 'none';
    }
  }

  function updateStatus(message, duration = 3000) {
    if (statusEl) {
      statusEl.textContent = message;
      if (duration > 0) {
        setTimeout(() => {
          if (statusEl.textContent === message) {
            statusEl.textContent = state.running 
              ? "Use arrow keys or tap to move!" 
              : "Press Start to begin!";
          }
        }, duration);
      }
    }
  }

  function spawnDrop() {
    const diff = difficulties[state.difficulty];
    const size = state.height * 0.05;
    const drop = {
      x: Math.random() * (state.width - size * 2) + size,
      y: -size,
      r: size,
      vy: state.height * (diff.dropSpeed + Math.random() * 0.1),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 2 + Math.random() * 3,
      trail: []
    };
    
    state.drops.push(drop);
  }

  function spawnLeaf() {
    const diff = difficulties[state.difficulty];
    const w = state.width * 0.1;
    const h = state.height * 0.05;
    state.leaves.push({
      x: Math.random() * (state.width - w * 2) + w,
      y: -h,
      w, h,
      vy: state.height * (diff.leafSpeed + Math.random() * 0.1),
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      flip: Math.random() > 0.5 ? 1 : -1
    });
  }

  function movePlayer(dt) {
    if (!state.player) return;
    
    const p = state.player;
    let dir = 0;
    if (state.keys.left) dir -= 1;
    if (state.keys.right) dir += 1;
    
    // Smooth movement
    const targetSpeed = dir * p.speed;
    p.velX += (targetSpeed - p.velX) * dt * 10;
    p.x += p.velX * dt;
    
    // Boundaries
    const margin = p.width * 0.4;
    p.x = Math.max(margin, Math.min(state.width - margin - p.width, p.x));
    
    // Animations
    p.tilt = dir * 0.3;
    p.bob += dt * 8;
    
    // Trail
    p.trail.unshift({ x: p.x + p.width/2, y: p.y + p.height/2 });
    if (p.trail.length > 8) p.trail.pop();
  }

  function updateObjects(dt) {
    const diff = difficulties[state.difficulty];
    const spawnRate = diff.spawnRate * (1 + (state.level - 1) * 0.1);
    
    // Spawn objects
    if (Math.random() < 1.2 * dt * spawnRate) spawnDrop();
    if (Math.random() < 0.4 * dt * spawnRate) spawnLeaf();
    
    // Update drops
    state.drops.forEach((d) => {
      d.y += d.vy * dt;
      d.rotation += d.rotationSpeed * dt;
      d.wobble += d.wobbleSpeed * dt;
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
      p.vy += 9.8 * dt;
      p.life -= dt;
      p.rotation += p.rotationSpeed * dt;
    });
    
    // Update combos
    state.combos.forEach((c) => {
      c.y += c.vy * dt;
      c.life -= dt * 0.5;
      c.scale = 1 + (1 - c.life) * 0.5;
    });
    
    // Clean up
    state.drops = state.drops.filter((d) => d.y < state.height + d.r * 2);
    state.leaves = state.leaves.filter((l) => l.y < state.height + l.h * 2);
    state.particles = state.particles.filter((p) => p.life > 0);
    state.combos = state.combos.filter((c) => c.life > 0);
    
    // Combo timer
    if (state.streak > 0) {
      state.comboTime -= dt;
      if (state.comboTime <= 0) {
        state.streak = 0;
        state.multiplier = 1;
      }
    }
  }

  function checkCollisions() {
    if (!state.player) return;
    const p = state.player;
    
    // Honey drops
    for (let i = state.drops.length - 1; i >= 0; i--) {
      const d = state.drops[i];
      const dx = d.x - (p.x + p.width/2);
      const dy = d.y - (p.y + p.height/2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < (p.width * 0.4 + d.r * 0.8)) {
        // Collect
        state.drops.splice(i, 1);
        
        // Score calculation
        const baseScore = 10;
        const streakBonus = Math.min(50, state.streak * 2);
        const score = (baseScore + streakBonus) * state.multiplier;
        
        state.score += Math.floor(score);
        state.streak++;
        state.comboTime = 3; // 3 seconds to keep combo
        
        // Update multiplier
        if (state.streak >= 10) state.multiplier = 2;
        if (state.streak >= 25) state.multiplier = 3;
        if (state.streak >= 50) state.multiplier = 4;
        
        // Effects
        createParticles(d.x, d.y, 12, colors.honey, 'collect');
        createCombo(d.x, d.y, `+${Math.floor(score)}`, colors.combo[0]);
        
        playSound('collect');
        state.shake = 0.2;
        state.glow = 0.5;
        state.hudAnimations.score = true;
        
        // Messages
        if (state.streak % 10 === 0) {
          updateStatus(`${state.streak} HONEY STREAK! x${state.multiplier}`, 1500);
          playSound('powerup');
        }
        
        // Level up every 500 points
        if (state.score >= state.level * 500) {
          state.level++;
          updateStatus(`LEVEL ${state.level}!`, 2000);
          playSound('powerup');
        }
        
        updateHUD();
        state.hudAnimations.score = false;
      }
    }
    
    // Leaves
    for (let i = state.leaves.length - 1; i >= 0; i--) {
      const l = state.leaves[i];
      const px = p.x + p.width * 0.5;
      const py = p.y + p.height * 0.5;
      const lx = l.x;
      const ly = l.y;
      
      const dx = Math.abs(lx - px);
      const dy = Math.abs(ly - py);
      const halfWidth = (p.width * 0.4 + l.w * 0.5);
      const halfHeight = (p.height * 0.4 + l.h * 0.5);
      
      if (dx < halfWidth && dy < halfHeight) {
        state.leaves.splice(i, 1);
        state.lives--;
        state.streak = 0;
        state.multiplier = 1;
        state.comboTime = 0;
        
        createParticles(l.x, l.y, 8, colors.leaf, 'hit');
        state.shake = 0.5;
        
        playSound('hurt');
        updateStatus("Oh bother! Lost a tumble...", 1500);
        
        updateHUD();
        
        if (state.lives <= 0) {
          createParticles(p.x + p.width/2, p.y + p.height/2, 20, colors.player, 'death');
          setTimeout(() => endGame(), 800);
          return;
        }
      }
    }
  }

  function updateTimer(dt) {
    if (!state.arcade) {
      state.timer -= dt;
      if (state.timer <= 0) {
        state.timer = 0;
        endGame();
      }
    } else {
      state.timer -= dt; // Count up in arcade mode
    }
  }

  /* ========= DRAWING ========= */

  function drawBackground() {
    const w = state.width;
    const h = state.height;
    
    // Gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#FFF8E1');
    gradient.addColorStop(0.4, '#FFECB3');
    gradient.addColorStop(1, '#FFE082');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    // Sun
    const time = Date.now() * 0.001;
    ctx.save();
    ctx.globalAlpha = 0.6 + Math.sin(time) * 0.2;
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(w * 0.85, h * 0.15, Math.min(w, h) * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const clouds = [
      { x: (w * 0.2 + time * 40) % (w + 200) - 100, y: h * 0.15 },
      { x: (w * 0.5 + time * 30) % (w + 200) - 100, y: h * 0.1 },
      { x: (w * 0.7 + time * 20) % (w + 200) - 100, y: h * 0.18 }
    ];
    
    clouds.forEach((c) => {
      if (c.x < -100 || c.x > w + 100) return;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 30, 0, Math.PI * 2);
      ctx.arc(c.x + 25, c.y + 8, 24, 0, Math.PI * 2);
      ctx.arc(c.x - 20, c.y + 12, 22, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Ground
    ctx.fillStyle = '#C5E1A5';
    ctx.fillRect(0, h * 0.82, w, h * 0.18);
    
    // Grass detail
    ctx.strokeStyle = '#9CCC65';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 15) {
      const height = 8 + Math.sin(time + i * 0.1) * 4;
      ctx.beginPath();
      ctx.moveTo(i, h * 0.82);
      ctx.quadraticCurveTo(i + 7.5, h * 0.82 - height, i + 15, h * 0.82);
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
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5;
          ctx.lineTo(
            Math.cos(angle) * p.size,
            Math.sin(angle) * p.size
          );
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  function drawDrops() {
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 15;
    
    state.drops.forEach((d) => {
      ctx.save();
      ctx.translate(d.x, d.y + Math.sin(d.wobble) * 4);
      ctx.rotate(d.rotation);
      
      // Honey drop shape
      ctx.fillStyle = `hsl(45, 100%, ${60 + Math.sin(d.wobble * 2) * 10}%)`;
      ctx.beginPath();
      ctx.moveTo(0, -d.r * 0.6);
      ctx.quadraticCurveTo(-d.r, 0, 0, d.r);
      ctx.quadraticCurveTo(d.r, 0, 0, -d.r * 0.6);
      ctx.fill();
      
      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(-d.r * 0.3, -d.r * 0.3, d.r * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
    
    ctx.shadowBlur = 0;
  }

  function drawLeaves() {
    state.leaves.forEach((l) => {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rot);
      ctx.scale(l.flip, 1);
      
      const gradient = ctx.createLinearGradient(-l.w/2, 0, l.w/2, 0);
      gradient.addColorStop(0, '#8BC34A');
      gradient.addColorStop(1, '#7CB342');
      ctx.fillStyle = gradient;
      
      // Leaf shape
      ctx.beginPath();
      ctx.moveTo(-l.w/2, 0);
      ctx.quadraticCurveTo(0, -l.h/2, l.w/2, 0);
      ctx.quadraticCurveTo(0, l.h/2, -l.w/2, 0);
      ctx.fill();
      
      // Vein
      ctx.strokeStyle = '#689F38';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-l.w/3, 0);
      ctx.lineTo(l.w/3, 0);
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
        (Math.random() - 0.5) * state.shake * 15,
        (Math.random() - 0.5) * state.shake * 15
      );
      state.shake = Math.max(0, state.shake - 0.05);
    }
    
    // Apply glow
    if (state.glow > 0) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = state.glow * 25;
      state.glow = Math.max(0, state.glow - 0.05);
    }
    
    // Draw trail
    if (p.trail.length > 1) {
      ctx.strokeStyle = 'rgba(255, 152, 0, 0.15)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(p.trail[0].x, p.trail[0].y);
      for (let i = 1; i < p.trail.length; i++) {
        ctx.lineTo(p.trail[i].x, p.trail[i].y);
      }
      ctx.stroke();
    }
    
    // Position
    const bobOffset = Math.sin(p.bob) * 3;
    ctx.translate(p.x + p.width/2, p.y + p.height/2 + bobOffset);
    ctx.rotate(p.tilt * 0.3);
    
    // Body
    const bodyGradient = ctx.createLinearGradient(-p.width/2, 0, p.width/2, 0);
    bodyGradient.addColorStop(0, '#FF9800');
    bodyGradient.addColorStop(1, '#FF5722');
    ctx.fillStyle = bodyGradient;
    
    ctx.beginPath();
    ctx.roundRect(-p.width/2, -p.height/3, p.width, p.height * 0.7, 12);
    ctx.fill();
    
    // Head
    ctx.fillStyle = '#FF9800';
    ctx.beginPath();
    ctx.arc(0, -p.height * 0.22, p.height * 0.22, 0, Math.PI * 2);
    ctx.fill();
    
    // Ears
    ctx.beginPath();
    ctx.arc(-p.width * 0.18, -p.height * 0.35, p.height * 0.08, 0, Math.PI * 2);
    ctx.arc(p.width * 0.18, -p.height * 0.35, p.height * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    const eyeY = -p.height * 0.26 + Math.sin(p.bob * 2) * 1;
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.arc(-p.width * 0.06, eyeY, p.height * 0.03, 0, Math.PI * 2);
    ctx.arc(p.width * 0.06, eyeY, p.height * 0.03, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye highlights
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-p.width * 0.07, eyeY - 2, 2, 0, Math.PI * 2);
    ctx.arc(p.width * 0.05, eyeY - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Nose
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.arc(0, -p.height * 0.2, p.height * 0.04, 0, Math.PI * 2);
    ctx.fill();
    
    // Honey jar
    const jarW = p.width * 0.32;
    const jarH = p.height * 0.25;
    
    // Jar glass
    ctx.fillStyle = 'rgba(154, 106, 59, 0.8)';
    ctx.beginPath();
    ctx.roundRect(-jarW/2, p.height * 0.12, jarW, jarH, 6);
    ctx.fill();
    
    // Honey
    const honeyLevel = 0.6 + Math.sin(p.bob) * 0.1;
    ctx.fillStyle = '#FFC107';
    ctx.beginPath();
    ctx.roundRect(-jarW/2 + 2, p.height * 0.12 + jarH * (1 - honeyLevel), 
                  jarW - 4, jarH * honeyLevel, 4);
    ctx.fill();
    
    // Jar rim
    ctx.fillStyle = '#795548';
    ctx.beginPath();
    ctx.roundRect(-jarW/2 - 2, p.height * 0.12 - 3, jarW + 4, 6, 3);
    ctx.fill();
    
    ctx.restore();
  }

  function drawCombos() {
    state.combos.forEach((c) => {
      ctx.save();
      ctx.globalAlpha = c.life;
      ctx.translate(c.x, c.y);
      ctx.scale(c.scale, c.scale);
      
      ctx.font = 'bold 24px Lato';
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

  function drawHUDOverlay() {
    if (state.multiplier > 1) {
      ctx.save();
      ctx.fillStyle = colors.combo[0];
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.roundRect(10, 10, 50, 50, 25);
      ctx.fill();
      
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px Lato';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`x${state.multiplier}`, 35, 35);
      ctx.restore();
    }
    
    // Streak counter
    if (state.streak > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 64, 129, ${0.3 + Math.sin(Date.now() * 0.01) * 0.2})`;
      ctx.font = 'bold 18px Lato';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(`${state.streak} streak`, state.width - 15, 15);
      ctx.restore();
    }
    
    // Level indicator
    ctx.save();
    ctx.fillStyle = colors.ui.primary;
    ctx.font = 'bold 20px Lato';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`Level ${state.level}`, state.width / 2, 15);
    ctx.restore();
  }

  function draw() {
    // Clear with fade
    ctx.fillStyle = 'rgba(255, 248, 225, 0.05)';
    ctx.fillRect(0, 0, state.width, state.height);
    
    // Set blend mode for particles
    ctx.globalCompositeOperation = 'lighter';
    
    drawBackground();
    drawParticles();
    drawDrops();
    drawLeaves();
    drawPlayer();
    drawCombos();
    
    // Reset for HUD
    ctx.globalCompositeOperation = 'source-over';
    drawHUDOverlay();
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
      updateHUD();
    }

    draw();

    if (state.running) {
      frameId = requestAnimationFrame(gameLoop);
    }
  }

  /* ========= GAME CONTROLS ========= */

  function startGame() {
    playSound('start');
    if (!state.player) createPlayer();
    resetGameValues();
    state.running = true;
    state.paused = false;
    if (frameId) cancelAnimationFrame(frameId);
    state.lastTime = 0;
    updateStatus("Go! Catch that honey!", 1500);
    frameId = requestAnimationFrame(gameLoop);
    
    if (startBtn) startBtn.innerHTML = '<i class="fa-solid fa-play"></i><span>Restart</span>';
  }

  function pauseGame() {
    if (!state.running) return;
    state.paused = !state.paused;
    playSound('button');
    if (state.paused) {
      updateStatus("Game Paused", Infinity);
      if (pauseBtn) pauseBtn.innerHTML = '<i class="fa-solid fa-play"></i><span>Resume</span>';
    } else {
      updateStatus("Game Resumed!", 1500);
      if (pauseBtn) pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i><span>Pause</span>';
    }
  }

  function resetGame() {
    playSound('button');
    state.running = false;
    state.paused = false;
    state.arcade = false;
    if (frameId) cancelAnimationFrame(frameId);
    resetGameValues();
    createPlayer();
    updateStatus("Ready to play? Press Start!", 0);
    
    if (startBtn) startBtn.innerHTML = '<i class="fa-solid fa-play"></i><span>Start Hunt</span>';
    if (pauseBtn) pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i><span>Pause</span>';
    if (arcadeModeBtn) {
      arcadeModeBtn.classList.remove('arcade-mode');
      arcadeModeBtn.innerHTML = '<i class="fa-solid fa-gamepad"></i><span>Arcade Mode</span>';
    }
    
    draw();
  }

  function toggleArcadeMode() {
    state.arcade = !state.arcade;
    playSound('powerup');
    
    if (arcadeModeBtn) {
      if (state.arcade) {
        arcadeModeBtn.classList.add('arcade-mode');
        arcadeModeBtn.innerHTML = '<i class="fa-solid fa-fire"></i><span>Arcade ON</span>';
        updateStatus("ARCADE MODE! Infinite play!", 2000);
      } else {
        arcadeModeBtn.classList.remove('arcade-mode');
        arcadeModeBtn.innerHTML = '<i class="fa-solid fa-gamepad"></i><span>Arcade Mode</span>';
        updateStatus("Back to normal mode", 1500);
      }
    }
    
    resetGameValues();
  }

  function endGame() {
    state.running = false;
    state.paused = false;
    saveBest();
    if (frameId) cancelAnimationFrame(frameId);
    
    const messages = [
      "Sweet harvest!",
      "Bee-utiful score!",
      "What a honey pot!",
      "You're a honey hero!"
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    if (state.arcade) {
      updateStatus(`ARCADE SCORE: ${state.score}`, 5000);
    } else {
      updateStatus(`${message} Score: ${state.score}`, 5000);
    }
    
    playSound('gameover');
    draw();
  }

  /* ========= INPUT HANDLING ========= */

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
      if (e.ctrlKey) resetGame();
    } else if (e.key === "Escape") {
      if (state.running) pauseGame();
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
    if (!state.running) {
      startGame();
      return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const third = rect.width / 3;
    
    if (x < third) {
      state.keys.left = true;
      state.keys.right = false;
      setTimeout(() => (state.keys.left = false), 200);
    } else if (x > third * 2) {
      state.keys.right = true;
      state.keys.left = false;
      setTimeout(() => (state.keys.right = false), 200);
    } else {
      pauseGame();
    }
  }

  function onTouchStart(evt) {
    evt.preventDefault();
    const touch = evt.touches[0];
    onCanvasClick(touch);
  }

  /* ========= TOUCH CONTROLS ========= */

  function initTouchControls() {
    if (leftBtn) {
      leftBtn.addEventListener('mousedown', () => state.keys.left = true);
      leftBtn.addEventListener('mouseup', () => state.keys.left = false);
      leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        state.keys.left = true;
      });
      leftBtn.addEventListener('touchend', () => state.keys.left = false);
    }
    
    if (rightBtn) {
      rightBtn.addEventListener('mousedown', () => state.keys.right = true);
      rightBtn.addEventListener('mouseup', () => state.keys.right = false);
      rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        state.keys.right = true;
      });
      rightBtn.addEventListener('touchend', () => state.keys.right = false);
    }
    
    if (dropBtn) {
      dropBtn.addEventListener('click', () => {
        if (!state.running) {
          startGame();
        } else {
          pauseGame();
        }
      });
    }
  }

  /* ========= INITIALIZATION ========= */

  function init() {
    resizeCanvas();
    createPlayer();
    initAudio();
    loadBest();
    updateHUD();
    updateStatus("Welcome to The Great Honey Hunt!", 3000);
    initTouchControls();
    
    draw();

    // Event Listeners
    window.addEventListener("resize", () => {
      resizeCanvas();
      if (!state.running) draw();
    });

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("click", onCanvasClick);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", (e) => e.preventDefault());
    
    // Button events
    if (startBtn) {
      startBtn.addEventListener("click", startGame);
      startBtn.addEventListener("mouseenter", () => playSound('button'));
    }
    
    if (pauseBtn) {
      pauseBtn.addEventListener("click", pauseGame);
      pauseBtn.addEventListener("mouseenter", () => playSound('button'));
    }
    
    if (resetBtn) {
      resetBtn.addEventListener("click", resetGame);
      resetBtn.addEventListener("mouseenter", () => playSound('button'));
    }
    
    if (difficultySelect) {
      difficultySelect.addEventListener("change", (e) => {
        state.difficulty = e.target.value;
        updateStatus(`Difficulty: ${state.difficulty}`, 1500);
        if (state.running) resetGameValues();
      });
    }
    
    if (arcadeModeBtn) {
      arcadeModeBtn.addEventListener("click", toggleArcadeMode);
      arcadeModeBtn.addEventListener("mouseenter", () => playSound('button'));
    }
    
    // Add visual feedback for controls
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
  }

  // Start when ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
