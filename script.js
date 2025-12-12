// script.js - Hundred Acre Celebration
// Everything for the page + both mini-games in one file.

// ============================================================================
// UTILITIES & GLOBALS
// ============================================================================

(function () {
    'use strict';

    // Simple helper to safely query elements
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));

    // Global sprite registry (used by both games)
    const Sprites = {
        pooh: null,
        piglet: null,
        tigger: null,
        eeyore: null,
        owl: null,
        roo: null,
        honey: null
    };

    function shakeElement(el) {
        if (!el) return;
        el.classList.remove('shake');
        // force reflow to restart animation
        void el.offsetWidth;
        el.classList.add('shake');
    }

    function loadSprites() {
        const paths = {
            pooh: 'Images/Characters/honey-bear.png',
            piglet: 'Images/Characters/piglet.png',
            tigger: 'Images/Characters/tigger.png',
            eeyore: 'Images/Characters/eeyore.png',
            owl: 'Images/Characters/owl.png',
            roo: 'Images/Characters/roo.png',
            honey: 'Images/Characters/honey.png' // optional; safe if missing
        };

        Object.keys(paths).forEach((key) => {
            const img = new Image();
            img.src = paths[key];
            Sprites[key] = img;
        });
    }

    // Inject keyframe helpers (confetti + honeyPop) so we don't depend on CSS
    function injectExtraKeyframes() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes honeyPop {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }

            .confetti {
                animation: confetti-fall 3s ease-in forwards;
            }

            @keyframes confetti-fall {
                0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // ========================================================================
    // BASE UI: STORYBOOK, NAV, RSVP, MUSIC, ACCESSIBILITY
    // ========================================================================

    function initBaseUI() {
        const body = document.body;

        const storybookCover = $('#storybookCover');
        const openBookBtn = $('#openBookBtn');
        const storybook = $('#storybook');

        const contentSections = $$('.content-section');
        const scrollAnimateElements = $$('.scroll-animate');

        const navMenu = $('#navMenu');
        const navItems = $$('.nav-item');
        const navToggle = $('#navToggle');

        const loadingScreen = $('#loadingScreen');
        const readingProgress = $('#readingProgress');

        const scrollTopFab = $('#scrollTopFab');
        const scrollRsvpFab = $('#scrollRsvpFab');

        const musicToggle = $('#musicToggle');
        const motionToggle = $('#motionToggle');
        const bgMusic = $('#bgMusic');

        const rsvpForm = $('#rsvpForm');
        const rsvpStatus = $('#rsvpStatus');

        // Character modal
        const characterModal = $('#characterModal');
        const closeCharacterModalBtn = $('#closeCharacterModal');
        const modalCharacterIcon = $('#modalCharacterIcon');
        const modalCharacterTitle = $('#characterModalTitle');
        const modalCharacterQuote = $('#modalCharacterQuote');
        const modalCharacterBio = $('#modalCharacterBio');

        // Character data
        const characterData = {
            pooh: {
                name: 'Winnie the Pooh',
                quote: '"A little Consideration, a little Thought for Others, makes all the difference."',
                icon: 'fas fa-bear',
                bio: 'Pooh has volunteered to be in charge of honey jars, hugs, and quiet snuggles. He is quite certain Baby Gunner will need all three in generous amounts.'
            },
            piglet: {
                name: 'Piglet',
                quote: '"It is hard to be brave, when you\'re only a Very Small Animal — but I\'ll do it for Baby Gunner."',
                icon: 'fas fa-heart',
                bio: 'Piglet has carefully arranged the soft blankets and tiny clothes, making sure everything feels cozy, safe, and just right for someone very small.'
            },
            tigger: {
                name: 'Tigger',
                quote: '"The wonderful thing about babies is that babies are wonderful things!"',
                icon: 'fas fa-paw',
                bio: 'Tigger is in charge of games, giggles, and any moment that calls for a bounce. He\'s especially excited about showing everyone how to make Baby Gunner smile.'
            },
            eeyore: {
                name: 'Eeyore',
                quote: '"Not much of a tail, but it\'s my tail. And this is our baby, and that\'s rather special."',
                icon: 'fas fa-cloud',
                bio: 'Eeyore has quietly found the best spot for photos and moments of quiet. He is making sure there\'s always a comfortable place to sit and simply be together.'
            }
        };

        // ----------------- Loading screen -----------------
        function safeHideLoading() {
            if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
                loadingScreen.classList.add('hidden');
            }
        }

        setTimeout(() => {
            safeHideLoading();
            setTimeout(() => {
                contentSections.forEach((section, i) => {
                    setTimeout(() => section.classList.add('animate-in'), i * 120);
                });
            }, 200);
        }, 900);

        // ----------------- Storybook open -----------------
        function openStorybook() {
            if (!storybookCover || !storybook) return;

            storybookCover.classList.add('closed');
            setTimeout(() => {
                storybook.classList.add('visible');
                contentSections.forEach((s) => s.classList.add('visible'));
                const first = $('#section1');
                if (first) {
                    first.scrollIntoView({ behavior: 'smooth' });
                }
            }, 700);
        }

        if (openBookBtn) {
            openBookBtn.addEventListener('click', openStorybook);
        }

        // ----------------- Navigation / active states -----------------
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('open');
            });
        }

        navItems.forEach((item) => {
            item.addEventListener('click', () => {
                if (navMenu) navMenu.classList.remove('open');
            });
        });

        function setupSectionObserver() {
            const sections = $$('.content-section');
            if (!sections.length) return;

            const options = {
                root: null,
                rootMargin: '-20% 0px -60% 0px',
                threshold: 0.1
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const id = entry.target.id;
                    const navItem = document.querySelector(`.nav-item[data-section="${id}"]`);
                    if (entry.isIntersecting) {
                        navItems.forEach((i) => i.classList.remove('active'));
                        if (navItem) navItem.classList.add('active');
                    }
                });
            }, options);

            sections.forEach((section) => observer.observe(section));
        }

        setupSectionObserver();

        // ----------------- Scroll animations & progress -----------------
        function checkScrollAnimations() {
            const windowHeight = window.innerHeight;
            const triggerBottom = windowHeight * 0.8;

            scrollAnimateElements.forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.top < triggerBottom) el.classList.add('visible');
            });
        }

        function updateReadingProgress() {
            if (!readingProgress) return;
            const doc = document.documentElement;
            const scrollTop = doc.scrollTop || document.body.scrollTop;
            const scrollHeight = doc.scrollHeight - doc.clientHeight;
            const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            readingProgress.style.width = progress + '%';
        }

        window.addEventListener('scroll', checkScrollAnimations);
        window.addEventListener('scroll', updateReadingProgress);
        checkScrollAnimations();
        updateReadingProgress();

        // ----------------- FABs -----------------
        if (scrollTopFab) {
            scrollTopFab.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        if (scrollRsvpFab) {
            scrollRsvpFab.addEventListener('click', () => {
                const rsvp = $('#rsvp');
                if (rsvp) rsvp.scrollIntoView({ behavior: 'smooth' });
            });
        }

        // ----------------- Reduced motion -----------------
        function initReduceMotionPreference() {
            const stored = localStorage.getItem('reduce-motion');
            if (stored === 'true') body.classList.add('reduce-motion');
        }

        function toggleReduceMotion() {
            const enabled = body.classList.toggle('reduce-motion');
            localStorage.setItem('reduce-motion', enabled ? 'true' : 'false');
        }

        initReduceMotionPreference();

        if (motionToggle) {
            motionToggle.addEventListener('click', toggleReduceMotion);
        }

        // ----------------- Background music -----------------
        function initMusicPreference() {
            if (!musicToggle || !bgMusic) return;
            const stored = localStorage.getItem('bg-music');
            const icon = musicToggle.querySelector('i');

            if (stored === 'on') {
                bgMusic.volume = 0.35;
                bgMusic.play().catch(() => {});
                if (icon) {
                    icon.classList.remove('fa-volume-xmark');
                    icon.classList.add('fa-music');
                }
            } else if (stored === 'off' && icon) {
                icon.classList.remove('fa-music');
                icon.classList.add('fa-volume-xmark');
            }
        }

        function toggleMusic() {
            if (!musicToggle || !bgMusic) return;
            const icon = musicToggle.querySelector('i');
            if (bgMusic.paused) {
                bgMusic.volume = 0.35;
                bgMusic.play().catch(() => {});
                if (icon) {
                    icon.classList.remove('fa-volume-xmark');
                    icon.classList.add('fa-music');
                }
                localStorage.setItem('bg-music', 'on');
            } else {
                bgMusic.pause();
                if (icon) {
                    icon.classList.remove('fa-music');
                    icon.classList.add('fa-volume-xmark');
                }
                localStorage.setItem('bg-music', 'off');
            }
        }

        initMusicPreference();

        if (musicToggle) {
            musicToggle.addEventListener('click', toggleMusic);
        }

        // ----------------- RSVP + confetti -----------------
        function createConfetti() {
            const container = document.createElement('div');
            container.className = 'confetti-container';
            document.body.appendChild(container);

            const colors = ['#FFC42B', '#D62E2E', '#E6B86A', '#B0D0E3', '#9CAD90'];

            for (let i = 0; i < 140; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.position = 'fixed';
                confetti.style.top = '-20px';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.width = '6px';
                confetti.style.height = '12px';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
                confetti.style.animationDelay = Math.random() * 1.5 + 's';
                container.appendChild(confetti);
            }

            setTimeout(() => container.remove(), 3500);
        }

        function handleRsvpSubmit(ev) {
            ev.preventDefault();
            if (!rsvpForm || !rsvpStatus) return;

            const formData = new FormData(rsvpForm);
            const guestName = (formData.get('guestName') || '').toString().trim();
            const guestCount = (formData.get('guestCount') || '').toString();
            const guestNote = (formData.get('guestNote') || '').toString().trim();

            if (!guestName) {
                rsvpStatus.textContent = 'Please enter your name.';
                rsvpStatus.style.color = '#dc3545';
                return;
            }

            rsvpForm.style.display = 'none';
            rsvpStatus.style.color = 'inherit';
            rsvpStatus.innerHTML = `
                <div class="form-success">
                    <div class="success-icon">🎉</div>
                    <div class="success-message">Thank you, ${guestName}!</div>
                    <div class="success-submessage">
                        We're excited to celebrate with ${
                            guestCount === '1' || guestCount === '' ? 'you' : `your party of ${guestCount}`
                        }!
                        ${guestNote ? '<br>We appreciate your note!' : ''}
                    </div>
                </div>
            `;

            createConfetti();

            const honeyIcon = document.createElement('div');
            honeyIcon.innerHTML = '🍯';
            honeyIcon.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                font-size: 4rem;
                transform: translate(-50%, -50%) scale(0);
                animation: honeyPop 1s ease-out forwards;
                z-index: 9999;
            `;
            document.body.appendChild(honeyIcon);
            setTimeout(() => honeyIcon.remove(), 1100);

            const rsvpData = {
                name: guestName,
                count: guestCount,
                note: guestNote,
                ts: new Date().toISOString()
            };
            localStorage.setItem('babyGunnerRSVP', JSON.stringify(rsvpData));
        }

        function checkExistingRSVP() {
            if (!rsvpForm || !rsvpStatus) return;
            const existing = localStorage.getItem('babyGunnerRSVP');
            if (!existing) return;

            const data = JSON.parse(existing);
            const nameInput = $('#guestName');
            const countInput = $('#guestCount');
            const noteInput = $('#guestNote');

            if (nameInput) nameInput.value = data.name || '';
            if (countInput) countInput.value = data.count || '';
            if (noteInput) noteInput.value = data.note || '';

            rsvpForm.style.display = 'none';
            rsvpStatus.innerHTML = `
                <div class="form-success">
                    <div class="success-icon">✅</div>
                    <div class="success-message">RSVP Confirmed!</div>
                    <div class="success-submessage">
                        We have your RSVP for ${data.name} and ${
                data.count === '1' ? '1 guest.' : `${data.count} guests.`
            }
                        <br><button class="back-btn" style="margin-top:10px;" onclick="editRSVP()">Edit RSVP</button>
                    </div>
                </div>
            `;
        }

        if (rsvpForm) {
            rsvpForm.addEventListener('submit', handleRsvpSubmit);
        }
        checkExistingRSVP();

        // editRSVP needs to be globally visible
        window.editRSVP = function () {
            localStorage.removeItem('babyGunnerRSVP');
            if (!rsvpForm || !rsvpStatus) return;
            rsvpForm.reset();
            rsvpForm.style.display = 'block';
            rsvpStatus.innerHTML = '';
        };

        // ----------------- Character modal (global) -----------------
        window.showCharacterModal = function (key) {
            if (!characterModal || !modalCharacterIcon || !modalCharacterTitle) return;
            const data = characterData[key];
            if (!data) return;

            modalCharacterIcon.innerHTML = `<i class="${data.icon}"></i>`;
            modalCharacterIcon.className = `modal-character-icon ${key}-icon-modal`;
            modalCharacterTitle.textContent = data.name;
            if (modalCharacterQuote) modalCharacterQuote.textContent = data.quote;
            if (modalCharacterBio) modalCharacterBio.textContent = data.bio;

            characterModal.classList.add('active');
        };

        if (closeCharacterModalBtn && characterModal) {
            closeCharacterModalBtn.addEventListener('click', () => {
                characterModal.classList.remove('active');
            });
            characterModal.addEventListener('click', (ev) => {
                if (ev.target === characterModal) {
                    characterModal.classList.remove('active');
                }
            });
        }

        // ----------------- Woodland sound (global) -----------------
        window.playWoodlandSound = function (ev) {
            const e = ev || window.event;

            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    const audioContext = new AudioCtx();
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();

                    osc.connect(gain);
                    gain.connect(audioContext.destination);

                    const t0 = audioContext.currentTime;
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(523.25, t0);
                    osc.frequency.setValueAtTime(659.25, t0 + 0.12);
                    osc.frequency.setValueAtTime(783.99, t0 + 0.24);

                    gain.gain.setValueAtTime(0.12, t0);
                    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.8);

                    osc.start();
                    osc.stop(t0 + 0.85);
                }
            } catch (err) {
                console.log('Web Audio not available:', err);
            }

            const sign = e && e.target && e.target.closest
                ? e.target.closest('.woodland-sign')
                : null;
            if (sign) {
                sign.style.transform = 'scale(1.06) rotate(-1deg)';
                setTimeout(() => (sign.style.transform = ''), 260);
            }
        };
    }

    // ========================================================================
    // GAME 1: HONEY HIVE DEFENSE (TOWER DEFENSE)
// ========================================================================

    function initDefenseGame() {
        const canvas = document.getElementById('defense-game');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const honeySpan = document.getElementById('honey-count');
        const livesSpan = document.getElementById('lives-count');
        const waveSpan = document.getElementById('wave-count');
        const startBtn = document.getElementById('start-defense');
        const upgradeBtn = document.getElementById('upgrade-tower');
        const towerOptions = document.querySelectorAll('.tower-option');
        const defenseAlert = document.getElementById('defense-alert');
        const waveStatus = document.getElementById('defense-wave-status');
        const defenseCard = document.getElementById('defense-card');

        let honey = 100;
        let lives = 10;
        let wave = 1;
        let selectedTower = 'pooh';
        let towers = [];
        let enemies = [];
        let projectiles = [];
        let isWaveActive = false;
        let lastSpawnTime = 0;
        let lastFrameTime = performance.now();
        let running = true;
        let waveStatusTimeout = null;

        const towerTypes = {
            pooh: { cost: 20, damage: 10, range: 100, fireRate: 900, color: '#FFB347', key: 'pooh' },
            tigger: { cost: 30, damage: 14, range: 90, fireRate: 650, color: '#FF8C42', key: 'tigger' },
            rabbit: { cost: 40, damage: 18, range: 130, fireRate: 1300, color: '#C1E1C1', key: 'owl' },
            piglet: { cost: 25, damage: 9, range: 95, fireRate: 550, color: '#FFB6C1', key: 'piglet' },
            eeyore: { cost: 35, damage: 24, range: 115, fireRate: 1900, color: '#C0C0C0', key: 'eeyore' }
        };

        const enemyTypes = {
            heffalump: { health: 55, speed: 0.75, color: '#8A2BE2', points: 10, char: '🐘' },
            woozle: { health: 32, speed: 1.4, color: '#FF4500', points: 15, char: '🐺' },
            bee: { health: 18, speed: 2.1, color: '#FFD700', points: 5, char: '🐝' }
        };

        const path = [
            { x: 0, y: 220 },
            { x: 160, y: 220 },
            { x: 160, y: 120 },
            { x: 320, y: 120 },
            { x: 320, y: 320 },
            { x: 520, y: 320 }
        ];

        function setDefenseAlert(msg) {
            if (defenseAlert) defenseAlert.textContent = msg;
        }

        function updateTowerAffordability() {
            towerOptions.forEach((opt) => {
                const towerKey = opt.getAttribute('data-tower');
                const spec = towerKey ? towerTypes[towerKey] : null;
                if (!spec) return;
                if (honey < spec.cost) {
                    opt.classList.add('unaffordable');
                } else {
                    opt.classList.remove('unaffordable');
                }
            });
        }

        function showWaveStatus(msg, duration = 1400) {
            if (!waveStatus) return;
            waveStatus.textContent = msg;
            waveStatus.classList.add('active');
            if (waveStatusTimeout) clearTimeout(waveStatusTimeout);
            waveStatusTimeout = setTimeout(() => waveStatus.classList.remove('active'), duration);
        }

        function flashDamage() {
            setDefenseAlert('A honey jar spilled! Keep the path protected.');
            showWaveStatus('Ouch! -1 life', 1200);
            shakeElement(defenseCard);
        }

        function syncStats() {
            if (honeySpan) honeySpan.textContent = honey;
            if (livesSpan) livesSpan.textContent = lives;
            if (waveSpan) waveSpan.textContent = wave;
            updateTowerAffordability();
        }

        syncStats();
        setDefenseAlert('The honey path is peaceful. Prepare your friends.');
        showWaveStatus('Wave 1 ready', 1300);

        function drawBackground() {
            // Sky
            ctx.fillStyle = '#B3E5FC';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Clouds
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath();
            ctx.arc(90, 60, 28, 0, Math.PI * 2);
            ctx.arc(120, 50, 32, 0, Math.PI * 2);
            ctx.arc(150, 60, 28, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(380, 80, 24, 0, Math.PI * 2);
            ctx.arc(410, 70, 30, 0, Math.PI * 2);
            ctx.arc(440, 80, 24, 0, Math.PI * 2);
            ctx.fill();

            // Ground
            ctx.fillStyle = '#8BC34A';
            ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

            // Trees
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(40, 120, 20, 90);
            ctx.fillRect(360, 210, 22, 100);

            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.arc(50, 105, 40, 0, Math.PI * 2);
            ctx.arc(371, 190, 42, 0, Math.PI * 2);
            ctx.fill();

            // Path
            ctx.strokeStyle = '#D2B48C';
            ctx.lineWidth = 40;
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
            ctx.stroke();

            ctx.strokeStyle = '#8B6B3F';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
            ctx.stroke();

            // Honey pot at the end
            const end = path[path.length - 1];
            const potX = end.x;
            const potY = end.y;

            if (Sprites.honey && Sprites.honey.complete && Sprites.honey.naturalWidth) {
                ctx.drawImage(Sprites.honey, potX - 20, potY - 25, 40, 40);
            } else {
                ctx.fillStyle = '#FFD54F';
                ctx.beginPath();
                ctx.arc(potX, potY, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        }

        function drawTowers() {
            towers.forEach((t) => {
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.shadowBlur = 8;

                const spriteKey = towerTypes[t.type].key;
                const sprite = Sprites[spriteKey];

                if (sprite && sprite.complete && sprite.naturalWidth) {
                    ctx.drawImage(sprite, t.x - 20, t.y - 20, 40, 40);
                } else {
                    ctx.fillStyle = towerTypes[t.type].color;
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();

                // Level label
                ctx.fillStyle = '#4E342E';
                ctx.font = '11px Arial';
                ctx.fillText(`Lv.${t.level}`, t.x - 12, t.y - 22);

                // Show range when selected
                if (t.selected) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
        }

        function drawEnemies() {
            enemies.forEach((e) => {
                ctx.save();
                ctx.fillStyle = e.color;
                ctx.beginPath();
                ctx.arc(e.x, e.y, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(e.x, e.y, 14, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = '#000';
                ctx.font = '16px Arial';
                ctx.fillText(e.char, e.x - 10, e.y + 5);

                // Health bar
                ctx.fillStyle = '#B71C1C';
                ctx.fillRect(e.x - 16, e.y - 24, 32, 4);
                ctx.fillStyle = '#43A047';
                ctx.fillRect(e.x - 16, e.y - 24, 32 * (e.health / e.maxHealth), 4);
            });
        }

        function drawProjectiles() {
            projectiles.forEach((p) => {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        function update(delta) {
            if (!running) return;

            // Move enemies along path
            enemies.forEach((enemy, idx) => {
                const target = path[enemy.pathIndex];
                const dx = target.x - enemy.x;
                const dy = target.y - enemy.y;
                const dist = Math.hypot(dx, dy);

                if (dist < 1) {
                    enemy.pathIndex++;
                    if (enemy.pathIndex >= path.length) {
                        // Reached honey pot
                        lives--;
                        syncStats();
                        flashDamage();
                        enemies.splice(idx, 1);
                        return;
                    }
                } else {
                    const step = enemy.speed * (delta / 16);
                    enemy.x += (dx / dist) * step;
                    enemy.y += (dy / dist) * step;
                }
            });

            // Tower targeting
            towers.forEach((t) => {
                if (t.cooldown > 0) {
                    t.cooldown -= delta;
                    return;
                }
                let best = null;
                let bestDist = t.range;
                enemies.forEach((e) => {
                    const dx = e.x - t.x;
                    const dy = e.y - t.y;
                    const d = Math.hypot(dx, dy);
                    if (d < bestDist) {
                        bestDist = d;
                        best = e;
                    }
                });
                if (best) {
                    projectiles.push({
                        x: t.x,
                        y: t.y,
                        target: best,
                        damage: t.damage,
                        color: towerTypes[t.type].color,
                        speed: 5
                    });
                    t.cooldown = t.fireRate;
                }
            });

            // Projectiles
            projectiles.forEach((p, idx) => {
                if (!p.target || p.target.health <= 0) {
                    projectiles.splice(idx, 1);
                    return;
                }
                const dx = p.target.x - p.x;
                const dy = p.target.y - p.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 9) {
                    p.target.health -= p.damage;
                    if (p.target.health <= 0) {
                        honey += p.target.points;
                        syncStats();
                        setDefenseAlert(`Great teamwork! +${p.target.points} honey collected.`);
                        enemies.splice(enemies.indexOf(p.target), 1);
                    }
                    projectiles.splice(idx, 1);
                } else {
                    p.x += (dx / dist) * p.speed;
                    p.y += (dy / dist) * p.speed;
                }
            });

            // Spawn enemies during wave
            if (isWaveActive) {
                const now = performance.now();
                const maxEnemies = 5 + wave * 2;
                if (now - lastSpawnTime > 900 && enemies.length < maxEnemies) {
                    lastSpawnTime = now;
                    const keys = Object.keys(enemyTypes);
                    const typeKey = keys[Math.floor(Math.random() * keys.length)];
                    const spec = enemyTypes[typeKey];

                    enemies.push({
                        x: path[0].x,
                        y: path[0].y,
                        pathIndex: 1,
                        health: spec.health,
                        maxHealth: spec.health,
                        speed: spec.speed,
                        color: spec.color,
                        points: spec.points,
                        char: spec.char
                    });
                }

                if (enemies.length === 0 && now - lastSpawnTime > 2600) {
                    // Wave finished
                    isWaveActive = false;
                    wave++;
                    honey += 35;
                    syncStats();
                    setDefenseAlert('Wave cleared! Extra honey for the team.');
                    showWaveStatus(`Wave ${wave - 1} cleared!`, 1600);
                }
            }

            // Game over
            if (lives <= 0 && running) {
                running = false;
                setDefenseAlert('Oh bother! The honey pots are empty. Tap start to try again.');
                showWaveStatus('Game over', 1800);
                shakeElement(defenseCard);
                setTimeout(() => {
                    alert('Oh bother! The honey is gone. Game over.');
                    reset();
                }, 20);
            }
        }

        function render() {
            drawBackground();
            drawTowers();
            drawEnemies();
            drawProjectiles();
        }

        function loop(timestamp) {
            const delta = timestamp - lastFrameTime;
            lastFrameTime = timestamp;
            update(delta);
            render();
            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);

        function reset() {
            honey = 100;
            lives = 10;
            wave = 1;
            towers = [];
            enemies = [];
            projectiles = [];
            isWaveActive = false;
            running = true;
            syncStats();
            setDefenseAlert('The honey path is peaceful. Prepare your friends.');
            showWaveStatus('Wave 1 ready', 1300);
        }

        // Place tower
        canvas.addEventListener('click', (ev) => {
            if (!towerTypes[selectedTower]) return;
            const rect = canvas.getBoundingClientRect();
            const x = ev.clientX - rect.left;
            const y = ev.clientY - rect.top;

            // Rough path collision avoidance
            let nearPath = false;
            for (let i = 0; i < path.length - 1; i++) {
                const p1 = path[i];
                const p2 = path[i + 1];
                // distance from point to segment
                const A = x - p1.x;
                const B = y - p1.y;
                const C = p2.x - p1.x;
                const D = p2.y - p1.y;
                const dot = A * C + B * D;
                const lenSq = C * C + D * D;
                const t = Math.max(0, Math.min(1, lenSq ? dot / lenSq : 0));
                const projX = p1.x + C * t;
                const projY = p1.y + D * t;
                const dist = Math.hypot(x - projX, y - projY);
                if (dist < 35) {
                    nearPath = true;
                    break;
                }
            }
            if (nearPath) return;

            const spec = towerTypes[selectedTower];
            if (honey < spec.cost) {
                showWaveStatus('Not enough honey for that friend.', 1100);
                shakeElement(defenseCard);
                return;
            }

            honey -= spec.cost;
            syncStats();
            towers.push({
                x,
                y,
                type: selectedTower,
                damage: spec.damage,
                range: spec.range,
                fireRate: spec.fireRate,
                level: 1,
                cooldown: 0,
                selected: false
            });
        });

        // Tower selection UI
        towerOptions.forEach((opt) => {
            opt.addEventListener('click', () => {
                towerOptions.forEach((o) => o.classList.remove('selected'));
                opt.classList.add('selected');
                selectedTower = opt.getAttribute('data-tower') || 'pooh';
            });
        });

        // Start wave
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (isWaveActive) return;
                isWaveActive = true;
                lastSpawnTime = performance.now();
                showWaveStatus(`Wave ${wave} is beginning...`);
                setDefenseAlert('Your friends are on the move. Keep an eye on the path!');
            });
        }

        // Upgrade towers
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                if (honey < 50 || towers.length === 0) return;
                honey -= 50;
                towers.forEach((t) => {
                    t.level += 1;
                    t.damage += 5;
                    t.range += 8;
                });
                syncStats();
                setDefenseAlert('Your friends feel braver with a little extra honey.');
                showWaveStatus('Towers upgraded!', 1200);
            });
        }
    }

    // ========================================================================
    // GAME 2: HONEY POT CATCH
    // ========================================================================

    function initHoneyCatchGame() {
        const canvas = document.getElementById('honey-game');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const scoreSpan = document.getElementById('score-count');
        const timeSpan = document.getElementById('time-count');
        const livesSpan = document.getElementById('catch-lives');
        const startBtn = document.getElementById('start-catch');
        const pauseBtn = document.getElementById('pause-catch');
        const catchOverlay = document.getElementById('catch-overlay');
        const catchCountdown = document.getElementById('catch-countdown');
        const catchHint = document.getElementById('catch-hint');
        const catchCard = document.getElementById('catch-card');

        let score = 0;
        let timeLeft = 60;
        let lives = 3;
        let honeyPots = [];
        let bees = [];
        let gameRunning = false;
        let timerInterval = null;
        let lastFrameTime = performance.now();
        let poohX = canvas.width / 2;
        let countdownInterval = null;
        let overlayTimeout = null;

        function setCatchOverlay(line, sub, persistent = false, duration = 1600) {
            if (!catchOverlay || !catchCountdown || !catchHint) return;
            catchCountdown.textContent = line;
            catchHint.textContent = sub || '';
            catchOverlay.classList.add('active');
            if (overlayTimeout) clearTimeout(overlayTimeout);
            if (!persistent) {
                overlayTimeout = setTimeout(() => catchOverlay.classList.remove('active'), duration);
            }
        }

        function syncStats() {
            if (scoreSpan) scoreSpan.textContent = score;
            if (timeSpan) timeSpan.textContent = timeLeft;
            if (livesSpan) livesSpan.textContent = lives;
        }

        syncStats();
        setCatchOverlay('Ready when you are.', 'Press start to begin a calm 60 second run.', true);

        function drawBackground() {
            ctx.fillStyle = '#B3E5FC';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath();
            ctx.arc(110, 80, 26, 0, Math.PI * 2);
            ctx.arc(140, 72, 30, 0, Math.PI * 2);
            ctx.arc(170, 82, 26, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(370, 60, 24, 0, Math.PI * 2);
            ctx.arc(400, 50, 30, 0, Math.PI * 2);
            ctx.arc(430, 60, 24, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#8BC34A';
            ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

            ctx.fillStyle = '#7CB342';
            for (let x = 0; x < canvas.width; x += 10) {
                const h = 8 + Math.random() * 10;
                ctx.fillRect(x, canvas.height - 60, 3, -h);
            }

            // Trees
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(90, 160, 26, 160);
            ctx.fillRect(410, 190, 26, 130);

            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.arc(103, 140, 50, 0, Math.PI * 2);
            ctx.arc(423, 165, 45, 0, Math.PI * 2);
            ctx.fill();
        }

        function drawPooh() {
            const baseY = canvas.height - 80;
            const sprite = Sprites.pooh;

            if (sprite && sprite.complete && sprite.naturalWidth) {
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.35)';
                ctx.shadowBlur = 10;
                ctx.drawImage(sprite, poohX - 30, baseY - 60, 60, 60);
                ctx.restore();
                return;
            }

            // Fallback simple Pooh
            ctx.fillStyle = '#FFB347';
            ctx.beginPath();
            ctx.arc(poohX, baseY, 28, 0, Math.PI * 2);
            ctx.fill();
        }

        function drawHoneyPots() {
            honeyPots.forEach((p) => {
                const sprite = Sprites.honey;
                if (sprite && sprite.complete && sprite.naturalWidth) {
                    ctx.drawImage(sprite, p.x - 14, p.y - 14, 28, 28);
                } else {
                    ctx.fillStyle = '#FFD54F';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#8B4513';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });
        }

        function drawBees() {
            bees.forEach((b) => {
                ctx.save();
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(b.x, b.y, 9, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#000';
                ctx.fillRect(b.x - 9, b.y - 3, 5, 6);
                ctx.fillRect(b.x - 1, b.y - 3, 5, 6);

                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.beginPath();
                ctx.arc(b.x - 5, b.y - 11, 7, 0, Math.PI * 2);
                ctx.arc(b.x + 5, b.y - 11, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }

        function update(delta) {
            if (!gameRunning) return;

            // Pots
            honeyPots.forEach((p, idx) => {
                p.y += p.speed * (delta / 16);

                // Caught?
                if (
                    p.y > canvas.height - 90 &&
                    p.x > poohX - 40 &&
                    p.x < poohX + 40
                ) {
                    score += 10;
                    honeyPots.splice(idx, 1);
                    syncStats();
                    if (score % 50 === 0) {
                        setCatchOverlay('Sweet catching!', `You hit ${score} points. Keep it up!`, false, 1200);
                    }
                }

            // Off screen
                if (p.y > canvas.height + 20) honeyPots.splice(idx, 1);
            });

            // Bees
            bees.forEach((b, idx) => {
                b.y += b.speed * (delta / 16);

                if (
                    b.y > canvas.height - 90 &&
                    b.x > poohX - 40 &&
                    b.x < poohX + 40
                ) {
                    lives -= 1;
                    bees.splice(idx, 1);
                    syncStats();
                    setCatchOverlay('Ouch! A bee buzzed Pooh.', `Hearts remaining: ${lives}.`, false, 1400);
                    shakeElement(catchCard);
                    if (lives <= 0) {
                        endGame(false);
                    }
                }

                if (b.y > canvas.height + 20) bees.splice(idx, 1);
            });

            // Spawns
            if (Math.random() < 0.05) {
                honeyPots.push({
                    x: Math.random() * (canvas.width - 40) + 20,
                    y: -10,
                    speed: 2 + Math.random() * 1.5
                });
            }

            if (Math.random() < 0.02) {
                bees.push({
                    x: Math.random() * (canvas.width - 40) + 20,
                    y: -10,
                    speed: 3 + Math.random() * 1.5
                });
            }
        }

        function render() {
            drawBackground();
            drawPooh();
            drawHoneyPots();
            drawBees();

            // HUD overlay
            ctx.fillStyle = '#4E342E';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(`Score: ${score}`, 18, 26);
            ctx.fillText(`Time: ${timeLeft}s`, canvas.width - 130, 26);
            ctx.fillText(`Lives: ${lives}`, canvas.width / 2 - 40, 26);
        }

        function loop(timestamp) {
            const delta = timestamp - lastFrameTime;
            lastFrameTime = timestamp;
            update(delta);
            render();
            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);

        function startGame() {
            if (gameRunning || countdownInterval) return;
            score = 0;
            lives = 3;
            timeLeft = 60;
            honeyPots = [];
            bees = [];
            poohX = canvas.width / 2;
            syncStats();

            let count = 3;
            setCatchOverlay('Starting in 3...', 'Get Pooh ready to move.', true);
            countdownInterval = setInterval(() => {
                count--;
                if (count > 0) {
                    setCatchOverlay(`Starting in ${count}...`, 'Catch honey, dodge bees.', true);
                } else {
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                    setCatchOverlay('Go!', 'Keep Pooh under the falling honey.', false, 900);
                    gameRunning = true;

                    clearInterval(timerInterval);
                    timerInterval = setInterval(() => {
                        timeLeft--;
                        syncStats();
                        if (timeLeft <= 0) {
                            endGame(true);
                        }
                    }, 1000);
                }
            }, 800);
        }

        function endGame(timeExpired) {
            if (!gameRunning) return;
            gameRunning = false;
            clearInterval(timerInterval);
            timerInterval = null;
            setCatchOverlay(
                timeExpired ? "Time's up!" : 'Ouch! The bees won this round.',
                'Press start to give Pooh another try.',
                true
            );
            shakeElement(catchCard);

            setTimeout(() => {
                if (timeExpired) {
                    alert(`Time's up! You collected ${score} honey points!`);
                } else {
                    alert(`Oh bother! The bees won this time. Final score: ${score}`);
                }
            }, 20);
        }

        function togglePause() {
            if (!gameRunning && timeLeft > 0 && lives > 0) {
                // resume
                gameRunning = true;
                if (!timerInterval) {
                    timerInterval = setInterval(() => {
                        timeLeft--;
                        syncStats();
                        if (timeLeft <= 0) {
                            endGame(true);
                        }
                    }, 1000);
                }
                if (catchOverlay) catchOverlay.classList.remove('active');
            } else if (gameRunning) {
                gameRunning = false;
                clearInterval(timerInterval);
                timerInterval = null;
                setCatchOverlay('Paused', 'Tap start or pause to continue when ready.', true);
            }
        }

        if (startBtn) startBtn.addEventListener('click', startGame);
        if (pauseBtn) pauseBtn.addEventListener('click', togglePause);

        // Keyboard controls
        document.addEventListener('keydown', (ev) => {
            if (!gameRunning) return;
            const step = 20;
            if (ev.key === 'ArrowLeft') {
                poohX = Math.max(40, poohX - step);
            } else if (ev.key === 'ArrowRight') {
                poohX = Math.min(canvas.width - 40, poohX + step);
            }
        });
    }

    // ========================================================================
    // BOOTSTRAP
    // ========================================================================

    document.addEventListener('DOMContentLoaded', () => {
        loadSprites();
        injectExtraKeyframes();
        initBaseUI();
        initDefenseGame();
        initHoneyCatchGame();
    });
})();