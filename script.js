// script.js – Hundred Acre Celebration (Enhanced Games Edition)

/* ========= PAGE APP ========= */

class HundredAcreApp {
    constructor() {
        this.honeyGame = null;
        this.defenseGame = null;
        this.init();
    }

    init() {
        this.cacheElements();
        this.setupCoreUI();
        this.setupObservers();
        this.initPreferences();
        this.initRSVP();
        this.initGames();
        this.bindGlobals();
        this.startLoading();

        setTimeout(() => {
            this.updateReadingProgress();
            this.updateFABs();
            this.updatePersistentRSVP();
        }, 400);
    }

    cacheElements() {
        this.el = {
            body: document.body,
            loadingScreen: document.getElementById('loadingScreen'),
            readingProgress: document.getElementById('readingProgress'),
            mainContent: document.getElementById('mainContent'),
            storybookCover: document.getElementById('storybookCover'),
            openBookBtn: document.getElementById('openBookBtn'),

            navToggle: document.getElementById('navToggle'),
            navMenu: document.getElementById('navMenu'),
            navItems: document.querySelectorAll('.nav-item'),

            persistentRsvpBtn: document.getElementById('persistentRsvpBtn'),
            scrollTopFab: document.getElementById('scrollTopFab'),
            scrollRsvpFab: document.getElementById('scrollRsvpFab'),

            musicToggle: document.getElementById('musicToggle'),
            motionToggle: document.getElementById('motionToggle'),
            bgMusic: document.getElementById('bgMusic'),

            rsvpSection: document.getElementById('section2'),
            rsvpForm: document.getElementById('rsvpForm'),
            rsvpStatus: document.getElementById('rsvpStatus'),
            rsvpCount: document.getElementById('rsvpCount'),
            rsvpAnchor: document.getElementById('rsvp'),

            sections: [
                document.getElementById('section1'),
                document.getElementById('section2'),
                document.getElementById('section6'),
                document.getElementById('section3'),
                document.getElementById('section5'),
                document.getElementById('games')
            ],

            characterModal: document.getElementById('characterModal'),
            characterModalIcon: document.getElementById('modalCharacterIcon'),
            characterModalTitle: document.getElementById('characterModalTitle'),
            characterModalQuote: document.getElementById('modalCharacterQuote'),
            characterModalBio: document.getElementById('modalCharacterBio'),
            characterModalClose: document.getElementById('closeCharacterModal'),

            gameInstructionModal: document.getElementById('gameInstructionModal'),
            gameInstructionTitle: document.getElementById('gameInstructionTitle'),
            gameInstructionList: document.getElementById('gameInstructionList'),
            gameInstructionClose: document.getElementById('closeGameModal'),

            honeyCanvas: document.getElementById('honey-game'),
            defenseCanvas: document.getElementById('defense-game'),

            catchScore: document.getElementById('score-count'),
            catchTime: document.getElementById('time-count'),
            catchLives: document.getElementById('catch-lives'),
            catchStartBtn: document.getElementById('start-catch'),
            catchPauseBtn: document.getElementById('pause-catch'),
            catchOverlay: document.getElementById('catch-overlay'),
            catchCountdown: document.getElementById('catch-countdown'),
            catchHint: document.getElementById('catch-hint'),
            catchHighScore: document.getElementById('high-score'),

            mobileControls: document.getElementById('mobileControls'),
            mobileLeftBtn: document.getElementById('mobileLeftBtn'),
            mobileRightBtn: document.getElementById('mobileRightBtn'),

            defenseHoney: document.getElementById('honey-count'),
            defenseLives: document.getElementById('lives-count'),
            defenseWave: document.getElementById('wave-count'),
            defenseAlert: document.getElementById('defense-alert'),
            defenseWaveStatus: document.getElementById('defense-wave-status'),
            defenseStartBtn: document.getElementById('start-defense'),
            defenseUpgradeBtn: document.getElementById('upgrade-tower'),
            towerOptions: document.querySelectorAll('.tower-option'),
            defenseHighScore: document.getElementById('defense-high-score')
        };

        this.sectionById = {};
        this.el.sections.forEach(sec => {
            if (sec && sec.id) this.sectionById[sec.id] = sec;
        });
    }

