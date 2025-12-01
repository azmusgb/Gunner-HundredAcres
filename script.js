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

    // Store which button opened the modal for focus restoration
    document.querySelectorAll('[data-character]').forEach(btn => {
        if (btn.dataset.character === key) {
            btn.classList.add('last-focused');
        } else {
            btn.classList.remove('last-focused');
        }
    });

    // Update modal content
    document.getElementById('modalCharacterIcon').textContent = character.icon;
    document.getElementById('characterModalTitle').textContent = character.name;
    document.getElementById('modalCharacterQuote').textContent = character.quote;
    document.getElementById('modalCharacterBio').textContent = character.bio;

    // Accessibility
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'characterModalTitle');
    modal.setAttribute('aria-describedby', 'modalCharacterBio');
    
    document.body.classList.add('modal-open');

    // Trap focus inside modal
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    
    if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100);
    }

    // Handle focus trapping
    const trapFocus = (e) => {
        if (e.key === 'Tab') {
            if (!focusableElements.length) return;
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey && document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    };
    
    if (modal._trapFocusHandler) {
        modal.removeEventListener('keydown', modal._trapFocusHandler);
    }
    modal.addEventListener('keydown', trapFocus);
    modal._trapFocusHandler = trapFocus;
}

function closeCharacterModal() {
    const modal = document.getElementById('characterModal');
    if (!modal) return;
    
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    
    // Restore focus to the button that opened the modal
    const lastFocused = document.querySelector('[data-character].last-focused');
    if (lastFocused) {
        setTimeout(() => {
            lastFocused.focus();
            lastFocused.classList.remove('last-focused');
        }, 50);
    }
    
    // Remove focus trap
    if (modal._trapFocusHandler) {
        modal.removeEventListener('keydown', modal._trapFocusHandler);
        delete modal._trapFocusHandler;
    }
}

function playWoodlandSound(event) {
    // Prevent default and handle mobile restrictions
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Create or resume AudioContext on user interaction
    const createSound = () => {
        try {
            if (!window.AudioContext && !window.webkitAudioContext) return;
            
            const context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Check if context is in suspended state (common on mobile)
            if (context.state === 'suspended') {
                context.resume().then(() => {
                    playActualSound(context);
                }).catch(err => {
                    console.warn('Could not resume audio context:', err);
                });
            } else {
                playActualSound(context);
            }
        } catch (error) {
            console.warn('Audio playback failed:', error);
        }
    };
    
    const playActualSound = (context) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.value = 660 + Math.random() * 40;
        gain.gain.setValueAtTime(0.001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.25, context.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5);
        
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.6);
        
        if (event?.target) {
            event.target.classList.add('active-sound');
            setTimeout(() => event.target.classList.remove('active-sound'), 350);
        }
    };
    
    createSound();
}

function setupNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navItems = document.querySelectorAll('.nav-item');
    
    // Clean up existing listeners
    if (window.navHandlers) {
        if (navToggle && window.navHandlers.toggleHandler) {
            navToggle.removeEventListener('click', window.navHandlers.toggleHandler);
        }
        window.removeEventListener('scroll', window.navHandlers.scrollHandler);
        navItems.forEach(item => {
            if (window.navHandlers.itemHandlers) {
                const handler = window.navHandlers.itemHandlers.get(item);
                if (handler) {
                    item.removeEventListener('click', handler);
                }
            }
        });
    }
    
    // Initialize handlers storage
    window.navHandlers = {
        toggleHandler: null,
        scrollHandler: null,
        itemHandlers: new Map()
    };
    
    if (navToggle && navMenu) {
        const toggleHandler = () => {
            const isOpen = navMenu.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', String(isOpen));
            navMenu.setAttribute('aria-hidden', String(!isOpen));
            
            // Focus management for accessibility
            if (isOpen) {
                setTimeout(() => {
                    const firstNavItem = navMenu.querySelector('.nav-item');
                    if (firstNavItem) firstNavItem.focus();
                }, 100);
            }
        };
        
        navToggle.addEventListener('click', toggleHandler);
        window.navHandlers.toggleHandler = toggleHandler;
    }
    
    const activateSection = () => {
        const sections = Array.from(document.querySelectorAll('.content-section'));
        const scrollPos = window.scrollY + window.innerHeight / 3;
        let activeFound = false;
        
        sections.forEach((section) => {
            const id = section.getAttribute('id');
            const link = document.querySelector(`.nav-item[data-section="${id}"]`);
            if (!link) return;
            
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const active = scrollPos >= top && scrollPos < top + height;
            
            link.classList.toggle('active', active);
            if (active) activeFound = true;
        });
        
        // If no active section found, default to first
        if (!activeFound && navItems.length > 0) {
            navItems[0].classList.add('active');
        }
    };
    
    navItems.forEach((item) => {
        const itemHandler = (e) => {
            e.preventDefault();
            navItems.forEach((link) => link.classList.remove('active'));
            item.classList.add('active');
            
            const targetId = item.getAttribute('data-section');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
            
            if (navMenu) {
                navMenu.classList.remove('open');
                navMenu.setAttribute('aria-hidden', 'true');
            }
            if (navToggle) {
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.focus();
            }
        };
        
        item.addEventListener('click', itemHandler);
        window.navHandlers.itemHandlers.set(item, itemHandler);
    });
    
    const scrollHandler = () => {
        if (!window.scrollTicking) {
            window.requestAnimationFrame(() => {
                activateSection();
                window.scrollTicking = false;
            });
            window.scrollTicking = true;
        }
    };
    
    window.addEventListener('scroll', scrollHandler);
    window.navHandlers.scrollHandler = scrollHandler;
    
    activateSection();
}

