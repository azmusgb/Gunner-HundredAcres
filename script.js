const CONFIG = {
  GAME: {
    INITIAL_TIME: 45,
    INITIAL_LIVES: 3,
    DROP_SPAWN_INTERVAL: 900,
    COMBO_DECAY_MS: 3400,
    PARTICLE_COUNT: 15,
    PLAYER_WIDTH: 60,
    PLAYER_HEIGHT: 48
  },
  VISUALS: {
    AMBIENT_INTERVAL: 450,
    TRAIL_LIFETIME: 24,
    DRIP_LIFETIME: 40
  }
};

const prompts = [
  'Share the coziest lullaby you know for Pooh to hum.',
  'Offer a bit of advice for rainy days in the Wood.',
  'What tradition should Gunner try every spring?',
  'Write a hope for the adventures he will take.',
  'Share a tiny act of kindness he can give a friend.'
];

const characters = {
  pooh: {
    name: 'Winnie the Pooh',
    trait: 'Gentle host + honey connoisseur',
    quote: '“Sometimes the smallest things take up the most room in your heart.”',
    gift: 'A forever supply of calm, cozy mornings and a jar of courage for every new adventure.'
  },
  piglet: {
    name: 'Piglet',
    trait: 'Brave best friend',
    quote: '“It is hard to be brave when you’re only a Very Small Animal.”',
    gift: 'A pocket-sized bravery badge and the reminder that even tiny voices matter.'
  },
  tigger: {
    name: 'Tigger',
    trait: 'Boundless joy & bounce',
    quote: '“Bouncing is what Tiggers do best!”',
    gift: 'Endless giggles, rainy-day dance parties, and pep talks when confidence needs a lift.'
  },
  eeyore: {
    name: 'Eeyore',
    trait: 'Thoughtful and steady',
    quote: '“It never hurts to keep looking for sunshine.”',
    gift: 'A place to rest when days feel heavy and a friend who listens without rushing.'
  },
  rabbit: {
    name: 'Rabbit',
    trait: 'Garden planner & organizer',
    quote: '“Having a plan helps even the busiest of bees.”',
    gift: 'Seed packets for curiosity and a tidy toolkit to help Gunner grow big ideas.'
  },
  owl: {
    name: 'Owl',
    trait: 'Resident storyteller',
    quote: '“Stories taste better with friends and moonlight.”',
    gift: 'Starry bedtime tales, maps of the Wood, and wisdom shared with a wink.'
  }
};

function loadBestScore() {
  try {
    return Number(localStorage.getItem('honeyBest') || 0);
  } catch (err) {
    console.warn('Unable to read best score from storage', err);
    return 0;
  }
}

const state = {
  score: 0,
  best: loadBestScore(),
  time: CONFIG.GAME.INITIAL_TIME,
  lives: CONFIG.GAME.INITIAL_LIVES,
  combo: 1,
  comboTime: 0,
  playing: false,
  paused: false,
  player: { x: 320 },
  drops: [],
  bees: [],
  particles: [],
  hitFlash: 0,
  timerId: null,
  ambientTimer: null,
};

const canvas = document.getElementById('honeyCanvas');
const ctx = canvas.getContext('2d');
const canvasContainer = document.querySelector('.canvas-container');
const loader = document.getElementById('loader');
const loaderStart = performance.now();

const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const livesEl = document.getElementById('lives');
const bestEl = document.getElementById('best');
const comboEl = document.getElementById('comboCount');
const comboDisplay = document.getElementById('comboDisplay');
const comboStreak = document.getElementById('comboStreak');
const guestCount = document.getElementById('guestCount');
const formStatus = document.getElementById('formStatus');
const pathSteps = document.querySelectorAll('.path__step');

