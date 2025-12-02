const prompts = [
  'Share the coziest lullaby you know for Pooh to hum.',
  'Offer a bit of advice for rainy days in the Wood.',
  'What tradition should Gunner try every spring?',
  'Write a hope for the adventures he will take.',
  'Share a tiny act of kindness he can give a friend.'
];

const palette = {
  honey: '#f7c948',
  honeyDeep: '#d38700',
  forest: '#184e35',
  clay: '#b57626',
  sky: '#fff7e6'
};

const state = {
  score: 0,
  best: Number(localStorage.getItem('honeyBest') || 0),
  time: 45,
  lives: 3,
  streak: 0,
  playing: false,
  player: { x: 320 },
  drops: [],
  bees: [],
  sparkles: [],
  clouds: [],
  timerId: null,
};

const canvas = document.getElementById('honeyCanvas');
const ctx = canvas.getContext('2d');
const loader = document.getElementById('loader');

const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const livesEl = document.getElementById('lives');
const bestEl = document.getElementById('best');
const guestCount = document.getElementById('guestCount');
const formStatus = document.getElementById('formStatus');

const promptBtn = document.getElementById('promptButton');
const promptText = document.getElementById('promptText');
const playBtn = document.getElementById('startGame');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const chime = document.getElementById('chime');
const chimeToggle = document.getElementById('playChime');

function hideLoader() {
  loader.classList.add('is-hidden');
  setTimeout(() => loader.remove(), 400);
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(hideLoader, 650);
  bestEl.textContent = state.best;
  timerEl.textContent = `${state.time}s`;
  createClouds();
});

window.addEventListener('scroll', () => {
  document.querySelectorAll('.panel, .card, .experience, .detail').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 40) {
      el.style.transition = 'transform 0.4s ease, opacity 0.4s';
      el.style.transform = 'translateY(0)';
      el.style.opacity = '1';
    }
  });
});

promptBtn.addEventListener('click', () => {
  const next = prompts[Math.floor(Math.random() * prompts.length)];
  promptText.textContent = `“${next}”`;
});

chimeToggle.addEventListener('click', () => {
  chime.currentTime = 0;
  chime.play();
});

function resetGame() {
  state.score = 0;
  state.time = 45;
  state.lives = 3;
  state.streak = 0;
  state.drops = [];
  state.bees = [];
  state.sparkles = [];
  state.player.x = canvas.width / 2 - 30;
  updateHud();
}

function startGame() {
  resetGame();
  state.playing = true;
  spawn();
  state.timerId = setInterval(() => {
    state.time -= 1;
    if (state.time <= 0 || state.lives <= 0) {
      endGame();
    }
    updateHud();
  }, 1000);
  loop();
}

function endGame() {
  state.playing = false;
  clearInterval(state.timerId);
  state.best = Math.max(state.best, state.score);
  localStorage.setItem('honeyBest', state.best);
  bestEl.textContent = state.best;
  formStatus.textContent = `Pooh is pleased! Final score: ${state.score} (streak ${state.streak}). Tap start to hunt more honey.`;
}

function spawn() {
  state.drops.push({
    x: Math.random() * (canvas.width - 28),
    y: -20,
    speed: 2 + Math.random() * 2,
    wobble: Math.random() * Math.PI * 2
  });
  if (Math.random() > 0.55) {
    state.bees.push({ x: Math.random() * (canvas.width - 18), y: -30, speed: 2.4 + Math.random() * 2, sway: Math.random() * 50 });
  }
  if (state.playing) setTimeout(spawn, 820);
}

function movePlayer(dir) {
  state.player.x = Math.max(6, Math.min(canvas.width - 66, state.player.x + dir));
}

function handleInput(e) {
  if (!state.playing) return;
  if (e.key === 'ArrowLeft' || e.key === 'a') movePlayer(-16);
  if (e.key === 'ArrowRight' || e.key === 'd') movePlayer(16);
}

document.addEventListener('keydown', handleInput);
leftBtn.addEventListener('pointerdown', () => movePlayer(-26));
rightBtn.addEventListener('pointerdown', () => movePlayer(26));
playBtn.addEventListener('click', startGame);

function loop() {
  if (!state.playing) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawScene();
  drawPlayer();
  updateDrops();
  updateBees();
  updateSparkles();
  updateClouds();
  requestAnimationFrame(loop);
}

function drawScene() {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, palette.sky);
  g.addColorStop(1, '#f0e2b1');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#d5e5c7';
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 60);
  ctx.quadraticCurveTo(canvas.width * 0.25, canvas.height - 90, canvas.width * 0.5, canvas.height - 60);
  ctx.quadraticCurveTo(canvas.width * 0.75, canvas.height - 30, canvas.width, canvas.height - 60);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#c59b2f';
  ctx.fillRect(0, canvas.height - 32, canvas.width, 22);
  ctx.fillStyle = '#9e6e1f';
  ctx.fillRect(0, canvas.height - 16, canvas.width, 16);

  drawTrees();
  drawRiver();
}