function setupReadingProgress() {
    const bar = document.getElementById('readingProgress');
    if (!bar) return;
    
    let ticking = false;
    const updateProgress = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
        bar.style.width = `${progress}%`;
        
        // Update aria-valuenow for accessibility
        bar.setAttribute('aria-valuenow', Math.round(progress));
        ticking = false;
    };
    
    const scrollHandler = () => {
        if (!ticking) {
            window.requestAnimationFrame(updateProgress);
            ticking = true;
        }
    };
    
    window.addEventListener('scroll', scrollHandler);
    updateProgress();
}

function setupButtons() {
    const openBookBtn = document.getElementById('openBookBtn');
    const scrollTopFab = document.getElementById('scrollTopFab');
    const scrollRsvpFab = document.getElementById('scrollRsvpFab');
    const rsvpSection = document.getElementById('rsvp');
    const storybookCover = document.getElementById('storybookCover');
    const mainContent = document.getElementById('mainContent');
    
    if (openBookBtn) {
        openBookBtn.addEventListener('click', () => {
            storybookCover?.classList.add('closed');
            storybookCover?.setAttribute('aria-hidden', 'true');
            
            // Add focus to main content for accessibility
            if (mainContent) {
                mainContent.setAttribute('tabindex', '-1');
                mainContent.focus({ preventScroll: true });
                setTimeout(() => mainContent.removeAttribute('tabindex'), 1000);
            }
            
            // Scroll to main content smoothly
            setTimeout(() => {
                if (mainContent) {
                    mainContent.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 300);
            
            // Update reading progress after transition
            setTimeout(setupReadingProgress, 500);
        });
    }
    
    if (scrollTopFab) {
        scrollTopFab.addEventListener('click', () => {
            window.scrollTo({ 
                top: 0, 
                behavior: 'smooth',
                block: 'start'
            });
            
            // Focus management for accessibility
            setTimeout(() => {
                const firstFocusable = document.querySelector('header h1, .nav-item');
                if (firstFocusable) firstFocusable.focus();
            }, 300);
        });
    }
    
    if (scrollRsvpFab && rsvpSection) {
        scrollRsvpFab.addEventListener('click', () => {
            rsvpSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
            // Focus on RSVP form for accessibility
            setTimeout(() => {
                const rsvpInput = document.querySelector('#rsvpForm input[name="guestName"]');
                if (rsvpInput) rsvpInput.focus();
            }, 300);
        });
    }
}

function setupRSVPForm() {
    const form = document.getElementById('rsvpForm');
    const status = document.getElementById('rsvpStatus');
    if (!form || !status) return;
    
    // Add input validation
    const nameInput = form.querySelector('[name="guestName"]');
    const countInput = form.querySelector('[name="guestCount"]');
    const noteInput = form.querySelector('[name="guestNote"]');
    
    const validateForm = () => {
        let isValid = true;
        
        if (nameInput) {
            const nameValue = nameInput.value.trim();
            if (!nameValue || nameValue.length < 2) {
                nameInput.setCustomValidity('Please enter a name (at least 2 characters)');
                isValid = false;
            } else {
                nameInput.setCustomValidity('');
            }
        }
        
        if (countInput) {
            const countValue = parseInt(countInput.value);
            if (isNaN(countValue) || countValue < 1 || countValue > 20) {
                countInput.setCustomValidity('Please enter between 1 and 20 guests');
                isValid = false;
            } else {
                countInput.setCustomValidity('');
            }
        }
        
        return isValid;
    };
    
    if (nameInput) {
        nameInput.addEventListener('input', validateForm);
        nameInput.addEventListener('blur', validateForm);
    }
    
    if (countInput) {
        countInput.addEventListener('input', validateForm);
        countInput.addEventListener('blur', validateForm);
    }
    
    if (noteInput) {
        noteInput.addEventListener('input', () => {
            const noteValue = noteInput.value.trim();
            if (noteValue.length > 200) {
                noteInput.setCustomValidity('Note must be less than 200 characters');
            } else {
                noteInput.setCustomValidity('');
            }
        });
    }
    
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        
        if (!validateForm()) {
            form.reportValidity();
            status.textContent = 'Please check your entries above.';
            status.className = 'form-status error';
            return;
        }
        
        const data = new FormData(form);
        const name = data.get('guestName')?.toString().trim();
        const count = data.get('guestCount');
        
        if (!name || !count) {
            status.textContent = 'Please add your name and the number of guests joining.';
            status.className = 'form-status error';
            return;
        }
        
        // Show saving status
        status.textContent = 'Saving your RSVP...';
        status.className = 'form-status info';
        
        // Simulate API call with timeout
        setTimeout(() => {
            const note = data.get('guestNote')?.toString().trim();
            const summary = `${name} (${count} attending)${note ? ` – ${note}` : ''}`;
            
            // Save to localStorage for persistence
            try {
                const rsvps = JSON.parse(localStorage.getItem('babyShowerRSVPs') || '[]');
                rsvps.push({
                    name,
                    count: parseInt(count),
                    note: note || '',
                    timestamp: new Date().toISOString()
                });
                localStorage.setItem('babyShowerRSVPs', JSON.stringify(rsvps));
                
                // Update UI
                const rsvpCountEl = document.getElementById('rsvpCount');
                if (rsvpCountEl) {
                    rsvpCountEl.textContent = rsvps.length;
                }
            } catch (error) {
                console.log('Could not save to localStorage:', error);
            }
            
            status.textContent = `Thank you! Your RSVP was saved: ${summary}`;
            status.className = 'form-status success';
            
            // Reset form and focus
            form.reset();
            if (nameInput) nameInput.focus();
            
            // Clear success message after 5 seconds
            setTimeout(() => {
                if (status.className === 'form-status success') {
                    status.textContent = '';
                    status.className = 'form-status';
                }
            }, 5000);
        }, 800);
    });
    
    // Load existing RSVP count on page load
    try {
        const rsvps = JSON.parse(localStorage.getItem('babyShowerRSVPs') || '[]');
        const rsvpCountEl = document.getElementById('rsvpCount');
        if (rsvpCountEl) {
            rsvpCountEl.textContent = rsvps.length;
        }
    } catch (error) {
        console.log('Could not load RSVPs from localStorage');
    }
}

