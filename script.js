// a11y utility styles
(function(){
    const style = document.createElement('style');
    style.textContent = '.sr-only{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0} :focus-visible{outline:3px solid #1976d2; outline-offset: 2px}';
    document.head.appendChild(style);
})();

// ===== STORYBOOK NAVIGATION =====
let currentChapter = 1;
const totalChapters = 4;
const pageIndicator = document.getElementById('pageIndicator');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressFill = document.getElementById('progressFill');
const chapterPills = Array.from(document.querySelectorAll('.chapter-pill'));

function showChapter(ch) {
    const currentPage = document.querySelector('[data-chapter="' + currentChapter + '"]');
    const nextPageEl = document.querySelector('[data-chapter="' + ch + '"]');
    if (!nextPageEl || currentChapter === ch) return;

    currentPage.classList.add('exiting');
    setTimeout(() => {
        currentPage.classList.remove('active', 'exiting');
        nextPageEl.classList.add('active');
        currentChapter = ch;
        updateNavigation();
    }, 600);
}

function nextPage() {
    if (currentChapter < totalChapters) {
        showChapter(currentChapter + 1);
    }
}

function previousPage() {
    if (currentChapter > 1) {
        showChapter(currentChapter - 1);
    }
}

function updateNavigation() {
    if (prevBtn && nextBtn) {
        prevBtn.disabled = currentChapter === 1;
        nextBtn.disabled = currentChapter === totalChapters;
    }

    if (pageIndicator) {
        const completed = Math.max(0, currentChapter - 1);
        pageIndicator.textContent = `Chapter ${currentChapter} of ${totalChapters}`;
    }

    const progress = totalChapters > 1
        ? ((currentChapter - 1) / (totalChapters - 1)) * 100
        : 100;
    if (progressFill) {
        progressFill.style.width = progress + '%';
    }
    const progressBar = document.querySelector('.book-progress');
    if (progressBar) {
        progressBar.setAttribute('aria-valuenow', String(Math.round(progress)));
    }

    chapterPills.forEach((pill) => {
        const target = Number(pill.dataset.chapterTarget);
        const isActive = target === currentChapter;
        pill.classList.toggle('active', isActive);
        pill.classList.toggle('visited', target < currentChapter);
        pill.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
}

chapterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
        const targetChapter = Number(pill.dataset.chapterTarget);
        showChapter(targetChapter);
    });
});

// ===== FULLSCREEN & MUSIC CONTROLS =====
const fullscreenBtn = document.getElementById('fullscreenBtn');
const gameCard = document.querySelector('.game-card');
const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');
const critiqueSummary = document.getElementById('critiqueSummary');
const critiqueList = document.getElementById('critiqueList');
const MUSIC_KEY = 'hundredAcres.music';
let musicEnabled = false;
let mobileFullscreenActive = false;
const isMobileUser = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

function syncFullscreenUI() {
    const isNativeFullscreen = Boolean(document.fullscreenElement);
    const isFull = isNativeFullscreen || mobileFullscreenActive;

    if (gameCard) {
        gameCard.classList.toggle('fullscreen', isNativeFullscreen);
        gameCard.classList.toggle('fullscreen-mobile', mobileFullscreenActive);
    }

    if (fullscreenBtn) {
        fullscreenBtn.classList.toggle('active', isFull);
        fullscreenBtn.textContent = isFull ? '🗗 Exit Fullscreen' : '⛶ Fullscreen';
        fullscreenBtn.setAttribute('aria-pressed', isFull ? 'true' : 'false');
    }

    if (!isFull) {
        document.body.style.overflow = '';
    }
}
// Add to script.js
function scrollToChapter(chapterNumber) {
    const chapterElement = document.querySelector(`[data-chapter="${chapterNumber}"]`);
    const chapterTracker = document.querySelector('.chapter-tracker');

    if (chapterElement && chapterTracker) {
        // Update active chapter
        document.querySelectorAll('.chapter-pill').forEach(pill => {
            pill.classList.remove('active');
        });
        document.querySelector(`[data-chapter-target="${chapterNumber}"]`).classList.add('active');

        // Scroll to chapter
        const yOffset = -80; // Adjust for header
        const y = chapterTracker.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });

        // Update page content if needed
        updatePageDisplay(chapterNumber);
    }
}
function toggleMobileFullscreen() {
    if (!gameCard || !fullscreenBtn) return;

    mobileFullscreenActive = !mobileFullscreenActive;

    if (mobileFullscreenActive) {
        // Make sure the game card is the thing in view when we go fullscreen
        gameCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (mobileFullscreenActive) {
        gameCard.classList.add('fullscreen-mobile');
        document.body.style.overflow = 'hidden';

        fullscreenBtn.textContent = '🗗 Exit Fullscreen';
        fullscreenBtn.setAttribute('aria-pressed', 'true');

        setTimeout(() => {
            if (Game && Game.resizeCanvas) {
                Game.resizeCanvas(true);
            }
        }, 100);

    } else {
        gameCard.classList.remove('fullscreen-mobile');
        document.body.style.overflow = '';

        fullscreenBtn.textContent = '⛶ Fullscreen';
        fullscreenBtn.setAttribute('aria-pressed', 'false');

        if (Game && Game.resizeCanvas) {
            Game.resizeCanvas(true);
        }
    }

    syncFullscreenUI();
}

function toggleFullscreen() {
    if (mobileFullscreenActive && !isMobileUser && !document.fullscreenElement) {
        toggleMobileFullscreen();
        return;
    }

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
        toggleMobileFullscreen();
    } else {
        if (!document.fullscreenElement) {
            gameCard?.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
                toggleMobileFullscreen();
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
}

// ===== ORIENTATION CHANGE HANDLER =====
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        if (Game && Game.resizeCanvas) {
            Game.resizeCanvas(true);
        }
    }, 300);
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Game && Game.resizeCanvas) {
        Game.resizeCanvas(true);
    }
});

// ===== TOUCH CONTROL EVENT HANDLERS =====
function setupTouchControls() {
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');

    if (!leftBtn || !rightBtn) return;

    const setPressed = (btn, isActive) => {
        btn.classList.toggle('pressed', isActive);
    };

    const handleStart = (direction) => {
        keys[direction] = true;
        return false;
    };

    const handleEnd = (direction) => {
        keys[direction] = false;
    };

    ['touchstart', 'mousedown'].forEach(eventType => {
        leftBtn.addEventListener(eventType, (e) => {
            e.preventDefault();
            handleStart('left');
            setPressed(leftBtn, true);
        });

        rightBtn.addEventListener(eventType, (e) => {
            e.preventDefault();
            handleStart('right');
            setPressed(rightBtn, true);
        });
    });

    ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach(eventType => {
        leftBtn.addEventListener(eventType, () => {
            handleEnd('left');
            setPressed(leftBtn, false);
        });
        rightBtn.addEventListener(eventType, () => {
            handleEnd('right');
            setPressed(rightBtn, false);
        });
    });
}

// ===== INITIALIZE MOBILE OPTIMIZATIONS =====
function initMobileOptimizations() {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
        const touchControls = document.querySelector('.touch-controls');
        if (touchControls) {
            touchControls.style.display = 'flex';
        }

        if (player) {
            player.speed = 7;
        }

        setupTouchControls();

        document.addEventListener('touchstart', function(event) {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        }, { passive: false });

        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('touchmove', function(e) {
                if (gameState === 'playing') {
                    e.preventDefault();
                }
            }, { passive: false });
        }
    }
}

