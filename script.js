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

const state = {
  score: 0,
  best: Number(localStorage.getItem('honeyBest') || 0),
  time: 45,
  lives: 3,
  playing: false,
  paused: false,
  player: { x: 320 },
  drops: [],
  bees: [],
  timerId: null,
};

const canvas = document.getElementById('honeyCanvas');
const ctx = canvas.getContext('2d');
const loader = document.getElementById('loader');
const loaderStart = performance.now();

const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const livesEl = document.getElementById('lives');
const bestEl = document.getElementById('best');
const guestCount = document.getElementById('guestCount');
const formStatus = document.getElementById('formStatus');

const promptBtn = document.getElementById('promptButton');
const promptText = document.getElementById('promptText');
const playBtn = document.getElementById('startGame');
const pauseBtn = document.getElementById('pauseGame');
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
});

window.addEventListener('scroll', () => {
  revealOnScroll();
  updatePageTurns();
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
  state.paused = false;
  updateHud();
}

function startGame() {
  resetGame();
  state.playing = true;
  instructionOverlay.classList.add('is-hidden');
  gameOverOverlay.classList.remove('is-visible');
  gameStatus.textContent = 'Hunt honey and dodge the bees!';
  spawn();
  startTimer();
  loop();
}

function endGame() {
  state.playing = false;
  clearInterval(state.timerId);
  const previousBest = state.best;
  state.best = Math.max(state.best, state.score);
  localStorage.setItem('honeyBest', state.best);
  bestEl.textContent = state.best;
  finalScoreEl.textContent = state.score;
  highScoreBadge.style.display = state.score > previousBest ? 'block' : 'none';
  sharePrompt.textContent = `I scored ${state.score} honey pots at Gunner's shower! Can you beat it?`;
  gameOverOverlay.classList.add('is-visible');
  gameStatus.textContent = 'Round complete — ready for another hunt?';
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

closeInstructions.addEventListener('click', () => instructionOverlay.classList.add('is-hidden'));
playAgain.addEventListener('click', () => { gameOverOverlay.classList.remove('is-visible'); startGame(); });
closeGameOver.addEventListener('click', () => gameOverOverlay.classList.remove('is-visible'));

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
