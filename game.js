// game.js - Consolidated Game Module for Hundred Acre Celebration
// Contains both games: Honey Hive Defense & Honey Pot Catch

'use strict';

// ============================================================================
// GAME CONSTANTS & SHARED UTILITIES
// ============================================================================

const GameConstants = {
    MOBILE_MAX_ENEMIES: 20,
    DESKTOP_MAX_ENEMIES: 30,
    MOBILE_FPS: 30,
    DESKTOP_FPS: 60,
    SPRITE_PATHS: {
        pooh: 'Images/Characters/honey-bear.png',
        piglet: 'Images/Characters/piglet.png',
        tigger: 'Images/Characters/tigger.png',
        eeyore: 'Images/Characters/eeyore.png',
        owl: 'Images/Characters/owl.png',
        roo: 'Images/Characters/roo.png',
        honey: 'Images/Characters/honey.png'
    }
};

// Performance optimization helpers
const GameUtils = {
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    createObjectPool(getFn, resetFn) {
        const pool = [];
        let active = 0;

        return {
            get(...args) {
                let obj;
                if (active < pool.length) {
                    obj = pool[active];
                    resetFn(obj);
                    getFn(obj, ...args);
                } else {
                    obj = {};
                    getFn(obj, ...args);
                    pool.push(obj);
                }
                obj.active = true;
                active++;
                return obj;
            },

            update(delta, updateFn) {
                for (let i = 0; i < active; i++) {
                    const obj = pool[i];
                    if (obj.active) {
                        const shouldKeep = updateFn(obj, delta, i);
                        if (!shouldKeep) {
                            obj.active = false;
                            // Move to inactive section
                            [pool[i], pool[active - 1]] = [pool[active - 1], pool[i]];
                            active--;
                            i--;
                        }
                    }
                }
            },

            reset() {
                active = 0;
                pool.forEach(obj => obj.active = false);
            },

            getActiveCount() { return active; }
        };
    }
};

// ============================================================================
// SPRITE MANAGER (Shared between games)
// ============================================================================

class SpriteManager {
    constructor() {
        this.sprites = new Map();
        this.loaded = false;
        this.loadCallbacks = [];
    }

