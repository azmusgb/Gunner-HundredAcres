// script.js – Hundred Acre Celebration (Enhanced Visuals Edition)

/* ========= PAGE APP ========= */

class HundredAcreApp {
    constructor() {
        this.init();
    }

    init() {
        this.cacheElements();
        this.setupCoreUI();
        this.setupObservers();
        this.updateCurrentYear();
        this.initPreferences();
        this.initRSVP();
        this.initGameControls();
        this.setupFullscreenGames();
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
            readingProgress: document.querySelector('.reading-progress'),
            mainContent: document.getElementById('mainContent'),
            storybookCover: document.getElementById('cover'),
            openBookBtn: document.querySelector('.open-book-btn'),
            currentYear: document.getElementById('currentYear'),

            navToggle: document.querySelector('.nav-toggle'),
            navMenu: document.querySelector('.nav-menu'),
            navItems: document.querySelectorAll('.nav-item'),
            themeToggle: document.querySelector('.theme-toggle'),
            themeIcon: document.querySelector('.theme-toggle i'),

            persistentRsvpBtn: document.querySelector('.persistent-rsvp'),
            scrollTopFab: document.querySelector('.fab[aria-label="Scroll to Top"]'),
            scrollRsvpFab: document.querySelector('.fab[aria-label="Share Celebration"]'),

            musicToggle: document.querySelector('.music-controls .music-btn'),
            motionToggle: document.querySelector('.music-controls .accessibility-btn'),
            bgMusic: document.getElementById('bgMusic'),

            rsvpSection: document.getElementById('rsvp'),
            rsvpForm: document.getElementById('rsvpForm'),
            rsvpStatus: document.querySelector('.form-status'),
            rsvpCount: document.getElementById('rsvp-count'),
            rsvpAnchor: document.getElementById('rsvp'),

            sections: Array.from(document.querySelectorAll('.content-section')),

            characterModal: document.getElementById('characterModal'),
            characterModalIcon: document.querySelector('#characterModal .modal-character-icon i'),
            characterModalTitle: document.querySelector('#characterModal .modal-character-name'),
            characterModalQuote: document.querySelector('#characterModal .modal-character-quote'),
            characterModalBio: document.querySelector('#characterModal .modal-character-bio'),
            characterModalClose: document.querySelector('#characterModal .close-modal'),

            gameInstructionModal: document.getElementById('gameInstructionModal'),
            gameInstructionTitle: document.getElementById('gameInstructionTitle'),
            gameInstructionQuote: document.getElementById('modalCharacterQuote'),
            gameInstructionList: document.getElementById('gameInstructionList'),
            gameInstructionClose: document.getElementById('closeGameModal'),

            gameFullscreen: document.getElementById('gameFullscreen'),
            gameFullscreenBody: document.querySelector('#gameFullscreen .game-fullscreen__body'),
            gameFullscreenTitle: document.querySelector('#gameFullscreen .game-fullscreen__title'),
            gameFullscreenBackdrop: document.querySelector('#gameFullscreen .game-fullscreen__backdrop'),
            gameFullscreenClose: document.querySelector('#gameFullscreen .game-fullscreen__close'),

            honeyCanvas: document.getElementById('honey-game'),

            catchScore: document.getElementById('score-count'),
            catchTime: document.getElementById('time-count'),
            catchLives: document.getElementById('catch-lives'),
            catchStartBtn: document.getElementById('start-catch'),
            catchPauseBtn: document.getElementById('pause-catch'),
            catchOverlay: document.getElementById('catch-overlay'),
            catchCountdown: document.getElementById('catch-countdown'),
            catchHint: document.getElementById('catch-hint'),
            catchStatus: document.getElementById('catch-status'),
            catchHighScore: document.getElementById('catch-high-score'),
            catchHighScoreDisplay: document.getElementById('catch-high-score-display'),

            mobileControls: document.querySelector('.mobile-controls-panel'),
            mobileLeftBtn: document.getElementById('mobileLeftBtn'),
            mobileRightBtn: document.getElementById('mobileRightBtn')
        };

        this.sectionById = {};
        this.el.sections.forEach(sec => {
            if (sec && sec.id) this.sectionById[sec.id] = sec;
        });

        this.focusTrapCleanup = null;

        this.catchState = {
            timeRemaining: 60,
            score: 0,
            highScore: 0,
            running: false,
            timerId: null
        };

