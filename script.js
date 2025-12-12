// Hundred Acre Celebration - ENHANCED VERSION - COMPLETE FIXED
// Complete overhaul with improved game mechanics, visuals, and performance

// ============================================================================
// UTILITIES & GLOBALS - ENHANCED
// ============================================================================

(function () {
    'use strict';

    // ============================================================================
    // ENHANCED PERFORMANCE OPTIMIZATIONS
    // ============================================================================

    // Frame rate limiter class
    class FrameRateLimiter {
        constructor(targetFPS = 60) {
            this.targetFPS = targetFPS;
            this.frameInterval = 1000 / targetFPS;
            this.lastFrameTime = 0;
            this.fps = 0;
            this.frameCount = 0;
            this.lastFPSUpdate = 0;
        }

        shouldRender(timestamp) {
            if (timestamp - this.lastFrameTime >= this.frameInterval) {
                this.fps = 1000 / (timestamp - this.lastFrameTime);
                this.lastFrameTime = timestamp;
                this.frameCount++;
                
                // Update FPS display every second
                if (timestamp - this.lastFPSUpdate > 1000) {
                    this.lastFPSUpdate = timestamp;
                    if (window.DEBUG_MODE) {
                        console.log(`FPS: ${Math.round(this.fps)}`);
                    }
                }
                
                return true;
            }
            return false;
        }

        getFPS() {
            return Math.round(this.fps);
        }

        reset() {
            this.lastFrameTime = 0;
            this.frameCount = 0;
        }
    }

    // Enhanced throttle with trailing call
    function throttle(func, limit, options = {}) {
        let inThrottle;
        let lastFunc;
        let lastRan;
        return function() {
            const context = this;
            const args = arguments;
            if (!inThrottle) {
                func.apply(context, args);
                lastRan = Date.now();
                inThrottle = true;
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function() {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }

    // Enhanced debounce with immediate option
    function debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const context = this;
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    // Enhanced collision detection with multiple methods
    const Collision = {
        // AABB (Axis-Aligned Bounding Box)
        AABB: function(rect1, rect2) {
            return rect1.x < rect2.x + rect2.width &&
                   rect1.x + rect1.width > rect2.x &&
                   rect1.y < rect2.y + rect2.height &&
                   rect1.y + rect1.height > rect2.y;
        },
        
        // Circle collision
        circle: function(circle1, circle2) {
            const dx = circle1.x - circle2.x;
            const dy = circle1.y - circle2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < circle1.radius + circle2.radius;
        },
        
        // Point in rectangle
        pointInRect: function(point, rect) {
            return point.x >= rect.x && 
                   point.x <= rect.x + rect.width && 
                   point.y >= rect.y && 
                   point.y <= rect.y + rect.height;
        }
    };

    // Enhanced device detection
    function isMobileDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const touchPoints = navigator.maxTouchPoints || 'ontouchstart' in window;
        
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || 
               (touchPoints && window.innerWidth <= 768);
    }

    function isHighPerformanceDevice() {
        const memory = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;
        const isDesktop = !isMobileDevice();
        
        return memory >= 4 && cores >= 4 && isDesktop;
    }

    // Enhanced device optimization
    function optimizeForDevice() {
        const isMobile = isMobileDevice();
        const isHighPerf = isHighPerformanceDevice();

        window.DEVICE_TYPE = isMobile ? 'mobile' : 'desktop';
        window.PERFORMANCE_LEVEL = isHighPerf ? 'high' : 'medium';
        window.IS_MOBILE = isMobile;

        if (isMobile) {
            window.MAX_PARTICLES = 50;
            window.GAME_FPS_TARGET = 30;
            window.GRAPHICS_QUALITY = 'low';
        } else if (isHighPerf) {
            window.MAX_PARTICLES = 200;
            window.GAME_FPS_TARGET = 60;
            window.GRAPHICS_QUALITY = 'high';
        } else {
            window.MAX_PARTICLES = 100;
            window.GAME_FPS_TARGET = 60;
            window.GRAPHICS_QUALITY = 'medium';
        }

        console.log(`Device: ${window.DEVICE_TYPE}, Performance: ${window.PERFORMANCE_LEVEL}, FPS: ${window.GAME_FPS_TARGET}`);
    }

    // Initialize device optimization
    optimizeForDevice();

    // Enhanced DOM helpers with caching
    const DOM = {
        cache: new Map(),
        
        $(sel) {
            if (this.cache.has(sel)) {
                return this.cache.get(sel);
            }
            const el = document.querySelector(sel);
            if (el) this.cache.set(sel, el);
            return el;
        },
        
        $$(sel) {
            if (this.cache.has(sel + '_all')) {
                return this.cache.get(sel + '_all');
            }
            const els = Array.from(document.querySelectorAll(sel));
            if (els.length) this.cache.set(sel + '_all', els);
            return els;
        },
        
        clearCache() {
            this.cache.clear();
        }
    };

    // Quick DOM helpers for one-off queries
    const $ = DOM.$.bind(DOM);

    // Enhanced shake effect
    function shakeElement(el, intensity = 5, duration = 300) {
        if (!el || !el.style) return;
        
        const originalTransform = el.style.transform;
        const startTime = Date.now();
        
        function animateShake() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                const shakeX = (Math.random() - 0.5) * intensity * (1 - progress);
                const shakeY = (Math.random() - 0.5) * intensity * (1 - progress);
                el.style.transform = `${originalTransform} translate(${shakeX}px, ${shakeY}px)`;
                requestAnimationFrame(animateShake);
            } else {
                el.style.transform = originalTransform;
            }
        }
        
        animateShake();
    }

    // ============================================================================
    // ENHANCED PARTICLE SYSTEM
    // ============================================================================

    class EnhancedParticleSystem {
        constructor(canvas, maxParticles = window.MAX_PARTICLES) {
            this.canvas = canvas;
            this.ctx = canvas ? canvas.getContext('2d') : null;
            this.maxParticles = maxParticles;
            this.particles = [];
            this.emitters = [];
            this.particleTypes = {
                honey: { color: '#FFD54F', size: { min: 3, max: 8 }, life: 1.5 },
                sparkle: { color: '#FFFFFF', size: { min: 2, max: 4 }, life: 0.8 },
                fire: { color: '#FF6B6B', size: { min: 4, max: 10 }, life: 1.2 }
            };
        }

        createParticle(x, y, type = 'honey', velocity = null) {
            if (this.particles.length >= this.maxParticles) return null;
            
            const config = this.particleTypes[type] || this.particleTypes.honey;
            const size = config.size.min + Math.random() * (config.size.max - config.size.min);
            
            const particle = {
                x, y,
                vx: velocity ? velocity.x : (Math.random() - 0.5) * 4,
                vy: velocity ? velocity.y : (Math.random() - 0.5) * 4 - 2,
                life: config.life,
                maxLife: config.life,
                decay: 0.02 + Math.random() * 0.02,
                size,
                color: config.color,
                type,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            };
            
            this.particles.push(particle);
            return particle;
        }

        update(delta) {
            const now = Date.now();
            
            // Update emitters
            for (let i = this.emitters.length - 1; i >= 0; i--) {
                const emitter = this.emitters[i];
                
                if (!emitter.active || (now - emitter.startTime) > emitter.duration) {
                    this.emitters.splice(i, 1);
                    continue;
                }
                
                if (now - emitter.lastEmission > 1000 / emitter.rate) {
                    for (let j = 0; j < Math.floor(emitter.rate / 30); j++) {
                        this.createParticle(emitter.x, emitter.y, emitter.type);
                    }
                    emitter.lastEmission = now;
                }
            }
            
            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                
                // Apply physics
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.05; // gravity
                p.life -= p.decay;
                p.rotation += p.rotationSpeed;
                
                // Apply friction
                p.vx *= 0.99;
                p.vy *= 0.99;
                
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }
        }

        render() {
            if (!this.ctx) return;
            
            this.ctx.save();
            this.particles.forEach(p => {
                const alpha = p.life / p.maxLife;
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            this.ctx.restore();
        }

        clear() {
            this.particles = [];
            this.emitters = [];
        }

        burst(x, y, count = 20, type = 'honey') {
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const speed = 2 + Math.random() * 3;
                const velocity = {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                };
                this.createParticle(x, y, type, velocity);
            }
        }
    }

    // ============================================================================
    // ENHANCED AUDIO MANAGER
    // ============================================================================

    class EnhancedAudioManager {
        constructor() {
            this.audioContext = null;
            this.gainNode = null;
            this.isEnabled = true;
            this.sounds = new Map();
            this.masterVolume = 0.3;
        }

        init() {
            if (this.audioContext) return;

            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.gainNode = this.audioContext.createGain();
                this.gainNode.connect(this.audioContext.destination);
                this.gainNode.gain.value = this.masterVolume;

                this.createSoundBuffers();
                console.log('Audio system initialized');
            } catch (e) {
                console.warn('Web Audio API not supported');
                this.isEnabled = false;
            }
        }

        createSoundBuffers() {
            const frequencies = {
                click: [440, 554.37, 659.25],
                collect: [523.25, 659.25, 783.99],
                damage: [220, 174.61, 130.81],
                victory: [523.25, 659.25, 783.99, 1046.50]
            };

            Object.keys(frequencies).forEach(key => {
                this.sounds.set(key, frequencies[key]);
            });
        }

        playTone(frequencies, duration = 0.2) {
            if (!this.isEnabled || !this.audioContext) return;

            const now = this.audioContext.currentTime;
            
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.gainNode);
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(freq, now);
                    
                    gainNode.gain.setValueAtTime(0.1, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    
                    oscillator.start(now);
                    oscillator.stop(now + duration);
                }, index * 80);
            });
        }

        playSound(soundName) {
            const sound = this.sounds.get(soundName);
            if (sound) {
                this.playTone(sound, 0.15);
            }
        }

        playCharacterSound(character) {
            const characterSounds = {
                pooh: { frequencies: [262, 330, 392, 523], duration: 0.12 },
                piglet: { frequencies: [523, 659, 784], duration: 0.1 },
                tigger: { frequencies: [392, 494, 587, 784], duration: 0.08 },
                eeyore: { frequencies: [220, 262, 330], duration: 0.2 }
            };

            const sound = characterSounds[character];
            if (sound) {
                this.playTone(sound.frequencies, sound.duration);
            }
        }

        playGameSound(type) {
            const gameSounds = {
                collect: 'collect',
                damage: 'damage',
                victory: 'victory',
                click: 'click'
            };

            if (gameSounds[type]) {
                this.playSound(gameSounds[type]);
            }
        }
    }

    // ============================================================================
    // GLOBAL SPRITES & DATA - COMPLETE
    // ============================================================================

    const Sprites = {
        pooh: null,
        piglet: null,
        tigger: null,
        eeyore: null,
        honey: null
    };

    // COMPLETE character data
    const characterData = {
        pooh: {
            name: "Winnie the Pooh",
            quote: "Sometimes the smallest things take up the most room in your heart.",
            bio: "Pooh is our honey-loving host who believes every celebration needs a little something sweet. He's in charge of making sure there's plenty of honey treats for everyone and will be sharing his favorite stories about friendship and adventure.",
            icon: "fas fa-honey-pot",
            color: "#FFC42B",
            bgColor: "#FFF3E0",
            role: "Honey Host",
            personality: ["Sweet", "Thoughtful", "Hungry", "Loyal"],
            responsibilities: ["Provide honey treats", "Share stories", "Welcome guests"],
            stats: {
                sweetness: 5,
                strength: 3,
                wisdom: 4,
                speed: 2
            },
            fullName: "Winnie the Pooh Bear",
            funFact: "Loves honey more than anything else",
            voiceSample: "Oh bother!"
        },
        piglet: {
            name: "Piglet",
            quote: "Even the littlest friend can bring the greatest joy.",
            bio: "Our small but mighty friend Piglet is handling the decorations and making sure everything is just right. He may be small, but his heart is big, and he's ensuring every detail is perfect for Baby Gunner's welcome.",
            icon: "fas fa-piggy-bank",
            color: "#FFB6C1",
            bgColor: "#FFF0F5",
            role: "Decoration Coordinator",
            personality: ["Brave", "Careful", "Helpful", "Kind"],
            responsibilities: ["Arrange decorations", "Check details", "Make things cozy"],
            stats: {
                sweetness: 4,
                strength: 2,
                wisdom: 3,
                speed: 4
            },
            fullName: "Piglet",
            funFact: "Always carries a handkerchief",
            voiceSample: "Oh dear, oh dear!"
        },
        tigger: {
            name: "Tigger",
            quote: "New babies are what Tiggers like best!",
            bio: "Tigger is our bounce-tastic party energizer! He's organizing games and making sure everyone has a wonderful, bouncy time. His enthusiasm is contagious, and he promises to keep the celebration full of fun and laughter.",
            icon: "fas fa-paw",
            color: "#FF8C00",
            bgColor: "#FFECB3",
            role: "Party Energizer",
            personality: ["Energetic", "Funny", "Bouncy", "Optimistic"],
            responsibilities: ["Lead games", "Keep energy high", "Make everyone smile"],
            stats: {
                sweetness: 3,
                strength: 5,
                wisdom: 2,
                speed: 5
            },
            fullName: "Tigger",
            funFact: "The only Tigger in the Hundred Acre Wood",
            voiceSample: "TTFN - Ta-ta for now!"
        },
        eeyore: {
            name: "Eeyore",
            quote: "Not that I'm complaining, but it will be rather nice to have someone new around.",
            bio: "Eeyore may seem gloomy, but he's secretly thrilled about the new arrival. He's carefully watching over the gift table and making sure all the presents are kept safe. His thoughtful nature means he'll remember every little detail.",
            icon: "fas fa-cloud",
            color: "#A9A9A9",
            bgColor: "#F5F5F5",
            role: "Gift Guardian",
            personality: ["Thoughtful", "Reliable", "Honest", "Loyal"],
            responsibilities: ["Watch over gifts", "Remember details", "Keep things safe"],
            stats: {
                sweetness: 4,
                strength: 3,
                wisdom: 5,
                speed: 1
            },
            fullName: "Eeyore",
            funFact: "Has a detachable tail",
            voiceSample: "Thanks for noticing me."
        }
    };

    // Sprite loading
    function loadSprites() {
        console.log('Loading sprites...');
        
        const paths = {
            pooh: 'Images/Characters/honey-bear.png',
            piglet: 'Images/Characters/piglet.png',
            tigger: 'Images/Characters/tigger.png',
            eeyore: 'Images/Characters/eeyore.png',
            honey: 'Images/honey.png'
        };

        Object.keys(paths).forEach((key) => {
            const img = new Image();
            img.src = paths[key];
            img.onload = () => {
                console.log(`✓ Loaded: ${key}`);
                Sprites[key] = img;
            };
            img.onerror = () => {
                console.warn(`✗ Failed to load: ${key}, using fallback`);
                createEnhancedFallbackSprite(img, key);
                Sprites[key] = img;
            };
        });
    }

    function createEnhancedFallbackSprite(img, key) {
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 80;
        const ctx = canvas.getContext('2d');
        
        const styles = {
            pooh: { color: '#FFB347', bgColor: '#FFF3E0' },
            piglet: { color: '#FFB6C1', bgColor: '#FFF0F5' },
            tigger: { color: '#FF8C42', bgColor: '#FFECB3' },
            eeyore: { color: '#C0C0C0', bgColor: '#F5F5F5' },
            honey: { color: '#FFD54F', bgColor: '#FFF8E1' }
        };
        
        const style = styles[key] || styles.pooh;
        
        // Draw background
        ctx.fillStyle = style.bgColor;
        ctx.fillRect(0, 0, 80, 80);
        
        // Draw character
        ctx.fillStyle = style.color;
        ctx.beginPath();
        ctx.arc(40, 40, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Initial
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const initial = key.charAt(0).toUpperCase();
        ctx.fillText(initial, 40, 40);
        
        img.src = canvas.toDataURL();
    }

    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================

    function hexToRgb(hex, opacity = 1) {
        if (!hex) return '255, 180, 71';
        
        hex = hex.replace('#', '');
        
        let r, g, b;
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        } else {
            return '255, 180, 71';
        }
        
        return opacity === 1 ? `${r}, ${g}, ${b}` : `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    function lightenColor(color, percent) {
        if (!color) return '#ffffff';
        
        color = color.replace('#', '');
        const num = parseInt(color, 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    function darkenColor(color, percent) {
        if (!color) return '#000000';
        
        color = color.replace('#', '');
        const num = parseInt(color, 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (
            0x1000000 +
            (R > 0 ? R : 0) * 0x10000 +
            (G > 0 ? G : 0) * 0x100 +
            (B > 0 ? B : 0)
        ).toString(16).slice(1);
    }

    function createStatsHTML(stats) {
        if (!stats) return '';
        
        const maxStat = 5;
        return `
            <div class="stats-container">
                ${Object.entries(stats).map(([stat, value]) => `
                    <div class="stat-item">
                        <div class="stat-name">${stat.charAt(0).toUpperCase() + stat.slice(1)}</div>
                        <div class="stat-bar">
                            <div class="stat-fill" style="width: ${(value / maxStat) * 100}%"></div>
                        </div>
                        <div class="stat-value">${value}/5</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ============================================================================
    // ENHANCED VISUAL EFFECTS & ANIMATIONS
    // ============================================================================

    function injectEnhancedKeyframes() {
        const style = document.createElement('style');
        style.textContent = `
            /* Enhanced Animations */
            @keyframes honeyPop {
                0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.2) rotate(10deg); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
            }

            @keyframes enhancedFloat {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                25% { transform: translateY(-15px) rotate(2deg); }
                75% { transform: translateY(-5px) rotate(-2deg); }
            }

            @keyframes pulseGlow {
                0%, 100% { 
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1),
                                0 0 0 0 rgba(var(--glow-color), 0.7); 
                }
                50% { 
                    box-shadow: 0 5px 25px rgba(0,0,0,0.2),
                                0 0 20px 10px rgba(var(--glow-color), 0.4); 
                }
            }

            @keyframes cardEnter3D {
                0% {
                    transform: translate3d(var(--parallax-x, 0px), var(--parallax-y, 0px), 0) translateY(50px) rotateX(-45deg) scale(0.8) translateZ(0);
                    opacity: 0;
                }
                100% {
                    transform: translate3d(var(--parallax-x, 0px), var(--parallax-y, 0px), 0) translateY(0) rotateX(0deg) scale(1) translateZ(0);
                    opacity: 1;
                }
            }

            @keyframes rippleEffect {
                0% { transform: scale(0); opacity: 1; }
                100% { transform: scale(4); opacity: 0; }
            }

            .confetti-enhanced {
                animation: confetti-fall 3s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
            }

            @keyframes confetti-fall {
                0% { 
                    transform: translateY(-100px) rotate(0deg) scale(1);
                    opacity: 1;
                }
                100% { 
                    transform: translateY(100vh) rotate(720deg) scale(0);
                    opacity: 0;
                }
            }

            .character-card-enhanced {
                animation: cardEnter3D 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
                animation-delay: var(--card-delay, calc(var(--card-index, 0) * 0.15s));
                opacity: 0;
            }

            /* Performance optimizations */
            canvas {
                transform: translateZ(0);
                backface-visibility: hidden;
                will-change: transform, opacity;
            }

            .character-card { 
                --parallax-x: 0px;
                --parallax-y: 0px;
                will-change: transform, box-shadow; 
                transform: translate3d(var(--parallax-x), var(--parallax-y), 0) translateZ(0); 
                backface-visibility: hidden; 
            }

            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                *,
                *::before,
                *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
                
                .character-card {
                    animation: none !important;
                    transform: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================================================
    // ENHANCED CHARACTERS SECTION
    // ============================================================================

    function initEnhancedCharactersSection() {
        console.log('Initializing enhanced characters section...');

        const charactersContainer = DOM.$('#charactersGrid');
        if (!charactersContainer) {
            console.warn('Characters container not found.');
            return;
        }

        charactersContainer.innerHTML = '';
        charactersContainer.className = 'characters-grid-enhanced';

        // Create enhanced character cards
        Object.keys(characterData).forEach((key, index) => {
            const character = characterData[key];
            const card = document.createElement('div');
            card.className = 'character-card-enhanced character-card';
            card.setAttribute('data-character', key);
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `Learn more about ${character.name}`);
            
            // Set CSS custom properties
            const rgb = hexToRgb(character.color);
            card.style.setProperty('--card-index', index);
            card.style.setProperty('--glow-color', rgb);
            card.style.setProperty('--character-color', character.color);
            card.style.setProperty('--character-bg', character.bgColor);
            const animationDelay = (window.IS_MOBILE ? 0.15 : 0.1) * index;
            card.style.setProperty('--card-delay', `${animationDelay}s`);
            card.style.animationDelay = `${animationDelay}s`;
            card.style.borderColor = character.color;
            card.style.background = `linear-gradient(145deg, ${character.bgColor}, ${lightenColor(character.bgColor, 10)})`;
                
            // Enhanced card content
            card.innerHTML = `
                <div class="character-card-header-enhanced" style="background: ${character.bgColor}">
                    <div class="character-icon-enhanced" style="color: ${character.color}">
                        <i class="${character.icon} fa-3x"></i>
                    </div>
                    <div class="character-image-container">
                        <div class="character-image-placeholder-enhanced">
                            <div class="character-silhouette-enhanced" style="background: ${character.color}"></div>
                        </div>
                    </div>
                    <div class="character-glow-effect"></div>
                </div>
                <div class="character-card-body-enhanced">
                    <h3 class="character-name-enhanced">${character.name}</h3>
                    <p class="character-role-enhanced" style="color: ${character.color}">
                        <i class="fas fa-medal"></i> ${character.role}
                    </p>
                    <p class="character-quote-enhanced">${character.quote}</p>
                    
                    <div class="personality-traits">
                        ${character.personality.map(trait => 
                            `<span class="personality-tag" style="border-color: ${character.color}; color: ${character.color}">
                                <i class="fas fa-star"></i> ${trait}
                            </span>`
                        ).join('')}
                    </div>
                </div>
                <div class="character-card-footer-enhanced">
                    <button class="btn-character-info-enhanced" 
                            style="background: linear-gradient(135deg, ${character.color}, ${darkenColor(character.color, 10)});"
                            aria-label="Learn more about ${character.name}">
                        <i class="fas fa-info-circle"></i> Full Bio
                    </button>
                </div>
            `;

            // Add event listeners
            card.addEventListener('click', (e) => {
                e.preventDefault();
                showEnhancedCharacterModal(key);
            });
            
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    showEnhancedCharacterModal(key);
                }
            });

            const infoBtn = card.querySelector('.btn-character-info-enhanced');
            infoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showEnhancedCharacterModal(key);
            });

            charactersContainer.appendChild(card);
        });

        console.log('Enhanced characters section initialized');
    }

    // ============================================================================
    // ENHANCED CHARACTER MODAL
    // ============================================================================

    function initEnhancedCharacterModal() {
        console.log('Initializing enhanced character modal...');
        
        // Create modal if it doesn't exist
        let characterModal = DOM.$('#characterModal');
        if (!characterModal) {
            characterModal = document.createElement('div');
            characterModal.id = 'characterModal';
            characterModal.className = 'modal-overlay-enhanced';
            characterModal.innerHTML = `
                <div class="modal-content-enhanced">
                    <button class="modal-close-enhanced" id="closeCharacterModalEnhanced" aria-label="Close modal">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="modal-header-enhanced">
                        <div class="modal-character-icon-enhanced" id="modalCharacterIconEnhanced"></div>
                        <div class="modal-header-text">
                            <h2 id="characterModalTitleEnhanced" class="modal-title"></h2>
                            <p id="modalCharacterRoleEnhanced" class="modal-subtitle"></p>
                        </div>
                    </div>
                    
                    <div class="modal-body-enhanced">
                        <div class="modal-quote-section">
                            <blockquote id="modalCharacterQuoteEnhanced" class="modal-quote"></blockquote>
                        </div>
                        
                        <div class="modal-bio-section">
                            <h3><i class="fas fa-book-open"></i> Biography</h3>
                            <p id="modalCharacterBioEnhanced" class="modal-bio"></p>
                        </div>
                        
                        <div class="modal-details-enhanced" id="modalCharacterDetailsEnhanced"></div>
                        
                        <div class="modal-footer-enhanced">
                            <button class="modal-action-btn voice-btn">
                                <i class="fas fa-volume-up"></i> Play Voice
                            </button>
                            <button class="modal-action-btn close-btn">
                                <i class="fas fa-times"></i> Close
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(characterModal);
        }

        const modalContent = characterModal.querySelector('.modal-content-enhanced');
        const closeBtn = characterModal.querySelector('#closeCharacterModalEnhanced');
        const modalIcon = characterModal.querySelector('#modalCharacterIconEnhanced');
        const modalTitle = characterModal.querySelector('#characterModalTitleEnhanced');
        const modalRole = characterModal.querySelector('#modalCharacterRoleEnhanced');
        const modalQuote = characterModal.querySelector('#modalCharacterQuoteEnhanced');
        const modalBio = characterModal.querySelector('#modalCharacterBioEnhanced');
        const modalDetails = characterModal.querySelector('#modalCharacterDetailsEnhanced');
        const voiceBtn = characterModal.querySelector('.voice-btn');
        const closeModalBtn = characterModal.querySelector('.close-btn');

        // Global reference to current character
        window.currentModalCharacter = null;

        // Close modal function
        function closeEnhancedCharacterModal() {
            characterModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            if (modalContent) {
                modalContent.style.transform = 'translateY(100px) scale(0.95)';
                modalContent.style.opacity = '0';
            }
            
            document.removeEventListener('keydown', handleEscapeKey);
        }

        window.closeEnhancedCharacterModal = closeEnhancedCharacterModal;

        if (closeBtn) {
            closeBtn.addEventListener('click', closeEnhancedCharacterModal);
        }

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeEnhancedCharacterModal);
        }

        // Click outside to close
        characterModal.addEventListener('click', (ev) => {
            if (ev.target === characterModal) {
                closeEnhancedCharacterModal();
            }
        });

        // Escape key handler
        function handleEscapeKey(ev) {
            if (ev.key === 'Escape' && characterModal.classList.contains('active')) {
                closeEnhancedCharacterModal();
            }
        }

        // Voice button handler
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                if (window.currentModalCharacter && window.audioManager) {
                    window.audioManager.playCharacterSound(window.currentModalCharacter);
                }
            });
        }

        // Global function to show enhanced modal
        window.showEnhancedCharacterModal = function (key) {
            const data = characterData[key];
            if (!data || !characterModal) return;

            window.currentModalCharacter = key;

            // Prevent background scrolling
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');

            // Play opening sound
            if (window.audioManager) {
                window.audioManager.playSound('click');
            }

            // Update modal content
            if (modalIcon) {
                modalIcon.innerHTML = `<i class="${data.icon} fa-3x"></i>`;
                modalIcon.style.background = `linear-gradient(135deg, ${data.color}, ${darkenColor(data.color, 20)})`;
                modalIcon.style.color = '#FFFFFF';
            }

            if (modalTitle) {
                modalTitle.textContent = data.name;
                modalTitle.style.color = data.color;
            }

            if (modalRole) {
                modalRole.textContent = data.role;
                modalRole.style.color = data.color;
            }

            if (modalQuote) {
                modalQuote.textContent = data.quote;
                modalQuote.style.borderLeftColor = data.color;
                modalQuote.style.background = `${data.bgColor}22`;
            }

            if (modalBio) {
                modalBio.textContent = data.bio;
            }

            // Enhanced details section
            if (modalDetails) {
                modalDetails.innerHTML = `
                    <div class="modal-details-grid-enhanced">
                        <div class="detail-card">
                            <div class="detail-icon" style="color: ${data.color}">
                                <i class="fas fa-id-badge"></i>
                            </div>
                            <div class="detail-content">
                                <h4>Full Name</h4>
                                <p>${data.fullName}</p>
                            </div>
                        </div>
                        <div class="detail-card">
                            <div class="detail-icon" style="color: ${data.color}">
                                <i class="fas fa-lightbulb"></i>
                            </div>
                            <div class="detail-content">
                                <h4>Fun Fact</h4>
                                <p>${data.funFact}</p>
                            </div>
                        </div>
                        <div class="detail-card">
                            <div class="detail-icon" style="color: ${data.color}">
                                <i class="fas fa-volume-up"></i>
                            </div>
                            <div class="detail-content">
                                <h4>Voice Sample</h4>
                                <p class="voice-sample-enhanced">"${data.voiceSample}"</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-responsibilities-enhanced">
                        <h3><i class="fas fa-clipboard-check"></i> Responsibilities</h3>
                        <div class="responsibilities-grid">
                            ${data.responsibilities.map((resp, index) => `
                                <div class="responsibility-card" style="border-color: ${data.color}">
                                    <div class="responsibility-number">${index + 1}</div>
                                    <div class="responsibility-text">${resp}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Update modal theme
            characterModal.style.setProperty('--modal-color', data.color);
            characterModal.style.setProperty('--modal-bg-color', data.bgColor);

            // Show modal with animation
            characterModal.classList.add('active');
            
            // Animate in
            setTimeout(() => {
                if (modalContent) {
                    modalContent.style.transition = 'transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.5s ease';
                    modalContent.style.transform = 'translateY(0) scale(1)';
                    modalContent.style.opacity = '1';
                }
            }, 10);

            // Set up escape key listener
            document.addEventListener('keydown', handleEscapeKey);
            
            // Focus trap
            modalContent.focus();
        };

        console.log('Enhanced character modal initialized');
    }

    // ============================================================================
    // ENHANCED BASE UI
    // ============================================================================

    function initEnhancedBaseUI() {
        console.log('Initializing enhanced base UI...');
        
        const body = document.body;

        // DOM elements
        const storybookCover = DOM.$('#storybookCover');
        const openBookBtn = DOM.$('#openBookBtn');
        const contentSections = DOM.$$('.content-section');
        const scrollAnimateElements = DOM.$$('.scroll-animate');
        const navMenu = DOM.$('#navMenu');
        const navItems = DOM.$$('.nav-item');
        const navToggle = DOM.$('#navToggle');
        const loadingScreen = DOM.$('#loadingScreen');
        const musicToggle = DOM.$('#musicToggle');
        const motionToggle = DOM.$('#motionToggle');
        const bgMusic = DOM.$('#bgMusic');
        const rsvpForm = DOM.$('#rsvpForm');
        const rsvpStatus = DOM.$('#rsvpStatus');

        // ----------------- Enhanced Loading Screen -----------------
        function initEnhancedLoading() {
            if (!loadingScreen) return;

            const loadingContent = loadingScreen.querySelector('.loading-content') || 
                (() => {
                    const div = document.createElement('div');
                    div.className = 'loading-content';
                    loadingScreen.appendChild(div);
                    return div;
                })();

            loadingContent.innerHTML = `
                <div class="loading-animation">
                    <div class="loading-honeycomb">
                        ${Array(7).fill().map((_, i) => 
                            `<div class="hexagon" style="animation-delay: ${i * 0.1}s"></div>`
                        ).join('')}
                    </div>
                    <div class="loading-text">
                        <div class="loading-title">Hundred Acre Celebration</div>
                        <div class="loading-subtitle">Loading the magic...</div>
                    </div>
                </div>
            `;

            // Simulate loading progress
            setTimeout(() => {
                safeHideLoading();
            }, 2000);
        }

        function safeHideLoading() {
            if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.transform = 'scale(1.1)';
                
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    // Start content animations
                    contentSections.forEach((section, i) => {
                        setTimeout(() => {
                            section.classList.add('animate-in');
                            section.style.opacity = '1';
                            section.style.transform = 'translateY(0)';
                        }, i * 120);
                    });
                }, 500);
            }
        }

        setTimeout(() => {
            initEnhancedLoading();
        }, 100);

        // ----------------- Enhanced Storybook -----------------
        function openEnhancedStorybook() {
            if (!storybookCover) return;

            // Play sound
            if (window.audioManager) {
                window.audioManager.playSound('click');
            }

            // Enhanced animation
            storybookCover.style.transform = 'rotateY(180deg) scale(0.8)';
            storybookCover.style.opacity = '0';
            
            setTimeout(() => {
                storybookCover.classList.add('closed');
                
                // Enhanced scroll to first section
                const first = DOM.$('#section1');
                if (first) {
                    first.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 700);
        }

        if (openBookBtn) {
            openBookBtn.addEventListener('click', openEnhancedStorybook);
        }

        // ----------------- Enhanced Navigation -----------------
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('open');
                navToggle.classList.toggle('active');
                
                // Play sound
                if (window.audioManager) {
                    window.audioManager.playSound('click');
                }
            });
        }

        navItems.forEach((item) => {
            item.addEventListener('click', () => {
                if (navMenu) navMenu.classList.remove('open');
                if (navToggle) navToggle.classList.remove('active');
                
                // Play click sound
                if (window.audioManager) {
                    window.audioManager.playSound('click');
                }
            });
        });

        // ----------------- Enhanced Scroll Animations -----------------
        function checkEnhancedScrollAnimations() {
            const windowHeight = window.innerHeight;
            const triggerBottom = windowHeight * 0.75;

            scrollAnimateElements.forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.top < triggerBottom) {
                    el.classList.add('visible');
                    
                    // Add staggered animation
                    const delay = Array.from(scrollAnimateElements).indexOf(el) * 100;
                    setTimeout(() => {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                    }, delay);
                }
            });
        }

        // Throttle scroll events
        const throttledScroll = throttle(() => {
            checkEnhancedScrollAnimations();
        }, 16);

        window.addEventListener('scroll', throttledScroll);
        checkEnhancedScrollAnimations();

        // ----------------- Enhanced Motion Control -----------------
        function initEnhancedReduceMotionPreference() {
            const stored = localStorage.getItem('reduce-motion');
            const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            
            if (stored === 'true' || (stored === null && prefersReduced)) {
                body.classList.add('reduce-motion');
                if (motionToggle) {
                    motionToggle.classList.add('active');
                    const icon = motionToggle.querySelector('i');
                    if (icon) {
                        icon.className = 'fas fa-running';
                    }
                }
            }
        }

        function toggleEnhancedReduceMotion() {
            const enabled = body.classList.toggle('reduce-motion');
            localStorage.setItem('reduce-motion', enabled ? 'true' : 'false');
            
            if (motionToggle) {
                motionToggle.classList.toggle('active');
                const icon = motionToggle.querySelector('i');
                if (icon) {
                    icon.className = enabled ? 'fas fa-running' : 'fas fa-wind';
                }
                
                // Play feedback sound
                if (window.audioManager) {
                    window.audioManager.playSound('click');
                }
            }
        }

        initEnhancedReduceMotionPreference();

        if (motionToggle) {
            motionToggle.addEventListener('click', toggleEnhancedReduceMotion);
        }

        // ----------------- Enhanced Background Music -----------------
        function initEnhancedMusicPreference() {
            if (!musicToggle || !bgMusic) return;
            
            const stored = localStorage.getItem('bg-music');
            const icon = musicToggle.querySelector('i');

            if (stored === 'on') {
                bgMusic.volume = 0.35;
                bgMusic.muted = true;
                
                if (icon) {
                    icon.classList.remove('fa-volume-xmark');
                    icon.classList.add('fa-music');
                    musicToggle.classList.add('active');
                }
                
                // Set up interaction listener
                document.addEventListener('click', function enableAudioOnClick() {
                    bgMusic.muted = false;
                    bgMusic.play().catch(console.log);
                    document.removeEventListener('click', enableAudioOnClick);
                }, { once: true });
                
            } else if (stored === 'off' && icon) {
                icon.classList.remove('fa-music');
                icon.classList.add('fa-volume-xmark');
                musicToggle.classList.remove('active');
            } else {
                // Default state
                if (icon) {
                    icon.classList.remove('fa-music');
                    icon.classList.add('fa-volume-xmark');
                }
                localStorage.setItem('bg-music', 'off');
            }
        }

        function toggleEnhancedMusic() {
            if (!musicToggle || !bgMusic) return;
            
            const icon = musicToggle.querySelector('i');
            
            if (bgMusic.paused) {
                // Try to start music
                bgMusic.volume = 0.35;
                bgMusic.muted = false;
                
                const playPromise = bgMusic.play();
                playPromise.then(() => {
                    // Success
                    if (icon) {
                        icon.classList.remove('fa-volume-xmark');
                        icon.classList.add('fa-music');
                        musicToggle.classList.add('active');
                    }
                    localStorage.setItem('bg-music', 'on');
                    
                    // Visual feedback
                    musicToggle.style.transform = 'scale(1.2)';
                    setTimeout(() => {
                        musicToggle.style.transform = 'scale(1)';
                    }, 300);
                    
                }).catch(error => {
                    console.log("Playback failed:", error);
                    
                    if (icon) {
                        icon.classList.remove('fa-volume-xmark');
                        icon.classList.add('fa-music');
                        musicToggle.classList.add('active');
                    }
                    
                    // Set up one-time interaction
                    document.addEventListener('click', function retryPlayOnClick() {
                        bgMusic.play().then(() => {
                            localStorage.setItem('bg-music', 'on');
                        });
                        document.removeEventListener('click', retryPlayOnClick);
                    }, { once: true });
                });
            } else {
                // Pause music
                bgMusic.pause();
                if (icon) {
                    icon.classList.remove('fa-music');
                    icon.classList.add('fa-volume-xmark');
                    musicToggle.classList.remove('active');
                }
                localStorage.setItem('bg-music', 'off');
                
                // Visual feedback
                musicToggle.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    musicToggle.style.transform = 'scale(1)';
                }, 300);
            }
            
            // Play feedback sound
            if (window.audioManager) {
                window.audioManager.playSound('click');
            }
        }

        initEnhancedMusicPreference();

        if (musicToggle) {
            musicToggle.addEventListener('click', toggleEnhancedMusic);
        }

        // Initialize audio on first interaction
        document.addEventListener('click', function initAudioOnFirstInteraction() {
            if (window.audioManager) {
                window.audioManager.init();
            }
            document.removeEventListener('click', initAudioOnFirstInteraction);
        }, { once: true });

        // ----------------- Enhanced RSVP -----------------
        function createEnhancedConfetti() {
            const container = document.createElement('div');
            container.className = 'confetti-container-enhanced';
            document.body.appendChild(container);

            const colors = ['#FFC42B', '#D62E2E', '#E6B86A', '#B0D0E3'];

            for (let i = 0; i < (isMobileDevice() ? 50 : 100); i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti-enhanced';
                
                const size = 5 + Math.random() * 10;
                const color = colors[Math.floor(Math.random() * colors.length)];
                const fallDuration = 2 + Math.random() * 2;
                const delay = Math.random() * 1.5;
                
                confetti.style.cssText = `
                    position: fixed;
                    top: -30px;
                    left: ${Math.random() * 100}vw;
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    border-radius: 50%;
                    transform: rotate(${Math.random() * 360}deg);
                    animation: confetti-fall ${fallDuration}s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
                    animation-delay: ${delay}s;
                    z-index: 9998;
                `;
                
                container.appendChild(confetti);
            }

            setTimeout(() => container.remove(), 4000);
        }

        function handleEnhancedRsvpSubmit(ev) {
            ev.preventDefault();
            if (!rsvpForm || !rsvpStatus) return;

            const formData = new FormData(rsvpForm);
            const guestName = (formData.get('guestName') || '').toString().trim();

            if (!guestName) {
                rsvpStatus.textContent = 'Please enter your name.';
                rsvpStatus.style.color = '#dc3545';
                rsvpStatus.classList.add('error');
                
                // Shake animation
                shakeElement(rsvpForm);
                return;
            }

            // Success animation
            rsvpForm.style.transition = 'all 0.5s ease';
            rsvpForm.style.opacity = '0';
            rsvpForm.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                rsvpForm.style.display = 'none';
                rsvpStatus.style.opacity = '0';
                rsvpStatus.style.transform = 'translateY(20px)';
                
                rsvpStatus.innerHTML = `
                    <div class="form-success-enhanced">
                        <div class="success-icon">🎉</div>
                        <div class="success-message">Thank you, ${guestName}!</div>
                        <div class="success-submessage">
                            We're excited to celebrate with you!
                        </div>
                    </div>
                `;
                
                // Animate in
                setTimeout(() => {
                    rsvpStatus.style.opacity = '1';
                    rsvpStatus.style.transform = 'translateY(0)';
                }, 50);
            }, 500);

            // Enhanced celebrations
            createEnhancedConfetti();

            // Play celebration sounds
            if (window.audioManager) {
                window.audioManager.playGameSound('victory');
            }

            // Save to localStorage
            const rsvpData = {
                name: guestName,
                ts: new Date().toISOString(),
                confirmed: true
            };
            localStorage.setItem('babyGunnerRSVP', JSON.stringify(rsvpData));
        }

        function checkEnhancedExistingRSVP() {
            if (!rsvpForm || !rsvpStatus) return;
            const existing = localStorage.getItem('babyGunnerRSVP');
            if (!existing) return;

            const data = JSON.parse(existing);
            const nameInput = DOM.$('#guestName');

            if (nameInput) nameInput.value = data.name || '';

            if (data.confirmed) {
                rsvpForm.style.display = 'none';
                rsvpStatus.innerHTML = `
                    <div class="form-success-enhanced">
                        <div class="success-icon">✅</div>
                        <div class="success-message">RSVP Confirmed!</div>
                        <div class="success-submessage">
                            We have your RSVP for ${data.name}
                        </div>
                    </div>
                `;
            }
        }

        if (rsvpForm) {
            rsvpForm.addEventListener('submit', handleEnhancedRsvpSubmit);
        }
        checkEnhancedExistingRSVP();

        console.log('Enhanced base UI initialized');
    }

    // ============================================================================
    // ENHANCED GAME 1: HONEY HIVE DEFENSE - SIMPLIFIED
    // ============================================================================

    function initEnhancedDefenseGame() {
        console.log('Initializing enhanced Honey Hive Defense game...');
        
        const canvas = document.getElementById('defense-game');
        if (!canvas) {
            console.error('Defense game canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        const frameLimiter = new FrameRateLimiter(window.GAME_FPS_TARGET);
        
        // Game state
        let gameState = {
            honey: 100,
            lives: 10,
            wave: 1,
            score: 0,
            gameRunning: false,
            towers: [],
            enemies: [],
            lastFrameTime: performance.now()
        };
        
        // UI elements
        const honeySpan = document.getElementById('honey-count');
        const livesSpan = document.getElementById('lives-count');
        const waveSpan = document.getElementById('wave-count');
        const startBtn = document.getElementById('start-defense');
        
        // Update UI
        function syncEnhancedStats() {
            if (honeySpan) honeySpan.textContent = gameState.honey;
            if (livesSpan) livesSpan.textContent = gameState.lives;
            if (waveSpan) waveSpan.textContent = gameState.wave;
        }
        
        syncEnhancedStats();
        
        // Game rendering
        function drawEnhancedBackground() {
            // Sky gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#E3F2FD');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Ground
            ctx.fillStyle = '#8BC34A';
            ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
            
            // Path
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 40;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, 200);
            ctx.lineTo(200, 200);
            ctx.lineTo(200, 100);
            ctx.lineTo(400, 100);
            ctx.lineTo(400, 250);
            ctx.lineTo(canvas.width, 250);
            ctx.stroke();
            
            // Honey pot at end
            const sprite = Sprites.honey;
            if (sprite && sprite.complete) {
                ctx.drawImage(sprite, canvas.width - 60, 210, 50, 50);
            } else {
                // Fallback honey pot
                ctx.fillStyle = '#FFD54F';
                ctx.beginPath();
                ctx.arc(canvas.width - 35, 235, 20, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 4;
                ctx.stroke();
            }
        }
        
        // Game loop
        let animationFrameId = null;
        
        function enhancedGameLoop(timestamp) {
            if (frameLimiter.shouldRender(timestamp)) {
                const delta = timestamp - gameState.lastFrameTime;
                gameState.lastFrameTime = timestamp;
                
                if (gameState.gameRunning) {
                    // Update game logic here
                    // For now, just draw static scene
                }
                
                renderEnhancedGame();
            }
            
            if (gameState.gameRunning) {
                animationFrameId = requestAnimationFrame(enhancedGameLoop);
            }
        }
        
        function renderEnhancedGame() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawEnhancedBackground();
            
            // Draw towers
            gameState.towers.forEach(tower => {
                ctx.fillStyle = '#FFB347';
                ctx.beginPath();
                ctx.arc(tower.x, tower.y, 20, 0, Math.PI * 2);
                ctx.fill();
                
                // Tower details
                ctx.fillStyle = '#8B4513';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('P', tower.x, tower.y);
            });
            
            // Draw enemies
            gameState.enemies.forEach(enemy => {
                ctx.fillStyle = enemy.color;
                ctx.beginPath();
                ctx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2);
                ctx.fill();
                
                // Enemy icon
                ctx.fillStyle = '#000';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(enemy.char, enemy.x, enemy.y);
            });
        }
        
        // Start the game loop
        animationFrameId = requestAnimationFrame(enhancedGameLoop);
        
        // Event listeners
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                gameState.gameRunning = true;
                gameState.lastFrameTime = performance.now();
                
                if (window.audioManager) {
                    window.audioManager.playSound('click');
                }
            });
        }
        
        canvas.addEventListener('click', (ev) => {
            if (gameState.honey < 20) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = ev.clientX - rect.left;
            const y = ev.clientY - rect.top;
            
            // Don't place on path
            if (y > 180 && y < 220 && x < 220) return;
            if (x > 180 && x < 220 && y > 80 && y < 120) return;
            
            gameState.honey -= 20;
            syncEnhancedStats();
            
            gameState.towers.push({
                x,
                y,
                damage: 10,
                range: 100,
                fireRate: 1000
            });
            
            if (window.audioManager) {
                window.audioManager.playSound('click');
            }
        });
        
        console.log('Enhanced Honey Hive Defense game initialized');
    }

    // ============================================================================
    // ENHANCED GAME 2: HONEY POT CATCH - SIMPLIFIED
    // ============================================================================

    function initEnhancedHoneyCatchGame() {
        console.log('Initializing enhanced Honey Catch Game...');
        
        const canvas = document.getElementById('honey-game');
        if (!canvas) {
            console.error('Honey catch game canvas not found!');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        const frameLimiter = new FrameRateLimiter(window.GAME_FPS_TARGET);
        
        // Game state
        let gameState = {
            score: 0,
            timeLeft: 60,
            lives: 3,
            gameRunning: false,
            poohX: canvas.width / 2,
            poohY: canvas.height - 80,
            poohWidth: 60,
            poohHeight: 60,
            honeyPots: [],
            lastFrameTime: performance.now()
        };
        
        // UI elements
        const scoreSpan = document.getElementById('score-count');
        const timeSpan = document.getElementById('time-count');
        const livesSpan = document.getElementById('catch-lives');
        const startBtn = document.getElementById('start-catch');
        
        // Update UI
        function syncEnhancedCatchStats() {
            if (scoreSpan) scoreSpan.textContent = gameState.score;
            if (timeSpan) timeSpan.textContent = gameState.timeLeft;
            if (livesSpan) livesSpan.textContent = gameState.lives;
        }
        
        syncEnhancedCatchStats();
        
        // Game rendering
        function drawEnhancedCatchBackground() {
            // Sky gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#E3F2FD');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Sun
            ctx.fillStyle = '#FFEB3B';
            ctx.beginPath();
            ctx.arc(80, 80, 35, 0, Math.PI * 2);
            ctx.fill();
            
            // Ground
            ctx.fillStyle = '#8BC34A';
            ctx.fillRect(0, canvas.height - 70, canvas.width, 70);
        }
        
        function drawEnhancedPooh() {
            const sprite = Sprites.pooh;
            const poohY = gameState.poohY - gameState.poohHeight;
            
            if (sprite && sprite.complete) {
                ctx.drawImage(sprite, gameState.poohX - gameState.poohWidth/2, poohY, gameState.poohWidth, gameState.poohHeight);
            } else {
                // Fallback Pooh
                ctx.fillStyle = '#FFB347';
                ctx.beginPath();
                ctx.arc(gameState.poohX, poohY + gameState.poohHeight/2, gameState.poohWidth/2, 0, Math.PI * 2);
                ctx.fill();
                
                // Face
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(gameState.poohX - 10, poohY + 20, 3, 0, Math.PI * 2);
                ctx.arc(gameState.poohX + 10, poohY + 20, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Smile
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(gameState.poohX, poohY + 30, 10, 0.2, Math.PI - 0.2, false);
                ctx.stroke();
            }
        }
        
        // Game loop
        let catchAnimationFrameId = null;
        let timerInterval = null;
        
        function enhancedCatchGameLoop(timestamp) {
            if (frameLimiter.shouldRender(timestamp)) {
                const delta = timestamp - gameState.lastFrameTime;
                gameState.lastFrameTime = timestamp;
                
                if (gameState.gameRunning) {
                    updateEnhancedCatchGame(delta);
                }
                renderEnhancedCatchGame();
            }
            
            catchAnimationFrameId = requestAnimationFrame(enhancedCatchGameLoop);
        }
        
        function updateEnhancedCatchGame(delta) {
            const deltaTime = delta / 16;
            
            // Update honey pots
            for (let i = gameState.honeyPots.length - 1; i >= 0; i--) {
                const pot = gameState.honeyPots[i];
                pot.y += pot.speed * deltaTime;
                
                // Check collision with Pooh
                if (pot.y > gameState.poohY - gameState.poohHeight && 
                    pot.x > gameState.poohX - gameState.poohWidth/2 && 
                    pot.x < gameState.poohX + gameState.poohWidth/2) {
                    
                    gameState.score += 10;
                    gameState.honeyPots.splice(i, 1);
                    syncEnhancedCatchStats();
                    
                    if (window.audioManager) {
                        window.audioManager.playGameSound('collect');
                    }
                    continue;
                }
                
                // Remove if off screen
                if (pot.y > canvas.height + 20) {
                    gameState.honeyPots.splice(i, 1);
                }
            }
            
            // Spawn new honey pots
            if (gameState.honeyPots.length < 5 && Math.random() < 0.03) {
                gameState.honeyPots.push({
                    x: Math.random() * (canvas.width - 40) + 20,
                    y: -20,
                    speed: 2 + Math.random() * 1.5
                });
            }
        }
        
        function renderEnhancedCatchGame() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawEnhancedCatchBackground();
            drawEnhancedPooh();
            
            // Draw honey pots
            gameState.honeyPots.forEach(pot => {
                const sprite = Sprites.honey;
                if (sprite && sprite.complete) {
                    ctx.drawImage(sprite, pot.x - 16, pot.y - 16, 32, 32);
                } else {
                    ctx.fillStyle = '#FFD54F';
                    ctx.beginPath();
                    ctx.arc(pot.x, pot.y, 12, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.strokeStyle = '#8B4513';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            });
            
            // Draw UI
            ctx.fillStyle = '#4E342E';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`Score: ${gameState.score}`, 20, 30);
            ctx.fillText(`Time: ${gameState.timeLeft}s`, canvas.width - 150, 30);
            ctx.fillText(`Lives: ${gameState.lives}`, canvas.width / 2 - 50, 30);
        }
        
        // Start the game loop
        catchAnimationFrameId = requestAnimationFrame(enhancedCatchGameLoop);
        
        // Game control functions
        function startEnhancedGame() {
            if (gameState.gameRunning) return;
            
            // Reset game state
            gameState.score = 0;
            gameState.lives = 3;
            gameState.timeLeft = 60;
            gameState.poohX = canvas.width / 2;
            gameState.honeyPots = [];
            
            syncEnhancedCatchStats();
            
            gameState.gameRunning = true;
            
            // Start timer
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                gameState.timeLeft--;
                syncEnhancedCatchStats();
                if (gameState.timeLeft <= 0) {
                    endEnhancedGame(true);
                }
            }, 1000);
            
            if (window.audioManager) {
                window.audioManager.playSound('click');
            }
        }
        
        function endEnhancedGame(timeExpired) {
            gameState.gameRunning = false;
            clearInterval(timerInterval);
            
            if (window.audioManager) {
                if (timeExpired) {
                    window.audioManager.playGameSound('victory');
                } else {
                    window.audioManager.playGameSound('defeat');
                }
            }
        }
        
        // Event listeners
        if (startBtn) {
            startBtn.addEventListener('click', startEnhancedGame);
        }
        
        // Controls
        canvas.addEventListener('mousemove', (ev) => {
            if (!gameState.gameRunning) return;
            const rect = canvas.getBoundingClientRect();
            gameState.poohX = ev.clientX - rect.left;
            gameState.poohX = Math.max(gameState.poohWidth/2, Math.min(canvas.width - gameState.poohWidth/2, gameState.poohX));
        });
        
        console.log('Enhanced Honey Catch Game initialized');
    }

    // ============================================================================
    // ENHANCED CSS INJECTION
    // ============================================================================

    function injectEnhancedCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Enhanced Global Styles */
            :root {
                --pooh-yellow: #FFB347;
                --piglet-pink: #FFB6C1;
                --tigger-orange: #FF8C42;
                --eeyore-gray: #C0C0C0;
                --honey-gold: #FFD54F;
            }
            
            /* Enhanced Character Cards */
            .characters-grid-enhanced {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                gap: 2rem;
                padding: 2rem;
            }
            
            .character-card-enhanced {
                background: linear-gradient(145deg, #ffffff, #f0f0f0);
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                border: 3px solid;
                transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
                position: relative;
                cursor: pointer;
            }
            
            .character-card-header-enhanced {
                padding: 2rem;
                text-align: center;
                position: relative;
                min-height: 200px;
                background: linear-gradient(135deg, var(--character-bg), transparent);
            }
            
            .character-icon-enhanced {
                font-size: 3rem;
                margin-bottom: 1.5rem;
                filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
            }
            
            .character-image-container {
                position: relative;
                width: 140px;
                height: 140px;
                margin: 0 auto;
            }
            
            .character-image-placeholder-enhanced {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                overflow: hidden;
                position: relative;
                border: 4px solid white;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            }
            
            .character-silhouette-enhanced {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                opacity: 0.1;
            }
            
            .character-card-body-enhanced {
                padding: 1.5rem;
            }
            
            .character-name-enhanced {
                color: #333;
                font-size: 1.8rem;
                margin-bottom: 0.5rem;
                font-weight: 800;
            }
            
            .character-role-enhanced {
                font-weight: 700;
                margin-bottom: 1.5rem;
                font-size: 0.95rem;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .character-quote-enhanced {
                color: #666;
                font-style: italic;
                margin-bottom: 1.5rem;
                line-height: 1.6;
                border-left: 4px solid;
                padding-left: 1rem;
                font-size: 0.95rem;
                background: linear-gradient(90deg, transparent, var(--character-bg) 20%);
                padding: 1rem;
                border-radius: 0 10px 10px 0;
            }
            
            .personality-traits {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin: 1.5rem 0;
            }
            
            .personality-tag {
                padding: 0.4rem 0.8rem;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 500;
                border: 2px solid;
                display: flex;
                align-items: center;
                gap: 0.4rem;
                background: rgba(255, 255, 255, 0.5);
            }
            
            .character-card-footer-enhanced {
                padding: 1.5rem;
                background: linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.05));
                border-top: 1px solid rgba(0,0,0,0.1);
                display: flex;
                justify-content: center;
            }
            
            .btn-character-info-enhanced {
                padding: 0.75rem 1.5rem;
                border-radius: 12px;
                border: none;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                font-size: 0.85rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: white;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            
            .btn-character-info-enhanced:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            }
            
            /* Enhanced Modal */
            .modal-overlay-enhanced {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(10px);
            }
            
            .modal-overlay-enhanced.active {
                display: flex;
            }
            
            .modal-content-enhanced {
                background: white;
                border-radius: 25px;
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                transform: translateY(100px) scale(0.9);
                opacity: 0;
                transition: transform 0.5s ease, opacity 0.5s ease;
                box-shadow: 0 25px 50px rgba(0,0,0,0.3);
                border: 2px solid var(--modal-color, #FFB347);
            }
            
            .modal-overlay-enhanced.active .modal-content-enhanced {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
            
            .modal-close-enhanced {
                position: absolute;
                top: 20px;
                right: 20px;
                background: var(--modal-color, #FFB347);
                color: white;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                font-size: 1.2rem;
                cursor: pointer;
                z-index: 100;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .modal-close-enhanced:hover {
                transform: rotate(90deg) scale(1.1);
            }
            
            .modal-header-enhanced {
                padding: 3rem 2rem 2rem;
                text-align: center;
                background: linear-gradient(135deg, var(--modal-bg-color, #FFF3E0), transparent);
                border-bottom: 2px solid var(--modal-color, #FFB347);
                position: relative;
            }
            
            .modal-character-icon-enhanced {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 3.5rem;
                margin: 0 auto 1.5rem;
                box-shadow: 0 15px 35px rgba(0,0,0,0.2);
                border: 5px solid white;
            }
            
            .modal-title {
                color: var(--modal-color, #FFB347);
                font-size: 2.5rem;
                margin-bottom: 0.5rem;
                font-weight: 800;
            }
            
            .modal-subtitle {
                color: #666;
                font-size: 1.1rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 2px;
            }
            
            .modal-body-enhanced {
                padding: 2rem;
            }
            
            .modal-quote-section {
                margin-bottom: 2rem;
                padding: 1.5rem;
                background: linear-gradient(90deg, transparent, var(--modal-bg-color, #FFF3E0) 20%);
                border-radius: 15px;
                border-left: 5px solid var(--modal-color, #FFB347);
            }
            
            .modal-quote {
                font-size: 1.1rem;
                font-style: italic;
                color: #555;
                line-height: 1.6;
                margin: 0;
            }
            
            .modal-bio-section {
                margin-bottom: 2rem;
            }
            
            .modal-bio-section h3 {
                color: var(--modal-color, #FFB347);
                font-size: 1.5rem;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .modal-bio {
                color: #444;
                line-height: 1.7;
                font-size: 1.05rem;
                margin: 0;
            }
            
            .modal-details-grid-enhanced {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
                margin: 2.5rem 0;
            }
            
            .detail-card {
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                border-radius: 15px;
                padding: 1.5rem;
                display: flex;
                gap: 1rem;
                align-items: flex-start;
                transition: all 0.3s ease;
            }
            
            .detail-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            
            .detail-icon {
                font-size: 2rem;
                min-width: 60px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                border-radius: 50%;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            .detail-content h4 {
                color: #666;
                font-size: 0.9rem;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .detail-content p {
                color: #333;
                margin: 0;
                line-height: 1.5;
            }
            
            .voice-sample-enhanced {
                font-style: italic;
                color: #666;
                background: rgba(0,0,0,0.03);
                padding: 1rem;
                border-radius: 10px;
                border-left: 4px solid var(--modal-color, #FFB347);
                margin: 0;
                line-height: 1.5;
            }
            
            .modal-responsibilities-enhanced {
                margin-top: 2.5rem;
            }
            
            .modal-responsibilities-enhanced h3 {
                color: var(--modal-color, #FFB347);
                font-size: 1.5rem;
                margin-bottom: 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .responsibilities-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }
            
            .responsibility-card {
                background: white;
                border-radius: 15px;
                padding: 1.5rem;
                text-align: center;
                border: 2px solid var(--modal-color, #FFB347);
                transition: all 0.3s ease;
                position: relative;
            }
            
            .responsibility-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 30px rgba(0,0,0,0.1);
            }
            
            .responsibility-number {
                position: absolute;
                top: 10px;
                left: 10px;
                background: var(--modal-color, #FFB347);
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 0.9rem;
            }
            
            .responsibility-text {
                color: #333;
                font-weight: 500;
                margin-top: 0.5rem;
            }
            
            .modal-footer-enhanced {
                padding: 2rem;
                background: linear-gradient(to top, rgba(0,0,0,0.02), transparent);
                border-top: 1px solid rgba(0,0,0,0.1);
                display: flex;
                gap: 1rem;
                justify-content: center;
            }
            
            .modal-action-btn {
                padding: 0.75rem 1.5rem;
                border-radius: 25px;
                border: none;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.9rem;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .modal-action-btn.voice-btn {
                background: linear-gradient(135deg, var(--modal-color, #FFB347), #FF8C42);
                color: white;
            }
            
            .modal-action-btn.close-btn {
                background: #666;
                color: white;
            }
            
            .modal-action-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            }
            
            /* Game canvases */
            #defense-game, #honey-game {
                background: white;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                border: 3px solid #FFB347;
                display: block;
                margin: 0 auto;
            }
            
            /* Responsive Design */
            @media (max-width: 768px) {
                .characters-grid-enhanced {
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                    padding: 1rem;
                }
                
                .modal-details-grid-enhanced,
                .responsibilities-grid {
                    grid-template-columns: 1fr;
                }
                
                .modal-footer-enhanced {
                    flex-direction: column;
                }
                
                .modal-action-btn {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(style);
        console.log('Enhanced CSS injected');
    }

    // ============================================================================
    // BOOTSTRAP ENHANCED - COMPLETE
    // ============================================================================

    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM loaded, initializing enhanced components...");
        
        // Initialize optimizations
        optimizeForDevice();
        
        // Initialize systems
        window.audioManager = new EnhancedAudioManager();
        
        // Load assets and inject styles
        loadSprites();
        injectEnhancedKeyframes();
        injectEnhancedCSS();
        
        // Initialize UI components
        setTimeout(() => {
            initEnhancedBaseUI();
            initEnhancedCharactersSection();
            initEnhancedCharacterModal();
            
            // Initialize games
            initEnhancedDefenseGame();
            initEnhancedHoneyCatchGame();
            
            console.log("All enhanced components initialized!");
        }, 100);
    });

    // Make functions available globally
    window.showEnhancedCharacterModal = window.showEnhancedCharacterModal || function(key) {
        console.log('Showing character modal for:', key);
    };
    
    window.closeEnhancedCharacterModal = window.closeEnhancedCharacterModal || function() {
        console.log('Closing character modal');
    };

})();