    load() {
        const promises = Object.entries(GameConstants.SPRITE_PATHS).map(([key, path]) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = path;
                img.onload = () => {
                    this.sprites.set(key, img);
                    resolve(true);
                };
                img.onerror = () => {
                    console.warn(`Failed to load sprite: ${key}`);
                    // Create fallback canvas sprite
                    const fallback = this.createFallbackSprite(key);
                    this.sprites.set(key, fallback);
                    resolve(true);
                };
            });
        });

        Promise.all(promises).then(() => {
            this.loaded = true;
            this.loadCallbacks.forEach(cb => cb());
            this.loadCallbacks = [];
        });
    }

    createFallbackSprite(key) {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        
        // Simple colored circles as fallback
        const colors = {
            pooh: '#FFB347',
            piglet: '#FFB6C1',
            tigger: '#FF8C42',
            eeyore: '#C0C0C0',
            owl: '#8B4513',
            roo: '#87CEEB',
            honey: '#FFD54F'
        };
        
        ctx.fillStyle = colors[key] || '#FFB347';
        ctx.beginPath();
        ctx.arc(20, 20, 18, 0, Math.PI * 2);
        ctx.fill();
        
        if (key === 'honey') {
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    get(key) {
        return this.sprites.get(key);
    }

    onLoad(callback) {
        if (this.loaded) {
            callback();
        } else {
            this.loadCallbacks.push(callback);
        }
    }
}

// ============================================================================
// GAME 1: HONEY HIVE DEFENSE (Tower Defense)
// ============================================================================

class HoneyHiveDefense {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) throw new Error(`Canvas ${canvasId} not found`);
        
        this.ctx = this.canvas.getContext('2d');
        this.spriteManager = options.spriteManager || new SpriteManager();
        
        // Game state
        this.state = {
            honey: 100,
            lives: 10,
            wave: 1,
            score: 0,
            running: false,
            gameOver: false,
            selectedTower: 'pooh'
        };

        // Game objects
        this.towers = [];
        this.enemies = [];
        this.projectiles = GameUtils.createObjectPool(
            (obj, x, y, target, damage, color) => {
                obj.x = x;
                obj.y = y;
                obj.target = target;
                obj.damage = damage;
                obj.color = color;
                obj.speed = 5;
            },
            (obj) => { obj.active = false; }
        );

        // Tower configurations
        this.towerConfigs = {
            pooh: { cost: 20, damage: 10, range: 100, fireRate: 900, color: '#FFB347', sprite: 'pooh' },
            tigger: { cost: 30, damage: 14, range: 90, fireRate: 650, color: '#FF8C42', sprite: 'tigger' },
            piglet: { cost: 25, damage: 9, range: 95, fireRate: 550, color: '#FFB6C1', sprite: 'piglet' },
            eeyore: { cost: 35, damage: 24, range: 115, fireRate: 1900, color: '#C0C0C0', sprite: 'eeyore' }
        };

        // Enemy configurations
        this.enemyConfigs = {
            heffalump: { health: 55, speed: 0.75, color: '#8A2BE2', points: 10 },
            woozle: { health: 32, speed: 1.4, color: '#FF4500', points: 15 },
            bee: { health: 18, speed: 2.1, color: '#FFD700', points: 5 }
        };

        // Game path (enemy route)
        this.path = [
            { x: 0, y: 220 },
            { x: 160, y: 220 },
            { x: 160, y: 120 },
            { x: 320, y: 120 },
            { x: 320, y: 320 },
            { x: 520, y: 320 }
        ];

        // Performance
        this.lastFrameTime = 0;
        this.rafId = null;
        this.lastSpawnTime = 0;
        this.spawnInterval = 900;
        this.waveActive = false;

        // UI Elements
        this.ui = {
            honey: document.getElementById('honey-count'),
            lives: document.getElementById('lives-count'),
            wave: document.getElementById('wave-count'),
            startBtn: document.getElementById('start-defense'),
            upgradeBtn: document.getElementById('upgrade-tower'),
            alert: document.getElementById('defense-alert')
        };

        this.bindEvents();
        this.initCanvas();
    }

    initCanvas() {
        // Optimize canvas for performance
        this.canvas.style.imageRendering = 'pixelated';
        this.ctx.imageSmoothingEnabled = false;
        
        // Pre-render static background
        this.renderBackground();
    }

    bindEvents() {
        // Canvas click for tower placement
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // UI buttons
        if (this.ui.startBtn) {
            this.ui.startBtn.addEventListener('click', () => this.startWave());
        }
        
        if (this.ui.upgradeBtn) {
            this.ui.upgradeBtn.addEventListener('click', () => this.upgradeTowers());
        }

        // Tower selection
        document.querySelectorAll('.tower-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.state.selectedTower = e.currentTarget.dataset.tower;
                document.querySelectorAll('.tower-option').forEach(o => 
                    o.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
            });
        });
    }

    start() {
        if (this.state.running) return;
        
        this.state.running = true;
        this.lastFrameTime = performance.now();
        this.gameLoop();
        
        this.updateUI();
        this.showMessage('Prepare your defenses!', 2000);
    }

    stop() {
        this.state.running = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    reset() {
        this.stop();
        this.state = {
            honey: 100,
            lives: 10,
            wave: 1,
            score: 0,
            running: false,
            gameOver: false,
            selectedTower: 'pooh'
        };
        this.towers = [];
        this.enemies = [];
        this.projectiles.reset();
        this.waveActive = false;
        this.updateUI();
        this.showMessage('Game reset. Ready to play!', 1500);
    }

    gameLoop(currentTime) {
        if (!this.state.running) return;

        const delta = Math.min(currentTime - this.lastFrameTime, 100);
        this.lastFrameTime = currentTime;

        this.update(delta);
        this.render();

        this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(delta) {
        if (this.state.gameOver) return;

        const deltaTime = delta / 16;

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const target = this.path[enemy.pathIndex];
            const dx = target.x - enemy.x;
            const dy = target.y - enemy.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 1) {
                enemy.pathIndex++;
                if (enemy.pathIndex >= this.path.length) {
                    // Enemy reached the end
                    this.state.lives--;
                    this.enemies.splice(i, 1);
                    this.showMessage('Honey jar spilled! -1 life', 1200);
                    if (this.state.lives <= 0) {
                        this.gameOver();
                    }
                    continue;
                }
            } else {
                const step = enemy.speed * deltaTime;
                enemy.x += (dx / dist) * step;
                enemy.y += (dy / dist) * step;
            }
        }

        // Update towers
        this.towers.forEach(tower => {
            if (tower.cooldown > 0) {
                tower.cooldown -= delta;
                return;
            }

            // Find target
            let target = null;
            let minDist = tower.range * tower.range;

            this.enemies.forEach(enemy => {
                const dx = enemy.x - tower.x;
                const dy = enemy.y - tower.y;
                const distSq = dx * dx + dy * dy;
                
                if (distSq < minDist) {
                    minDist = distSq;
                    target = enemy;
                }
            });

            if (target) {
                this.projectiles.get(tower.x, tower.y, target, tower.damage, tower.color);
                tower.cooldown = tower.fireRate;
            }
        });

        // Update projectiles
        this.projectiles.update(delta, (proj, delta) => {
            if (!proj.target || !proj.target.health) return false;

            const dx = proj.target.x - proj.x;
            const dy = proj.target.y - proj.y;
            const dist = Math.hypot(dx, dy);
            const step = proj.speed * (delta / 16);

            if (dist < step) {
                // Hit target
                proj.target.health -= proj.damage;
                if (proj.target.health <= 0) {
                    this.state.honey += proj.target.points;
                    this.state.score += proj.target.points;
                    this.enemies = this.enemies.filter(e => e !== proj.target);
                }
                return false;
            } else {
                proj.x += (dx / dist) * step;
                proj.y += (dy / dist) * step;
                return true;
            }
        });

        // Spawn enemies during wave
        if (this.waveActive) {
            const now = performance.now();
            const maxEnemies = GameUtils.isMobile() ? 
                GameConstants.MOBILE_MAX_ENEMIES : 
                GameConstants.DESKTOP_MAX_ENEMIES;

            if (this.enemies.length < maxEnemies && now - this.lastSpawnTime > this.spawnInterval) {
                this.lastSpawnTime = now;
                this.spawnEnemy();
            }

            // Check if wave is complete
            if (this.enemies.length === 0 && now - this.lastSpawnTime > 3000) {
                this.waveComplete();
            }
        }

        this.updateUI();
    }

    spawnEnemy() {
        const enemyTypes = Object.keys(this.enemyConfigs);
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const config = this.enemyConfigs[type];

        this.enemies.push({
            x: this.path[0].x,
            y: this.path[0].y,
            pathIndex: 1,
            health: config.health,
            maxHealth: config.health,
            speed: config.speed,
            color: config.color,
            points: config.points,
            type: type
        });
    }

    waveComplete() {
        this.waveActive = false;
        this.state.wave++;
        this.state.honey += 50;
        
        this.showMessage(`Wave ${this.state.wave - 1} complete! +50 honey`, 2000);
        
        // Increase difficulty
        this.spawnInterval = Math.max(300, this.spawnInterval - 50);
        
        Object.values(this.enemyConfigs).forEach(config => {
            config.health = Math.floor(config.health * 1.2);
        });
    }

    startWave() {
        if (this.waveActive || this.state.gameOver) return;
        
        this.waveActive = true;
        this.lastSpawnTime = performance.now();
        this.showMessage(`Wave ${this.state.wave} incoming!`, 1500);
    }

    upgradeTowers() {
        if (this.state.honey < 50 || this.towers.length === 0) {
            this.showMessage('Not enough honey or no towers to upgrade!', 1500);
            return;
        }

        this.state.honey -= 50;
        this.towers.forEach(tower => {
            tower.level++;
            tower.damage += 5;
            tower.range += 10;
        });

        this.showMessage('Towers upgraded!', 1200);
    }

    handleCanvasClick(e) {
        if (this.state.gameOver) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if too close to path
        const nearPath = this.path.some((point, i) => {
            if (i === 0) return false;
            const prev = this.path[i - 1];
            const dist = this.pointToLineDistance(x, y, prev.x, prev.y, point.x, point.y);
            return dist < 40;
        });

        if (nearPath) {
            this.showMessage('Too close to the path!', 1200);
            return;
        }

        const towerType = this.towerConfigs[this.state.selectedTower];
        if (this.state.honey < towerType.cost) {
            this.showMessage('Not enough honey!', 1200);
            return;
        }

        this.state.honey -= towerType.cost;
        this.towers.push({
            x, y,
            type: this.state.selectedTower,
            damage: towerType.damage,
            range: towerType.range,
            fireRate: towerType.fireRate,
            color: towerType.color,
            level: 1,
            cooldown: 0
        });

        this.updateUI();
    }

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.hypot(dx, dy);
    }

    gameOver() {
        this.state.gameOver = true;
        this.waveActive = false;
        this.showMessage(`Game Over! Final Score: ${this.state.score}`, 3000);
        
        setTimeout(() => {
            if (confirm(`Game Over! Score: ${this.state.score}\nPlay again?`)) {
                this.reset();
                this.start();
            }
        }, 1000);
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background (could be cached)
        this.renderBackground();
        
        // Draw towers
        this.towers.forEach(tower => {
            const sprite = this.spriteManager.get(tower.type);
            if (sprite) {
                this.ctx.drawImage(sprite, tower.x - 20, tower.y - 20, 40, 40);
            } else {
                // Fallback circle
                this.ctx.fillStyle = tower.color;
                this.ctx.beginPath();
                this.ctx.arc(tower.x, tower.y, 18, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Level indicator
            this.ctx.fillStyle = '#000';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`Lv.${tower.level}`, tower.x - 10, tower.y - 25);
        });
        
        // Draw enemies
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = enemy.color;
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Health bar
            const healthWidth = 30 * (enemy.health / enemy.maxHealth);
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(enemy.x - 15, enemy.y - 20, 30, 4);
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillRect(enemy.x - 15, enemy.y - 20, healthWidth, 4);
        });
        
        // Draw projectiles
        this.projectiles.update(0, (proj) => {
            this.ctx.fillStyle = proj.color;
            this.ctx.beginPath();
            this.ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            return true;
        });
        
        // Draw path (debug)
        this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
        this.ctx.lineWidth = 30;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(this.path[0].x, this.path[0].y);
        this.path.forEach(point => this.ctx.lineTo(point.x, point.y));
        this.ctx.stroke();
    }

    renderBackground() {
        // Simple background
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#90EE90';
        this.ctx.fillRect(0, this.canvas.height - 60, this.canvas.width, 60);
    }

    updateUI() {
        if (this.ui.honey) this.ui.honey.textContent = this.state.honey;
        if (this.ui.lives) this.ui.lives.textContent = this.state.lives;
        if (this.ui.wave) this.ui.wave.textContent = this.state.wave;
    }

    showMessage(text, duration = 2000) {
        if (this.ui.alert) {
            this.ui.alert.textContent = text;
            this.ui.alert.style.opacity = '1';
            setTimeout(() => {
                this.ui.alert.style.opacity = '0';
            }, duration);
        }
    }
}

