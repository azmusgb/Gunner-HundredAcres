const characters = {
    pooh: {
        name: 'Winnie the Pooh',
        icon: '🐻',
        quote: 'Sometimes the smallest things take up the most room in your heart.',
        bio: 'Pooh is busy arranging honey pots and handwritten notes for Baby Gunner. He believes every sweet treat tastes better when it is shared with friends.'
    },
    piglet: {
        name: 'Piglet',
        icon: '🐷',
        quote: 'Even the littlest friend can bring the greatest joy.',
        bio: 'Piglet is setting out soft blankets and tiny decorations. He has also picked a handful of wildflowers to make sure everything feels cozy.'
    },
    tigger: {
        name: 'Tigger',
        icon: '🐯',
        quote: "New babies are what Tiggers like best!",
        bio: 'Tigger is in charge of the games and is bouncing around the room making sure every guest has a smile (and maybe a balloon).' 
    },
    eeyore: {
        name: 'Eeyore',
        icon: '🐴',
        quote: 'Not that I\'m complaining, but it will be rather nice to have someone new around.',
        bio: 'Eeyore has thoughtfully prepared a quiet corner for reading stories aloud. He even brought a spare tail ribbon to share if anyone needs cheering up.'
    }
};

function showCharacterModal(key) {
    const modal = document.getElementById('characterModal');
    const character = characters[key];
    if (!modal || !character) return;

    document.getElementById('modalCharacterIcon').textContent = character.icon;
    document.getElementById('characterModalTitle').textContent = character.name;
    document.getElementById('modalCharacterQuote').textContent = character.quote;
    document.getElementById('modalCharacterBio').textContent = character.bio;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
}

function closeCharacterModal() {
    const modal = document.getElementById('characterModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
}

function playWoodlandSound(event) {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.6);

    if (event) {
        event.target.classList.add('active-sound');
        setTimeout(() => event.target.classList.remove('active-sound'), 350);
    }
}

function setupNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navItems = document.querySelectorAll('.nav-item');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            const isOpen = navMenu.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', String(isOpen));
        });
    }

    const activateSection = () => {
        const sections = Array.from(document.querySelectorAll('.content-section'));
        const scrollPos = window.scrollY + window.innerHeight / 3;
        sections.forEach((section) => {
            const id = section.getAttribute('id');
            const link = document.querySelector(`.nav-item[data-section="${id}"]`);
            if (!link) return;
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const active = scrollPos >= top && scrollPos < top + height;
            link.classList.toggle('active', active);
        });
    };

    navItems.forEach((item) => {
        item.addEventListener('click', () => {
            navItems.forEach((link) => link.classList.remove('active'));
            item.classList.add('active');
            if (navMenu) navMenu.classList.remove('open');
            if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
        });
    });

    window.addEventListener('scroll', activateSection);
    activateSection();
}

function setupReadingProgress() {
    const bar = document.getElementById('readingProgress');
    if (!bar) return;

    const updateProgress = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
        bar.style.width = `${progress}%`;
    };

    window.addEventListener('scroll', updateProgress);
    updateProgress();
}

