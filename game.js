// game.js — Honey Pot Catch (isolated)
// Owns ONLY the Honey Pot Catch game canvas + its HUD IDs.
// It must not control site-wide nav, cover, modals, or audio.
/* eslint-disable no-console */

'use strict';

(function(){

  // ---------------------------------------------------------------------------
  // Minimal performance helpers (portable)
  // ---------------------------------------------------------------------------
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

function isMobileDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const touchPoints = navigator.maxTouchPoints || 'ontouchstart' in window;
        
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || 
               (touchPoints && window.innerWidth <= 768);
    }

  // Defaults (script.js no longer sets these)
  const IS_MOBILE = isMobileDevice();
  window.MAX_PARTICLES = window.MAX_PARTICLES ?? (IS_MOBILE ? 60 : 180);
  window.GAME_FPS_TARGET = window.GAME_FPS_TARGET ?? (IS_MOBILE ? 30 : 60);

  // Lightweight DOM shake used by the game for hits/FX
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

  // ---------------------------------------------------------------------------
  // Honey Pot Catch — extracted from the enhanced build
  // ---------------------------------------------------------------------------
function initEnhancedHoneyCatchGame() {
  console.log("Initializing enhanced Honey Catch Game...");

  const canvas = document.getElementById('honey-game');
  if (!canvas) {
    console.error("Honey catch game canvas not found!");
    return;
  }

  const ctx = canvas.getContext('2d');

  /* ✅ REQUIRED: size drawing buffer to match CSS (fixes blank canvas on iOS) */
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    // Normalize coordinate system so 1 unit = 1 CSS pixel
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const frameLimiter = new FrameRateLimiter(window.GAME_FPS_TARGET);

  // Performance optimizations
  canvas.style.imageRendering = isMobileDevice() ? 'pixelated' : 'auto';
  ctx.imageSmoothingEnabled = !isMobileDevice();

  // ✅ Enhanced background canvas MUST be created AFTER resizeCanvas()
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

  // ---------------------------------------------------------------------------
  // Bootstrap only the Honey Catch game. No site UI here.
  // ---------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    try {
      initEnhancedHoneyCatchGame();
    } catch (err) {
      console.error('Honey Catch game failed to initialize:', err);
    }
  });

})();
