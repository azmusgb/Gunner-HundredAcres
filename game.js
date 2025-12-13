(() => {
  'use strict';

  /* ===============================
     DOM
  ================================ */
  const canvas = document.getElementById('honey-game');
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

  const scoreEl = document.getElementById('score');
  const streakEl = document.getElementById('streak');
  const statusEl = document.getElementById('game-status');

  const startOverlay = document.getElementById('start-overlay');
  const pauseOverlay = document.getElementById('pause-overlay');

  const startBtn = document.getElementById('start-btn');
  const resumeBtn = document.getElementById('resume-btn');

  /* ===============================
     GAME STATE
  ================================ */
  let lastTime = 0;
  let running = false;
  let paused = false;

  let score = 0;
  let streak = 0;

  const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    vx: 0,
    radius: 20
  };

  /* ===============================
     OBJECT POOLS
  ================================ */
  const honeyPool = [];
  const bees = [];

  function spawnHoney() {
    const h = honeyPool.pop() || {};
    h.x = Math.random() * canvas.width;
    h.y = -20;
    h.vy = 120 + Math.random() * 80;
    h.active = true;
    return h;
  }

  function releaseHoney(h) {
    h.active = false;
    honeyPool.push(h);
  }

  const honeys = [];

  /* ===============================
     INPUT
  ================================ */
  let targetX = player.x;

  canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    targetX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
  }, { passive: false });

  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') targetX -= 40;
    if (e.key === 'ArrowRight') targetX += 40;
    if (e.key === 'Escape') togglePause();
  });

  /* ===============================
     GAME LOOP
  ================================ */
  function loop(now) {
    if (!running) return;

    const dt = Math.min((now - lastTime) / 1000, 0.033);
    lastTime = now;

    if (!paused) update(dt);
    render();

    requestAnimationFrame(loop);
  }

  /* ===============================
     UPDATE
  ================================ */
  function update(dt) {
    // Player inertia
    const dx = targetX - player.x;
    player.vx += dx * 0.15;
    player.vx *= 0.82;
    player.x += player.vx * dt * 60;

    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));

    // Spawn honey
    if (Math.random() < 0.04) honeys.push(spawnHoney());

    for (let i = honeys.length - 1; i >= 0; i--) {
      const h = honeys[i];
      h.y += h.vy * dt;

      const dist = Math.hypot(h.x - player.x, h.y - player.y);
      if (dist < player.radius + 10) {
        score += 10 + streak * 2;
        streak++;
        updateHUD();
        releaseHoney(h);
        honeys.splice(i, 1);
        continue;
      }

      if (h.y > canvas.height + 30) {
        streak = Math.max(0, streak - 1);
        updateHUD();
        releaseHoney(h);
        honeys.splice(i, 1);
      }
    }
  }

  /* ===============================
     RENDER
  ================================ */
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player
    ctx.fillStyle = '#f4a944';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Honey
    ctx.fillStyle = '#ffb300';
    for (const h of honeys) {
      ctx.beginPath();
      ctx.arc(h.x, h.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ===============================
     UI / STATE
  ================================ */
  function updateHUD() {
    scoreEl.textContent = score;
    streakEl.textContent = streak;
    statusEl.textContent = `Score ${score}, streak ${streak}`;
  }

  function startGame() {
    startOverlay.classList.add('hidden');
    running = true;
    paused = false;
    score = 0;
    streak = 0;
    honeys.length = 0;
    updateHUD();
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    pauseOverlay.classList.toggle('hidden', !paused);
  }

  /* ===============================
     EVENTS
  ================================ */
  startBtn.addEventListener('click', startGame);
  resumeBtn.addEventListener('click', togglePause);

})();