const promptBtn = document.getElementById('promptButton');
const promptText = document.getElementById('promptText');
const playBtn = document.getElementById('startGame');
const pauseBtn = document.getElementById('pauseGame');
const openInstructions = document.getElementById('openInstructions');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const chime = document.getElementById('chime');
const chimeToggle = document.getElementById('playChime');
const instructionOverlay = document.getElementById('instructionOverlay');
const closeInstructions = document.getElementById('closeInstructions');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreEl = document.getElementById('finalScore');
const highScoreBadge = document.getElementById('highScoreBadge');
const sharePrompt = document.getElementById('sharePrompt');
const playAgain = document.getElementById('playAgain');
const closeGameOver = document.getElementById('closeGameOver');
const gameStatus = document.getElementById('gameStatus');
const characterModal = document.getElementById('characterModal');
const modalName = document.getElementById('modalName');
const modalTrait = document.getElementById('modalTrait');
const modalQuote = document.getElementById('modalQuote');
const modalGift = document.getElementById('modalGift');
const closeModal = document.getElementById('closeModal');
const rsvpBanner = document.getElementById('rsvpBanner');
const bannerClose = document.getElementById('bannerClose');
const pageTurns = document.getElementById('pageTurns');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const pageIndicator = document.getElementById('pageIndicator');

const pages = ['hero','story','details','experiences','characters','game','rsvp'].map(id => document.getElementById(id));
const pageTitles = {
  hero: 'Welcome',
  story: 'Story',
  details: 'Details',
  experiences: 'Immersive moments',
  characters: 'Meet the crew',
  game: 'Honey Hunt',
  rsvp: 'RSVP'
};

let audioContext;

function getAudioContext() {
  if (audioContext) return audioContext;
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return audioContext;
  } catch (err) {
    console.warn('AudioContext unavailable', err);
    return null;
  }
}


function hideLoader() {
  const elapsed = performance.now() - loaderStart;
  const remaining = Math.max(2200 - elapsed, 0);
  setTimeout(() => {
    loader.classList.add('is-hidden');
    setTimeout(() => loader.remove(), 400);
  }, remaining);
}

function revealOnScroll() {
  document.querySelectorAll('.panel, .card, .experience, .detail, .character-card').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 60) {
      el.classList.remove('reveal');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.panel, .card, .experience, .detail, .character-card').forEach(el => el.classList.add('reveal'));
  revealOnScroll();
  hideLoader();
  bestEl.textContent = state.best;
  timerEl.textContent = `${state.time}s`;
  instructionOverlay?.setAttribute('aria-hidden', 'true');

  // Initialize enhanced visuals once the DOM is ready
  setTimeout(initEnhancedVisuals, 100);

  // Add CSS for roundRect if not supported
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      this.beginPath();
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }
});

window.addEventListener('scroll', () => {
  revealOnScroll();
  updatePageTurns();
});

promptBtn.addEventListener('click', () => {
  const next = prompts[Math.floor(Math.random() * prompts.length)];
  promptText.textContent = `“${next}”`;
});