function setupMotionToggle() {
    const motionToggle = document.getElementById('motionToggle');
    if (!motionToggle) return;

    const applyPreference = (reduced) => {
        document.body.classList.toggle('reduce-motion', reduced);
        localStorage.setItem('reduceMotion', reduced ? 'true' : 'false');
        
        // Update button visual state
        const icon = motionToggle.querySelector('i');
        if (icon) {
            if (reduced) {
                icon.className = 'fas fa-universal-access';
                motionToggle.setAttribute('aria-label', 'Enable animations');
            } else {
                icon.className = 'fas fa-running';
                motionToggle.setAttribute('aria-label', 'Reduce motion');
            }
        }
        
        // Update aria-pressed state
        motionToggle.setAttribute('aria-pressed', reduced ? 'true' : 'false');
        
        // Provide visual feedback
        motionToggle.classList.add('active');
        setTimeout(() => motionToggle.classList.remove('active'), 300);
    };

    // Check for system preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Check for stored preference
    const stored = localStorage.getItem('reduceMotion');
    let useReducedMotion = false;
    
    if (stored !== null) {
        useReducedMotion = stored === 'true';
    } else {
        useReducedMotion = prefersReducedMotion;
    }
    
    // Apply the preference
    applyPreference(useReducedMotion);
    
    // Add click event listener
    motionToggle.addEventListener('click', () => {
        const reduced = !document.body.classList.contains('reduce-motion');
        applyPreference(reduced);
    });
}