function setupButtons() {
    const openBookBtn = document.getElementById('openBookBtn');
    const scrollTopFab = document.getElementById('scrollTopFab');
    const scrollRsvpFab = document.getElementById('scrollRsvpFab');
    const rsvpSection = document.getElementById('rsvp');

    if (openBookBtn) {
        openBookBtn.addEventListener('click', () => {
            document.getElementById('mainContent')?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    if (scrollTopFab) {
        scrollTopFab.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    if (scrollRsvpFab && rsvpSection) {
        scrollRsvpFab.addEventListener('click', () => rsvpSection.scrollIntoView({ behavior: 'smooth' }));
    }
}

function setupRSVPForm() {
    const form = document.getElementById('rsvpForm');
    const status = document.getElementById('rsvpStatus');
    if (!form || !status) return;

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const name = data.get('guestName')?.toString().trim();
        const count = data.get('guestCount');

        if (!name || !count) {
            status.textContent = 'Please add your name and the number of guests joining.';
            status.className = 'form-status error';
            return;
        }

        const note = data.get('guestNote')?.toString().trim();
        const summary = `${name} (${count} attending)${note ? ` – ${note}` : ''}`;
        status.textContent = `Your RSVP was saved: ${summary}`;
        status.className = 'form-status success';
        form.reset();
    });
}

function setupMotionToggle() {
    const motionToggle = document.getElementById('motionToggle');
    if (!motionToggle) return;

    const applyPreference = (reduced) => {
        document.body.classList.toggle('reduce-motion', reduced);
        localStorage.setItem('reduceMotion', reduced ? 'true' : 'false');
    };

    const stored = localStorage.getItem('reduceMotion') === 'true';
    applyPreference(stored);

    motionToggle.addEventListener('click', () => {
        const reduced = !document.body.classList.contains('reduce-motion');
        applyPreference(reduced);
    });
}

function setupMusicToggle() {
    const musicBtn = document.getElementById('musicToggle');
    const music = document.getElementById('bgMusic');
    if (!musicBtn || !music) return;

    music.volume = 0.45;

    musicBtn.addEventListener('click', async () => {
        if (music.paused) {
            try {
                await music.play();
                musicBtn.classList.add('active');
            } catch (error) {
                console.warn('Unable to start audio', error);
            }
        } else {
            music.pause();
            musicBtn.classList.remove('active');
        }
    });
}

function setupScrollAnimations() {
    const items = document.querySelectorAll('.scroll-animate');
    if (!items.length) return;

    const reveal = () => {
        const trigger = window.innerHeight * 0.85 + window.scrollY;
        items.forEach((item) => {
            if (trigger > item.offsetTop) {
                item.classList.add('visible');
            }
        });
    };

    window.addEventListener('scroll', reveal);
    reveal();
}

function setupModalControls() {
    const modal = document.getElementById('characterModal');
    const closeBtn = document.getElementById('closeCharacterModal');
    if (!modal || !closeBtn) return;

    closeBtn.addEventListener('click', closeCharacterModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeCharacterModal();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeCharacterModal();
    });
}

function setupLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (!loadingScreen) return;
    loadingScreen.classList.remove('hidden');

    setTimeout(() => {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => loadingScreen.classList.add('hidden'), 450);
    }, 450);
}

class TowerDefenseGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.honey = 100;
        this.lives = 10;
        this.wave = 1;
        this.running = false;
        this.spawnTimer = 0;
        this.enemiesToSpawn = 0;
        this.lastTime = 0;
        this.selectedTower = 'pooh';

        this.towerStats = {
            pooh: { cost: 20, range: 110, damage: 12, rate: 900, color: '#d19a3d' },
            tigger: { cost: 30, range: 130, damage: 14, rate: 750, color: '#e68a00' },
            rabbit: { cost: 40, range: 140, damage: 16, rate: 800, color: '#cfa95e' },
            piglet: { cost: 25, range: 120, damage: 12, rate: 820, color: '#f48fb1' },
            eeyore: { cost: 35, range: 150, damage: 18, rate: 1050, color: '#7e8ca3' }
        };

        this.pathY = this.height / 2;
        this.init();
    }

    init() {
        this.canvas.addEventListener('click', (event) => this.placeTower(event));
        this.startButton = document.getElementById('start-defense');
        this.upgradeButton = document.getElementById('upgrade-tower');
        this.honeyEl = document.getElementById('honey-count');
        this.livesEl = document.getElementById('lives-count');
        this.waveEl = document.getElementById('wave-count');
        this.alertEl = document.getElementById('defense-alert');
        this.waveStatusEl = document.getElementById('defense-wave-status');
        this.towerOptions = document.querySelectorAll('.tower-option');

        this.startButton?.addEventListener('click', () => this.startWave());
        this.upgradeButton?.addEventListener('click', () => this.upgradeTowers());
        this.towerOptions.forEach((btn) => {
            btn.addEventListener('click', () => this.selectTower(btn));
            if (btn.dataset.tower === this.selectedTower) {
                this.selectTower(btn);
            }
        });

        this.updateHud();
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    selectTower(button) {
        this.towerOptions.forEach((btn) => btn.classList.remove('selected'));
        button.classList.add('selected');
        this.towerOptions.forEach((btn) => btn.setAttribute('aria-pressed', 'false'));
        button.setAttribute('aria-pressed', 'true');
        this.selectedTower = button.dataset.tower;
    }

    startWave() {
        if (this.running) return;
        this.running = true;
        this.enemiesToSpawn = 5 + this.wave * 2;
        this.spawnTimer = 0;
        this.alertEl.textContent = 'Wave started! Place friends to guard the path.';
    }

    upgradeTowers() {
        if (this.honey < 50) {
            this.alertEl.textContent = 'You need 50🍯 to upgrade your team.';
            return;
        }
        this.honey -= 50;
        this.towers.forEach((tower) => {
            tower.range *= 1.08;
            tower.damage += 4;
        });
        this.alertEl.textContent = 'Your friends feel braver and stronger!';
        this.updateHud();
    }

    placeTower(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const stats = this.towerStats[this.selectedTower];
        if (!stats) return;

        if (this.honey < stats.cost) {
            this.alertEl.textContent = 'Not enough honey to place that friend.';
            return;
        }

        this.towers.push({
            x,
            y,
            range: stats.range,
            damage: stats.damage,
            rate: stats.rate,
            lastShot: 0,
            color: stats.color
        });
        this.honey -= stats.cost;
        this.alertEl.textContent = `${this.selectedTower} joined the party!`;
        this.updateHud();
    }

    spawnEnemy() {
        this.enemies.push({
            x: -20,
            y: this.pathY,
            speed: 35 + Math.random() * 20,
            hp: 60 + this.wave * 10
        });
    }

    updateEnemies(delta) {
        for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
            const enemy = this.enemies[i];
            enemy.x += enemy.speed * delta;
            if (enemy.x > this.width + 40) {
                this.enemies.splice(i, 1);
                this.lives = Math.max(0, this.lives - 1);
                this.alertEl.textContent = 'A Woozle slipped by!';
                this.updateHud();
            }
        }
    }

    updateTowers(delta, timestamp) {
        this.towers.forEach((tower) => {
            const target = this.enemies.find((enemy) => {
                const dx = enemy.x - tower.x;
                const dy = enemy.y - tower.y;
                return Math.hypot(dx, dy) <= tower.range;
            });

            if (target && timestamp - tower.lastShot > tower.rate) {
                tower.lastShot = timestamp;
                const angle = Math.atan2(target.y - tower.y, target.x - tower.x);
                this.projectiles.push({
                    x: tower.x,
                    y: tower.y,
                    vx: Math.cos(angle) * 260,
                    vy: Math.sin(angle) * 260,
                    damage: tower.damage
                });
            }
        });
    }

    updateProjectiles(delta) {
        for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
            const projectile = this.projectiles[i];
            projectile.x += projectile.vx * delta;
            projectile.y += projectile.vy * delta;

            const enemy = this.enemies.find((e) => Math.hypot(e.x - projectile.x, e.y - projectile.y) < 16);
            if (enemy) {
                enemy.hp -= projectile.damage;
                this.projectiles.splice(i, 1);
                if (enemy.hp <= 0) {
                    const enemyIndex = this.enemies.indexOf(enemy);
                    this.enemies.splice(enemyIndex, 1);
                    this.honey += 8;
                    this.alertEl.textContent = 'Great teamwork! You earned more honey.';
                    this.updateHud();
                }
                continue;
            }

            if (projectile.x < -10 || projectile.x > this.width + 10 || projectile.y < -10 || projectile.y > this.height + 10) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    drawBackground() {
        const ctx = this.ctx;
        ctx.fillStyle = '#a8e6cf';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = '#f7e0a3';
        ctx.fillRect(0, this.pathY - 30, this.width, 60);

        ctx.strokeStyle = 'rgba(139, 69, 19, 0.4)';
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.moveTo(0, this.pathY);
        ctx.lineTo(this.width, this.pathY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawEntities() {
        const ctx = this.ctx;
        this.towers.forEach((tower) => {
            ctx.fillStyle = tower.color;
            ctx.beginPath();
            ctx.arc(tower.x, tower.y, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.beginPath();
            ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
            ctx.stroke();
        });

        ctx.fillStyle = '#6c4b1a';
        this.enemies.forEach((enemy) => {
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffe7a1';
            ctx.fillRect(enemy.x - 16, enemy.y - 20, 32, 6);
            ctx.fillStyle = '#d9534f';
            const healthWidth = Math.max(0, (enemy.hp / (60 + this.wave * 10)) * 32);
            ctx.fillRect(enemy.x - 16, enemy.y - 20, healthWidth, 6);
            ctx.fillStyle = '#6c4b1a';
        });

        ctx.fillStyle = '#ffbb33';
        this.projectiles.forEach((projectile) => {
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    updateHud() {
        if (this.honeyEl) this.honeyEl.textContent = Math.max(0, Math.floor(this.honey));
        if (this.livesEl) this.livesEl.textContent = Math.max(0, this.lives);
        if (this.waveEl) this.waveEl.textContent = this.wave;
    }

    updateWaveStatus() {
        if (!this.waveStatusEl) return;
        if (!this.running && this.enemies.length === 0 && this.enemiesToSpawn === 0) {
            this.waveStatusEl.textContent = `Wave ${this.wave} ready`;
        } else {
            this.waveStatusEl.textContent = `Wave ${this.wave} in progress`;
        }
    }

    gameLoop(timestamp) {
        const delta = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawBackground();

        if (this.running) {
            this.spawnTimer += delta;
            if (this.enemiesToSpawn > 0 && this.spawnTimer > 0.9) {
                this.spawnEnemy();
                this.enemiesToSpawn -= 1;
                this.spawnTimer = 0;
            }
        }

        this.updateEnemies(delta);
        this.updateTowers(delta, timestamp);
        this.updateProjectiles(delta);
        this.drawEntities();
        this.updateWaveStatus();

        if (this.running && this.enemies.length === 0 && this.enemiesToSpawn === 0) {
            this.running = false;
            this.wave += 1;
            this.honey += 15;
            this.alertEl.textContent = 'The path is safe! Get ready for the next wave.';
            this.updateHud();
        }

        if (this.lives <= 0) {
            this.running = false;
            this.alertEl.textContent = 'Oh, bother! The honey was taken. Press start to try again.';
            this.wave = 1;
            this.honey = 100;
            this.lives = 10;
            this.towers = [];
            this.enemies = [];
            this.projectiles = [];
            this.updateHud();
        }

        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

class HoneyCatchGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.player = { x: this.width / 2, width: 80, height: 18, speed: 320 };
        this.items = [];
        this.score = 0;
        this.timeRemaining = 60;
        this.lives = 3;
        this.running = false;
        this.started = false;
        this.lastTime = 0;
        this.spawnTimer = 0;
        this.controls = { left: false, right: false };

        this.scoreEl = document.getElementById('score-count');
        this.timeEl = document.getElementById('time-count');
        this.livesEl = document.getElementById('catch-lives');
        this.overlay = document.getElementById('catch-overlay');
        this.countdown = document.getElementById('catch-countdown');
        this.hint = document.getElementById('catch-hint');
        this.startBtn = document.getElementById('start-catch');
        this.pauseBtn = document.getElementById('pause-catch');

        this.bindControls();
        this.updateHud();
        requestAnimationFrame((timestamp) => this.loop(timestamp));
    }

    bindControls() {
        window.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') this.controls.left = true;
            if (event.key === 'ArrowRight') this.controls.right = true;
        });

        window.addEventListener('keyup', (event) => {
            if (event.key === 'ArrowLeft') this.controls.left = false;
            if (event.key === 'ArrowRight') this.controls.right = false;
        });

        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const relativeX = event.clientX - rect.left;
            if (relativeX < this.width / 2) {
                this.controls.left = true;
                setTimeout(() => (this.controls.left = false), 120);
            } else {
                this.controls.right = true;
                setTimeout(() => (this.controls.right = false), 120);
            }
        });

        this.startBtn?.addEventListener('click', () => this.start());
        this.pauseBtn?.addEventListener('click', () => this.togglePause());
    }

    start() {
        if (this.running) return;

        const canResume = this.started && this.timeRemaining > 0 && this.lives > 0;
        if (canResume) {
            this.running = true;
            this.overlay.classList.add('hidden');
            this.countdown.textContent = 'Back to catching honey!';
            this.hint.textContent = 'Keep scooping pots and dodge the bees.';
            this.updateHud();
            return;
        }

        this.score = 0;
        this.timeRemaining = 60;
        this.lives = 3;
        this.items = [];
        this.running = true;
        this.started = true;
        this.overlay.classList.add('hidden');
        this.countdown.textContent = 'Ready when you are.';
        this.hint.textContent = 'Tap left/right or use arrow keys to move Pooh.';
        this.updateHud();
    }

    togglePause() {
        if (!this.running) return;
        this.running = false;
        this.overlay.classList.remove('hidden');
        this.countdown.textContent = 'Paused – take a breather';
        this.hint.textContent = 'Press start again when you are ready to continue.';
    }

    spawnItem() {
        const type = Math.random() < 0.8 ? 'honey' : 'bee';
        this.items.push({
            x: Math.random() * (this.width - 30) + 15,
            y: -20,
            speed: 90 + Math.random() * 120,
            type
        });
    }

    updateItems(delta) {
        for (let i = this.items.length - 1; i >= 0; i -= 1) {
            const item = this.items[i];
            item.y += item.speed * delta;

            if (item.y > this.height - this.player.height - 16 && item.y < this.height) {
                if (Math.abs(item.x - this.player.x) < this.player.width / 2 + 10) {
                    if (item.type === 'honey') {
                        this.score += 10;
                        this.countdown.textContent = 'Nice catch! +10 honey points';
                    } else {
                        this.lives = Math.max(0, this.lives - 1);
                        this.countdown.textContent = 'A bee buzzed by – careful!';
                    }
                    this.items.splice(i, 1);
                    this.updateHud();
                    continue;
                }
            }

            if (item.y > this.height + 30) {
                this.items.splice(i, 1);
            }
        }
    }

    updatePlayer(delta) {
        if (this.controls.left) this.player.x -= this.player.speed * delta;
        if (this.controls.right) this.player.x += this.player.speed * delta;
        this.player.x = Math.max(this.player.width / 2, Math.min(this.width - this.player.width / 2, this.player.x));
    }

    drawBackground() {
        this.ctx.fillStyle = '#b0d0e3';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = '#f6e7c1';
        this.ctx.fillRect(0, this.height - 60, this.width, 60);
    }

    drawPlayer() {
        this.ctx.fillStyle = '#e8a73c';
        this.ctx.fillRect(this.player.x - this.player.width / 2, this.height - this.player.height - 8, this.player.width, this.player.height);
        this.ctx.fillStyle = '#8b5a2b';
        this.ctx.fillRect(this.player.x - this.player.width / 2 + 8, this.height - this.player.height - 12, this.player.width - 16, 6);
    }

    drawItems() {
        this.items.forEach((item) => {
            if (item.type === 'honey') {
                this.ctx.fillStyle = '#ffda79';
                this.ctx.beginPath();
                this.ctx.arc(item.x, item.y, 12, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#8b5a2b';
                this.ctx.fillRect(item.x - 8, item.y - 6, 16, 6);
            } else {
                this.ctx.fillStyle = '#f05d5e';
                this.ctx.beginPath();
                this.ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(item.x - 6, item.y - 2, 12, 4);
            }
        });
    }

    updateHud() {
        if (this.scoreEl) this.scoreEl.textContent = this.score;
        if (this.timeEl) this.timeEl.textContent = Math.max(0, Math.ceil(this.timeRemaining));
        if (this.livesEl) this.livesEl.textContent = this.lives;
    }

    loop(timestamp) {
        const delta = Math.min(0.05, (timestamp - this.lastTime) / 1000);
        this.lastTime = timestamp;

        this.drawBackground();
        if (this.running) {
            this.timeRemaining -= delta;
            this.spawnTimer += delta;
            if (this.spawnTimer > 0.9) {
                this.spawnItem();
                this.spawnTimer = 0;
            }

            this.updatePlayer(delta);
            this.updateItems(delta);

            if (this.timeRemaining <= 0 || this.lives <= 0) {
                this.running = false;
                this.overlay.classList.remove('hidden');
                this.countdown.textContent = this.lives <= 0 ? 'Game over – the bees won this round.' : 'Time\'s up!';
                this.hint.textContent = 'Press start to try again and set a new score.';
            }
            this.updateHud();
        }

        this.drawItems();
        this.drawPlayer();

        requestAnimationFrame((time) => this.loop(time));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupLoadingScreen();
    setupNavigation();
    setupReadingProgress();
    setupButtons();
    setupRSVPForm();
    setupMotionToggle();
    setupMusicToggle();
    setupScrollAnimations();
    setupModalControls();

    const defenseCanvas = document.getElementById('defense-game');
    const catchCanvas = document.getElementById('honey-game');
    if (defenseCanvas) new TowerDefenseGame(defenseCanvas);
    if (catchCanvas) new HoneyCatchGame(catchCanvas);
});

window.showCharacterModal = showCharacterModal;
window.playWoodlandSound = playWoodlandSound;