pathSteps.forEach(step => {
  step.addEventListener('click', () => {
    const target = document.getElementById(step.dataset.target);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

chimeToggle.addEventListener('click', () => {
  chime.currentTime = 0;
  chime.play();
});

function resetGame() {
  state.score = 0;
  state.time = CONFIG.GAME.INITIAL_TIME;
  state.lives = CONFIG.GAME.INITIAL_LIVES;
  state.combo = 1;
  state.comboTime = 0;
  state.drops = [];
  state.bees = [];
  state.particles = [];
  state.hitFlash = 0;
  state.player.x = canvas.width / 2 - CONFIG.GAME.PLAYER_WIDTH / 2;
  state.paused = false;
  updateHud();
  updateComboDisplay();

  // Reset score display color
  scoreEl.style.color = '';
}

function startGame() {
  instructionOverlay?.classList.add('is-hidden');
  instructionOverlay?.setAttribute('aria-hidden', 'true');
  gameOverOverlay?.classList.remove('is-visible');

  // If we're resuming after a pause/end, keep momentum
  if (state.playing) {
    state.paused = false;
    gameStatus.textContent = 'Back to hunting honey!';
    pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    startTimer();
    loop();
    return;
  }

  resetGame();
  state.playing = true;
  state.paused = false;
  instructionOverlay?.classList.add('is-hidden');
  instructionOverlay?.setAttribute('aria-hidden', 'true');
  gameStatus.textContent = 'Hunt honey and dodge the bees!';
  spawn();
  startTimer();
  loop();
}

function showInstructions() {
  instructionOverlay?.classList.remove('is-hidden');
  instructionOverlay?.removeAttribute('aria-hidden');
  if (state.playing) {
    state.paused = true;
    clearInterval(state.timerId);
    gameStatus.textContent = 'Paused for a quick refresher. Tap resume when ready!';
    pauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
  }
}

function endGame() {
  state.playing = false;
  clearInterval(state.timerId);
  const previousBest = state.best;
  state.best = Math.max(state.best, state.score);
  try {
    localStorage.setItem('honeyBest', state.best);
  } catch (err) {
    console.warn('Unable to save best score', err);
  }
  bestEl.textContent = state.best;
  finalScoreEl.textContent = state.score;
  highScoreBadge.style.display = state.score > previousBest ? 'block' : 'none';
  sharePrompt.textContent = `I scored ${state.score} honey pots at Gunner's shower! Can you beat it?`;
  state.combo = 1;
  updateHud();
  gameOverOverlay.classList.add('is-visible');
  gameStatus.textContent = 'Round complete — ready for another hunt?';
  updateComboDisplay();
}

function spawn() {
  state.drops.push({ x: Math.random() * (canvas.width - 24), y: -20, speed: 2 + Math.random() * 2 });
  if (Math.random() > 0.6) state.bees.push({ x: Math.random() * (canvas.width - 18), y: -30, speed: 2.2 + Math.random() * 2 });
  if (state.playing) setTimeout(spawn, CONFIG.GAME.DROP_SPAWN_INTERVAL);
}

function movePlayer(dir) {
  const maxX = canvas.width - (CONFIG.GAME.PLAYER_WIDTH + 6);
  state.player.x = Math.max(6, Math.min(maxX, state.player.x + dir));
}

function handleInput(e) {
  const startKeys = [' ', 'ArrowLeft', 'ArrowRight', 'a', 'd'];
  if (!state.playing && startKeys.includes(e.key)) {
    e.preventDefault();
    startGame();
    return;
  }
  if (e.key === ' ' && state.playing) {
    e.preventDefault();
    togglePause();
    return;
  }
  if (!state.playing || state.paused) return;
  if (e.key === 'ArrowLeft' || e.key === 'a') movePlayer(-16);
  if (e.key === 'ArrowRight' || e.key === 'd') movePlayer(16);
}

document.addEventListener('keydown', handleInput);
leftBtn.addEventListener('pointerdown', () => { if (state.playing && !state.paused) movePlayer(-26); });
rightBtn.addEventListener('pointerdown', () => { if (state.playing && !state.paused) movePlayer(26); });
playBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
canvas.addEventListener('pointerdown', () => { if (!state.playing) startGame(); });

function startTimer() {
  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    state.time -= 1;
    if (state.time <= 0 || state.lives <= 0) {
      endGame();
    }
    updateHud();
  }, 1000);
}

function togglePause() {
  if (!state.playing) return;
  state.paused = !state.paused;
  if (state.paused) {
    clearInterval(state.timerId);
    gameStatus.textContent = 'Paused — press space or tap resume to continue.';
    pauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
  } else {
    gameStatus.textContent = 'Back to hunting honey!';
    pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    startTimer();
    loop();
  }
}

function loop() {
  if (!state.playing) return;
  if (state.paused) { requestAnimationFrame(loop); return; }
  
  // Clear with a subtle fade effect
  ctx.fillStyle = 'rgba(255, 249, 235, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  drawSky();
  drawPlayer();
  updateDrops();
  updateBees();
  drawParticles();
  renderHitFlash();
  decayCombo();
  requestAnimationFrame(loop);
}

function drawGround() {
  ctx.fillStyle = '#d5e5c7';
  ctx.fillRect(0, canvas.height - 24, canvas.width, 24);
  ctx.fillStyle = '#c59b2f';
  ctx.fillRect(0, canvas.height - 18, canvas.width, 18);
}

function drawPlayer() {
  const x = state.player.x;
  const y = canvas.height - 70;

  if (poohSpriteReady) {
    ctx.save();
    ctx.shadowColor = 'rgba(179, 119, 46, 0.35)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.drawImage(poohSprite, x - 10, y - 56, 84, 116);
    ctx.restore();
    return;
  }

  // Save context state
  ctx.save();

  // Shadow effect
  ctx.shadowColor = 'rgba(179, 119, 46, 0.4)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 5;

  // Main honey pot body
  const gradient = ctx.createLinearGradient(x, y, x + 60, y + 48);
  gradient.addColorStop(0, '#FFD166');
  gradient.addColorStop(0.3, '#FFE87C');
  gradient.addColorStop(0.7, '#FFD166');
  gradient.addColorStop(1, '#F9C152');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(x, y, 60, 48, [20, 20, 10, 10]);
  ctx.fill();

  // Honey level with shine
  ctx.fillStyle = '#FFE87C';
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 20, 44, 24, [8, 8, 8, 8]);
  ctx.fill();

  // Honey texture
  ctx.fillStyle = 'rgba(255, 209, 102, 0.3)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(x + 15 + i * 8, y + 32, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pot lid with metallic shine
  const lidGradient = ctx.createLinearGradient(x + 15, y - 8, x + 45, y + 2);
  lidGradient.addColorStop(0, '#184e35');
  lidGradient.addColorStop(0.3, '#2a6f4e');
  lidGradient.addColorStop(0.5, '#3D9970');
  lidGradient.addColorStop(0.7, '#2a6f4e');
  lidGradient.addColorStop(1, '#184e35');

  ctx.fillStyle = lidGradient;
  ctx.beginPath();
  ctx.roundRect(x + 15, y - 8, 30, 10, [8, 8, 0, 0]);
  ctx.fill();

  // Lid highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.roundRect(x + 17, y - 6, 10, 4, [4, 4, 0, 0]);
  ctx.fill();

  // Pot handle
  ctx.strokeStyle = '#8B7355';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x + 30, y - 15, 12, 0.8 * Math.PI, 2.2 * Math.PI);
  ctx.stroke();

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Restore context
  ctx.restore();
}