    setupCoreUI() {
        const {
            openBookBtn,
            storybookCover,
            mainContent,
            navToggle,
            navMenu,
            navItems,
            scrollTopFab,
            scrollRsvpFab,
            persistentRsvpBtn,
            musicToggle,
            motionToggle,
            rsvpAnchor
        } = this.el;

        if (openBookBtn && storybookCover && mainContent) {
            openBookBtn.addEventListener('click', () => {
                storybookCover.classList.add('closed');
                storybookCover.setAttribute('aria-hidden', 'true');
                storybookCover.style.display = 'none';
                mainContent.classList.remove('hidden');
                mainContent.style.display = 'block';

                setTimeout(() => {
                    mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    mainContent.focus({ preventScroll: true });
                }, 200);
            });
        }

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                const isOpen = navMenu.classList.toggle('nav-menu--open');
                navToggle.setAttribute('aria-expanded', String(isOpen));
                navMenu.setAttribute('aria-hidden', String(!isOpen));
                document.body.classList.toggle('nav-open', isOpen);
            });
        }

        if (navItems) {
            navItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const hash = item.getAttribute('href');
                    if (!hash) return;
                    const id = hash.replace('#', '');
                    const section = this.sectionById[id];
                    if (section) {
                        this.scrollToSection(section);
                        this.setActiveNavItem(item);
                    }
                    if (this.el.navMenu && this.el.navMenu.classList.contains('nav-menu--open')) {
                        this.closeNavMenu();
                    }
                });
            });
        }

        scrollTopFab && scrollTopFab.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        scrollRsvpFab && scrollRsvpFab.addEventListener('click', () => {
            if (rsvpAnchor) rsvpAnchor.scrollIntoView({ behavior: 'smooth' });
        });

        persistentRsvpBtn && persistentRsvpBtn.addEventListener('click', () => {
            if (rsvpAnchor) rsvpAnchor.scrollIntoView({ behavior: 'smooth' });
        });

        musicToggle && musicToggle.addEventListener('click', () => this.toggleMusic());
        motionToggle && motionToggle.addEventListener('click', () => this.toggleMotion());

        const onScroll = this.throttle(() => {
            this.updateReadingProgress();
            this.updateFABs();
            this.updatePersistentRSVP();
        }, 120);

        window.addEventListener('scroll', onScroll);
        window.addEventListener('resize', () => {
            this.updateReadingProgress();
            this.honeyGame && this.honeyGame.handleResize();
            this.defenseGame && this.defenseGame.handleResize();
        });

        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            if (this.el.mobileControls) this.el.mobileControls.style.display = 'block';
        }

        if (this.el.rsvpForm) {
            this.el.rsvpForm.addEventListener('submit', (e) => this.handleRSVPSubmit(e));
        }
    }

    closeNavMenu() {
        if (!this.el.navMenu || !this.el.navToggle) return;
        this.el.navMenu.classList.remove('nav-menu--open');
        this.el.navMenu.setAttribute('aria-hidden', 'true');
        this.el.navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
    }

    setActiveNavItem(activeItem) {
        if (!this.el.navItems) return;
        this.el.navItems.forEach(item => {
            item.classList.toggle('active', item === activeItem);
        });
    }

    scrollToSection(section) {
        const offset = 80;
        const rect = section.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetY = rect.top + scrollTop - offset;

        window.scrollTo({ top: targetY, behavior: 'smooth' });
    }

    setupObservers() {
        const options = { threshold: 0.25 };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const sec = entry.target;
                if (entry.isIntersecting) {
                    sec.classList.add('section-visible');
                    if (sec.id && this.el.navItems) {
                        this.el.navItems.forEach(item => {
                            const href = item.getAttribute('href');
                            const id = href ? href.replace('#', '') : '';
                            item.classList.toggle('active', id === sec.id);
                        });
                    }
                }
            });
        }, options);

        this.el.sections.forEach(sec => sec && observer.observe(sec));
    }

    updateReadingProgress() {
        const bar = this.el.readingProgress;
        if (!bar) return;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = `${pct}%`;
        bar.setAttribute('aria-valuenow', String(Math.round(pct)));
    }

    updateFABs() {
        const { scrollTopFab, scrollRsvpFab, rsvpAnchor } = this.el;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTopFab) {
            scrollTopFab.classList.toggle('fab--visible', scrollY > 400);
        }

        if (!scrollRsvpFab || !rsvpAnchor) return;

        const rect = rsvpAnchor.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;

        if (inView) {
            scrollRsvpFab.classList.remove('fab--visible');
        } else {
            scrollRsvpFab.classList.toggle('fab--visible', scrollY > 600);
        }
    }

    updatePersistentRSVP() {
        const btn = this.el.persistentRsvpBtn;
        const sec = this.el.rsvpSection;
        if (!btn || !sec) return;
        const rect = sec.getBoundingClientRect();
        const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
        if (inViewport) btn.classList.add('hidden');
        else btn.classList.remove('hidden');
    }

    throttle(fn, limit) {
        let inThrottle = false;
        let lastFn;
        let lastTime;
        return (...args) => {
            const context = this;
            if (!inThrottle) {
                fn.apply(context, args);
                lastTime = Date.now();
                inThrottle = true;
            } else {
                clearTimeout(lastFn);
                lastFn = setTimeout(() => {
                    if (Date.now() - lastTime >= limit) {
                        fn.apply(context, args);
                        lastTime = Date.now();
                    }
                }, Math.max(limit - (Date.now() - lastTime), 0));
            }
        };
    }

    /* ------- Loading ------- */

    startLoading() {
        const ls = this.el.loadingScreen;
        if (!ls) return;
        setTimeout(() => {
            ls.classList.add('hidden');
            ls.style.display = 'none';
        }, 1800);
    }

    /* ------- Music & Motion ------- */

    initPreferences() {
        try {
            const musicPref = localStorage.getItem('hundredAcreMusic');
            const motionPref = localStorage.getItem('hundredAcreMotion');

            if (musicPref === 'on') this.setMusic(true);
            else if (musicPref === 'off') this.setMusic(false);

            if (motionPref === 'reduced') {
                document.body.classList.add('reduce-motion');
                this.setMotion(false);
            }
        } catch (e) {
            console.warn('Pref init failed', e);
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' && !this.isTextInput(e.target)) {
                e.preventDefault();
                this.toggleMusic();
            }
        });
    }

    isTextInput(el) {
        if (!el || !el.tagName) return false;
        const tag = el.tagName.toLowerCase();
        return tag === 'input' || tag === 'textarea' || el.isContentEditable;
    }

    toggleMusic() {
        const bg = this.el.bgMusic;
        if (!bg) return;
        const isPlaying = !bg.paused;
        this.setMusic(!isPlaying);
    }

    setMusic(on) {
        const { bgMusic, musicToggle } = this.el;
        if (!bgMusic || !musicToggle) return;

        if (on) {
            bgMusic.play().catch(() => {});
            musicToggle.classList.add('toggle--active');
            musicToggle.setAttribute('aria-pressed', 'true');
            localStorage.setItem('hundredAcreMusic', 'on');
        } else {
            bgMusic.pause();
            musicToggle.classList.remove('toggle--active');
            musicToggle.setAttribute('aria-pressed', 'false');
            localStorage.setItem('hundredAcreMusic', 'off');
        }
    }

    toggleMotion() {
        const reduced = document.body.classList.toggle('reduce-motion');
        this.setMotion(!reduced);
    }

    setMotion(on) {
        const { motionToggle } = this.el;
        if (!motionToggle) return;

        if (on) {
            motionToggle.classList.remove('toggle--active');
            motionToggle.setAttribute('aria-pressed', 'false');
            const lbl = motionToggle.querySelector('.sr-only');
            if (lbl) lbl.textContent = 'Reduce motion';
            localStorage.setItem('hundredAcreMotion', 'full');
        } else {
            motionToggle.classList.add('toggle--active');
            motionToggle.setAttribute('aria-pressed', 'true');
            const lbl = motionToggle.querySelector('.sr-only');
            if (lbl) lbl.textContent = 'Motion reduced';
            localStorage.setItem('hundredAcreMotion', 'reduced');
        }
    }

    /* ------- RSVP ------- */

    initRSVP() {
        try {
            const stored = localStorage.getItem('babyGunnerRSVP');
            if (stored) {
                const data = JSON.parse(stored);
                if (data && data.totalGuests && this.el.rsvpCount) {
                    this.el.rsvpCount.textContent = data.totalGuests;
                }
            }
        } catch (e) {
            console.warn('Could not load RSVP', e);
        }
    }

    handleRSVPSubmit(e) {
        e.preventDefault();
        const form = this.el.rsvpForm;
        const status = this.el.rsvpStatus;
        const countEl = this.el.rsvpCount;
        if (!form || !status || !countEl) return;

        const name = form.guestName.value.trim();
        const guests = parseInt(form.guestCount.value, 10);
        const note = form.guestNote.value.trim();

        if (name.length < 2 || !guests || guests < 1 || guests > 5) {
            status.textContent = 'Please fill in your name and select 1–5 guests.';
            status.className = 'form-status form-status--error';
            return;
        }

        let totalGuests = guests;
        try {
            const stored = localStorage.getItem('babyGunnerRSVP');
            if (stored) {
                const data = JSON.parse(stored);
                if (data && typeof data.totalGuests === 'number') {
                    totalGuests = data.totalGuests + guests;
                }
            }
            localStorage.setItem('babyGunnerRSVP', JSON.stringify({
                lastName: name,
                lastGuests: guests,
                lastNote: note,
                totalGuests
            }));
        } catch (err) {
            console.warn('RSVP save error', err);
        }

        countEl.textContent = totalGuests;
        status.textContent = 'Thank you for your RSVP! Your spot in the Hundred Acre Wood is saved.';
        status.className = 'form-status form-status--success';

        form.reset();
    }

    editRSVP() {
        localStorage.removeItem('babyGunnerRSVP');
        if (this.el.rsvpCount) this.el.rsvpCount.textContent = '0';
        if (this.el.rsvpStatus) {
            this.el.rsvpStatus.textContent = 'You can submit a new RSVP anytime.';
            this.el.rsvpStatus.className = 'form-status form-status--info';
        }
    }

    /* ------- Character Modal ------- */

    openCharacterModal(character) {
        const {
            characterModal,
            characterModalIcon,
            characterModalTitle,
            characterModalQuote,
            characterModalBio
        } = this.el;

        if (!characterModal) return;

        const characters = {
            pooh: {
                name: 'Winnie the Pooh',
                icon: '🐻',
                quote: '“Sometimes the smallest things take up the most room in your heart.”',
                bio: 'Pooh is in charge of honey jars, hugs, and quiet snuggles. He is quite certain Baby Gunner will need all three in generous amounts.'
            },
            piglet: {
                name: 'Piglet',
                icon: '🐷',
                quote: '“It is hard to be brave, when you’re only a Very Small Animal — but I’ll do it for Baby Gunner.”',
                bio: 'Piglet carefully arranged the soft blankets and tiny clothes, making sure everything feels cozy, safe, and just right for someone very small.'
            },
            tigger: {
                name: 'Tigger',
                icon: '🐯',
                quote: '“The wonderful thing about babies is that babies are wonderful things!”',
                bio: 'Tigger is in charge of games, giggles, and every moment that calls for a bounce. He is especially excited to see Baby Gunner smile.'
            },
            eeyore: {
                name: 'Eeyore',
                icon: '🐴',
                quote: '“Not much of a tail, but it’s my tail. And this is our baby, and that’s rather special.”',
                bio: 'Eeyore quietly found the best spot for photos and still moments. He’s making sure there is always a comfortable place to simply be together.'
            }
        };

        const data = characters[character] || characters.pooh;

        if (characterModalIcon) characterModalIcon.textContent = data.icon;
        if (characterModalTitle) characterModalTitle.textContent = data.name;
        if (characterModalQuote) characterModalQuote.textContent = data.quote;
        if (characterModalBio) characterModalBio.textContent = data.bio;

        characterModal.style.display = 'flex';
        characterModal.setAttribute('aria-hidden', 'false');

        if (this.el.characterModalClose) {
            this.el.characterModalClose.onclick = () => this.closeCharacterModal();
        }
        characterModal.onclick = (e) => {
            if (e.target === characterModal) this.closeCharacterModal();
        };
    }

    closeCharacterModal() {
        const { characterModal } = this.el;
        if (!characterModal) return;
        characterModal.style.display = 'none';
        characterModal.setAttribute('aria-hidden', 'true');
    }

    /* ------- Game Instruction Modal ------- */

    openGameInstructions(type) {
        const {
            gameInstructionModal,
            gameInstructionTitle,
            gameInstructionList
        } = this.el;

        if (!gameInstructionModal || !gameInstructionTitle || !gameInstructionList) return;

        const content = {
            catch: {
                title: 'Honey Pot Catch – How to Play',
                items: [
                    'Use ◀ ▶ arrow keys OR tap left/right side of the game area to move Pooh.',
                    'Catch falling honey pots to earn points (10 points each).',
                    'Golden honey pots give 50 points and extra time!',
                    'Avoid the bouncing rocks - they cost you a heart.',
                    'Missing a pot costs you one heart.',
                    'You start with 3 hearts – keep them as long as you can.',
                    'Press Start Game (or Space/Enter) to begin a 60-second round.'
                ]
            },
            defense: {
                title: 'Honey Hive Defense – How to Play',
                items: [
                    'Press Start Wave to begin.',
                    'Select a friend (tower) from the row above the game.',
                    'Click near the honey path to place your friend.',
                    'Each friend has unique abilities and costs.',
                    'Friends automatically gently shoo bees within their range.',
                    'Earn honey by stopping bees - use it to place and upgrade towers.',
                    'Upgraded towers have better range and speed.',
                    'Try to survive as many waves as possible!'
                ]
            }
        };

        const data = content[type] || content.catch;

        gameInstructionTitle.textContent = data.title;
        gameInstructionList.innerHTML = '';
        data.items.forEach(text => {
            const li = document.createElement('li');
            const icon = document.createElement('i');
            icon.className = 'fas fa-star';
            const span = document.createElement('span');
            span.textContent = text;
            li.appendChild(icon);
            li.appendChild(span);
            gameInstructionList.appendChild(li);
        });

        gameInstructionModal.style.display = 'flex';
        gameInstructionModal.setAttribute('aria-hidden', 'false');

        if (this.el.gameInstructionClose) {
            this.el.gameInstructionClose.onclick = () => this.closeGameInstructions();
        }
        gameInstructionModal.onclick = (e) => {
            if (e.target === gameInstructionModal) this.closeGameInstructions();
        };
    }

    closeGameInstructions() {
        const m = this.el.gameInstructionModal;
        if (!m) return;
        m.style.display = 'none';
        m.setAttribute('aria-hidden', 'true');
    }

    /* ------- Woodland Sound ------- */

    playWoodlandSound(event) {
        if (event) {
            event.preventDefault();
            const sign = event.target.closest('.woodland-sign');
            if (sign) {
                sign.style.transform = 'scale(1.05) rotate(-1deg)';
                setTimeout(() => (sign.style.transform = ''), 230);
            }
        }

        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'triangle';
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.linearRampToValueAtTime(659.25, now + 0.12);
            osc.frequency.linearRampToValueAtTime(783.99, now + 0.25);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

            osc.start(now);
            osc.stop(now + 0.7);
        } catch (err) {
            console.log('Web Audio not available.');
        }
    }

    /* ------- Games ------- */

    initGames() {
        if (this.el.honeyCanvas) {
            this.honeyGame = new EnhancedHoneyCatchGame(this.el.honeyCanvas, {
                scoreEl: this.el.catchScore,
                timeEl: this.el.catchTime,
                livesEl: this.el.catchLives,
                startBtn: this.el.catchStartBtn,
                pauseBtn: this.el.catchPauseBtn,
                overlayEl: this.el.catchOverlay,
                countdownEl: this.el.catchCountdown,
                hintEl: this.el.catchHint,
                mobileLeftBtn: this.el.mobileLeftBtn,
                mobileRightBtn: this.el.mobileRightBtn,
                highScoreEl: this.el.catchHighScore
            });
        }

        if (this.el.defenseCanvas) {
            this.defenseGame = new EnhancedHoneyDefenseGame(this.el.defenseCanvas, {
                honeyEl: this.el.defenseHoney,
                livesEl: this.el.defenseLives,
                waveEl: this.el.defenseWave,
                alertEl: this.el.defenseAlert,
                waveStatusEl: this.el.defenseWaveStatus,
                startBtn: this.el.defenseStartBtn,
                upgradeBtn: this.el.defenseUpgradeBtn,
                towerOptions: this.el.towerOptions,
                highScoreEl: this.el.defenseHighScore
            });
        }
    }

    /* ------- Globals for inline handlers ------- */

    bindGlobals() {
        const self = this;
        window.showCharacterModal = function (character) {
            self.openCharacterModal(character);
        };
        window.showGameInstructions = function (type) {
            self.openGameInstructions(type);
        };
        window.playWoodlandSound = function (event) {
            self.playWoodlandSound(event);
        };
        window.editRSVP = function () {
            self.editRSVP();
        };
    }
}

