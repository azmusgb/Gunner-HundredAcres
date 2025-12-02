(() => {
  const canvas = document.getElementById('honeyCanvas');
  const container = document.getElementById('canvasContainer');
  if (!canvas || !container) return;

  const ctx = canvas.getContext('2d');

  // HUD elements
  const scoreEl = document.getElementById('scoreValue');
  const timeEl = document.getElementById('timeValue');
  const livesEl = document.getElementById('livesValue');
  const comboEl = document.getElementById('comboValue');
  const bestEl = document.getElementById('bestValue');
  const bestLabelEl = document.getElementById('bestLabel');
  const statusTextEl = document.getElementById('statusText');
  const statusBarEl = document.getElementById('statusBar');
  const comboPillEl = document.getElementById('comboPill');

  // Controls
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const difficultySelect = document.getElementById('difficultySelect');
  const streakSoundToggle = document.getElementById('streakSoundToggle');
  const arcadeModeBtn = document.getElementById('arcadeModeBtn');

  const leftBtn = document.getElementById('leftBtn');
  const rightBtn = document.getElementById('rightBtn');
  const dropBtn = document.getElementById('dropBtn');

  const bearBadge = document.getElementById('bearBadge');

  // Game state
  let width = 400;
  let height = 300;
  let lastTime = 0;
  let frameRequest = null;

  const state = {
    running: false,
    paused: false,
    timer: 45,
    score: 0,
    lives: 3,
    combo: 1,
    comboTimer: 0,
    best: 0,
    arcadeMode: false,
    difficulty: 'normal',
    player: null,
    drops: [],
    leaves: [],
    keys: {
      left: false,
      right: false
    }
  };

  const DIFFICULTY_SETTINGS = {
    easy: { dropRate: 0.9, leafRate: 0.25, dropSpeed: [60, 90], leafSpeed: [80, 110] },
    normal: { dropRate: 1.1, leafRate: 0.35, dropSpeed: [80, 120], leafSpeed: [100, 140] },
    hard: { dropRate: 1.5, leafRate: 0.55, dropSpeed: [110, 150], leafSpeed: [130, 180] }
  };

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    const targetWidth = rect.width;
    const targetHeight = targetWidth * 0.75; // 4:3
    canvas.width = targetWidth * 2;
    canvas.height = targetHeight * 2;
    canvas.style.height = `${targetHeight}px`;
    width = canvas.width;
    height = canvas.height;
    if (state.player) {
      state.player.y = height - state.player.height - 24;
    }
  }

  function resetPlayer() {
    state.player = {
      width: width * 0.12,
      height: height * 0.12,
      x: width / 2 - (width * 0.12) / 2,
      y: height - height * 0.12 - 24,
      speed: width * 0.35
    };
  }

  function resetGameValues() {
    state.timer = state.arcadeMode ? 999 : 45;
    state.score = 0;
    state.lives = 3;
    state.combo = 1;
    state.comboTimer = 0;
    state.drops = [];
    state.leaves = [];
    state.paused = false;
    updateHUD();
  }

  function loadBestScore() {
    try {
      const stored = localStorage.getItem('honey_best_score');
      if (stored) {
        state.best = parseInt(stored, 10) || 0;
      }
    } catch (e) {
      state.best = 0;
    }
    if (bestEl) bestEl.textContent = state.best.toString();
    if (bestLabelEl) bestLabelEl.textContent = `Best: ${state.best} pts`;
  }

  function saveBestScore() {
    if (state.score > state.best) {
      state.best = state.score;
      try {
        localStorage.setItem('honey_best_score', String(state.best));
      } catch (e) {
        // ignore storage errors
      }
      if (bestEl) bestEl.textContent = state.best.toString();
      if (bestLabelEl) bestLabelEl.textContent = `Best: ${state.best} pts`;
    }
  }

  function updateHUD() {
    if (scoreEl) scoreEl.textContent = state.score.toString();
    if (timeEl) {
      const t = state.arcadeMode ? '∞' : `${Math.max(0, Math.floor(state.timer))}s`;
      timeEl.textContent = t;
    }
    if (livesEl) livesEl.textContent = state.lives.toString();
    if (comboEl) comboEl.textContent = `x${state.combo}`;
  }

  function setStatus(message, tone = 'neutral') {
    if (!statusTextEl || !statusBarEl) return;
    statusTextEl.textContent = message;
    statusBarEl.dataset.tone = tone;
  }

  function spawnDrop() {
    const s = DIFFICULTY_SETTINGS[state.difficulty] || DIFFICULTY_SETTINGS.normal;
    const size = rand(height * 0.04, height * 0.06);
    state.drops.push({
      x: rand(size, width - size),
      y: -size,
      radius: size,
      vy: rand(s.dropSpeed[0], s.dropSpeed[1]),
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleAmp: size * 0.25
    });
  }

  function spawnLeaf() {
    const s = DIFFICULTY_SETTINGS[state.difficulty] || DIFFICULTY_SETTINGS.normal;
    const size = rand(height * 0.04, height * 0.06);
    state.leaves.push({
      x: rand(size, width - size),
      y: -size,
      w: size * 1.4,
      h: size * 0.9,
      vy: rand(s.leafSpeed[0], s.leafSpeed[1]),
      rot: rand(-0.4, 0.4)
    });
  }

  function movePlayer(dt) {
    if (!state.player) return;
    let dir = 0;
    if (state.keys.left) dir -= 1;
    if (state.keys.right) dir += 1;
    if (dir !== 0) {
      state.player.x += dir * state.player.speed * dt;
      const margin = state.player.width * 0.5;
      state.player.x = Math.max(margin, Math.min(width - margin - state.player.width, state.player.x));
    }
  }

  function updateObjects(dt) {
    const s = DIFFICULTY_SETTINGS[state.difficulty] || DIFFICULTY_SETTINGS.normal;

    // spawn logic: probability per second
    if (Math.random() < s.dropRate * dt) spawnDrop();
    if (Math.random() < s.leafRate * dt) spawnLeaf();

    state.drops.forEach(d => {
      d.y += d.vy * dt;
      d.wobblePhase += dt * 4;
      d.x += Math.sin(d.wobblePhase) * d.wobbleAmp * dt;
    });

    state.leaves.forEach(l => {
      l.y += l.vy * dt;
      l.rot += dt * 0.8;
    });

    state.drops = state.drops.filter(d => d.y < height + d.radius * 2);
    state.leaves = state.leaves.filter(l => l.y < height + l.h * 2);
  }

  function checkCollisions() {
    if (!state.player) return;
    const p = state.player;
    const px = p.x + p.width / 2;
    const py = p.y + p.height / 2;

    // honey
    for (let i = state.drops.length - 1; i >= 0; i--) {
      const d = state.drops[i];
      const dx = (d.x - px) / (p.width * 0.6);
      const dy = (d.y - py) / (p.height * 0.6);
      if (dx * dx + dy * dy < 1) {
        state.drops.splice(i, 1);
        handleHoneyCatch();
      }
    }

    // leaves
    for (let i = state.leaves.length - 1; i >= 0; i--) {
      const l = state.leaves[i];
      const lx = l.x;
      const ly = l.y;
      if (
        lx < p.x + p.width * 0.8 &&
        lx + l.w > p.x + p.width * 0.2 &&
        ly < p.y + p.height &&
        ly + l.h > p.y + p.height * 0.4
      ) {
        state.leaves.splice(i, 1);
        handleLeafHit();
      }
    }
  }

  function handleHoneyCatch() {
    state.score += 10 * state.combo;
    state.combo += 1;
    state.comboTimer = 2.0;
    updateHUD();
    pulseCombo();
  }

  function handleLeafHit() {
    state.lives -= 1;
    state.combo = 1;
    state.comboTimer = 0;
    updateHUD();
    flashStatus();
    if (state.lives <= 0 && !state.arcadeMode) {
      endGame("Pooh took one tumble too many. Round over.", "end");
    } else {
      setStatus("Whoops! Leaves are not for catching.", "warn");
    }
  }

  function pulseCombo() {
    if (!comboPillEl) return;
    comboPillEl.classList.remove('combo-pulse');
    void comboPillEl.offsetWidth;
    comboPillEl.classList.add('combo-pulse');
  }

  function flashStatus() {
    if (!statusBarEl) return;
    statusBarEl.style.transition = 'background 0.18s ease';
    const old = window.getComputedStyle(statusBarEl).backgroundColor;
    statusBarEl.style.background = 'rgba(214,46,46,0.16)';
    setTimeout(() => {
      statusBarEl.style.background = '';
    }, 160);
  }

  function updateTimer(dt) {
    if (!state.arcadeMode) {
      state.timer -= dt;
      if (state.timer <= 0) {
        state.timer = 0;
        updateHUD();
        endGame("Time's up! Tallying the honey jars.", "end");
        return;
      }
    }
    if (state.combo > 1) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) {
        state.combo = 1;
        state.comboTimer = 0;
        updateHUD();
      }
    }
  }

  function drawBackground() {
    ctx.clearRect(0, 0, width, height);

    // sky gradient
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, "#fffef6");
    g.addColorStop(0.4, "#ffeec4");
    g.addColorStop(1, "#f6d9b0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    // simple clouds
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    const clouds = [
      { x: width * 0.18, y: height * 0.14, r: 32 },
      { x: width * 0.3, y: height * 0.1, r: 24 },
      { x: width * 0.75, y: height * 0.16, r: 28 }
    ];
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.arc(c.x + c.r * 0.8, c.y + c.r * 0.1, c.r * 0.85, 0, Math.PI * 2);
      ctx.arc(c.x - c.r * 0.7, c.y + c.r * 0.15, c.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });

    // ground
    ctx.fillStyle = "#d1e0c0";
    ctx.fillRect(0, height * 0.8, width, height * 0.2);
  }

  function drawPlayer() {
    const p = state.player;
    if (!p) return;
    const x = p.x;
    const y = p.y;
    const w = p.width;
    const h = p.height;

    // body
    ctx.fillStyle = "#f1c05d";
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y + h * 0.2, w, h * 0.7, h * 0.18);
    } else {
      ctx.rect(x, y + h * 0.2, w, h * 0.7);
    }
    ctx.fill();

    // head
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.28, h * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // ears
    ctx.beginPath();
    ctx.arc(x + w * 0.3, y + h * 0.15, h * 0.09, 0, Math.PI * 2);
    ctx.arc(x + w * 0.7, y + h * 0.15, h * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // shirt
    ctx.fillStyle = "#d62e2e";
    ctx.fillRect(x, y + h * 0.47, w, h * 0.26);

    // muzzle
    ctx.fillStyle = "#f8d58f";
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.32, h * 0.12, h * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    // nose
    ctx.fillStyle = "#5c3812";
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.29, h * 0.03, 0, Math.PI * 2);
    ctx.fill();

    // eyes
    ctx.beginPath();
    ctx.arc(x + w * 0.43, y + h * 0.24, h * 0.02, 0, Math.PI * 2);
    ctx.arc(x + w * 0.57, y + h * 0.24, h * 0.02, 0, Math.PI * 2);
    ctx.fill();

    // honey pot
    ctx.fillStyle = "#9a6a3b";
    const jarW = w * 0.32;
    const jarH = h * 0.25;
    const jx = x + w * 0.34;
    const jy = y + h * 0.6;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(jx, jy, jarW, jarH, jarW * 0.26);
    } else {
      ctx.rect(jx, jy, jarW, jarH);
    }
    ctx.fill();
    ctx.fillStyle = "#f0c96e";
    ctx.fillRect(jx, jy, jarW, jarH * 0.26);
  }

  function drawDrops() {
    state.drops.forEach(d => {
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = "#f4c048";
      ctx.moveTo(d.x, d.y - d.radius * 0.6);
      ctx.quadraticCurveTo(d.x - d.radius, d.y, d.x, d.y + d.radius);
      ctx.quadraticCurveTo(d.x + d.radius, d.y, d.x, d.y - d.radius * 0.6);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawLeaves() {
    state.leaves.forEach(l => {
      ctx.save();
      ctx.translate(l.x + l.w / 2, l.y + l.h / 2);
      ctx.rotate(l.rot);
      ctx.fillStyle = "#9cad90";
      ctx.beginPath();
      ctx.moveTo(-l.w / 2, 0);
      ctx.quadraticCurveTo(0, -l.h / 2, l.w / 2, 0);
      ctx.quadraticCurveTo(0, l.h / 2, -l.w / 2, 0);
      ctx.fill();
      ctx.restore();
    });
  }

  function draw() {
    drawBackground();
    drawDrops();
    drawLeaves();
    drawPlayer();
  }

  function gameLoop(timestamp) {
    if (!state.running) return;
    const dt = lastTime ? (timestamp - lastTime) / 1000 : 0;
    lastTime = timestamp;

    if (!state.paused) {
      movePlayer(dt);
      updateObjects(dt);
      updateTimer(dt);
      checkCollisions();
    }

    draw();

    if (state.running) {
      frameRequest = requestAnimationFrame(gameLoop);
    }
  }

  function startGame() {
    resetPlayer();
    resetGameValues();
    state.running = true;
    state.paused = false;
    lastTime = 0;
    setStatus("Catch the honey, dodge the leaves. Short and sweet!", "start");
    if (frameRequest) cancelAnimationFrame(frameRequest);
    frameRequest = requestAnimationFrame(gameLoop);
  }

  function pauseGame() {
    if (!state.running) return;
    state.paused = !state.paused;
    setStatus(
      state.paused
        ? "Game paused. Pooh is catching his breath."
        : "Back to the honey chase!",
      "neutral"
    );
  }

  function resetGame() {
    state.running = false;
    state.paused = false;
    cancelAnimationFrame(frameRequest);
    resetPlayer();
    resetGameValues();
    drawBackground();
    drawPlayer();
    setStatus("Ready for another round whenever you are.", "neutral");
  }

  function endGame(message, tone) {
    state.running = false;
    state.paused = false;
    cancelAnimationFrame(frameRequest);
    saveBestScore();
    setStatus(message, tone);
  }

  function handleArcadeToggle() {
    state.arcadeMode = !state.arcadeMode;
    if (arcadeModeBtn) {
      arcadeModeBtn.classList.toggle('btn--primary', state.arcadeMode);
      arcadeModeBtn.classList.toggle('btn--ghost', !state.arcadeMode);
    }
    resetGame();
    if (!state.arcadeMode) {
      setStatus("Arcade Mode off. Back to cozy story rounds.", "neutral");
    } else {
      setStatus("Arcade Mode on. Endless honey until lives run out!", "start");
    }
  }

  function handleDifficultyChange() {
    const value = difficultySelect ? difficultySelect.value : 'normal';
    if (['easy', 'normal', 'hard'].includes(value)) {
      state.difficulty = value;
      resetGame();
      setStatus(`Difficulty set to ${value}.`, "neutral");
    }
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      state.keys.left = true;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      state.keys.right = true;
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      if (!state.running) {
        startGame();
      } else {
        pauseGame();
      }
    }
  }

  function onKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      state.keys.left = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      state.keys.right = false;
    }
  }

  function attachEvents() {
    if (startBtn) startBtn.addEventListener('click', startGame);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseGame);
    if (resetBtn) resetBtn.addEventListener('click', resetGame);
    if (difficultySelect) difficultySelect.addEventListener('change', handleDifficultyChange);
    if (arcadeModeBtn) arcadeModeBtn.addEventListener('click', handleArcadeToggle);

    if (leftBtn) {
      leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        state.keys.left = true;
      });
      leftBtn.addEventListener('touchend', () => {
        state.keys.left = false;
      });
    }

    if (rightBtn) {
      rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        state.keys.right = true;
      });
      rightBtn.addEventListener('touchend', () => {
        state.keys.right = false;
      });
    }

    if (dropBtn) {
      dropBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!state.running) {
          startGame();
        } else {
          pauseGame();
        }
      });
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', () => {
      resizeCanvas();
      if (!state.running) {
        drawBackground();
        drawPlayer();
      }
    });
  }

  function init() {
    resizeCanvas();
    resetPlayer();
    loadBestScore();
    updateHUD();
    drawBackground();
    drawPlayer();
    setStatus("Press Start when you're ready for a little honey hunt.", "neutral");

    if (bearBadge) {
      bearBadge.setAttribute('title', 'New mini-game for Baby Gunner!');
    }

    attachEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