function updateDrops() {
  state.drops.forEach((d, i) => {
    d.y += d.speed;
    
    // Save context for drop effects
    ctx.save();
    
    // Drop shadow
    ctx.shadowColor = 'rgba(179, 119, 46, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    
    // Honey drop with gradient
    const gradient = ctx.createRadialGradient(
      d.x - 3, d.y - 3, 0,
      d.x, d.y, 14
    );
    gradient.addColorStop(0, '#FFE87C');
    gradient.addColorStop(0.7, '#FFD166');
    gradient.addColorStop(1, '#F9C152');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(d.x - 2, d.y - 4, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.restore();
    
    // Create honey drip trail
    if (Math.random() > 0.7) {
      createHoneyDrip(d.x, d.y);
    }
    
    // Collision detection
    if (d.y > canvas.height - 70 && d.x > state.player.x && d.x < state.player.x + CONFIG.GAME.PLAYER_WIDTH) {
      // Collection effects
      state.score += 5 + state.combo;
      state.combo = Math.min(state.combo + 1, 12);
      state.comboTime = performance.now();
      state.drops.splice(i, 1);
      
      // Visual effects
      updateHud();
      updateComboDisplay();
      spawnParticles(d.x, d.y, '#FFD166');
      createCollectionEffect(d.x, d.y);
      
      // Score pop animation
      scoreEl.classList.remove('score-pop');
      void scoreEl.offsetWidth;
      scoreEl.classList.add('score-pop');
      
      // Status messages
      if (state.combo >= 6) gameStatus.textContent = '🌟 Golden streak! Bouncy-trouncy-flouncy!';
      else if (state.combo >= 3) gameStatus.textContent = '✨ Sweet combo! More honey, please!';
      else gameStatus.textContent = '🍯 Yummy honey collected!';
      
      // Play collection sound
      if (chimeToggle.checked) {
        playCollectionSound();
      }
    }
    
    // Remove if out of bounds
    if (d.y > canvas.height) state.drops.splice(i, 1);
  });
}

function updateBees() {
  state.bees.forEach((b, i) => {
    b.y += b.speed;
    
    // Animate wings
    const wingOffset = Math.sin(performance.now() * 0.01 + i) * 2;
    
    ctx.save();
    
    // Bee body
    const gradient = ctx.createLinearGradient(b.x, b.y, b.x + 16, b.y + 12);
    gradient.addColorStop(0, '#F0A500');
    gradient.addColorStop(0.3, '#FFC857');
    gradient.addColorStop(0.7, '#F0A500');
    gradient.addColorStop(1, '#D18F00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(b.x + 8, b.y + 6, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Black stripes
    ctx.fillStyle = '#000000';
    ctx.fillRect(b.x + 4, b.y, 3, 12);
    ctx.fillRect(b.x + 10, b.y, 3, 12);
    
    // Wings with animation
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(b.x + 4, b.y - 2 + wingOffset, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(b.x + 12, b.y - 2 - wingOffset, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Antennae
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(b.x + 5, b.y + 1);
    ctx.lineTo(b.x + 2, b.y - 3);
    ctx.moveTo(b.x + 11, b.y + 1);
    ctx.lineTo(b.x + 14, b.y - 3);
    ctx.stroke();
    
    ctx.restore();
    
    // Create bee trail
    if (Math.random() > 0.5) {
      createBeeTrail(b.x + 8, b.y + 6);
    }
    
    // Collision detection
    if (b.y > canvas.height - 70 && b.x > state.player.x - 8 && b.x < state.player.x + 60) {
      state.lives -= 1;
      state.combo = 1;
      state.comboTime = 0;
      state.hitFlash = 15;
      state.bees.splice(i, 1);
      
      updateHud();
      updateComboDisplay();
      spawnParticles(b.x, b.y, '#B23B2F');
      
      // Visual feedback
      livesEl.style.color = '#B23B2F';
      setTimeout(() => livesEl.style.color = '', 500);
      
      gameStatus.textContent = '🐝 Oh, bother! A bee got you!';
      
      if (state.lives <= 0) endGame();
    }
    
    if (b.y > canvas.height) state.bees.splice(i, 1);
  });
}

function updateHud() {
  scoreEl.textContent = state.score;
  timerEl.textContent = `${state.time}s`;
  livesEl.textContent = state.lives;
  comboEl.textContent = `x${state.combo}`;
}

function updateComboDisplay() {
  if (!comboDisplay) return;

  if (state.combo > 1) {
    comboDisplay.style.display = 'flex';
    comboStreak.textContent = `x${state.combo}`;

    // Update combo color based on streak
    let comboColor;
    if (state.combo >= 8) comboColor = '#FF6B6B';
    else if (state.combo >= 5) comboColor = '#4ECDC4';
    else comboColor = '#FFD166';

    comboDisplay.style.background = `linear-gradient(135deg, ${comboColor}, ${comboColor}dd)`;

    // Trigger pop animation
    comboDisplay.classList.remove('pop');
    void comboDisplay.offsetWidth;
    comboDisplay.classList.add('pop');

    // Show special effects for high combos
    if (state.combo >= 5) {
      createSpecialEffect(state.combo);
    }
  } else {
    comboDisplay.style.display = 'none';
  }
}

function spawnParticles(x, y, color, overrides = {}) {
  for (let i = 0; i < CONFIG.GAME.PARTICLE_COUNT; i++) {
    state.particles.push({
      x, y,
      life: 30 + Math.random() * 20,
      color,
      dx: (Math.random() - 0.5) * 6,
      dy: -2 - Math.random() * 3,
      gravity: 0.05,
      size: 2 + Math.random() * 5,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      ...overrides
    });
  }
}

function drawParticles() {
  state.particles.forEach((p, idx) => {
    p.x += p.dx;
    p.y += p.dy;
    if (p.gravity) p.dy += p.gravity;
    p.life -= 1;
    p.rotation += p.rotationSpeed;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
    gradient.addColorStop(0, `${p.color}FF`);
    gradient.addColorStop(0.7, `${p.color}CC`);
    gradient.addColorStop(1, `${p.color}00`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (p.life <= 0) state.particles.splice(idx, 1);
  });
}

function renderHitFlash() {
  if (state.hitFlash <= 0) return;

  const gradient = ctx.createRadialGradient(
    canvas.width/2, canvas.height/2, 0,
    canvas.width/2, canvas.height/2, canvas.width
  );
  gradient.addColorStop(0, `rgba(178, 59, 47, ${state.hitFlash / 30})`);
  gradient.addColorStop(1, `rgba(178, 59, 47, 0)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  state.hitFlash -= 1;
}

function decayCombo() {
  if (state.combo > 1 && performance.now() - state.comboTime > CONFIG.GAME.COMBO_DECAY_MS) {
    state.combo = 1;
    updateHud();
    updateComboDisplay();
    gameStatus.textContent = 'Streak cooled — grab more honey!';
  }
}

// ==================== ENHANCED GAME GRAPHICS ====================

// Initialize enhanced visuals
function initEnhancedVisuals() {
  createClouds();
  createGrass();
  createHoneycombPattern();
  createAmbientParticles();
}

// Create decorative clouds
function createClouds() {
  const sky = document.querySelector('.sky-background') || document.createElement('div');
  sky.className = 'sky-background';
  canvasContainer?.prepend(sky);

  for (let i = 0; i < 3; i++) {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    cloud.style.left = `${Math.random() * 100}%`;
    cloud.style.top = `${30 + Math.random() * 40}%`;
    cloud.style.width = `${80 + Math.random() * 80}px`;
    cloud.style.height = `${30 + Math.random() * 20}px`;
    cloud.style.animationDelay = `${Math.random() * 20}s`;
    sky.appendChild(cloud);
  }
}

// Create animated grass
function createGrass() {
  const ground = document.querySelector('.ground-container') || document.createElement('div');
  ground.className = 'ground-container';
  canvasContainer?.appendChild(ground);

  for (let i = 0; i < 50; i++) {
    const blade = document.createElement('div');
    blade.className = 'grass-blade';
    blade.style.left = `${Math.random() * 100}%`;
    ground.appendChild(blade);
  }
}

// Create honeycomb pattern
function createHoneycombPattern() {
  const pattern = document.createElement('div');
  pattern.className = 'honeycomb-pattern';
  canvasContainer?.appendChild(pattern);
}

// Create ambient particles
function createAmbientParticles() {
  if (state.ambientTimer) clearInterval(state.ambientTimer);

  state.ambientTimer = setInterval(() => {
    if (!state.playing || state.paused) return;

    const color = Math.random() > 0.5 ? '#FFD166' : '#74C69D';
    spawnParticles(
      Math.random() * canvas.width,
      Math.random() * (canvas.height * 0.6),
      color,
      {
        life: 20 + Math.random() * 10,
        size: 1 + Math.random() * 2,
        dx: (Math.random() - 0.5) * 1.4,
        dy: -0.5 - Math.random() * 0.4,
        gravity: 0
      }
    );
  }, CONFIG.VISUALS.AMBIENT_INTERVAL);
}

// Create honey drip visual effect
function createHoneyDrip(x, y) {
  spawnParticles(x, y, '#FFD166', {
    life: CONFIG.VISUALS.DRIP_LIFETIME,
    size: 2 + Math.random() * 2,
    dx: (Math.random() - 0.5) * 1.5,
    dy: 0.6 + Math.random() * 0.8,
    gravity: 0.05
  });
}

// Create bee trail effect
function createBeeTrail(x, y) {
  spawnParticles(x, y, '#F0A500', {
    life: CONFIG.VISUALS.TRAIL_LIFETIME,
    size: 1.5 + Math.random() * 1.5,
    dx: (Math.random() - 0.5) * 2,
    dy: -0.8 - Math.random() * 0.4,
    gravity: 0
  });
}

// Create honey collection effect
function createCollectionEffect(x, y) {
  spawnParticles(x, y, '#FFE87C', {
    life: 26 + Math.random() * 10,
    size: 3 + Math.random() * 2,
    dx: (Math.random() - 0.5) * 3,
    dy: -1.5 - Math.random() * 1.5,
    gravity: 0.04
  });
}

// Play collection sound
function playCollectionSound() {
  const context = getAudioContext();
  if (!context) return;

  try {
    context.resume();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.setValueAtTime(523.25, context.currentTime); // C5
    oscillator.frequency.exponentialRampToValueAtTime(659.25, context.currentTime + 0.1); // E5

    gainNode.gain.setValueAtTime(0.1, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.2);
  } catch (err) {
    console.warn('Unable to play collection sound', err);
  }
}

// Create special effects for high combos
function createSpecialEffect(combo) {
  if (!canvasContainer) return;

  if (combo >= 8) {
    // Star burst effect
    for (let i = 0; i < 8; i++) {
      const star = document.createElement('div');
      star.className = 'sparkle';
      star.style.left = '50%';
      star.style.top = '50%';
      star.style.width = '12px';
      star.style.height = '12px';
      star.style.background = 'radial-gradient(circle, #FFD166, #FF9E00)';
      star.style.animation = 'sparklePop 1s ease-out forwards';
      canvasContainer.appendChild(star);

      // Animate stars outward
      setTimeout(() => {
        const angle = (i / 8) * Math.PI * 2;
        const distance = 100;
        star.style.left = `calc(50% + ${Math.cos(angle) * distance}px)`;
        star.style.top = `calc(50% + ${Math.sin(angle) * distance}px)`;
      }, 10);

      setTimeout(() => star.remove(), 1000);
    }
  } else if (combo >= 5) {
    // Ring effect
    const ring = document.createElement('div');
    ring.className = 'combo-ring';
    canvasContainer.appendChild(ring);
    setTimeout(() => ring.remove(), 800);
  }
}

// Add sky drawing function
function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
  gradient.addColorStop(0, '#A3D5FF');
  gradient.addColorStop(0.3, '#C1E3FF');
  gradient.addColorStop(0.6, '#D8F0FF');
  gradient.addColorStop(1, '#E6F7FF');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);
}

const form = document.getElementById('rsvpForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  setTimeout(() => {
    const count = Number(document.getElementById('guests').value || 1);
    const existing = parseInt(guestCount.textContent) || 0;
    guestCount.textContent = `${existing + count} friends`;
    formStatus.textContent = 'Your spot is saved! Check your inbox for a cozy confirmation.';
    showBanner();
    form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send my RSVP';
  }, 600);
});

closeInstructions.addEventListener('click', () => startGame());
playAgain.addEventListener('click', () => { gameOverOverlay.classList.remove('is-visible'); startGame(); });
closeGameOver.addEventListener('click', () => gameOverOverlay.classList.remove('is-visible'));
openInstructions?.addEventListener('click', showInstructions);

document.querySelectorAll('.character-card').forEach(card => {
  card.addEventListener('click', () => openCharacter(card.dataset.character));
});

function openCharacter(key) {
  const data = characters[key];
  if (!data) return;
  modalName.textContent = data.name;
  modalTrait.textContent = data.trait;
  modalQuote.textContent = data.quote;
  modalGift.textContent = data.gift;
  characterModal.classList.add('is-visible');
}

function closeCharacterModal() {
  characterModal.classList.remove('is-visible');
}

closeModal.addEventListener('click', closeCharacterModal);
characterModal.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal__backdrop')) closeCharacterModal();
});

let bannerTimer;
function showBanner() {
  clearTimeout(bannerTimer);
  rsvpBanner.classList.add('is-visible');
  bannerTimer = setTimeout(() => rsvpBanner.classList.remove('is-visible'), 5000);
}

bannerClose.addEventListener('click', () => rsvpBanner.classList.remove('is-visible'));

function updatePageTurns() {
  const heroRect = document.getElementById('hero').getBoundingClientRect();
  if (heroRect.bottom < 60) {
    pageTurns.classList.add('is-visible');
  } else {
    pageTurns.classList.remove('is-visible');
  }

  const scrollPos = window.scrollY + window.innerHeight * 0.35;
  let activeIndex = 0;
  pages.forEach((section, idx) => {
    if (section.offsetTop <= scrollPos) activeIndex = idx;
  });

  const currentId = pages[activeIndex].id;
  pageIndicator.textContent = pageTitles[currentId];
  prevPage.disabled = activeIndex === 0;
  nextPage.disabled = activeIndex === pages.length - 1;

  prevPage.onclick = () => {
    if (activeIndex > 0) pages[activeIndex - 1].scrollIntoView({ behavior: 'smooth' });
  };
  nextPage.onclick = () => {
    if (activeIndex < pages.length - 1) pages[activeIndex + 1].scrollIntoView({ behavior: 'smooth' });
  };
}

updatePageTurns();
