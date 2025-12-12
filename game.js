// script.js - Hundred Acre Celebration - OPTIMIZED VERSION
// UI and story functionality only - Games moved to game.js

'use strict';

(function () {
    'use strict';

    // ============================================================================
    // UTILITIES & GLOBALS
    // ============================================================================

    // Simple helper to safely query elements
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));

    // Character data
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
            responsibilities: ['Honey distribution', 'Comfort snuggles', 'Bedtime stories']
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
            responsibilities: ['Blanket organization', 'Safety checks', 'Comfort monitoring']
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
            responsibilities: ['Entertainment', 'Giggle induction', 'Gentle bouncing']
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
            responsibilities: ['Photo spots', 'Quiet corners', 'Reflection time']
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
            responsibilities: ['Memory keeping', 'Storytelling', 'Official announcements']
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
            responsibilities: ['Toy sharing', 'Gentle play demonstrations', 'Welcome committee']
        }
    };

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

        // Global function to show modal
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

        // Character voice playback
        window.playCharacterVoice = function (key) {
            const data = characterData[key];
            if (!data) return;

            // Create audio context for simple tones
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

                    // Unobserve after animation
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        observer.observe(charactersSection);
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

        // Throttle scroll events for performance
        function throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }

        const throttledScroll = throttle(() => {
            checkScrollAnimations();
            updateReadingProgress();
        }, 16);

        window.addEventListener('scroll', throttledScroll);
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

            for (let i = 0; i < 70; i++) {
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
    // CHARACTERS SECTION CSS
    // ========================================================================

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
    // BOOTSTRAP - UPDATED TO EXCLUDE GAMES
    // ========================================================================

    document.addEventListener('DOMContentLoaded', () => {
        // Inject keyframe helpers
        function injectExtraKeyframes() {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes honeyPop {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }

                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
                    50% { box-shadow: 0 5px 25px rgba(255, 180, 71, 0.3); }
                }

                .character-card {
                    animation: card-enter 0.6s ease-out forwards;
                    animation-delay: calc(var(--card-index, 0) * 0.1s);
                    opacity: 0;
                }

                @keyframes card-enter {
                    0% { transform: translateY(30px) scale(0.95); opacity: 0; }
                    100% { transform: translateY(0) scale(1); opacity: 1; }
                }

                @media (prefers-reduced-motion: reduce) {
                    *,
                    *::before,
                    *::after {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        injectExtraKeyframes();
        initBaseUI();
        initCharactersSection();
        initCharacterModal();
        initCharacterAnimations();
        addCharactersCSS();
        
        console.log('UI components initialized. Games are loaded separately in game.js');
    });

})();
