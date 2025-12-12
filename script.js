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
        honey: 'Images/Characters/honey.png'
    };

    Object.keys(paths).forEach((key) => {
        const img = new Image();
        img.src = paths[key];
        img.onload = () => {
            console.log(`Loaded sprite: ${key}`);
            // Update character cards with actual images once loaded
            updateCharacterCardImages(); // ADD THIS LINE
        };
        img.onerror = () => {
            console.warn(`Failed to load sprite: ${key}`);
            // Use fallback icon
        };
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
        // Character data - enhanced with more details (ADD THIS SECTION)
const characterData = {
    pooh: {
        name: 'Winnie the Pooh',
        fullName: 'Winnie-the-Pooh',
        quote: '"A little Consideration, a little Thought for Others, makes all the difference."',
        icon: 'fas fa-bear',
        color: '#FFB347',
        bgColor: '#FFF3E0',
        role: 'Honey Keeper & Chief Hug Officer',
        bio: 'Our thoughtful, honey-loving friend has volunteered to be in charge of all honey jars, gentle hugs, and quiet snuggles. He is quite certain Baby Gunner will need all three in generous amounts.',
        funFact: 'Pooh\'s favorite snack is, of course, honey! He can identify different flower varieties by their honey flavor.',
        voiceSample: 'Oh bother! I mean... oh, wonderful! A new friend to share honey with!',
        responsibilities: ['Honey distribution', 'Comfort snuggles', 'Bedtime stories'],
        image: 'Images/Characters/honey-bear.png'
    },
    piglet: {
        name: 'Piglet',
        fullName: 'Piglet',
        quote: '"It is hard to be brave, when you\'re only a Very Small Animal — but I\'ll do it for Baby Gunner."',
        icon: 'fas fa-heart',
        color: '#FFB6C1',
        bgColor: '#FFF0F5',
        role: 'Cozy Coordinator',
        bio: 'Our very small but very brave friend has carefully arranged all the soft blankets, tiny clothes, and cozy corners. He\'s making sure everything feels safe, warm, and just right for someone very small.',
        funFact: 'Despite his size, Piglet has the biggest heart in the Hundred Acre Wood. He notices when anyone needs an extra blanket or a kind word.',
        voiceSample: 'Oh d-d-dear! I mean... oh goodness! Everything must be just perfect for Baby Gunner!',
        responsibilities: ['Blanket organization', 'Safety checks', 'Comfort monitoring'],
        image: 'Images/Characters/piglet.png'
    },
    tigger: {
        name: 'Tigger',
        fullName: 'Tigger',
        quote: '"The wonderful thing about babies is that babies are wonderful things!"',
        icon: 'fas fa-paw',
        color: '#FF8C42',
        bgColor: '#FFECB3',
        role: 'Head of Games & Giggles',
        bio: 'Our bouncy, trouncy friend is in charge of all games, giggles, and any moment that calls for a bounce. He\'s especially excited about showing everyone how to make Baby Gunner smile.',
        funFact: 'Tigger has invented three new baby-friendly bounces that are gentle enough for the tiniest of tiggers.',
        voiceSample: 'Hoo-hoo-hoo! That\'s what Tiggers do best—make babies giggle!',
        responsibilities: ['Entertainment', 'Giggle induction', 'Gentle bouncing'],
        image: 'Images/Characters/tigger.png'
    },
    eeyore: {
        name: 'Eeyore',
        fullName: 'Eeyore',
        quote: '"Not much of a tail, but it\'s my tail. And this is our baby, and that\'s rather special."',
        icon: 'fas fa-cloud',
        color: '#C0C0C0',
        bgColor: '#F5F5F5',
        role: 'Quiet Moments Director',
        bio: 'Our thoughtful friend has quietly found the best spot for photos, the coziest places for naps, and the perfect moments for quiet reflection. He is making sure there\'s always a comfortable place to simply be together.',
        funFact: 'Eeyore built a special "quiet corner" with just the right amount of shade and a view of the butterflies.',
        voiceSample: 'Thanks for noticing me... and the baby. The baby is worth noticing.',
        responsibilities: ['Photo spots', 'Quiet corners', 'Reflection time'],
        image: 'Images/Characters/eeyore.png'
    },
    owl: {
        name: 'Owl',
        fullName: 'Owl',
        quote: '"Wisdom begins with wonder, and what is more wonderful than a new beginning?"',
        icon: 'fas fa-feather-alt',
        color: '#8B4513',
        bgColor: '#F5F5DC',
        role: 'Official Historian & Storyteller',
        bio: 'Our wisest friend is recording all the special moments in his finest scrolls. He\'s also prepared stories about friendship, courage, and the importance of being yourself.',
        funFact: 'Owl has written a special welcome poem for Baby Gunner, complete with illustrations.',
        voiceSample: 'Ahem! According to my extensive research, babies require approximately 14-17 hours of sleep per day!',
        responsibilities: ['Memory keeping', 'Storytelling', 'Official announcements'],
        image: 'Images/Characters/owl.png'
    },
    roo: {
        name: 'Roo',
        fullName: 'Roo',
        quote: '"I can\'t wait to show Baby Gunner how to hop! Well, maybe in a little while."',
        icon: 'fas fa-child',
        color: '#87CEEB',
        bgColor: '#E0F7FA',
        role: 'Junior Welcomer',
        bio: 'Our youngest friend is very excited to meet someone closer to his size! He\'s practicing being gentle and has collected some of his favorite soft toys to share.',
        funFact: 'Roo has been practicing his "inside voice" for weeks in preparation.',
        voiceSample: 'Look, Mama! A baby! Can we play gentle games?',
        responsibilities: ['Toy sharing', 'Gentle play demonstrations', 'Welcome committee'],
        image: 'Images/Characters/roo.png'
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
// CHARACTERS SECTION - ENHANCED
// ========================================================================

function initCharactersSection() {
    const charactersContainer = $('#charactersGrid');
    if (!charactersContainer) return;

    // Clear existing placeholder content
    charactersContainer.innerHTML = '';

    // Create character cards
    Object.keys(characterData).forEach((key, index) => {
        const character = characterData[key];
        const card = document.createElement('div');
        card.className = 'character-card';
        card.setAttribute('data-character', key);
        card.style.setProperty('--card-index', index);
        card.style.borderColor = character.color;
        
        // Add hover effect
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
            card.style.boxShadow = `0 15px 30px rgba(${hexToRgb(character.color)}, 0.2)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
        });

        // Card content
        card.innerHTML = `
            <div class="character-card-header" style="background: ${character.bgColor}">
                <div class="character-icon" style="color: ${character.color}">
                    <i class="${character.icon}"></i>
                </div>
                <div class="character-image-placeholder">
                    <div class="character-silhouette" style="background: ${character.color}"></div>
                </div>
            </div>
            <div class="character-card-body">
                <h3 class="character-name">${character.name}</h3>
                <p class="character-role" style="color: ${character.color}">${character.role}</p>
                <p class="character-quote">${character.quote}</p>
                <div class="character-responsibilities">
                    ${character.responsibilities.map(resp => 
                        `<span class="responsibility-tag" style="background: ${character.bgColor}; color: ${character.color}">${resp}</span>`
                    ).join('')}
                </div>
            </div>
            <div class="character-card-footer">
                <button class="btn-character-info" onclick="showCharacterModal('${key}')" 
                        style="background: ${character.color}">
                    <i class="fas fa-info-circle"></i> Learn More
                </button>
                <button class="btn-character-voice" onclick="playCharacterVoice('${key}')"
                        style="border-color: ${character.color}; color: ${character.color}">
                    <i class="fas fa-volume-up"></i> Hear Voice
                </button>
            </div>
        `;

        charactersContainer.appendChild(card);
    });

    // Add section introduction
    const intro = document.createElement('div');
    intro.className = 'characters-intro';
    intro.innerHTML = `
        <h2><i class="fas fa-users"></i> Meet Your Hundred Acre Hosts</h2>
        <p>Each friend has volunteered for special duties to make Baby Gunner's celebration perfect. 
        Click on any character to learn more about their role!</p>
    `;
    charactersContainer.parentElement.insertBefore(intro, charactersContainer);

    // Add interactive tutorial
    setTimeout(() => {
        const tutorial = document.createElement('div');
        tutorial.className = 'characters-tutorial';
        tutorial.innerHTML = `
            <div class="tutorial-content">
                <i class="fas fa-mouse-pointer"></i>
                <span>Hover over cards for details • Click "Learn More" for full bios</span>
            </div>
        `;
        charactersContainer.parentElement.appendChild(tutorial);
        
        // Remove tutorial after 8 seconds
        setTimeout(() => {
            tutorial.style.opacity = '0';
            tutorial.style.transform = 'translateY(-10px)';
            setTimeout(() => tutorial.remove(), 500);
        }, 8000);
    }, 1000);
}

function updateCharacterCardImages() {
    $$('.character-card').forEach(card => {
        const characterKey = card.getAttribute('data-character');
        const sprite = Sprites[characterKey];
        const imagePlaceholder = card.querySelector('.character-image-placeholder');
        
        if (sprite && sprite.complete && sprite.naturalWidth && imagePlaceholder) {
            // Replace placeholder with actual image
            imagePlaceholder.innerHTML = '';
            const img = document.createElement('img');
            img.src = sprite.src;
            img.alt = characterData[characterKey].name;
            img.className = 'character-portrait';
            imagePlaceholder.appendChild(img);
            
            // Add loaded class for animation
            setTimeout(() => {
                img.classList.add('loaded');
            }, 100);
        }
    });
}

// Helper function to convert hex to rgb
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
        : '255, 180, 71';
}

// ========================================================================
// ENHANCED CHARACTER MODAL
// ========================================================================

function initCharacterModal() {
    const characterModal = $('#characterModal');
    const closeCharacterModalBtn = $('#closeCharacterModal');
    const modalCharacterIcon = $('#modalCharacterIcon');
    const modalCharacterTitle = $('#characterModalTitle');
    const modalCharacterQuote = $('#modalCharacterQuote');
    const modalCharacterBio = $('#modalCharacterBio');
    const modalCharacterDetails = $('#modalCharacterDetails');

    if (!characterModal) return;

    // Close modal handlers
    if (closeCharacterModalBtn) {
        closeCharacterModalBtn.addEventListener('click', () => {
            characterModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    characterModal.addEventListener('click', (ev) => {
        if (ev.target === characterModal) {
            characterModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Escape key to close modal
    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && characterModal.classList.contains('active')) {
            characterModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Global function to show modal - REPLACE THE EXISTING VERSION
    window.showCharacterModal = function (key) {
        const data = characterData[key];
        if (!data || !characterModal) return;

        // Prevent background scrolling
        document.body.style.overflow = 'hidden';

        // Update modal content
        modalCharacterIcon.innerHTML = `<i class="${data.icon}"></i>`;
        modalCharacterIcon.className = `modal-character-icon ${key}-icon-modal`;
        modalCharacterIcon.style.background = data.bgColor;
        modalCharacterIcon.style.color = data.color;

        modalCharacterTitle.textContent = data.name;
        modalCharacterTitle.style.color = data.color;

        if (modalCharacterQuote) {
            modalCharacterQuote.textContent = data.quote;
            modalCharacterQuote.style.borderLeftColor = data.color;
        }

        if (modalCharacterBio) {
            modalCharacterBio.textContent = data.bio;
        }

        // Enhanced details section
        if (modalCharacterDetails) {
            modalCharacterDetails.innerHTML = `
                <div class="modal-details-grid">
                    <div class="detail-item">
                        <h4><i class="fas fa-id-badge"></i> Full Name</h4>
                        <p>${data.fullName}</p>
                    </div>
                    <div class="detail-item">
                        <h4><i class="fas fa-tasks"></i> Role</h4>
                        <p>${data.role}</p>
                    </div>
                    <div class="detail-item">
                        <h4><i class="fas fa-lightbulb"></i> Fun Fact</h4>
                        <p>${data.funFact}</p>
                    </div>
                    <div class="detail-item">
                        <h4><i class="fas fa-volume-up"></i> Voice Sample</h4>
                        <p class="voice-sample">"${data.voiceSample}"</p>
                    </div>
                </div>
                <div class="modal-responsibilities">
                    <h4><i class="fas fa-clipboard-check"></i> Responsibilities</h4>
                    <div class="responsibilities-list">
                        ${data.responsibilities.map(resp => 
                            `<span class="modal-responsibility-tag" style="background: ${data.bgColor}; color: ${data.color}">
                                <i class="fas fa-check-circle"></i> ${resp}
                            </span>`
                        ).join('')}
                    </div>
                </div>
            `;
        }

        // Update modal background color
        characterModal.style.setProperty('--character-color', data.color);
        characterModal.style.setProperty('--character-bg-color', data.bgColor);

        // Show modal with animation
        characterModal.classList.add('active');
        
        // Add entrance animation to modal content
        setTimeout(() => {
            const modalContent = characterModal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.classList.add('animate-in');
            }
        }, 10);
    };

    // Character voice playback - NEW FUNCTION
    window.playCharacterVoice = function (key) {
        const data = characterData[key];
        if (!data) return;

        // Create audio context for simple tones (or use pre-recorded samples if available)
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const audioContext = new AudioContext();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Different tones for different characters
                let frequencies = [];
                switch(key) {
                    case 'pooh': frequencies = [262, 330, 392]; break; // C, E, G
                    case 'piglet': frequencies = [523, 659, 784]; break; // High C, E, G
                    case 'tigger': frequencies = [392, 494, 587]; break; // G, B, D
                    case 'eeyore': frequencies = [220, 262, 330]; break; // Low A, C, E
                    default: frequencies = [330, 392, 494]; // Middle range
                }
                
                const now = audioContext.currentTime;
                oscillator.frequency.setValueAtTime(frequencies[0], now);
                oscillator.frequency.setValueAtTime(frequencies[1], now + 0.1);
                oscillator.frequency.setValueAtTime(frequencies[2], now + 0.2);
                
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                
                oscillator.start();
                oscillator.stop(now + 0.5);
                
                // Visual feedback
                const card = document.querySelector(`.character-card[data-character="${key}"]`);
                if (card) {
                    card.style.animation = 'pulse-glow 0.5s ease-in-out';
                    setTimeout(() => {
                        card.style.animation = '';
                    }, 500);
                }
            }
        } catch (err) {
            console.log('Audio context not available:', err);
            // Fallback: Show voice sample in alert
            alert(`${data.name} says:\n\n"${data.voiceSample}"`);
        }
    };
}

// ========================================================================
// CHARACTERS SECTION ANIMATIONS
// ========================================================================

function initCharacterAnimations() {
    // Add scroll animations for characters section
    const charactersSection = $('#characters');
    if (!charactersSection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add animation class to all character cards
                $$('.character-card').forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.add('animate-in');
                    }, index * 100);
                });
                
                // Add sparkle effect
                createCharacterSparkles();
                
                // Unobserve after animation
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    observer.observe(charactersSection);
}

function createCharacterSparkles() {
    const container = $('#charactersGrid');
    if (!container) return;

    // Create sparkles around the grid
    for (let i = 0; i < 15; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'character-sparkle';
        sparkle.style.cssText = `
            position: absolute;
            width: 6px;
            height: 6px;
            background: #FFD700;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1;
            opacity: 0;
            animation: sparkle-fall ${1 + Math.random() * 2}s ease-in forwards;
            animation-delay: ${Math.random() * 1.5}s;
            left: ${Math.random() * 100}%;
            top: -20px;
        `;
        
        // Add keyframes for sparkle animation
        const style = document.createElement('style');
        if (!document.querySelector('#sparkle-keyframes')) {
            style.id = 'sparkle-keyframes';
            style.textContent = `
                @keyframes sparkle-fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 0.7; }
                    100% { transform: translateY(100px) rotate(180deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        container.appendChild(sparkle);
        
        // Remove sparkle after animation
        setTimeout(() => {
            sparkle.remove();
        }, 3000);
    }
}
    function addCharactersCSS() {
    const style = document.createElement('style');
    style.textContent = `
        /* Characters Section Styles */
        .characters-intro {
            text-align: center;
            margin-bottom: 3rem;
            padding: 0 1rem;
        }
        
        .characters-intro h2 {
            color: #8B4513;
            font-size: 2.5rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        
        .characters-intro p {
            color: #666;
            font-size: 1.1rem;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.6;
        }
        
        .characters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            padding: 1rem;
        }
        
        .character-card {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            border: 3px solid;
            position: relative;
        }
        
        .character-card-header {
            padding: 1.5rem;
            text-align: center;
            position: relative;
            min-height: 180px;
        }
        
        .character-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        
        .character-image-placeholder {
            width: 120px;
            height: 120px;
            margin: 0 auto;
            position: relative;
        }
        
        .character-silhouette {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            opacity: 0.2;
        }
        
        .character-portrait {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 50%;
            opacity: 0;
            transition: opacity 0.5s ease;
        }
        
        .character-portrait.loaded {
            opacity: 1;
        }
        
        .character-card-body {
            padding: 1.5rem;
        }
        
        .character-name {
            color: #333;
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }
        
        .character-role {
            font-weight: 600;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .character-quote {
            color: #666;
            font-style: italic;
            margin-bottom: 1.5rem;
            line-height: 1.5;
            border-left: 3px solid;
            padding-left: 1rem;
        }
        
        .character-responsibilities {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 1rem;
        }
        
        .responsibility-tag {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .character-card-footer {
            padding: 1rem 1.5rem;
            background: rgba(0,0,0,0.02);
            border-top: 1px solid rgba(0,0,0,0.1);
            display: flex;
            gap: 0.75rem;
        }
        
        .btn-character-info, .btn-character-voice {
            padding: 0.5rem 1rem;
            border-radius: 25px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            flex: 1;
            justify-content: center;
        }
        
        .btn-character-info:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .btn-character-voice {
            background: transparent;
            border: 2px solid;
        }
        
        .btn-character-voice:hover {
            background: rgba(0,0,0,0.05);
        }
        
        /* Character Modal Styles */
        .modal-character-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            margin: 0 auto 1.5rem;
        }
        
        .modal-details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        
        .detail-item h4 {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .detail-item p {
            color: #333;
            line-height: 1.5;
        }
        
        .voice-sample {
            font-style: italic;
            color: #666;
            background: rgba(0,0,0,0.03);
            padding: 0.75rem;
            border-radius: 8px;
            border-left: 3px solid;
        }
        
        .modal-responsibilities {
            margin-top: 2rem;
        }
        
        .modal-responsibilities h4 {
            color: #666;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .responsibilities-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
        }
        
        .modal-responsibility-tag {
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        /* Tutorial */
        .characters-tutorial {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 25px;
            margin: 2rem auto;
            max-width: 400px;
            text-align: center;
            animation: float 3s ease-in-out infinite;
            transition: all 0.5s ease;
        }
        
        .tutorial-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            font-size: 0.9rem;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .characters-grid {
                grid-template-columns: 1fr;
                gap: 1.5rem;
            }
            
            .character-card-footer {
                flex-direction: column;
            }
            
            .modal-details-grid {
                grid-template-columns: 1fr;
            }
        }
        
        @media (max-width: 480px) {
            .characters-intro h2 {
                font-size: 2rem;
            }
            
            .character-card {
                margin: 0 0.5rem;
            }
        }
    `;
    document.head.appendChild(style);
}
    // ========================================================================
    // BOOTSTRAP
    // ========================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadSprites();
    injectExtraKeyframes();
    initBaseUI();
    initCharactersSection();      // ADD THIS LINE
    initCharacterModal();         // ADD THIS LINE
    initCharacterAnimations();    // ADD THIS LINE
    initDefenseGame();
    initHoneyCatchGame();
    
    addCharactersCSS();           // ADD THIS LINE (see CSS below)
});
})();