        this.fullscreenState = {
            active: false,
            placeholder: null,
            content: null
        };
    }

    initGameControls() {
        const {
            catchStartBtn,
            catchPauseBtn,
            catchOverlay,
            catchCountdown,
            catchHint,
            catchStatus
        } = this.el;

        if (catchStartBtn) {
            catchStartBtn.addEventListener('click', () => this.startCatchGame());
        }

        if (catchPauseBtn) {
            catchPauseBtn.addEventListener('click', () => this.pauseCatchGame());
        }

        if (catchOverlay) {
            // Show the canvas art as soon as the section is visible
            catchOverlay.classList.add('is-hidden');
        }

        if (catchCountdown) catchCountdown.textContent = 'Ready When You Are';
        if (catchHint) catchHint.textContent = 'Press start to catch honey for 60 seconds!';
        if (catchStatus) catchStatus.textContent = 'Ready to Start';
        this.updateCatchUI();
    }

    setupFullscreenGames() {
        this.fullscreenTriggers = document.querySelectorAll('.game-fullscreen-trigger');

        this.fullscreenTriggers.forEach(trigger => {
            trigger.addEventListener('click', () => this.openGameFullscreen(trigger));
        });

        if (this.el.gameFullscreenBackdrop) {
            this.el.gameFullscreenBackdrop.addEventListener('click', () => this.closeGameFullscreen());
        }

        if (this.el.gameFullscreenClose) {
            this.el.gameFullscreenClose.addEventListener('click', () => this.closeGameFullscreen());
        }

        this.el.gameFullscreen?.setAttribute('aria-hidden', 'true');

        document.addEventListener('keydown', (evt) => {
            if (evt.key === 'Escape' && this.fullscreenState.active) {
                this.closeGameFullscreen();
            }
        });
    }

    openGameFullscreen(trigger) {
        const targetId = typeof trigger === 'string' ? trigger : trigger?.dataset?.fullscreenTarget;
        if (!targetId || this.fullscreenState.active) return;

        const target = document.getElementById(targetId);
        if (!target || !this.el.gameFullscreenBody) return;

        this.fullscreenState.placeholder = document.createComment('game-fullscreen-placeholder');
        target.parentNode?.insertBefore(this.fullscreenState.placeholder, target);

        this.el.gameFullscreenBody.appendChild(target);
        this.fullscreenState.content = target;
        this.fullscreenState.active = true;

        const title = trigger?.dataset?.fullscreenTitle || target.dataset?.gameTitle || 'Full Screen Play';
        if (this.el.gameFullscreenTitle) this.el.gameFullscreenTitle.textContent = title;

        document.body.classList.add('game-fullscreen-open');
        this.el.gameFullscreen?.setAttribute('aria-hidden', 'false');

        requestAnimationFrame(() => {
            this.el.gameFullscreen?.classList.add('is-visible');
            window.honeyGame?.handleResize?.();
            this.el.gameFullscreenClose?.focus({ preventScroll: true });
            this.enableFocusTrap(this.el.gameFullscreen);
        });
    }

    closeGameFullscreen() {
        if (!this.fullscreenState.active) return;

        if (this.fullscreenState.placeholder && this.fullscreenState.placeholder.parentNode && this.fullscreenState.content) {
            this.fullscreenState.placeholder.parentNode.insertBefore(this.fullscreenState.content, this.fullscreenState.placeholder);
            this.fullscreenState.placeholder.remove();
        }

        this.fullscreenState = { active: false, placeholder: null, content: null };

        document.body.classList.remove('game-fullscreen-open');
        this.el.gameFullscreen?.classList.remove('is-visible');
        this.el.gameFullscreen?.setAttribute('aria-hidden', 'true');
        this.clearFocusTrap();

        window.honeyGame?.handleResize?.();
    }

    startCatchGame() {
        const { catchOverlay, catchHint, catchCountdown, catchStatus } = this.el;
        if (this.catchState.running) return;

        this.catchState.running = true;
        this.catchState.timeRemaining = 60;
        this.catchState.score = 0;

        if (catchOverlay) catchOverlay.classList.add('is-hidden');
        if (catchHint) catchHint.textContent = 'Catch honey pots and avoid rocks!';
        if (catchCountdown) catchCountdown.textContent = 'Go!';
        if (catchStatus) catchStatus.textContent = 'In Progress';

        this.updateCatchUI();

        this.catchState.timerId = setInterval(() => {
            if (!this.catchState.running) return;
            this.catchState.timeRemaining -= 1;
            if (this.catchState.timeRemaining <= 0) {
                this.finishCatchGame();
            } else {
                this.updateCatchUI();
            }
        }, 1000);
    }

    pauseCatchGame() {
        const { catchOverlay, catchCountdown, catchHint, catchStatus } = this.el;
        if (!this.catchState.running) return;

        this.catchState.running = false;
        if (this.catchState.timerId) clearInterval(this.catchState.timerId);
        this.catchState.timerId = null;

        if (catchOverlay) catchOverlay.classList.remove('is-hidden');
        if (catchCountdown) catchCountdown.textContent = 'Paused';
        if (catchHint) catchHint.textContent = 'Press start to resume your honey hunt.';
        if (catchStatus) catchStatus.textContent = 'Paused';
    }

    finishCatchGame() {
        const { catchOverlay, catchCountdown, catchHint, catchStatus } = this.el;
        this.catchState.running = false;
        if (this.catchState.timerId) clearInterval(this.catchState.timerId);
        this.catchState.timerId = null;

        const newHighScore = Math.max(this.catchState.score, this.catchState.highScore);
        if (newHighScore !== this.catchState.highScore) {
            this.catchState.highScore = newHighScore;
        }
        this.updateCatchUI();

        if (catchOverlay) catchOverlay.classList.remove('is-hidden');
        if (catchCountdown) catchCountdown.textContent = "Time's Up";
        if (catchHint) catchHint.textContent = 'Great job! Press start to try again.';
        if (catchStatus) catchStatus.textContent = 'Finished';
    }

    updateCatchUI() {
        const { catchScore, catchTime, catchHighScore, catchHighScoreDisplay } = this.el;
        if (catchScore) catchScore.textContent = this.catchState.score.toString();
        if (catchTime) catchTime.textContent = `${this.catchState.timeRemaining}s`;

        const highScoreText = `${this.catchState.highScore} points`;
        if (catchHighScore) catchHighScore.textContent = this.catchState.highScore.toString();
        if (catchHighScoreDisplay) catchHighScoreDisplay.textContent = highScoreText;
    }

    setupCoreUI() {
        // Open book button
        if (this.el.openBookBtn) {
            this.el.openBookBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.el.storybookCover.classList.add('hidden');
                this.el.mainContent.classList.remove('hidden');
                
                // Scroll to top of content
                setTimeout(() => {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                    this.el.mainContent.focus();
                }, 100);
                
                // Trigger animation for main content
                setTimeout(() => {
                    const sections = document.querySelectorAll('.content-section');
                    sections.forEach(section => {
                        section.classList.add('scroll-animate');
                    });
                }, 500);
            });
        }

        // Navigation toggle
        if (this.el.navToggle) {
            this.el.navToggle.addEventListener('click', () => {
                const isExpanded = this.el.navToggle.getAttribute('aria-expanded') === 'true';
                const nextState = !isExpanded;
                this.el.navToggle.setAttribute('aria-expanded', nextState);
                this.el.navMenu.classList.toggle('nav-menu--open');
                this.el.navMenu.setAttribute('aria-hidden', !nextState);
                document.body.classList.toggle('nav-open', nextState);

                if (nextState) {
                    this.enableFocusTrap(this.el.navMenu);
                    this.el.mainContent?.setAttribute('aria-hidden', 'true');
                } else {
                    this.clearFocusTrap();
                    this.el.mainContent?.removeAttribute('aria-hidden');
                }
            });
        }

        if (this.el.themeToggle) {
            this.el.themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
                this.setTheme(nextTheme, true);
            });
        }

        // Navigation items
        if (this.el.navItems) {
            this.el.navItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const href = item.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        const targetId = href.substring(1);
                        const targetSection = document.getElementById(targetId);
                        if (targetSection) {
                            this.scrollToSection(targetSection);
                            this.closeNavMenu();
                        }
                    }
                });
            });
        }

        // Persistent RSVP button
        if (this.el.persistentRsvpBtn) {
            this.el.persistentRsvpBtn.addEventListener('click', () => {
                const rsvpSection = document.getElementById('rsvp');
                if (rsvpSection) {
                    this.scrollToSection(rsvpSection);
                }
            });
        }

        // Scroll to top FAB
        if (this.el.scrollTopFab) {
            this.el.scrollTopFab.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }

        // Scroll to RSVP FAB
        if (this.el.scrollRsvpFab) {
            this.el.scrollRsvpFab.addEventListener('click', () => {
                const rsvpSection = document.getElementById('rsvp');
                if (rsvpSection) {
                    this.scrollToSection(rsvpSection);
                }
            });
        }

        // Music toggle
        if (this.el.musicToggle) {
            this.el.musicToggle.addEventListener('click', () => this.toggleMusic());
        }

        // Motion toggle
        if (this.el.motionToggle) {
            this.el.motionToggle.addEventListener('click', () => this.toggleMotion());
        }

        // Close character modal
        if (this.el.characterModalClose) {
            this.el.characterModalClose.addEventListener('click', () => this.closeCharacterModal());
        }

        // Close game modal
        if (this.el.gameInstructionClose) {
            this.el.gameInstructionClose.addEventListener('click', () => this.closeGameInstructions());
        }

        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCharacterModal();
                this.closeGameInstructions();
            }
        });

        // Close modals on background click
        document.addEventListener('click', (e) => {
            if (this.el.characterModal && !this.el.characterModal.contains(e.target) && 
                e.target !== this.el.characterModal && this.el.characterModal.style.display === 'flex') {
                this.closeCharacterModal();
            }
            if (this.el.gameInstructionModal && !this.el.gameInstructionModal.contains(e.target) && 
                e.target !== this.el.gameInstructionModal && this.el.gameInstructionModal.style.display === 'flex') {
                this.closeGameInstructions();
            }
        });

        // Window resize handling
        window.addEventListener('resize', this.throttle(() => {
        }, 250));

        // Scroll events
        window.addEventListener('scroll', this.throttle(() => {
            this.updateReadingProgress();
            this.updateFABs();
            this.updatePersistentRSVP();
        }, 100));
    }

    closeNavMenu() {
        if (!this.el.navMenu || !this.el.navToggle) return;
        this.el.navMenu.classList.remove('nav-menu--open');
        this.el.navMenu.setAttribute('aria-hidden', 'true');
        this.el.navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
        this.clearFocusTrap();
        this.el.mainContent?.removeAttribute('aria-hidden');
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
                    sec.classList.add('section-visible', 'scroll-animate');
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

    toggleMobileControlsPanel() {
        const panel = this.el.mobileControls;
        if (!panel) return;

        panel.classList.toggle('is-collapsed');

        const toggleIcon = panel.querySelector('.toggle-icon');
        if (toggleIcon) {
            toggleIcon.textContent = panel.classList.contains('is-collapsed') ? '▲' : '▼';
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

    enableFocusTrap(container) {
        if (!container) return;
        if (this.focusTrapCleanup) this.focusTrapCleanup();

        const focusable = Array.from(
            container.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
        ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));

        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        const handleKeydown = (e) => {
            if (e.key !== 'Tab') return;
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeydown, true);
        first.focus({ preventScroll: true });

        this.focusTrapCleanup = () => {
            document.removeEventListener('keydown', handleKeydown, true);
            this.focusTrapCleanup = null;
        };
    }

    clearFocusTrap() {
        if (this.focusTrapCleanup) {
            this.focusTrapCleanup();
        }
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

    startLoading() {
        const ls = this.el.loadingScreen;
        if (!ls) return;
        setTimeout(() => {
            ls.classList.add('hidden');
            setTimeout(() => {
                ls.style.display = 'none';
            }, 800);
        }, 1800);
    }

    updateCurrentYear() {
        if (this.el.currentYear) {
            this.el.currentYear.textContent = new Date().getFullYear();
        }
    }

    initPreferences() {
        // Initialize music preference
        const musicPref = localStorage.getItem('hundredAcreMusic');
        if (musicPref === 'on') {
            this.setMusic(true);
        } else if (musicPref === 'off') {
            this.setMusic(false);
        }

        // Initialize motion preference
        const motionPref = localStorage.getItem('hundredAcreMotion');
        if (motionPref === 'reduced') {
            document.body.classList.add('reduce-motion');
            this.setMotion(false);
        } else {
            this.setMotion(true);
        }

        const storedTheme = localStorage.getItem('hundredAcreTheme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
        this.setTheme(initialTheme, false);
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
            bgMusic.volume = 0.3;
            bgMusic.play().catch(e => console.log('Audio play failed:', e));
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

    setTheme(theme, persist = false) {
        const clampedTheme = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', clampedTheme);

        if (persist) {
            localStorage.setItem('hundredAcreTheme', clampedTheme);
        }

        if (this.el.themeToggle) {
            this.el.themeToggle.setAttribute('aria-pressed', clampedTheme === 'dark');
            const label = this.el.themeToggle.querySelector('.sr-only');
            if (label) label.textContent = clampedTheme === 'dark' ? 'Enable light theme' : 'Enable dark theme';
        }

        if (this.el.themeIcon) {
            this.el.themeIcon.classList.toggle('fa-sun', clampedTheme === 'dark');
            this.el.themeIcon.classList.toggle('fa-moon', clampedTheme !== 'dark');
        }
    }

    initRSVP() {
        // Load existing RSVP count
        const rsvpData = localStorage.getItem('babyGunnerRSVP');
        if (rsvpData) {
            try {
                const data = JSON.parse(rsvpData);
                if (this.el.rsvpCount) {
                    this.el.rsvpCount.textContent = data.count || 1;
                }
            } catch (e) {
                console.log('Error parsing RSVP data:', e);
            }
        }

        // Setup form submission
        if (this.el.rsvpForm) {
            this.el.rsvpForm.addEventListener('submit', (e) => this.handleRSVPSubmit(e));
        }
    }

    handleRSVPSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const name = (formData.get('guestName') || '').toString().trim();
        const count = formData.get('partySize');
        const email = (formData.get('guestEmail') || '').toString().trim();
        const attendance = formData.get('attendance');
        const note = (formData.get('guestMessage') || '').toString().trim();

        // Validation
        if (!name || name.length < 2) {
            this.showFormStatus('Please enter your name (minimum 2 characters)', 'error');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            this.showFormStatus('Please enter a valid email address', 'error');
            return;
        }

        const countValue = parseInt(count, 10);
        if (!countValue || countValue < 1 || countValue > 6) {
            this.showFormStatus('Please select 1-6 guests', 'error');
            return;
        }

        if (!attendance) {
            this.showFormStatus('Please let us know if you can attend', 'error');
            return;
        }

        // Simulate successful submission
        this.showFormStatus('Thank you for your RSVP! We look forward to celebrating with you.', 'success');

        // Update count
        const currentCount = parseInt(this.el.rsvpCount.textContent) || 0;
        const newCount = currentCount + countValue;
        this.el.rsvpCount.textContent = newCount;

        // Save to localStorage
        const rsvpData = {
            name: name,
            count: countValue,
            note: note,
            attendance,
            email,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('babyGunnerRSVP', JSON.stringify(rsvpData));

        // Reset form
        form.reset();

        // Show edit option
        setTimeout(() => {
            this.el.rsvpStatus.innerHTML = `
                Thank you for your RSVP! We look forward to celebrating with you.<br>
                <button onclick="editRSVP()" class="edit-rsvp-btn" style="margin-top: 10px; background: transparent; border: none; color: var(--honey-gold); text-decoration: underline; cursor: pointer;">
                    Need to make changes?
                </button>
            `;
        }, 2000);
    }

    showFormStatus(message, type) {
        if (!this.el.rsvpStatus) return;

        this.el.rsvpStatus.textContent = message;
        this.el.rsvpStatus.className = 'form-status';
        this.el.rsvpStatus.style.display = 'block';

        switch(type) {
            case 'success':
                this.el.rsvpStatus.classList.add('form-status--success');
                break;
            case 'error':
                this.el.rsvpStatus.classList.add('form-status--error');
                break;
            case 'info':
                this.el.rsvpStatus.classList.add('form-status--info');
                break;
        }
    }

    editRSVP() {
        localStorage.removeItem('babyGunnerRSVP');
        if (this.el.rsvpCount) this.el.rsvpCount.textContent = '0';
        if (this.el.rsvpStatus) {
            this.el.rsvpStatus.textContent = 'You can submit a new RSVP anytime.';
            this.el.rsvpStatus.className = 'form-status form-status--info';
        }
    }

    openCharacterModal(character) {
        const { characterModal, characterModalIcon, characterModalTitle, 
                characterModalQuote, characterModalBio } = this.el;
        
        if (!characterModal) return;

        const characterData = {
            pooh: {
                icon: `<img src="Images/Characters/honey-bear.png" alt="Winnie the Pooh" style="width: 80px; height: auto;">`,
                name: "Winnie the Pooh",
                quote: "\"Sometimes the smallest things take up the most room in your heart.\"",
                bio: "As Honey Supervisor, Pooh is making sure every jar is filled to the brim with the sweetest honey for our celebration. He's also in charge of the snack table (for quality control purposes)."
            },
            piglet: {
                icon: `<img src="Images/Characters/piglet.png" alt="Piglet" style="width: 80px; height: auto;">`,
                name: "Piglet",
                quote: "\"Even the littlest friend can bring the greatest joy.\"",
                bio: "Our Cozy Coordinator, Piglet is making sure every blanket is soft, every hug is available, and that no one feels too small at our big celebration."
            },
            tigger: {
                icon: `<img src="Images/Characters/tigger.png" alt="Tigger" style="width: 80px; height: auto;">`,
                name: "Tigger",
                quote: "\"New babies are what Tiggers like best!\"",
                bio: "As Bounce Director, Tigger is planning all the fun activities and making sure there's plenty of bounce in our step. He's also testing all the rocking chairs for optimal bounce."
            },
            eeyore: {
                icon: `<img src="Images/Characters/eeyore.png" alt="Eeyore" style="width: 80px; height: auto;">`,
                name: "Eeyore",
                quote: "\"Not that I'm complaining, but it will be rather nice to have someone new around.\"",
                bio: "Our Photo Spot Curator, Eeyore has found the perfect spot for pictures (with just the right amount of shade) and is making sure every memory is properly documented."
            }
        };

        const data = characterData[character];
        if (!data) return;

        characterModalIcon.innerHTML = data.icon;
        characterModalTitle.textContent = data.name;
        characterModalQuote.textContent = data.quote;
        characterModalBio.textContent = data.bio;

        characterModal.style.display = 'flex';
        characterModal.setAttribute('aria-hidden', 'false');

        // Focus trap for accessibility
        const closeBtn = this.el.characterModalClose;
        setTimeout(() => closeBtn.focus(), 100);
        this.enableFocusTrap(characterModal);
        this.el.mainContent?.setAttribute('aria-hidden', 'true');
    }

    closeCharacterModal() {
        const { characterModal } = this.el;
        if (!characterModal) return;
        characterModal.style.display = 'none';
        characterModal.setAttribute('aria-hidden', 'true');
        this.clearFocusTrap();
        this.el.mainContent?.removeAttribute('aria-hidden');
    }

    openGameInstructions(type) {
        const m = this.el.gameInstructionModal;
        if (!m) return;

        const title = 'Honey Pot Catch';
        const instructions = `
            <li>Move Pooh left and right with arrow keys or tap the sides</li>
            <li>Catch honey pots for points</li>
            <li>Golden pots are worth 50 points and add extra time!</li>
            <li>Avoid the bouncing rocks - they cost you lives</li>
            <li>You have 60 seconds to get as many points as possible</li>
            <li>Press Space or Enter to start/pause the game</li>
        `;

        this.el.gameInstructionTitle.textContent = title;
        this.el.gameInstructionList.innerHTML = instructions;
        
        m.style.display = 'flex';
        m.setAttribute('aria-hidden', 'false');
        
        setTimeout(() => this.el.gameInstructionClose.focus(), 100);
    }

    closeGameInstructions() {
        const m = this.el.gameInstructionModal;
        if (!m) return;
        m.style.display = 'none';
        m.setAttribute('aria-hidden', 'true');
    }

    playWoodlandSound(event) {
        event.stopPropagation();
        
        // Create audio context for sound effects
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
            
            // Visual feedback
            const button = event.currentTarget;
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
            }, 100);
        } catch (e) {
            console.log('Sound effect failed:', e);
        }
    }

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
        window.toggleMobileControls = function () {
            self.toggleMobileControlsPanel();
        };
        window.editRSVP = function () {
            self.editRSVP();
        };
    }
}

/* ========= BOOTSTRAP ========= */

document.addEventListener('DOMContentLoaded', () => {
    new HundredAcreApp();
});
