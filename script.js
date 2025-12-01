// script.js - Complete externalized JavaScript for Hundred Acre Celebration

document.addEventListener('DOMContentLoaded', function() {
    // Base elements
    const body = document.body;
    const storybookCover = document.getElementById('storybookCover');
    const openBookBtn = document.getElementById('openBookBtn');
    const storybook = document.getElementById('storybook');
    const contentSections = document.querySelectorAll('.content-section');
    const scrollAnimateElements = document.querySelectorAll('.scroll-animate');
    const navItems = document.querySelectorAll('.nav-item');
    const navMenu = document.getElementById('navMenu');
    const navToggle = document.getElementById('navToggle');
    const loadingScreen = document.getElementById('loadingScreen');
    const readingProgress = document.getElementById('readingProgress');
    const scrollTopFab = document.getElementById('scrollTopFab');
    const scrollRsvpFab = document.getElementById('scrollRsvpFab');
    const musicToggle = document.getElementById('musicToggle');
    const motionToggle = document.getElementById('motionToggle');
    const rsvpForm = document.getElementById('rsvpForm');
    const rsvpStatus = document.getElementById('rsvpStatus');
    const bgMusic = document.getElementById('bgMusic');
    const persistentRsvpBtn = document.getElementById('persistentRsvpBtn');

    // Character modal elements
    const characterModal = document.getElementById('characterModal');
    const closeCharacterModalBtn = document.getElementById('closeCharacterModal');
    const modalCharacterIcon = document.getElementById('modalCharacterIcon');
    const modalCharacterTitle = document.getElementById('characterModalTitle');
    const modalCharacterQuote = document.getElementById('modalCharacterQuote');
    const modalCharacterBio = document.getElementById('modalCharacterBio');

    // Game instruction modal elements
    const gameInstructionModal = document.getElementById('gameInstructionModal');
    const closeGameModal = document.getElementById('closeGameModal');
    const gameInstructionTitle = document.getElementById('gameInstructionTitle');
    const gameInstructionList = document.getElementById('gameInstructionList');

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

    // Game instructions
    const gameInstructions = {
        catch: {
            title: "Honey Pot Catch - How to Play",
            instructions: [
                "Use LEFT and RIGHT arrow keys to move Pooh",
                "Catch falling honey pots to earn points (+10 points each)",
                "Avoid the bees! Each bee sting costs one life",
                "You start with 3 lives - don't lose them all!",
                "Game lasts 60 seconds - catch as much honey as you can!",
                "On mobile: Use the left/right buttons below the game"
            ]
        },
        defense: {
            title: "Honey Hive Defense - How to Play",
            instructions: [
                "Select a tower type by clicking on the character icons",
                "Click on empty grass areas to place towers (costs honey)",
                "Towers automatically attack Heffalumps, Woozles, and Bees",
                "Each enemy type has different health and speed",
                "Upgrade towers to increase damage and range",
                "Start waves manually - enemies get tougher each wave",
                "Protect your honey pot at the end of the path!",
                "Game over if you lose all 10 lives"
            ]
        }
    };

    // Utility Functions
    function safeHideLoading() {
        if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
            loadingScreen.classList.add('hidden');
        }
    }

    // Main Initialization
    function init() {
        try {
            setupEventListeners();
            setupSectionObserver();
            checkScrollAnimations();
            initReduceMotionPreference();
            initMusicPreference();
            setupFullscreenToggle();
            checkExistingRSVP();

            // Enhanced loading sequence with animation
            setTimeout(() => {
                safeHideLoading();
                // Add animation class to sections after loading
                setTimeout(() => {
                    document.querySelectorAll('.content-section').forEach((section, index) => {
                        setTimeout(() => {
                            section.classList.add('animate-in');
                        }, index * 200);
                    });
                }, 300);
            }, 1000);
        } catch (err) {
            console.error('Init error:', err);
            safeHideLoading();
        }
    }

    // Event Listeners Setup
    function setupEventListeners() {
        // Storybook controls
        openBookBtn.addEventListener('click', openStorybook);

        // Navigation
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navMenu.classList.remove('open');
            });
        });

        // Scroll events
        window.addEventListener('scroll', checkScrollAnimations);
        window.addEventListener('scroll', updateReadingProgress);

        // FAB controls
        scrollTopFab.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        scrollRsvpFab.addEventListener('click', () => {
            const rsvp = document.getElementById('rsvp');
            if (rsvp) {
                rsvp.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });

        // Persistent RSVP button
        if (persistentRsvpBtn) {
            persistentRsvpBtn.addEventListener('click', () => {
                document.getElementById('rsvp').scrollIntoView({
                    behavior: 'smooth'
                });
            });
        }

        // Music controls
        musicToggle.addEventListener('click', toggleMusic);

        // Motion controls
        motionToggle.addEventListener('click', toggleReduceMotion);

        // RSVP Form
        if (rsvpForm) {
            rsvpForm.addEventListener('submit', handleRsvpSubmit);
        }

        // Character modal
        closeCharacterModalBtn.addEventListener('click', () => {
            characterModal.classList.remove('active');
        });
        characterModal.addEventListener('click', (e) => {
            if (e.target === characterModal) {
                characterModal.classList.remove('active');
            }
        });

        // Game instruction modal
        closeGameModal.addEventListener('click', () => {
            gameInstructionModal.classList.remove('active');
        });
        gameInstructionModal.addEventListener('click', (e) => {
            if (e.target === gameInstructionModal) {
                gameInstructionModal.classList.remove('active');
            }
        });

        // Mobile game controls
        const mobileLeftBtn = document.getElementById('mobileLeftBtn');
        const mobileRightBtn = document.getElementById('mobileRightBtn');

        if (mobileLeftBtn && mobileRightBtn) {
            mobileLeftBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (window.gameRunning && window.poohX > 40) {
                    window.poohX -= 20;
                }
            });
            
            mobileRightBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (window.gameRunning && window.poohX < window.honeyCanvas.width - 40) {
                    window.poohX += 20;
                }
            });
            
            // Prevent context menu on long press
            [mobileLeftBtn, mobileRightBtn].forEach(btn => {
                btn.addEventListener('contextmenu', (e) => e.preventDefault());
            });
        }
    }

    // Storybook Functions
    function openStorybook() {
        storybookCover.classList.add('closed');

        setTimeout(() => {
            storybook.classList.add('visible');
            contentSections.forEach(section => {
                section.classList.add('visible');
            });
            
            // Scroll to the first section
            document.getElementById('section1').scrollIntoView({
                behavior: 'smooth'
            });
        }, 800);
    }

    // Navigation Functions
    function setupSectionObserver() {
        const sections = document.querySelectorAll('.content-section');
        const options = {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = entry.target.id;
                const navItem = document.querySelector(`.nav-item[data-section="${id}"]`);
                
                if (entry.isIntersecting) {
                    navItems.forEach(item => item.classList.remove('active'));
                    if (navItem) {
                        navItem.classList.add('active');
                    }
                    
                    // Show/hide persistent RSVP button
                    if (persistentRsvpBtn) {
                        if (id === 'section2') {
                            persistentRsvpBtn.classList.remove('hidden');
                        } else if (id === 'section1') {
                            persistentRsvpBtn.classList.add('hidden');
                        }
                    }
                }
            });
        }, options);

        sections.forEach(section => {
            observer.observe(section);
        });
    }

    // Scroll Animation Functions
    function checkScrollAnimations() {
        const windowHeight = window.innerHeight;
        const triggerBottom = windowHeight * 0.8;

        scrollAnimateElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            if (elementTop < triggerBottom) {
                element.classList.add('visible');
            }
        });
    }

    function updateReadingProgress() {
        const doc = document.documentElement;
        const scrollTop = doc.scrollTop || document.body.scrollTop;
        const scrollHeight = doc.scrollHeight - doc.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        readingProgress.style.width = progress + '%';
    }

    // Accessibility Functions
    function initReduceMotionPreference() {
        const stored = localStorage.getItem('reduce-motion');
        if (stored === 'true') {
            body.classList.add('reduce-motion');
        }
    }

    function toggleReduceMotion() {
        const enabled = body.classList.toggle('reduce-motion');
        localStorage.setItem('reduce-motion', enabled ? 'true' : 'false');
    }

    // Music Functions
    function initMusicPreference() {
        if (!bgMusic) return;
        const stored = localStorage.getItem('bg-music');
        const icon = musicToggle.querySelector('i');
        if (stored === 'on') {
            bgMusic.volume = 0.35;
            bgMusic.play().catch(() => {});
            icon.classList.remove('fa-volume-xmark');
            icon.classList.add('fa-music');
        } else {
            if (stored === 'off') {
                icon.classList.remove('fa-music');
                icon.classList.add('fa-volume-xmark');
            }
        }
    }

    function toggleMusic() {
        if (!bgMusic) return;
        const icon = musicToggle.querySelector('i');
        if (bgMusic.paused) {
            bgMusic.volume = 0.35;
            bgMusic.play().catch(() => {});
            icon.classList.remove('fa-volume-xmark');
            icon.classList.add('fa-music');
            localStorage.setItem('bg-music', 'on');
        } else {
            bgMusic.pause();
            icon.classList.remove('fa-music');
            icon.classList.add('fa-volume-xmark');
            localStorage.setItem('bg-music', 'off');
        }
    }

    // Character Modal Functions
    window.showCharacterModal = function(character) {
        const data = characterData[character];
        if (!data) return;

        modalCharacterIcon.innerHTML = `<i class="${data.icon}"></i>`;
        modalCharacterIcon.className = `modal-character-icon ${character}-icon-modal`;
        modalCharacterTitle.textContent = data.name;
        modalCharacterQuote.textContent = data.quote;
        modalCharacterBio.textContent = data.bio;
        characterModal.classList.add('active');
    };

    // Game Instruction Functions
    window.showGameInstructions = function(gameType) {
        const instructions = gameInstructions[gameType];
        if (!instructions) return;

        gameInstructionTitle.textContent = instructions.title;
        gameInstructionList.innerHTML = '';
        
        instructions.instructions.forEach(instruction => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-honey-pot"></i>${instruction}`;
            gameInstructionList.appendChild(li);
        });
        
        gameInstructionModal.classList.add('active');
    };

    // Fullscreen Game Functions
    function setupFullscreenToggle() {
        const fullscreenToggles = document.querySelectorAll('.fullscreen-toggle');
        const gameAreas = document.querySelectorAll('.game-area');
        
        // Show fullscreen toggle on mobile
        if (window.innerWidth <= 768) {
            fullscreenToggles.forEach(toggle => toggle.classList.remove('hidden'));
        }
        
        fullscreenToggles.forEach((toggle, index) => {
            const gameArea = gameAreas[index];
            const canvas = gameArea.querySelector('canvas');
            
            toggle.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    // Enter fullscreen
                    if (gameArea.requestFullscreen) {
                        gameArea.requestFullscreen();
                    } else if (gameArea.webkitRequestFullscreen) {
                        gameArea.webkitRequestFullscreen();
                    } else if (gameArea.msRequestFullscreen) {
                        gameArea.msRequestFullscreen();
                    }
                    
                    gameArea.classList.add('fullscreen');
                    toggle.innerHTML = '<i class="fas fa-compress"></i>';
                    
                    // Resize canvas for fullscreen
                    if (canvas) {
                        canvas.width = window.innerWidth;
                        canvas.height = window.innerHeight;
                    }
                } else {
                    // Exit fullscreen
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                    
                    gameArea.classList.remove('fullscreen');
                    toggle.innerHTML = '<i class="fas fa-expand"></i>';
                    
                    // Restore canvas size
                    if (canvas) {
                        canvas.width = 520;
                        canvas.height = 400;
                    }
                }
            });
        });
        
        // Handle fullscreen change events
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);
        
        function handleFullscreenChange() {
            if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
                gameAreas.forEach(area => {
                    area.classList.remove('fullscreen');
                    const toggle = area.querySelector('.fullscreen-toggle');
                    if (toggle) {
                        toggle.innerHTML = '<i class="fas fa-expand"></i>';
                    }
                    
                    // Restore canvas size
                    const canvas = area.querySelector('canvas');
                    if (canvas) {
                        canvas.width = 520;
                        canvas.height = 400;
                    }
                });
            }
        }
    }

    // RSVP Form Functions
    function createConfetti() {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);
        
        const colors = ['#FFC42B', '#D62E2E', '#E6B86A', '#B0D0E3', '#9CAD90'];
        
        for (let i = 0; i < 150; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            // Random shapes
            if (Math.random() > 0.7) {
                confetti.style.borderRadius = '50%';
                confetti.style.width = '8px';
                confetti.style.height = '8px';
            } else if (Math.random() > 0.5) {
                confetti.style.width = '12px';
                confetti.style.height = '4px';
            }
            
            container.appendChild(confetti);
        }
        
        // Remove confetti after animation
        setTimeout(() => {
            container.remove();
        }, 3000);
    }

    function handleRsvpSubmit(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(rsvpForm);
        const guestName = formData.get('guestName');
        const guestCount = formData.get('guestCount');
        const guestNote = formData.get('guestNote');
        
        // Validate form
        if (!guestName.trim()) {
            rsvpStatus.textContent = 'Please enter your name';
            rsvpStatus.style.color = '#dc3545';
            return;
        }
        
        // Show success state
        rsvpForm.style.display = 'none';
        rsvpStatus.innerHTML = `
            <div class="form-success">
                <div class="success-icon">🎉</div>
                <div class="success-message">Thank you, ${guestName}!</div>
                <div class="success-submessage">
                    We're excited to celebrate with ${guestCount === '1' ? 'you' : `your party of ${guestCount}`}!
                    ${guestNote ? '<br>We appreciate your note!' : ''}
                </div>
            </div>
        `;
        rsvpStatus.style.color = 'inherit';
        
        // Create celebration effects
        createConfetti();
        
        // Add honey pot animation
        const honeyIcon = document.createElement('div');
        honeyIcon.innerHTML = '🍯';
        honeyIcon.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            font-size: 4rem;
            transform: translate(-50%, -50%) scale(0);
            animation: honeyPop 1s ease-out forwards;
            z-index: 10005;
        `;
        document.body.appendChild(honeyIcon);
        
        setTimeout(() => {
            honeyIcon.remove();
        }, 1000);
        
        // Hide persistent RSVP button
        if (persistentRsvpBtn) {
            persistentRsvpBtn.classList.add('hidden');
        }
        
        // Store RSVP in localStorage
        const rsvpData = {
            name: guestName,
            count: guestCount,
            note: guestNote,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('babyGunnerRSVP', JSON.stringify(rsvpData));
    }

    function checkExistingRSVP() {
        const existingRSVP = localStorage.getItem('babyGunnerRSVP');
        if (existingRSVP && rsvpForm) {
            const rsvpData = JSON.parse(existingRSVP);
            document.getElementById('guestName').value = rsvpData.name;
            document.getElementById('guestCount').value = rsvpData.count;
            document.getElementById('guestNote').value = rsvpData.note || '';
            
            rsvpStatus.innerHTML = `
                <div class="form-success">
                    <div class="success-icon">✅</div>
                    <div class="success-message">RSVP Confirmed!</div>
                    <div class="success-submessage">
                        We have your RSVP for ${rsvpData.name} and ${rsvpData.count} guest${rsvpData.count === '1' ? '' : 's'}.
                        <br><button onclick="editRSVP()" class="back-btn" style="margin-top: 10px;">Edit RSVP</button>
                    </div>
                </div>
            `;
            rsvpForm.style.display = 'none';
            if (persistentRsvpBtn) {
                persistentRsvpBtn.classList.add('hidden');
            }
        }
    }

    window.editRSVP = function() {
        localStorage.removeItem('babyGunnerRSVP');
        if (rsvpForm && rsvpStatus) {
            rsvpForm.style.display = 'block';
            rsvpStatus.innerHTML = '';
            if (persistentRsvpBtn) {
                persistentRsvpBtn.classList.remove('hidden');
            }
        }
    };

    // Woodland Sound Function
    window.playWoodlandSound = function(ev) {
        const e = ev || window.event;
        try {
            const audioContext = new(window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.8);
        } catch (e) {
            console.log("Web Audio API not supported");
        }

        const sign = e.target.closest('.woodland-sign');
        if (sign) {
            sign.style.transform = 'scale(1.08) rotate(-1deg)';
            setTimeout(() => {
                sign.style.transform = '';
            }, 300);
        }
    };

    // Initialize the application
    init();
});

// Tower Defense Game
const defenseCanvas = document.getElementById('defense-game');
if (defenseCanvas) {
    const defenseCtx = defenseCanvas.getContext('2d');

    // Game state
    let honey = 100;
    let lives = 10;
    let wave = 1;
    let selectedTower = 'pooh';
    let towers = [];
    let enemies = [];
    let projectiles = [];
    let gameInterval;
    let isWaveActive = false;
    let lastSpawnTime = 0;

    // Tower types with costs and properties
    const towerTypes = {
        pooh: {
            cost: 20,
            damage: 10,
            range: 100,
            fireRate: 1000,
            color: '#FFB347',
            character: '🐻'
        },
        tigger: {
            cost: 30,
            damage: 15,
            range: 80,
            fireRate: 800,
            color: '#FF8C42',
            character: '🐯'
        },
        rabbit: {
            cost: 40,
            damage: 20,
            range: 120,
            fireRate: 1500,
            color: '#C1E1C1',
            character: '🐰'
        },
        piglet: {
            cost: 25,
            damage: 8,
            range: 90,
            fireRate: 600,
            color: '#FFB6C1',
            character: '🐷'
        },
        eeyore: {
            cost: 35,
            damage: 25,
            range: 110,
            fireRate: 2000,
            color: '#C0C0C0',
            character: '🐴'
        }
    };

    // Enemy types
    const enemyTypes = {
        heffalump: {
            health: 50,
            speed: 1,
            color: '#8A2BE2',
            points: 10,
            character: '🐘'
        },
        woozle: {
            health: 30,
            speed: 2,
            color: '#FF4500',
            points: 15,
            character: '🐺'
        },
        bee: {
            health: 20,
            speed: 3,
            color: '#FFD700',
            points: 5,
            character: '🐝'
        }
    };

    // Path for enemies
    const path = [{
            x: 0,
            y: 200
        },
        {
            x: 200,
            y: 200
        },
        {
            x: 200,
            y: 100
        },
        {
            x: 400,
            y: 100
        },
        {
            x: 400,
            y: 300
        },
        {
            x: 520,
            y: 300
        }
    ];

    // Draw the game background
    function drawDefenseBackground() {
        // Sky
        defenseCtx.fillStyle = '#87CEEB';
        defenseCtx.fillRect(0, 0, defenseCanvas.width, defenseCanvas.height);

        // Draw decorative clouds
        defenseCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        defenseCtx.beginPath();
        defenseCtx.arc(100, 80, 30, 0, Math.PI * 2);
        defenseCtx.arc(130, 70, 35, 0, Math.PI * 2);
        defenseCtx.arc(160, 80, 30, 0, Math.PI * 2);
        defenseCtx.fill();

        defenseCtx.beginPath();
        defenseCtx.arc(400, 60, 25, 0, Math.PI * 2);
        defenseCtx.arc(430, 50, 30, 0, Math.PI * 2);
        defenseCtx.arc(460, 60, 25, 0, Math.PI * 2);
        defenseCtx.fill();

        // Ground
        defenseCtx.fillStyle = '#8FBC8F';
        defenseCtx.fillRect(0, defenseCanvas.height - 100, defenseCanvas.width, 100);

        // Draw decorative trees
        defenseCtx.fillStyle = '#8B4513';
        defenseCtx.fillRect(50, 50, 20, 100);
        defenseCtx.fillStyle = '#228B22';
        defenseCtx.beginPath();
        defenseCtx.arc(60, 30, 40, 0, Math.PI * 2);
        defenseCtx.fill();

        defenseCtx.fillStyle = '#8B4513';
        defenseCtx.fillRect(350, 250, 20, 100);
        defenseCtx.fillStyle = '#228B22';
        defenseCtx.beginPath();
        defenseCtx.arc(360, 220, 40, 0, Math.PI * 2);
        defenseCtx.fill();

        // Path
        defenseCtx.strokeStyle = '#D2B48C';
        defenseCtx.lineWidth = 40;
        defenseCtx.beginPath();
        defenseCtx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            defenseCtx.lineTo(path[i].x, path[i].y);
        }
        defenseCtx.stroke();

        // Add path border
        defenseCtx.strokeStyle = '#8B4513';
        defenseCtx.lineWidth = 2;
        defenseCtx.beginPath();
        defenseCtx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            defenseCtx.lineTo(path[i].x, path[i].y);
        }
        defenseCtx.stroke();

        // Honey pot at the end
        defenseCtx.fillStyle = '#FFD700';
        defenseCtx.beginPath();
        defenseCtx.arc(defenseCanvas.width - 30, path[path.length - 1].y, 20, 0, Math.PI * 2);
        defenseCtx.fill();
        defenseCtx.strokeStyle = '#8B4513';
        defenseCtx.lineWidth = 3;
        defenseCtx.stroke();

        // Draw honey drip
        defenseCtx.fillStyle = '#FFA500';
        defenseCtx.beginPath();
        defenseCtx.moveTo(defenseCanvas.width - 30, path[path.length - 1].y + 20);
        defenseCtx.bezierCurveTo(
            defenseCanvas.width - 25, path[path.length - 1].y + 30,
            defenseCanvas.width - 35, path[path.length - 1].y + 40,
            defenseCanvas.width - 30, path[path.length - 1].y + 50
        );
        defenseCtx.fill();
    }

    // Draw towers
    function drawTowers() {
        towers.forEach(tower => {
            // Tower base
            defenseCtx.fillStyle = tower.color;
            defenseCtx.beginPath();
            defenseCtx.arc(tower.x, tower.y, 20, 0, Math.PI * 2);
            defenseCtx.fill();

            // Tower border
            defenseCtx.strokeStyle = '#8B4513';
            defenseCtx.lineWidth = 2;
            defenseCtx.stroke();

            // Tower character
            defenseCtx.font = '24px Arial';
            defenseCtx.fillStyle = '#000';
            defenseCtx.fillText(tower.character, tower.x - 10, tower.y + 8);

            // Level indicator
            defenseCtx.fillStyle = '#8B4513';
            defenseCtx.font = '12px Arial';
            defenseCtx.fillText(`Lv.${tower.level}`, tower.x - 10, tower.y - 25);

            // Range indicator (only when tower is selected)
            if (tower.selected) {
                defenseCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                defenseCtx.beginPath();
                defenseCtx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
                defenseCtx.stroke();
            }
        });
    }

    // Draw enemies
    function drawEnemies() {
        enemies.forEach(enemy => {
            // Enemy body
            defenseCtx.fillStyle = enemy.color;
            defenseCtx.beginPath();
            defenseCtx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2);
            defenseCtx.fill();

            // Enemy border
            defenseCtx.strokeStyle = '#000';
            defenseCtx.lineWidth = 1;
            defenseCtx.stroke();

            // Enemy character
            defenseCtx.font = '16px Arial';
            defenseCtx.fillStyle = '#000';
            defenseCtx.fillText(enemy.character, enemy.x - 8, enemy.y + 5);

            // Health bar background
            defenseCtx.fillStyle = 'red';
            defenseCtx.fillRect(enemy.x - 15, enemy.y - 25, 30, 5);

            // Health bar
            defenseCtx.fillStyle = 'green';
            defenseCtx.fillRect(enemy.x - 15, enemy.y - 25, 30 * (enemy.health / enemy.maxHealth), 5);
        });
    }

    // Draw projectiles
    function drawProjectiles() {
        projectiles.forEach(projectile => {
            defenseCtx.fillStyle = projectile.color;
            defenseCtx.beginPath();
            defenseCtx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
            defenseCtx.fill();

            // Projectile trail
            defenseCtx.strokeStyle = projectile.color;
            defenseCtx.lineWidth = 2;
            defenseCtx.beginPath();
            defenseCtx.moveTo(projectile.startX, projectile.startY);
            defenseCtx.lineTo(projectile.x, projectile.y);
            defenseCtx.stroke();
        });
    }

    // Update game state
    function updateDefenseGame() {
        // Move enemies
        enemies.forEach((enemy, enemyIndex) => {
            const nextPoint = path[enemy.pathIndex];
            const dx = nextPoint.x - enemy.x;
            const dy = nextPoint.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 1) {
                enemy.pathIndex++;
                if (enemy.pathIndex >= path.length) {
                    // Enemy reached the end
                    lives--;
                    document.getElementById('lives-count').textContent = lives;
                    enemies.splice(enemyIndex, 1);
                    return;
                }
            } else {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
        });

        // Tower targeting and shooting
        towers.forEach(tower => {
            if (tower.cooldown > 0) {
                tower.cooldown -= 16; // Assuming 60fps
                return;
            }

            let target = null;
            let minDistance = tower.range;

            enemies.forEach(enemy => {
                const dx = enemy.x - tower.x;
                const dy = enemy.y - tower.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < minDistance) {
                    minDistance = distance;
                    target = enemy;
                }
            });

            if (target) {
                projectiles.push({
                    x: tower.x,
                    y: tower.y,
                    startX: tower.x,
                    startY: tower.y,
                    target: target,
                    damage: tower.damage,
                    color: tower.color,
                    speed: 5
                });

                tower.cooldown = tower.fireRate;
            }
        });

        // Move projectiles and check hits
        projectiles.forEach((projectile, projIndex) => {
            if (!projectile.target || projectile.target.health <= 0) {
                projectiles.splice(projIndex, 1);
                return;
            }

            const dx = projectile.target.x - projectile.x;
            const dy = projectile.target.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 10) {
                // Hit target
                projectile.target.health -= projectile.damage;

                if (projectile.target.health <= 0) {
                    honey += projectile.target.points;
                    document.getElementById('honey-count').textContent = honey;
                    enemies.splice(enemies.indexOf(projectile.target), 1);
                }

                projectiles.splice(projIndex, 1);
            } else {
                projectile.x += (dx / distance) * projectile.speed;
                projectile.y += (dy / distance) * projectile.speed;
            }
        });

        // Spawn enemies for active wave
        if (isWaveActive) {
            const currentTime = Date.now();
            if (currentTime - lastSpawnTime > 1000 && enemies.length < 5 + wave * 2) {
                lastSpawnTime = currentTime;

                const enemyTypesArray = ['heffalump', 'woozle', 'bee'];
                const randomType = enemyTypesArray[Math.floor(Math.random() * enemyTypesArray.length)];
                const enemyProps = enemyTypes[randomType];

                enemies.push({
                    x: path[0].x,
                    y: path[0].y,
                    pathIndex: 1,
                    health: enemyProps.health,
                    maxHealth: enemyProps.health,
                    speed: enemyProps.speed,
                    color: enemyProps.color,
                    points: enemyProps.points,
                    character: enemyProps.character
                });
            }

            // Check if wave is complete
            if (enemies.length === 0 && currentTime - lastSpawnTime > 3000) {
                isWaveActive = false;
                wave++;
                document.getElementById('wave-count').textContent = wave;
                // Reward player for completing wave
                honey += 30;
                document.getElementById('honey-count').textContent = honey;
            }
        }

        // Check game over
        if (lives <= 0) {
            clearInterval(gameInterval);
            alert("Oh bother! The Heffalumps and Woozles got all your honey! Game Over!");
            resetDefenseGame();
        }
    }

    // Draw everything
    function drawDefenseGame() {
        drawDefenseBackground();
        drawTowers();
        drawEnemies();
        drawProjectiles();
    }

    // Game loop
    function defenseGameLoop() {
        updateDefenseGame();
        drawDefenseGame();
    }

    // Start a wave
    function startWave() {
        if (isWaveActive) return;

        isWaveActive = true;
        lastSpawnTime = Date.now();
    }

    // Place a tower
    defenseCanvas.addEventListener('click', (e) => {
        if (isWaveActive) return;

        const rect = defenseCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if position is valid (not on path)
        let onPath = false;
        for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i];
            const p2 = path[i + 1];

            // Simple check for demo purposes
            if (Math.abs(x - p1.x) < 30 && Math.abs(y - p1.y) < 30) {
                onPath = true;
                break;
            }
        }

        if (!onPath && honey >= towerTypes[selectedTower].cost) {
            honey -= towerTypes[selectedTower].cost;
            document.getElementById('honey-count').textContent = honey;

            towers.push({
                x: x,
                y: y,
                type: selectedTower,
                damage: towerTypes[selectedTower].damage,
                range: towerTypes[selectedTower].range,
                fireRate: towerTypes[selectedTower].fireRate,
                color: towerTypes[selectedTower].color,
                character: towerTypes[selectedTower].character,
                cooldown: 0,
                level: 1,
                selected: false
            });
        }
    });

    // Upgrade tower
    document.getElementById('upgrade-tower').addEventListener('click', () => {
        if (honey >= 50) {
            honey -= 50;
            document.getElementById('honey-count').textContent = honey;

            // For demo, upgrade all towers
            towers.forEach(tower => {
                tower.damage += 5;
                tower.range += 10;
                tower.level++;
            });
        }
    });

    // Reset game
    function resetDefenseGame() {
        honey = 100;
        lives = 10;
        wave = 1;
        towers = [];
        enemies = [];
        projectiles = [];
        isWaveActive = false;

        document.getElementById('honey-count').textContent = honey;
        document.getElementById('lives-count').textContent = lives;
        document.getElementById('wave-count').textContent = wave;
    }

    // Tower selection
    document.querySelectorAll('.tower-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.tower-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            option.classList.add('selected');
            selectedTower = option.getAttribute('data-tower');
        });
    });

    // Start defense game
    document.getElementById('start-defense').addEventListener('click', startWave);

    // Initialize defense game
    drawDefenseGame();
    gameInterval = setInterval(defenseGameLoop, 16);
}

// Honey Catch Game
const honeyCanvas = document.getElementById('honey-game');
if (honeyCanvas) {
    const honeyCtx = honeyCanvas.getContext('2d');

    // Game state
    let score = 0;
    let timeLeft = 60;
    let catchLives = 3;
    window.poohX = honeyCanvas.width / 2;
    let honeyPots = [];
    let bees = [];
    window.gameRunning = false;
    let catchGameInterval;
    let timerInterval;

    // Draw background
    function drawHoneyBackground() {
        // Sky
        honeyCtx.fillStyle = '#87CEEB';
        honeyCtx.fillRect(0, 0, honeyCanvas.width, honeyCanvas.height);

        // Draw decorative clouds
        honeyCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        honeyCtx.beginPath();
        honeyCtx.arc(100, 80, 30, 0, Math.PI * 2);
        honeyCtx.arc(130, 70, 35, 0, Math.PI * 2);
        honeyCtx.arc(160, 80, 30, 0, Math.PI * 2);
        honeyCtx.fill();

        honeyCtx.beginPath();
        honeyCtx.arc(400, 60, 25, 0, Math.PI * 2);
        honeyCtx.arc(430, 50, 30, 0, Math.PI * 2);
        honeyCtx.arc(460, 60, 25, 0, Math.PI * 2);
        honeyCtx.fill();

        // Ground
        honeyCtx.fillStyle = '#8FBC8F';
        honeyCtx.fillRect(0, honeyCanvas.height - 50, honeyCanvas.width, 50);

        // Draw decorative grass
        honeyCtx.fillStyle = '#7CFC00';
        for (let i = 0; i < honeyCanvas.width; i += 10) {
            honeyCtx.fillRect(i, honeyCanvas.height - 50, 3, -10 - Math.random() * 10);
        }

        // Draw trees
        honeyCtx.fillStyle = '#8B4513';
        honeyCtx.fillRect(100, 150, 30, 200);
        honeyCtx.fillStyle = '#228B22';
        honeyCtx.beginPath();
        honeyCtx.arc(115, 120, 50, 0, Math.PI * 2);
        honeyCtx.fill();

        honeyCtx.fillStyle = '#8B4513';
        honeyCtx.fillRect(400, 180, 30, 170);
        honeyCtx.fillStyle = '#228B22';
        honeyCtx.beginPath();
        honeyCtx.arc(415, 150, 45, 0, Math.PI * 2);
        honeyCtx.fill();
    }

    // Draw Pooh
    function drawPooh() {
        // Pooh's body
        honeyCtx.fillStyle = '#FFB347';
        honeyCtx.beginPath();
        honeyCtx.arc(window.poohX, honeyCanvas.height - 70, 30, 0, Math.PI * 2);
        honeyCtx.fill();

        // Pooh's red shirt
        honeyCtx.fillStyle = 'red';
        honeyCtx.fillRect(window.poohX - 25, honeyCanvas.height - 70, 50, 30);

        // Shirt details
        honeyCtx.strokeStyle = '#8B4513';
        honeyCtx.lineWidth = 2;
        honeyCtx.beginPath();
        honeyCtx.moveTo(window.poohX, honeyCanvas.height - 70);
        honeyCtx.lineTo(window.poohX, honeyCanvas.height - 40);
        honeyCtx.stroke();

        // Pooh's face
        honeyCtx.fillStyle = '#FFB347';
        honeyCtx.beginPath();
        honeyCtx.arc(window.poohX, honeyCanvas.height - 100, 25, 0, Math.PI * 2);
        honeyCtx.fill();

        // Eyes
        honeyCtx.fillStyle = 'black';
        honeyCtx.beginPath();
        honeyCtx.arc(window.poohX - 10, honeyCanvas.height - 105, 5, 0, Math.PI * 2);
        honeyCtx.arc(window.poohX + 10, honeyCanvas.height - 105, 5, 0, Math.PI * 2);
        honeyCtx.fill();

        // Nose
        honeyCtx.fillStyle = 'black';
        honeyCtx.beginPath();
        honeyCtx.arc(window.poohX, honeyCanvas.height - 95, 8, 0, Math.PI * 2);
        honeyCtx.fill();

        // Smile
        honeyCtx.strokeStyle = 'black';
        honeyCtx.lineWidth = 2;
        honeyCtx.beginPath();
        honeyCtx.arc(window.poohX, honeyCanvas.height - 90, 10, 0.2, Math.PI - 0.2, false);
        honeyCtx.stroke();

        // Ears
        honeyCtx.fillStyle = '#FFB347';
        honeyCtx.beginPath();
        honeyCtx.arc(window.poohX - 20, honeyCanvas.height - 120, 10, 0, Math.PI * 2);
        honeyCtx.arc(window.poohX + 20, honeyCanvas.height - 120, 10, 0, Math.PI * 2);
        honeyCtx.fill();

        // Arms
        honeyCtx.fillStyle = '#FFB347';
        honeyCtx.fillRect(window.poohX - 40, honeyCanvas.height - 80, 15, 10);
        honeyCtx.fillRect(window.poohX + 25, honeyCanvas.height - 80, 15, 10);
    }

    // Draw honey pots
    function drawHoneyPots() {
        honeyPots.forEach(pot => {
            // Honey pot body
            honeyCtx.fillStyle = '#FFD700';
            honeyCtx.beginPath();
            honeyCtx.arc(pot.x, pot.y, 15, 0, Math.PI * 2);
            honeyCtx.fill();

            // Pot outline
            honeyCtx.strokeStyle = '#8B4513';
            honeyCtx.lineWidth = 3;
            honeyCtx.stroke();

            // Pot handle
            honeyCtx.beginPath();
            honeyCtx.arc(pot.x, pot.y - 15, 5, 0, Math.PI, false);
            honeyCtx.stroke();

            // Honey drip
            honeyCtx.fillStyle = '#FFA500';
            honeyCtx.beginPath();
            honeyCtx.moveTo(pot.x - 5, pot.y + 10);
            honeyCtx.bezierCurveTo(
                pot.x - 2, pot.y + 15,
                pot.x + 2, pot.y + 15,
                pot.x + 5, pot.y + 10
            );
            honeyCtx.fill();
        });
    }

    // Draw bees
    function drawBees() {
        bees.forEach(bee => {
            // Bee body
            honeyCtx.fillStyle = '#FFD700';
            honeyCtx.beginPath();
            honeyCtx.arc(bee.x, bee.y, 10, 0, Math.PI * 2);
            honeyCtx.fill();

            // Bee stripes
            honeyCtx.fillStyle = 'black';
            honeyCtx.fillRect(bee.x - 10, bee.y - 3, 5, 6);
            honeyCtx.fillRect(bee.x, bee.y - 3, 5, 6);

            // Bee wings
            honeyCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            honeyCtx.beginPath();
            honeyCtx.arc(bee.x - 5, bee.y - 10, 8, 0, Math.PI * 2);
            honeyCtx.arc(bee.x + 5, bee.y - 10, 8, 0, Math.PI * 2);
            honeyCtx.fill();

            // Bee stinger
            honeyCtx.fillStyle = 'black';
            honeyCtx.beginPath();
            honeyCtx.moveTo(bee.x + 10, bee.y);
            honeyCtx.lineTo(bee.x + 15, bee.y);
            honeyCtx.lineTo(bee.x + 10, bee.y - 3);
            honeyCtx.fill();
        });
    }

    // Update honey catch game
    function updateHoneyGame() {
        // Move honey pots
        honeyPots.forEach((pot, index) => {
            pot.y += pot.speed;

            // Check if caught by Pooh
            if (pot.y > honeyCanvas.height - 100 &&
                pot.x > window.poohX - 40 &&
                pot.x < window.poohX + 40) {
                score += 10;
                document.getElementById('score-count').textContent = score;
                honeyPots.splice(index, 1);

                // Add visual feedback
                honeyCtx.fillStyle = 'rgba(255, 215, 0, 0.5)';
                honeyCtx.fillRect(0, 0, honeyCanvas.width, honeyCanvas.height);
            }

            // Remove if off screen
            if (pot.y > honeyCanvas.height) {
                honeyPots.splice(index, 1);
            }
        });

        // Move bees
        bees.forEach((bee, index) => {
            bee.y += bee.speed;

            // Check if hit Pooh
            if (bee.y > honeyCanvas.height - 100 &&
                bee.x > window.poohX - 40 &&
                bee.x < window.poohX + 40) {
                catchLives--;
                document.getElementById('catch-lives').textContent = catchLives;
                bees.splice(index, 1);

                // Add visual feedback
                honeyCtx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                honeyCtx.fillRect(0, 0, honeyCanvas.width, honeyCanvas.height);

                if (catchLives <= 0) {
                    endHoneyGame();
                }
            }

            // Remove if off screen
            if (bee.y > honeyCanvas.height) {
                bees.splice(index, 1);
            }
        });

        // Spawn new honey pots and bees
        if (Math.random() < 0.05) {
            honeyPots.push({
                x: Math.random() * (honeyCanvas.width - 30) + 15,
                y: 0,
                speed: 2 + Math.random() * 2
            });
        }

        if (Math.random() < 0.02) {
            bees.push({
                x: Math.random() * (honeyCanvas.width - 30) + 15,
                y: 0,
                speed: 3 + Math.random() * 2
            });
        }
    }

    // Draw honey catch game
    function drawHoneyGame() {
        drawHoneyBackground();
        drawPooh();
        drawHoneyPots();
        drawBees();

        // Draw score and time
        honeyCtx.fillStyle = '#5c3d0a';
        honeyCtx.font = 'bold 20px Arial';
        honeyCtx.fillText(`Score: ${score}`, 20, 30);
        honeyCtx.fillText(`Time: ${timeLeft}s`, honeyCanvas.width - 100, 30);
        honeyCtx.fillText(`Lives: ${catchLives}`, honeyCanvas.width / 2 - 40, 30);
    }

    // Honey catch game loop
    function honeyGameLoop() {
        updateHoneyGame();
        drawHoneyGame();
    }

    // Start honey catch game
    function startHoneyGame() {
        if (window.gameRunning) return;

        window.gameRunning = true;
        score = 0;
        timeLeft = 60;
        catchLives = 3;
        honeyPots = [];
        bees = [];
        window.poohX = honeyCanvas.width / 2;

        document.getElementById('score-count').textContent = score;
        document.getElementById('time-count').textContent = timeLeft;
        document.getElementById('catch-lives').textContent = catchLives;

        catchGameInterval = setInterval(honeyGameLoop, 16);

        // Countdown timer
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            document.getElementById('time-count').textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                endHoneyGame();
            }
        }, 1000);
    }

    // End honey catch game
    function endHoneyGame() {
        window.gameRunning = false;
        clearInterval(catchGameInterval);
        clearInterval(timerInterval);

        if (catchLives <= 0) {
            alert(`Oh bother! You got stung too many times! Final score: ${score}`);
        } else {
            alert(`Time's up! You collected ${score} honey points!`);
        }
    }

    // Move Pooh with keyboard
    document.addEventListener('keydown', (e) => {
        if (!window.gameRunning) return;

        if (e.key === 'ArrowLeft' && window.poohX > 40) {
            window.poohX -= 20;
        } else if (e.key === 'ArrowRight' && window.poohX < honeyCanvas.width - 40) {
            window.poohX += 20;
        }
    });

    // Start honey catch game
    document.getElementById('start-catch').addEventListener('click', startHoneyGame);

    // Pause honey catch game
    document.getElementById('pause-catch').addEventListener('click', () => {
        if (window.gameRunning) {
            clearInterval(catchGameInterval);
            clearInterval(timerInterval);
            window.gameRunning = false;
        } else if (timeLeft > 0 && catchLives > 0) {
            catchGameInterval = setInterval(honeyGameLoop, 16);

            // Restart timer
            timerInterval = setInterval(() => {
                timeLeft--;
                document.getElementById('time-count').textContent = timeLeft;

                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    endHoneyGame();
                }
            }, 1000);

            window.gameRunning = true;
        }
    });

    // Initialize honey catch game
    drawHoneyGame();
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes honeyPop {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    
    @keyframes bounce {
        0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
        40%, 43% { transform: translate3d(0,-20px,0); }
        70% { transform: translate3d(0,-10px,0); }
        90% { transform: translate3d(0,-4px,0); }
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
