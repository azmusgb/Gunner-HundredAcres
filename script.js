// Hundred Acre Celebration - ENHANCED VERSION
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
    // GLOBAL SPRITES & DATA
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

    // Enhanced character data with more details
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
            image: 'Images/Characters/honey-bear.png',
            personality: ['Thoughtful', 'Hungry', 'Loving', 'Optimistic'],
            stats: { strength: 3, wisdom: 4, speed: 2, charm: 5 }
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
            image: 'Images/Characters/piglet.png',
            personality: ['Brave', 'Caring', 'Nervous', 'Detail-oriented'],
            stats: { strength: 2, wisdom: 3, speed: 3, charm: 4 }
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
            image: 'Images/Characters/tigger.png',
            personality: ['Energetic', 'Playful', 'Loud', 'Optimistic'],
            stats: { strength: 5, wisdom: 2, speed: 5, charm: 4 }
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
            image: 'Images/Characters/eeyore.png',
            personality: ['Thoughtful', 'Melancholic', 'Wise', 'Patient'],
            stats: { strength: 3, wisdom: 5, speed: 1, charm: 3 }
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
            image: 'Images/Characters/owl.png',
            personality: ['Wise', 'Scholarly', 'Long-winded', 'Knowledgeable'],
            stats: { strength: 2, wisdom: 5, speed: 2, charm: 3 }
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
            image: 'Images/Characters/roo.png',
            personality: ['Energetic', 'Curious', 'Playful', 'Innocent'],
            stats: { strength: 2, wisdom: 2, speed: 4, charm: 5 }
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
                    transform: translateY(50px) rotateX(-45deg) scale(0.8) translateZ(0);
                    opacity: 0;
                    filter: blur(10px);
                }
                100% {
                    transform: translateY(0) rotateX(0deg) scale(1) translateZ(0);
                    opacity: 1;
                    filter: blur(0);
                }
            }

            @keyframes card-hover {
                0% {
                    transform: translateY(0) scale(1) translateZ(0);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }
                100% {
                    transform: translateY(-8px) scale(1.02) translateZ(0);
                    box-shadow: 0 15px 30px var(--hover-shadow);
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
                will-change: transform, box-shadow;
                transform: translateZ(0);
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
        `;
        document.head.appendChild(style);
        console.log('Enhanced keyframes injected');
    }

    // ============================================================================
    // ENHANCED CHARACTERS SECTION
    // ============================================================================

    function initEnhancedCharactersSection() {
        console.log('Initializing enhanced characters section...');

        const charactersContainer = DOM.$('#charactersGrid');
        if (!charactersContainer) {
            console.warn('Characters container (#charactersGrid) not found. Skipping character section initialization.');
            return;
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
            card.setAttribute('aria-label', `Learn more about ${character.name}, ${character.role}`);
            
            // Set CSS custom properties
            const rgb = hexToRgb(character.color);
            card.style.setProperty('--card-index', index);
            card.style.setProperty('--glow-color', rgb);
            card.style.setProperty('--character-color', character.color);
            card.style.setProperty('--character-bg', character.bgColor);
            card.style.setProperty('--hover-shadow', hexToRgb(character.color, 0.2));
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

            // Enhanced card content
            card.innerHTML = `
                <div class="character-card-header-enhanced" style="background: ${character.bgColor}">
                    <div class="character-icon-enhanced" style="color: ${character.color}">
                        <i class="${character.icon}"></i>
                    </div>
                    <div class="character-image-container">
                        <div class="character-image-placeholder-enhanced">
                            <div class="character-silhouette-enhanced" style="background: ${character.color}"></div>
                        </div>
                        <div class="character-stats-overlay">
                            ${createStatsHTML(character.stats)}
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
                    
                    <div class="character-responsibilities-enhanced">
                        ${character.responsibilities.map(resp => 
                            `<span class="responsibility-tag-enhanced" style="background: ${character.bgColor}; color: ${character.color}">
                                <i class="fas fa-check-circle"></i> ${resp}
                            </span>`
                        ).join('')}
                    </div>
                </div>
                <div class="character-card-footer-enhanced">
                    <button class="btn-character-info-enhanced" onclick="showEnhancedCharacterModal('${key}')" 
                            style="background: linear-gradient(135deg, ${character.color}, ${darkenColor(character.color, 10)});"
                            aria-label="Learn more about ${character.name}">
                        <i class="fas fa-info-circle"></i> Full Bio
                    </button>
                    <button class="btn-character-voice-enhanced" onclick="playEnhancedCharacterVoice('${key}')"
                            style="border-color: ${character.color}; color: ${character.color}"
                            aria-label="Hear ${character.name}'s voice">
                        <i class="fas fa-volume-up"></i> Voice
                    </button>
                    <button class="btn-character-stats-enhanced" onclick="showCharacterStats('${key}')"
                            style="background: ${character.bgColor}; color: ${character.color}"
                            aria-label="View ${character.name}'s stats">
                        <i class="fas fa-chart-bar"></i> Stats
                    </button>
                </div>
            `;

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
                        <span>Hover over cards for 3D effects</span>
                    </div>
                    <div class="tip">
                        <i class="fas fa-hand-point-up"></i>
                        <span>Click to see detailed bios</span>
                    </div>
                    <div class="tip">
                        <i class="fas fa-volume-up"></i>
                        <span>Try the voice buttons!</span>
                    </div>
                </div>
            </div>
        `;
        charactersContainer.parentElement.insertBefore(intro, charactersContainer);

        // Interactive tutorial with progress
        setTimeout(() => {
            const tutorial = document.createElement('div');
            tutorial.className = 'characters-tutorial-enhanced';
            tutorial.setAttribute('role', 'status');
            tutorial.setAttribute('aria-live', 'polite');
            tutorial.innerHTML = `
                <div class="tutorial-content-enhanced">
                    <div class="tutorial-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <span class="tutorial-text">Explore the characters to unlock special features!</span>
                    </div>
                    <button class="tutorial-close" aria-label="Close tutorial">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            charactersContainer.parentElement.appendChild(tutorial);
            
            // Tutorial interactions
            const closeBtn = tutorial.querySelector('.tutorial-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    tutorial.style.opacity = '0';
                    tutorial.style.transform = 'translateY(-20px)';
                    setTimeout(() => tutorial.remove(), 500);
                });
            }
            
            // Auto-dismiss after 10 seconds
            setTimeout(() => {
                if (tutorial.parentNode) {
                    tutorial.style.opacity = '0';
                    tutorial.style.transform = 'translateY(-20px)';
                    setTimeout(() => tutorial.remove(), 500);
                }
            }, 10000);
        }, 1500);

        console.log('Enhanced characters section initialized');
    }

    function createStatsHTML(stats) {
        const maxStat = 5; // Maximum value for stats
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

    // Helper functions
    function hexToRgb(hex, opacity = 1) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return opacity === 1 ? `${r}, ${g}, ${b}` : `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return opacity === 1 ? '255, 180, 71' : `rgba(255, 180, 71, ${opacity})`;
    }

    function lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
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
        const num = parseInt(color.replace('#', ''), 16);
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
    // ENHANCED CHARACTER MODAL
    // ============================================================================

    function initEnhancedCharacterModal() {
        console.log('Initializing enhanced character modal...');
        
        const characterModal = DOM.$('#characterModal');
        const closeCharacterModalBtn = DOM.$('#closeCharacterModal');
        
        if (!characterModal) {
            console.error('Character modal not found');
            return;
        }

        // Create enhanced modal structure if it doesn't exist
        if (!characterModal.querySelector('.modal-content-enhanced')) {
            characterModal.innerHTML = `
                <div class="modal-overlay-enhanced" role="dialog" aria-modal="true" aria-labelledby="characterModalTitle">
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
                            
                            <div class="modal-stats-section" id="modalCharacterStatsEnhanced"></div>
                            
                            <div class="modal-abilities-section" id="modalCharacterAbilitiesEnhanced"></div>
                        </div>
                        
                        <div class="modal-footer-enhanced">
                            <button class="modal-action-btn voice-btn" onclick="playEnhancedCharacterVoice(currentModalCharacter)">
                                <i class="fas fa-volume-up"></i> Play Voice
                            </button>
                            <button class="modal-action-btn share-btn" onclick="shareCharacter(currentModalCharacter)">
                                <i class="fas fa-share-alt"></i> Share
                            </button>
                            <button class="modal-action-btn close-btn" onclick="closeEnhancedCharacterModal()">
                                <i class="fas fa-times"></i> Close
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        const modalContent = characterModal.querySelector('.modal-content-enhanced');
        const closeBtn = characterModal.querySelector('#closeCharacterModalEnhanced');
        const modalIcon = characterModal.querySelector('#modalCharacterIconEnhanced');
        const modalTitle = characterModal.querySelector('#characterModalTitleEnhanced');
        const modalRole = characterModal.querySelector('#modalCharacterRoleEnhanced');
        const modalQuote = characterModal.querySelector('#modalCharacterQuoteEnhanced');
        const modalBio = characterModal.querySelector('#modalCharacterBioEnhanced');
        const modalDetails = characterModal.querySelector('#modalCharacterDetailsEnhanced');
        const modalStats = characterModal.querySelector('#modalCharacterStatsEnhanced');
        const modalAbilities = characterModal.querySelector('#modalCharacterAbilitiesEnhanced');

        // Global reference to current character
        window.currentModalCharacter = null;

        // Close modal handlers
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

        // Click outside to close
        characterModal.addEventListener('click', (ev) => {
            if (ev.target === characterModal || ev.target.classList.contains('modal-overlay-enhanced')) {
                closeEnhancedCharacterModal();
            }
        });

        // Escape key handler
        function handleEscapeKey(ev) {
            if (ev.key === 'Escape' && characterModal.classList.contains('active')) {
                closeEnhancedCharacterModal();
            }
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
                modalIcon.innerHTML = `<i class="${data.icon}"></i>`;
                modalIcon.className = 'modal-character-icon-enhanced';
                modalIcon.style.background = `linear-gradient(135deg, ${data.color}, ${darkenColor(data.color, 20)})`;
                modalIcon.style.color = '#FFFFFF';
                modalIcon.style.boxShadow = `0 10px 30px rgba(${hexToRgb(data.color)}, 0.3)`;
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

            // Enhanced stats section
            if (modalStats && data.stats) {
                modalStats.innerHTML = `
                    <h3><i class="fas fa-chart-bar"></i> Character Stats</h3>
                    <div class="stats-radar-container">
                        <canvas id="characterStatsChart" width="300" height="300"></canvas>
                    </div>
                `;
                
                // Draw radar chart
                setTimeout(() => drawStatsRadarChart(key, data.stats), 100);
            }

            // Game abilities section
            if (modalAbilities) {
                const abilities = getCharacterAbilities(key);
                modalAbilities.innerHTML = `
                    <h3><i class="fas fa-gamepad"></i> Game Abilities</h3>
                    <div class="abilities-grid">
                        ${abilities.map(ability => `
                            <div class="ability-card" style="border-color: ${data.color}">
                                <div class="ability-icon" style="color: ${data.color}">
                                    <i class="${ability.icon}"></i>
                                </div>
                                <div class="ability-content">
                                    <h4>${ability.name}</h4>
                                    <p>${ability.description}</p>
                                    <div class="ability-cooldown">
                                        <i class="fas fa-clock"></i> Cooldown: ${ability.cooldown}s
                                    </div>
                                </div>
                            </div>
                        `).join('')}
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

        // Character abilities for games
        function getCharacterAbilities(characterKey) {
            const abilities = {
                pooh: [
                    { name: 'Honey Splash', icon: 'fas fa-tint', description: 'Splash honey on multiple enemies', cooldown: 10 },
                    { name: 'Bear Hug', icon: 'fas fa-heart', description: 'Temporary invincibility', cooldown: 15 }
                ],
                tigger: [
                    { name: 'Bounce Attack', icon: 'fas fa-bullseye', description: 'Chain bounce between enemies', cooldown: 8 },
                    { name: 'Tiggerific Speed', icon: 'fas fa-running', description: 'Increased movement speed', cooldown: 12 }
                ],
                owl: [
                    { name: 'Wisdom Beam', icon: 'fas fa-eye', description: 'Piercing attack through enemies', cooldown: 12 },
                    { name: 'Ancient Knowledge', icon: 'fas fa-book', description: 'Reveals hidden paths', cooldown: 20 }
                ],
                piglet: [
                    { name: 'Brave Shield', icon: 'fas fa-shield-alt', description: 'Temporary damage reduction', cooldown: 10 },
                    { name: 'Cozy Corner', icon: 'fas fa-home', description: 'Heals nearby towers', cooldown: 15 }
                ],
                eeyore: [
                    { name: 'Gloomy Cloud', icon: 'fas fa-cloud', description: 'Slows enemies in area', cooldown: 12 },
                    { name: 'Tail Swipe', icon: 'fas fa-undo', description: 'Knocks back enemies', cooldown: 8 }
                ],
                roo: [
                    { name: 'Kangaroo Hop', icon: 'fas fa-frog', description: 'Jump to avoid obstacles', cooldown: 6 },
                    { name: 'Pouch Surprise', icon: 'fas fa-gift', description: 'Random power-up drop', cooldown: 15 }
                ]
            };
            
            return abilities[characterKey] || [];
        }

        // Draw radar chart for stats
        function drawStatsRadarChart(characterKey, stats) {
            const canvas = document.getElementById('characterStatsChart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(centerX, centerY) * 0.8;
            const statCount = Object.keys(stats).length;
            const angleStep = (Math.PI * 2) / statCount;
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw grid
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            
            // Draw concentric circles
            for (let i = 1; i <= 5; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius * (i / 5), 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Draw axes
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;
            const statNames = Object.keys(stats);
            
            statNames.forEach((stat, i) => {
                const angle = angleStep * i - Math.PI / 2;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(x, y);
                ctx.stroke();
                
                // Draw stat labels
                ctx.fillStyle = '#666';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                const labelX = centerX + Math.cos(angle) * (radius + 20);
                const labelY = centerY + Math.sin(angle) * (radius + 20);
                ctx.fillText(stat.charAt(0).toUpperCase() + stat.slice(1), labelX, labelY);
            });
            
            // Draw stats polygon
            const data = statNames.map(stat => stats[stat]);
            const maxValue = 5;
            const color = characterData[characterKey].color;
            
            ctx.fillStyle = color + '33';
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            data.forEach((value, i) => {
                const normalizedValue = value / maxValue;
                const angle = angleStep * i - Math.PI / 2;
                const x = centerX + Math.cos(angle) * radius * normalizedValue;
                const y = centerY + Math.sin(angle) * radius * normalizedValue;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Draw data points
            ctx.fillStyle = color;
            data.forEach((value, i) => {
                const normalizedValue = value / maxValue;
                const angle = angleStep * i - Math.PI / 2;
                const x = centerX + Math.cos(angle) * radius * normalizedValue;
                const y = centerY + Math.sin(angle) * radius * normalizedValue;
                
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // Enhanced character voice playback
        window.playEnhancedCharacterVoice = function (key) {
            const data = characterData[key];
            if (!data) return;

            // Play sound using audio manager
            if (window.audioManager) {
                window.audioManager.playCharacterSound(key);
            }

            // Visual feedback
            const card = document.querySelector(`.character-card[data-character="${key}"]`);
            if (card) {
                card.style.animation = 'shakeEnhanced 0.5s ease-in-out, pulseGlow 1s ease-in-out';
                setTimeout(() => {
                    card.style.animation = '';
                }, 1000);
            }

            // Show voice bubble
            showVoiceBubble(key, data.voiceSample);
        };

        function showVoiceBubble(characterKey, text) {
            // Remove existing bubble
            const existing = document.querySelector('.voice-bubble');
            if (existing) existing.remove();

            const bubble = document.createElement('div');
            bubble.className = 'voice-bubble';
            bubble.innerHTML = `
                <div class="bubble-content">
                    <div class="bubble-header">
                        <div class="bubble-character">${characterData[characterKey].name} says:</div>
                        <button class="bubble-close" aria-label="Close voice bubble">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="bubble-text">"${text}"</div>
                </div>
            `;
            
            document.body.appendChild(bubble);
            
            // Position near the character card
            const card = document.querySelector(`.character-card[data-character="${characterKey}"]`);
            if (card) {
                const rect = card.getBoundingClientRect();
                bubble.style.top = `${rect.top - bubble.offsetHeight - 10}px`;
                bubble.style.left = `${rect.left + rect.width / 2 - bubble.offsetWidth / 2}px`;
            }
            
            // Close button
            const closeBtn = bubble.querySelector('.bubble-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => bubble.remove());
            }
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (bubble.parentNode) {
                    bubble.style.opacity = '0';
                    bubble.style.transform = 'translateY(10px)';
                    setTimeout(() => bubble.remove(), 300);
                }
            }, 5000);
        }

        // Share character function
        window.shareCharacter = function (characterKey) {
            const data = characterData[characterKey];
            const text = `Meet ${data.name}, the ${data.role.toLowerCase()} from our Hundred Acre Celebration! ${data.quote}`;
            const url = window.location.href;
            
            if (navigator.share) {
                navigator.share({
                    title: `${data.name} - Hundred Acre Celebration`,
                    text: text,
                    url: url
                });
            } else {
                // Fallback to clipboard
                navigator.clipboard.writeText(`${text}\n\n${url}`).then(() => {
                    alert('Character info copied to clipboard!');
                });
            }
        };

        // Show character stats
        window.showCharacterStats = function (characterKey) {
            showEnhancedCharacterModal(characterKey);
            setTimeout(() => {
                const statsSection = document.getElementById('modalCharacterStatsEnhanced');
                if (statsSection) {
                    statsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        };

        console.log('Enhanced character modal initialized');
    }

    // ============================================================================
    // ENHANCED CHARACTER ANIMATIONS
    // ============================================================================

    function initEnhancedCharacterAnimations() {
        console.log('Initializing enhanced character animations...');
        
        const charactersSection = DOM.$('#characters');
        if (!charactersSection) return;

        // Create particle system for section
        const sectionParticles = new EnhancedParticleSystem(null);

        // Parallax effect on scroll
        let lastScrollY = window.scrollY;
        let ticking = false;

        function updateParallax() {
            const scrolled = window.scrollY;
            const rate = 0.1; // Reduced from 0.3 for smoother effect
            
            DOM.$$('.character-card').forEach((card, index) => {
                // Only apply parallax if NOT hovering (CSS handles hover state)
                if (!card.matches(':hover')) {
                    const yPos = -(scrolled * rate * (0.03 + index * 0.01)); // Much smaller movement
                    const xPos = Math.sin(scrolled * 0.005 + index) * 2; // Reduced from 5px
                    
                    // Use transform3d for hardware acceleration
                    card.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
                    
                    // Store current transform for CSS animations to use
                    card.dataset.parallaxX = xPos;
                    card.dataset.parallaxY = yPos;
                }
            });
            
            ticking = false;
        }

        // Throttle scroll events with requestAnimationFrame
            let scrollTimeout;
            window.addEventListener('scroll', () => {
                if (scrollTimeout) {
                    cancelAnimationFrame(scrollTimeout);
                }
                
                scrollTimeout = requestAnimationFrame(() => {
                    if (!ticking) {
                        window.requestAnimationFrame(updateParallax);
                        ticking = true;
                    }
                });
            });

        // Intersection Observer for staggered animations
        // Intersection Observer for staggered animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Staggered card entrance only, no floating yet
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

        // Sparkle effects for cards
        function createCardSparkle(card) {
            const sparkle = document.createElement('div');
            sparkle.className = 'card-sparkle';
            sparkle.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: linear-gradient(45deg, #FFD700, #FF6B6B);
                border-radius: 50%;
                pointer-events: none;
                z-index: 10;
                opacity: 0;
                animation: sparkleTrail 1.5s ease-out forwards;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
            `;
            
            card.appendChild(sparkle);
            
            // Remove after animation
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.remove();
                }
            }, 1500);
        }

        function createEnhancedCharacterSparkles() {
            const container = DOM.$('#charactersGrid');
            if (!container) return;

            // Create multiple sparkle types
            const sparkleTypes = [
                { color: '#FFD700', size: 6, speed: 1 }, // Gold
                { color: '#87CEEB', size: 4, speed: 1.2 }, // Blue
                { color: '#FF6B6B', size: 5, speed: 0.8 }  // Red
            ];

            const sparkles = [];
            const fragment = document.createDocumentFragment();
            const sparkleCount = 15;

            for (let i = 0; i < sparkleCount; i++) {
                const type = sparkleTypes[i % sparkleTypes.length];
                const sparkle = document.createElement('div');
                sparkle.className = 'character-sparkle-enhanced';

                const duration = type.speed + Math.random() * 1;
                const delay = Math.random() * 1.5;
                const startX = Math.random() * 100;

                sparkle.style.cssText = `
                    position: absolute;
                    width: ${type.size}px;
                    height: ${type.size}px;
                    background: ${type.color};
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 1;
                    opacity: 0;
                    animation: sparkle-fall ${duration}s ease-in forwards;
                    animation-delay: ${delay}s;
                    left: ${startX}%;
                    top: -20px;
                    filter: blur(${Math.random() * 2}px);
                    box-shadow: 0 0 ${type.size * 2}px ${type.color};
                    will-change: transform, opacity;
                    transform: translateZ(0);
                `;

                // Add trail
                const trail = document.createElement('div');
                trail.className = 'sparkle-trail';
                trail.style.cssText = `
                    position: absolute;
                    width: 2px;
                    height: 20px;
                    background: linear-gradient(to bottom, transparent, ${type.color});
                    top: ${type.size}px;
                    left: 50%;
                    transform: translateX(-50%);
                    opacity: 0.5;
                `;
                sparkle.appendChild(trail);

                fragment.appendChild(sparkle);
                sparkles.push(sparkle);
            }

            container.appendChild(fragment);

            // Remove after animation batch completes
            setTimeout(() => {
                sparkles.forEach(sparkle => {
                    sparkle.style.opacity = '0';
                    setTimeout(() => {
                        if (sparkle.parentNode) {
                            sparkle.remove();
                        }
                    }, 500);
                });
            }, 2500);
        }

        function startSectionParticles() {
            // This would be called when section is visible
            // For now, we'll create occasional particle bursts
            setInterval(() => {
                if (Math.random() > 0.7) {
                    createParticleBurst();
                }
            }, 3000);
        }

        function createParticleBurst() {
            const container = DOM.$('#characters');
            if (!container) return;
            
            const rect = container.getBoundingClientRect();
            const x = rect.left + Math.random() * rect.width;
            const y = rect.top + Math.random() * rect.height;
            
            // Create visual burst effect
            const burst = document.createElement('div');
            burst.className = 'particle-burst';
            burst.style.cssText = `
                position: fixed;
                width: 1px;
                height: 1px;
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
                z-index: 5;
            `;
            
            // Create particles
            for (let i = 0; i < 8; i++) {
                const particle = document.createElement('div');
                const angle = (i / 8) * Math.PI * 2;
                const distance = 30 + Math.random() * 40;
                const duration = 0.5 + Math.random() * 0.5;
                
                particle.style.cssText = `
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: linear-gradient(45deg, #FFD700, #FF8C42);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    animation: particle-burst ${duration}s ease-out forwards;
                `;
                
                // Set keyframes via JS
                const keyframes = `
                    @keyframes particle-burst-${Date.now()}-${i} {
                        0% {
                            transform: translate(0, 0) scale(1);
                            opacity: 1;
                        }
                        100% {
                            transform: translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0);
                            opacity: 0;
                        }
                    }
                `;
                
                const style = document.createElement('style');
                style.textContent = keyframes;
                document.head.appendChild(style);
                
                particle.style.animationName = `particle-burst-${Date.now()}-${i}`;
                
                burst.appendChild(particle);
                
                // Clean up
                setTimeout(() => {
                    style.remove();
                    particle.remove();
                }, duration * 1000);
            }
            
            document.body.appendChild(burst);
            setTimeout(() => burst.remove(), 1000);
        }

        console.log('Enhanced character animations initialized');
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
                
                // Create page flip particles
                createPageFlipEffect();
            }, 700);
        }

        function createPageFlipEffect() {
            const particles = new EnhancedParticleSystem(null);
            const rect = storybookCover.getBoundingClientRect();
            
            for (let i = 0; i < 20; i++) {
                particles.createParticle(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2,
                    'sparkle',
                    {
                        x: (Math.random() - 0.5) * 10,
                        y: (Math.random() - 0.5) * 10 - 5
                    }
                );
            }
            
            // This is a simplified version - in a full implementation,
            // you would render these particles
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
                
                // Animate hamburger icon
                const bars = navToggle.querySelectorAll('.bar');
                if (bars) {
                    bars.forEach((bar, i) => {
                        bar.style.transform = navMenu.classList.contains('open') 
                            ? `rotate(${i === 0 ? '45' : i === 2 ? '-45' : '0'}deg) translate(${i === 1 ? '-20px' : '0'}, ${i === 0 ? '6px' : i === 2 ? '-6px' : '0'})`
                            : 'none';
                    });
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

        function setupEnhancedSectionObserver() {
            const sections = DOM.$$('.content-section');
            if (!sections.length) return;

            const options = {
                root: null,
                rootMargin: '-25% 0px -60% 0px',
                threshold: 0.05
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const id = entry.target.id;
                    const navItem = document.querySelector(`.nav-item[data-section="${id}"]`);
                    
                    if (entry.isIntersecting) {
                        // Update navigation
                        navItems.forEach((i) => i.classList.remove('active'));
                        if (navItem) {
                            navItem.classList.add('active');
                            
                            // Add visual feedback
                            navItem.style.transform = 'scale(1.1)';
                            setTimeout(() => {
                                navItem.style.transform = 'scale(1)';
                            }, 300);
                        }
                        
                        // Add section highlight effect
                        entry.target.classList.add('section-active');
                        setTimeout(() => {
                            entry.target.classList.remove('section-active');
                        }, 1000);
                    }
                });
            }, options);

            sections.forEach((section) => observer.observe(section));
        }

        setupEnhancedSectionObserver();

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
                            
                            // Visual indicator
                            if (icon) {
                                icon.style.animation = 'pulseGlow 1s infinite';
                                setTimeout(() => {
                                    icon.style.animation = '';
                                }, 5000);
                            }
                        });
                    }
                };
                
                // Try initial play
                setTimeout(playOnInteraction, 1000);
                
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
                    
                    // Show hint
                    showMusicHint();
                    
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

        function showMusicHint() {
            const hint = document.createElement('div');
            hint.className = 'music-hint';
            hint.innerHTML = `
                <div class="hint-content">
                    <i class="fas fa-info-circle"></i>
                    <span>Click anywhere to enable music</span>
                </div>
            `;
            
            document.body.appendChild(hint);
            
            // Auto-remove
            setTimeout(() => {
                hint.style.opacity = '0';
                hint.style.transform = 'translateY(-10px)';
                setTimeout(() => hint.remove(), 500);
            }, 3000);
        }

        initEnhancedMusicPreference();

        if (musicToggle) {
            musicToggle.addEventListener('click', toggleEnhancedMusic);
        }

        // Initialize audio on first interaction
        document.addEventListener('click', function initAudioOnFirstInteraction() {
            if (bgMusic && bgMusic.paused) {
                const stored = localStorage.getItem('bg-music');
                if (stored === 'on') {
                    bgMusic.play().catch(e => console.log("Background music play failed:", e));
                }
            }
            document.removeEventListener('click', initAudioOnFirstInteraction);
        }, { once: true });

        // ----------------- Enhanced RSVP with Confetti -----------------
        function createEnhancedConfetti() {
            const container = document.createElement('div');
            container.className = 'confetti-container-enhanced';
            document.body.appendChild(container);

            const colors = ['#FFC42B', '#D62E2E', '#E6B86A', '#B0D0E3', '#9CAD90', '#BA68C8'];
            const shapes = ['circle', 'rect', 'triangle'];

            for (let i = 0; i < (isMobileDevice() ? 80 : 200); i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti-enhanced';
                
                const size = 5 + Math.random() * 10;
                const color = colors[Math.floor(Math.random() * colors.length)];
                const shape = shapes[Math.floor(Math.random() * shapes.length)];
                const rotation = Math.random() * 360;
                const fallDuration = 2 + Math.random() * 2;
                const delay = Math.random() * 1.5;
                
                let shapeStyle = '';
                if (shape === 'triangle') {
                    shapeStyle = `
                        width: 0;
                        height: 0;
                        border-left: ${size}px solid transparent;
                        border-right: ${size}px solid transparent;
                        border-bottom: ${size * 2}px solid ${color};
                        background: none;
                    `;
                } else if (shape === 'rect') {
                    shapeStyle = `
                        width: ${size * 1.5}px;
                        height: ${size}px;
                        background: ${color};
                    `;
                } else {
                    shapeStyle = `
                        width: ${size}px;
                        height: ${size}px;
                        background: ${color};
                        border-radius: 50%;
                    `;
                }
                
                confetti.style.cssText = `
                    position: fixed;
                    top: -30px;
                    left: ${Math.random() * 100}vw;
                    ${shapeStyle}
                    transform: rotate(${rotation}deg);
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
                        <div class="success-actions">
                            <button class="success-btn share-btn" onclick="shareRSVP()">
                                <i class="fas fa-share-alt"></i> Share
                            </button>
                            <button class="success-btn edit-btn" onclick="editEnhancedRSVP()">
                                <i class="fas fa-edit"></i> Edit
                            </button>
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
                        <div class="success-actions">
                            <button class="success-btn share-btn" onclick="shareRSVP()">
                                <i class="fas fa-share-alt"></i> Share
                            </button>
                            <button class="success-btn edit-btn" onclick="editEnhancedRSVP()">
                                <i class="fas fa-edit"></i> Edit RSVP
                            </button>
                        </div>
                    </div>
                `;
            }
        }

        if (rsvpForm) {
            rsvpForm.addEventListener('submit', handleEnhancedRsvpSubmit);
        }
        checkEnhancedExistingRSVP();

        // Enhanced RSVP functions
        window.editEnhancedRSVP = function () {
            localStorage.removeItem('babyGunnerRSVP');
            if (!rsvpForm || !rsvpStatus) return;
            
            rsvpStatus.style.opacity = '0';
            rsvpStatus.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                rsvpStatus.innerHTML = '';
                rsvpForm.reset();
                rsvpForm.style.display = 'block';
                rsvpForm.style.opacity = '0';
                rsvpForm.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    rsvpForm.style.opacity = '1';
                    rsvpForm.style.transform = 'translateY(0)';
                }, 50);
            }, 300);
            
            // Play sound
            if (window.audioManager) {
                window.audioManager.playSound('click');
            }
        };

        window.shareRSVP = function () {
            const existing = localStorage.getItem('babyGunnerRSVP');
            if (!existing) return;
            
            const data = JSON.parse(existing);
            const text = `I'm celebrating Baby Gunner's arrival with the Hundred Acre Wood crew! ${data.count ? `Coming with ${data.count} guest${data.count === '1' ? '' : 's'}` : 'Can\'t wait!'}`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'Baby Gunner Celebration',
                    text: text,
                    url: window.location.href
                });
            } else {
                navigator.clipboard.writeText(text).then(() => {
                    alert('RSVP details copied to clipboard!');
                });
            }
        };

        // ----------------- Enhanced Woodland Sound -----------------
        window.playEnhancedWoodlandSound = function (ev) {
            const element = ev && ev.target ? ev.target.closest('.woodland-sign') : null;
            
            // Play sound
            if (window.audioManager) {
                window.audioManager.playGameSound('collect');
            }

            // Visual feedback
            if (element) {
                element.style.transform = 'scale(1.1) rotate(-2deg)';
                element.style.filter = 'brightness(1.2)';
                
                // Create ripple effect
                const ripple = document.createElement('div');
                ripple.className = 'woodland-ripple';
                ripple.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 100%;
                    height: 100%;
                    border: 2px solid #8B4513;
                    border-radius: 50%;
                    transform: translate(-50%, -50%) scale(0);
                    animation: rippleEffect 0.6s ease-out;
                    pointer-events: none;
                `;
                element.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 600);
                setTimeout(() => {
                    element.style.transform = '';
                    element.style.filter = '';
                }, 300);
            }
        };

        // === CRITICAL: Initialize Audio on First User Gesture ===
        const initAudioOnInteraction = () => {
            if (window.audioManager) {
                window.audioManager.init();
            }
            // Remove this listener after the first interaction
            document.removeEventListener('click', initAudioOnInteraction);
            document.removeEventListener('keydown', initAudioOnInteraction);
            document.removeEventListener('touchstart', initAudioOnInteraction);
        };

        // Listen for multiple types of user gestures
        document.addEventListener('click', initAudioOnInteraction, { once: true });
        document.addEventListener('keydown', initAudioOnInteraction, { once: true });
        document.addEventListener('touchstart', initAudioOnInteraction, { once: true });

        console.log('Enhanced base UI initialized - waiting for user gesture to start audio');

        console.log('Enhanced base UI initialized');
    }

    // ============================================================================
    // ENHANCED GAME 1: HONEY HIVE DEFENSE
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
        
        // Performance optimizations
        canvas.style.imageRendering = isMobileDevice() ? 'pixelated' : 'auto';
        ctx.imageSmoothingEnabled = !isMobileDevice();
        
        // Create enhanced background canvas
        const backgroundCanvas = document.createElement('canvas');
        backgroundCanvas.width = canvas.width;
        backgroundCanvas.height = canvas.height;
        const bgCtx = backgroundCanvas.getContext('2d');
        
        // Enhanced particle system for game
        const gameParticles = new EnhancedParticleSystem(canvas);
        
        // UI elements
        const honeySpan = document.getElementById('honey-count');
        const livesSpan = document.getElementById('lives-count');
        const waveSpan = document.getElementById('wave-count');
        const startBtn = document.getElementById('start-defense');
        const upgradeBtn = document.getElementById('upgrade-tower');
        const abilityBtn = document.getElementById('use-ability');
        const towerOptions = document.querySelectorAll('.tower-option');
        const defenseAlert = document.getElementById('defense-alert');
        const waveStatus = document.getElementById('defense-wave-status');
        const defenseCard = document.getElementById('defense-card');
        const scoreDisplay = document.getElementById('defense-score');
        
        // Enhanced game state
        let gameState = {
            honey: 100,
            lives: 10,
            wave: 1,
            score: 0,
            selectedTower: 'pooh',
            towers: [],
            enemies: [],
            isWaveActive: false,
            lastSpawnTime: 0,
            lastFrameTime: performance.now(),
            running: true,
            paused: false,
            waveStatusTimeout: null,
            abilities: {
                pooh: { available: true, cooldown: 0 },
                tigger: { available: true, cooldown: 0 },
                owl: { available: true, cooldown: 0 }
            },
            effects: [],
            combos: 0,
            lastComboTime: 0
        };
        
        // Enhanced tower types with abilities
        const enhancedTowerTypes = {
            pooh: { 
                cost: 20, 
                damage: 10, 
                range: 100, 
                fireRate: 900, 
                color: '#FFB347', 
                key: 'pooh',
                ability: {
                    name: 'Honey Splash',
                    description: 'Splash damage to all enemies in range',
                    cooldown: 10000,
                    effect: 'area'
                }
            },
            tigger: { 
                cost: 30, 
                damage: 14, 
                range: 90, 
                fireRate: 650, 
                color: '#FF8C42', 
                key: 'tigger',
                ability: {
                    name: 'Bounce Attack',
                    description: 'Chain bounce between enemies',
                    cooldown: 8000,
                    effect: 'chain'
                }
            },
            rabbit: { 
                cost: 40, 
                damage: 18, 
                range: 130, 
                fireRate: 1300, 
                color: '#C1E1C1', 
                key: 'owl',
                ability: {
                    name: 'Wisdom Beam',
                    description: 'Piercing attack through enemies',
                    cooldown: 12000,
                    effect: 'pierce'
                }
            },
            piglet: { 
                cost: 25, 
                damage: 9, 
                range: 95, 
                fireRate: 550, 
                color: '#FFB6C1', 
                key: 'piglet',
                ability: {
                    name: 'Brave Shield',
                    description: 'Temporary damage reduction for nearby towers',
                    cooldown: 15000,
                    effect: 'shield'
                }
            },
            eeyore: { 
                cost: 35, 
                damage: 24, 
                range: 115, 
                fireRate: 1900, 
                color: '#C0C0C0', 
                key: 'eeyore',
                ability: {
                    name: 'Gloomy Cloud',
                    description: 'Slows enemies in area',
                    cooldown: 12000,
                    effect: 'slow'
                }
            }
        };
        
        // Enhanced enemy types with behaviors
        const enhancedEnemyTypes = {
            heffalump: { 
                health: 55, 
                speed: 0.75, 
                color: '#8A2BE2', 
                points: 10, 
                char: '🐘',
                behavior: 'tank',
                ability: 'armor' // Takes reduced damage
            },
            woozle: { 
                health: 32, 
                speed: 1.4, 
                color: '#FF4500', 
                points: 15, 
                char: '🐺',
                behavior: 'dodger',
                ability: 'evade' // Chance to dodge projectiles
            },
            bee: { 
                health: 18, 
                speed: 2.1, 
                color: '#FFD700', 
                points: 5, 
                char: '🐝',
                behavior: 'swarm',
                ability: 'swarm' // Moves in groups
            },
            storm: {
                health: 40,
                speed: 1.0,
                color: '#4682B4',
                points: 20,
                char: '🌩️',
                behavior: 'storm',
                ability: 'lightning' // Can damage multiple towers
            }
        };
        
        // Enhanced path with curves
        const enhancedPath = [
            { x: 0, y: 220 },
            { x: 160, y: 220 },
            { x: 160, y: 120 },
            { x: 280, y: 120 },
            { x: 280, y: 220 },
            { x: 400, y: 220 },
            { x: 400, y: 320 },
            { x: 520, y: 320 }
        ];
        
        // Object pools for performance
        const projectilePool = {
            pool: [],
            active: 0,
            
            get: function(x, y, target, damage, color, speed, type = 'normal') {
                let proj;
                if (this.active < this.pool.length) {
                    proj = this.pool[this.active];
                    Object.assign(proj, { x, y, target, damage, color, speed, type, active: true });
                } else {
                    proj = { x, y, target, damage, color, speed, type, active: true };
                    this.pool.push(proj);
                }
                this.active++;
                return proj;
            },
            
            updateAll: function(delta, callback) {
                for (let i = 0; i < this.active; i++) {
                    const proj = this.pool[i];
                    if (proj.active) {
                        callback(proj, i);
                    }
                }
            },
            
            reset: function() {
                for (let i = 0; i < this.pool.length; i++) {
                    this.pool[i].active = false;
                }
                this.active = 0;
            }
        };
        
        // Spatial partitioning grid
        const spatialGrid = {
            cellSize: 120,
            grid: new Map(),
            
            clear: function() {
                this.grid.clear();
            },
            
            getCellKey: function(x, y) {
                const cellX = Math.floor(x / this.cellSize);
                const cellY = Math.floor(y / this.cellSize);
                return `${cellX},${cellY}`;
            },
            
            insert: function(obj) {
                const key = this.getCellKey(obj.x, obj.y);
                if (!this.grid.has(key)) {
                    this.grid.set(key, []);
                }
                this.grid.get(key).push(obj);
            },
            
            query: function(x, y, range) {
                const results = [];
                const startCellX = Math.floor((x - range) / this.cellSize);
                const endCellX = Math.floor((x + range) / this.cellSize);
                const startCellY = Math.floor((y - range) / this.cellSize);
                const endCellY = Math.floor((y + range) / this.cellSize);
                
                for (let cellX = startCellX; cellX <= endCellX; cellX++) {
                    for (let cellY = startCellY; cellY <= endCellY; cellY++) {
                        const key = `${cellX},${cellY}`;
                        const cellObjects = this.grid.get(key);
                        if (cellObjects) {
                            for (const obj of cellObjects) {
                                const dx = obj.x - x;
                                const dy = obj.y - y;
                                if (dx * dx + dy * dy <= range * range) {
                                    results.push(obj);
                                }
                            }
                        }
                    }
                }
                return results;
            }
        };
        
        // Enhanced UI functions
        function setEnhancedDefenseAlert(msg, type = 'info') {
            if (!defenseAlert) return;
            
            defenseAlert.textContent = msg;
            defenseAlert.className = 'defense-alert ' + type;
            defenseAlert.style.opacity = '1';
            
            // Auto-hide
            setTimeout(() => {
                defenseAlert.style.opacity = '0';
            }, 2000);
        }
        
        function updateEnhancedTowerAffordability() {
            towerOptions.forEach((opt) => {
                const towerKey = opt.getAttribute('data-tower');
                const spec = towerKey ? enhancedTowerTypes[towerKey] : null;
                if (!spec) return;
                
                if (gameState.honey < spec.cost) {
                    opt.classList.add('unaffordable');
                    opt.style.opacity = '0.6';
                } else {
                    opt.classList.remove('unaffordable');
                    opt.style.opacity = '1';
                }
            });
        }
        
        function showEnhancedWaveStatus(msg, duration = 1400) {
            if (!waveStatus) return;
            
            waveStatus.textContent = msg;
            waveStatus.classList.add('active');
            waveStatus.style.animation = 'pulseGlow 0.5s ease-in-out';
            
            if (gameState.waveStatusTimeout) clearTimeout(gameState.waveStatusTimeout);
            gameState.waveStatusTimeout = setTimeout(() => {
                waveStatus.classList.remove('active');
                waveStatus.style.animation = '';
            }, duration);
        }
        
        function createDamageEffect() {
            setEnhancedDefenseAlert('A honey jar spilled! Keep the path protected.', 'warning');
            showEnhancedWaveStatus('Ouch! -1 life', 1200);
            shakeElement(defenseCard);
            
            // Screen shake
            const gameContainer = canvas.parentElement;
            if (gameContainer) {
                shakeElement(gameContainer, 10, 400);
            }
            
            // Play sound
            if (window.audioManager) {
                window.audioManager.playGameSound('damage');
            }
        }
        
        function syncEnhancedStats() {
            if (honeySpan) honeySpan.textContent = gameState.honey;
            if (livesSpan) livesSpan.textContent = gameState.lives;
            if (waveSpan) waveSpan.textContent = gameState.wave;
            if (scoreDisplay) scoreDisplay.textContent = gameState.score;
            updateEnhancedTowerAffordability();
            
            // Update ability button
            if (abilityBtn) {
                const towerType = enhancedTowerTypes[gameState.selectedTower];
                if (towerType && towerType.ability) {
                    abilityBtn.textContent = towerType.ability.name;
                    abilityBtn.disabled = !gameState.abilities[gameState.selectedTower]?.available;
                    
                    if (!gameState.abilities[gameState.selectedTower]?.available) {
                        const cooldown = gameState.abilities[gameState.selectedTower]?.cooldown || 0;
                        abilityBtn.textContent = `${towerType.ability.name} (${Math.ceil(cooldown/1000)}s)`;
                    }
                }
            }
        }
        
        // Initialize
        syncEnhancedStats();
        setEnhancedDefenseAlert('The honey path is peaceful. Prepare your friends.', 'info');
        showEnhancedWaveStatus('Wave 1 ready', 1300);
        
        // Enhanced background rendering
        function drawEnhancedBackgroundToBuffer() {
            // Sky gradient
            const skyGradient = bgCtx.createLinearGradient(0, 0, 0, backgroundCanvas.height);
            skyGradient.addColorStop(0, '#87CEEB');
            skyGradient.addColorStop(0.7, '#B3E5FC');
            skyGradient.addColorStop(1, '#E3F2FD');
            bgCtx.fillStyle = skyGradient;
            bgCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
            
            // Sun with glow
            bgCtx.save();
            bgCtx.shadowColor = '#FFD700';
            bgCtx.shadowBlur = 40;
            bgCtx.fillStyle = '#FFEB3B';
            bgCtx.beginPath();
            bgCtx.arc(100, 80, 30, 0, Math.PI * 2);
            bgCtx.fill();
            bgCtx.restore();
            
            // Clouds
            drawEnhancedClouds(bgCtx);
            
            // Ground with texture
            bgCtx.fillStyle = '#8BC34A';
            bgCtx.fillRect(0, backgroundCanvas.height - 80, backgroundCanvas.width, 80);
            
            // Grass detail
            bgCtx.fillStyle = '#7CB342';
            for (let x = 0; x < backgroundCanvas.width; x += 12) {
                const height = 8 + Math.random() * 15;
                bgCtx.fillRect(x, backgroundCanvas.height - 80, 4, -height);
            }
            
            // Trees
            drawEnhancedTrees(bgCtx);
            
            // Enhanced path with gradient
            drawEnhancedPath(bgCtx);
            
            // Honey pot at the end
            const end = enhancedPath[enhancedPath.length - 1];
            drawEnhancedHoneyPot(bgCtx, end.x, end.y);
        }
        
        function drawEnhancedClouds(ctx) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            
            // Cloud 1
            ctx.beginPath();
            ctx.arc(90, 60, 25, 0, Math.PI * 2);
            ctx.arc(120, 50, 30, 0, Math.PI * 2);
            ctx.arc(150, 60, 25, 0, Math.PI * 2);
            ctx.fill();
            
            // Cloud 2
            ctx.beginPath();
            ctx.arc(380, 80, 22, 0, Math.PI * 2);
            ctx.arc(410, 70, 28, 0, Math.PI * 2);
            ctx.arc(440, 80, 22, 0, Math.PI * 2);
            ctx.fill();
            
            // Cloud shadows
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.beginPath();
            ctx.arc(95, 65, 25, 0, Math.PI * 2);
            ctx.arc(125, 55, 30, 0, Math.PI * 2);
            ctx.arc(155, 65, 25, 0, Math.PI * 2);
            ctx.fill();
        }
        
        function drawEnhancedTrees(ctx) {
            // Tree 1
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(40, 120, 24, 90);
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.arc(52, 105, 45, 0, Math.PI * 2);
            ctx.fill();
            
            // Tree details
            ctx.fillStyle = '#1B5E20';
            ctx.beginPath();
            ctx.arc(35, 90, 15, 0, Math.PI * 2);
            ctx.arc(70, 85, 18, 0, Math.PI * 2);
            ctx.arc(50, 70, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // Tree 2
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(360, 210, 26, 100);
            ctx.fillStyle = '#388E3C';
            ctx.beginPath();
            ctx.arc(373, 190, 48, 0, Math.PI * 2);
            ctx.fill();
            
            // Tree 2 details
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.arc(350, 175, 20, 0, Math.PI * 2);
            ctx.arc(400, 170, 22, 0, Math.PI * 2);
            ctx.arc(373, 155, 25, 0, Math.PI * 2);
            ctx.fill();
        }
        
        function drawEnhancedPath(ctx) {
            // Path shadow
            ctx.strokeStyle = '#8B6B3F';
            ctx.lineWidth = 44;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(enhancedPath[0].x, enhancedPath[0].y);
            for (let i = 1; i < enhancedPath.length; i++) {
                ctx.lineTo(enhancedPath[i].x, enhancedPath[i].y);
            }
            ctx.stroke();
            
            // Path main
            const pathGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            pathGradient.addColorStop(0, '#D2B48C');
            pathGradient.addColorStop(1, '#BC8F8F');
            
            ctx.strokeStyle = pathGradient;
            ctx.lineWidth = 40;
            ctx.beginPath();
            ctx.moveTo(enhancedPath[0].x, enhancedPath[0].y);
            for (let i = 1; i < enhancedPath.length; i++) {
                ctx.lineTo(enhancedPath[i].x, enhancedPath[i].y);
            }
            ctx.stroke();
            
            // Path details
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(enhancedPath[0].x, enhancedPath[0].y);
            for (let i = 1; i < enhancedPath.length; i++) {
                ctx.lineTo(enhancedPath[i].x, enhancedPath[i].y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Path edge highlights
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(enhancedPath[0].x, enhancedPath[0].y);
            for (let i = 1; i < enhancedPath.length; i++) {
                ctx.lineTo(enhancedPath[i].x, enhancedPath[i].y);
            }
            ctx.stroke();
        }
        
        function drawEnhancedHoneyPot(ctx, x, y) {
            const sprite = Sprites.honey;
            
            if (sprite && sprite.complete) {
                // Draw with glow
                ctx.save();
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 20;
                ctx.drawImage(sprite, x - 25, y - 25, 50, 50);
                ctx.restore();
            } else {
                // Enhanced fallback drawing
                // Pot glow
                ctx.save();
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 20;
                
                // Pot body
                ctx.fillStyle = '#FFD54F';
                ctx.beginPath();
                ctx.arc(x, y, 22, 0, Math.PI * 2);
                ctx.fill();
                
                // Pot rim
                ctx.strokeStyle = '#8B4513';
                ctx.lineWidth = 4;
                ctx.stroke();
                
                ctx.restore();
                
                // Lid
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(x - 18, y - 30, 36, 8);
                ctx.fillRect(x - 12, y - 35, 24, 5);
                
                // Honey drip
                ctx.fillStyle = '#FFB300';
                ctx.beginPath();
                ctx.ellipse(x, y + 18, 10, 15, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Glint
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.beginPath();
                ctx.arc(x - 8, y - 8, 6, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Protection radius
            ctx.strokeStyle = 'rgba(255, 213, 79, 0.2)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(x, y, 60, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Enhanced game rendering
        function drawEnhancedBackground() {
            ctx.drawImage(backgroundCanvas, 0, 0);
        }
        
        function drawEnhancedTowers() {
            gameState.towers.forEach((tower, index) => {
                const spec = enhancedTowerTypes[tower.type];
                ctx.save();
                
                // Selection glow
                if (tower.selected) {
                    ctx.shadowColor = spec.color;
                    ctx.shadowBlur = 20;
                } else {
                    ctx.shadowColor = 'rgba(0,0,0,0.3)';
                    ctx.shadowBlur = 8;
                }
                
                const spriteKey = spec.key;
                const sprite = Sprites[spriteKey];
                
                if (sprite && sprite.complete) {
                    // Draw tower with rotation based on target
                    if (tower.targetAngle) {
                        ctx.translate(tower.x, tower.y);
                        ctx.rotate(tower.targetAngle);
                        ctx.drawImage(sprite, -20, -20, 40, 40);
                        ctx.rotate(-tower.targetAngle);
                        ctx.translate(-tower.x, -tower.y);
                    } else {
                        ctx.drawImage(sprite, tower.x - 20, tower.y - 20, 40, 40);
                    }
                } else {
                    // Enhanced fallback tower
                    ctx.fillStyle = spec.color;
                    ctx.beginPath();
                    ctx.arc(tower.x, tower.y, 20, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Tower details
                    ctx.fillStyle = darkenColor(spec.color, 20);
                    ctx.beginPath();
                    ctx.arc(tower.x, tower.y, 16, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Face
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(tower.x - 6, tower.y - 4, 3, 0, Math.PI * 2);
                    ctx.arc(tower.x + 6, tower.y - 4, 3, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Smile
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(tower.x, tower.y + 4, 8, 0.2, Math.PI - 0.2, false);
                    ctx.stroke();
                }
                
                ctx.restore();
                
                // Level indicator
                ctx.fillStyle = '#4E342E';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Lv.${tower.level}`, tower.x, tower.y - 28);
                
                // Health bar for damaged towers
                if (tower.health && tower.health < tower.maxHealth) {
                    const healthPercent = tower.health / tower.maxHealth;
                    ctx.fillStyle = '#B71C1C';
                    ctx.fillRect(tower.x - 20, tower.y - 35, 40, 4);
                    ctx.fillStyle = '#43A047';
                    ctx.fillRect(tower.x - 20, tower.y - 35, 40 * healthPercent, 4);
                }
                
                // Show range when selected
                if (tower.selected) {
                    ctx.strokeStyle = `rgba(${hexToRgb(spec.color)}, 0.2)`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Inner glow
                    ctx.strokeStyle = `rgba(${hexToRgb(spec.color)}, 0.1)`;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(tower.x, tower.y, tower.range - 2, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                // Ability cooldown indicator
                if (tower.abilityCooldown && tower.abilityCooldown > 0) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.beginPath();
                    ctx.arc(tower.x, tower.y, 22, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * (tower.abilityCooldown / tower.abilityMaxCooldown)));
                    ctx.lineTo(tower.x, tower.y);
                    ctx.fill();
                }
            });
        }
        
        function drawEnhancedEnemies() {
            gameState.enemies.forEach((enemy, index) => {
                ctx.save();
                
                // Enemy shadow
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetY = 3;
                
                // Enemy body
                ctx.fillStyle = enemy.color;
                ctx.beginPath();
                
                if (enemy.type === 'heffalump') {
                    // Elephant shape
                    ctx.ellipse(enemy.x, enemy.y, 18, 14, 0, 0, Math.PI * 2);
                } else if (enemy.type === 'woozle') {
                    // Wolf shape
                    ctx.ellipse(enemy.x, enemy.y, 16, 10, 0, 0, Math.PI * 2);
                } else if (enemy.type === 'storm') {
                    // Lightning cloud
                    ctx.arc(enemy.x, enemy.y, 16, 0, Math.PI * 2);
                    // Lightning bolts
                    ctx.fillStyle = '#FFD700';
                    for (let i = 0; i < 3; i++) {
                        const angle = (enemy.frame || 0) + (i * Math.PI * 2 / 3);
                        const bx = enemy.x + Math.cos(angle) * 20;
                        const by = enemy.y + Math.sin(angle) * 20;
                        ctx.beginPath();
                        ctx.moveTo(enemy.x, enemy.y);
                        ctx.lineTo(bx, by);
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                    ctx.fillStyle = enemy.color;
                } else {
                    // Default circle
                    ctx.arc(enemy.x, enemy.y, 14, 0, Math.PI * 2);
                }
                
                ctx.fill();
                ctx.restore();
                
                // Enemy border
                ctx.strokeStyle = darkenColor(enemy.color, 30);
                ctx.lineWidth = 2;
                ctx.beginPath();
                if (enemy.type === 'heffalump') {
                    ctx.ellipse(enemy.x, enemy.y, 18, 14, 0, 0, Math.PI * 2);
                } else if (enemy.type === 'woozle') {
                    ctx.ellipse(enemy.x, enemy.y, 16, 10, 0, 0, Math.PI * 2);
                } else {
                    ctx.arc(enemy.x, enemy.y, 14, 0, Math.PI * 2);
                }
                ctx.stroke();
                
                // Enemy icon
                ctx.fillStyle = '#000';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(enemy.char, enemy.x, enemy.y + (enemy.type === 'heffalump' ? 2 : 0));
                
                // Health bar
                const healthWidth = 36 * (enemy.health / enemy.maxHealth);
                ctx.fillStyle = '#B71C1C';
                ctx.fillRect(enemy.x - 18, enemy.y - 26, 36, 5);
                ctx.fillStyle = enemy.health > enemy.maxHealth * 0.5 ? '#43A047' : '#FF8C42';
                ctx.fillRect(enemy.x - 18, enemy.y - 26, healthWidth, 5);
                
                // Health bar border
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(enemy.x - 18, enemy.y - 26, 36, 5);
                
                // Status effects
                if (enemy.slowed) {
                    ctx.fillStyle = 'rgba(66, 133, 244, 0.7)';
                    ctx.beginPath();
                    ctx.arc(enemy.x, enemy.y + 20, 6, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = '#FFF';
                    ctx.font = '10px Arial';
                    ctx.fillText('🐌', enemy.x - 4, enemy.y + 22);
                }
                
                if (enemy.poisoned) {
                    ctx.fillStyle = 'rgba(76, 175, 80, 0.7)';
                    ctx.beginPath();
                    ctx.arc(enemy.x + 15, enemy.y + 20, 6, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = '#FFF';
                    ctx.font = '10px Arial';
                    ctx.fillText('☠️', enemy.x + 11, enemy.y + 22);
                }
            });
        }
        
        function drawEnhancedProjectiles() {
            projectilePool.updateAll(0, (proj) => {
                if (!proj.active) return;
                
                ctx.save();
                
                // Different styles for different projectile types
                switch(proj.type) {
                    case 'honey':
                        ctx.fillStyle = proj.color;
                        ctx.beginPath();
                        ctx.arc(proj.x, proj.y, 6, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Honey drip trail
                        ctx.strokeStyle = proj.color;
                        ctx.lineWidth = 2;
                        ctx.setLineDash([2, 3]);
                        ctx.beginPath();
                        ctx.moveTo(proj.x, proj.y);
                        ctx.lineTo(proj.x - proj.vx * 3, proj.y - proj.vy * 3);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        break;
                        
                    case 'fire':
                        // Fireball effect
                        const gradient = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, 8);
                        gradient.addColorStop(0, '#FFD700');
                        gradient.addColorStop(0.5, '#FF8C42');
                        gradient.addColorStop(1, 'transparent');
                        
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                        
                    default:
                        ctx.fillStyle = proj.color;
                        ctx.beginPath();
                        ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
                        ctx.fill();
                }
                
                // Projectile glow
                ctx.shadowColor = proj.color;
                ctx.shadowBlur = 10;
                ctx.fill();
                
                ctx.restore();
            });
        }
        
        function drawEnhancedEffects() {
            gameState.effects.forEach((effect, index) => {
                ctx.save();
                
                switch(effect.type) {
                    case 'explosion':
                        const radius = effect.radius * (1 - (Date.now() - effect.start) / effect.duration);
                        const gradient = ctx.createRadialGradient(
                            effect.x, effect.y, 0,
                            effect.x, effect.y, radius
                        );
                        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
                        gradient.addColorStop(0.7, 'rgba(255, 140, 66, 0.4)');
                        gradient.addColorStop(1, 'rgba(255, 140, 66, 0)');
                        
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                        
                    case 'shield':
                        const shieldRadius = 30 + Math.sin(Date.now() / 200) * 5;
                        ctx.strokeStyle = `rgba(66, 133, 244, ${0.5 + Math.sin(Date.now() / 300) * 0.3})`;
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(effect.x, effect.y, shieldRadius, 0, Math.PI * 2);
                        ctx.stroke();
                        break;
                        
                    case 'slow':
                        ctx.strokeStyle = `rgba(66, 133, 244, ${0.3 + Math.sin(Date.now() / 400) * 0.2})`;
                        ctx.lineWidth = 2;
                        ctx.setLineDash([5, 5]);
                        ctx.beginPath();
                        ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        break;
                }
                
                ctx.restore();
            });
        }
        
        function drawEnhancedUI() {
            // Combo counter
            if (gameState.combos > 1) {
                ctx.save();
                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = '#FFD700';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Glow effect
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 20;
                
                const comboText = `${gameState.combos}x COMBO!`;
                ctx.fillText(comboText, canvas.width / 2, 40);
                
                // Combo multiplier
                const multiplier = 1 + (gameState.combos - 1) * 0.1;
                ctx.font = 'bold 18px Arial';
                ctx.fillText(`${multiplier.toFixed(1)}x Multiplier`, canvas.width / 2, 70);
                
                ctx.restore();
            }
            
            // Wave progress
            if (gameState.isWaveActive) {
                const progressWidth = 200;
                const progressHeight = 10;
                const progressX = canvas.width - progressWidth - 20;
                const progressY = 30;
                
                // Background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(progressX, progressY, progressWidth, progressHeight);
                
                // Progress
                const enemyCount = gameState.enemies.length;
                const maxEnemies = Math.min(5 + gameState.wave * 2, 30);
                const progress = (maxEnemies - enemyCount) / maxEnemies;
                
                const gradient = ctx.createLinearGradient(progressX, progressY, progressX + progressWidth, progressY);
                gradient.addColorStop(0, '#4CAF50');
                gradient.addColorStop(progress, '#FFD54F');
                gradient.addColorStop(1, '#FF8C42');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(progressX, progressY, progressWidth * progress, progressHeight);
                
                // Border
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 1;
                ctx.strokeRect(progressX, progressY, progressWidth, progressHeight);
                
                // Text
                ctx.fillStyle = '#FFF';
                ctx.font = '12px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(`Wave ${gameState.wave}`, progressX, progressY - 5);
            }
        }
        
        // Enhanced game logic
        function updateEnhancedGame(delta) {
            if (!gameState.running || gameState.paused) return;
            
            const deltaTime = delta / 16;
            const now = Date.now();
            
            // Update ability cooldowns
            Object.keys(gameState.abilities).forEach(key => {
                if (gameState.abilities[key].cooldown > 0) {
                    gameState.abilities[key].cooldown -= delta;
                    if (gameState.abilities[key].cooldown <= 0) {
                        gameState.abilities[key].available = true;
                        gameState.abilities[key].cooldown = 0;
                    }
                }
            });
            
            // Update tower ability cooldowns
            gameState.towers.forEach(tower => {
                if (tower.abilityCooldown > 0) {
                    tower.abilityCooldown -= delta;
                }
            });
            
            // Update effects
            for (let i = gameState.effects.length - 1; i >= 0; i--) {
                const effect = gameState.effects[i];
                if (now - effect.start > effect.duration) {
                    gameState.effects.splice(i, 1);
                }
            }
            
            // Update combo timer
            if (gameState.combos > 0 && now - gameState.lastComboTime > 2000) {
                gameState.combos = 0;
            }
            
            // Update spatial grid
            spatialGrid.clear();
            gameState.enemies.forEach(enemy => spatialGrid.insert(enemy));
            
            // Move enemies with enhanced path following
            for (let i = gameState.enemies.length - 1; i >= 0; i--) {
                const enemy = gameState.enemies[i];
                
                // Apply status effects
                if (enemy.slowed) {
                    enemy.speed = enemy.baseSpeed * 0.5;
                } else {
                    enemy.speed = enemy.baseSpeed;
                }
                
                // Apply poison damage
                if (enemy.poisoned && now - enemy.lastPoisonTick > 1000) {
                    enemy.health -= 1;
                    enemy.lastPoisonTick = now;
                    
                    // Create poison effect
                    gameParticles.createParticle(
                        enemy.x + (Math.random() - 0.5) * 10,
                        enemy.y + (Math.random() - 0.5) * 10,
                        'magic',
                        { x: 0, y: -1 }
                    );
                }
                
                const target = enhancedPath[enemy.pathIndex];
                const dx = target.x - enemy.x;
                const dy = target.y - enemy.y;
                const dist = Math.hypot(dx, dy);
                
                if (dist < 2) {
                    enemy.pathIndex++;
                    if (enemy.pathIndex >= enhancedPath.length) {
                        // Reached honey pot
                        gameState.lives--;
                        syncEnhancedStats();
                        createDamageEffect();
                        
                        // Remove enemy with particle effect
                        for (let j = 0; j < 8; j++) {
                            gameParticles.createParticle(
                                enemy.x, enemy.y,
                                'fire',
                                {
                                    x: (Math.random() - 0.5) * 4,
                                    y: (Math.random() - 0.5) * 4
                                }
                            );
                        }
                        
                        gameState.enemies.splice(i, 1);
                        continue;
                    }
                } else {
                    const step = enemy.speed * deltaTime;
                    enemy.x += (dx / dist) * step;
                    enemy.y += (dy / dist) * step;
                    
                    // Update target angle for path following
                    enemy.angle = Math.atan2(dy, dx);
                }
                
                // Update animation frame
                enemy.frame = (enemy.frame || 0) + 0.1;
            }
            
            // Tower targeting and firing
            gameState.towers.forEach(tower => {
                if (tower.cooldown > 0) {
                    tower.cooldown -= delta;
                    return;
                }
                
                // Find target using spatial grid
                const nearbyEnemies = spatialGrid.query(tower.x, tower.y, tower.range);
                let bestTarget = null;
                let bestDist = tower.range * tower.range;
                
                // Different targeting strategies
                for (const enemy of nearbyEnemies) {
                    const dx = enemy.x - tower.x;
                    const dy = enemy.y - tower.y;
                    const dSquared = dx * dx + dy * dy;
                    
                    if (dSquared < bestDist) {
                        bestDist = dSquared;
                        bestTarget = enemy;
                    }
                }
                
                if (bestTarget) {
                    // Update tower rotation
                    tower.targetAngle = Math.atan2(bestTarget.y - tower.y, bestTarget.x - tower.x);
                    
                    // Create projectile
                    projectilePool.get(
                        tower.x, tower.y,
                        bestTarget,
                        tower.damage,
                        enhancedTowerTypes[tower.type].color,
                        5,
                        'honey'
                    );
                    
                    tower.cooldown = tower.fireRate;
                    
                    // Play firing sound
                    if (window.audioManager && Math.random() < 0.3) {
                        window.audioManager.playTone([440, 554, 659], 0.1);
                    }
                }
            });
            
            // Update projectiles
            projectilePool.updateAll(delta, (proj, idx) => {
                if (!proj.target || proj.target.health <= 0) {
                    proj.active = false;
                    return;
                }
                
                const dx = proj.target.x - proj.x;
                const dy = proj.target.y - proj.y;
                const dist = Math.hypot(dx, dy);
                
                if (dist < 10) {
                    // Hit enemy
                    let damage = proj.damage;
                    
                    // Apply combo multiplier
                    const comboMultiplier = 1 + (gameState.combos - 1) * 0.1;
                    damage *= comboMultiplier;
                    
                    // Apply armor reduction for heffalumps
                    if (proj.target.type === 'heffalump') {
                        damage *= 0.7;
                    }
                    
                    // Apply dodge chance for woozles
                    if (proj.target.type === 'woozle' && Math.random() < 0.2) {
                        // Dodge!
                        createDodgeEffect(proj.target);
                        proj.active = false;
                        return;
                    }
                    
                    proj.target.health -= damage;
                    
                    if (proj.target.health <= 0) {
                        // Enemy defeated
                        const points = proj.target.points;
                        gameState.honey += points;
                        gameState.score += points;
                        
                        // Combo system
                        const now = Date.now();
                        if (now - gameState.lastComboTime < 2000) {
                            gameState.combos++;
                        } else {
                            gameState.combos = 1;
                        }
                        gameState.lastComboTime = now;
                        
                        syncEnhancedStats();
                        
                        // Create death effect
                        createEnemyDeathEffect(proj.target);
                        
                        // Remove enemy
                        const enemyIndex = gameState.enemies.indexOf(proj.target);
                        if (enemyIndex > -1) {
                            gameState.enemies.splice(enemyIndex, 1);
                        }
                        
                        // Play sound
                        if (window.audioManager) {
                            window.audioManager.playGameSound('collect');
                        }
                    } else {
                        // Hit effect
                        createHitEffect(proj.target);
                    }
                    
                    proj.active = false;
                } else {
                    const step = proj.speed * deltaTime;
                    proj.x += (dx / dist) * step;
                    proj.y += (dy / dist) * step;
                    proj.vx = dx / dist * proj.speed;
                    proj.vy = dy / dist * proj.speed;
                }
            });
            
            // Spawn enemies during wave
            if (gameState.isWaveActive) {
                const now = performance.now();
                const maxEnemies = Math.min(5 + gameState.wave * 2, 30);
                
                if (gameState.enemies.length < maxEnemies && now - gameState.lastSpawnTime > 900) {
                    gameState.lastSpawnTime = now;
                    
                    // Weighted random enemy selection based on wave
                    let enemyWeights;
                    if (gameState.wave < 3) {
                        enemyWeights = [
                            { type: 'heffalump', weight: 0.3 },
                            { type: 'woozle', weight: 0.4 },
                            { type: 'bee', weight: 0.3 }
                        ];
                    } else if (gameState.wave < 6) {
                        enemyWeights = [
                            { type: 'heffalump', weight: 0.4 },
                            { type: 'woozle', weight: 0.3 },
                            { type: 'bee', weight: 0.2 },
                            { type: 'storm', weight: 0.1 }
                        ];
                    } else {
                        enemyWeights = [
                            { type: 'heffalump', weight: 0.3 },
                            { type: 'woozle', weight: 0.3 },
                            { type: 'bee', weight: 0.2 },
                            { type: 'storm', weight: 0.2 }
                        ];
                    }
                    
                    let random = Math.random();
                    let selectedType = 'heffalump';
                    for (const enemyType of enemyWeights) {
                        random -= enemyType.weight;
                        if (random <= 0) {
                            selectedType = enemyType.type;
                            break;
                        }
                    }
                    
                    const spec = enhancedEnemyTypes[selectedType];
                    const enemy = {
                        x: enhancedPath[0].x,
                        y: enhancedPath[0].y,
                        pathIndex: 1,
                        health: spec.health,
                        maxHealth: spec.health,
                        speed: spec.speed,
                        baseSpeed: spec.speed,
                        color: spec.color,
                        points: spec.points,
                        char: spec.char,
                        type: selectedType,
                        behavior: spec.behavior,
                        ability: spec.ability
                    };
                    
                    // Special enemy abilities
                    if (selectedType === 'storm') {
                        enemy.lightningCooldown = 0;
                    }
                    
                    gameState.enemies.push(enemy);
                    
                    // Spawn effect
                    createSpawnEffect(enemy.x, enemy.y, enemy.color);
                }
                
                // Check if wave is complete
                if (gameState.enemies.length === 0 && now - gameState.lastSpawnTime > 2600) {
                    gameState.isWaveActive = false;
                    gameState.wave++;
                    gameState.honey += 35 + gameState.wave * 5;
                    gameState.score += 100 * gameState.wave;
                    syncEnhancedStats();
                    
                    setEnhancedDefenseAlert(`Wave ${gameState.wave - 1} cleared! Extra honey for the team.`, 'success');
                    showEnhancedWaveStatus(`Wave ${gameState.wave} ready!`, 1600);
                    
                    // Play victory sound
                    if (window.audioManager) {
                        window.audioManager.playGameSound('victory');
                    }
                    
                    // Reset combo
                    gameState.combos = 0;
                }
            }
            
            // Update particle system
            gameParticles.update(delta);
            
            // Game over check
            if (gameState.lives <= 0 && gameState.running) {
                gameState.running = false;
                setEnhancedDefenseAlert('Oh bother! The honey pots are empty.', 'error');
                showEnhancedWaveStatus('Game Over', 1800);
                shakeElement(defenseCard);
                
                // Game over effect
                createGameOverEffect();
                
                // Show game over screen
                setTimeout(() => {
                    showGameOverScreen();
                }, 1000);
            }
        }
        
        // Effect creation functions
        function createHitEffect(enemy) {
            for (let i = 0; i < 3; i++) {
                gameParticles.createParticle(
                    enemy.x + (Math.random() - 0.5) * 10,
                    enemy.y + (Math.random() - 0.5) * 10,
                    'honey',
                    {
                        x: (Math.random() - 0.5) * 3,
                        y: (Math.random() - 0.5) * 3 - 1
                    }
                );
            }
        }
        
        function createEnemyDeathEffect(enemy) {
            // Particle burst
            for (let i = 0; i < 12; i++) {
                gameParticles.createParticle(
                    enemy.x, enemy.y,
                    enemy.type === 'storm' ? 'magic' : 'honey',
                    {
                        x: (Math.random() - 0.5) * 6,
                        y: (Math.random() - 0.5) * 6 - 2
                    }
                );
            }
            
            // Score popup
            createScorePopup(enemy.x, enemy.y, enemy.points);
        }
        
        function createSpawnEffect(x, y, color) {
            gameState.effects.push({
                type: 'explosion',
                x, y,
                radius: 30,
                start: Date.now(),
                duration: 500
            });
            
            // Ring effect
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                gameParticles.createParticle(
                    x, y,
                    'sparkle',
                    {
                        x: Math.cos(angle) * 2,
                        y: Math.sin(angle) * 2
                    }
                );
            }
        }
        
        function createDodgeEffect(enemy) {
            // Create dodge particles
            for (let i = 0; i < 6; i++) {
                gameParticles.createParticle(
                    enemy.x, enemy.y,
                    'sparkle',
                    {
                        x: (Math.random() - 0.5) * 4,
                        y: (Math.random() - 0.5) * 4
                    }
                );
            }
            
            // Show "DODGE!" text
            createFloatingText(enemy.x, enemy.y - 30, 'DODGE!', '#4285F4');
        }
        
        function createScorePopup(x, y, score) {
            const text = `+${score}`;
            createFloatingText(x, y - 20, text, '#FFD700');
        }
        
        function createFloatingText(x, y, text, color) {
            const floatingText = {
                x, y,
                text,
                color,
                life: 1.0,
                vy: -1,
                start: Date.now(),
                duration: 1000
            };
            
            // Draw in next frame
            setTimeout(() => {
                ctx.save();
                ctx.font = 'bold 16px Arial';
                ctx.fillStyle = color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 4;
                ctx.fillText(text, x, y);
                ctx.restore();
            }, 0);
        }
        
        function createGameOverEffect() {
            // Darken screen
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 10;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.5s ease;
            `;
            
            canvas.parentElement.style.position = 'relative';
            canvas.parentElement.appendChild(overlay);
            
            setTimeout(() => {
                overlay.style.opacity = '1';
            }, 10);
        }
        
        function showGameOverScreen() {
            const gameOverScreen = document.createElement('div');
            gameOverScreen.className = 'game-over-screen';
            gameOverScreen.innerHTML = `
                <div class="game-over-content">
                    <div class="game-over-title">Game Over</div>
                    <div class="game-over-stats">
                        <div class="stat">
                            <div class="stat-label">Wave Reached</div>
                            <div class="stat-value">${gameState.wave}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Score</div>
                            <div class="stat-value">${gameState.score}</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">Honey Collected</div>
                            <div class="stat-value">${gameState.honey}</div>
                        </div>
                    </div>
                    <div class="game-over-actions">
                        <button class="game-over-btn restart" onclick="restartEnhancedDefenseGame()">
                            <i class="fas fa-redo"></i> Play Again
                        </button>
                        <button class="game-over-btn menu" onclick="returnToGameMenu()">
                            <i class="fas fa-home"></i> Main Menu
                        </button>
                    </div>
                </div>
            `;
            
            const overlay = canvas.parentElement.querySelector('div[style*="rgba(0,0,0,0.7)"]');
            if (overlay) {
                overlay.appendChild(gameOverScreen);
            }
        }
        
        // Enhanced game loop
        let animationFrameId = null;
        
        function enhancedGameLoop(timestamp) {
            if (!gameState.running && animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                return;
            }
            
            if (frameLimiter.shouldRender(timestamp)) {
                const delta = timestamp - gameState.lastFrameTime;
                gameState.lastFrameTime = timestamp;
                
                const cappedDelta = Math.min(delta, 100);
                
                updateEnhancedGame(cappedDelta);
                renderEnhancedGame();
            }
            
            animationFrameId = requestAnimationFrame(enhancedGameLoop);
        }
        
        function renderEnhancedGame() {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw everything
            drawEnhancedBackground();
            drawEnhancedEffects();
            drawEnhancedTowers();
            drawEnhancedEnemies();
            drawEnhancedProjectiles();
            gameParticles.render();
            drawEnhancedUI();
        }
        
        // Start the game
        animationFrameId = requestAnimationFrame(enhancedGameLoop);
        
        // Initialize background
        drawEnhancedBackgroundToBuffer();
        
        // Event listeners
        canvas.addEventListener('click', (ev) => {
            if (!enhancedTowerTypes[gameState.selectedTower]) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = ev.clientX - rect.left;
            const y = ev.clientY - rect.top;
            
            // Check if clicking on path
            let nearPath = false;
            for (let i = 0; i < enhancedPath.length - 1; i++) {
                const p1 = enhancedPath[i];
                const p2 = enhancedPath[i + 1];
                
                // Distance from point to line segment
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
                
                if (dist < 40) {
                    nearPath = true;
                    break;
                }
            }
            
            if (nearPath) {
                setEnhancedDefenseAlert('Cannot place towers on the path!', 'warning');
                return;
            }
            
            const spec = enhancedTowerTypes[gameState.selectedTower];
            if (gameState.honey < spec.cost) {
                showEnhancedWaveStatus('Not enough honey for that friend.', 1100);
                shakeElement(defenseCard);
                return;
            }
            
            // Place tower
            gameState.honey -= spec.cost;
            syncEnhancedStats();
            
            gameState.towers.push({
                x,
                y,
                type: gameState.selectedTower,
                damage: spec.damage,
                range: spec.range,
                fireRate: spec.fireRate,
                level: 1,
                cooldown: 0,
                selected: false,
                health: 100,
                maxHealth: 100
            });
            
            // Placement effect
            createTowerPlacementEffect(x, y);
            
            // Play sound
            if (window.audioManager) {
                window.audioManager.playSound('click');
            }
        });
        
        function createTowerPlacementEffect(x, y) {
            // Ring effect
            gameState.effects.push({
                type: 'explosion',
                x, y,
                radius: 40,
                start: Date.now(),
                duration: 600
            });
            
            // Particles
            for (let i = 0; i < 12; i++) {
                gameParticles.createParticle(
                    x, y,
                    'sparkle',
                    {
                        x: (Math.random() - 0.5) * 4,
                        y: (Math.random() - 0.5) * 4 - 2
                    }
                );
            }
        }
        
        // Tower selection
        towerOptions.forEach((opt) => {
            opt.addEventListener('click', () => {
                towerOptions.forEach((o) => o.classList.remove('selected'));
                opt.classList.add('selected');
                gameState.selectedTower = opt.getAttribute('data-tower') || 'pooh';
                
                // Update ability button
                syncEnhancedStats();
                
                // Play selection sound
                if (window.audioManager) {
                    window.audioManager.playSound('click');
                }
            });
        });
        
        // Start wave button
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (gameState.isWaveActive) return;
                
                gameState.isWaveActive = true;
                gameState.lastSpawnTime = performance.now();
                showEnhancedWaveStatus(`Wave ${gameState.wave} is beginning...`);
                setEnhancedDefenseAlert('Your friends are on the move. Keep an eye on the path!', 'info');
                
                // Play sound
                if (window.audioManager) {
                    window.audioManager.playSound('click');
                }
            });
        }
        
        // Upgrade towers button
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                if (gameState.honey < 50 || gameState.towers.length === 0) {
                    setEnhancedDefenseAlert('Need more honey or towers to upgrade!', 'warning');
                    return;
                }
                
                gameState.honey -= 50;
                gameState.towers.forEach((t) => {
                    t.level += 1;
                    t.damage += 5;
                    t.range += 8;
                    t.maxHealth += 20;
                    t.health = t.maxHealth;
                });
                
                syncEnhancedStats();
                setEnhancedDefenseAlert('Your friends feel braver with a little extra honey.', 'success');
                showEnhancedWaveStatus('Towers upgraded!', 1200);
                
                // Upgrade effect
                gameState.towers.forEach(tower => {
                    createUpgradeEffect(tower.x, tower.y);
                });
                
                // Play sound
                if (window.audioManager) {
                    window.audioManager.playSound('powerup');
                }
            });
        }
        
        function createUpgradeEffect(x, y) {
            // Level up particles
            for (let i = 0; i < 8; i++) {
                gameParticles.createParticle(
                    x, y,
                    'sparkle',
                    {
                        x: (Math.random() - 0.5) * 3,
                        y: (Math.random() - 0.5) * 3 - 1
                    }
                );
            }
        }
        
        // Ability button
        if (abilityBtn) {
            abilityBtn.addEventListener('click', () => {
                const towerType = gameState.selectedTower;
                const ability = gameState.abilities[towerType];
                
                if (!ability || !ability.available) return;
                
                // Use ability
                useTowerAbility(towerType);
                ability.available = false;
                ability.cooldown = enhancedTowerTypes[towerType].ability.cooldown;
                
                syncEnhancedStats();
                setEnhancedDefenseAlert(`${enhancedTowerTypes[towerType].ability.name} activated!`, 'success');
                
                // Play sound
                if (window.audioManager) {
                    window.audioManager.playSound('powerup');
                }
            });
        }
        
        function useTowerAbility(towerType) {
            const spec = enhancedTowerTypes[towerType];
            
            switch(towerType) {
                case 'pooh':
                    // Honey Splash - damage all enemies in range of selected tower
                    const selectedTower = gameState.towers.find(t => t.selected && t.type === 'pooh');
                    if (selectedTower) {
                        const enemiesInRange = spatialGrid.query(selectedTower.x, selectedTower.y, selectedTower.range);
                        enemiesInRange.forEach(enemy => {
                            enemy.health -= selectedTower.damage * 0.5;
                            
                            // Splash effect
                            gameParticles.createParticle(
                                enemy.x, enemy.y,
                                'honey',
                                {
                                    x: (Math.random() - 0.5) * 2,
                                    y: (Math.random() - 0.5) * 2
                                }
                            );
                        });
                        
                        // Area effect
                        gameState.effects.push({
                            type: 'explosion',
                            x: selectedTower.x,
                            y: selectedTower.y,
                            radius: selectedTower.range,
                            start: Date.now(),
                            duration: 800
                        });
                    }
                    break;
                    
                case 'tigger':
                    // Bounce Attack - chain damage
                    const tiggerTowers = gameState.towers.filter(t => t.type === 'tigger');
                    tiggerTowers.forEach(tower => {
                        let currentTarget = gameState.enemies[0];
                        let bounceCount = 3;
                        
                        while (currentTarget && bounceCount > 0) {
                            const dx = currentTarget.x - tower.x;
                            const dy = currentTarget.y - tower.y;
                            const dist = Math.hypot(dx, dy);
                            
                            if (dist < tower.range) {
                                currentTarget.health -= tower.damage * 0.7;
                                bounceCount--;
                                
                                // Find next nearest enemy
                                currentTarget = findNearestEnemy(currentTarget, gameState.enemies, 100);
                                
                                // Bounce effect
                                gameParticles.createParticle(
                                    currentTarget?.x || tower.x,
                                    currentTarget?.y || tower.y,
                                    'fire',
                                    {
                                        x: 0,
                                        y: 0
                                    }
                                );
                            } else {
                                break;
                            }
                        }
                    });
                    break;
                    
                case 'owl':
                    // Wisdom Beam - piercing attack
                    const owlTowers = gameState.towers.filter(t => t.type === 'owl');
                    owlTowers.forEach(tower => {
                        // Find enemies in a line
                        const lineEnemies = gameState.enemies.filter(enemy => {
                            return Math.abs(enemy.y - tower.y) < 20 && 
                                   enemy.x > tower.x && 
                                   enemy.x < tower.x + tower.range;
                        });
                        
                        // Sort by distance
                        lineEnemies.sort((a, b) => a.x - b.x);
                        
                        // Damage all enemies in line
                        lineEnemies.forEach(enemy => {
                            enemy.health -= tower.damage * 0.3;
                            
                            // Beam effect
                            gameParticles.createParticle(
                                enemy.x, enemy.y,
                                'magic',
                                {
                                    x: 0,
                                    y: 0
                                }
                            );
                        });
                        
                        // Beam visual
                        if (lineEnemies.length > 0) {
                            ctx.save();
                            ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
                            ctx.lineWidth = 3;
                            ctx.beginPath();
                            ctx.moveTo(tower.x, tower.y);
                            ctx.lineTo(lineEnemies[lineEnemies.length - 1].x, lineEnemies[lineEnemies.length - 1].y);
                            ctx.stroke();
                            ctx.restore();
                        }
                    });
                    break;
            }
        }
        
        function findNearestEnemy(fromEnemy, enemies, maxDistance) {
            let nearest = null;
            let nearestDist = maxDistance * maxDistance;
            
            for (const enemy of enemies) {
                if (enemy === fromEnemy) continue;
                
                const dx = enemy.x - fromEnemy.x;
                const dy = enemy.y - fromEnemy.y;
                const dist = dx * dx + dy * dy;
                
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = enemy;
                }
            }
            
            return nearest;
        }
        
        // Pause/Resume
        window.toggleDefenseGamePause = function() {
            gameState.paused = !gameState.paused;
            const pauseBtn = document.getElementById('pause-defense');
            if (pauseBtn) {
                pauseBtn.innerHTML = gameState.paused ? 
                    '<i class="fas fa-play"></i>' : 
                    '<i class="fas fa-pause"></i>';
            }
        };
        
        // Restart function
        window.restartEnhancedDefenseGame = function() {
            // Reset game state
            gameState = {
                honey: 100,
                lives: 10,
                wave: 1,
                score: 0,
                selectedTower: 'pooh',
                towers: [],
                enemies: [],
                isWaveActive: false,
                lastSpawnTime: 0,
                lastFrameTime: performance.now(),
                running: true,
                paused: false,
                waveStatusTimeout: null,
                abilities: {
                    pooh: { available: true, cooldown: 0 },
                    tigger: { available: true, cooldown: 0 },
                    owl: { available: true, cooldown: 0 }
                },
                effects: [],
                combos: 0,
                lastComboTime: 0
            };
            
            // Reset pools
            projectilePool.reset();
            spatialGrid.clear();
            gameParticles.clear();
            
            // Remove game over screen
            const overlay = canvas.parentElement.querySelector('div[style*="rgba(0,0,0,0.7)"]');
            if (overlay) {
                overlay.remove();
            }
            
            // Update UI
            syncEnhancedStats();
            setEnhancedDefenseAlert('The honey path is peaceful. Prepare your friends.', 'info');
            showEnhancedWaveStatus('Wave 1 ready', 1300);
            
            // Restart game loop if needed
            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(enhancedGameLoop);
            }
        };
        
        // Clean up
        window.addEventListener('beforeunload', () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        });
        
        console.log('Enhanced Honey Hive Defense game initialized');
    }

    // ============================================================================
    // ENHANCED GAME 2: HONEY POT CATCH
    // ============================================================================

    function initEnhancedHoneyCatchGame() {
        console.log("Initializing enhanced Honey Catch Game...");
        
        const canvas = document.getElementById('honey-game');
        if (!canvas) {
            console.error("Honey catch game canvas not found!");
            return;
        }
        
        const ctx = canvas.getContext('2d');
        const frameLimiter = new FrameRateLimiter(window.GAME_FPS_TARGET);
        
        // Performance optimizations
        canvas.style.imageRendering = isMobileDevice() ? 'pixelated' : 'auto';
        ctx.imageSmoothingEnabled = !isMobileDevice();
        
        // Enhanced background canvas
        const catchBackgroundCanvas = document.createElement('canvas');
        catchBackgroundCanvas.width = canvas.width;
        catchBackgroundCanvas.height = canvas.height;
        const catchBgCtx = catchBackgroundCanvas.getContext('2d');
        
        // Enhanced particle system
        const catchParticles = new EnhancedParticleSystem(canvas);
        
        // UI elements
        const scoreSpan = document.getElementById('score-count');
        const timeSpan = document.getElementById('time-count');
        const livesSpan = document.getElementById('catch-lives');
        const startBtn = document.getElementById('start-catch');
        const pauseBtn = document.getElementById('pause-catch');
        const catchOverlay = document.getElementById('catch-overlay');
        const catchCountdown = document.getElementById('catch-countdown');
        const catchHint = document.getElementById('catch-hint');
        const catchCard = document.getElementById('catch-card');
        const multiplierDisplay = document.getElementById('catch-multiplier');
        const comboDisplay = document.getElementById('catch-combo');
        
        // Enhanced game state
        let gameState = {
            score: 0,
            timeLeft: 60,
            lives: 3,
            gameRunning: false,
            timerInterval: null,
            lastFrameTime: performance.now(),
            poohX: canvas.width / 2,
            poohY: canvas.height - 80,
            poohWidth: 60,
            poohHeight: 60,
            countdownInterval: null,
            overlayTimeout: null,
            honeyPots: [],
            bees: [],
            powerUps: [],
            combos: 0,
            multiplier: 1,
            lastCatchTime: 0,
            streak: 0,
            effects: [],
            isInvincible: false,
            invincibilityEnd: 0,
            doublePoints: false,
            doublePointsEnd: 0,
            slowMotion: false,
            slowMotionEnd: 0
        };
        
        // Enhanced object pools
        const honeyPotPool = {
            pool: [],
            active: 0,
            
            get: function(x, y, speed, type = 'normal') {
                let pot;
                if (this.active < this.pool.length) {
                    pot = this.pool[this.active];
                    Object.assign(pot, { x, y, speed, type, active: true });
                } else {
                    pot = { x, y, speed, type, active: true };
                    this.pool.push(pot);
                }
                this.active++;
                return pot;
            },
            
            updateAll: function(delta, callback) {
                for (let i = 0; i < this.active; i++) {
                    const pot = this.pool[i];
                    if (pot.active) {
                        callback(pot, i);
                    }
                }
            },
            
            reset: function() {
                for (let i = 0; i < this.pool.length; i++) {
                    this.pool[i].active = false;
                }
                this.active = 0;
            }
        };
        
        const beePool = {
            pool: [],
            active: 0,
            
            get: function(x, y, speed, type = 'normal') {
                let bee;
                if (this.active < this.pool.length) {
                    bee = this.pool[this.active];
                    Object.assign(bee, { x, y, speed, type, active: true });
                } else {
                    bee = { x, y, speed, type, active: true };
                    this.pool.push(bee);
                }
                this.active++;
                return bee;
            },
            
            updateAll: function(delta, callback) {
                for (let i = 0; i < this.active; i++) {
                    const bee = this.pool[i];
                    if (bee.active) {
                        callback(bee, i);
                    }
                }
            },
            
            reset: function() {
                for (let i = 0; i < this.pool.length; i++) {
                    this.pool[i].active = false;
                }
                this.active = 0;
            }
        };
        
        const powerUpPool = {
            pool: [],
            active: 0,
            
            get: function(x, y, speed, type) {
                let powerUp;
                if (this.active < this.pool.length) {
                    powerUp = this.pool[this.active];
                    Object.assign(powerUp, { x, y, speed, type, active: true });
                } else {
                    powerUp = { x, y, speed, type, active: true };
                    this.pool.push(powerUp);
                }
                this.active++;
                return powerUp;
            },
            
            updateAll: function(delta, callback) {
                for (let i = 0; i < this.active; i++) {
                    const powerUp = this.pool[i];
                    if (powerUp.active) {
                        callback(powerUp, i);
                    }
                }
            },
            
            reset: function() {
                for (let i = 0; i < this.pool.length; i++) {
                    this.pool[i].active = false;
                }
                this.active = 0;
            }
        };
        
        // Power-up types
        const powerUpTypes = {
            heart: { 
                color: '#FF6B6B', 
                icon: '❤️', 
                effect: 'addLife',
                duration: 0
            },
            shield: { 
                color: '#4285F4', 
                icon: '🛡️', 
                effect: 'invincibility',
                duration: 5000
            },
            clock: { 
                color: '#4CAF50', 
                icon: '⏱️', 
                effect: 'addTime',
                duration: 0
            },
            star: { 
                color: '#FFD700', 
                icon: '⭐', 
                effect: 'doublePoints',
                duration: 8000
            },
            lightning: { 
                color: '#9C27B0', 
                icon: '⚡', 
                effect: 'slowMotion',
                duration: 6000
            }
        };
        
        // Enhanced sprite cache
        const enhancedSpriteCache = {
            poohCache: null,
            honeyCache: null,
            beeCache: null,
            powerUpCache: {},
            
            renderPooh: function() {
                if (!this.poohCache) {
                    console.log("Creating enhanced Pooh sprite cache...");
                    const cacheCanvas = document.createElement('canvas');
                    cacheCanvas.width = 80;
                    cacheCanvas.height = 80;
                    const cacheCtx = cacheCanvas.getContext('2d');
                    
                    const sprite = Sprites.pooh;
                    
                    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
                        console.log("Drawing Pooh from loaded image");
                        cacheCtx.save();
                        cacheCtx.shadowColor = 'rgba(0,0,0,0.35)';
                        cacheCtx.shadowBlur = 10;
                        cacheCtx.drawImage(sprite, 10, 10, 60, 60);
                        cacheCtx.restore();
                    } else {
                        console.log("Drawing enhanced Pooh fallback");
                        drawEnhancedPoohFallback(cacheCtx);
                    }
                    this.poohCache = cacheCanvas;
                }
                return this.poohCache;
            },
            
            renderHoneyPot: function(type = 'normal') {
                if (!this.honeyCache) {
                    this.honeyCache = {};
                }
                
                if (!this.honeyCache[type]) {
                    const cacheCanvas = document.createElement('canvas');
                    cacheCanvas.width = 32;
                    cacheCanvas.height = 32;
                    const cacheCtx = cacheCanvas.getContext('2d');
                    
                    const sprite = Sprites.honey;
                    
                    if (sprite && sprite.complete) {
                        cacheCtx.drawImage(sprite, 0, 0, 32, 32);
                    } else {
                        drawEnhancedHoneyPotFallback(cacheCtx, type);
                    }
                    
                    this.honeyCache[type] = cacheCanvas;
                }
                return this.honeyCache[type];
            },
            
            renderBee: function() {
                if (!this.beeCache) {
                    const cacheCanvas = document.createElement('canvas');
                    cacheCanvas.width = 30;
                    cacheCanvas.height = 30;
                    const cacheCtx = cacheCanvas.getContext('2d');
                    
                    drawEnhancedBee(cacheCtx);
                    this.beeCache = cacheCanvas;
                }
                return this.beeCache;
            },
            
            renderPowerUp: function(type) {
                if (!this.powerUpCache[type]) {
                    const cacheCanvas = document.createElement('canvas');
                    cacheCanvas.width = 30;
                    cacheCanvas.height = 30;
                    const cacheCtx = cacheCanvas.getContext('2d');
                    
                    drawPowerUp(cacheCtx, type);
                    this.powerUpCache[type] = cacheCanvas;
                }
                return this.powerUpCache[type];
            }
        };
        
        function drawEnhancedPoohFallback(ctx) {
            // Body with gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, 80);
            gradient.addColorStop(0, '#FFC107');
            gradient.addColorStop(1, '#FF9800');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(40, 40, 30, 0, Math.PI * 2);
            ctx.fill();
            
            // Shadow
            ctx.shadowColor = 'rgba(0,0,0,0.35)';
            ctx.shadowBlur = 10;
            
            // Belly
            ctx.fillStyle = '#FFD8A6';
            ctx.beginPath();
            ctx.ellipse(40, 48, 18, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Red shirt
            ctx.fillStyle = '#D62E2E';
            ctx.fillRect(20, 55, 40, 15);
            // Shirt details
            ctx.fillStyle = '#B71C1C';
            ctx.fillRect(25, 55, 10, 15);
            ctx.fillRect(45, 55, 10, 15);
            
            // Face details
            ctx.fillStyle = '#000000';
            // Eyes
            ctx.beginPath();
            ctx.arc(32, 32, 3, 0, Math.PI * 2);
            ctx.arc(48, 32, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Eye shine
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(31, 30, 1, 0, Math.PI * 2);
            ctx.arc(47, 30, 1, 0, Math.PI * 2);
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
            ctx.fillStyle = '#FF9800';
            ctx.beginPath();
            ctx.arc(25, 20, 10, 0, Math.PI * 2);
            ctx.arc(55, 20, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner ears
            ctx.fillStyle = '#FFD8A6';
            ctx.beginPath();
            ctx.arc(25, 20, 5, 0, Math.PI * 2);
            ctx.arc(55, 20, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }
        
        function drawEnhancedHoneyPotFallback(ctx, type = 'normal') {
            // Pot body with gradient
            const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, '#FFEB3B');
            gradient.addColorStop(0.7, '#FFD54F');
            gradient.addColorStop(1, '#FFB300');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(16, 16, 16, 0, Math.PI * 2);
            ctx.fill();
            
            // Pot rim
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Lid
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(8, 6, 16, 5);
            ctx.fillRect(12, 3, 8, 3);
            
            // Honey drip
            ctx.fillStyle = '#FF9800';
            ctx.beginPath();
            ctx.ellipse(16, 22, 7, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Glint
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(10, 10, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Special types
            if (type === 'golden') {
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.arc(16, 16, 18, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
        
        function drawEnhancedBee(ctx) {
            // Body with gradient
            const gradient = ctx.createRadialGradient(15, 15, 0, 15, 15, 12);
            gradient.addColorStop(0, '#FFEB3B');
            gradient.addColorStop(1, '#FF9800');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(15, 15, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Stripes
            ctx.fillStyle = '#000';
            ctx.fillRect(8, 10, 5, 8);
            ctx.fillRect(18, 10, 5, 8);
            
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(12, 12, 2, 0, Math.PI * 2);
            ctx.arc(18, 12, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Wings
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(8, 5, 8, 0, Math.PI * 2);
            ctx.arc(22, 5, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Wing details
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(8, 5, 6, 0, Math.PI * 2);
            ctx.arc(22, 5, 6, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        function drawPowerUp(ctx, type) {
            const powerUp = powerUpTypes[type];
            if (!powerUp) return;
            
            // Background
            ctx.fillStyle = powerUp.color + '33';
            ctx.beginPath();
            ctx.arc(15, 15, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Border
            ctx.strokeStyle = powerUp.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(15, 15, 14, 0, Math.PI * 2);
            ctx.stroke();
            
            // Icon
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(powerUp.icon, 15, 15);
            
            // Glow effect
            ctx.shadowColor = powerUp.color;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Enhanced UI functions
        function setEnhancedCatchOverlay(line, sub, persistent = false, duration = 1600) {
            if (!catchOverlay || !catchCountdown || !catchHint) return;
            
            catchCountdown.textContent = line;
            catchHint.textContent = sub || '';
            catchOverlay.classList.add('active');
            
            // Add animation
            catchOverlay.style.animation = 'pulseGlow 0.5s ease-in-out';
            
            if (gameState.overlayTimeout) clearTimeout(gameState.overlayTimeout);
            if (!persistent) {
                gameState.overlayTimeout = setTimeout(() => {
                    catchOverlay.classList.remove('active');
                    catchOverlay.style.animation = '';
                }, duration);
            }
        }
        
        function syncEnhancedCatchStats() {
            if (scoreSpan) scoreSpan.textContent = gameState.score;
            if (timeSpan) timeSpan.textContent = gameState.timeLeft;
            if (livesSpan) livesSpan.textContent = gameState.lives;
            if (multiplierDisplay) {
                multiplierDisplay.textContent = `x${gameState.multiplier}`;
                multiplierDisplay.style.display = gameState.multiplier > 1 ? 'block' : 'none';
            }
            if (comboDisplay) {
                comboDisplay.textContent = `${gameState.combos} Combo`;
                comboDisplay.style.display = gameState.combos > 1 ? 'block' : 'none';
            }
        }
        
        syncEnhancedCatchStats();
        setEnhancedCatchOverlay('Ready when you are.', 'Press start to begin a calm 60 second run.', true);
        
        // Enhanced background rendering
        function drawEnhancedCatchBackground() {
            // Sky gradient
            const skyGradient = catchBgCtx.createLinearGradient(0, 0, 0, catchBackgroundCanvas.height);
            skyGradient.addColorStop(0, '#87CEEB');
            skyGradient.addColorStop(0.6, '#B3E5FC');
            skyGradient.addColorStop(1, '#E3F2FD');
            catchBgCtx.fillStyle = skyGradient;
            catchBgCtx.fillRect(0, 0, catchBackgroundCanvas.width, catchBackgroundCanvas.height);
            
            // Sun with rays
            catchBgCtx.save();
            catchBgCtx.shadowColor = '#FFD700';
            catchBgCtx.shadowBlur = 50;
            catchBgCtx.fillStyle = '#FFEB3B';
            catchBgCtx.beginPath();
            catchBgCtx.arc(80, 80, 35, 0, Math.PI * 2);
            catchBgCtx.fill();
            
            // Sun rays
            catchBgCtx.strokeStyle = '#FFD700';
            catchBgCtx.lineWidth = 3;
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const x1 = 80 + Math.cos(angle) * 35;
                const y1 = 80 + Math.sin(angle) * 35;
                const x2 = 80 + Math.cos(angle) * 55;
                const y2 = 80 + Math.sin(angle) * 55;
                
                catchBgCtx.beginPath();
                catchBgCtx.moveTo(x1, y1);
                catchBgCtx.lineTo(x2, y2);
                catchBgCtx.stroke();
            }
            catchBgCtx.restore();
            
            // Parallax clouds
            drawCatchClouds(catchBgCtx);
            
            // Enhanced ground
            const groundHeight = 70;
            const groundY = catchBackgroundCanvas.height - groundHeight;
            
            // Ground gradient
            const groundGradient = catchBgCtx.createLinearGradient(0, groundY, 0, catchBackgroundCanvas.height);
            groundGradient.addColorStop(0, '#8BC34A');
            groundGradient.addColorStop(1, '#689F38');
            catchBgCtx.fillStyle = groundGradient;
            catchBgCtx.fillRect(0, groundY, catchBackgroundCanvas.width, groundHeight);
            
            // Grass detail
            catchBgCtx.fillStyle = '#7CB342';
            for (let x = 0; x < catchBackgroundCanvas.width; x += 10) {
                const height = 10 + Math.random() * 20;
                const sway = Math.sin(x * 0.1) * 4;
                catchBgCtx.fillRect(x + sway, groundY, 3, -height);
            }
            
            // Flowers
            drawCatchFlowers(catchBgCtx, groundY);
            
            // Trees
            drawCatchTrees(catchBgCtx);
        }
        
        function drawCatchClouds(ctx) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            
            // Cloud layer 1 (far)
            for (let i = 0; i < 3; i++) {
                const x = 50 + i * 200;
                const y = 60 + Math.sin(i) * 20;
                
                ctx.beginPath();
                ctx.arc(x, y, 20, 0, Math.PI * 2);
                ctx.arc(x + 25, y - 10, 25, 0, Math.PI * 2);
                ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Cloud layer 2 (near)
            ctx.globalAlpha = 0.7;
            for (let i = 0; i < 2; i++) {
                const x = 150 + i * 250;
                const y = 120 + Math.cos(i) * 15;
                
                ctx.beginPath();
                ctx.arc(x, y, 25, 0, Math.PI * 2);
                ctx.arc(x + 30, y - 15, 30, 0, Math.PI * 2);
                ctx.arc(x + 60, y, 25, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
        
        function drawCatchFlowers(ctx, groundY) {
            const flowers = [
                { x: 100, color: '#FF5252', size: 6 },
                { x: 180, color: '#FF4081', size: 5 },
                { x: 260, color: '#E040FB', size: 7 },
                { x: 340, color: '#536DFE', size: 6 },
                { x: 420, color: '#00BCD4', size: 5 },
                { x: 500, color: '#4CAF50', size: 6 }
            ];
            
            flowers.forEach(flower => {
                ctx.save();
                ctx.translate(flower.x, groundY - 15);
                
                // Stem
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -25);
                ctx.stroke();
                
                // Flower
                const petalCount = 5 + Math.floor(Math.random() * 3);
                for (let p = 0; p < petalCount; p++) {
                    const angle = (p / petalCount) * Math.PI * 2;
                    ctx.fillStyle = flower.color;
                    ctx.beginPath();
                    ctx.ellipse(
                        Math.cos(angle) * flower.size,
                        Math.sin(angle) * flower.size,
                        flower.size * 0.8,
                        flower.size * 0.5,
                        angle,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                }
                
                // Center
                ctx.fillStyle = '#FFD54F';
                ctx.beginPath();
                ctx.arc(0, 0, flower.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            });
        }
        
        function drawCatchTrees(ctx) {
            // Tree 1
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(90, 160, 28, 160);
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.arc(104, 140, 55, 0, Math.PI * 2);
            ctx.fill();
            
            // Tree details
            ctx.fillStyle = '#1B5E20';
            ctx.beginPath();
            ctx.arc(80, 120, 20, 0, Math.PI * 2);
            ctx.arc(130, 125, 22, 0, Math.PI * 2);
            ctx.arc(105, 100, 25, 0, Math.PI * 2);
            ctx.fill();
            
            // Tree 2
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(410, 190, 30, 130);
            ctx.fillStyle = '#388E3C';
            ctx.beginPath();
            ctx.arc(425, 165, 50, 0, Math.PI * 2);
            ctx.fill();
            
            // Tree 2 details
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.arc(400, 150, 22, 0, Math.PI * 2);
            ctx.arc(450, 145, 24, 0, Math.PI * 2);
            ctx.arc(425, 130, 26, 0, Math.PI * 2);
            ctx.fill();
            
            // Tree shadows
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.beginPath();
            ctx.arc(110, 145, 55, 0, Math.PI * 2);
            ctx.arc(430, 170, 50, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Enhanced game rendering
        function drawEnhancedCatchBackground() {
            ctx.drawImage(catchBackgroundCanvas, 0, 0);
        }
        
        function drawEnhancedPooh() {
            const poohSprite = enhancedSpriteCache.renderPooh();
            const poohY = gameState.poohY - gameState.poohHeight;
            
            // Draw Pooh with invincibility effect
            ctx.save();
            
            if (gameState.isInvincible) {
                // Blinking effect for invincibility
                const blink = Math.sin(Date.now() / 100) > 0;
                if (blink) {
                    ctx.globalAlpha = 0.5;
                }
            }
            
            // Draw Pooh shadow
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 5;
            ctx.globalAlpha = 0.3;
            ctx.drawImage(poohSprite, gameState.poohX - gameState.poohWidth/2, poohY + 5, gameState.poohWidth, gameState.poohHeight);
            ctx.restore();
            
            // Draw Pooh
            ctx.drawImage(poohSprite, gameState.poohX - gameState.poohWidth/2, poohY, gameState.poohWidth, gameState.poohHeight);
            
            // Draw invincibility shield
            if (gameState.isInvincible) {
                ctx.strokeStyle = `rgba(66, 133, 244, ${0.5 + Math.sin(Date.now() / 200) * 0.3})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(gameState.poohX, poohY + gameState.poohHeight/2, gameState.poohWidth/2 + 5, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.restore();
            
            // Draw power-up indicators
            drawPowerUpIndicators();
        }
        
        function drawPowerUpIndicators() {
            const indicatorY = 40;
            let indicatorX = 20;
            
            // Invincibility
            if (gameState.isInvincible) {
                const timeLeft = Math.ceil((gameState.invincibilityEnd - Date.now()) / 1000);
                if (timeLeft > 0) {
                    drawPowerUpIndicator(indicatorX, indicatorY, 'shield', timeLeft);
                    indicatorX += 40;
                }
            }
            
            // Double points
            if (gameState.doublePoints) {
                const timeLeft = Math.ceil((gameState.doublePointsEnd - Date.now()) / 1000);
                if (timeLeft > 0) {
                    drawPowerUpIndicator(indicatorX, indicatorY, 'star', timeLeft);
                    indicatorX += 40;
                }
            }
            
            // Slow motion
            if (gameState.slowMotion) {
                const timeLeft = Math.ceil((gameState.slowMotionEnd - Date.now()) / 1000);
                if (timeLeft > 0) {
                    drawPowerUpIndicator(indicatorX, indicatorY, 'lightning', timeLeft);
                }
            }
        }
        
        function drawPowerUpIndicator(x, y, type, timeLeft) {
            const powerUp = powerUpTypes[type];
            if (!powerUp) return;
            
            ctx.save();
            
            // Background
            ctx.fillStyle = powerUp.color + '33';
            ctx.beginPath();
            ctx.arc(x + 15, y + 15, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Border
            ctx.strokeStyle = powerUp.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + 15, y + 15, 14, 0, Math.PI * 2);
            ctx.stroke();
            
            // Icon
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(powerUp.icon, x + 15, y + 15);
            
            // Time
            ctx.font = '10px Arial';
            ctx.fillStyle = '#000';
            ctx.fillText(timeLeft + 's', x + 15, y + 35);
            
            ctx.restore();
        }
        
        function drawEnhancedHoneyPots() {
            honeyPotPool.updateAll(0, (pot) => {
                if (!pot.active) return;
                
                const sprite = enhancedSpriteCache.renderHoneyPot(pot.type);
                ctx.drawImage(sprite, pot.x - 16, pot.y - 16);
                
                // Trail effect for golden pots
                if (pot.type === 'golden') {
                    ctx.save();
                    ctx.globalAlpha = 0.3;
                    ctx.drawImage(sprite, pot.x - 16, pot.y - 14);
                    ctx.restore();
                }
            });
        }
        
        function drawEnhancedBees() {
            beePool.updateAll(0, (bee) => {
                if (!bee.active) return;
                
                const sprite = enhancedSpriteCache.renderBee();
                ctx.save();
                
                // Wobble animation
                const wobble = Math.sin(Date.now() / 100 + bee.x) * 3;
                ctx.translate(bee.x, bee.y + wobble);
                
                // Rotation based on movement
                if (bee.vx && bee.vy) {
                    const angle = Math.atan2(bee.vy, bee.vx);
                    ctx.rotate(angle);
                }
                
                ctx.drawImage(sprite, -15, -15);
                ctx.restore();
                
                // Angry bee effect
                if (bee.type === 'angry') {
                    ctx.fillStyle = '#FF0000';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('💢', bee.x, bee.y - 20);
                }
            });
        }
        
        function drawEnhancedPowerUps() {
            powerUpPool.updateAll(0, (powerUp) => {
                if (!powerUp.active) return;
                
                const sprite = enhancedSpriteCache.renderPowerUp(powerUp.type);
                ctx.save();
                
                // Floating animation
                const float = Math.sin(Date.now() / 500 + powerUp.x) * 5;
                ctx.drawImage(sprite, powerUp.x - 15, powerUp.y - 15 + float);
                
                // Glow effect
                ctx.shadowColor = powerUpTypes[powerUp.type].color;
                ctx.shadowBlur = 15;
                ctx.drawImage(sprite, powerUp.x - 15, powerUp.y - 15 + float);
                
                ctx.restore();
            });
        }
        
        function drawEnhancedEffects() {
            gameState.effects.forEach((effect, index) => {
                switch(effect.type) {
                    case 'catch':
                        const radius = 20 * (1 - (Date.now() - effect.start) / effect.duration);
                        const gradient = ctx.createRadialGradient(
                            effect.x, effect.y, 0,
                            effect.x, effect.y, radius
                        );
                        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
                        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                        
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                        
                    case 'damage':
                        const damageRadius = 15 * (1 - (Date.now() - effect.start) / effect.duration);
                        const damageGradient = ctx.createRadialGradient(
                            effect.x, effect.y, 0,
                            effect.x, effect.y, damageRadius
                        );
                        damageGradient.addColorStop(0, 'rgba(255, 107, 107, 0.8)');
                        damageGradient.addColorStop(1, 'rgba(255, 107, 107, 0)');
                        
                        ctx.fillStyle = damageGradient;
                        ctx.beginPath();
                        ctx.arc(effect.x, effect.y, damageRadius, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                        
                    case 'score':
                        ctx.save();
                        ctx.font = 'bold 20px Arial';
                        ctx.fillStyle = '#FFD700';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        
                        const progress = (Date.now() - effect.start) / effect.duration;
                        const y = effect.y - progress * 30;
                        const alpha = 1 - progress;
                        
                        ctx.globalAlpha = alpha;
                        ctx.fillText(effect.text, effect.x, y);
                        ctx.restore();
                        break;
                }
            });
        }
        
        function drawEnhancedCatchUI() {
            // Score with shadow
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 2;
            
            ctx.fillStyle = '#4E342E';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`Score: ${gameState.score}`, 20, 30);
            
            ctx.fillText(`Time: ${gameState.timeLeft}s`, canvas.width - 150, 30);
            ctx.fillText(`Lives: ${gameState.lives}`, canvas.width / 2 - 50, 30);
            
            ctx.restore();
            
            // Combo display
            if (gameState.combos > 1) {
                ctx.save();
                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = '#FFD700';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Glow effect
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 20;
                
                const comboText = `${gameState.combos} Combo!`;
                ctx.fillText(comboText, canvas.width / 2, 70);
                
                // Multiplier
                ctx.font = 'bold 18px Arial';
                ctx.fillText(`x${gameState.multiplier} Multiplier`, canvas.width / 2, 100);
                
                ctx.restore();
            }
            
            // Streak indicator
            if (gameState.streak > 3) {
                ctx.save();
                ctx.font = 'bold 16px Arial';
                ctx.fillStyle = '#4CAF50';
                ctx.textAlign = 'center';
                ctx.fillText(`🔥 ${gameState.streak} Catch Streak!`, canvas.width / 2, canvas.height - 20);
                ctx.restore();
            }
        }
        
        // Enhanced game logic
        function updateEnhancedCatchGame(delta) {
            if (!gameState.gameRunning) return;
            
            const deltaTime = delta / 16;
            const now = Date.now();
            
            // Update power-up timers
            if (gameState.isInvincible && now > gameState.invincibilityEnd) {
                gameState.isInvincible = false;
            }
            
            if (gameState.doublePoints && now > gameState.doublePointsEnd) {
                gameState.doublePoints = false;
            }
            
            if (gameState.slowMotion && now > gameState.slowMotionEnd) {
                gameState.slowMotion = false;
            }
            
            // Update combo timer
            if (gameState.combos > 0 && now - gameState.lastCatchTime > 2000) {
                gameState.combos = 0;
                gameState.multiplier = 1;
                gameState.streak = 0;
            }
            
            // Update effects
            for (let i = gameState.effects.length - 1; i >= 0; i--) {
                const effect = gameState.effects[i];
                if (now - effect.start > effect.duration) {
                    gameState.effects.splice(i, 1);
                }
            }
            
            // Update honey pots
            honeyPotPool.updateAll(delta, (pot, idx) => {
                const speed = gameState.slowMotion ? pot.speed * 0.5 : pot.speed;
                pot.y += speed * deltaTime;
                
                // Check collision with Pooh
                if (pot.y > gameState.poohY - gameState.poohHeight && 
                    pot.x > gameState.poohX - gameState.poohWidth/2 && 
                    pot.x < gameState.poohX + gameState.poohWidth/2) {
                    
                    // Calculate score
                    let points = pot.type === 'golden' ? 50 : 10;
                    if (gameState.doublePoints) points *= 2;
                    points *= gameState.multiplier;
                    
                    gameState.score += points;
                    
                    // Update combo
                    const now = Date.now();
                    if (now - gameState.lastCatchTime < 2000) {
                        gameState.combos++;
                        gameState.streak++;
                        gameState.multiplier = Math.min(5, 1 + gameState.combos * 0.1);
                    } else {
                        gameState.combos = 1;
                        gameState.streak = 1;
                        gameState.multiplier = 1.1;
                    }
                    gameState.lastCatchTime = now;
                    
                    // Deactivate pot
                    pot.active = false;
                    
                    // Create catch effect
                    createCatchEffect(pot.x, pot.y, points);
                    
                    // Play sound
                    if (window.audioManager) {
                        window.audioManager.playGameSound('collect');
                        
                        // Play combo sound for high combos
                        if (gameState.combos > 3) {
                            window.audioManager.playTone([523, 659, 784], 0.15);
                        }
                    }
                    
                    syncEnhancedCatchStats();
                    return;
                }
                
                // Remove if off screen
                if (pot.y > canvas.height + 20) {
                    pot.active = false;
                    // Break streak if pot is missed
                    if (gameState.streak > 0) {
                        gameState.streak = 0;
                        createMissEffect(pot.x, pot.y);
                    }
                }
            });
            
            // Update bees
            beePool.updateAll(delta, (bee, idx) => {
                const speed = gameState.slowMotion ? bee.speed * 0.5 : bee.speed;
                bee.y += speed * deltaTime;
                
                // Update velocity for movement pattern
                if (bee.type === 'angry') {
                    // Angry bees chase Pooh
                    const dx = gameState.poohX - bee.x;
                    const dy = (gameState.poohY - gameState.poohHeight/2) - bee.y;
                    const dist = Math.hypot(dx, dy);
                    
                    if (dist > 0) {
                        const chaseSpeed = 0.05;
                        bee.vx = (dx / dist) * chaseSpeed * deltaTime;
                        bee.vy = (dy / dist) * chaseSpeed * deltaTime;
                        bee.x += bee.vx;
                        bee.y += bee.vy;
                    }
                }
                
                // Check collision with Pooh
                if (!gameState.isInvincible && 
                    bee.y > gameState.poohY - gameState.poohHeight && 
                    bee.x > gameState.poohX - gameState.poohWidth/2 && 
                    bee.x < gameState.poohX + gameState.poohWidth/2) {
                    
                    gameState.lives -= bee.type === 'angry' ? 2 : 1;
                    bee.active = false;
                    
                    // Create damage effect
                    createDamageEffect(bee.x, bee.y);
                    
                    // Reset combo
                    gameState.combos = 0;
                    gameState.multiplier = 1;
                    gameState.streak = 0;
                    
                    syncEnhancedCatchStats();
                    setEnhancedCatchOverlay('Ouch! A bee buzzed Pooh.', `Hearts remaining: ${gameState.lives}.`, false, 1400);
                    shakeElement(catchCard);
                    
                    // Play sound
                    if (window.audioManager) {
                        window.audioManager.playGameSound('damage');
                    }
                    
                    if (gameState.lives <= 0) {
                        endEnhancedGame(false);
                    }
                    return;
                }
                
                if (bee.y > canvas.height + 20) {
                    bee.active = false;
                }
            });
            
            // Update power-ups
            powerUpPool.updateAll(delta, (powerUp, idx) => {
                const speed = gameState.slowMotion ? powerUp.speed * 0.5 : powerUp.speed;
                powerUp.y += speed * deltaTime;
                
                // Check collision with Pooh
                if (powerUp.y > gameState.poohY - gameState.poohHeight && 
                    powerUp.x > gameState.poohX - gameState.poohWidth/2 && 
                    powerUp.x < gameState.poohX + gameState.poohWidth/2) {
                    
                    // Apply power-up effect
                    applyPowerUp(powerUp.type);
                    powerUp.active = false;
                    
                    // Create collect effect
                    createPowerUpEffect(powerUp.x, powerUp.y, powerUp.type);
                    
                    // Play sound
                    if (window.audioManager) {
                        window.audioManager.playGameSound('powerup');
                    }
                    return;
                }
                
                if (powerUp.y > canvas.height + 20) {
                    powerUp.active = false;
                }
            });
            
            // Spawning logic
            if (honeyPotPool.active < 10 && Math.random() < 0.04) {
                const types = ['normal', 'normal', 'normal', 'golden']; // 25% chance for golden
                const type = types[Math.floor(Math.random() * types.length)];
                
                honeyPotPool.get(
                    Math.random() * (canvas.width - 40) + 20,
                    -20,
                    2 + Math.random() * 1.5,
                    type
                );
            }
            
            if (beePool.active < 6 && Math.random() < 0.02) {
                const types = gameState.wave > 3 ? ['normal', 'angry'] : ['normal'];
                const type = types[Math.floor(Math.random() * types.length)];
                
                beePool.get(
                    Math.random() * (canvas.width - 40) + 20,
                    -20,
                    3 + Math.random() * 1.5,
                    type
                );
            }
            
            // Spawn power-ups occasionally
            if (powerUpPool.active < 3 && Math.random() < 0.01) {
                const types = Object.keys(powerUpTypes);
                const type = types[Math.floor(Math.random() * types.length)];
                
                powerUpPool.get(
                    Math.random() * (canvas.width - 40) + 20,
                    -20,
                    2 + Math.random() * 1,
                    type
                );
            }
            
            // Update particle system
            catchParticles.update(delta);
        }
        
        // Effect creation functions
        function createCatchEffect(x, y, points) {
            // Ring effect
            gameState.effects.push({
                type: 'catch',
                x, y,
                start: Date.now(),
                duration: 500
            });
            
            // Score popup
            gameState.effects.push({
                type: 'score',
                x, y: y - 20,
                text: `+${points}`,
                start: Date.now(),
                duration: 1000
            });
            
            // Particles
            for (let i = 0; i < 8; i++) {
                catchParticles.createParticle(
                    x, y,
                    'honey',
                    {
                        x: (Math.random() - 0.5) * 4,
                        y: (Math.random() - 0.5) * 4 - 2
                    }
                );
            }
        }
        
        function createDamageEffect(x, y) {
            gameState.effects.push({
                type: 'damage',
                x, y,
                start: Date.now(),
                duration: 500
            });
            
            // Blood particles (red)
            for (let i = 0; i < 6; i++) {
                catchParticles.createParticle(
                    x, y,
                    'fire',
                    {
                        x: (Math.random() - 0.5) * 4,
                        y: (Math.random() - 0.5) * 4
                    }
                );
            }
        }
        
        function createMissEffect(x, y) {
            gameState.effects.push({
                type: 'score',
                x, y: y - 20,
                text: 'Miss!',
                start: Date.now(),
                duration: 800
            });
        }
        
        function createPowerUpEffect(x, y, type) {
            const powerUp = powerUpTypes[type];
            
            // Ring effect in power-up color
            const ring = document.createElement('div');
            ring.style.cssText = `
                position: absolute;
                left: ${x - 25}px;
                top: ${y - 25}px;
                width: 50px;
                height: 50px;
                border: 3px solid ${powerUp.color};
                border-radius: 50%;
                animation: rippleEffect 0.6s ease-out;
                pointer-events: none;
                z-index: 5;
            `;
            
            canvas.parentElement.appendChild(ring);
            setTimeout(() => ring.remove(), 600);
            
            // Particles in power-up color
            for (let i = 0; i < 12; i++) {
                catchParticles.createParticle(
                    x, y,
                    'sparkle',
                    {
                        x: (Math.random() - 0.5) * 6,
                        y: (Math.random() - 0.5) * 6 - 2
                    }
                );
            }
            
            // Power-up text
            gameState.effects.push({
                type: 'score',
                x, y: y - 30,
                text: powerUp.icon + ' ' + type.charAt(0).toUpperCase() + type.slice(1),
                start: Date.now(),
                duration: 1000
            });
        }
        
        function applyPowerUp(type) {
            const now = Date.now();
            
            switch(type) {
                case 'heart':
                    gameState.lives = Math.min(5, gameState.lives + 1);
                    syncEnhancedCatchStats();
                    break;
                    
                case 'shield':
                    gameState.isInvincible = true;
                    gameState.invincibilityEnd = now + powerUpTypes.shield.duration;
                    break;
                    
                case 'clock':
                    gameState.timeLeft += 10;
                    syncEnhancedCatchStats();
                    break;
                    
                case 'star':
                    gameState.doublePoints = true;
                    gameState.doublePointsEnd = now + powerUpTypes.star.duration;
                    break;
                    
                case 'lightning':
                    gameState.slowMotion = true;
                    gameState.slowMotionEnd = now + powerUpTypes.lightning.duration;
                    break;
            }
        }
        
        // Enhanced game loop
        let catchAnimationFrameId = null;
        
        function enhancedCatchGameLoop(timestamp) {
            if (frameLimiter.shouldRender(timestamp)) {
                const delta = timestamp - gameState.lastFrameTime;
                gameState.lastFrameTime = timestamp;
                
                const cappedDelta = Math.min(delta, 100);
                
                if (gameState.gameRunning) {
                    updateEnhancedCatchGame(cappedDelta);
                }
                renderEnhancedCatchGame();
            }
            
            catchAnimationFrameId = requestAnimationFrame(enhancedCatchGameLoop);
        }
        
        function renderEnhancedCatchGame() {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw everything
            drawEnhancedCatchBackground();
            drawEnhancedEffects();
            drawEnhancedPooh();
            drawEnhancedHoneyPots();
            drawEnhancedBees();
            drawEnhancedPowerUps();
            catchParticles.render();
            drawEnhancedCatchUI();
        }
        
        // Start the game loop
        catchAnimationFrameId = requestAnimationFrame(enhancedCatchGameLoop);
        
        // Initialize background
        drawEnhancedCatchBackground();
        
        // Game control functions
        function startEnhancedGame() {
            if (gameState.gameRunning || gameState.countdownInterval) return;
            
            // Reset game state
            gameState.score = 0;
            gameState.lives = 3;
            gameState.timeLeft = 60;
            gameState.combos = 0;
            gameState.multiplier = 1;
            gameState.streak = 0;
            gameState.poohX = canvas.width / 2;
            
            // Reset pools
            honeyPotPool.reset();
            beePool.reset();
            powerUpPool.reset();
            catchParticles.clear();
            gameState.effects = [];
            
            syncEnhancedCatchStats();
            
            // Countdown
            let count = 3;
            setEnhancedCatchOverlay('Starting in 3...', 'Get Pooh ready to move.', true);
            
            gameState.countdownInterval = setInterval(() => {
                count--;
                if (count > 0) {
                    setEnhancedCatchOverlay(`Starting in ${count}...`, 'Catch honey, dodge bees.', true);
                    
                    // Countdown sound
                    if (window.audioManager) {
                        window.audioManager.playTone([440, 440, 440], 0.1);
                    }
                } else {
                    clearInterval(gameState.countdownInterval);
                    gameState.countdownInterval = null;
                    setEnhancedCatchOverlay('Go!', 'Keep Pooh under the falling honey.', false, 900);
                    gameState.gameRunning = true;
                    
                    // Start timer
                    clearInterval(gameState.timerInterval);
                    gameState.timerInterval = setInterval(() => {
                        gameState.timeLeft--;
                        syncEnhancedCatchStats();
                        if (gameState.timeLeft <= 0) {
                            endEnhancedGame(true);
                        }
                        
                        // Speed up game every 15 seconds
                        if (gameState.timeLeft % 15 === 0 && gameState.timeLeft < 60) {
                            // Increase difficulty
                            setEnhancedCatchOverlay('Getting faster!', 'Stay focused!', false, 1200);
                        }
                    }, 1000);
                    
                    // Play start sound
                    if (window.audioManager) {
                        window.audioManager.playTone([523, 659, 784], 0.2);
                    }
                }
            }, 800);
        }
        
        function endEnhancedGame(timeExpired) {
            if (!gameState.gameRunning) return;
            
            gameState.gameRunning = false;
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = null;
            
            // Calculate final score with bonuses
            let finalScore = gameState.score;
            let bonus = 0;
            
            if (gameState.lives === 3) bonus += 100;
            if (gameState.combos > 10) bonus += 50;
            if (gameState.streak > 15) bonus += 75;
            
            finalScore += bonus;
            
            setEnhancedCatchOverlay(
                timeExpired ? "Time's up!" : 'Ouch! The bees won this round.',
                `Final Score: ${finalScore}${bonus > 0 ? ` (+${bonus} bonus)` : ''}`,
                true
            );
            
            shakeElement(catchCard);
            
            // Create game over effect
            createCatchGameOverEffect(finalScore, bonus);
            
            // Play sound
            if (window.audioManager) {
                if (timeExpired) {
                    window.audioManager.playGameSound('victory');
                } else {
                    window.audioManager.playGameSound('defeat');
                }
            }
        }
        
        function createCatchGameOverEffect(finalScore, bonus) {
            // Create game over screen
            setTimeout(() => {
                const gameOverScreen = document.createElement('div');
                gameOverScreen.className = 'catch-game-over';
                gameOverScreen.innerHTML = `
                    <div class="catch-game-over-content">
                        <div class="catch-game-over-title">Game Over</div>
                        <div class="catch-game-over-stats">
                            <div class="catch-stat">
                                <div class="catch-stat-label">Final Score</div>
                                <div class="catch-stat-value">${finalScore}</div>
                            </div>
                            <div class="catch-stat">
                                <div class="catch-stat-label">Highest Combo</div>
                                <div class="catch-stat-value">${gameState.combos}</div>
                            </div>
                            <div class="catch-stat">
                                <div class="catch-stat-label">Longest Streak</div>
                                <div class="catch-stat-value">${gameState.streak}</div>
                            </div>
                            ${bonus > 0 ? `
                            <div class="catch-stat bonus">
                                <div class="catch-stat-label">Bonus</div>
                                <div class="catch-stat-value">+${bonus}</div>
                            </div>
                            ` : ''}
                        </div>
                        <div class="catch-game-over-actions">
                            <button class="catch-game-over-btn restart" onclick="restartEnhancedCatchGame()">
                                <i class="fas fa-redo"></i> Play Again
                            </button>
                            <button class="catch-game-over-btn menu" onclick="returnToCatchGameMenu()">
                                <i class="fas fa-home"></i> Main Menu
                            </button>
                        </div>
                    </div>
                `;
                
                canvas.parentElement.appendChild(gameOverScreen);
                
                // Animate in
                setTimeout(() => {
                    gameOverScreen.style.opacity = '1';
                    gameOverScreen.style.transform = 'translateY(0)';
                }, 10);
            }, 1000);
        }
        
        function toggleEnhancedPause() {
            if (!gameState.gameRunning && gameState.timeLeft > 0 && gameState.lives > 0) {
                // Resume
                gameState.gameRunning = true;
                if (!gameState.timerInterval) {
                    gameState.timerInterval = setInterval(() => {
                        gameState.timeLeft--;
                        syncEnhancedCatchStats();
                        if (gameState.timeLeft <= 0) {
                            endEnhancedGame(true);
                        }
                    }, 1000);
                }
                if (catchOverlay) catchOverlay.classList.remove('active');
                
                if (pauseBtn) {
                    pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                }
                
            } else if (gameState.gameRunning) {
                // Pause
                gameState.gameRunning = false;
                clearInterval(gameState.timerInterval);
                gameState.timerInterval = null;
                setEnhancedCatchOverlay('Paused', 'Tap start or pause to continue when ready.', true);
                
                if (pauseBtn) {
                    pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                }
            }
            
            // Play sound
            if (window.audioManager) {
                window.audioManager.playSound('click');
            }
        }
        
        // Event listeners
        if (startBtn) {
            startBtn.addEventListener('click', startEnhancedGame);
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', toggleEnhancedPause);
        }
        
        // Enhanced controls
        let touchStartX = 0;
        
        // Keyboard controls
        document.addEventListener('keydown', (ev) => {
            if (!gameState.gameRunning) return;
            
            const step = 25;
            switch(ev.key) {
                case 'ArrowLeft':
                    gameState.poohX = Math.max(gameState.poohWidth/2, gameState.poohX - step);
                    break;
                case 'ArrowRight':
                    gameState.poohX = Math.min(canvas.width - gameState.poohWidth/2, gameState.poohX + step);
                    break;
                case ' ':
                    // Quick dash ability
                    createDashEffect();
                    break;
            }
        });
        
        function createDashEffect() {
            // Dash particles
            for (let i = 0; i < 10; i++) {
                catchParticles.createParticle(
                    gameState.poohX, gameState.poohY,
                    'sparkle',
                    {
                        x: (Math.random() - 0.5) * 8,
                        y: (Math.random() - 0.5) * 8 - 4
                    }
                );
            }
        }
        
        // Mouse controls
        canvas.addEventListener('mousemove', (ev) => {
            if (!gameState.gameRunning) return;
            const rect = canvas.getBoundingClientRect();
            gameState.poohX = ev.clientX - rect.left;
            gameState.poohX = Math.max(gameState.poohWidth/2, Math.min(canvas.width - gameState.poohWidth/2, gameState.poohX));
        });
        
        // Touch controls
        canvas.addEventListener('touchstart', (ev) => {
            if (!gameState.gameRunning) return;
            ev.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = ev.touches[0];
            touchStartX = touch.clientX - rect.left;
            gameState.poohX = touchStartX;
        });
        
        canvas.addEventListener('touchmove', (ev) => {
            if (!gameState.gameRunning) return;
            ev.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = ev.touches[0];
            gameState.poohX = touch.clientX - rect.left;
            gameState.poohX = Math.max(gameState.poohWidth/2, Math.min(canvas.width - gameState.poohWidth/2, gameState.poohX));
        });
        
        // Virtual joystick for mobile
        if (isMobileDevice()) {
            createVirtualJoystick();
        }
        
        function createVirtualJoystick() {
            const joystick = document.createElement('div');
            joystick.className = 'virtual-joystick';
            joystick.innerHTML = `
                <div class="joystick-base"></div>
                <div class="joystick-handle"></div>
            `;
            
            canvas.parentElement.appendChild(joystick);
            
            let isDragging = false;
            
            joystick.addEventListener('touchstart', (ev) => {
                ev.preventDefault();
                isDragging = true;
                joystick.classList.add('active');
            });
            
            document.addEventListener('touchmove', (ev) => {
                if (!isDragging || !gameState.gameRunning) return;
                ev.preventDefault();
                
                const rect = joystick.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const touch = ev.touches[0];
                
                const dx = touch.clientX - centerX;
                const dy = touch.clientY - centerY;
                const distance = Math.hypot(dx, dy);
                const maxDistance = 40;
                
                // Calculate movement
                if (distance > maxDistance) {
                    const angle = Math.atan2(dy, dx);
                    const moveX = Math.cos(angle) * maxDistance;
                    const moveY = Math.sin(angle) * maxDistance;
                    
                    // Update Pooh position based on joystick
                    const speed = 15;
                    gameState.poohX += (moveX / maxDistance) * speed;
                    gameState.poohX = Math.max(gameState.poohWidth/2, Math.min(canvas.width - gameState.poohWidth/2, gameState.poohX));
                }
            });
            
            document.addEventListener('touchend', () => {
                isDragging = false;
                joystick.classList.remove('active');
            });
        }
        
        // Global functions
        window.restartEnhancedCatchGame = function() {
            // Remove game over screen
            const gameOverScreen = document.querySelector('.catch-game-over');
            if (gameOverScreen) {
                gameOverScreen.remove();
            }
            
            // Start new game
            startEnhancedGame();
        };
        
        window.returnToCatchGameMenu = function() {
            // Remove game over screen
            const gameOverScreen = document.querySelector('.catch-game-over');
            if (gameOverScreen) {
                gameOverScreen.remove();
            }
            
            // Reset to initial state
            gameState.gameRunning = false;
            clearInterval(gameState.timerInterval);
            clearInterval(gameState.countdownInterval);
            
            gameState.score = 0;
            gameState.lives = 3;
            gameState.timeLeft = 60;
            gameState.combos = 0;
            gameState.multiplier = 1;
            gameState.streak = 0;
            gameState.poohX = canvas.width / 2;
            
            honeyPotPool.reset();
            beePool.reset();
            powerUpPool.reset();
            catchParticles.clear();
            gameState.effects = [];
            
            syncEnhancedCatchStats();
            setEnhancedCatchOverlay('Ready when you are.', 'Press start to begin a calm 60 second run.', true);
            
            if (pauseBtn) {
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            }
        };
        
        // Clean up
        window.addEventListener('beforeunload', () => {
            if (catchAnimationFrameId) {
                cancelAnimationFrame(catchAnimationFrameId);
            }
            if (gameState.timerInterval) {
                clearInterval(gameState.timerInterval);
            }
            if (gameState.countdownInterval) {
                clearInterval(gameState.countdownInterval);
            }
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
                box-shadow:
                    0 10px 30px rgba(0,0,0,0.1),
                    inset 0 1px 0 rgba(255,255,255,0.5);
                border: 3px solid;
                transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
                transform-style: preserve-3d;
                position: relative;
                backdrop-filter: blur(10px);
                will-change: transform, box-shadow;
                transform: translateZ(0);
                backface-visibility: hidden;
            }
            
            .character-card-header-enhanced {
                padding: 2rem;
                text-align: center;
                position: relative;
                min-height: 220px;
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
            
            .character-stats-overlay {
                position: absolute;
                bottom: -10px;
                left: 0;
                right: 0;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px);
                padding: 0.75rem;
                border-radius: 15px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                transform: translateY(100%);
                opacity: 0;
                transition: all 0.3s ease;
            }
            
            .character-card:hover .character-stats-overlay {
                transform: translateY(0);
                opacity: 1;
            }
            
            .stats-container {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 0.5rem;
            }
            
            .stat-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .stat-name {
                font-size: 0.7rem;
                color: #666;
                min-width: 60px;
            }
            
            .stat-bar {
                flex: 1;
                height: 6px;
                background: #eee;
                border-radius: 3px;
                overflow: hidden;
            }
            
            .stat-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--character-color), #FFD700);
                border-radius: 3px;
                transition: width 0.5s ease;
            }
            
            .stat-value {
                font-size: 0.7rem;
                font-weight: bold;
                color: #333;
                min-width: 30px;
                text-align: right;
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
            
            .character-responsibilities-enhanced {
                display: flex;
                flex-wrap: wrap;
                gap: 0.75rem;
                margin-top: 1.5rem;
            }
            
            .responsibility-tag-enhanced {
                padding: 0.5rem 1rem;
                border-radius: 25px;
                font-size: 0.85rem;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
            }
            
            .responsibility-tag-enhanced:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            
            .character-card-footer-enhanced {
                padding: 1.5rem;
                background: linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.05));
                border-top: 1px solid rgba(0,0,0,0.1);
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0.75rem;
            }
            
            .btn-character-info-enhanced,
            .btn-character-voice-enhanced,
            .btn-character-stats-enhanced {
                padding: 0.75rem 1rem;
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
            }
            
            .btn-character-info-enhanced {
                background: linear-gradient(135deg, var(--character-color), #FF8C42);
                color: white;
                box-shadow: 0 5px 15px rgba(var(--glow-color), 0.3);
            }
            
            .btn-character-info-enhanced:hover {
                transform: translateY(-3px) scale(1.05);
                box-shadow: 0 10px 25px rgba(var(--glow-color), 0.4);
            }
            
            .btn-character-voice-enhanced {
                background: transparent;
                border: 2px solid;
                color: var(--character-color);
            }
            
            .btn-character-voice-enhanced:hover {
                background: var(--character-bg);
                transform: translateY(-2px);
            }
            
            .btn-character-stats-enhanced {
                background: var(--character-bg);
                color: var(--character-color);
            }
            
            .btn-character-stats-enhanced:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
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
            
            .characters-intro-enhanced::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, transparent 30%, rgba(255,255,255,0.1) 70%);
                animation: rotate 20s linear infinite;
            }
            
            @keyframes rotate {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
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
            
            /* Enhanced Tutorial */
            .characters-tutorial-enhanced {
                background: linear-gradient(135deg, #FFD700, #FF8C42);
                color: #333;
                padding: 1rem 2rem;
                border-radius: 15px;
                margin: 2rem auto;
                max-width: 500px;
                box-shadow: 0 10px 30px rgba(255, 140, 66, 0.3);
                animation: pulseGlow 2s infinite;
                position: relative;
                overflow: hidden;
            }
            
            .characters-tutorial-enhanced::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #FFD700, #FF8C42, #FFD700);
                animation: slide 2s linear infinite;
            }
            
            @keyframes slide {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            .tutorial-content-enhanced {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .tutorial-progress {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .progress-bar {
                flex: 1;
                height: 6px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 3px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: #333;
                border-radius: 3px;
                width: 0%;
                transition: width 1s ease;
            }
            
            .tutorial-text {
                font-size: 0.9rem;
                font-weight: 600;
            }
            
            .tutorial-close {
                background: none;
                border: none;
                color: #333;
                cursor: pointer;
                font-size: 1.2rem;
                padding: 0.5rem;
                border-radius: 50%;
                transition: all 0.2s ease;
            }
            
            .tutorial-close:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: rotate(90deg);
            }
            
            /* Enhanced Modal */
            .modal-overlay-enhanced {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }
            
            .modal-overlay-enhanced.active {
                opacity: 1;
                visibility: visible;
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
                box-shadow: 
                    0 25px 50px rgba(0,0,0,0.3),
                    0 0 0 1px rgba(255,255,255,0.1);
                border: 2px solid var(--modal-color);
            }
            
            .modal-overlay-enhanced.active .modal-content-enhanced {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
            
            .modal-close-enhanced {
                position: absolute;
                top: 20px;
                right: 20px;
                background: var(--modal-color);
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
                background: linear-gradient(135deg, var(--modal-bg-color), transparent);
                border-bottom: 2px solid var(--modal-color);
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
                box-shadow: 
                    0 15px 35px rgba(var(--modal-color, 255, 180, 71), 0.3),
                    inset 0 5px 15px rgba(255,255,255,0.5);
                border: 5px solid white;
            }
            
            .modal-header-text {
                margin-top: 1rem;
            }
            
            .modal-title {
                color: var(--modal-color);
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
                background: linear-gradient(90deg, transparent, var(--modal-bg-color) 20%);
                border-radius: 15px;
                border-left: 5px solid var(--modal-color);
            }
            
            .modal-quote {
                font-size: 1.1rem;
                font-style: italic;
                color: #555;
                line-height: 1.6;
                margin: 0;
                quotes: "\\201C""\\201D""\\2018""\\2019";
            }
            
            .modal-quote::before {
                content: open-quote;
                font-size: 2rem;
                color: var(--modal-color);
                line-height: 0;
                vertical-align: -0.4em;
                margin-right: 0.25em;
            }
            
            .modal-quote::after {
                content: close-quote;
                font-size: 2rem;
                color: var(--modal-color);
                line-height: 0;
                vertical-align: -0.4em;
                margin-left: 0.1em;
            }
            
            .modal-bio-section {
                margin-bottom: 2rem;
            }
            
            .modal-bio-section h3 {
                color: var(--modal-color);
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
                border-color: var(--modal-color);
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
                border-left: 4px solid var(--modal-color);
                margin: 0;
                line-height: 1.5;
            }
            
            .modal-responsibilities-enhanced {
                margin-top: 2.5rem;
            }
            
            .modal-responsibilities-enhanced h3 {
                color: var(--modal-color);
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
                border: 2px solid;
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
                background: var(--modal-color);
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
            
            .modal-stats-section,
            .modal-abilities-section {
                margin-top: 2.5rem;
            }
            
            .modal-stats-section h3,
            .modal-abilities-section h3 {
                color: var(--modal-color);
                font-size: 1.5rem;
                margin-bottom: 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .stats-radar-container {
                display: flex;
                justify-content: center;
                padding: 2rem;
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                border-radius: 15px;
            }
            
            .abilities-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
            }
            
            .ability-card {
                background: white;
                border-radius: 15px;
                padding: 1.5rem;
                border: 2px solid;
                transition: all 0.3s ease;
                display: flex;
                gap: 1rem;
                align-items: flex-start;
            }
            
            .ability-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 30px rgba(0,0,0,0.1);
            }
            
            .ability-icon {
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
            
            .ability-content h4 {
                color: var(--modal-color);
                margin-bottom: 0.5rem;
                font-size: 1.1rem;
            }
            
            .ability-content p {
                color: #666;
                margin: 0 0 0.5rem 0;
                font-size: 0.9rem;
                line-height: 1.5;
            }
            
            .ability-cooldown {
                color: #999;
                font-size: 0.8rem;
                display: flex;
                align-items: center;
                gap: 0.25rem;
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
                background: linear-gradient(135deg, var(--modal-color), #FF8C42);
                color: white;
                box-shadow: 0 5px 15px rgba(var(--modal-color, 255, 180, 71), 0.3);
            }
            
            .modal-action-btn.share-btn {
                background: transparent;
                border: 2px solid var(--modal-color);
                color: var(--modal-color);
            }
            
            .modal-action-btn.close-btn {
                background: #666;
                color: white;
            }
            
            .modal-action-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            }
            
            /* Voice Bubble */
            .voice-bubble {
                position: fixed;
                background: white;
                border-radius: 20px;
                padding: 1rem;
                box-shadow: 
                    0 10px 30px rgba(0,0,0,0.2),
                    0 0 0 1px rgba(0,0,0,0.1);
                z-index: 10001;
                max-width: 300px;
                animation: cardEnter3D 0.5s ease-out;
                border: 2px solid;
                border-color: var(--character-color, #FFB347);
            }
            
            .voice-bubble::before {
                content: '';
                position: absolute;
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                border-width: 10px 10px 0;
                border-style: solid;
                border-color: white transparent transparent;
            }
            
            .voice-bubble::after {
                content: '';
                position: absolute;
                bottom: -12px;
                left: 50%;
                transform: translateX(-50%);
                border-width: 12px 12px 0;
                border-style: solid;
                border-color: var(--character-color, #FFB347) transparent transparent;
            }
            
            .bubble-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }
            
            .bubble-character {
                font-weight: bold;
                color: var(--character-color, #FFB347);
                font-size: 0.9rem;
            }
            
            .bubble-close {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                font-size: 0.9rem;
                padding: 0.25rem;
                border-radius: 50%;
                transition: all 0.2s ease;
            }
            
            .bubble-close:hover {
                background: #f0f0f0;
                color: #666;
            }
            
            .bubble-text {
                color: #333;
                font-style: italic;
                line-height: 1.4;
                font-size: 0.9rem;
            }
            
            /* Game Over Screens */
            .game-over-screen,
            .catch-game-over {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 20;
            }
            
            .game-over-content,
            .catch-game-over-content {
                background: linear-gradient(135deg, #fff, #f8f9fa);
                border-radius: 25px;
                padding: 3rem;
                text-align: center;
                max-width: 500px;
                width: 90%;
                box-shadow: 
                    0 25px 50px rgba(0,0,0,0.3),
                    0 0 0 1px rgba(255,255,255,0.1);
                border: 3px solid #FFB347;
                transform: scale(0.9);
                opacity: 0;
                animation: gameOverEnter 0.5s ease-out forwards;
            }
            
            @keyframes gameOverEnter {
                to {
                    transform: scale(1);
                    opacity: 1;
                }
            }
            
            .game-over-title,
            .catch-game-over-title {
                color: #FFB347;
                font-size: 3rem;
                margin-bottom: 2rem;
                font-weight: 800;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            }
            
            .game-over-stats,
            .catch-game-over-stats {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1.5rem;
                margin: 2rem 0;
            }
            
            .stat,
            .catch-stat {
                background: white;
                padding: 1.5rem;
                border-radius: 15px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
            }
            
            .stat:hover,
            .catch-stat:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 30px rgba(0,0,0,0.15);
            }
            
            .stat.bonus,
            .catch-stat.bonus {
                background: linear-gradient(135deg, #FFD700, #FFB347);
                color: white;
                grid-column: span 2;
            }
            
            .stat-label,
            .catch-stat-label {
                color: #666;
                font-size: 0.9rem;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .stat-value,
            .catch-stat-value {
                color: #333;
                font-size: 2rem;
                font-weight: 800;
            }
            
            .stat.bonus .stat-label,
            .catch-stat.bonus .catch-stat-label {
                color: rgba(255, 255, 255, 0.9);
            }
            
            .stat.bonus .stat-value,
            .catch-stat.bonus .catch-stat-value {
                color: white;
            }
            
            .game-over-actions,
            .catch-game-over-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin-top: 2rem;
            }
            
            .game-over-btn,
            .catch-game-over-btn {
                padding: 1rem 2rem;
                border-radius: 25px;
                border: none;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1rem;
                text-transform: uppercase;
                letter-spacing: 1px;
                min-width: 180px;
                justify-content: center;
            }
            
            .game-over-btn.restart,
            .catch-game-over-btn.restart {
                background: linear-gradient(135deg, #4CAF50, #2E7D32);
                color: white;
                box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
            }
            
            .game-over-btn.menu,
            .catch-game-over-btn.menu {
                background: linear-gradient(135deg, #2196F3, #0D47A1);
                color: white;
                box-shadow: 0 5px 15px rgba(33, 150, 243, 0.3);
            }
            
            .game-over-btn:hover,
            .catch-game-over-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            }
            
            /* Virtual Joystick */
            .virtual-joystick {
                position: absolute;
                bottom: 30px;
                left: 30px;
                width: 120px;
                height: 120px;
                z-index: 10;
                display: none;
            }
            
            @media (max-width: 768px) {
                .virtual-joystick {
                    display: block;
                }
            }
            
            .joystick-base {
                position: absolute;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 50%;
                backdrop-filter: blur(10px);
                border: 2px solid rgba(255, 255, 255, 0.2);
            }
            
            .joystick-handle {
                position: absolute;
                width: 50px;
                height: 50px;
                background: rgba(255, 255, 255, 0.8);
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                border: 2px solid rgba(0, 0, 0, 0.2);
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                transition: transform 0.1s ease;
            }
            
            .virtual-joystick.active .joystick-handle {
                background: rgba(255, 255, 255, 1);
            }
            
            /* Music Hint */
            .music-hint {
                position: fixed;
                top: 70px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 0.75rem 1.5rem;
                border-radius: 25px;
                font-size: 0.9rem;
                z-index: 10000;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                animation: fadeInOut 3s ease-in-out;
                transform-origin: top right;
            }
            
            @keyframes fadeInOut {
                0%, 100% { 
                    opacity: 0; 
                    transform: translateY(-10px) scale(0.9); 
                }
                10%, 90% { 
                    opacity: 1; 
                    transform: translateY(0) scale(1); 
                }
            }
            
            .hint-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
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
                
                .character-card-footer-enhanced {
                    grid-template-columns: 1fr;
                }
                
                .modal-details-grid-enhanced,
                .responsibilities-grid,
                .abilities-grid {
                    grid-template-columns: 1fr;
                }
                
                .game-over-stats,
                .catch-game-over-stats {
                    grid-template-columns: 1fr;
                }
                
                .stat.bonus,
                .catch-stat.bonus {
                    grid-column: span 1;
                }
                
                .game-over-actions,
                .catch-game-over-actions {
                    flex-direction: column;
                }
                
                .game-over-btn,
                .catch-game-over-btn {
                    min-width: auto;
                    width: 100%;
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
                
                .modal-footer-enhanced {
                    flex-direction: column;
                }
                
                .modal-action-btn {
                    width: 100%;
                    justify-content: center;
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
            
            /* Touch Device Optimizations */
            @media (hover: none) and (pointer: coarse) {
                .character-card-enhanced:hover {
                    transform: none !important;
                    animation: none !important;
                }
                
                .character-card-enhanced:active {
                    transform: scale(0.98) !important;
                    transition: transform 0.1s ease !important;
                }
                
                .btn-character-info-enhanced:active,
                .btn-character-voice-enhanced:active,
                .btn-character-stats-enhanced:active {
                    transform: scale(0.95) !important;
                }
            }
        `;
        document.head.appendChild(style);
        console.log('Enhanced CSS injected');
    }

    // ============================================================================
    // BOOTSTRAP ENHANCED
    // ============================================================================

    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM loaded, initializing enhanced components...");
        
        // Initialize optimizations
        optimizeForDevice();
        
        // Load assets
        loadSprites();
        injectEnhancedKeyframes();
        injectEnhancedCSS();
        
        // Initialize systems
        window.audioManager = new EnhancedAudioManager();
        
        // Initialize UI components
        initEnhancedBaseUI();
        initEnhancedCharactersSection();
        initEnhancedCharacterModal();
        initEnhancedCharacterAnimations();
        
        // Initialize games
        initEnhancedDefenseGame();
        initEnhancedHoneyCatchGame();
        
        console.log("All enhanced components initialized!");
        
        // Performance monitoring (optional)
        if (window.DEBUG_MODE) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory) {
                    console.log(`Memory: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB used`);
                }
            }, 10000);
        }
    });

    // Error handling
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        
        // Show user-friendly error message
        if (!document.querySelector('.error-message')) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.innerHTML = `
                <div class="error-content">
                    <h3>Oops! Something went wrong</h3>
                    <p>Please refresh the page and try again.</p>
                    <button onclick="location.reload()">Refresh Page</button>
                </div>
            `;
            errorMsg.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                color: white;
                text-align: center;
            `;
            document.body.appendChild(errorMsg);
        }
    });

    // Offline handling
    window.addEventListener('offline', () => {
        console.log('App is offline');
        // Could show offline notification
    });

    window.addEventListener('online', () => {
        console.log('App is back online');
        // Could hide offline notification
    });

})();