function drawTrees() {
  ctx.fillStyle = '#9b7040';
  for (let i = 0; i < 6; i++) {
    const x = (i * 140 + 40) % (canvas.width + 120) - 60;
    ctx.fillRect(x, canvas.height - 140, 26, 120);
    ctx.beginPath();
    ctx.fillStyle = '#6e9b61';
    ctx.arc(x + 12, canvas.height - 140, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = '#5a874f';
    ctx.arc(x + 32, canvas.height - 138, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9b7040';
  }
}

function drawRiver() {
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.1, canvas.height - 36);
  ctx.quadraticCurveTo(canvas.width * 0.4, canvas.height - 70, canvas.width * 0.8, canvas.height - 28);
  ctx.lineTo(canvas.width * 0.84, canvas.height);
  ctx.lineTo(canvas.width * 0.06, canvas.height);
  ctx.closePath();
  const river = ctx.createLinearGradient(0, canvas.height - 70, 0, canvas.height);
  river.addColorStop(0, 'rgba(247,201,72,0.38)');
  river.addColorStop(1, 'rgba(224,159,62,0.55)');
  ctx.fillStyle = river;
  ctx.fill();
}

function drawPlayer() {
  const x = state.player.x;
  const y = canvas.height - 70;
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = palette.clay;
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.quadraticCurveTo(30, -12, 56, 0);
  ctx.lineTo(52, 34);
  ctx.quadraticCurveTo(30, 46, 8, 34);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = palette.honey;
  ctx.beginPath();
  ctx.moveTo(6, 2);
  ctx.quadraticCurveTo(30, -8, 54, 2);
  ctx.lineTo(50, 12);
  ctx.quadraticCurveTo(30, 6, 10, 12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = palette.honeyDeep;
  ctx.fillRect(20, 30, 16, 6);
  ctx.fillStyle = '#2d1b00';
  ctx.font = 'bold 11px "Patrick Hand", sans-serif';
  ctx.fillText('Pooh', 14, 22);

  ctx.beginPath();
  ctx.fillStyle = '#f3d085';
  ctx.arc(30, -18, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2d1b00';
  ctx.beginPath();
  ctx.arc(24, -22, 2.8, 0, Math.PI * 2);
  ctx.arc(36, -22, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(30, -14, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(23, -30, 3.8, 0, Math.PI * 2);
  ctx.arc(37, -30, 3.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function updateDrops() {
  state.drops.forEach((d, i) => {
    d.y += d.speed;
    d.wobble += 0.04;
    const wobbleX = Math.sin(d.wobble) * 6;
    drawDrop(d.x + wobbleX, d.y);
    if (d.y > canvas.height - 70 && d.x > state.player.x && d.x < state.player.x + 60) {
      const bonus = state.streak > 0 && state.streak % 3 === 0 ? 5 : 0;
      state.score += 5 + bonus;
      state.streak += 1;
      addSparkles(d.x, d.y, palette.honey);
      state.drops.splice(i, 1);
      updateHud();
    }
    if (d.y > canvas.height) {
      state.streak = 0;
      state.drops.splice(i, 1);
    }
  });
}

function drawDrop(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = palette.honey;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.quadraticCurveTo(10, 0, 0, 12);
  ctx.quadraticCurveTo(-10, 0, 0, -10);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath();
  ctx.arc(-3, -2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function updateBees() {
  state.bees.forEach((b, i) => {
    b.y += b.speed;
    b.x += Math.sin(b.y / 40 + b.sway) * 1.3;
    drawBee(b.x, b.y);
    if (b.y > canvas.height - 70 && b.x > state.player.x - 12 && b.x < state.player.x + 60) {
      state.lives -= 1;
      state.streak = 0;
      state.bees.splice(i, 1);
      updateHud();
      if (state.lives <= 0) endGame();
    }
    if (b.y > canvas.height) state.bees.splice(i, 1);
  });
}

function updateHud() {
  scoreEl.textContent = state.score;
  timerEl.textContent = `${state.time}s`;
  livesEl.textContent = state.lives;
}

function addSparkles(x, y, color) {
  for (let i = 0; i < 10; i++) {
    state.sparkles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2.8,
      vy: -1 + Math.random() * -1,
      life: 18 + Math.random() * 10,
      color
    });
  }
}

function updateSparkles() {
  state.sparkles = state.sparkles.filter(s => {
    s.x += s.vx;
    s.y += s.vy;
    s.life -= 1;
    ctx.globalAlpha = Math.max(s.life / 20, 0);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    return s.life > 0;
  });
}

function drawBee(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#1f1b1a';
  ctx.beginPath();
  ctx.ellipse(10, 8, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.honey;
  ctx.fillRect(2, 2, 16, 4);
  ctx.fillRect(2, 10, 16, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(6, -2, 8, 6, -0.8, 0, Math.PI * 2);
  ctx.ellipse(14, -2, 8, 6, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function createClouds() {
  state.clouds = Array.from({ length: 4 }, () => ({
    x: Math.random() * canvas.width,
    y: 20 + Math.random() * 60,
    speed: 0.3 + Math.random() * 0.4,
    size: 40 + Math.random() * 40
  }));
}

function updateClouds() {
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  state.clouds.forEach(c => {
    c.x += c.speed;
    if (c.x - c.size > canvas.width) c.x = -c.size;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.size * 0.4, 0, Math.PI * 2);
    ctx.arc(c.x + c.size * 0.3, c.y + 8, c.size * 0.35, 0, Math.PI * 2);
    ctx.arc(c.x - c.size * 0.3, c.y + 10, c.size * 0.32, 0, Math.PI * 2);
    ctx.fill();
  });
}

const form = document.getElementById('rsvpForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const count = Number(document.getElementById('guests').value || 1);
  const existing = parseInt(guestCount.textContent) || 0;
  guestCount.textContent = `${existing + count} friends`;
  formStatus.textContent = 'Your spot is saved! Check your inbox for a cozy confirmation.';
  form.reset();
});
