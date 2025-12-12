// Hundred Acre Celebration - ENHANCED VERSION - FIXED
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
                    // Could update an FPS counter in the UI
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

    // Enhanced batch DOM updates
    function batchDOMUpdates(callback) {
        if (typeof callback !== 'function') return;
        
        // Use requestAnimationFrame for animation updates
        // Use setTimeout for non-visual updates
        if (callback.name.includes('render') || callback.name.includes('draw') || callback.name.includes('animate')) {
            requestAnimationFrame(callback);
        } else {
            setTimeout(callback, 0);
        }
    }

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
            window.PARTICLE_QUALITY = 'low';
        } else if (isHighPerf) {
            window.MAX_PARTICLES = 200;
            window.GAME_FPS_TARGET = 60;
            window.GRAPHICS_QUALITY = 'high';
            window.PARTICLE_QUALITY = 'high';
        } else {
            window.MAX_PARTICLES = 100;
            window.GAME_FPS_TARGET = 60;
            window.GRAPHICS_QUALITY = 'medium';
            window.PARTICLE_QUALITY = 'medium';
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
        },
        
        updateCache(sel, element) {
            this.cache.set(sel, element);
        }
    };

    // Quick DOM helpers for one-off queries
    const $ = DOM.$.bind(DOM);

    // Enhanced shake effect with configurable parameters
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
                fire: { color: '#FF6B6B', size: { min: 4, max: 10 }, life: 1.2 },
                leaf: { color: '#4CAF50', size: { min: 4, max: 8 }, life: 2.0 },
                magic: { color: '#BA68C8', size: { min: 3, max: 6 }, life: 1.0 }
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

        createEmitter(x, y, config = {}) {
            const emitter = {
                x, y,
                type: config.type || 'honey',
                rate: config.rate || 10,
                lastEmission: 0,
                active: true,
                duration: config.duration || Infinity,
                startTime: Date.now()
            };
            
            this.emitters.push(emitter);
            return emitter;
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
                
                // Special rendering for different particle types
                switch(p.type) {
                    case 'sparkle':
                        this.ctx.globalAlpha = alpha * 0.8;
                        this.ctx.fillStyle = p.color;
                        this.ctx.beginPath();
                        this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                        this.ctx.fill();
                        
                        // Add glow
                        this.ctx.shadowColor = p.color;
                        this.ctx.shadowBlur = 10 * alpha;
                        this.ctx.fill();
                        this.ctx.shadowBlur = 0;
                        break;
                        
                    case 'leaf':
                        this.ctx.globalAlpha = alpha;
                        this.ctx.fillStyle = p.color;
                        this.ctx.save();
                        this.ctx.translate(p.x, p.y);
                        this.ctx.rotate(p.rotation);
                        this.ctx.beginPath();
                        this.ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.restore();
                        break;
                        
                    default:
                        this.ctx.globalAlpha = alpha;
                        this.ctx.fillStyle = p.color;
                        this.ctx.beginPath();
                        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        this.ctx.fill();
                }
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
            // Only proceed if we haven't initialized already
            if (this.audioContext) {
                return;
            }

            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.gainNode = this.audioContext.createGain();
                this.gainNode.connect(this.audioContext.destination);
                this.gainNode.gain.value = this.masterVolume;

                // Create audio buffer cache
                this.createSoundBuffers();

                console.log('Audio system initialized successfully by user gesture');

                // If a music track was supposed to play on load, start it now.
                this.tryResumeBackgroundMusic();
            } catch (e) {
                console.warn('Web Audio API not supported, using fallback sounds');
                this.isEnabled = false;
            }
        }

        tryResumeBackgroundMusic() {
            const bgMusic = document.getElementById('bgMusic');
            if (bgMusic && localStorage.getItem('bg-music') === 'on') {
                // Ensure music is muted first to comply with some browser policies
                bgMusic.muted = true;
                const playPromise = bgMusic.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('Background music auto-resumed after user gesture');
                        // Optionally unmute here if you want sound immediately
                        // bgMusic.muted = false;
                    }).catch(e => {
                        console.log("Could not auto-play background music:", e);
                    });
                }
            }
        }

        createSoundBuffers() {
            // Create simple tones as buffers
            const frequencies = {
                click: [440, 554.37, 659.25],
                collect: [523.25, 659.25, 783.99],
                damage: [220, 174.61, 130.81],
                victory: [523.25, 659.25, 783.99, 1046.50],
                defeat: [349.23, 293.66, 261.63],
                powerup: [659.25, 830.61, 1046.50]
            };

            Object.keys(frequencies).forEach(key => {
                this.sounds.set(key, frequencies[key]);
            });
        }

        playTone(frequencies, duration = 0.2, type = 'sine', volume = 0.1) {
            if (!this.isEnabled || !this.audioContext) {
                this.playFallbackSound(frequencies[0]);
                return;
            }

            const now = this.audioContext.currentTime;
            
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.gainNode);
                    
                    oscillator.type = type;
                    oscillator.frequency.setValueAtTime(freq, now);
                    
                    gainNode.gain.setValueAtTime(volume, now);
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
                eeyore: { frequencies: [220, 262, 330], duration: 0.2 },
                owl: { frequencies: [440, 554, 659], duration: 0.15 },
                roo: { frequencies: [659, 784, 880], duration: 0.09 }
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
                defeat: 'defeat',
                powerup: 'powerup',
                click: 'click'
            };

            if (gameSounds[type]) {
                this.playSound(gameSounds[type]);
            }
        }

        setVolume(volume) {
            this.masterVolume = Math.max(0, Math.min(1, volume));
            if (this.gainNode) {
                this.gainNode.gain.value = this.masterVolume;
            }
        }

        mute() {
            if (this.gainNode) {
                this.gainNode.gain.value = 0;
            }
        }

        unmute() {
            if (this.gainNode) {
                this.gainNode.gain.value = this.masterVolume;
            }
        }

        playFallbackSound(pitch) {
            // Fallback for browsers without Web Audio
            try {
                const audio = new Audio();
                const context = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(context.destination);
                
                oscillator.frequency.value = pitch;
                gainNode.gain.value = 0.1;
                
                oscillator.start();
                setTimeout(() => oscillator.stop(), 100);
            } catch (e) {
                console.log('Fallback audio failed');
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
        owl: null,
        roo: null,
        honey: null
    };

    // COMPLETE character data with all required properties
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
        },
        owl: {
            name: "Owl",
            quote: "A wise old owl knows that every new arrival brings new stories to tell.",
            bio: "Owl is the knowledgeable historian who will share tales of Hundred Acre Wood and offer wise advice for the new parents. His stories entertain both young and old.",
            icon: "fas fa-feather-alt",
            color: "#8B4513",
            bgColor: "#F5F5DC",
            role: "Wise Storyteller",
            personality: ["Wise", "Knowledgeable", "Storyteller", "Patient"],
            responsibilities: ["Share stories", "Offer advice", "Entertain guests"],
            stats: {
                sweetness: 3,
                strength: 2,
                wisdom: 5,
                speed: 3
            },
            fullName: "Owl",
            funFact: "Can spell his name 'WOL'",
            voiceSample: "Let me tell you a story..."
        },
        roo: {
            name: "Roo",
            quote: "Babies are fun! Can we play?",
            bio: "Little Roo represents the joy and wonder of childhood. He's excited to have a new friend to play with and reminds everyone to keep the celebration light-hearted and fun.",
            icon: "fas fa-child",
            color: "#87CEEB",
            bgColor: "#E0F7FA",
            role: "Joy Ambassador",
            personality: ["Playful", "Curious", "Energetic", "Sweet"],
            responsibilities: ["Bring joy", "Remind to have fun", "Represent childhood"],
            stats: {
                sweetness: 5,
                strength: 1,
                wisdom: 2,
                speed: 4
            },
            fullName: "Roo",
            funFact: "Lives in his mother Kanga's pouch",
            voiceSample: "Look at me!"
        }
    };

    // Enhanced sprite loading with progress tracking
    function loadSprites() {
        console.log('Loading sprites...');
        
        const paths = {
            pooh: 'Images/Characters/honey-bear.png',
            piglet: 'Images/Characters/piglet.png',
            tigger: 'Images/Characters/tigger.png',
            eeyore: 'Images/Characters/eeyore.png',
            owl: 'Images/Characters/owl.png',
            roo: 'Images/Characters/roo.png',
            honey: 'Images/honey.png'
        };

        let loadedCount = 0;
        const totalCount = Object.keys(paths).length;

        function updateProgress() {
            loadedCount++;
            const progress = Math.round((loadedCount / totalCount) * 100);
            console.log(`Sprite loading: ${progress}% (${loadedCount}/${totalCount})`);
            
            // Update progress bar if exists
            const progressBar = document.querySelector('.loading-progress');
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            
            if (loadedCount === totalCount) {
                console.log('All sprites loaded successfully!');
                updateEnhancedCharacterCardImages();
            }
        }

        Object.keys(paths).forEach((key) => {
            const img = new Image();
            img.src = paths[key];
            img.onload = () => {
                console.log(`✓ Loaded: ${key}`);
                Sprites[key] = img;
                updateProgress();
            };
            img.onerror = () => {
                console.warn(`✗ Failed to load: ${key}, using fallback`);
                createEnhancedFallbackSprite(img, key);
                Sprites[key] = img;
                updateProgress();
            };
        });
    }

    function createEnhancedFallbackSprite(img, key) {
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 80;
        const ctx = canvas.getContext('2d');
        
        // Character-specific styling
        const styles = {
            pooh: { 
                color: '#FFB347', bgColor: '#FFF3E0', 
                details: { shirt: '#D62E2E', belly: '#FFD8A6' }
            },
            piglet: { 
                color: '#FFB6C1', bgColor: '#FFF0F5',
                details: { ears: '#FF8FA3' }
            },
            tigger: { 
                color: '#FF8C42', bgColor: '#FFECB3',
                details: { stripes: '#D2691E' }
            },
            eeyore: { 
                color: '#C0C0C0', bgColor: '#F5F5F5',
                details: { tail: '#8B4513' }
            },
            owl: { 
                color: '#8B4513', bgColor: '#F5F5DC',
                details: { eyes: '#4A351C' }
            },
            roo: { 
                color: '#87CEEB', bgColor: '#E0F7FA',
                details: { pouch: '#64B5F6' }
            },
            honey: { 
                color: '#FFD54F', bgColor: '#FFF8E1',
                details: { lid: '#8B4513' }
            }
        };
        
        const style = styles[key] || styles.pooh;
        
        // Draw background
        ctx.fillStyle = style.bgColor;
        ctx.fillRect(0, 0, 80, 80);
        
        // Character-specific drawing
        if (key === 'pooh') {
            drawPoohFallback(ctx, style);
        } else if (key === 'honey') {
            drawHoneyFallback(ctx, style);
        } else {
            // Generic character fallback
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
        }
        
        img.src = canvas.toDataURL();
    }

    function drawPoohFallback(ctx, style) {
        // Body
        ctx.fillStyle = style.color;
        ctx.beginPath();
        ctx.arc(40, 40, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Belly
        ctx.fillStyle = style.details.belly;
        ctx.beginPath();
        ctx.ellipse(40, 48, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Shirt
        ctx.fillStyle = style.details.shirt;
        ctx.fillRect(20, 55, 40, 15);
        
        // Face details
        ctx.fillStyle = '#000000';
        // Eyes
        ctx.beginPath();
        ctx.arc(32, 32, 3, 0, Math.PI * 2);
        ctx.arc(48, 32, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(40, 40, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Smile
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(40, 46, 10, 0.2, Math.PI - 0.2, false);
        ctx.stroke();
        
        // Ears
        ctx.fillStyle = style.color;
        ctx.beginPath();
        ctx.arc(25, 20, 10, 0, Math.PI * 2);
        ctx.arc(55, 20, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner ears
        ctx.fillStyle = style.details.belly;
        ctx.beginPath();
        ctx.arc(25, 20, 5, 0, Math.PI * 2);
        ctx.arc(55, 20, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawHoneyFallback(ctx, style) {
        // Pot
        ctx.fillStyle = style.color;
        ctx.beginPath();
        ctx.arc(40, 40, 25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = style.details.lid;
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Lid
        ctx.fillStyle = style.details.lid;
        ctx.fillRect(25, 15, 30, 8);
        ctx.fillRect(30, 10, 20, 5);
        
        // Honey drip
        ctx.fillStyle = '#FFB300';
        ctx.beginPath();
        ctx.ellipse(40, 55, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Glint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(30, 30, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // ============================================================================
    // MISSING HELPER FUNCTIONS - ADDED
    // ============================================================================

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

    function hexToRgb(hex, opacity = 1) {
        if (!hex) return '255, 180, 71';
        
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse hex
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
                    filter: blur(10px);
                }
                100% {
                    transform: translate3d(var(--parallax-x, 0px), var(--parallax-y, 0px), 0) translateY(0) rotateX(0deg) scale(1) translateZ(0);
                    opacity: 1;
                    filter: blur(0);
                }
            }

            @keyframes sparkleTrail {
                0% { transform: scale(1) rotate(0deg); opacity: 1; }
                100% { transform: scale(0) rotate(180deg); opacity: 0; }
            }

            @keyframes rippleEffect {
                0% { transform: scale(0); opacity: 1; }
                100% { transform: scale(4); opacity: 0; }
            }

            @keyframes shakeEnhanced {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }

            .confetti-enhanced {
                animation: confetti-fall 3s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
            }

            @keyframes confetti-fall {
                0% { 
                    transform: translateY(-100px) rotate(0deg) scale(1);
                    opacity: 1;
                }
                70% { opacity: 0.8; }
                100% { 
                    transform: translateY(100vh) rotate(720deg) scale(0);
                    opacity: 0;
                }
            }

            .character-card-enhanced {
                animation: cardEnter3D 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
                animation-delay: var(--card-delay, calc(var(--card-index, 0) * 0.15s));
                opacity: 0;
                transform-style: preserve-3d;
                perspective: 1000px;
            }

            /* Enhanced hover effects */
            .character-card:hover {
                animation: card-hover 0.3s ease-out forwards;
            }

            @keyframes card-hover {
                0% { transform: translateY(0) scale(1); }
                100% { transform: translateY(-10px) scale(1.02); }
            }

            /* Performance optimizations */
            canvas {
                transform: translateZ(0);
                backface-visibility: hidden;
                perspective: 1000px;
                will-change: transform, opacity;
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
            }

            .game-container {
                transform: translateZ(0);
                will-change: transform;
                contain: layout style paint;
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
                    scroll-behavior: auto !important;
                }
                
                .character-card {
                    animation: none !important;
                    transform: none !important;
                }
            }

            /* Touch device optimizations */
            @media (hover: none) and (pointer: coarse) {
                .character-card:hover {
                    transform: none !important;
                    animation: none !important;
                }

                .character-card:active {
                    transform: scale(0.98) translateZ(0) !important;
                    transition: transform 0.1s ease !important;
                }
            }

            /* High performance device enhancements */
            @media (min-width: 1200px) and (min-height: 800px) {
                .character-card {
                    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.15));
                }
                
                canvas {
                    filter: drop-shadow(0 5px 15px rgba(0,0,0,0.1));
                }
            }

            /* Loading animations */
            @keyframes loadingPulse {
                0%, 100% { opacity: 0.5; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.05); }
            }

            .loading-element {
                animation: loadingPulse 1.5s ease-in-out infinite;
            }
            
            /* Sparkle fall animation */
            @keyframes sparkle-fall {
                0%   { transform: translateY(0) rotate(0deg);    opacity: 0; }
                10%  { opacity: 1; }
                90%  { opacity: 0.7; }
                100% { transform: translateY(100px) rotate(180deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        console.log('Enhanced keyframes injected');
    }

    // ============================================================================
    // ENHANCED CHARACTERS SECTION - FIXED
    // ============================================================================

    function initEnhancedCharactersSection() {
        console.log('Initializing enhanced characters section...');

        const charactersContainer = DOM.$('#charactersGrid');
        if (!charactersContainer) {
            console.warn('Characters container (#charactersGrid) not found. Creating one...');
            const charactersSection = DOM.$('#characters');
            if (charactersSection) {
                charactersContainer = document.createElement('div');
                charactersContainer.id = 'charactersGrid';
                charactersContainer.className = 'characters-grid-enhanced';
                charactersSection.appendChild(charactersContainer);
            } else {
                return;
            }
        }

        // Clear and prepare
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
                
            // Click/tap handling
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

            // Enhanced card content - SIMPLIFIED VERSION
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

            // Add event listener to the button
            const infoBtn = card.querySelector('.btn-character-info-enhanced');
            infoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showEnhancedCharacterModal(key);
            });

            charactersContainer.appendChild(card);
        });

        // Enhanced section introduction
        const intro = document.createElement('div');
        intro.className = 'characters-intro-enhanced';
        intro.innerHTML = `
            <div class="intro-content">
                <div class="intro-icon">
                    <i class="fas fa-crown"></i>
                </div>
                <h2><i class="fas fa-users"></i> Meet Your Hundred Acre Hosts</h2>
                <p class="intro-subtitle">Each friend has volunteered for special duties to make Baby Gunner's celebration perfect.</p>
                <div class="intro-tips">
                    <div class="tip">
                        <i class="fas fa-mouse-pointer"></i>
                        <span>Click cards for detailed bios</span>
                    </div>
                    <div class="tip">
                        <i class="fas fa-hand-point-up"></i>
                        <span>Try the voice buttons!</span>
                    </div>
                </div>
            </div>
        `;
        charactersContainer.parentElement.insertBefore(intro, charactersContainer);

        console.log('Enhanced characters section initialized');
    }

    function updateEnhancedCharacterCardImages() {
        DOM.$$('.character-card').forEach(card => {
            const characterKey = card.getAttribute('data-character');
            const sprite = Sprites[characterKey];
            const imageContainer = card.querySelector('.character-image-container');
            
            if (sprite && sprite.complete && sprite.naturalWidth > 0 && imageContainer) {
                const placeholder = imageContainer.querySelector('.character-image-placeholder-enhanced');
                if (placeholder) {
                    // Replace with actual image
                    placeholder.innerHTML = '';
                    const img = document.createElement('img');
                    img.src = sprite.src;
                    img.alt = characterData[characterKey].name;
                    img.className = 'character-portrait-enhanced';
                    img.loading = 'lazy';
                    
                    // Add load animation
                    img.addEventListener('load', () => {
                        img.classList.add('loaded');
                        createRippleEffect(imageContainer);
                    });
                    
                    placeholder.appendChild(img);
                }
            }
        });
    }

    function createRippleEffect(container) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        ripple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            border: 2px solid var(--character-color);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            animation: rippleEffect 0.6s ease-out;
            pointer-events: none;
        `;
        container.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    // ============================================================================
    // ENHANCED CHARACTER MODAL - FIXED
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
            document.body.classList.remove('modal-open');
            
            // Animate out
            if (modalContent) {
                modalContent.style.transform = 'translateY(100px) scale(0.95)';
                modalContent.style.opacity = '0';
            }
            
            // Remove focus trap
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
                modalIcon.className = 'modal-character-icon-enhanced';
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
                        <div class="detail-card">
                            <div class="detail-icon" style="color: ${data.color}">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="detail-content">
                                <h4>Personality</h4>
                                <div class="personality-chips">
                                    ${data.personality.map(trait => 
                                        `<span class="personality-chip" style="background: ${data.bgColor}; color: ${data.color}">
                                            ${trait}
                                        </span>`
                                    ).join('')}
                                </div>
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
    // ENHANCED CHARACTER ANIMATIONS - FIXED
    // ============================================================================

    function initEnhancedCharacterAnimations() {
        console.log('Initializing enhanced character animations...');
        
        const charactersSection = DOM.$('#characters');
        if (!charactersSection) return;

        // Parallax effect on scroll
        let lastScrollY = window.scrollY;
        let ticking = false;

        function updateParallax() {
            const scrolled = window.scrollY;
            const rate = 0.1;
            
            DOM.$$('.character-card-enhanced').forEach((card, index) => {
                // Don't update parallax if hovering
                if (!card.matches(':hover')) {
                    const yPos = -(scrolled * rate * (0.03 + index * 0.01));
                    const xPos = Math.sin(scrolled * 0.005 + index) * 2;

                    // Store parallax values in CSS custom properties
                    card.style.setProperty('--parallax-x', `${xPos}px`);
                    card.style.setProperty('--parallax-y', `${yPos}px`);
                }
            });
            
            ticking = false;
        }

        // Throttle scroll events with requestAnimationFrame
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateParallax();
                    ticking = true;
                });
            }
        });

        // Intersection Observer for staggered animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Staggered card entrance
                    DOM.$$('.character-card').forEach((card, index) => {
                        const delayMs = (window.IS_MOBILE ? 150 : 100) * index;

                        setTimeout(() => {
                            card.classList.add('animate-in');
                            card.style.animation = `cardEnter3D 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards`;
                            card.style.animationDelay = `${delayMs}ms`;

                            // Start parallax after entrance animation completes
                            setTimeout(() => {
                                card.style.animation = '';
                            }, 800 + delayMs);
                        }, delayMs);
                    });
                    
                    observer.unobserve(entry.target);
                }
            });
        }, { 
            threshold: 0.1,
            rootMargin: '50px'
        });

        observer.observe(charactersSection);

        console.log('Enhanced character animations initialized');
    }

    // ============================================================================
    // ENHANCED BASE UI - FIXED
    // ============================================================================

    function initEnhancedBaseUI() {
        console.log('Initializing enhanced base UI...');
        
        const body = document.body;

        // DOM elements
        const storybookCover = DOM.$('#storybookCover');
        const openBookBtn = DOM.$('#openBookBtn');
        const storybook = DOM.$('#storybook');
        const contentSections = DOM.$$('.content-section');
        const scrollAnimateElements = DOM.$$('.scroll-animate');
        const navMenu = DOM.$('#navMenu');
        const navItems = DOM.$$('.nav-item');
        const navToggle = DOM.$('#navToggle');
        const loadingScreen = DOM.$('#loadingScreen');
        const readingProgress = DOM.$('#readingProgress');
        const scrollTopFab = DOM.$('#scrollTopFab');
        const scrollRsvpFab = DOM.$('#scrollRsvpFab');
        const musicToggle = DOM.$('#musicToggle');
        const motionToggle = DOM.$('#motionToggle');
        const bgMusic = DOM.$('#bgMusic');
        const rsvpForm = DOM.$('#rsvpForm');
        const rsvpStatus = DOM.$('#rsvpStatus');

        // ----------------- Enhanced Loading Screen -----------------
        function initEnhancedLoading() {
            if (!loadingScreen) return;

            // Create loading animation
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
                        <div class="loading-progress-container">
                            <div class="loading-progress-bar">
                                <div class="loading-progress-fill"></div>
                            </div>
                            <div class="loading-percentage">0%</div>
                        </div>
                    </div>
                </div>
            `;

            // Simulate loading progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(progressInterval);
                    setTimeout(safeHideLoading, 500);
                }
                
                const progressFill = loadingContent.querySelector('.loading-progress-fill');
                const percentage = loadingContent.querySelector('.loading-percentage');
                
                if (progressFill) progressFill.style.width = `${progress}%`;
                if (percentage) percentage.textContent = `${Math.round(progress)}%`;
            }, 200);
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
            if (!storybookCover || !storybook) return;

            // Play sound
            if (window.audioManager) {
                window.audioManager.playSound('click');
            }

            // Enhanced animation
            storybookCover.style.transform = 'rotateY(180deg) scale(0.8)';
            storybookCover.style.opacity = '0';
            
            setTimeout(() => {
                storybookCover.classList.add('closed');
                storybook.classList.add('visible');
                contentSections.forEach((s) => s.classList.add('visible'));
                
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

        function updateEnhancedReadingProgress() {
            if (!readingProgress) return;
            const doc = document.documentElement;
            const scrollTop = doc.scrollTop || document.body.scrollTop;
            const scrollHeight = doc.scrollHeight - doc.clientHeight;
            const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            
            // Smooth animation
            readingProgress.style.transition = 'width 0.3s ease';
            readingProgress.style.width = progress + '%';
            
            // Color change based on progress
            if (progress > 75) {
                readingProgress.style.background = 'linear-gradient(90deg, #FF6B6B, #FF8C42)';
            } else if (progress > 50) {
                readingProgress.style.background = 'linear-gradient(90deg, #FFD54F, #FFB347)';
            } else {
                readingProgress.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
            }
        }

        // Throttle scroll events
        const throttledScroll = throttle(() => {
            checkEnhancedScrollAnimations();
            updateEnhancedReadingProgress();
        }, 16);

        window.addEventListener('scroll', throttledScroll);
        checkEnhancedScrollAnimations();
        updateEnhancedReadingProgress();

        // ----------------- Enhanced FABs -----------------
        if (scrollTopFab) {
            scrollTopFab.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Play sound
                if (window.audioManager) {
                    window.audioManager.playSound('click');
                }
                
                // Add animation
                scrollTopFab.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    scrollTopFab.style.transform = 'scale(1)';
                }, 200);
            });
        }

        if (scrollRsvpFab) {
            scrollRsvpFab.addEventListener('click', () => {
                const rsvp = DOM.$('#rsvp');
                if (rsvp) {
                    rsvp.scrollIntoView({ behavior: 'smooth' });
                    
                    // Play sound
                    if (window.audioManager) {
                        window.audioManager.playSound('click');
                    }
                    
                    // Highlight RSVP section
                    rsvp.classList.add('section-highlight');
                    setTimeout(() => {
                        rsvp.classList.remove('section-highlight');
                    }, 1500);
                }
            });
        }

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
                bgMusic.muted = true; // Start muted for autoplay policies
                
                if (icon) {
                    icon.classList.remove('fa-volume-xmark');
                    icon.classList.add('fa-music');
                    musicToggle.classList.add('active');
                }
                
                // Try to play on interaction
                const playOnInteraction = () => {
                    bgMusic.muted = false;
                    const playPromise = bgMusic.play();
                    
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.log("Autoplay prevented, waiting for interaction:", error);
                        });
                    }
                };
                
                // Set up interaction listener
                document.addEventListener('click', function enableAudioOnClick() {
                    playOnInteraction();
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
                    // Failed - show user they need to interact
                    console.log("Playback failed:", error);
                    
                    if (icon) {
                        icon.classList.remove('fa-volume-xmark');
                        icon.classList.add('fa-music');
                        icon.style.color = '#ff6b6b';
                        musicToggle.classList.add('active');
                        
                        setTimeout(() => {
                            icon.style.color = '';
                        }, 2000);
                    }
                    
                    // Set up one-time interaction
                    document.addEventListener('click', function retryPlayOnClick() {
                        bgMusic.play().then(() => {
                            localStorage.setItem('bg-music', 'on');
                        }).catch(e => console.log("Still can't play:", e));
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

            const colors = ['#FFC42B', '#D62E2E', '#E6B86A', '#B0D0E3', '#9CAD90', '#BA68C8'];

            for (let i = 0; i < (isMobileDevice() ? 80 : 200); i++) {
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
            const guestCount = (formData.get('guestCount') || '').toString();
            const guestNote = (formData.get('guestNote') || '').toString().trim();

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
                            We're excited to celebrate with ${
                                guestCount === '1' || guestCount === '' ? 'you' : `your party of ${guestCount}`
                            }!
                            ${guestNote ? '<br>We appreciate your note!' : ''}
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
            
            const honeyIcon = document.createElement('div');
            honeyIcon.className = 'honey-celebration';
            honeyIcon.innerHTML = '🍯';
            honeyIcon.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                font-size: 4rem;
                transform: translate(-50%, -50%) scale(0);
                animation: honeyPop 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
                z-index: 9999;
                text-shadow: 0 5px 15px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(honeyIcon);
            setTimeout(() => honeyIcon.remove(), 1100);

            // Play celebration sounds
            if (window.audioManager) {
                window.audioManager.playGameSound('victory');
            }

            // Save to localStorage
            const rsvpData = {
                name: guestName,
                count: guestCount,
                note: guestNote,
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
            const countInput = DOM.$('#guestCount');
            const noteInput = DOM.$('#guestNote');

            if (nameInput) nameInput.value = data.name || '';
            if (countInput) countInput.value = data.count || '';
            if (noteInput) noteInput.value = data.note || '';

            if (data.confirmed) {
                rsvpForm.style.display = 'none';
                rsvpStatus.innerHTML = `
                    <div class="form-success-enhanced">
                        <div class="success-icon">✅</div>
                        <div class="success-message">RSVP Confirmed!</div>
                        <div class="success-submessage">
                            We have your RSVP for ${data.name} and ${
                    data.count === '1' ? '1 guest.' : `${data.count} guests.`
                }
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
    // ENHANCED CSS INJECTION - FIXED
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
                --owl-brown: #8B4513;
                --roo-blue: #87CEEB;
                --honey-gold: #FFD54F;
            }
            
            /* Enhanced Character Cards */
            .characters-grid-enhanced {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                gap: 2rem;
                padding: 2rem;
                perspective: 1000px;
            }
            
            .character-card-enhanced {
                background: linear-gradient(145deg, #ffffff, #f0f0f0);
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                border: 3px solid;
                transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
                transform-style: preserve-3d;
                position: relative;
                will-change: transform, box-shadow;
                transform: translateZ(0);
                backface-visibility: hidden;
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
                transition: opacity 0.5s ease;
            }
            
            .character-portrait-enhanced {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 50%;
                opacity: 0;
                transition: opacity 0.5s ease, transform 0.5s ease;
            }
            
            .character-portrait-enhanced.loaded {
                opacity: 1;
                transform: scale(1.05);
            }
            
            .character-glow-effect {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(circle at center, transparent 30%, var(--character-bg) 70%);
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }
            
            .character-card:hover .character-glow-effect {
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
                text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
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
                transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
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
                transform: translateY(-3px) scale(1.05);
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            }
            
            /* Enhanced Intro */
            .characters-intro-enhanced {
                text-align: center;
                margin: 3rem auto;
                padding: 2rem;
                max-width: 800px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                color: white;
                box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                position: relative;
                overflow: hidden;
            }
            
            .intro-content {
                position: relative;
                z-index: 1;
            }
            
            .intro-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                animation: enhancedFloat 3s ease-in-out infinite;
            }
            
            .characters-intro-enhanced h2 {
                font-size: 2.8rem;
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            
            .intro-subtitle {
                font-size: 1.2rem;
                opacity: 0.9;
                margin-bottom: 2rem;
                line-height: 1.6;
            }
            
            .intro-tips {
                display: flex;
                justify-content: center;
                gap: 2rem;
                flex-wrap: wrap;
            }
            
            .tip {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1.5rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .tip i {
                font-size: 1.2rem;
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
                transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.5s ease;
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
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            
            .modal-close-enhanced:hover {
                transform: rotate(90deg) scale(1.1);
                box-shadow: 0 8px 25px rgba(0,0,0,0.3);
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
                border: 2px solid transparent;
            }
            
            .detail-card:hover {
                transform: translateY(-5px);
                border-color: var(--modal-color, #FFB347);
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
            
            .personality-chips {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-top: 0.5rem;
            }
            
            .personality-chip {
                padding: 0.4rem 0.8rem;
                border-radius: 20px;
                font-size: 0.85rem;
                font-weight: 500;
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
                overflow: hidden;
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
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            
            .modal-action-btn.close-btn {
                background: #666;
                color: white;
            }
            
            .modal-action-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            }
            
            /* Loading Screen */
            .loading-animation {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 2rem;
                height: 100%;
            }
            
            .loading-honeycomb {
                display: flex;
                gap: 2px;
                animation: loadingPulse 1.5s ease-in-out infinite;
            }
            
            .hexagon {
                width: 30px;
                height: 30px;
                background: #FFD700;
                clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
                animation: hexagonFloat 1s ease-in-out infinite;
            }
            
            @keyframes hexagonFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            .loading-text {
                text-align: center;
                color: white;
            }
            
            .loading-title {
                font-size: 2.5rem;
                margin-bottom: 1rem;
                font-weight: 800;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            
            .loading-subtitle {
                font-size: 1.2rem;
                margin-bottom: 2rem;
                opacity: 0.8;
            }
            
            .loading-progress-container {
                width: 300px;
                max-width: 80%;
            }
            
            .loading-progress-bar {
                height: 10px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 5px;
                overflow: hidden;
            }
            
            .loading-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #FFD700, #FF8C42);
                border-radius: 5px;
                transition: width 0.3s ease;
            }
            
            .loading-percentage {
                text-align: center;
                margin-top: 0.5rem;
                font-size: 1.2rem;
                font-weight: 600;
            }
            
            /* Responsive Design */
            @media (max-width: 1200px) {
                .characters-grid-enhanced {
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    padding: 1.5rem;
                }
                
                .modal-content-enhanced {
                    width: 95%;
                }
            }
            
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
                
                .intro-tips {
                    flex-direction: column;
                    gap: 1rem;
                }
            }
            
            @media (max-width: 480px) {
                .characters-intro-enhanced h2 {
                    font-size: 2rem;
                    flex-direction: column;
                }
                
                .character-name-enhanced {
                    font-size: 1.5rem;
                }
                
                .modal-title {
                    font-size: 2rem;
                }
                
                .modal-content-enhanced {
                    border-radius: 15px;
                }
                
                .modal-header-enhanced {
                    padding: 2rem 1rem 1rem;
                }
                
                .modal-body-enhanced {
                    padding: 1rem;
                }
            }
            
            /* Reduced Motion */
            @media (prefers-reduced-motion: reduce) {
                *,
                *::before,
                *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                    scroll-behavior: auto !important;
                }
                
                .character-card-enhanced {
                    animation: none !important;
                    transform: none !important;
                }
                
                .modal-content-enhanced {
                    transition: none !important;
                }
            }
        `;
        document.head.appendChild(style);
        console.log('Enhanced CSS injected');
    }

    // ============================================================================
    // GAME FUNCTIONS - STUBBED (Can be fully implemented later)
    // ============================================================================

    function initEnhancedDefenseGame() {
        console.log('Enhanced Honey Hive Defense game would initialize here...');
        // Game implementation would go here
    }

    function initEnhancedHoneyCatchGame() {
        console.log('Enhanced Honey Catch game would initialize here...');
        // Game implementation would go here
    }

    // ============================================================================
    // BOOTSTRAP ENHANCED - COMPLETE
    // ============================================================================

    // Safe initialization wrapper
    function safeInit(fn, name) {
        try {
            fn();
            console.log(`✓ ${name} initialized successfully`);
        } catch (error) {
            console.error(`✗ Error in ${name}:`, error);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM loaded, initializing enhanced components...");
        
        // Initialize optimizations
        safeInit(optimizeForDevice, 'Device optimization');
        
        // Initialize systems
        window.audioManager = new EnhancedAudioManager();
        
        // Load assets and inject styles
        safeInit(loadSprites, 'Sprite loading');
        safeInit(injectEnhancedKeyframes, 'Keyframe animations');
        safeInit(injectEnhancedCSS, 'Enhanced CSS');
        
        // Initialize UI components
        setTimeout(() => {
            safeInit(initEnhancedBaseUI, 'Base UI');
            safeInit(initEnhancedCharactersSection, 'Characters section');
            safeInit(initEnhancedCharacterModal, 'Character modal');
            safeInit(initEnhancedCharacterAnimations, 'Character animations');
            
            // Initialize games (stubbed)
            safeInit(initEnhancedDefenseGame, 'Defense game');
            safeInit(initEnhancedHoneyCatchGame, 'Honey catch game');
            
            console.log("All enhanced components initialized!");
        }, 100);
    });

    // Error handling
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
    });

    // Make key functions available globally
    window.showEnhancedCharacterModal = window.showEnhancedCharacterModal || function(key) {
        console.log('Showing character modal for:', key);
    };
    
    window.closeEnhancedCharacterModal = window.closeEnhancedCharacterModal || function() {
        console.log('Closing character modal');
    };

})();