// ===== IMPROVED KEYBOARD CONTROL FOR MOBILE EXTERNAL KEYBOARDS =====
document.addEventListener('keydown', function(e) {
    if (gameState === 'playing' &&
        (e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
            e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
    }
});

// ===== VISUAL FEEDBACK FOR TOUCH CONTROLS =====
function addTouchFeedback() {
    const style = document.createElement('style');
    style.textContent = `
    .touch-btn.pressed {
      background: rgba(244, 169, 68, 0.3) !important;
      transform: scale(0.95) !important;
    }
    
    @media (max-width: 768px) {
      .game-card .btn:active {
        transform: scale(0.97);
        transition: transform 0.1s ease;
      }
    }
  `;
    document.head.appendChild(style);
}

addTouchFeedback();

function setMusicState(enabled) {
    if (!bgMusic) return;
    musicEnabled = enabled;
    // Replace the entire enhanced audio controller (last anonymous function)
// with proper integration:

    if (musicToggle) {
        musicToggle.addEventListener('click', () => {
            musicEnabled = !musicEnabled;
            localStorage.setItem('hundredAcres.music', musicEnabled ? 'on' : 'off');
            setMusicState(musicEnabled);

            // Also sync ambient forest sound
            if (ambientForest) {
                if (musicEnabled) {
                    ambientForest.volume = 0.12;
                    ambientForest.play().catch(() => {});
                } else {
                    ambientForest.pause();
                }
            }
        });
    }


    if (enabled) {
        bgMusic.volume = 0.45;
        const playPromise = bgMusic.play();
        if (playPromise?.catch) {
            playPromise.catch(() => {});
        }
    } else {
        bgMusic.pause();
    }
}

function primeMusicPlayback() {
    if (musicEnabled) {
        setMusicState(true);
    }
}

function renderCritique(summary, bulletPoints) {
    if (critiqueSummary) {
        critiqueSummary.textContent = summary;
    }

    if (critiqueList) {
        critiqueList.innerHTML = '';
        bulletPoints.forEach((point) => {
            const li = document.createElement('li');
            li.textContent = point;
            critiqueList.appendChild(li);
        });
    }
}

if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
}
// Attach control button listeners (replacing inline onclicks)
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
startBtn?.addEventListener('click', () => Game.start());
pauseBtn?.addEventListener('click', () => Game.togglePause());
resetBtn?.addEventListener('click', () => Game.reset());
// Chapter nav listeners
prevBtn?.addEventListener('click', previousPage);
nextBtn?.addEventListener('click', nextPage);
document.addEventListener('fullscreenchange', () => {
    const nativeActive = Boolean(document.fullscreenElement);
    if (!nativeActive && mobileFullscreenActive) {
        mobileFullscreenActive = false;
        gameCard?.classList.remove('fullscreen-mobile');
        document.body.style.overflow = '';
    }

    syncFullscreenUI();

    if (Game.resizeCanvas) {
        setTimeout(() => Game.resizeCanvas(true), 100);
    }
});

const storedMusic = localStorage.getItem(MUSIC_KEY);
musicEnabled = storedMusic === 'on';
setMusicState(musicEnabled);

if (musicToggle) {
    musicToggle.addEventListener('click', () => {
        musicEnabled = !musicEnabled;
        localStorage.setItem(MUSIC_KEY, musicEnabled ? 'on' : 'off');
        setMusicState(musicEnabled);
    });
}

document.addEventListener('click', primeMusicPlayback, { once: true });
document.addEventListener('touchstart', primeMusicPlayback, { once: true, passive: true });
syncFullscreenUI();

// ===== GAME LOGIC =====
let canvas, ctx;
let rafId = null; // rAF id
let bgCanvas = null, bgCtx = null; // cached background canvas
let gameState = 'idle';
let score = 0;
let honeyCollected = 0;
let bestScore = 0;
let bestHoney = 0;
let bestCombo = 0;
let combo = 0;
let lives = 3;
let timeLeft = 60;
let difficulty = 'easy';
let beeHits = 0;
let runBestCombo = 0;
let gameInterval, timerInterval, dropInterval, beeInterval, powerInterval;
let hitFlash = 0;
const isTouchDevice = 'ontouchstart' in window;

let player = { x: 0, y: 0, width: 60, height: 90, speed: isTouchDevice ? 6 : 5 };
let drops = [];
let bees = [];
let sparkles = [];
let powerups = [];
const activeEffects = {
    shield: false,
    magnetUntil: 0,
    doubleUntil: 0
};

const difficulties = {
    easy: { dropSpeed: 2, beeSpeed: 1.5, dropFreq: 1500, beeFreq: 3000, dropValue: 10 },
    normal: { dropSpeed: 3, beeSpeed: 2.4, dropFreq: 1000, beeFreq: 2000, dropValue: 14 },
    cozy: { dropSpeed: 1.6, beeSpeed: 1.1, dropFreq: 1800, beeFreq: 3200, dropValue: 8 }
};

let keys = { left: false, right: false };
const defaultCritique = {
    summary: 'Finish a run to unlock tips',
    bullets: ['Collect honey and avoid bees to see how you did.']
};

