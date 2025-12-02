const prompts = [
  'Share the coziest lullaby you know for Pooh to hum.',
  'Offer a bit of advice for rainy days in the Wood.',
  'What tradition should Gunner try every spring?',
  'Write a hope for the adventures he will take.',
  'Share a tiny act of kindness he can give a friend.'
];

const state = {
  score: 0,
  best: Number(localStorage.getItem('honeyBest') || 0),
  time: 45,
  lives: 3,
  playing: false,
  player: { x: 320 },
  drops: [],
  bees: [],
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
  state.drops = [];
  state.bees = [];
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
  formStatus.textContent = `Great hunting! Final score: ${state.score}. Tap start to play again.`;
}

function spawn() {
  state.drops.push({ x: Math.random() * (canvas.width - 24), y: -20, speed: 2 + Math.random() * 2 });
  if (Math.random() > 0.6) state.bees.push({ x: Math.random() * (canvas.width - 18), y: -30, speed: 2.2 + Math.random() * 2 });
  if (state.playing) setTimeout(spawn, 900);
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
  drawGround();
  drawPlayer();
  updateDrops();
  updateBees();
  requestAnimationFrame(loop);
}

function drawGround() {
  ctx.fillStyle = '#d5e5c7';
  ctx.fillRect(0, canvas.height - 24, canvas.width, 24);
  ctx.fillStyle = '#c59b2f';
  ctx.fillRect(0, canvas.height - 18, canvas.width, 18);
}

function drawPlayer() {
  ctx.fillStyle = '#f7c948';
  ctx.fillRect(state.player.x, canvas.height - 70, 60, 40);
  ctx.fillStyle = '#184e35';
  ctx.fillRect(state.player.x + 18, canvas.height - 52, 24, 12);
}

function updateDrops() {
  ctx.fillStyle = '#f7c948';
  state.drops.forEach((d, i) => {
    d.y += d.speed;
    ctx.beginPath();
    ctx.arc(d.x, d.y, 10, 0, Math.PI * 2);
    ctx.fill();
    if (d.y > canvas.height - 70 && d.x > state.player.x && d.x < state.player.x + 60) {
      state.score += 5;
      state.drops.splice(i, 1);
      updateHud();
    }
    if (d.y > canvas.height) state.drops.splice(i, 1);
  });
}

function updateBees() {
  ctx.fillStyle = '#f0a500';
  state.bees.forEach((b, i) => {
    b.y += b.speed;
    ctx.beginPath();
    ctx.rect(b.x, b.y, 16, 12);
    ctx.fill();
    if (b.y > canvas.height - 70 && b.x > state.player.x - 8 && b.x < state.player.x + 60) {
      state.lives -= 1;
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

const form = document.getElementById('rsvpForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const count = Number(document.getElementById('guests').value || 1);
  const existing = parseInt(guestCount.textContent) || 0;
  guestCount.textContent = `${existing + count} friends`;
  formStatus.textContent = 'Your spot is saved! Check your inbox for a cozy confirmation.';
  form.reset();
});