function setupMusicToggle() {
    const musicBtn = document.getElementById('musicToggle');
    const music = document.getElementById('bgMusic');
    if (!musicBtn || !music) return;
    
    // Set initial volume
    music.volume = 0.35;
    
    // Handle audio context for mobile
    const unlockAudio = () => {
        if (music.paused) {
            music.play().then(() => {
                // Pause immediately after unlocking
                music.pause();
                music.currentTime = 0;
            }).catch(error => {
                console.warn('Audio context unlock failed:', error);
            });
        }
    };
    
    // Unlock audio on first user interaction
    const unlockHandler = () => {
        unlockAudio();
        document.removeEventListener('click', unlockHandler);
        document.removeEventListener('keydown', unlockHandler);
    };
    
    document.addEventListener('click', unlockHandler, { once: true });
    document.addEventListener('keydown', unlockHandler, { once: true });
    
    musicBtn.addEventListener('click', async () => {
        try {
            if (music.paused) {
                await music.play();
                musicBtn.classList.add('active');
                musicBtn.setAttribute('aria-pressed', 'true');
            } else {
                music.pause();
                musicBtn.classList.remove('active');
                musicBtn.setAttribute('aria-pressed', 'false');
            }
        } catch (error) {
            console.warn('Audio playback failed:', error);
            musicBtn.classList.remove('active');
            musicBtn.setAttribute('aria-pressed', 'false');
        }
    });
    
    // Handle audio ending
    music.addEventListener('ended', () => {
        music.currentTime = 0;
        musicBtn.classList.remove('active');
        musicBtn.setAttribute('aria-pressed', 'false');
    });
}

function setupScrollAnimations() {
    const items = document.querySelectorAll('.scroll-animate');
    if (!items.length) return;
    
    let ticking = false;
    const reveal = () => {
        const triggerBottom = window.scrollY + window.innerHeight * 0.85;
        
        items.forEach((item) => {
            if (triggerBottom > item.offsetTop + item.offsetHeight * 0.3) {
                item.classList.add('visible');
            } else {
                // Optional: remove visible class when scrolled past
                // item.classList.remove('visible');
            }
        });
        ticking = false;
    };
    
    const scrollHandler = () => {
        if (!ticking) {
            window.requestAnimationFrame(reveal);
            ticking = true;
        }
    };
    
    window.addEventListener('scroll', scrollHandler);
    reveal(); // Initial check
}

function setupModalControls() {
    const modal = document.getElementById('characterModal');
    const closeBtn = document.getElementById('closeCharacterModal');
    if (!modal || !closeBtn) return;
    
    // Remove existing listeners to prevent duplicates
    closeBtn.removeEventListener('click', closeCharacterModal);
    modal.removeEventListener('click', modal.clickHandler);
    document.removeEventListener('keydown', modal.keydownHandler);
    
    // Add new listeners
    closeBtn.addEventListener('click', closeCharacterModal);
    
    modal.clickHandler = (event) => {
        if (event.target === modal) closeCharacterModal();
    };
    modal.addEventListener('click', modal.clickHandler);
    
    modal.keydownHandler = (event) => {
        if (event.key === 'Escape') closeCharacterModal();
    };
    document.addEventListener('keydown', modal.keydownHandler);
}

function setupLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (!loadingScreen) return;
    
    // Ensure loading screen is visible initially
    loadingScreen.classList.remove('hidden');
    loadingScreen.setAttribute('aria-hidden', 'false');
    
    const hide = () => {
        loadingScreen.classList.add('fade-out');
        loadingScreen.setAttribute('aria-hidden', 'true');
        
        // Remove from tab order and hide completely
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            
            // Restore focus to main content
            const mainContent = document.getElementById('mainContent');
            if (mainContent) {
                mainContent.setAttribute('tabindex', '-1');
                mainContent.focus({ preventScroll: true });
                setTimeout(() => mainContent.removeAttribute('tabindex'), 100);
            }
        }, 450);
    };
    
    // Hide after load or max 3 seconds
    const loadTimeout = setTimeout(hide, 3000);
    
    window.addEventListener('load', () => {
        clearTimeout(loadTimeout);
        setTimeout(hide, 500); // Small delay for smooth transition
    });
    
    // If everything is already loaded
    if (document.readyState === 'complete') {
        clearTimeout(loadTimeout);
        setTimeout(hide, 100);
    }
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
        this.active = true;
        this.cleanupFunctions = [];

        this.towerStats = {
            pooh: { cost: 20, range: 110, damage: 12, rate: 900, color: '#d19a3d', icon: '🐻' },
            tigger: { cost: 30, range: 130, damage: 14, rate: 750, color: '#e68a00', icon: '🐯' },
            rabbit: { cost: 40, range: 140, damage: 16, rate: 800, color: '#cfa95e', icon: '🐰' },
            piglet: { cost: 25, range: 120, damage: 12, rate: 820, color: '#f48fb1', icon: '🐷' },
            eeyore: { cost: 35, range: 150, damage: 18, rate: 1050, color: '#7e8ca3', icon: '🐴' }
        };

        this.pathY = this.height / 2;
        this.init();
    }

    init() {
        const clickHandler = (event) => this.placeTower(event);
        this.canvas.addEventListener('click', clickHandler);
        this.cleanupFunctions.push(() => {
            this.canvas.removeEventListener('click', clickHandler);
        });

        this.startButton = document.getElementById('start-defense');
        this.upgradeButton = document.getElementById('upgrade-tower');
        this.honeyEl = document.getElementById('honey-count');
        this.livesEl = document.getElementById('lives-count');
        this.waveEl = document.getElementById('wave-count');
        this.alertEl = document.getElementById('defense-alert');
        this.waveStatusEl = document.getElementById('defense-wave-status');
        this.towerOptions = document.querySelectorAll('.tower-option');

        if (this.startButton) {
            const startHandler = () => this.startWave();
            this.startButton.addEventListener('click', startHandler);
            this.cleanupFunctions.push(() => {
                this.startButton.removeEventListener('click', startHandler);
            });
        }

        if (this.upgradeButton) {
            const upgradeHandler = () => this.upgradeTowers();
            this.upgradeButton.addEventListener('click', upgradeHandler);
            this.cleanupFunctions.push(() => {
                this.upgradeButton.removeEventListener('click', upgradeHandler);
            });
        }

        this.towerOptions.forEach((btn) => {
            const selectHandler = () => this.selectTower(btn);
            btn.addEventListener('click', selectHandler);
            this.cleanupFunctions.push(() => {
                btn.removeEventListener('click', selectHandler);
            });
            
            if (btn.dataset.tower === this.selectedTower) {
                this.selectTower(btn);
            }
        });

        this.updateHud();
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    selectTower(button) {
        this.towerOptions.forEach((btn) => {
            btn.classList.remove('selected');
            btn.setAttribute('aria-pressed', 'false');
        });
        
        button.classList.add('selected');
        button.setAttribute('aria-pressed', 'true');
        this.selectedTower = button.dataset.tower;
        
        // Visual feedback
        button.classList.add('pulse');
        setTimeout(() => button.classList.remove('pulse'), 300);
    }

    startWave() {
        if (this.running) return;
        this.running = true;
        this.enemiesToSpawn = 5 + this.wave * 2;
        this.spawnTimer = 0;
        
        this.alertEl.textContent = `Wave ${this.wave} started! Defend the path!`;
        this.alertEl.classList.add('alert-pulse');
        setTimeout(() => this.alertEl.classList.remove('alert-pulse'), 2000);
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
            tower.rate = Math.max(300, tower.rate * 0.95);
            
            // Visual upgrade effect
            this.createUpgradeEffect(tower.x, tower.y);
        });
        
        this.alertEl.textContent = 'Your friends feel braver and stronger!';
        this.updateHud();
        
        // Button feedback
        this.upgradeButton.classList.add('pulse');
        setTimeout(() => this.upgradeButton.classList.remove('pulse'), 500);
    }

    createUpgradeEffect(x, y) {
        // Simple particle effect
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 5; i++) {
            const radius = 5 + i * 3;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    placeTower(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const stats = this.towerStats[this.selectedTower];
        
        if (!stats) return;
        if (this.honey < stats.cost) {
            this.alertEl.textContent = `Not enough honey to place ${this.selectedTower}.`;
            return;
        }

        // Check if position is too close to existing tower
        const tooClose = this.towers.some(tower => {
            const distance = Math.hypot(tower.x - x, tower.y - y);
            return distance < 40;
        });
        
        if (tooClose) {
            this.alertEl.textContent = 'Too close to another friend!';
            return;
        }

        this.towers.push({
            x,
            y,
            range: stats.range,
            damage: stats.damage,
            rate: stats.rate,
            lastShot: 0,
            color: stats.color,
            icon: stats.icon
        });
        
        this.honey -= stats.cost;
        this.alertEl.textContent = `${this.selectedTower} joined the party!`;
        this.updateHud();
        
        // Visual feedback
        playWoodlandSound(event);
    }

    spawnEnemy() {
        this.enemies.push({
            x: -30,
            y: this.pathY + (Math.random() * 40 - 20),
            speed: 35 + Math.random() * 20 + this.wave * 2,
            hp: 60 + this.wave * 10,
            maxHp: 60 + this.wave * 10
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
                    damage: tower.damage,
                    color: tower.color
                });
            }
        });
    }

    updateProjectiles(delta) {
        for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
            const projectile = this.projectiles[i];
            projectile.x += projectile.vx * delta;
            projectile.y += projectile.vy * delta;

            const enemy = this.enemies.find((e) => 
                Math.hypot(e.x - projectile.x, e.y - projectile.y) < 16
            );
            
            if (enemy) {
                enemy.hp -= projectile.damage;
                this.projectiles.splice(i, 1);
                
                if (enemy.hp <= 0) {
                    const enemyIndex = this.enemies.indexOf(enemy);
                    this.enemies.splice(enemyIndex, 1);
                    this.honey += 8 + Math.floor(this.wave / 2);
                    this.alertEl.textContent = 'Great teamwork! You earned honey.';
                    this.updateHud();
                }
                continue;
            }

            if (projectile.x < -20 || projectile.x > this.width + 20 || 
                projectile.y < -20 || projectile.y > this.height + 20) {
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
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.moveTo(0, this.pathY);
        ctx.lineTo(this.width, this.pathY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawEntities() {
        const ctx = this.ctx;
        
        // Draw towers
        this.towers.forEach((tower) => {
            ctx.fillStyle = tower.color;
            ctx.beginPath();
            ctx.arc(tower.x, tower.y, 14, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw tower icon
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tower.icon, tower.x, tower.y);
            
            // Draw range (semi-transparent)
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.beginPath();
            ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Draw enemies
        ctx.fillStyle = '#6c4b1a';
        this.enemies.forEach((enemy) => {
            // Enemy body
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, 14, 0, Math.PI * 2);
            ctx.fill();
            
            // Health bar background
            ctx.fillStyle = '#ffe7a1';
            ctx.fillRect(enemy.x - 16, enemy.y - 20, 32, 6);
            
            // Health bar fill
            ctx.fillStyle = enemy.hp > enemy.maxHp * 0.5 ? '#5cb85c' : 
                           enemy.hp > enemy.maxHp * 0.25 ? '#f0ad4e' : '#d9534f';
            const healthWidth = Math.max(0, (enemy.hp / enemy.maxHp) * 32);
            ctx.fillRect(enemy.x - 16, enemy.y - 20, healthWidth, 6);
            
            ctx.fillStyle = '#6c4b1a';
        });

        // Draw projectiles
        this.projectiles.forEach((projectile) => {
            ctx.fillStyle = projectile.color;
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Trail effect
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(projectile.x - projectile.vx * 0.02, 
                    projectile.y - projectile.vy * 0.02, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
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
            this.waveStatusEl.className = 'wave-status ready';
        } else {
            this.waveStatusEl.textContent = `Wave ${this.wave} in progress`;
            this.waveStatusEl.className = 'wave-status active';
        }
    }

    gameLoop(timestamp) {
        if (!this.active) return;
        
        const delta = Math.min(0.05, (timestamp - this.lastTime) / 1000);
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

    cleanup() {
        this.active = false;
        this.cleanupFunctions.forEach(fn => fn());
        this.cleanupFunctions = [];
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
        this.active = true;
        this.cleanupFunctions = [];
        this.controls = { left: false, right: false };
        this.touchStartX = 0;

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
        // Keyboard controls
        const keyDownHandler = (event) => {
            if (event.key === 'ArrowLeft') this.controls.left = true;
            if (event.key === 'ArrowRight') this.controls.right = true;
            if (event.key === ' ' || event.key === 'Spacebar') {
                if (!this.running) this.start();
            }
        };

        const keyUpHandler = (event) => {
            if (event.key === 'ArrowLeft') this.controls.left = false;
            if (event.key === 'ArrowRight') this.controls.right = false;
        };

        window.addEventListener('keydown', keyDownHandler);
        window.addEventListener('keyup', keyUpHandler);
        
        this.cleanupFunctions.push(() => {
            window.removeEventListener('keydown', keyDownHandler);
            window.removeEventListener('keyup', keyUpHandler);
        });

        // Mouse/touch controls
        const clickHandler = (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const relativeX = event.clientX - rect.left;
            this.handleSideClick(relativeX);
        };

        const touchStartHandler = (event) => {
            event.preventDefault();
            if (event.touches.length > 0) {
                const touch = event.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const relativeX = touch.clientX - rect.left;
                this.handleSideClick(relativeX);
            }
        };

        const touchMoveHandler = (event) => {
            event.preventDefault();
            if (event.touches.length > 0) {
                const touch = event.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const touchX = touch.clientX - rect.left;
                
                // Smooth follow for touch movement
                this.player.x = Math.max(
                    this.player.width / 2,
                    Math.min(this.width - this.player.width / 2, touchX)
                );
            }
        };

        this.canvas.addEventListener('click', clickHandler);
        this.canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
        this.canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
        
        this.cleanupFunctions.push(() => {
            this.canvas.removeEventListener('click', clickHandler);
            this.canvas.removeEventListener('touchstart', touchStartHandler);
            this.canvas.removeEventListener('touchmove', touchMoveHandler);
        });

        // Button controls
        if (this.startBtn) {
            const startHandler = () => this.start();
            this.startBtn.addEventListener('click', startHandler);
            this.cleanupFunctions.push(() => {
                this.startBtn.removeEventListener('click', startHandler);
            });
        }

        if (this.pauseBtn) {
            const pauseHandler = () => this.togglePause();
            this.pauseBtn.addEventListener('click', pauseHandler);
            this.cleanupFunctions.push(() => {
                this.pauseBtn.removeEventListener('click', pauseHandler);
            });
        }
    }

    handleSideClick(clickX) {
        if (clickX < this.width / 2) {
            this.controls.left = true;
            setTimeout(() => (this.controls.left = false), 120);
        } else {
            this.controls.right = true;
            setTimeout(() => (this.controls.right = false), 120);
        }
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

        // New game
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
        const type = Math.random() < 0.75 ? 'honey' : 'bee';
        this.items.push({
            x: Math.random() * (this.width - 30) + 15,
            y: -20,
            speed: 90 + Math.random() * 120 + (60 - this.timeRemaining) * 0.5,
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
                        playWoodlandSound();
                    } else {
                        this.lives = Math.max(0, this.lives - 1);
                        this.countdown.textContent = 'A bee buzzed by – careful!';
                        
                        // Visual feedback for bee hit
                        this.canvas.classList.add('bee-hit');
                        setTimeout(() => this.canvas.classList.remove('bee-hit'), 300);
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
        this.player.x = Math.max(
            this.player.width / 2, 
            Math.min(this.width - this.player.width / 2, this.player.x)
        );
    }

    drawBackground() {
        this.ctx.fillStyle = '#b0d0e3';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Gradient ground
        const ground = this.ctx.createLinearGradient(0, this.height - 60, 0, this.height);
        ground.addColorStop(0, '#f6e7c1');
        ground.addColorStop(1, '#e8d7a8');
        this.ctx.fillStyle = ground;
        this.ctx.fillRect(0, this.height - 60, this.width, 60);
    }

    drawPlayer() {
        // Player shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(
            this.player.x - this.player.width / 2 + 4, 
            this.height - this.player.height - 4, 
            this.player.width, 
            this.player.height
        );
        
        // Player body
        this.ctx.fillStyle = '#e8a73c';
        this.ctx.fillRect(
            this.player.x - this.player.width / 2, 
            this.height - this.player.height - 8, 
            this.player.width, 
            this.player.height
        );
        
        // Player detail
        this.ctx.fillStyle = '#8b5a2b';
        this.ctx.fillRect(
            this.player.x - this.player.width / 2 + 8, 
            this.height - this.player.height - 12, 
            this.player.width - 16, 
            6
        );
    }

    drawItems() {
        this.items.forEach((item) => {
            // Item shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.beginPath();
            this.ctx.arc(item.x + 2, item.y + 2, 
                        item.type === 'honey' ? 12 : 10, 0, Math.PI * 2);
            this.ctx.fill();
            
            if (item.type === 'honey') {
                // Honey pot
                this.ctx.fillStyle = '#ffda79';
                this.ctx.beginPath();
                this.ctx.arc(item.x, item.y, 12, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#8b5a2b';
                this.ctx.fillRect(item.x - 8, item.y - 6, 16, 6);
            } else {
                // Bee
                this.ctx.fillStyle = '#f05d5e';
                this.ctx.beginPath();
                this.ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(item.x - 6, item.y - 2, 12, 4);
                
                // Bee wings
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.beginPath();
                this.ctx.arc(item.x - 6, item.y - 8, 5, 0, Math.PI * 2);
                this.ctx.arc(item.x + 6, item.y - 8, 5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    updateHud() {
        if (this.scoreEl) this.scoreEl.textContent = this.score;
        if (this.timeEl) this.timeEl.textContent = Math.max(0, Math.ceil(this.timeRemaining));
        if (this.livesEl) this.livesEl.textContent = this.lives;
    }

    loop(timestamp) {
        if (!this.active) return;
        
        const delta = Math.min(0.05, (timestamp - this.lastTime) / 1000);
        this.lastTime = timestamp;

        this.drawBackground();
        
        if (this.running) {
            this.timeRemaining -= delta;
            this.spawnTimer += delta;
            
            if (this.spawnTimer > 0.9 - Math.min(0.5, this.score * 0.001)) {
                this.spawnItem();
                this.spawnTimer = 0;
            }

            this.updatePlayer(delta);
            this.updateItems(delta);

            if (this.timeRemaining <= 0 || this.lives <= 0) {
                this.running = false;
                this.overlay.classList.remove('hidden');
                
                if (this.lives <= 0) {
                    this.countdown.textContent = 'Game over – the bees won this round.';
                } else {
                    this.countdown.textContent = `Time's up! Final score: ${this.score}`;
                    
                    // Save high score
                    try {
                        const highScores = JSON.parse(localStorage.getItem('honeyCatchHighScores') || '[]');
                        highScores.push({
                            score: this.score,
                            date: new Date().toISOString()
                        });
                        // Keep only top 5 scores
                        highScores.sort((a, b) => b.score - a.score);
                        if (highScores.length > 5) highScores.length = 5;
                        localStorage.setItem('honeyCatchHighScores', JSON.stringify(highScores));
                    } catch (e) {
                        console.log('Could not save high score');
                    }
                }
                
                this.hint.textContent = 'Press start to try again and set a new score.';
            }
            
            this.updateHud();
        }

        this.drawItems();
        this.drawPlayer();

        requestAnimationFrame((time) => this.loop(time));
    }

    cleanup() {
        this.active = false;
        this.cleanupFunctions.forEach(fn => fn());
        this.cleanupFunctions = [];
    }
}

// Global cleanup function
function cleanupAll() {
    if (window.towerDefenseGame) {
        window.towerDefenseGame.cleanup();
        delete window.towerDefenseGame;
    }
    
    if (window.honeyCatchGame) {
        window.honeyCatchGame.cleanup();
        delete window.honeyCatchGame;
    }
    
    // Clean up navigation handlers
    if (window.navHandlers) {
        const navToggle = document.getElementById('navToggle');
        if (navToggle && window.navHandlers.toggleHandler) {
            navToggle.removeEventListener('click', window.navHandlers.toggleHandler);
        }
        
        if (window.navHandlers.scrollHandler) {
            window.removeEventListener('scroll', window.navHandlers.scrollHandler);
        }
        
        if (window.navHandlers.itemHandlers) {
            window.navHandlers.itemHandlers.forEach((handler, item) => {
                item.removeEventListener('click', handler);
            });
        }
        
        delete window.navHandlers;
    }
    
    // Clean up modal handlers
    const modal = document.getElementById('characterModal');
    if (modal) {
        if (modal._trapFocusHandler) {
            modal.removeEventListener('keydown', modal._trapFocusHandler);
            delete modal._trapFocusHandler;
        }
        if (modal.clickHandler) {
            modal.removeEventListener('click', modal.clickHandler);
            delete modal.clickHandler;
        }
        if (modal.keydownHandler) {
            document.removeEventListener('keydown', modal.keydownHandler);
            delete modal.keydownHandler;
        }
    }
}

// Initialize everything when DOM is loaded
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

    // Initialize games
    const defenseCanvas = document.getElementById('defense-game');
    const catchCanvas = document.getElementById('honey-game');
    
    if (defenseCanvas) {
        window.towerDefenseGame = new TowerDefenseGame(defenseCanvas);
    }
    
    if (catchCanvas) {
        window.honeyCatchGame = new HoneyCatchGame(catchCanvas);
    }
});

// Call cleanup when page is being unloaded
window.addEventListener('beforeunload', cleanupAll);

// Make functions available globally
window.showCharacterModal = showCharacterModal;
window.playWoodlandSound = playWoodlandSound;
window.closeCharacterModal = closeCharacterModal;