/* ========= ENHANCED HONEY CATCH GAME ========= */

class EnhancedHoneyCatchGame {
    constructor(canvas, dom) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dom = dom || {};

        this.width = canvas.clientWidth || 320;
        this.height = canvas.clientHeight || 220;

        this.player = null;
        this.pots = [];
        this.rocks = [];
        this.particles = [];
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('honeyCatchHighScore') || '0');
        this.lives = 3;
        this.totalTime = 60;
        this.remaining = this.totalTime;

        this.lastSpawn = 0;
        this.rockSpawn = 0;
        this.spawnInterval = 900;
        this.rockInterval = 2000;
        this.lastTime = 0;

        this.isRunning = false;
        this.isPaused = false;
        this.gameOver = false;
        this.pointerActive = false;
        this.keyState = {};
        this.isCountingDown = false;
        this.countdown = 3;

        this.init();
    }

    init() {
        this.handleResize();
        this.resetGame();
        this.initControls();
        this.updateHighScore();
        this.updateOverlay('Ready when you are.', 'Press Start Game to begin.');
        requestAnimationFrame((t) => this.loop(t));
        this.updateUI();
    }

    initControls() {
        window.addEventListener('keydown', (e) => {
            this.keyState[e.key] = true;

            if ((e.key === ' ' || e.key === 'Enter') && !this.isTextInput(e.target)) {
                e.preventDefault();
                if (!this.isRunning || this.gameOver) {
                    this.startNewGame();
                } else {
                    this.togglePause();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keyState[e.key] = false;
        });

        this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
        this.canvas.addEventListener('pointerup', () => (this.pointerActive = false));
        this.canvas.addEventListener('pointerleave', () => (this.pointerActive = false));

        if (this.dom.startBtn) {
            this.dom.startBtn.addEventListener('click', () => this.startNewGame());
        }
        if (this.dom.pauseBtn) {
            this.dom.pauseBtn.addEventListener('click', () => this.togglePause());
        }

        if (this.dom.mobileLeftBtn) {
            this.dom.mobileLeftBtn.addEventListener('touchstart', () => this.keyState['ArrowLeft'] = true);
            this.dom.mobileLeftBtn.addEventListener('touchend', () => this.keyState['ArrowLeft'] = false);
        }
        if (this.dom.mobileRightBtn) {
            this.dom.mobileRightBtn.addEventListener('touchstart', () => this.keyState['ArrowRight'] = true);
            this.dom.mobileRightBtn.addEventListener('touchend', () => this.keyState['ArrowRight'] = false);
        }
    }

    isTextInput(el) {
        if (!el || !el.tagName) return false;
        const tag = el.tagName.toLowerCase();
        return tag === 'input' || tag === 'textarea' || el.isContentEditable;
    }

    onPointerDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (!this.isRunning || this.gameOver) {
            return;
        }

        this.pointerActive = true;
        this.player.x = x - this.player.width / 2;
    }

    onPointerMove(e) {
        if (!this.pointerActive) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        this.player.x = x - this.player.width / 2;
    }

    handleResize() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = rect.width || 320;
        this.height = rect.height || 220;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        if (this.player) {
            this.player.y = this.height - this.player.height - 8;
        }
    }

    resetGame() {
        const w = Math.max(this.width * 0.12, 40);
        const h = w * 0.7;
        this.player = {
            x: (this.width - w) / 2,
            y: this.height - h - 8,
            width: w,
            height: h,
            speed: Math.max(this.width * 0.4, 160),
            isMoving: false,
            moveOffset: 0
        };
        this.pots = [];
        this.rocks = [];
        this.particles = [];
        this.score = 0;
        this.lives = 3;
        this.remaining = this.totalTime;
        this.lastSpawn = 0;
        this.rockSpawn = 0;
        this.spawnInterval = 900;
        this.rockInterval = 2000;
        this.gameOver = false;
        this.isCountingDown = false;
        this.countdown = 3;
    }

    startNewGame() {
        this.resetGame();
        this.isCountingDown = true;
        this.updateOverlay('Get ready!', 'Starting in...');
        if (this.dom.pauseBtn) this.dom.pauseBtn.textContent = 'Pause';
        this.updateUI();
    }

    togglePause() {
        if (!this.isRunning || this.gameOver || this.isCountingDown) return;
        this.isPaused = !this.isPaused;
        if (this.dom.pauseBtn) {
            this.dom.pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
        }
        this.updateOverlay(
            this.isPaused ? 'Paused' : '',
            this.isPaused ? 'Tap Resume or press Space/Enter to continue.' : ''
        );
    }

    spawnPot() {
        const isGolden = Math.random() < 0.1;
        const size = Math.max(this.width * 0.05, 20) * (isGolden ? 1.3 : 1);
        const x = Math.random() * (this.width - size);
        const speed = Math.max(this.height * 0.18, 120) + Math.random() * 60;
        this.pots.push({ 
            x, 
            y: -size, 
            width: size, 
            height: size, 
            speed,
            isGolden,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.05
        });
    }

    spawnRock() {
        const size = Math.max(this.width * 0.06, 24);
        const x = Math.random() * (this.width - size);
        const speed = Math.max(this.height * 0.2, 130) + Math.random() * 70;
        const bounceForce = Math.random() * 2 - 1;
        this.rocks.push({ 
            x, 
            y: -size, 
            width: size, 
            height: size, 
            speed,
            bounce: bounceForce,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        });
    }

    createParticles(x, y, count, color, isSparkle = false) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: isSparkle ? 3 + Math.random() * 4 : 1 + Math.random() * 2,
                color,
                life: 1,
                decay: 0.02 + Math.random() * 0.03,
                isSparkle
            });
        }
    }

    update(dt) {
        if (this.isCountingDown) {
            this.countdown -= dt;
            if (this.countdown <= 0) {
                this.isCountingDown = false;
                this.isRunning = true;
                this.updateOverlay('Go!', 'Catch as many pots as you can!');
                setTimeout(() => this.updateOverlay('', ''), 1000);
            }
            return;
        }

        if (!this.isRunning || this.isPaused || this.gameOver) return;

        this.remaining -= dt;
        if (this.remaining <= 0) {
            this.remaining = 0;
            this.endGame('Time\u2019s up!', 'Press Start Game for another gentle round.');
        }

        const left = this.keyState['ArrowLeft'] || this.keyState['a'] || this.keyState['A'];
        const right = this.keyState['ArrowRight'] || this.keyState['d'] || this.keyState['D'];
        
        if (left) {
            this.player.x -= this.player.speed * dt;
            this.player.isMoving = true;
        } else if (right) {
            this.player.x += this.player.speed * dt;
            this.player.isMoving = true;
        } else {
            this.player.isMoving = false;
        }
        
        this.player.x = Math.max(0, Math.min(this.width - this.player.width, this.player.x));
        this.player.moveOffset = left ? -3 : right ? 3 : 0;

        this.lastSpawn += dt * 1000;
        this.rockSpawn += dt * 1000;
        
        if (this.lastSpawn > this.spawnInterval) {
            this.spawnPot();
            this.lastSpawn = 0;
            this.spawnInterval = Math.max(350, this.spawnInterval - 5);
        }
        
        if (this.rockSpawn > this.rockInterval) {
            this.spawnRock();
            this.rockSpawn = 0;
            this.rockInterval = Math.max(1500, this.rockInterval - 30);
        }

        for (let i = this.pots.length - 1; i >= 0; i--) {
            const p = this.pots[i];
            p.y += p.speed * dt;
            p.rotation += p.rotationSpeed;

            if (this.intersects(p, this.player)) {
                const points = p.isGolden ? 50 : 10;
                this.score += points;
                if (p.isGolden) this.remaining = Math.min(this.totalTime, this.remaining + 5);
                this.createParticles(p.x + p.width/2, p.y + p.height/2, 
                    p.isGolden ? 15 : 8, 
                    p.isGolden ? '#FFD700' : '#E6B86A',
                    p.isGolden);
                this.pots.splice(i, 1);
                continue;
            }

            if (p.y > this.height) {
                this.createParticles(p.x + p.width/2, this.height, 5, '#8B4513');
                this.pots.splice(i, 1);
            }
        }

        for (let i = this.rocks.length - 1; i >= 0; i--) {
            const r = this.rocks[i];
            r.y += r.speed * dt;
            r.x += r.bounce * dt * 30;
            r.rotation += r.rotationSpeed;
            
            if (r.x < 0 || r.x + r.width > this.width) {
                r.bounce *= -1;
            }

            if (this.intersects(r, this.player)) {
                this.lives -= 1;
                this.createParticles(r.x + r.width/2, r.y + r.height/2, 12, '#666666');
                this.rocks.splice(i, 1);
                if (this.lives <= 0) {
                    this.endGame('Oh bother!', 'Press Start Game to try again.');
                }
                continue;
            }

            if (r.y > this.height) {
                this.rocks.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= p.decay;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        this.updateUI();
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.updateHighScore();
        }
    }

    endGame(title, hint) {
        this.gameOver = true;
        this.isRunning = false;
        this.isPaused = false;
        if (this.dom.pauseBtn) this.dom.pauseBtn.textContent = 'Pause';
        if (this.score > parseInt(localStorage.getItem('honeyCatchHighScore') || '0')) {
            localStorage.setItem('honeyCatchHighScore', this.score.toString());
        }
        this.updateOverlay(title, hint);
    }

    intersects(a, b) {
        return !(
            a.x + a.width < b.x ||
            a.x > b.x + b.width ||
            a.y + a.height < b.y ||
            a.y > b.y + b.height
        );
    }

    drawBackground() {
        const ctx = this.ctx;
        const skyH = this.height * 0.55;
        
        const skyGrad = ctx.createLinearGradient(0, 0, 0, skyH);
        skyGrad.addColorStop(0, '#87CEEB');
        skyGrad.addColorStop(0.5, '#B0D0E3');
        skyGrad.addColorStop(1, '#FFF7EC');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.width, skyH);

        const groundGrad = ctx.createLinearGradient(0, skyH, 0, this.height);
        groundGrad.addColorStop(0, '#D7C39B');
        groundGrad.addColorStop(1, '#B8A179');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, skyH, this.width, this.height - skyH);

        ctx.fillStyle = '#8B5A2B';
        for (let i = 0; i < 3; i++) {
            const x = this.width * (0.1 + i * 0.4);
            ctx.fillRect(x, skyH - 60, 20, 80);
            ctx.beginPath();
            ctx.arc(x + 10, skyH - 70, 40, 0, Math.PI * 2);
            ctx.fillStyle = i % 2 === 0 ? '#9CAD90' : '#7B9C7B';
            ctx.fill();
            ctx.fillStyle = '#8B5A2B';
        }

        for (let i = 0; i < 5; i++) {
            const x = Math.random() * this.width;
            const size = 2 + Math.random() * 3;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.3})`;
            ctx.beginPath();
            ctx.arc(x, Math.random() * skyH * 0.5, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawPlayer() {
        const ctx = this.ctx;
        const p = this.player;
        const offset = this.player.isMoving ? Math.sin(Date.now() * 0.01) * this.player.moveOffset : 0;
        
        ctx.save();
        ctx.translate(p.x + p.width / 2 + offset, p.y + p.height / 2);

        ctx.fillStyle = '#FFC42B';
        ctx.beginPath();
        ctx.ellipse(0, 8, p.width * 0.4, p.height * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;

        ctx.beginPath();
        ctx.ellipse(0, -p.height * 0.25, p.width * 0.23, p.height * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(-p.width * 0.18, -p.height * 0.4, p.width * 0.08, 0, Math.PI * 2);
        ctx.arc(p.width * 0.18, -p.height * 0.4, p.width * 0.08, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#D62E2E';
        ctx.beginPath();
        ctx.ellipse(0, 12, p.width * 0.45, p.height * 0.27, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2f1a0e';
        ctx.beginPath();
        ctx.arc(-p.width * 0.06, -p.height * 0.27, p.width * 0.025, 0, Math.PI * 2);
        ctx.arc(p.width * 0.06, -p.height * 0.27, p.width * 0.025, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.restore();
    }

    drawPots() {
        const ctx = this.ctx;
        this.pots.forEach(p => {
            ctx.save();
            ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
            ctx.rotate(p.rotation);
            
            if (p.isGolden) {
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.width * 0.5);
                gradient.addColorStop(0, '#FFD700');
                gradient.addColorStop(1, '#FFA500');
                ctx.fillStyle = gradient;
                
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 15;
            } else {
                ctx.fillStyle = '#E6B86A';
                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 5;
            }
            
            ctx.shadowOffsetY = 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.width * 0.45, p.height * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.fillStyle = p.isGolden ? '#B8860B' : '#8B4513';
            ctx.fillRect(-p.width * 0.3, -p.height * 0.4, p.width * 0.6, p.height * 0.16);
            
            ctx.fillStyle = p.isGolden ? '#FFF' : '#FFF7EC';
            ctx.font = `${Math.max(10, p.width * 0.35)}px "Patrick Hand", system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.isGolden ? 'GOLD!' : 'HUNNY', 0, p.height * 0.1);
            
            ctx.restore();
        });
    }

    drawRocks() {
        const ctx = this.ctx;
        this.rocks.forEach(r => {
            ctx.save();
            ctx.translate(r.x + r.width / 2, r.y + r.height / 2);
            ctx.rotate(r.rotation);
            
            const gradient = ctx.createRadialGradient(-r.width/4, -r.height/4, 0, 0, 0, r.width/2);
            gradient.addColorStop(0, '#999');
            gradient.addColorStop(1, '#666');
            ctx.fillStyle = gradient;
            
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 3;
            
            ctx.beginPath();
            ctx.ellipse(0, 0, r.width * 0.45, r.height * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.ellipse(-r.width * 0.15, -r.height * 0.15, r.width * 0.1, r.height * 0.1, 0, 0, Math.PI * 2);
            ctx.ellipse(r.width * 0.15, r.height * 0.1, r.width * 0.08, r.height * 0.08, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }

    drawParticles() {
        const ctx = this.ctx;
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            
            if (p.isSparkle) {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI / 2) * i;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(
                        p.x + Math.cos(angle) * p.size,
                        p.y + Math.sin(angle) * p.size
                    );
                }
                ctx.fill();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }

    drawHUD() {
        const ctx = this.ctx;
        ctx.fillStyle = '#2f1a0e';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.font = `bold ${Math.max(14, this.width * 0.04)}px "Lato", system-ui`;
        ctx.fillText(`Score: ${this.score}`, 10, 8);
        
        ctx.textAlign = 'center';
        ctx.fillStyle = '#8B4513';
        for (let i = 0; i < 3; i++) {
            const x = this.width / 2 + (i - 1) * 25;
            const isFull = i < this.lives;
            ctx.beginPath();
            ctx.moveTo(x, 20);
            ctx.bezierCurveTo(x - 12, 20, x - 15, 30, x, 40);
            ctx.bezierCurveTo(x + 15, 30, x + 12, 20, x, 20);
            ctx.fillStyle = isFull ? '#FF6B6B' : '#FFB8B8';
            ctx.fill();
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        ctx.textAlign = 'right';
        ctx.fillStyle = '#2f1a0e';
        ctx.fillText(`Time: ${Math.max(0, Math.ceil(this.remaining))}`, this.width - 10, 8);
    }

    drawCountdown() {
        if (!this.isCountingDown) return;
        
        const ctx = this.ctx;
        const number = Math.ceil(this.countdown);
        if (number <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = 'rgba(255, 247, 236, 0.9)';
        ctx.beginPath();
        ctx.roundRect(this.width/2 - 50, this.height/2 - 50, 100, 100, 20);
        ctx.fill();
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        ctx.fillStyle = '#D62E2E';
        ctx.font = `bold ${Math.min(80, this.width * 0.2)}px "Patrick Hand", system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number.toString(), this.width/2, this.height/2);
        
        ctx.restore();
    }

    updateUI() {
        if (this.dom.scoreEl) this.dom.scoreEl.textContent = this.score;
        if (this.dom.livesEl) this.dom.livesEl.textContent = this.lives;
        if (this.dom.timeEl) {
            this.dom.timeEl.textContent = Math.max(0, Math.ceil(this.remaining));
        }
    }

    updateHighScore() {
        if (this.dom.highScoreEl) {
            this.dom.highScoreEl.textContent = this.highScore;
        }
    }

    updateOverlay(title, hint) {
        if (!this.dom.overlayEl) return;
        this.dom.overlayEl.style.opacity = (title || hint) ? '1' : '0';
        if (this.dom.countdownEl) {
            this.dom.countdownEl.textContent = title || '';
            this.dom.countdownEl.style.color = this.isCountingDown ? '#D62E2E' : '#2f1a0e';
        }
        if (this.dom.hintEl) this.dom.hintEl.textContent = hint || '';
    }

    loop(timestamp) {
        const t = timestamp || 0;
        const dt = this.lastTime ? (t - this.lastTime) / 1000 : 0;
        this.lastTime = t;

        this.update(dt);

        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawBackground();
        this.drawPots();
        this.drawRocks();
        this.drawParticles();
        this.drawPlayer();
        this.drawCountdown();
        this.drawHUD();

        requestAnimationFrame((time) => this.loop(time));
    }
}

/* ========= ENHANCED HONEY DEFENSE GAME ========= */

class EnhancedHoneyDefenseGame {
    constructor(canvas, dom) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dom = dom || {};

        this.width = canvas.clientWidth || 320;
        this.height = canvas.clientHeight || 220;

        this.path = [];
        this.bees = [];
        this.towers = [];
        this.projectiles = [];
        this.particles = [];

        this.honey = 150;
        this.highScore = parseInt(localStorage.getItem('hiveDefenseHighScore') || '0');
        this.lives = 20;
        this.wave = 1;
        this.beesPerWave = 10;

        this.totalSpawned = 0;
        this.spawnInterval = 1400;
        this.lastSpawn = 0;
        this.lastTime = 0;
        this.waveActive = false;
        this.waveCooldown = 3000;
        this.waveTimer = 0;

        this.isRunning = false;
        this.gameOver = false;
        this.showingRange = false;
        this.hoveredTower = null;

        this.selectedTowerType = 'pooh';
        this.towerDefs = {
            pooh: { 
                name: 'Pooh', 
                cost: 30, 
                rangeFactor: 0.28, 
                rate: 0.7, 
                damage: 1,
                color: '#FFC42B',
                upgradeCost: 50
            },
            tigger: { 
                name: 'Tigger', 
                cost: 40, 
                rangeFactor: 0.26, 
                rate: 0.45, 
                damage: 2,
                color: '#FF8C00',
                upgradeCost: 70
            },
            rabbit: { 
                name: 'Rabbit', 
                cost: 50, 
                rangeFactor: 0.32, 
                rate: 0.65, 
                damage: 1,
                color: '#228B22',
                upgradeCost: 80
            },
            piglet: { 
                name: 'Piglet', 
                cost: 35, 
                rangeFactor: 0.24, 
                rate: 0.5, 
                damage: 1,
                color: '#FFB6C1',
                upgradeCost: 60
            },
            eeyore: { 
                name: 'Eeyore', 
                cost: 45, 
                rangeFactor: 0.30, 
                rate: 0.9, 
                damage: 1,
                color: '#778899',
                upgradeCost: 75
            }
        };

        this.init();
    }

    init() {
        this.handleResize();
        this.createPath();
        this.resetGame();
        this.initControls();
        this.updateHighScore();
        requestAnimationFrame((t) => this.loop(t));
        this.updateHUD();
        this.setAlert('The honey path is peaceful. Press Start Wave when ready.');
    }

    initControls() {
        const { startBtn, upgradeBtn, towerOptions } = this.dom;

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startWave();
            });
        }

        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => this.upgradeSelectedTower());
        }

        if (towerOptions && towerOptions.length) {
            towerOptions.forEach(btn => {
                btn.addEventListener('click', () => {
                    const type = btn.getAttribute('data-tower');
                    if (!type || !this.towerDefs[type]) return;
                    this.selectedTowerType = type;
                    towerOptions.forEach(b => {
                        const pressed = b === btn;
                        b.classList.toggle('selected', pressed);
                        b.setAttribute('aria-pressed', String(pressed));
                        const icon = b.querySelector('i');
                        if (icon) {
                            icon.style.color = pressed ? this.towerDefs[type].color : '';
                        }
                    });
                    this.setAlert(`${this.towerDefs[type].name} selected (${this.towerDefs[type].cost}🍯)`);
                });
            });
        }

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.showingRange && this.hoveredTower !== null) {
                this.upgradeTower(this.hoveredTower);
                this.showingRange = false;
                return;
            }

            if (this.gameOver) {
                this.resetGame();
                return;
            }

            if (!this.waveActive) {
                this.setAlert('Press Start Wave first, then place friends along the path.');
                return;
            }

            this.tryPlaceTower(x, y);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.hoveredTower = null;
            this.towers.forEach((tower, index) => {
                const dx = tower.x - x;
                const dy = tower.y - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 25) {
                    this.hoveredTower = index;
                    this.showingRange = true;
                }
            });

            if (this.hoveredTower === null) {
                this.showingRange = false;
            }
        });

        window.addEventListener('keydown', (e) => {
            if ((e.key === ' ' || e.key === 'Enter') && !this.isTextInput(e.target)) {
                e.preventDefault();
                if (!this.waveActive || this.gameOver) {
                    this.startWave();
                }
            }
            if (e.key === 'u' || e.key === 'U') {
                this.upgradeSelectedTower();
            }
            if (e.key >= '1' && e.key <= '5') {
                const types = ['pooh', 'tigger', 'rabbit', 'piglet', 'eeyore'];
                const type = types[parseInt(e.key) - 1];
                if (type && this.towerDefs[type]) {
                    this.selectedTowerType = type;
                    this.setAlert(`${this.towerDefs[type].name} selected (${this.towerDefs[type].cost}🍯)`);
                }
            }
        });
    }

    isTextInput(el) {
        if (!el || !el.tagName) return false;
        const tag = el.tagName.toLowerCase();
        return tag === 'input' || tag === 'textarea' || el.isContentEditable;
    }

    handleResize() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = rect.width || 320;
        this.height = rect.height || 220;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.createPath();
    }

    createPath() {
        const midY = this.height * 0.55;
        const pad = this.width * 0.08;
        this.path = [
            { x: -pad, y: midY },
            { x: this.width * 0.2, y: midY - this.height * 0.18 },
            { x: this.width * 0.4, y: midY + this.height * 0.12 },
            { x: this.width * 0.6, y: midY - this.height * 0.1 },
            { x: this.width * 0.8, y: midY + this.height * 0.15 },
            { x: this.width + pad, y: midY }
        ];
    }

    resetGame() {
        this.bees = [];
        this.towers = [];
        this.projectiles = [];
        this.particles = [];
        this.honey = 150;
        this.lives = 20;
        this.wave = 1;
        this.beesPerWave = 10;
        this.totalSpawned = 0;
        this.spawnInterval = 1400;
        this.lastSpawn = 0;
        this.waveActive = false;
        this.waveTimer = 0;
        this.gameOver = false;
        this.updateHUD();
        this.updateWaveStatus(`Wave ${this.wave} ready`);
        this.setAlert('New game started. Place your friends!');
    }

    startWave() {
        if (this.waveActive || this.gameOver) return;
        this.waveActive = true;
        this.totalSpawned = 0;
        this.setAlert(`Wave ${this.wave} incoming! Defend the honey!`);
        this.updateWaveStatus(`Wave ${this.wave} in progress`);
    }

    upgradeSelectedTower() {
        if (this.hoveredTower === null || this.towers.length === 0) {
            this.setAlert('Hover over a tower to upgrade it.');
            return;
        }
        this.upgradeTower(this.hoveredTower);
    }

    upgradeTower(index) {
        const tower = this.towers[index];
        const def = this.towerDefs[tower.type];
        if (this.honey < def.upgradeCost) {
            this.setAlert(`Need ${def.upgradeCost}🍯 to upgrade ${def.name}`);
            return;
        }
        
        this.honey -= def.upgradeCost;
        tower.level++;
        tower.range *= 1.3;
        tower.fireRate *= 0.8;
        tower.damage += 0.5;
        
        this.createParticles(tower.x, tower.y, 12, def.color, true);
        this.setAlert(`${def.name} upgraded to level ${tower.level}!`);
        this.updateHUD();
    }

    spawnBee() {
        const isBoss = this.totalSpawned === this.beesPerWave - 1 && this.wave % 3 === 0;
        const bee = {
            t: 0,
            speed: (0.16 + Math.random() * 0.05) * (isBoss ? 0.7 : 1),
            health: isBoss ? 5 : 1,
            maxHealth: isBoss ? 5 : 1,
            reward: isBoss ? 25 : 6,
            isBoss: isBoss,
            size: isBoss ? 1.8 : 1
        };
        this.bees.push(bee);
        this.totalSpawned += 1;

        if (this.totalSpawned >= this.beesPerWave) {
            this.waveTimer = this.waveCooldown;
        }
    }

    createProjectile(fromX, fromY, toX, toY, damage, color) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 4;
        
        this.projectiles.push({
            x: fromX,
            y: fromY,
            vx: (dx / dist) * speed,
            vy: (dy / dist) * speed,
            targetX: toX,
            targetY: toY,
            damage: damage,
            color: color,
            life: 100
        });
    }

    createParticles(x, y, count, color, isSpark = false) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = isSpark ? 2 + Math.random() * 3 : 1 + Math.random() * 2;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: isSpark ? 4 : 1 + Math.random() * 2,
                color,
                life: 1,
                decay: 0.02 + Math.random() * 0.03,
                isSpark
            });
        }
    }

    tryPlaceTower(x, y) {
        const nearest = this.getNearestPointOnPath(x, y);
        if (!nearest || nearest.dist > this.height * 0.25) {
            this.setAlert('Friends prefer to stand near the honey path.');
            return;
        }

        const def = this.towerDefs[this.selectedTowerType];
        if (!def) return;

        if (this.honey < def.cost) {
            this.setAlert(`Need ${def.cost}🍯 for ${def.name}. You have ${this.honey}🍯.`);
            return;
        }

        for (const tower of this.towers) {
            const dx = tower.x - nearest.x;
            const dy = tower.y - nearest.y;
            if (Math.sqrt(dx * dx + dy * dy) < 40) {
                this.setAlert('Friends need a little more space between them.');
                return;
            }
        }

        this.honey -= def.cost;
        this.towers.push({
            x: nearest.x,
            y: nearest.y,
            type: this.selectedTowerType,
            range: Math.min(this.width, this.height) * def.rangeFactor,
            fireCooldown: 0,
            fireRate: def.rate,
            damage: def.damage,
            level: 1,
            color: def.color
        });

        this.createParticles(nearest.x, nearest.y, 8, def.color);
        this.setAlert(`${def.name} has taken their place!`);
        this.updateHUD();
    }

    getNearestPointOnPath(x, y) {
        let best = null;
        const samples = 100;
        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            const p = this.getPointOnPath(t);
            const dx = p.x - x;
            const dy = p.y - y;
            const dist = Math.hypot(dx, dy);
            if (!best || dist < best.dist) {
                best = { x: p.x, y: p.y, t, dist };
            }
        }
        return best;
    }

    getPointOnPath(t) {
        const n = this.path.length - 1;
        if (n <= 0) return { x: 0, y: 0 };
        const scaled = t * n;
        const i = Math.min(n - 1, Math.floor(scaled));
        const local = scaled - i;
        const p0 = this.path[i];
        const p1 = this.path[i + 1];
        return {
            x: p0.x + (p1.x - p0.x) * local,
            y: p0.y + (p1.y - p0.y) * local
        };
    }

    update(dt) {
        if (this.gameOver) return;

        if (this.waveActive) {
            this.lastSpawn += dt * 1000;
            if (this.lastSpawn > this.spawnInterval && this.totalSpawned < this.beesPerWave) {
                this.spawnBee();
                this.lastSpawn = 0;
            }

            if (this.totalSpawned >= this.beesPerWave && this.bees.length === 0) {
                this.waveTimer -= dt * 1000;
                if (this.waveTimer <= 0) {
                    this.wave++;
                    this.beesPerWave = Math.floor(10 + this.wave * 1.5);
                    this.waveActive = false;
                    this.honey += Math.floor(50 + this.wave * 5);
                    this.setAlert(`Wave ${this.wave - 1} complete! ${this.honey}🍯 earned!`);
                    this.updateWaveStatus(`Wave ${this.wave} ready`);
                    this.spawnInterval = Math.max(700, this.spawnInterval - 30);
                }
            }
        }

        for (let i = this.bees.length - 1; i >= 0; i--) {
            const bee = this.bees[i];
            bee.t += bee.speed * dt;
            
            if (bee.t >= 1) {
                this.bees.splice(i, 1);
                this.lives -= bee.isBoss ? 3 : 1;
                this.createParticles(
                    this.getPointOnPath(1).x,
                    this.getPointOnPath(1).y,
                    bee.isBoss ? 20 : 8,
                    bee.isBoss ? '#8B0000' : '#666666'
                );
                if (this.lives <= 0) {
                    this.endGame();
                }
                continue;
            }
        }

        this.towers.forEach(tower => {
            tower.fireCooldown -= dt;
            if (tower.fireCooldown <= 0) {
                let bestIdx = -1;
                let bestDist = Infinity;
                this.bees.forEach((bee, idx) => {
                    const pos = this.getPointOnPath(bee.t);
                    const dx = pos.x - tower.x;
                    const dy = pos.y - tower.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < tower.range && dist < bestDist) {
                        bestDist = dist;
                        bestIdx = idx;
                    }
                });

                if (bestIdx !== -1) {
                    const bee = this.bees[bestIdx];
                    const pos = this.getPointOnPath(bee.t);
                    this.createProjectile(tower.x, tower.y, pos.x, pos.y, tower.damage, tower.color);
                    tower.fireCooldown = tower.fireRate;
                }
            }
        });

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            for (let j = this.bees.length - 1; j >= 0; j--) {
                const bee = this.bees[j];
                const pos = this.getPointOnPath(bee.t);
                const dx = pos.x - p.x;
                const dy = pos.y - p.y;
                if (Math.hypot(dx, dy) < 10) {
                    bee.health -= p.damage;
                    this.createParticles(pos.x, pos.y, 4, p.color);
                    
                    if (bee.health <= 0) {
                        this.honey += bee.reward;
                        this.createParticles(pos.x, pos.y, bee.isBoss ? 15 : 8, '#FFD700', bee.isBoss);
                        this.bees.splice(j, 1);
                    }
                    this.projectiles.splice(i, 1);
                    break;
                }
            }

            if (p.life <= 0) {
                this.projectiles.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.life -= p.decay;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        this.updateHUD();
        if (this.wave > this.highScore) {
            this.highScore = this.wave;
            this.updateHighScore();
        }
    }

    endGame() {
        this.gameOver = true;
        this.waveActive = false;
        this.setAlert(`Game over! You reached wave ${this.wave}. Press Start Wave to play again.`);
        this.updateWaveStatus('Game Over');
        if (this.wave > parseInt(localStorage.getItem('hiveDefenseHighScore') || '0')) {
            localStorage.setItem('hiveDefenseHighScore', this.wave.toString());
            this.updateHighScore();
        }
    }

    updateHUD() {
        if (this.dom.honeyEl) this.dom.honeyEl.textContent = this.honey;
        if (this.dom.livesEl) this.dom.livesEl.textContent = this.lives;
        if (this.dom.waveEl) this.dom.waveEl.textContent = this.wave;
    }

    updateHighScore() {
        if (this.dom.highScoreEl) {
            this.dom.highScoreEl.textContent = this.highScore;
        }
    }

    setAlert(text) {
        if (!this.dom.alertEl) return;
        this.dom.alertEl.textContent = text;
    }

    updateWaveStatus(text) {
        if (!this.dom.waveStatusEl) return;
        this.dom.waveStatusEl.textContent = text;
    }

    drawBackground() {
        const ctx = this.ctx;
        
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
        skyGrad.addColorStop(0, '#87CEEB');
        skyGrad.addColorStop(0.6, '#B0D0E3');
        skyGrad.addColorStop(1, '#FFF7EC');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = 'rgba(255, 247, 236, 0.3)';
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height * 0.6;
            const size = 2 + Math.random() * 3;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = '#E6B86A';
        ctx.lineWidth = Math.max(16, this.height * 0.09);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        this.path.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        ctx.strokeStyle = 'rgba(139, 69, 19, 0.4)';
        ctx.lineWidth = Math.max(6, this.height * 0.025);
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        this.path.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        const honeycombPattern = (x, y, size) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const hexX = (j * 1.5) * size;
                    const hexY = (i * Math.sqrt(3) + (j % 2) * Math.sqrt(3)/2) * size;
                    ctx.beginPath();
                    for (let k = 0; k < 6; k++) {
                        const angle = Math.PI / 3 * k;
                        const px = hexX + Math.cos(angle) * size;
                        const py = hexY + Math.sin(angle) * size;
                        if (k === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                }
            }
            ctx.restore();
        };

        honeycombPattern(this.width * 0.3, this.height * 0.4, 8);
        honeycombPattern(this.width * 0.7, this.height * 0.6, 6);
    }

    drawTowers() {
        const ctx = this.ctx;
        this.towers.forEach((tower, index) => {
            if (this.showingRange && this.hoveredTower === index) {
                ctx.beginPath();
                ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(176, 208, 227, 0.25)';
                ctx.fill();
                ctx.strokeStyle = tower.color;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            ctx.save();
            ctx.translate(tower.x, tower.y);

            const def = this.towerDefs[tower.type];
            
            ctx.fillStyle = def.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, 16, 20, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2f1a0e';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(def.name[0], 0, 0);

            if (tower.level > 1) {
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(12, -12, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#2f1a0e';
                ctx.font = 'bold 8px Arial';
                ctx.fillText(tower.level.toString(), 12, -12);
            }

            ctx.restore();
        });
    }

    drawBees() {
        const ctx = this.ctx;
        this.bees.forEach(bee => {
            const pos = this.getPointOnPath(bee.t);
            const size = Math.max(8, this.width * 0.015) * bee.size;
            
            ctx.save();
            ctx.translate(pos.x, pos.y);

            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
            gradient.addColorStop(0, bee.isBoss ? '#FF8C00' : '#FFD700');
            gradient.addColorStop(1, bee.isBoss ? '#FF4500' : '#FFA500');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(0, 0, size * 1.2, size * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2f1a0e';
            ctx.fillRect(-size * 0.7, -size * 0.7, size * 0.3, size * 1.4);
            ctx.fillRect(-size * 0.15, -size * 0.8, size * 0.3, size * 1.6);

            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath();
            ctx.ellipse(-size * 0.3, -size * 0.9, size * 0.6, size * 0.9, -0.3, 0, Math.PI * 2);
            ctx.ellipse(size * 0.3, -size * 0.9, size * 0.6, size * 0.9, 0.3, 0, Math.PI * 2);
            ctx.fill();

            if (bee.isBoss) {
                ctx.fillStyle = '#8B0000';
                ctx.beginPath();
                ctx.arc(0, -size * 1.2, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('👑', 0, -size * 1.2);
            }

            if (bee.isBoss) {
                const healthWidth = size * 2;
                const healthHeight = 4;
                ctx.fillStyle = '#8B0000';
                ctx.fillRect(-healthWidth/2, -size * 1.5, healthWidth, healthHeight);
                ctx.fillStyle = '#32CD32';
                ctx.fillRect(-healthWidth/2, -size * 1.5, healthWidth * (bee.health / bee.maxHealth), healthHeight);
            }

            ctx.restore();
        });
    }

    drawProjectiles() {
        const ctx = this.ctx;
        this.projectiles.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-p.vx * 2, -p.vy * 2);
            ctx.stroke();
            
            ctx.restore();
        });
    }

    drawParticles() {
        const ctx = this.ctx;
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            
            if (p.isSpark) {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI / 2) * i;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(
                        p.x + Math.cos(angle) * p.size,
                        p.y + Math.sin(angle) * p.size
                    );
                }
                ctx.fill();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }

    drawHUD() {
        const ctx = this.ctx;
        ctx.fillStyle = '#2f1a0e';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.font = `bold ${Math.max(14, this.width * 0.04)}px "Lato", system-ui`;
        ctx.fillText(`🍯: ${this.honey}`, 10, 8);
        
        ctx.textAlign = 'center';
        ctx.fillStyle = this.lives > 10 ? '#32CD32' : this.lives > 5 ? '#FFA500' : '#FF4500';
        ctx.fillText(`❤️: ${this.lives}`, this.width / 2, 8);
        
        ctx.textAlign = 'right';
        ctx.fillStyle = '#2f1a0e';
        ctx.fillText(`Wave: ${this.wave}`, this.width - 10, 8);
        
        if (this.waveTimer > 0 && this.totalSpawned >= this.beesPerWave) {
            ctx.fillStyle = '#8B4513';
            ctx.textAlign = 'center';
            ctx.fillText(`Next wave in: ${Math.ceil(this.waveTimer/1000)}`, this.width/2, 25);
        }
    }

    loop(timestamp) {
        const t = timestamp || 0;
        const dt = this.lastTime ? (t - this.lastTime) / 1000 : 0;
        this.lastTime = t;

        this.update(dt);

        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawBackground();
        this.drawTowers();
        this.drawBees();
        this.drawProjectiles();
        this.drawParticles();
        this.drawHUD();

        requestAnimationFrame((time) => this.loop(time));
    }
}

/* ========= BOOTSTRAP ========= */

document.addEventListener('DOMContentLoaded', () => {
    new HundredAcreApp();
});