// ============================================================================
// GAME 2: HONEY POT CATCH
// ============================================================================

class HoneyPotCatch {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) throw new Error(`Canvas ${canvasId} not found`);
        
        this.ctx = this.canvas.getContext('2d');
        this.spriteManager = options.spriteManager || new SpriteManager();
        
        // Game state
        this.state = {
            score: 0,
            timeLeft: 60,
            lives: 3,
            running: false,
            gameOver: false,
            paused: false
        };

        // Game objects
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 60,
            width: 60,
            height: 60,
            speed: 8
        };

        this.honeyPots = GameUtils.createObjectPool(
            (obj) => {
                obj.x = Math.random() * (this.canvas.width - 30) + 15;
                obj.y = -30;
                obj.speed = 2 + Math.random() * 3;
                obj.type = 'honey';
            },
            (obj) => { obj.active = false; }
        );

        this.bees = GameUtils.createObjectPool(
            (obj) => {
                obj.x = Math.random() * (this.canvas.width - 30) + 15;
                obj.y = -30;
                obj.speed = 3 + Math.random() * 2;
                obj.type = 'bee';
            },
            (obj) => { obj.active = false; }
        );

        // Performance
        this.lastFrameTime = 0;
        this.rafId = null;
        this.timerInterval = null;
        this.spawnTimer = 0;
        
        // Controls
        this.keys = {};
        
        // UI Elements
        this.ui = {
            score: document.getElementById('score-count'),
            time: document.getElementById('time-count'),
            lives: document.getElementById('catch-lives'),
            startBtn: document.getElementById('start-catch'),
            pauseBtn: document.getElementById('pause-catch'),
            overlay: document.getElementById('catch-overlay')
        };

        this.bindEvents();
        this.initCanvas();
    }

    initCanvas() {
        this.canvas.style.imageRendering = 'pixelated';
        this.ctx.imageSmoothingEnabled = false;
        this.renderBackground();
    }

    bindEvents() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Touch controls for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTouch(touch.clientX);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTouch(touch.clientX);
        });

        // UI buttons
        if (this.ui.startBtn) {
            this.ui.startBtn.addEventListener('click', () => this.start());
        }

        if (this.ui.pauseBtn) {
            this.ui.pauseBtn.addEventListener('click', () => this.togglePause());
        }
    }

    handleTouch(touchX) {
        const rect = this.canvas.getBoundingClientRect();
        this.player.x = touchX - rect.left;
        this.player.x = Math.max(this.player.width / 2, 
            Math.min(this.canvas.width - this.player.width / 2, this.player.x));
    }

    start() {
        if (this.state.running) return;

        this.reset();
        this.state.running = true;
        
        // Countdown
        this.showOverlay('3');
        setTimeout(() => {
            this.showOverlay('2');
            setTimeout(() => {
                this.showOverlay('1');
                setTimeout(() => {
                    this.showOverlay('GO!');
                    this.startGameLoop();
                    this.startTimer();
                    setTimeout(() => this.hideOverlay(), 500);
                }, 500);
            }, 500);
        }, 500);
    }

    startGameLoop() {
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            if (!this.state.paused && this.state.running) {
                this.state.timeLeft--;
                this.updateUI();
                
                if (this.state.timeLeft <= 0) {
                    this.gameOver(true);
                }
            }
        }, 1000);
    }

    togglePause() {
        if (!this.state.running) return;
        
        this.state.paused = !this.state.paused;
        if (this.state.paused) {
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            this.showOverlay('PAUSED', 'Click resume to continue');
        } else {
            this.startGameLoop();
            this.hideOverlay();
        }
    }

    reset() {
        this.state = {
            score: 0,
            timeLeft: 60,
            lives: 3,
            running: false,
            gameOver: false,
            paused: false
        };

        this.player.x = this.canvas.width / 2;
        this.honeyPots.reset();
        this.bees.reset();
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        this.updateUI();
    }

    gameLoop(currentTime) {
        if (!this.state.running || this.state.paused || this.state.gameOver) return;

        const delta = Math.min(currentTime - this.lastFrameTime, 100);
        this.lastFrameTime = currentTime;

        this.update(delta);
        this.render();

        this.rafId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(delta) {
        const deltaTime = delta / 16;

        // Update player position
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.player.x = Math.max(this.player.width / 2, 
                this.player.x - this.player.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['d']) {
            this.player.x = Math.min(this.canvas.width - this.player.width / 2, 
                this.player.x + this.player.speed);
        }

        // Spawn objects
        this.spawnTimer += delta;
        if (this.spawnTimer > 800) {
            this.spawnTimer = 0;
            
            if (Math.random() > 0.3) {
                this.honeyPots.get();
            }
            
            if (Math.random() > 0.7) {
                this.bees.get();
            }
        }

        // Update honey pots
        this.honeyPots.update(delta, (pot, delta) => {
            pot.y += pot.speed * (delta / 16);
            
            // Check collision with player
            if (this.checkCollision(pot, this.player)) {
                this.state.score += 10;
                this.updateUI();
                return false;
            }
            
            // Remove if off screen
            return pot.y < this.canvas.height + 30;
        });

        // Update bees
        this.bees.update(delta, (bee, delta) => {
            bee.y += bee.speed * (delta / 16);
            
            // Check collision with player
            if (this.checkCollision(bee, this.player)) {
                this.state.lives--;
                this.updateUI();
                
                if (this.state.lives <= 0) {
                    this.gameOver(false);
                }
                return false;
            }
            
            // Remove if off screen
            return bee.y < this.canvas.height + 30;
        });
    }

    checkCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.hypot(dx, dy);
        return distance < 25;
    }

    gameOver(timeUp) {
        this.state.running = false;
        this.state.gameOver = true;
        
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        const message = timeUp ? 
            `Time's up! Score: ${this.state.score}` :
            `Game Over! Score: ${this.state.score}`;
        
        this.showOverlay(message, 'Click start to play again');
        
        setTimeout(() => {
            if (confirm(`${message}\nPlay again?`)) {
                this.reset();
                this.start();
            }
        }, 500);
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.renderBackground();
        
        // Draw player (Pooh)
        const poohSprite = this.spriteManager.get('pooh');
        if (poohSprite) {
            this.ctx.drawImage(
                poohSprite,
                this.player.x - this.player.width / 2,
                this.player.y - this.player.height / 2,
                this.player.width,
                this.player.height
            );
        } else {
            // Fallback
            this.ctx.fillStyle = '#FFB347';
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, 25, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw honey pots
        this.honeyPots.update(0, (pot) => {
            const honeySprite = this.spriteManager.get('honey');
            if (honeySprite) {
                this.ctx.drawImage(honeySprite, pot.x - 15, pot.y - 15, 30, 30);
            } else {
                this.ctx.fillStyle = '#FFD54F';
                this.ctx.beginPath();
                this.ctx.arc(pot.x, pot.y, 12, 0, Math.PI * 2);
                this.ctx.fill();
            }
            return true;
        });
        
        // Draw bees
        this.bees.update(0, (bee) => {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(bee.x, bee.y, 10, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Bee stripes
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(bee.x - 8, bee.y - 2, 4, 4);
            this.ctx.fillRect(bee.x + 4, bee.y - 2, 4, 4);
            
            // Wings
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.beginPath();
            this.ctx.arc(bee.x - 5, bee.y - 8, 6, 0, Math.PI * 2);
            this.ctx.arc(bee.x + 5, bee.y - 8, 6, 0, Math.PI * 2);
            this.ctx.fill();
            
            return true;
        });
        
        // Draw HUD
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 80);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Score: ${this.state.score}`, 20, 35);
        this.ctx.fillText(`Time: ${this.state.timeLeft}s`, 20, 60);
        this.ctx.fillText(`Lives: ${this.state.lives}`, 20, 85);
    }

    renderBackground() {
        // Sky
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Clouds
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(100, 80, 25, 0, Math.PI * 2);
        this.ctx.arc(130, 70, 30, 0, Math.PI * 2);
        this.ctx.arc(160, 80, 25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ground
        this.ctx.fillStyle = '#8BC34A';
        this.ctx.fillRect(0, this.canvas.height - 60, this.canvas.width, 60);
        
        // Grass detail
        this.ctx.fillStyle = '#7CB342';
        for (let i = 0; i < this.canvas.width; i += 10) {
            const height = 10 + Math.random() * 20;
            this.ctx.fillRect(i, this.canvas.height - 60, 3, -height);
        }
    }

    updateUI() {
        if (this.ui.score) this.ui.score.textContent = this.state.score;
        if (this.ui.time) this.ui.time.textContent = this.state.timeLeft;
        if (this.ui.lives) this.ui.lives.textContent = this.state.lives;
    }

    showOverlay(text, subtext = '') {
        if (this.ui.overlay) {
            const overlay = this.ui.overlay;
            overlay.querySelector('.catch-countdown').textContent = text;
            overlay.querySelector('.catch-hint').textContent = subtext;
            overlay.classList.add('active');
        }
    }

    hideOverlay() {
        if (this.ui.overlay) {
            this.ui.overlay.classList.remove('active');
        }
    }
}

// ============================================================================
// GAME MANAGER (Orchestrates both games)
// ============================================================================

class GameManager {
    constructor() {
        this.games = new Map();
        this.spriteManager = new SpriteManager();
        this.activeGame = null;
    }

    init() {
        // Load sprites first
        this.spriteManager.load();
        
        // Wait for sprites to load before initializing games
        this.spriteManager.onLoad(() => {
            this.initializeGames();
        });
    }

    initializeGames() {
        try {
            // Initialize defense game
            const defenseGame = new HoneyHiveDefense('defense-game', {
                spriteManager: this.spriteManager
            });
            this.games.set('defense', defenseGame);

            // Initialize catch game
            const catchGame = new HoneyPotCatch('honey-game', {
                spriteManager: this.spriteManager
            });
            this.games.set('catch', catchGame);

            // Set up game switching
            this.setupNavigation();
            
            console.log('Games initialized successfully');
        } catch (error) {
            console.error('Failed to initialize games:', error);
        }
    }

    setupNavigation() {
        // Listen for chapter changes to pause/stop games
        document.addEventListener('chapterChange', (e) => {
            const newChapter = e.detail.chapter;
            
            // Stop games when not on game chapters
            if (newChapter !== 2 && newChapter !== 3) {
                this.stopAllGames();
            }
        });

        // Pause games on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAllGames();
            }
        });
    }

    getGame(name) {
        return this.games.get(name);
    }

    startGame(name) {
        const game = this.games.get(name);
        if (game) {
            this.activeGame = game;
            game.start();
        }
    }

    stopGame(name) {
        const game = this.games.get(name);
        if (game) {
            game.stop();
            if (this.activeGame === game) {
                this.activeGame = null;
            }
        }
    }

    pauseAllGames() {
        this.games.forEach(game => {
            if (game.state && game.state.running && !game.state.paused) {
                game.togglePause?.();
            }
        });
    }

    stopAllGames() {
        this.games.forEach(game => game.stop?.());
        this.activeGame = null;
    }

    resetAllGames() {
        this.games.forEach(game => game.reset?.());
    }
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

// Export for browser
window.Games = {
    HoneyHiveDefense,
    HoneyPotCatch,
    GameManager,
    SpriteManager,
    GameUtils
};

// Auto-initialize if in browser context
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only initialize if we're on a page with games
        if (document.getElementById('defense-game') || document.getElementById('honey-game')) {
            window.gameManager = new GameManager();
            window.gameManager.init();
        }
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HoneyHiveDefense,
        HoneyPotCatch,
        GameManager,
        SpriteManager,
        GameUtils
    };
}
