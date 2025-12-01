// script.js – Hundred Acre Celebration full wiring (UI + games, refined)

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
            towerOptions: document.querySelectorAll('.tower-option')
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
                    'Catch falling honey pots to earn points.',
                    'Missing a pot costs you one heart.',
                    'You start with 3 hearts – keep them as long as you can.',
                    'Press Start Game (or Space/Enter) to begin a calm 60-second round.'
                ]
            },
            defense: {
                title: 'Honey Hive Defense – How to Play',
                items: [
                    'Press Start Wave to begin.',
                    'Select a friend (tower) from the row above the game.',
                    'Click near the honey path to place your friend.',
                    'Friends gently shoo bees that come within their range.',
                    'Use honey to place and upgrade towers; try to keep your lives above zero.'
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
            this.honeyGame = new HoneyCatchGame(this.el.honeyCanvas, {
                scoreEl: this.el.catchScore,
                timeEl: this.el.catchTime,
                livesEl: this.el.catchLives,
                startBtn: this.el.catchStartBtn,
                pauseBtn: this.el.catchPauseBtn,
                overlayEl: this.el.catchOverlay,
                countdownEl: this.el.catchCountdown,
                hintEl: this.el.catchHint,
                mobileLeftBtn: this.el.mobileLeftBtn,
                mobileRightBtn: this.el.mobileRightBtn
            });
        }

        if (this.el.defenseCanvas) {
            this.defenseGame = new HoneyDefenseGame(this.el.defenseCanvas, {
                honeyEl: this.el.defenseHoney,
                livesEl: this.el.defenseLives,
                waveEl: this.el.defenseWave,
                alertEl: this.el.defenseAlert,
                waveStatusEl: this.el.defenseWaveStatus,
                startBtn: this.el.defenseStartBtn,
                upgradeBtn: this.el.defenseUpgradeBtn,
                towerOptions: this.el.towerOptions
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

/* ========= HONEY CATCH GAME ========= */

class HoneyCatchGame {
    constructor(canvas, dom) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dom = dom || {};

        this.width = canvas.clientWidth || 320;
        this.height = canvas.clientHeight || 220;

        this.player = null;
        this.pots = [];
        this.score = 0;
        this.lives = 3;
        this.totalTime = 60;
        this.remaining = this.totalTime;

        this.lastSpawn = 0;
        this.spawnInterval = 900;
        this.lastTime = 0;

        this.isRunning = false;
        this.isPaused = false;
        this.gameOver = false;
        this.pointerActive = false;
        this.keyState = {};

        this.init();
    }

    init() {
        this.handleResize();
        this.resetGame();
        this.initControls();
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
            this.dom.mobileLeftBtn.addEventListener('click', () => this.nudge(-1));
        }
        if (this.dom.mobileRightBtn) {
            this.dom.mobileRightBtn.addEventListener('click', () => this.nudge(1));
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
            // canvas tap alone does NOT restart; use Start button
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
            speed: Math.max(this.width * 0.4, 160)
        };
        this.pots = [];
        this.score = 0;
        this.lives = 3;
        this.remaining = this.totalTime;
        this.lastSpawn = 0;
        this.spawnInterval = 900;
        this.gameOver = false;
    }

    startNewGame() {
        this.resetGame();
        this.isRunning = true;
        this.isPaused = false;
        this.updateOverlay('Game started!', 'Catch as many pots as you can.');
        if (this.dom.pauseBtn) this.dom.pauseBtn.textContent = 'Pause';
        this.updateUI();
    }

    togglePause() {
        if (!this.isRunning || this.gameOver) return;
        this.isPaused = !this.isPaused;
        if (this.dom.pauseBtn) {
            this.dom.pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
        }
        this.updateOverlay(
            this.isPaused ? 'Paused' : '',
            this.isPaused ? 'Tap Resume or press Space/Enter to continue.' : ''
        );
    }

    nudge(dir) {
        if (!this.player) return;
        const step = this.width * 0.08;
        this.player.x += dir * step;
        this.player.x = Math.max(0, Math.min(this.width - this.player.width, this.player.x));
    }

    spawnPot() {
        const size = Math.max(this.width * 0.05, 20);
        const x = Math.random() * (this.width - size);
        const speed = Math.max(this.height * 0.18, 120) + Math.random() * 60;
        this.pots.push({ x, y: -size, width: size, height: size, speed });
    }

    update(dt) {
        if (!this.isRunning || this.isPaused || this.gameOver) return;

        this.remaining -= dt;
        if (this.remaining <= 0) {
            this.remaining = 0;
            this.endGame('Time’s up!', 'Press Start Game for another gentle round.');
        }

        const left = this.keyState['ArrowLeft'] || this.keyState['a'] || this.keyState['A'];
        const right = this.keyState['ArrowRight'] || this.keyState['d'] || this.keyState['D'];
        if (left) this.player.x -= this.player.speed * dt;
        if (right) this.player.x += this.player.speed * dt;
        this.player.x = Math.max(0, Math.min(this.width - this.player.width, this.player.x));

        this.lastSpawn += dt * 1000;
        if (this.lastSpawn > this.spawnInterval) {
            this.spawnPot();
            this.lastSpawn = 0;
            this.spawnInterval = Math.max(350, this.spawnInterval - 5);
        }

        for (let i = this.pots.length - 1; i >= 0; i--) {
            const p = this.pots[i];
            p.y += p.speed * dt;

            if (this.intersects(p, this.player)) {
                this.score += 10;
                this.pots.splice(i, 1);
                continue;
            }

            if (p.y > this.height) {
                this.lives -= 1;
                this.pots.splice(i, 1);
                if (this.lives <= 0) {
                    this.endGame('Pooh ran out of honey pots!', 'Press Start Game to try again.');
                }
            }
        }

        this.updateUI();
    }

    endGame(title, hint) {
        this.gameOver = true;
        this.isRunning = false;
        this.isPaused = false;
        if (this.dom.pauseBtn) this.dom.pauseBtn.textContent = 'Pause';
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
        ctx.fillStyle = '#FFF7EC';
        ctx.fillRect(0, 0, this.width, this.height);

        const skyH = this.height * 0.55;
        const grad = ctx.createLinearGradient(0, 0, 0, skyH);
        grad.addColorStop(0, '#B0D0E3');
        grad.addColorStop(1, '#FFF7EC');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, skyH, skyH);
        ctx.fillRect(0, 0, this.width, skyH);

        ctx.fillStyle = '#D7C39B';
        ctx.fillRect(0, skyH, this.width, this.height - skyH);

        ctx.fillStyle = '#8B5A2B';
        ctx.fillRect(this.width * 0.05, skyH - 60, 24, 80);
        ctx.beginPath();
        ctx.arc(this.width * 0.05 + 12, skyH - 70, 36, 0, Math.PI * 2);
        ctx.fillStyle = '#9CAD90';
        ctx.fill();
    }

    drawPlayer() {
        const ctx = this.ctx;
        const p = this.player;
        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2);

        ctx.fillStyle = '#FFC42B';
        ctx.beginPath();
        ctx.ellipse(0, 8, p.width * 0.4, p.height * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

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

        ctx.restore();
    }

    drawPots() {
        const ctx = this.ctx;
        this.pots.forEach(p => {
            ctx.save();
            ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
            ctx.fillStyle = '#E6B86A';
            ctx.beginPath();
            ctx.ellipse(0, 0, p.width * 0.45, p.height * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-p.width * 0.3, -p.height * 0.4, p.width * 0.6, p.height * 0.16);
            ctx.fillStyle = '#FFF7EC';
            ctx.font = `${Math.max(10, p.width * 0.35)}px "Patrick Hand", system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('HUNNY', 0, p.height * 0.1);
            ctx.restore();
        });
    }

    drawHUD() {
        const ctx = this.ctx;
        ctx.fillStyle = '#2f1a0e';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.font = `${Math.max(14, this.width * 0.04)}px "Lato", system-ui`;
        ctx.fillText(`Score: ${this.score}`, 10, 8);
        ctx.textAlign = 'right';
        ctx.fillText(`Lives: ${this.lives}`, this.width - 10, 8);
    }

    updateUI() {
        if (this.dom.scoreEl) this.dom.scoreEl.textContent = this.score;
        if (this.dom.livesEl) this.dom.livesEl.textContent = this.lives;
        if (this.dom.timeEl) {
            this.dom.timeEl.textContent = Math.max(0, Math.ceil(this.remaining));
        }
    }

    updateOverlay(title, hint) {
        if (!this.dom.overlayEl) return;
        this.dom.overlayEl.style.opacity = (title || hint) ? '1' : '0';
        if (this.dom.countdownEl) this.dom.countdownEl.textContent = title || '';
        if (this.dom.hintEl) this.dom.hintEl.textContent = hint || '';
    }

    loop(timestamp) {
        const t = timestamp || 0;
        const dt = this.lastTime ? (t - this.lastTime) / 1000 : 0;
        this.lastTime = t;

        this.update(dt);

        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawBackground();
        this.drawPlayer();
        this.drawPots();
        this.drawHUD();

        requestAnimationFrame((time) => this.loop(time));
    }
}

/* ========= HONEY DEFENSE GAME ========= */

class HoneyDefenseGame {
    constructor(canvas, dom) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dom = dom || {};

        this.width = canvas.clientWidth || 320;
        this.height = canvas.clientHeight || 220;

        this.path = [];
        this.bees = [];
        this.towers = [];

        this.honey = 100;
        this.lives = 10;
        this.wave = 1;

        this.totalSpawned = 0;
        this.spawnInterval = 1400;
        this.lastSpawn = 0;
        this.lastTime = 0;

        this.isRunning = false;
        this.gameOver = false;

        this.selectedTowerType = 'pooh';
        this.towerDefs = {
            pooh: { cost: 20, rangeFactor: 0.28, rate: 0.7 },
            tigger: { cost: 30, rangeFactor: 0.26, rate: 0.45 },
            rabbit: { cost: 40, rangeFactor: 0.32, rate: 0.65 },
            piglet: { cost: 25, rangeFactor: 0.24, rate: 0.5 },
            eeyore: { cost: 35, rangeFactor: 0.30, rate: 0.9 }
        };

        this.init();
    }

    init() {
        this.handleResize();
        this.createPath();
        this.resetGame();
        this.initControls();
        requestAnimationFrame((t) => this.loop(t));
        this.updateHUD();
        this.setAlert('The honey path is peaceful. Press Start Wave when ready.');
    }

    initControls() {
        const { startBtn, upgradeBtn, towerOptions } = this.dom;

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startGame();
            });
        }

        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => this.upgradeTowers());
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
                    });
                });
            });
        }

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (!this.isRunning) {
                this.setAlert('Press Start Wave first, then place friends along the path.');
                return;
            }
            if (this.gameOver) {
                this.setAlert('Wave finished. Press Start Wave to play again.');
                return;
            }

            this.tryPlaceTower(x, y);
        });

        window.addEventListener('keydown', (e) => {
            if ((e.key === ' ' || e.key === 'Enter') && !this.isTextInput(e.target)) {
                e.preventDefault();
                if (!this.isRunning || this.gameOver) {
                    this.startGame();
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
        const pad = this.width * 0.06;
        this.path = [
            { x: pad, y: midY },
            { x: this.width * 0.25, y: midY - this.height * 0.18 },
            { x: this.width * 0.5, y: midY },
            { x: this.width * 0.75, y: midY + this.height * 0.16 },
            { x: this.width - pad, y: midY }
        ];
    }

    resetGame() {
        this.bees = [];
        this.towers = [];
        this.honey = 100;
        this.lives = 10;
        this.wave = 1;
        this.totalSpawned = 0;
        this.spawnInterval = 1400;
        this.lastSpawn = 0;
        this.lastTime = 0;
        this.gameOver = false;
        this.isRunning = false;
        this.updateHUD();
        this.updateWaveStatus(`Wave ${this.wave} ready`);
    }

    startGame() {
        this.resetGame();
        this.isRunning = true;
        this.setAlert('A gentle wave of bees is on the way.');
        this.updateWaveStatus(`Wave ${this.wave} in progress`);
    }

    upgradeTowers() {
        const cost = 50;
        if (this.honey < cost || this.towers.length === 0) {
            this.setAlert('You need at least one friend and 50🍯 to upgrade.');
            return;
        }
        this.honey -= cost;
        this.towers.forEach(t => {
            t.range *= 1.2;
            t.fireRate *= 0.85;
        });
        this.setAlert('Your friends feel a little braver now.');
        this.updateHUD();
    }

    spawnBee() {
        this.bees.push({
            t: 0,
            speed: 0.16 + Math.random() * 0.05,
            reward: 6
        });
        this.totalSpawned += 1;

        if (this.totalSpawned % 10 === 0) {
            this.wave += 1;
            this.spawnInterval = Math.max(750, this.spawnInterval - 80);
            this.setAlert(`Wave ${this.wave} is waking up.`);
            this.updateWaveStatus(`Wave ${this.wave} in progress`);
        }
    }

    tryPlaceTower(x, y) {
        const nearest = this.getNearestPointOnPath(x, y);
        if (!nearest || nearest.dist > this.height * 0.3) {
            this.setAlert('Friends prefer to stand near the honey path.');
            return;
        }

        const def = this.towerDefs[this.selectedTowerType];
        if (!def) return;

        if (this.honey < def.cost) {
            this.setAlert('Not quite enough honey for that friend yet.');
            return;
        }

        this.honey -= def.cost;
        this.towers.push({
            x: nearest.x,
            y: nearest.y,
            range: Math.min(this.width, this.height) * def.rangeFactor,
            fireCooldown: 0,
            fireRate: def.rate
        });

        this.setAlert('A friend has taken their place along the path.');
        this.updateHUD();
    }

    getNearestPointOnPath(x, y) {
        let best = null;
        const samples = 80;
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
        if (!this.isRunning || this.gameOver) return;

        this.lastSpawn += dt * 1000;
        if (this.lastSpawn > this.spawnInterval) {
            this.spawnBee();
            this.lastSpawn = 0;
        }

        for (let i = this.bees.length - 1; i >= 0; i--) {
            const bee = this.bees[i];
            bee.t += bee.speed * dt;
            if (bee.t >= 1) {
                this.bees.splice(i, 1);
                this.lives -= 1;
                this.setAlert('A few bees reached the meadow. That happens.');
                if (this.lives <= 0) {
                    this.endGame();
                }
            }
        }

        this.towers.forEach(t => {
            t.fireCooldown -= dt;
            if (t.fireCooldown <= 0) {
                let bestIdx = -1;
                let bestDist = Infinity;
                this.bees.forEach((bee, idx) => {
                    const pos = this.getPointOnPath(bee.t);
                    const dx = pos.x - t.x;
                    const dy = pos.y - t.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < t.range && dist < bestDist) {
                        bestDist = dist;
                        bestIdx = idx;
                    }
                });

                if (bestIdx !== -1) {
                    const bee = this.bees[bestIdx];
                    this.honey += bee.reward;
                    this.bees.splice(bestIdx, 1);
                    t.fireCooldown = t.fireRate;
                } else {
                    t.fireCooldown = t.fireRate * 0.5;
                }
            }
        });

        this.updateHUD();
    }

    endGame() {
        this.gameOver = true;
        this.isRunning = false;
        this.setAlert('The bees reached the meadow – but the honey will be safe again soon.');
        this.updateWaveStatus('Press Start Wave (or Space/Enter) to start a new round.');
    }

    updateHUD() {
        if (this.dom.honeyEl) this.dom.honeyEl.textContent = this.honey;
        if (this.dom.livesEl) this.dom.livesEl.textContent = this.lives;
        if (this.dom.waveEl) this.dom.waveEl.textContent = this.wave;
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
        ctx.fillStyle = '#FFF7EC';
        ctx.fillRect(0, 0, this.width, this.height);

        const grad = ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#B0D0E3');
        grad.addColorStop(0.55, '#FFF7EC');
        grad.addColorStop(1, '#C1D7A7');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.strokeStyle = '#E6B86A';
        ctx.lineWidth = Math.max(14, this.height * 0.08);
        ctx.lineCap = 'round';
        ctx.beginPath();
        this.path.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        ctx.strokeStyle = 'rgba(139, 69, 19, 0.45)';
        ctx.lineWidth = Math.max(4, this.height * 0.022);
        ctx.beginPath();
        this.path.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
    }

    drawTowers() {
        const ctx = this.ctx;
        this.towers.forEach(t => {
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(176, 208, 227, 0.16)';
            ctx.fill();

            ctx.fillStyle = '#9CAD90';
            ctx.beginPath();
            ctx.ellipse(t.x, t.y, 14, 18, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(t.x - 16, t.y - 10);
            ctx.lineTo(t.x, t.y - 26);
            ctx.lineTo(t.x + 16, t.y - 10);
            ctx.closePath();
            ctx.fillStyle = '#D62E2E';
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(t.x, t.y - 26);
            ctx.lineTo(t.x, t.y - 36);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#2f1a0e';
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(t.x, t.y - 36);
            ctx.lineTo(t.x + 10, t.y - 32);
            ctx.lineTo(t.x, t.y - 28);
            ctx.closePath();
            ctx.fillStyle = '#FFC42B';
            ctx.fill();
        });
    }

    drawBees() {
        const ctx = this.ctx;
        this.bees.forEach(bee => {
            const pos = this.getPointOnPath(bee.t);
            const size = Math.max(8, this.width * 0.015);
            ctx.save();
            ctx.translate(pos.x, pos.y);

            ctx.fillStyle = '#FFC42B';
            ctx.beginPath();
            ctx.ellipse(0, 0, size * 1.2, size * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2f1a0e';
            ctx.fillRect(-size * 0.7, -size * 0.7, size * 0.3, size * 1.4);
            ctx.fillRect(-size * 0.15, -size * 0.8, size * 0.3, size * 1.6);

            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.beginPath();
            ctx.ellipse(-size * 0.3, -size * 0.9, size * 0.6, size * 0.9, -0.3, 0, Math.PI * 2);
            ctx.ellipse(size * 0.3, -size * 0.9, size * 0.6, size * 0.9, 0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    drawHUD() {
        const ctx = this.ctx;
        ctx.fillStyle = '#2f1a0e';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.font = `${Math.max(14, this.width * 0.04)}px "Lato", system-ui`;
        ctx.fillText(`Honey: ${this.honey}`, 10, 8);
        ctx.textAlign = 'right';
        ctx.fillText(`Lives: ${this.lives}`, this.width - 10, 8);
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
        this.drawHUD();

        requestAnimationFrame((time) => this.loop(time));
    }
}

/* ========= BOOTSTRAP ========= */

document.addEventListener('DOMContentLoaded', () => {
    new HundredAcreApp();
});