// ===== GAME FUNCTIONS =====
const Game = {
    buildRunCritique: function() {
        const bullets = [];

        const summary = score >= 260
            ? 'Sweet scoring spree!'
            : score >= 170
                ? 'Solid honey haul!'
                : 'Warm-up jog complete — more honey awaits.';

        const stingNote = beeHits === 0
            ? 'Stayed sting-free — nimble dodging!'
            : `Shook off ${beeHits} bee bump${beeHits === 1 ? '' : 's'} — shields and weaving help.`;
        bullets.push(stingNote);

        const comboNote = runBestCombo >= 6
            ? `Built a cozy combo of x${runBestCombo} — keep chaining catches.`
            : runBestCombo >= 3
                ? `Nice combo rhythm with x${runBestCombo}; keep honey steady for bigger bonuses.`
                : 'Try catching back-to-back honey to build a combo bonus.';
        bullets.push(comboNote);

        const paceNote = honeyCollected >= 28
            ? 'Honey haul was plentiful — sweet pace!'
            : honeyCollected >= 15
                ? 'Solid honey haul; chase a few more pots next run.'
                : 'Slide under falling honey more often to grow your haul.';
        bullets.push(paceNote);

        const diffNote = difficulty === 'cozy'
            ? 'Cozy mode is gentle; bump to Easy/Normal when you want faster drops.'
            : difficulty === 'easy'
                ? 'Easy mode unlocked; step to Normal for extra spring when you are ready.'
                : 'Normal mode chosen — steady reflexes! Cozy is there for calmer play.';
        bullets.push(diffNote);

        return { summary, bullets };
    },

    init: function() {
        canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Game canvas not found!');
            return;
        }
        ctx = canvas.getContext('2d');

        this.overlay = document.getElementById('gameOverlay');
        this.overlayButton = document.getElementById('overlayButton');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        this.overlayIcon = document.getElementById('overlayIcon');
        this.previouslyFocused = null;

        if (this.overlayButton) {
            this.overlayButton.addEventListener('click', () => {
                if (gameState === 'paused') {
                    this.resume();
                } else {
                    this.start();
                }
            });
        }
        // ESC key handling for overlay states
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (gameState === 'paused') this.resume();
                else if (gameState === 'over') this.reset();
            }
        });

        const sizeCanvas = () => {
            const container = canvas.parentElement;
            if (!container) return;

            const isFull = gameCard?.classList?.contains('fullscreen') || gameCard?.classList?.contains('fullscreen-mobile');
            const isSmallScreen = window.innerWidth <= 900;

            // Width: same logic as before, just guarded
            const maxWidth = Math.min(container.offsetWidth - 28, isFull ? 1100 : 680);
            canvas.width = Math.max(260, maxWidth);

            let targetHeight;

            if (isFull && isSmallScreen && gameCard) {
                // Mobile-ish fullscreen: fill the viewport vertically
                let availableHeight = window.innerHeight;

                // Subtract card padding
                const cardStyles = window.getComputedStyle(gameCard);
                const padTop = parseFloat(cardStyles.paddingTop) || 0;
                const padBottom = parseFloat(cardStyles.paddingBottom) || 0;
                availableHeight -= (padTop + padBottom);

                // Subtract header / HUD / controls height
                const header = gameCard.querySelector('.game-card-header');
                const hudPrimary = gameCard.querySelector('.hud');
                const hudSecondary = gameCard.querySelector('.hud-secondary');
                const controls = gameCard.querySelector('.game-controls');

                [header, hudPrimary, hudSecondary, controls].forEach(el => {
                    if (el) {
                        availableHeight -= (el.offsetHeight || 0);
                    }
                });

                // Leave a little room for touch controls / thumbs
                availableHeight -= isTouchDevice ? 80 : 24;

                // Height based on width, but clamped into the available space
                const idealFromAspect = canvas.width * 0.75; // slightly taller for playability
                targetHeight = Math.max(220, Math.min(availableHeight, idealFromAspect));
            } else {
                // Desktop / non-fullscreen behavior (very close to what you had)
                const heightRatio = isFull ? 0.62 : (window.innerWidth < 640 ? 0.75 : 0.85);
                const maxHeight = isFull ? 680 : 480;
                targetHeight = Math.min(maxHeight, Math.round(canvas.width * heightRatio));
            }

            canvas.height = Math.max(220, targetHeight);
        };

        this.resizeCanvas = (preservePosition = false) => {
            const previousWidth = canvas.width;
            sizeCanvas();

            if (preservePosition) {
                player.x = (player.x / previousWidth) * canvas.width;
            } else {
                player.x = canvas.width / 2 - player.width / 2;
            }

            player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
            player.y = canvas.height - player.height - 18;
            this.draw();
        };

        this.resizeCanvas();

        // prepare offscreen background canvas
        bgCanvas = document.createElement('canvas');
        bgCtx = bgCanvas.getContext('2d');

        // Keyboard controls
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);

        // Touch controls
        let isDragging = false;

        canvas.addEventListener('touchstart', (e) => {
            isDragging = true;
            this.handleTouch(e);
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            if (isDragging) this.handleTouch(e);
        }, { passive: false });

        canvas.addEventListener('touchend', () => { isDragging = false; });

        // Mouse controls
        canvas.addEventListener('mousedown', () => { isDragging = true; });
        canvas.addEventListener('mousemove', (e) => {
            if (isDragging && gameState === 'playing') {
                const rect = canvas.getBoundingClientRect();
                player.x = e.clientX - rect.left - player.width / 2;
                player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
            }
        });
        canvas.addEventListener('mouseup', () => { isDragging = false; });
        canvas.addEventListener('mouseleave', () => { isDragging = false; });

        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const level = btn.dataset.diff;
                Game.setDifficulty(level);
            });
        });

        // Load persisted difficulty
        const savedDiff = localStorage.getItem('hundredAcres.difficulty');
        if (savedDiff && difficulties[savedDiff]) {
            this.setDifficulty(savedDiff);
        } else {
            this.setDifficulty(difficulty);
        }



        this.draw();

        this.showOverlay('Ready to Play', 'Catch honey, avoid bees, and chase your best streak!', '🍯', 'Start Adventure');
        this.updateStatus('Ready to play!');
        renderCritique(defaultCritique.summary, defaultCritique.bullets);

        window.addEventListener('resize', () => {
            this.resizeCanvas(true);
        });

        console.log('Game initialized successfully');
    },

    handleKeyDown: function(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
        if (e.key === ' ') {
            e.preventDefault();
            Game.togglePause();
        }
        if (e.key === 'r' || e.key === 'R') {
            Game.reset();
        }
    },

    handleKeyUp: function(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    },

    handleTouch: function(e) {
        if (gameState !== 'playing') return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        player.x = touch.clientX - rect.left - player.width / 2;
        player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    },

    setDifficulty: function(level) {
        difficulty = level;
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`[data-diff="${level}"]`);
        if (btn) btn.classList.add('active');
        try {
            localStorage.setItem('hundredAcres.difficulty', level);
        } catch {}
        console.log('Difficulty set to:', level);
    },

    start: function() {
        if (gameState === 'playing') return;

        // On mobile, automatically jump into fullscreen game view
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
        if (isMobile && !mobileFullscreenActive && !document.fullscreenElement) {
            // Safe to call here – toggleMobileFullscreen is defined above,
            // and Game exists at this point.
            toggleMobileFullscreen();
        }

        gameState = 'playing';
        primeMusicPlayback();
        score = 0;
        honeyCollected = 0;
        combo = 0;
        lives = 3;
        beeHits = 0;
        runBestCombo = 0;
        hitFlash = 0;
        timeLeft = 60;
        drops = [];
        bees = [];
        sparkles = [];
        powerups = [];
        activeEffects.shield = false;
        activeEffects.magnetUntil = 0;
        activeEffects.doubleUntil = 0;

        this.hideOverlay();
        this.updateDisplay();
        this.startLoops();
        this.updateStatus('Go! Catch the honey!');
        renderCritique('Honey run underway', [
            'Keep moving under honey pots to raise your score.',
            'Dodge bees or grab a shield power-up when one appears.'
        ]);

        console.log('Game started');
    },

    startLoops: function() {
        this.clearIntervals();
        // Use requestAnimationFrame for smooth loop
        const tick = () => {
            this.loop();
            rafId = requestAnimationFrame(tick);
        };
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(tick);

        timerInterval = setInterval(() => {
            if (gameState !== 'playing') return;
            timeLeft--;
            document.getElementById('time').textContent = timeLeft;
            if (timeLeft <= 0) {
                this.end();
            }
        }, 1000);

        this.startSpawners();
    },

    startSpawners: function() {
        const diff = difficulties[difficulty];
        this.clearSpawnerIntervals();

        dropInterval = setInterval(() => {
            if (gameState !== 'playing') return;
            drops.push({
                x: Math.random() * (canvas.width - 20),
                y: -20,
                width: 20,
                height: 30,
                speed: diff.dropSpeed,
                value: diff.dropValue,
                type: 'honey'
            });
        }, diff.dropFreq);

        beeInterval = setInterval(() => {
            if (gameState !== 'playing') return;
            bees.push({
                x: Math.random() * (canvas.width - 30),
                y: -30,
                width: 30,
                height: 25,
                speed: diff.beeSpeed,
                type: 'bee'
            });
        }, diff.beeFreq);

        powerInterval = setInterval(() => {
            if (gameState !== 'playing') return;
            if (Math.random() < 0.2) this.spawnPowerup();
        }, 4000);
    },

    clearSpawnerIntervals: function() {
        if (dropInterval) clearInterval(dropInterval);
        if (beeInterval) clearInterval(beeInterval);
        if (powerInterval) clearInterval(powerInterval);
    },

    clearIntervals: function() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        if (timerInterval) clearInterval(timerInterval);
        this.clearSpawnerIntervals();
    },

    togglePause: function() {
        if (gameState === 'playing') {
            this.pause();
        } else if (gameState === 'paused') {
            this.resume();
        }
    },

    pause: function() {
        if (gameState !== 'playing') return;
        gameState = 'paused';
        this.clearIntervals();
        this.showOverlay('Game Paused', 'Take a breather then keep catching honey!', '⏸', 'Continue');
        this.updateStatus('Paused');
    },

    resume: function() {
        if (gameState !== 'paused') return;
        gameState = 'playing';
        this.hideOverlay();
        this.startLoops();
        this.updateStatus('Back to the adventure!');
    },

    reset: function() {
        gameState = 'idle';
        this.clearIntervals();

        score = 0;
        honeyCollected = 0;
        combo = 0;
        lives = 3;
        timeLeft = 60;
        drops = [];
        bees = [];
        sparkles = [];
        powerups = [];
        activeEffects.shield = false;
        activeEffects.magnetUntil = 0;
        activeEffects.doubleUntil = 0;

        player.x = canvas.width / 2 - player.width / 2;
        player.y = canvas.height - player.height - 18;

        this.updateDisplay();
        this.draw();
        this.showOverlay('Reset & Ready', 'Press start to begin a new honey run!', '🔄', 'Start Adventure');
        this.updateStatus('Ready to play!');
        renderCritique(defaultCritique.summary, defaultCritique.bullets);

        console.log('Game reset');
    },

    end: function() {
        gameState = 'over';
        this.clearIntervals();

        // Update best scores
        if (score > bestScore) {
            bestScore = score;
            document.getElementById('gameHighScore').textContent = bestScore;
            this.showAchievement('New High Score!');
        }
        if (honeyCollected > bestHoney) {
            bestHoney = honeyCollected;
            this.showAchievement('Most Honey Yet!');
        }

        if (combo > bestCombo) {
            bestCombo = combo;
            this.showAchievement('Sweetest Combo!');
        }

        this.saveBestStats();
        this.updateDisplay();
        this.showOverlay('Game Over', `Score: ${score}<br>Honey: ${honeyCollected}<br>Best Combo: x${bestCombo}`, '🐝', 'Play Again');
        this.updateStatus('Game over — try again!');
        const critique = this.buildRunCritique();
        renderCritique(critique.summary, critique.bullets);

        console.log('Game ended');
    },

    spawnPowerup: function() {
        const options = [
            { type: 'shield', color: '#64b5f6', symbol: '🛡️', note: 'Blocks one bee hit' },
            { type: 'magnet', color: '#e57373', symbol: '🧲', note: 'Pulls honey toward you' },
            { type: 'double', color: '#81c784', symbol: '2️⃣', note: 'Double honey points' }
        ];
        const pick = options[Math.floor(Math.random() * options.length)];

        powerups.push({
            x: Math.random() * (canvas.width - 26),
            y: -30,
            width: 26,
            height: 26,
            speed: 2.2,
            ...pick
        });
    },

    loop: function() {
        if (gameState !== 'playing') return;

        // Update player position based on keys
        if (keys.left) {
            player.x -= player.speed;
        }
        if (keys.right) {
            player.x += player.speed;
        }
        player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

        const now = Date.now();
        const magnetActive = activeEffects.magnetUntil > now;
        const doubleActive = activeEffects.doubleUntil > now;
        const playerCenter = player.x + player.width / 2;

        // Update drops
        for (let i = drops.length - 1; i >= 0; i--) {
            const drop = drops[i];
            drop.y += drop.speed;
            if (magnetActive) {
                const dropCenter = drop.x + drop.width / 2;
                drop.x += (playerCenter - dropCenter) * 0.03;
            }

            if (this.checkCollision(drop, player)) {
                const points = (drop.value || 10) * (doubleActive ? 2 : 1);
                score += points;
                honeyCollected++;
                combo++;
                runBestCombo = Math.max(runBestCombo, combo);
                bestCombo = Math.max(bestCombo, combo);
                sparkles.push({
                    x: drop.x + 10,
                    y: drop.y + 10,
                    life: 22
                });
                drops.splice(i, 1);
                if (combo > 0 && combo % 5 === 0) {
                    this.showAchievement(`${combo}x Combo!`);
                }
                this.updateDisplay();
            } else if (drop.y > canvas.height) {
                drops.splice(i, 1);
                combo = 0;
            }
        }

        // Update powerups
        for (let i = powerups.length - 1; i >= 0; i--) {
            const power = powerups[i];
            power.y += power.speed;

            if (this.checkCollision(power, player)) {
                this.activatePowerup(power);
                powerups.splice(i, 1);
                this.updateDisplay();
            } else if (power.y > canvas.height) {
                powerups.splice(i, 1);
            }
        }

        // Update bees
        for (let i = bees.length - 1; i >= 0; i--) {
            const bee = bees[i];
            bee.y += bee.speed;

            if (this.checkCollision(bee, player)) {
                if (activeEffects.shield) {
                    activeEffects.shield = false;
                    this.updateStatus('Shield blocked a bee!');
                } else {
                    beeHits++;
                    lives--;
                    combo = 0;
                }
                bees.splice(i, 1);
                hitFlash = 16;
                this.updateDisplay();

                if (lives <= 0) {
                    this.end();
                }
            } else if (bee.y > canvas.height) {
                bees.splice(i, 1);
            }
        }

        // Update sparkles
        sparkles.forEach((s, i) => {
            s.life--;
            s.y += 0.5;
            if (s.life <= 0) sparkles.splice(i, 1);
        });

        this.draw();
    },

    checkCollision: function(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
            obj1.x + obj1.width > obj2.x &&
            obj1.y < obj2.y + obj2.height &&
            obj1.y + obj1.height > obj2.y;
    },

    draw: function() {
        if (!ctx) return;

        // Cache and render the static background
        if (!bgCanvas) {
            bgCanvas = document.createElement('canvas');
            bgCtx = bgCanvas.getContext('2d');
        }
        if (bgCanvas.width !== canvas.width || bgCanvas.height !== canvas.height) {
            bgCanvas.width = canvas.width;
            bgCanvas.height = canvas.height;
            this.drawStaticBackground(bgCtx, bgCanvas.width, bgCanvas.height);
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bgCanvas, 0, 0);

        const time = Date.now();

        // Soft clouds with painted edges
        const drawCloud = (x, y, scale = 1, opacity = 0.9) => {
            ctx.save();
            ctx.globalAlpha = opacity;
            const cloudGradient = ctx.createLinearGradient(x, y - 24 * scale, x, y + 28 * scale);
            cloudGradient.addColorStop(0, '#ffffff');
            cloudGradient.addColorStop(1, '#e3f0ff');
            ctx.fillStyle = cloudGradient;
            ctx.beginPath();
            ctx.ellipse(x, y, 26 * scale, 18 * scale, 0, 0, Math.PI * 2);
            ctx.ellipse(x + 18 * scale, y - 8 * scale, 22 * scale, 16 * scale, 0, 0, Math.PI * 2);
            ctx.ellipse(x + 36 * scale, y + 2 * scale, 24 * scale, 17 * scale, 0, 0, Math.PI * 2);
            ctx.ellipse(x - 18 * scale, y + 4 * scale, 18 * scale, 14 * scale, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(193, 211, 233, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(x + 4 * scale, y + 6 * scale, 42 * scale, 26 * scale, 0, 0.15, Math.PI * 2.2);
            ctx.stroke();
            ctx.restore();
        };
        const cloudDrift = Math.sin(time / 3200) * 12;
        drawCloud(canvas.width * 0.22 + cloudDrift, canvas.height * 0.2, 1.12, 0.9);
        drawCloud(canvas.width * 0.55 - cloudDrift * 0.6, canvas.height * 0.14 + 6, 0.94, 0.78);
        drawCloud(canvas.width * 0.78 + cloudDrift * 0.4, canvas.height * 0.24, 1.26, 0.85);

        // Soft distant hills
        const backHill = ctx.createLinearGradient(0, canvas.height - 160, 0, canvas.height);
        backHill.addColorStop(0, '#b7d7a8');
        backHill.addColorStop(1, '#9cc38a');
        ctx.fillStyle = backHill;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 110);
        ctx.quadraticCurveTo(canvas.width * 0.25, canvas.height - 160, canvas.width * 0.55, canvas.height - 110);
        ctx.quadraticCurveTo(canvas.width * 0.8, canvas.height - 80, canvas.width, canvas.height - 120);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();

        const frontHill = ctx.createLinearGradient(0, canvas.height - 120, 0, canvas.height);
        frontHill.addColorStop(0, '#a3ce86');
        frontHill.addColorStop(1, '#7fb76c');
        ctx.fillStyle = frontHill;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 70);
        ctx.quadraticCurveTo(canvas.width * 0.22, canvas.height - 130, canvas.width * 0.5, canvas.height - 80);
        ctx.quadraticCurveTo(canvas.width * 0.78, canvas.height - 40, canvas.width, canvas.height - 75);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Ground & path
        const grassGradient = ctx.createLinearGradient(0, canvas.height - 60, 0, canvas.height);
        grassGradient.addColorStop(0, '#72a95c');
        grassGradient.addColorStop(1, '#5e924c');
        ctx.fillStyle = grassGradient;
        ctx.fillRect(0, canvas.height - 48, canvas.width, 48);

        const pathGradient = ctx.createLinearGradient(0, canvas.height - 70, 0, canvas.height);
        pathGradient.addColorStop(0, '#e2c9a5');
        pathGradient.addColorStop(1, '#c8a979');
        ctx.fillStyle = pathGradient;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 38);
        ctx.quadraticCurveTo(canvas.width * 0.25, canvas.height - 20, canvas.width * 0.5, canvas.height - 34);
        ctx.quadraticCurveTo(canvas.width * 0.75, canvas.height - 48, canvas.width, canvas.height - 30);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Storybook trees
        const drawTree = (x, height) => {
            ctx.save();
            ctx.fillStyle = '#5d4730';
            ctx.fillRect(x, canvas.height - height, 18, height - 26);
            const leafGradient = ctx.createLinearGradient(0, canvas.height - height, 0, canvas.height - height + 90);
            leafGradient.addColorStop(0, '#7dbd6a');
            leafGradient.addColorStop(1, '#5c9b52');
            ctx.fillStyle = leafGradient;
            ctx.beginPath();
            ctx.ellipse(x + 9, canvas.height - height + 14, 55, 38, 0, 0, Math.PI * 2);
            ctx.ellipse(x - 10, canvas.height - height + 36, 48, 32, 0, 0, Math.PI * 2);
            ctx.ellipse(x + 30, canvas.height - height + 40, 50, 30, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };
        drawTree(canvas.width * 0.14, 120);
        drawTree(canvas.width * 0.46, 140);
        drawTree(canvas.width * 0.78, 126);

        // Grass texture
        ctx.strokeStyle = 'rgba(63, 94, 51, 0.4)';
        ctx.lineWidth = 1.5;
        const sway = Math.sin(Date.now() / 600);
        for (let x = 8; x < canvas.width; x += 24) {
            ctx.beginPath();
            ctx.moveTo(x, canvas.height - 14);
            ctx.lineTo(x + 4, canvas.height - 24 - (Math.sin(x * 0.08 + Date.now() / 400) + sway) * 4);
            ctx.stroke();
        }

        // Player shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(player.x + 30, player.y + 104, 34, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        const bearLight = '#f8cf78';
        const bearShade = '#e2ad57';

        // Pooh ears with inner shading
        const earGradient = ctx.createLinearGradient(player.x + 12, player.y + 2, player.x + 48, player.y + 18);
        earGradient.addColorStop(0, bearLight);
        earGradient.addColorStop(1, bearShade);
        ctx.fillStyle = earGradient;
        ctx.beginPath();
        ctx.arc(player.x + 18, player.y + 10, 8, 0, Math.PI * 2);
        ctx.arc(player.x + 42, player.y + 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 239, 207, 0.7)';
        ctx.beginPath();
        ctx.arc(player.x + 18, player.y + 10, 4.5, 0, Math.PI * 2);
        ctx.arc(player.x + 42, player.y + 10, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Pooh head with softer muzzle
        const headGradient = ctx.createLinearGradient(player.x + 14, player.y + 2, player.x + 50, player.y + 44);
        headGradient.addColorStop(0, bearLight);
        headGradient.addColorStop(1, bearShade);
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(player.x + 30, player.y + 26, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f9dd98';
        ctx.beginPath();
        ctx.ellipse(player.x + 30, player.y + 30, 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Face
        ctx.fillStyle = '#2b1810';
        ctx.beginPath();
        ctx.arc(player.x + 23, player.y + 22, 3.2, 0, Math.PI * 2);
        ctx.arc(player.x + 37, player.y + 22, 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(player.x + 30, player.y + 28, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(player.x + 25, player.y + 20, 1.1, 0, Math.PI * 2);
        ctx.arc(player.x + 39, player.y + 20, 1.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(player.x + 30, player.y + 34, 8, 0, Math.PI);
        ctx.strokeStyle = '#2b1810';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Body + shirt
        ctx.fillStyle = bearLight;
        ctx.beginPath();
        ctx.roundRect(player.x + 10, player.y + 38, 40, 36, 10);
        ctx.fill();

        const shirtGradient = ctx.createLinearGradient(player.x + 10, player.y + 42, player.x + 50, player.y + 70);
        shirtGradient.addColorStop(0, '#f05b4c');
        shirtGradient.addColorStop(1, '#c4251f');
        ctx.fillStyle = shirtGradient;
        ctx.beginPath();
        ctx.roundRect(player.x + 8, player.y + 42, 44, 20, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(player.x + 12, player.y + 48);
        ctx.quadraticCurveTo(player.x + 30, player.y + 44, player.x + 48, player.y + 50);
        ctx.stroke();

        // Arms
        ctx.fillStyle = bearLight;
        ctx.beginPath();
        ctx.roundRect(player.x + 4, player.y + 46, 12, 14, 4);
        ctx.roundRect(player.x + 44, player.y + 46, 12, 14, 4);
        ctx.fill();

        // Woven honey basket
        const basketTopY = player.y + 66;
        const basketWidth = 64;
        const basketHeight = 36;
        const basketX = player.x - 2;
        const basketGradient = ctx.createLinearGradient(basketX, basketTopY, basketX, basketTopY + basketHeight);
        basketGradient.addColorStop(0, '#c89b5b');
        basketGradient.addColorStop(1, '#9c7446');
        ctx.fillStyle = basketGradient;
        ctx.beginPath();
        ctx.roundRect(basketX, basketTopY, basketWidth, basketHeight, 12);
        ctx.fill();

        // Basket weave
        ctx.strokeStyle = 'rgba(255, 236, 200, 0.5)';
        ctx.lineWidth = 3;
        for (let i = 6; i < basketWidth; i += 12) {
            ctx.beginPath();
            ctx.moveTo(basketX + i, basketTopY + 6);
            ctx.lineTo(basketX + i - 8, basketTopY + basketHeight - 8);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(86, 52, 24, 0.4)';
        for (let j = basketTopY + 10; j < basketTopY + basketHeight - 4; j += 10) {
            ctx.beginPath();
            ctx.moveTo(basketX + 6, j);
            ctx.quadraticCurveTo(basketX + basketWidth / 2, j + 4, basketX + basketWidth - 6, j);
            ctx.stroke();
        }

        // Basket rim & handle
        ctx.fillStyle = '#8b6439';
        ctx.beginPath();
        ctx.ellipse(player.x + 30, basketTopY + 4, 32, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#7b5734';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(player.x + 10, basketTopY + 8);
        ctx.quadraticCurveTo(player.x + 30, basketTopY - 18, player.x + 50, basketTopY + 8);
        ctx.stroke();
        ctx.strokeStyle = '#dcb07c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(player.x + 14, basketTopY + 6);
        ctx.quadraticCurveTo(player.x + 30, basketTopY - 10, player.x + 46, basketTopY + 6);
        ctx.stroke();

        // Honey drops
        drops.forEach(drop => {
            const honeyGlow = ctx.createRadialGradient(drop.x + 10, drop.y + 14, 2, drop.x + 10, drop.y + 14, 16);
            honeyGlow.addColorStop(0, 'rgba(244, 169, 68, 0.8)');
            honeyGlow.addColorStop(1, 'rgba(244, 169, 68, 0)');
            ctx.fillStyle = honeyGlow;
            ctx.beginPath();
            ctx.arc(drop.x + 10, drop.y + 14, 16, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f4a944';
            ctx.beginPath();
            ctx.ellipse(drop.x + 10, drop.y + 15, 10, 15, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff5d6';
            ctx.beginPath();
            ctx.ellipse(drop.x + 8, drop.y + 10, 3, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // Bees
        bees.forEach(bee => {
            // motion trail
            ctx.fillStyle = 'rgba(0,0,0,0.06)';
            ctx.beginPath();
            ctx.ellipse(bee.x + 8, bee.y + 12, 12, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f4a944';
            ctx.beginPath();
            ctx.roundRect(bee.x + 4, bee.y + 4, 24, 18, 6);
            ctx.fill();

            ctx.strokeStyle = '#2b1810';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bee.x + 10, bee.y + 5);
            ctx.lineTo(bee.x + 10, bee.y + 22);
            ctx.moveTo(bee.x + 17, bee.y + 5);
            ctx.lineTo(bee.x + 17, bee.y + 22);
            ctx.moveTo(bee.x + 24, bee.y + 5);
            ctx.lineTo(bee.x + 24, bee.y + 22);
            ctx.stroke();

            const wingGradient = ctx.createLinearGradient(bee.x + 8, bee.y - 2, bee.x + 22, bee.y + 10);
            wingGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            wingGradient.addColorStop(1, 'rgba(180, 220, 255, 0.5)');
            ctx.fillStyle = wingGradient;
            ctx.beginPath();
            ctx.ellipse(bee.x + 12, bee.y + 2, 10, 6, -0.35, 0, Math.PI * 2);
            ctx.ellipse(bee.x + 22, bee.y + 2, 10, 6, 0.35, 0, Math.PI * 2);
            ctx.fill();

            // stinger
            ctx.fillStyle = '#2b1810';
            ctx.beginPath();
            ctx.moveTo(bee.x + 28, bee.y + 12);
            ctx.lineTo(bee.x + 34, bee.y + 12);
            ctx.lineTo(bee.x + 28, bee.y + 16);
            ctx.closePath();
            ctx.fill();
        });

        // Power-ups
        powerups.forEach(power => {
            ctx.fillStyle = power.color;
            ctx.fillRect(power.x, power.y, power.width, power.height);
            ctx.fillStyle = 'white';
            ctx.font = '16px "Patrick Hand", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(power.symbol, power.x + power.width / 2, power.y + power.height / 2 + 1);
        });

        // Sparkles on honey catch
        sparkles.forEach(s => {
            const alpha = Math.max(0, s.life / 22);
            const radius = 10 + (22 - s.life) * 0.7;
            const gradient = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, radius);
            gradient.addColorStop(0, `rgba(255, 245, 214, ${alpha})`);
            gradient.addColorStop(0.4, `rgba(244, 169, 68, ${alpha * 0.9})`);
            gradient.addColorStop(1, 'rgba(244, 169, 68, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
            ctx.fill();
        });

        if (hitFlash > 0) {
            ctx.fillStyle = `rgba(211, 47, 47, ${Math.min(0.45, hitFlash / 20)})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            hitFlash--;
        }

        if (combo > 1) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(canvas.width / 2 - 70, 10, 140, 32);
            ctx.fillStyle = '#fffbe6';
            ctx.font = '18px "Patrick Hand", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Combo x${combo}`, canvas.width / 2, 32);
        }
    },

    drawStaticBackground: function(targetCtx, w, h) {
        if (!targetCtx) return;
        // Sky gradient with sunrise warmth
        const skyGradient = targetCtx.createLinearGradient(0, 0, 0, h);
        skyGradient.addColorStop(0, '#d9f1ff');
        skyGradient.addColorStop(0.28, '#addcff');
        skyGradient.addColorStop(0.62, '#7fc4ff');
        skyGradient.addColorStop(0.88, '#fbe7c8');
        targetCtx.fillStyle = skyGradient;
        targetCtx.fillRect(0, 0, w, h);

        // Sun glow + soft rays
        const sunX = w * 0.12;
        const sunY = h * 0.16;
        const sunGradient = targetCtx.createRadialGradient(sunX, sunY, 16, sunX, sunY, 110);
        sunGradient.addColorStop(0, 'rgba(255, 237, 185, 0.98)');
        sunGradient.addColorStop(0.45, 'rgba(255, 214, 143, 0.6)');
        sunGradient.addColorStop(1, 'rgba(255, 224, 153, 0)');
        targetCtx.fillStyle = sunGradient;
        targetCtx.beginPath();
        targetCtx.arc(sunX, sunY, 110, 0, Math.PI * 2);
        targetCtx.fill();

        for (let i = 0; i < 6; i++) {
            targetCtx.save();
            targetCtx.translate(sunX, sunY);
            targetCtx.rotate((Math.PI / 8) * i - 0.3);
            const rayGradient = targetCtx.createLinearGradient(0, 0, w * 0.32, 0);
            rayGradient.addColorStop(0, 'rgba(255, 236, 185, 0.22)');
            rayGradient.addColorStop(1, 'rgba(255, 236, 185, 0)');
            targetCtx.fillStyle = rayGradient;
            targetCtx.beginPath();
            targetCtx.moveTo(0, -12);
            targetCtx.lineTo(w * 0.32, -24);
            targetCtx.lineTo(w * 0.32, 28);
            targetCtx.closePath();
            targetCtx.fill();
            targetCtx.restore();
        }

        // Soft distant hills
        const backHill = targetCtx.createLinearGradient(0, h - 160, 0, h);
        backHill.addColorStop(0, '#b7d7a8');
        backHill.addColorStop(1, '#9cc38a');
        targetCtx.fillStyle = backHill;
        targetCtx.beginPath();
        targetCtx.moveTo(0, h - 110);
        targetCtx.quadraticCurveTo(w * 0.25, h - 160, w * 0.55, h - 110);
        targetCtx.quadraticCurveTo(w * 0.8, h - 80, w, h - 120);
        targetCtx.lineTo(w, h);
        targetCtx.lineTo(0, h);
        targetCtx.closePath();
        targetCtx.fill();

        const frontHill = targetCtx.createLinearGradient(0, h - 120, 0, h);
        frontHill.addColorStop(0, '#a3ce86');
        frontHill.addColorStop(1, '#7fb76c');
        targetCtx.fillStyle = frontHill;
        targetCtx.beginPath();
        targetCtx.moveTo(0, h - 70);
        targetCtx.quadraticCurveTo(w * 0.22, h - 130, w * 0.5, h - 80);
        targetCtx.quadraticCurveTo(w * 0.78, h - 40, w, h - 75);
        targetCtx.lineTo(w, h);
        targetCtx.lineTo(0, h);
        targetCtx.closePath();
        targetCtx.fill();

        // Ground & path
        const grassGradient = targetCtx.createLinearGradient(0, h - 60, 0, h);
        grassGradient.addColorStop(0, '#72a95c');
        grassGradient.addColorStop(1, '#5e924c');
        targetCtx.fillStyle = grassGradient;
        targetCtx.fillRect(0, h - 48, w, 48);

        const pathGradient = targetCtx.createLinearGradient(0, h - 70, 0, h);
        pathGradient.addColorStop(0, '#e2c9a5');
        pathGradient.addColorStop(1, '#c8a979');
        targetCtx.fillStyle = pathGradient;
        targetCtx.beginPath();
        targetCtx.moveTo(0, h - 38);
        targetCtx.quadraticCurveTo(w * 0.25, h - 20, w * 0.5, h - 34);
        targetCtx.quadraticCurveTo(w * 0.75, h - 48, w, h - 30);
        targetCtx.lineTo(w, h);
        targetCtx.lineTo(0, h);
        targetCtx.closePath();
        targetCtx.fill();

        // Trees
        const drawTree = (x, height) => {
            targetCtx.save();
            targetCtx.fillStyle = '#5d4730';
            targetCtx.fillRect(x, h - height, 18, height - 26);
            const leafGradient = targetCtx.createLinearGradient(0, h - height, 0, h - height + 90);
            leafGradient.addColorStop(0, '#7dbd6a');
            leafGradient.addColorStop(1, '#5c9b52');
            targetCtx.fillStyle = leafGradient;
            targetCtx.beginPath();
            targetCtx.ellipse(x + 9, h - height + 14, 55, 38, 0, 0, Math.PI * 2);
            targetCtx.ellipse(x - 10, h - height + 36, 48, 32, 0, 0, Math.PI * 2);
            targetCtx.ellipse(x + 30, h - height + 40, 50, 30, 0, 0, Math.PI * 2);
            targetCtx.fill();
            targetCtx.restore();
        };
        drawTree(w * 0.14, 120);
        drawTree(w * 0.46, 140);
        drawTree(w * 0.78, 126);

        // Grass texture
        targetCtx.strokeStyle = 'rgba(63, 94, 51, 0.4)';
        targetCtx.lineWidth = 1.5;
        for (let x = 8; x < w; x += 24) {
            targetCtx.beginPath();
            targetCtx.moveTo(x, h - 14);
            targetCtx.lineTo(x + 4, h - 24);
            targetCtx.stroke();
        }
    },

    updateDisplay: function() {
        bestHoney = Math.max(bestHoney, honeyCollected);
        bestCombo = Math.max(bestCombo, combo);
        document.getElementById('score').textContent = score;
        document.getElementById('honey').textContent = honeyCollected;
        document.getElementById('time').textContent = timeLeft;
        document.getElementById('combo').textContent = combo;
        document.getElementById('bestHoney').textContent = bestHoney;
        document.getElementById('bestCombo').textContent = bestCombo;
        document.getElementById('gameHighScore').textContent = bestScore;

        let heartsDisplay = '';
        for (let i = 0; i < lives; i++) {
            heartsDisplay += '❤️';
        }
        document.getElementById('lives').textContent = heartsDisplay || '💔';
    },



    updateStatus: function(message) {
        const badge = document.getElementById('statusBadge');
        if (badge) {
            badge.textContent = message;
        }
    },

    showOverlay: function(title, message, icon = '🍯', buttonText = 'Start') {
        if (!this.overlay) return;
        this.overlayTitle.textContent = title;
        this.overlayMessage.innerHTML = message;
        this.overlayIcon.textContent = icon;
        if (this.overlayButton) {
            this.overlayButton.textContent = buttonText;
            setTimeout(() => this.overlayButton.focus(), 0);
        }
        this.previouslyFocused = document.activeElement;
        this.overlay.classList.remove('hidden');
    },

    hideOverlay: function() {
        if (this.overlay) {
            this.overlay.classList.add('hidden');
            if (this.previouslyFocused && this.previouslyFocused.focus) {
                this.previouslyFocused.focus();
            }
        }
    },

    showAchievement: function(text) {
        const toast = document.getElementById('achievementToast');
        const detail = document.getElementById('achievementText');
        if (!toast || !detail) return;
        detail.textContent = text;
        const ariaLog = document.getElementById('gameAriaLog');
        if (ariaLog) ariaLog.textContent = `Achievement: ${text}`;
        toast.style.display = 'flex';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 2400);
    },

    activatePowerup: function(power) {
        switch (power.type) {
            case 'shield':
                activeEffects.shield = true;
                this.updateStatus('Shield ready for one bee!');
                break;
            case 'magnet':
                activeEffects.magnetUntil = Date.now() + 6000;
                this.updateStatus('Honey magnet active!');
                break;
            case 'double':
                activeEffects.doubleUntil = Date.now() + 6000;
                this.updateStatus('Double honey for 6s!');
                break;
        }
        this.showAchievement(power.note);
    },

    saveBestStats: function() {
        try {
            localStorage.setItem('hundredAcres.best', JSON.stringify({
                score: bestScore,
                honey: bestHoney,
                combo: bestCombo
            }));
        } catch (e) {
            console.warn('Unable to save best stats', e);
        }
    },

    loadBestStats: function() {
        try {
            const saved = localStorage.getItem('hundredAcres.best');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed.score === 'number') bestScore = parsed.score;
                if (parsed && typeof parsed.honey === 'number') bestHoney = parsed.honey;
                if (parsed && typeof parsed.combo === 'number') bestCombo = parsed.combo;
            }
            document.getElementById('gameHighScore').textContent = bestScore;
            document.getElementById('bestHoney').textContent = bestHoney;
            document.getElementById('bestCombo').textContent = bestCombo;
        } catch (e) {
            console.warn('No saved stats', e);
        }
    }
};

// ===== GUESTBOOK & PAGE INIT =====
document.addEventListener('DOMContentLoaded', () => {
    const wishesForm = document.getElementById('wishesForm');
    const wishFeedback = document.getElementById('wishFeedback');
    const wishesDisplay = document.getElementById('wishesDisplay');
    const wishesKey = 'hundredAcres.wishes';
    let wishes = [];

    const showWishFeedback = (msg, tone = 'info') => {
        if (!wishFeedback) return;
        wishFeedback.textContent = msg;
        wishFeedback.style.color = tone === 'error' ? '#d32f2f' : 'var(--pooh-red)';
    };

    const escapeHTML = (str) => {
        return str.replace(/[&<>"']/g, (m) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    };

    const renderWishes = () => {
        if (!wishesDisplay) return;
        wishesDisplay.innerHTML = '';
        if (!wishes.length) {
            wishesDisplay.innerHTML = '<div class="wish-empty">No wishes yet. Be the first to add one! ✨</div>';
            return;
        }

        [...wishes].reverse().forEach((wish) => {
            const card = document.createElement('div');
            card.className = 'wish-card';
            const date = new Date(wish.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            // Safer rendering for user content
            card.innerHTML = `
            <div class="wish-meta">💌 <span>${escapeHTML(wish.name)}</span> <span class="wish-time">${escapeHTML(date)}</span></div>
            <div class="wish-message">"${escapeHTML(wish.message)}"</div>
          `;
            wishesDisplay.appendChild(card);
        });
    };

    const saveWishes = () => {
        try {
            localStorage.setItem(wishesKey, JSON.stringify(wishes));
        } catch (e) {
            console.warn('Unable to save wishes', e);
        }
    };

    const loadWishes = () => {
        try {
            const saved = localStorage.getItem(wishesKey);
            if (saved) {
                wishes = JSON.parse(saved);
            }
            renderWishes();
        } catch (e) {
            console.warn('Unable to load wishes', e);
        }
    };

    if (wishesForm) {
        wishesForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = document.getElementById('guestName').value.trim();
            const message = document.getElementById('wishMessage').value.trim();

            if (!name || !message) {
                showWishFeedback('Please share both your name and wish.', 'error');
                return;
            }

            const entry = { name, message, timestamp: Date.now() };
            wishes.push(entry);
            saveWishes();
            renderWishes();
            showWishFeedback('Wish saved to the guestbook ✨');

            document.getElementById('guestName').value = '';
            document.getElementById('wishMessage').value = '';
        });
    }

    // Initialize everything
    loadWishes();
    updateNavigation();
    Game.init();
    Game.loadBestStats();
    initMobileOptimizations();

});

// === Enhanced Storybook Audio + Interaction Controller ===
(function() {
  'use strict';
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

  // Audio nodes
  const ambientForest = $('#ambientForest');
  const pageRustle1 = $('#pageRustle1');
  const pageRustle2 = $('#pageRustle2');
  const paperThump = $('#paperThump');
  const bgMusic = $('#bgMusic');

  // Controls
  const musicToggleBtn = $('#musicToggle');
  const nextBtn = $('#nextBtn');
  const prevBtn = $('#prevBtn');

  const SOUND_KEY = 'storybook.sound';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function safePlay(a){ if(!a) return; const p=a.play(); if(p&&p.catch) p.catch(()=>{}); }
  function safePause(a){ if(!a) return; try{ a.pause(); }catch(_){} }

  function isSoundOn(){ const v = localStorage.getItem(SOUND_KEY); return v === 'true'; }
  function setSoundOn(v){ try{ localStorage.setItem(SOUND_KEY, String(v)); }catch(_){} }

  function setVolumes(){
    if (bgMusic) bgMusic.volume = 0.18;
    if (ambientForest) ambientForest.volume = 0.12;
    if (pageRustle1) pageRustle1.volume = 0.5;
    if (pageRustle2) pageRustle2.volume = 0.5;
    if (paperThump) paperThump.volume = 0.4;
  }

  function applySoundState(){
    const on = isSoundOn();
    [pageRustle1,pageRustle2,paperThump].forEach(a=>{ if(a) a.muted = !on; });
    if (on){
      if (bgMusic){ bgMusic.muted = false; safePlay(bgMusic); }
      if (ambientForest){ ambientForest.muted = false; safePlay(ambientForest); }
      if (musicToggleBtn){ musicToggleBtn.setAttribute('aria-pressed','true'); musicToggleBtn.textContent = '🔊 Sound On'; }
    } else {
      safePause(bgMusic); safePause(ambientForest);
      if (musicToggleBtn){ musicToggleBtn.setAttribute('aria-pressed','false'); musicToggleBtn.textContent = '🔇 Music Off'; }
    }
  }

  function toggleSound(){ setSoundOn(!isSoundOn()); applySoundState(); }
  function randomRustle(){ safePlay(Math.random()<0.5?pageRustle1:pageRustle2); }

  function wireNav(){
    nextBtn?.addEventListener('click', ()=>{ if(!prefersReducedMotion && isSoundOn()) randomRustle(); });
    prevBtn?.addEventListener('click', ()=>{ if(!prefersReducedMotion && isSoundOn()) randomRustle(); });
    $$('.chapter-pill').forEach(btn=> btn.addEventListener('click', ()=>{ if(!prefersReducedMotion && isSoundOn()) randomRustle(); }));
  }

    function wireCharacters() {
        document.querySelectorAll('.clickable-character').forEach(fig => {
            fig.addEventListener('click', () => {
                const character = fig.dataset.character;
                const messageDiv = fig.querySelector('.character-message');

                const messages = {
                    pooh: "Oh, bother! I could use some help with this honey.",
                    piglet: "Oh d-d-dear! I hope Baby Gunnar likes the decorations.",
                    tigger: "Hoo-hoo-hoo! The wonderful thing about celebrations is they're wonderful!",
                    roo: "Look at me! I'm bouncing for Baby Gunnar!",
                    eeyore: "Thanks for noticing me. I suppose celebrations are nice... for some.",
                    owl: "Ahem! As I was saying, the proper protocol for infant welcoming ceremonies...",
                    gunnar: "Welcome to the world, little one!"
                };

                if (messageDiv && messages[character]) {
                    messageDiv.textContent = messages[character];
                    setTimeout(() => {
                        messageDiv.textContent = '';
                    }, 3000);
                }

                if (isSoundOn()) safePlay(paperThump);
                fig.style.transform = 'scale(0.98)';
                setTimeout(() => { fig.style.transform = 'scale(1)'; }, 140);
            });
        });
    }

  function duckAmbient(on){
    if (ambientForest) ambientForest.volume = on ? 0.03 : 0.12;
    if (bgMusic) bgMusic.volume = on ? 0.06 : 0.18;
  }

  function wireGame(){
    $('#startBtn')?.addEventListener('click', ()=> duckAmbient(true));
    $('#pauseBtn')?.addEventListener('click', ()=> duckAmbient(false));
    $('#resetBtn')?.addEventListener('click', ()=> duckAmbient(false));
  }

  function init(){
    setVolumes();
    // Sync with existing music toggle: act as global sound switch
    musicToggleBtn?.addEventListener('click', (e)=>{ e.preventDefault(); toggleSound(); });
    // If original music setting is stored, initialize accordingly
    if (localStorage.getItem(SOUND_KEY) === null) {
      // derive from existing music flag if set
      const musicFlag = localStorage.getItem('hundredAcres.music');
      setSoundOn(musicFlag === 'on');
    }
    applySoundState();
    wireNav();
    wireCharacters();
    wireGame();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
