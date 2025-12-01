/* ========= ENHANCED VISUALS HONEY CATCH GAME ========= */

class EnhancedVisualsHoneyCatchGame {
    constructor(canvas, dom) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dom = dom || {};

        this.width = canvas.width || 520;
        this.height = canvas.height || 400;

        this.player = null;
        this.pots = [];
        this.rocks = [];
        this.particles = [];
        this.clouds = [];
        this.butterflies = [];
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('honeyCatchHighScore') || '0');
        this.lives = 3;
        this.totalTime = 60;
        this.remaining = this.totalTime;

        this.lastSpawn = 0;
        this.rockSpawn = 0;
        this.cloudSpawn = 0;
        this.butterflySpawn = 0;
        this.spawnInterval = 900;
        this.rockInterval = 2000;
        this.cloudInterval = 3000;
        this.butterflyInterval = 5000;
        this.lastTime = 0;

        this.isRunning = false;
        this.isPaused = false;
        this.gameOver = false;
        this.pointerActive = false;
        this.keyState = {};
        this.isCountingDown = false;
        this.countdown = 3;

        this.init();
    }

    init() {
        this.handleResize();
        this.initBackgroundElements();
        this.resetGame();
        this.initControls();
        this.updateHighScore();
        this.updateOverlay('Ready when you are.', 'Press Start Game to begin.');
        requestAnimationFrame((t) => this.loop(t));
        this.updateUI();
    }

    initBackgroundElements() {
        // Create initial clouds
        for (let i = 0; i < 3; i++) {
            this.clouds.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height * 0.3),
                size: 40 + Math.random() * 40,
                speed: 0.2 + Math.random() * 0.3,
                opacity: 0.6 + Math.random() * 0.3
            });
        }

        // Create initial butterflies
        for (let i = 0; i < 2; i++) {
            this.butterflies.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height * 0.4),
                speedX: 0.5 + Math.random() * 0.5,
                speedY: 0.3 + Math.random() * 0.3,
                wingPhase: Math.random() * Math.PI * 2,
                wingSpeed: 0.05 + Math.random() * 0.05,
                color: i % 2 === 0 ? '#FF6B6B' : '#4ECDC4'
            });
        }
    }

    initControls() {
        window.addEventListener('keydown', (e) => {
            this.keyState[e.key] = true;

            if ((e.key === ' ' || e.key === 'Enter') && !this.isTextInput(e.target)) {
                e.preventDefault();
                if (!this.isRunning || this.gameOver) {
                    this.startNewGame();
                } else {
                    this.togglePause();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keyState[e.key] = false;
        });

        this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
        this.canvas.addEventListener('pointerup', () => (this.pointerActive = false));
        this.canvas.addEventListener('pointerleave', () => (this.pointerActive = false));

        if (this.dom.startBtn) {
            this.dom.startBtn.addEventListener('click', () => this.startNewGame());
        }
        if (this.dom.pauseBtn) {
            this.dom.pauseBtn.addEventListener('click', () => this.togglePause());
        }

        if (this.dom.mobileLeftBtn) {
            this.dom.mobileLeftBtn.addEventListener('touchstart', () => this.keyState['ArrowLeft'] = true);
            this.dom.mobileLeftBtn.addEventListener('touchend', () => this.keyState['ArrowLeft'] = false);
        }
        if (this.dom.mobileRightBtn) {
            this.dom.mobileRightBtn.addEventListener('touchstart', () => this.keyState['ArrowRight'] = true);
            this.dom.mobileRightBtn.addEventListener('touchend', () => this.keyState['ArrowRight'] = false);
        }
    }

    isTextInput(el) {
        if (!el || !el.tagName) return false;
        const tag = el.tagName.toLowerCase();
        return tag === 'input' || tag === 'textarea' || el.isContentEditable;
    }

    onPointerDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;

        if (!this.isRunning || this.gameOver) {
            return;
        }

        this.pointerActive = true;
        this.player.x = x - this.player.width / 2;
    }

    onPointerMove(e) {
        if (!this.pointerActive) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        this.player.x = x - this.player.width / 2;
    }

    handleResize() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = rect.width || 520;
        this.height = rect.height || 400;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        if (this.player) {
            this.player.y = this.height - this.player.height - 8;
        }
    }

    resetGame() {
        const w = Math.max(this.width * 0.12, 40);
        const h = w * 0.7;
        this.player = {
            x: (this.width - w) / 2,
            y: this.height - h - 8,
            width: w,
            height: h,
            speed: Math.max(this.width * 0.4, 160),
            isMoving: false,
            moveOffset: 0,
            bounce: 0
        };
        this.pots = [];
        this.rocks = [];
        this.particles = [];
        this.score = 0;
        this.lives = 3;
        this.remaining = this.totalTime;
        this.lastSpawn = 0;
        this.rockSpawn = 0;
        this.cloudSpawn = 0;
        this.butterflySpawn = 0;
        this.spawnInterval = 900;
        this.rockInterval = 2000;
        this.cloudInterval = 3000;
        this.butterflyInterval = 5000;
        this.gameOver = false;
        this.isCountingDown = false;
        this.countdown = 3;
        this.isRunning = false;
        this.isPaused = false;
    }

    startNewGame() {
        this.resetGame();
        this.isCountingDown = true;
        this.updateOverlay('Get ready!', 'Starting in...');
        if (this.dom.pauseBtn) this.dom.pauseBtn.textContent = 'Pause';
        this.updateUI();
    }

    togglePause() {
        if (!this.isRunning || this.gameOver || this.isCountingDown) return;
        this.isPaused = !this.isPaused;
        if (this.dom.pauseBtn) {
            this.dom.pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
        }
        this.updateOverlay(
            this.isPaused ? 'Paused' : '',
            this.isPaused ? 'Tap Resume or press Space/Enter to continue.' : ''
        );
    }

    spawnPot() {
        const isGolden = Math.random() < 0.15;
        const size = Math.max(this.width * 0.05, 20) * (isGolden ? 1.4 : 1);
        const x = Math.random() * (this.width - size);
        const speed = Math.max(this.height * 0.18, 120) + Math.random() * 60;
        this.pots.push({ 
            x, 
            y: -size, 
            width: size, 
            height: size, 
            speed,
            isGolden,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.05 + Math.random() * 0.05
        });
    }

    spawnRock() {
        const size = Math.max(this.width * 0.06, 24);
        const x = Math.random() * (this.width - size);
        const speed = Math.max(this.height * 0.2, 130) + Math.random() * 70;
        const bounceForce = Math.random() * 2 - 1;
        this.rocks.push({ 
            x, 
            y: -size, 
            width: size, 
            height: size, 
            speed,
            bounce: bounceForce,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            wobble: Math.random() * Math.PI * 2
        });
    }

    spawnCloud() {
        this.clouds.push({
            x: -100,
            y: Math.random() * (this.height * 0.4),
            size: 50 + Math.random() * 60,
            speed: 0.1 + Math.random() * 0.3,
            opacity: 0.5 + Math.random() * 0.4
        });
    }

    spawnButterfly() {
        const fromLeft = Math.random() > 0.5;
        this.butterflies.push({
            x: fromLeft ? -20 : this.width + 20,
            y: Math.random() * (this.height * 0.5),
            speedX: (0.3 + Math.random() * 0.4) * (fromLeft ? 1 : -1),
            speedY: 0.1 + Math.random() * 0.3,
            wingPhase: Math.random() * Math.PI * 2,
            wingSpeed: 0.05 + Math.random() * 0.05,
            color: Math.random() > 0.5 ? '#FF6B6B' : '#4ECDC4',
            size: 10 + Math.random() * 10
        });
    }

    createHoneySparkles(x, y, count, isGolden = false) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            const life = 0.8 + Math.random() * 0.4;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: isGolden ? 3 + Math.random() * 3 : 2 + Math.random() * 2,
                color: isGolden ? '#FFD700' : '#FFAA00',
                life: life,
                decay: life * 0.03,
                type: 'sparkle',
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            });
        }
    }

    createHoneyDrip(x, y, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 2,
                vy: 1 + Math.random() * 2,
                size: 3 + Math.random() * 3,
                color: '#FFAA00',
                life: 1,
                decay: 0.02,
                type: 'drip',
                gravity: 0.2
            });
        }
    }

    createRockDust(x, y, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: 1 + Math.random() * 2,
                color: '#8B7355',
                life: 0.8,
                decay: 0.03,
                type: 'dust',
                gravity: 0.1
            });
        }
    }

    update(dt) {
        if (this.isCountingDown) {
            this.countdown -= dt;
            if (this.countdown <= 0) {
                this.isCountingDown = false;
                this.isRunning = true;
                this.updateOverlay('Go!', 'Catch as many pots as you can!');
                setTimeout(() => this.updateOverlay('', ''), 1000);
            }
            return;
        }

        if (!this.isRunning || this.isPaused || this.gameOver) return;

        this.remaining -= dt;
        if (this.remaining <= 0) {
            this.remaining = 0;
            this.endGame('Time\u2019s up!', 'Press Start Game for another gentle round.');
        }

        // Update player bounce animation
        this.player.bounce = Math.sin(Date.now() * 0.005) * 2;

        const left = this.keyState['ArrowLeft'] || this.keyState['a'] || this.keyState['A'];
        const right = this.keyState['ArrowRight'] || this.keyState['d'] || this.keyState['D'];
        
        if (left) {
            this.player.x -= this.player.speed * dt;
            this.player.isMoving = true;
        } else if (right) {
            this.player.x += this.player.speed * dt;
            this.player.isMoving = true;
        } else {
            this.player.isMoving = false;
        }
        
        this.player.x = Math.max(0, Math.min(this.width - this.player.width, this.player.x));
        this.player.moveOffset = left ? -3 : right ? 3 : 0;

        this.lastSpawn += dt * 1000;
        this.rockSpawn += dt * 1000;
        this.cloudSpawn += dt * 1000;
        this.butterflySpawn += dt * 1000;
        
        if (this.lastSpawn > this.spawnInterval) {
            this.spawnPot();
            this.lastSpawn = 0;
            this.spawnInterval = Math.max(350, this.spawnInterval - 5);
        }
        
        if (this.rockSpawn > this.rockInterval) {
            this.spawnRock();
            this.rockSpawn = 0;
            this.rockInterval = Math.max(1500, this.rockInterval - 30);
        }
        
        if (this.cloudSpawn > this.cloudInterval) {
            this.spawnCloud();
            this.cloudSpawn = 0;
        }
        
        if (this.butterflySpawn > this.butterflyInterval) {
            this.spawnButterfly();
            this.butterflySpawn = 0;
        }

        for (let i = this.pots.length - 1; i >= 0; i--) {
            const p = this.pots[i];
            p.y += p.speed * dt;
            p.rotation += p.rotationSpeed;
            p.wobble += p.wobbleSpeed * dt;
            p.x += Math.sin(p.wobble) * 0.5;

            if (this.intersects(p, this.player)) {
                const points = p.isGolden ? 50 : 10;
                this.score += points;
                if (p.isGolden) this.remaining = Math.min(this.totalTime, this.remaining + 5);
                this.createHoneySparkles(p.x + p.width/2, p.y + p.height/2, 
                    p.isGolden ? 15 : 8, p.isGolden);
                this.createHoneyDrip(p.x + p.width/2, p.y + p.height/2, 3);
                this.pots.splice(i, 1);
                continue;
            }

            if (p.y > this.height) {
                this.createHoneyDrip(p.x + p.width/2, this.height, 2);
                this.pots.splice(i, 1);
            }
        }

        for (let i = this.rocks.length - 1; i >= 0; i--) {
            const r = this.rocks[i];
            r.y += r.speed * dt;
            r.x += r.bounce * dt * 30;
            r.rotation += r.rotationSpeed;
            r.wobble += 0.1 * dt;
            
            if (r.x < 0 || r.x + r.width > this.width) {
                r.bounce *= -1;
            }

            if (this.intersects(r, this.player)) {
                this.lives -= 1;
                this.createRockDust(r.x + r.width/2, r.y + r.height/2, 8);
                this.rocks.splice(i, 1);
                if (this.lives <= 0) {
                    this.endGame('Oh bother!', 'Press Start Game to try again.');
                }
                continue;
            }

            if (r.y > this.height) {
                this.createRockDust(r.x + r.width/2, this.height, 4);
                this.rocks.splice(i, 1);
            }
        }

        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const c = this.clouds[i];
            c.x += c.speed;
            if (c.x > this.width + 100) {
                this.clouds.splice(i, 1);
            }
        }

        for (let i = this.butterflies.length - 1; i >= 0; i--) {
            const b = this.butterflies[i];
            b.x += b.speedX;
            b.y += Math.sin(Date.now() * 0.001 + i) * 0.5;
            b.wingPhase += b.wingSpeed;
            
            if (b.x < -50 || b.x > this.width + 50) {
                this.butterflies.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.type === 'drip' || p.type === 'dust') {
                p.vy += (p.gravity || 0.2);
            }
            
            p.life -= p.decay;
            
            if (p.type === 'sparkle') {
                p.rotation += p.rotationSpeed;
            }
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        this.updateUI();
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.updateHighScore();
        }
    }

    endGame(title, hint) {
        this.gameOver = true;
        this.isRunning = false;
        this.isPaused = false;
        if (this.dom.pauseBtn) this.dom.pauseBtn.textContent = 'Pause';
        if (this.score > parseInt(localStorage.getItem('honeyCatchHighScore') || '0')) {
            localStorage.setItem('honeyCatchHighScore', this.score.toString());
            this.updateHighScore();
        }
        this.updateOverlay(title, hint);
    }

    intersects(a, b) {
        return !(
            a.x + a.width < b.x ||
            a.x > b.x + b.width ||
            a.y + a.height < b.y ||
            a.y > b.y + b.height
        );
    }

    drawBackground() {
        const ctx = this.ctx;
        const skyH = this.height * 0.6;
        
        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, skyH);
        skyGrad.addColorStop(0, '#87CEEB');
        skyGrad.addColorStop(0.7, '#B0D0E3');
        skyGrad.addColorStop(1, '#FFF7EC');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.width, skyH);

        // Sun
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.width * 0.85, skyH * 0.2, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Sun glow
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(this.width * 0.85, skyH * 0.2, 35, 0, Math.PI * 2);
        ctx.fill();

        // Ground gradient
        const groundGrad = ctx.createLinearGradient(0, skyH, 0, this.height);
        groundGrad.addColorStop(0, '#D7C39B');
        groundGrad.addColorStop(1, '#B8A179');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, skyH, this.width, this.height - skyH);

        // Grass details
        ctx.fillStyle = '#9CAD90';
        for (let i = 0; i < 20; i++) {
            const x = (this.width / 20) * i;
            const height = 10 + Math.sin(i * 0.5 + Date.now() * 0.001) * 5;
            ctx.fillRect(x, skyH - height, 15, height);
        }

        // Distant trees
        ctx.fillStyle = '#2F4F2F';
        for (let i = 0; i < 5; i++) {
            const x = this.width * (0.1 + i * 0.2);
            const treeHeight = 40 + Math.sin(i) * 20;
            ctx.fillRect(x, skyH - treeHeight, 20, treeHeight);
            ctx.beginPath();
            ctx.arc(x + 10, skyH - treeHeight - 20, 30, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawClouds() {
        const ctx = this.ctx;
        this.clouds.forEach(cloud => {
            ctx.save();
            ctx.globalAlpha = cloud.opacity;
            ctx.fillStyle = 'white';
            
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.4, cloud.y - cloud.size * 0.2, cloud.size * 0.4, 0, Math.PI * 2);
            ctx.arc(cloud.x - cloud.size * 0.3, cloud.y - cloud.size * 0.1, cloud.size * 0.45, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.2, cloud.y + cloud.size * 0.1, cloud.size * 0.35, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }

    drawButterflies() {
        const ctx = this.ctx;
        this.butterflies.forEach(butterfly => {
            ctx.save();
            ctx.translate(butterfly.x, butterfly.y);
            
            // Body
            ctx.fillStyle = butterfly.color;
            ctx.fillRect(-3, -2, 6, 4);
            
            // Wings
            const wingOffset = Math.sin(butterfly.wingPhase) * 3;
            ctx.fillStyle = `${butterfly.color}80`; // Semi-transparent
            ctx.beginPath();
            ctx.ellipse(-5, wingOffset, 8, 5, 0, 0, Math.PI * 2);
            ctx.ellipse(5, -wingOffset, 8, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }

    drawPlayer() {
        const ctx = this.ctx;
        const p = this.player;
        const bounceOffset = this.player.bounce;
        
        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2 + bounceOffset);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 25, p.width * 0.4, p.height * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = '#FFC42B';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.width * 0.4, p.height * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.ellipse(0, -p.height * 0.25, p.width * 0.23, p.height * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.beginPath();
        ctx.arc(-p.width * 0.18, -p.height * 0.4, p.width * 0.08, 0, Math.PI * 2);
            ctx.arc(p.width * 0.18, -p.height * 0.4, p.width * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Shirt
        ctx.fillStyle = '#D62E2E';
        ctx.beginPath();
        ctx.ellipse(0, 12, p.width * 0.45, p.height * 0.27, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#2f1a0e';
        ctx.beginPath();
        ctx.arc(-p.width * 0.06, -p.height * 0.27, p.width * 0.025, 0, Math.PI * 2);
        ctx.arc(p.width * 0.06, -p.height * 0.27, p.width * 0.025, 0, Math.PI * 2);
        ctx.fill();

        // Nose shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(-p.width * 0.02, -p.height * 0.22, p.width * 0.01, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawPots() {
        const ctx = this.ctx;
        this.pots.forEach(p => {
            ctx.save();
            ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
            ctx.rotate(p.rotation);
            
            // Honey glow
            if (p.isGolden) {
                const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.width * 0.6);
                glowGrad.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
                glowGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = glowGrad;
                ctx.beginPath();
                ctx.arc(0, 0, p.width * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Jar
            const jarGrad = ctx.createLinearGradient(0, -p.height/2, 0, p.height/2);
            if (p.isGolden) {
                jarGrad.addColorStop(0, '#FFD700');
                jarGrad.addColorStop(0.5, '#FFAA00');
                jarGrad.addColorStop(1, '#E69500');
            } else {
                jarGrad.addColorStop(0, '#FFC42B');
                jarGrad.addColorStop(0.5, '#FFAA00');
                jarGrad.addColorStop(1, '#E69500');
            }
            ctx.fillStyle = jarGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.width * 0.45, p.height * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Lid
            ctx.fillStyle = p.isGolden ? '#B8860B' : '#8B4513';
            ctx.fillRect(-p.width * 0.3, -p.height * 0.4, p.width * 0.6, p.height * 0.16);
            
            // Label
            ctx.fillStyle = p.isGolden ? '#FFF' : '#FFF7EC';
            ctx.font = `${Math.max(10, p.width * 0.3)}px "Patrick Hand", system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.isGolden ? '✨ GOLD ✨' : 'HUNNY', 0, p.height * 0.1);
            
            // Honey drips
            if (p.isGolden) {
                ctx.fillStyle = '#FFAA00';
                ctx.beginPath();
                ctx.ellipse(p.width * 0.2, p.height * 0.3, 2, 4, 0, 0, Math.PI * 2);
                ctx.ellipse(-p.width * 0.15, p.height * 0.35, 3, 5, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }

    drawRocks() {
        const ctx = this.ctx;
        this.rocks.forEach(r => {
            ctx.save();
            ctx.translate(r.x + r.width / 2, r.y + r.height / 2);
            ctx.rotate(r.rotation);
            
            // Rock gradient
            const rockGrad = ctx.createRadialGradient(-r.width/4, -r.height/4, 0, 0, 0, r.width/2);
            rockGrad.addColorStop(0, '#AAA');
            rockGrad.addColorStop(1, '#666');
            ctx.fillStyle = rockGrad;
            
            // Rock shape with noise
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const radius = r.width * 0.45 * (0.8 + Math.sin(r.wobble + i) * 0.2);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            
            // Crack lines
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-r.width * 0.3, -r.height * 0.2);
            ctx.lineTo(r.width * 0.2, r.height * 0.3);
            ctx.moveTo(r.width * 0.1, -r.height * 0.3);
            ctx.lineTo(-r.width * 0.1, r.height * 0.2);
            ctx.stroke();
            
            ctx.restore();
        });
    }

    drawParticles() {
        const ctx = this.ctx;
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            
            if (p.type === 'sparkle') {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                
                // Star shape
                ctx.fillStyle = p.color;
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2;
                    const radius = p.size;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                
                // Glow
                ctx.fillStyle = p.color + '40';
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'drip') {
                // Honey drip
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'dust') {
                // Rock dust
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }

    drawHUD() {
        const ctx = this.ctx;
        
        // Score
        ctx.fillStyle = '#2f1a0e';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.font = `bold ${Math.max(14, this.width * 0.04)}px "Lato", system-ui`;
        ctx.fillText(`🍯 Score: ${this.score}`, 10, 8);
        
        // Lives
        ctx.textAlign = 'center';
        const heartSize = Math.max(20, this.width * 0.03);
        for (let i = 0; i < 3; i++) {
            const x = this.width / 2 + (i - 1) * 25;
            const isFull = i < this.lives;
            ctx.fillStyle = isFull ? '#FF6B6B' : '#FFB8B8';
            ctx.beginPath();
            ctx.moveTo(x, 20);
            ctx.bezierCurveTo(x - 12, 20, x - 15, 30, x, 40);
            ctx.bezierCurveTo(x + 15, 30, x + 12, 20, x, 20);
            ctx.fill();
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // Time
        ctx.textAlign = 'right';
        ctx.fillStyle = this.remaining < 10 ? '#FF4500' : '#2f1a0e';
        ctx.fillText(`⏱️ ${Math.max(0, Math.ceil(this.remaining))}s`, this.width - 10, 8);
    }

    drawCountdown() {
        if (!this.isCountingDown) return;
        
        const ctx = this.ctx;
        const number = Math.ceil(this.countdown);
        if (number <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = 0.9;
        
        // Background
        ctx.fillStyle = 'rgba(255, 247, 236, 0.95)';
        ctx.beginPath();
        ctx.roundRect(this.width/2 - 60, this.height/2 - 60, 120, 120, 20);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Number with honey drip effect
        ctx.fillStyle = '#D62E2E';
        ctx.font = `bold ${Math.min(80, this.width * 0.2)}px "Patrick Hand", system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        ctx.fillText(number.toString(), this.width/2, this.height/2);
        ctx.shadowBlur = 0;
        
        // Honey drip
        if (number < 3) {
            ctx.fillStyle = '#FFAA00';
            ctx.beginPath();
            ctx.arc(this.width/2 + 25, this.height/2 - 15, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    updateUI() {
        if (this.dom.scoreEl) this.dom.scoreEl.textContent = this.score;
        if (this.dom.livesEl) this.dom.livesEl.textContent = this.lives;
        if (this.dom.timeEl) {
            this.dom.timeEl.textContent = Math.max(0, Math.ceil(this.remaining));
            this.dom.timeEl.style.color = this.remaining < 10 ? '#FF4500' : '';
        }
    }

    updateHighScore() {
        if (this.dom.highScoreEl) {
            this.dom.highScoreEl.textContent = this.highScore;
        }
    }

    updateOverlay(title, hint) {
        if (!this.dom.overlayEl) return;
        this.dom.overlayEl.style.opacity = (title || hint) ? '1' : '0';
        if (this.dom.countdownEl) {
            this.dom.countdownEl.textContent = title || '';
            this.dom.countdownEl.style.color = this.isCountingDown ? '#D62E2E' : '#2f1a0e';
        }
        if (this.dom.hintEl) this.dom.hintEl.textContent = hint || '';
    }

    loop(timestamp) {
        const t = timestamp || 0;
        const dt = this.lastTime ? (t - this.lastTime) / 1000 : 0.016;
        this.lastTime = t;

        this.update(dt);

        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawBackground();
        this.drawClouds();
        this.drawButterflies();
        this.drawPots();
        this.drawRocks();
        this.drawParticles();
        this.drawPlayer();
        this.drawCountdown();
        this.drawHUD();

        requestAnimationFrame((time) => this.loop(time));
    }
}

/* ========= ENHANCED VISUALS HONEY DEFENSE GAME ========= */

class EnhancedVisualsHoneyDefenseGame {
    constructor(canvas, dom) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dom = dom || {};

        this.width = canvas.width || 520;
        this.height = canvas.height || 400;

        this.path = [];
        this.bees = [];
        this.towers = [];
        this.projectiles = [];
        this.particles = [];
        this.clouds = [];
        this.flowers = [];

        this.honey = 150;
        this.highScore = parseInt(localStorage.getItem('hiveDefenseHighScore') || '0');
        this.lives = 20;
        this.wave = 1;
        this.beesPerWave = 10;

        this.totalSpawned = 0;
        this.spawnInterval = 1400;
        this.lastSpawn = 0;
        this.lastTime = 0;
        this.waveActive = false;
        this.waveCooldown = 3000;
        this.waveTimer = 0;
        this.alertTimeout = null;

        this.isRunning = false;
        this.gameOver = false;
        this.showingRange = false;
        this.hoveredTower = null;

        this.selectedTowerType = 'pooh';
        this.towerDefs = {
            pooh: { 
                name: 'Pooh', 
                cost: 30, 
                rangeFactor: 0.28, 
                rate: 0.7, 
                damage: 1,
                color: '#FFC42B',
                upgradeCost: 50,
                icon: '🐻'
            },
            tigger: { 
                name: 'Tigger', 
                cost: 40, 
                rangeFactor: 0.26, 
                rate: 0.45, 
                damage: 2,
                color: '#FF8C00',
                upgradeCost: 70,
                icon: '🐯'
            },
            rabbit: { 
                name: 'Rabbit', 
                cost: 50, 
                rangeFactor: 0.32, 
                rate: 0.65, 
                damage: 1,
                color: '#228B22',
                upgradeCost: 80,
                icon: '🐰'
            },
            piglet: { 
                name: 'Piglet', 
                cost: 35, 
                rangeFactor: 0.24, 
                rate: 0.5, 
                damage: 1,
                color: '#FFB6C1',
                upgradeCost: 60,
                icon: '🐷'
            },
            eeyore: { 
                name: 'Eeyore', 
                cost: 45, 
                rangeFactor: 0.30, 
                rate: 0.9, 
                damage: 1,
                color: '#778899',
                upgradeCost: 75,
                icon: '🐴'
            }
        };

        this.init();
    }

    init() {
        this.handleResize();
        this.createPath();
        this.initBackgroundElements();
        this.resetGame();
        this.initControls();
        this.updateHighScore();
        requestAnimationFrame((t) => this.loop(t));
        this.updateHUD();
        this.setAlert('The honey path is peaceful. Press Start Wave when ready.', 3000);
    }

    initBackgroundElements() {
        // Create initial clouds
        for (let i = 0; i < 4; i++) {
            this.clouds.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height * 0.4),
                size: 30 + Math.random() * 40,
                speed: 0.1 + Math.random() * 0.2,
                opacity: 0.5 + Math.random() * 0.3
            });
        }

        // Create flowers along the path
        for (let i = 0; i < 8; i++) {
            const t = i / 8;
            const point = this.getPointOnPath(t);
            this.flowers.push({
                x: point.x + (Math.random() - 0.5) * 40,
                y: point.y + (Math.random() - 0.5) * 30,
                size: 10 + Math.random() * 10,
                color: ['#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0'][Math.floor(Math.random() * 4)],
                sway: Math.random() * Math.PI * 2,
                swaySpeed: 0.02 + Math.random() * 0.03
            });
        }
    }

    initControls() {
        const { startBtn, upgradeBtn, towerOptions } = this.dom;

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startWave();
            });
        }

        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => this.upgradeSelectedTower());
        }

        if (towerOptions && towerOptions.length) {
            towerOptions.forEach(btn => {
                btn.addEventListener('click', () => {
                    const type = btn.getAttribute('data-tower');
                    if (!type || !this.towerDefs[type]) return;
                    this.selectedTowerType = type;
                    towerOptions.forEach(b => {
                        const pressed = b === btn;
                        b.classList.toggle('selected', pressed);
                        b.setAttribute('aria-pressed', String(pressed));
                    });
                    this.setAlert(`${this.towerDefs[type].name} selected (${this.towerDefs[type].cost}🍯)`, 1500);
                });
            });
        }

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.showingRange && this.hoveredTower !== null) {
                this.upgradeTower(this.hoveredTower);
                this.showingRange = false;
                return;
            }

            if (this.gameOver) {
                this.resetGame();
                return;
            }

            if (!this.waveActive) {
                this.setAlert('Press Start Wave first, then place friends along the path.', 2000);
                return;
            }

            this.tryPlaceTower(x, y);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.hoveredTower = null;
            this.towers.forEach((tower, index) => {
                const dx = tower.x - x;
                const dy = tower.y - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 30) {
                    this.hoveredTower = index;
                    this.showingRange = true;
                }
            });

            if (this.hoveredTower === null) {
                this.showingRange = false;
            }
        });

        window.addEventListener('keydown', (e) => {
            if ((e.key === ' ' || e.key === 'Enter') && !this.isTextInput(e.target)) {
                e.preventDefault();
                if (!this.waveActive || this.gameOver) {
                    this.startWave();
                }
            }
            if (e.key === 'u' || e.key === 'U') {
                this.upgradeSelectedTower();
            }
            if (e.key >= '1' && e.key <= '5') {
                const types = ['pooh', 'tigger', 'rabbit', 'piglet', 'eeyore'];
                const type = types[parseInt(e.key) - 1];
                if (type && this.towerDefs[type]) {
                    this.selectedTowerType = type;
                    this.setAlert(`${this.towerDefs[type].name} selected (${this.towerDefs[type].cost}🍯)`, 1500);
                }
            }
        });
    }

    isTextInput(el) {
        if (!el || !el.tagName) return false;
        const tag = el.tagName.toLowerCase();
        return tag === 'input' || tag === 'textarea' || el.isContentEditable;
    }

    handleResize() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = rect.width || 520;
        this.height = rect.height || 400;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.createPath();
        this.flowers = [];
        this.initBackgroundElements();
    }

    createPath() {
        const midY = this.height * 0.55;
        const pad = this.width * 0.08;
        this.path = [
            { x: -pad, y: midY },
            { x: this.width * 0.2, y: midY - this.height * 0.18 },
            { x: this.width * 0.4, y: midY + this.height * 0.12 },
            { x: this.width * 0.6, y: midY - this.height * 0.1 },
            { x: this.width * 0.8, y: midY + this.height * 0.15 },
            { x: this.width + pad, y: midY }
        ];
    }

    resetGame() {
        this.bees = [];
        this.towers = [];
        this.projectiles = [];
        this.particles = [];
        this.honey = 150;
        this.lives = 20;
        this.wave = 1;
        this.beesPerWave = 10;
        this.totalSpawned = 0;
        this.spawnInterval = 1400;
        this.lastSpawn = 0;
        this.waveActive = false;
        this.waveTimer = 0;
        this.gameOver = false;
        this.updateHUD();
        this.updateWaveStatus(`Wave ${this.wave} ready`);
        this.setAlert('New game started. Place your friends!', 3000);
    }

    startWave() {
        if (this.waveActive || this.gameOver) return;
        this.waveActive = true;
        this.totalSpawned = 0;
        this.setAlert(`Wave ${this.wave} incoming! Defend the honey!`, 2000);
        this.updateWaveStatus(`Wave ${this.wave} in progress`);
    }

    upgradeSelectedTower() {
        if (this.hoveredTower === null || this.towers.length === 0) {
            this.setAlert('Hover over a tower to upgrade it.', 2000);
            return;
        }
        this.upgradeTower(this.hoveredTower);
    }

    upgradeTower(index) {
        const tower = this.towers[index];
        const def = this.towerDefs[tower.type];
        if (this.honey < def.upgradeCost) {
            this.setAlert(`Need ${def.upgradeCost}🍯 to upgrade ${def.name}`, 2000);
            return;
        }
        
        this.honey -= def.upgradeCost;
        tower.level++;
        tower.range *= 1.3;
        tower.fireRate *= 0.8;
        tower.damage += 0.5;
        
        // Create upgrade particles
        this.createSparkleParticles(tower.x, tower.y, 20, def.color);
        this.createUpgradeRing(tower.x, tower.y, tower.range);
        this.setAlert(`${def.name} upgraded to level ${tower.level}!`, 2000);
        this.updateHUD();
    }

    createUpgradeRing(x, y, radius) {
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            this.particles.push({
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: 0,
                vy: 0,
                size: 3,
                color: '#FFD700',
                life: 1,
                decay: 0.02,
                type: 'ring',
                angle: angle,
                radius: radius
            });
        }
    }

    createSparkleParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: color,
                life: 1,
                decay: 0.02 + Math.random() * 0.03,
                type: 'sparkle',
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            });
        }
    }

    createHoneyParticles(x, y, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 4,
                vy: -2 - Math.random() * 3,
                size: 2 + Math.random() * 3,
                color: '#FFAA00',
                life: 1,
                decay: 0.03,
                type: 'honey',
                gravity: 0.2
            });
        }
    }

    spawnBee() {
        const isBoss = this.totalSpawned === this.beesPerWave - 1 && this.wave % 3 === 0;
        const speedBoost = this.wave * 0.02;
        const bee = {
            t: 0,
            speed: (0.16 + Math.random() * 0.05 + speedBoost) * (isBoss ? 0.8 : 1),
            health: isBoss ? 5 + Math.floor(this.wave / 3) : 1,
            maxHealth: isBoss ? 5 + Math.floor(this.wave / 3) : 1,
            reward: isBoss ? 25 + Math.floor(this.wave / 2) : 6 + Math.floor(this.wave / 4),
            isBoss: isBoss,
            size: isBoss ? 1.8 : 1,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.05 + Math.random() * 0.05
        };
        this.bees.push(bee);
        this.totalSpawned += 1;

        if (this.totalSpawned >= this.beesPerWave) {
            this.waveTimer = this.waveCooldown;
        }
    }

    createProjectile(fromX, fromY, toX, toY, damage, color) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 4;
        
        this.projectiles.push({
            x: fromX,
            y: fromY,
            vx: (dx / dist) * speed,
            vy: (dy / dist) * speed,
            targetX: toX,
            targetY: toY,
            damage: damage,
            color: color,
            life: 100,
            trail: []
        });
    }

    tryPlaceTower(x, y) {
        const nearest = this.getNearestPointOnPath(x, y);
        if (!nearest || nearest.dist > this.height * 0.25) {
            this.setAlert('Friends prefer to stand near the honey path.', 2000);
            return;
        }

        const def = this.towerDefs[this.selectedTowerType];
        if (!def) return;

        if (this.honey < def.cost) {
            this.setAlert(`Need ${def.cost}🍯 for ${def.name}. You have ${this.honey}🍯.`, 2000);
            return;
        }

        for (const tower of this.towers) {
            const dx = tower.x - nearest.x;
            const dy = tower.y - nearest.y;
            if (Math.sqrt(dx * dx + dy * dy) < 40) {
                this.setAlert('Friends need a little more space between them.', 2000);
                return;
            }
        }

        this.honey -= def.cost;
        this.towers.push({
            x: nearest.x,
            y: nearest.y,
            type: this.selectedTowerType,
            range: Math.min(this.width, this.height) * def.rangeFactor,
            fireCooldown: 0,
            fireRate: def.rate,
            damage: def.damage,
            level: 1,
            color: def.color,
            icon: def.icon,
            bounce: Math.random() * Math.PI * 2
        });

        this.createSparkleParticles(nearest.x, nearest.y, 12, def.color);
        this.setAlert(`${def.name} has taken their place!`, 2000);
        this.updateHUD();
    }

    getNearestPointOnPath(x, y) {
        let best = null;
        const samples = 100;
        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            const p = this.getPointOnPath(t);
            const dx = p.x - x;
            const dy = p.y - y;
            const dist = Math.hypot(dx, dy);
            if (!best || dist < best.dist) {
                best = { x: p.x, y: p.y, t, dist };
            }
        }
        return best;
    }

    getPointOnPath(t) {
        const n = this.path.length - 1;
        if (n <= 0) return { x: 0, y: 0 };
        const scaled = t * n;
        const i = Math.min(n - 1, Math.floor(scaled));
        const local = scaled - i;
        const p0 = this.path[i];
        const p1 = this.path[i + 1];
        return {
            x: p0.x + (p1.x - p0.x) * local,
            y: p0.y + (p1.y - p0.y) * local
        };
    }

    update(dt) {
        if (this.gameOver) return;

        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > this.width + 100) {
                cloud.x = -100;
            }
        });

        // Update flowers
        this.flowers.forEach(flower => {
            flower.sway += flower.swaySpeed * dt;
        });

        if (this.waveActive) {
            this.lastSpawn += dt * 1000;
            if (this.lastSpawn > this.spawnInterval && this.totalSpawned < this.beesPerWave) {
                this.spawnBee();
                this.lastSpawn = 0;
            }

            if (this.totalSpawned >= this.beesPerWave && this.bees.length === 0) {
                this.waveTimer -= dt * 1000;
                if (this.waveTimer <= 0) {
                    this.wave++;
                    this.beesPerWave = Math.floor(10 + this.wave * 1.5);
                    this.waveActive = false;
                    const honeyReward = Math.floor(50 + this.wave * 5);
                    this.honey += honeyReward;
                    this.createHoneyParticles(this.width / 2, 30, 15);
                    this.setAlert(`Wave ${this.wave - 1} complete! +${honeyReward}🍯 earned!`, 3000);
                    this.updateWaveStatus(`Wave ${this.wave} ready`);
                    this.spawnInterval = Math.max(700, this.spawnInterval - 30);
                }
            }
        }

        for (let i = this.bees.length - 1; i >= 0; i--) {
            const bee = this.bees[i];
            bee.t += bee.speed * dt;
            bee.wobble += bee.wobbleSpeed * dt;
            
            if (bee.t >= 1) {
                this.bees.splice(i, 1);
                this.lives -= bee.isBoss ? 3 : 1;
                const pos = this.getPointOnPath(1);
                this.createSparkleParticles(pos.x, pos.y, bee.isBoss ? 20 : 8, '#FF4500');
                if (this.lives <= 0) {
                    this.endGame();
                }
                continue;
            }
        }

        this.towers.forEach(tower => {
            tower.fireCooldown -= dt;
            tower.bounce += 0.05 * dt;
            
            if (tower.fireCooldown <= 0) {
                let bestIdx = -1;
                let bestDist = Infinity;
                this.bees.forEach((bee, idx) => {
                    const pos = this.getPointOnPath(bee.t);
                    const dx = pos.x - tower.x;
                    const dy = pos.y - tower.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < tower.range && dist < bestDist) {
                        bestDist = dist;
                        bestIdx = idx;
                    }
                });

                if (bestIdx !== -1) {
                    const bee = this.bees[bestIdx];
                    const pos = this.getPointOnPath(bee.t);
                    this.createProjectile(tower.x, tower.y, pos.x, pos.y, tower.damage, tower.color);
                    tower.fireCooldown = tower.fireRate;
                    
                    // Create muzzle flash
                    this.createSparkleParticles(tower.x, tower.y, 3, tower.color);
                }
            }
        });

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            // Add to trail
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 5) {
                p.trail.shift();
            }

            for (let j = this.bees.length - 1; j >= 0; j--) {
                const bee = this.bees[j];
                const pos = this.getPointOnPath(bee.t);
                const dx = pos.x - p.x;
                const dy = pos.y - p.y;
                if (Math.hypot(dx, dy) < 15) {
                    bee.health -= p.damage;
                    this.createSparkleParticles(pos.x, pos.y, 6, p.color);
                    
                    if (bee.health <= 0) {
                        this.honey += bee.reward;
                        this.createSparkleParticles(pos.x, pos.y, bee.isBoss ? 20 : 12, '#FFD700');
                        this.createHoneyParticles(pos.x, pos.y, 8);
                        this.bees.splice(j, 1);
                    }
                    this.projectiles.splice(i, 1);
                    break;
                }
            }

            if (p.life <= 0) {
                this.projectiles.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            if (p.type === 'ring') {
                p.life -= p.decay;
                p.radius *= 1.02;
            } else if (p.type === 'honey') {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.life -= p.decay;
            } else if (p.type === 'sparkle') {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1;
                p.life -= p.decay;
                p.rotation += p.rotationSpeed;
            }
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        this.updateHUD();
        if (this.wave > this.highScore) {
            this.highScore = this.wave;
            this.updateHighScore();
        }
    }

    endGame() {
        this.gameOver = true;
        this.waveActive = false;
        this.setAlert(`Game over! You reached wave ${this.wave}. Press Start Wave to play again.`, 5000);
        this.updateWaveStatus('Game Over');
        if (this.wave > parseInt(localStorage.getItem('hiveDefenseHighScore') || '0')) {
            localStorage.setItem('hiveDefenseHighScore', this.wave.toString());
            this.updateHighScore();
        }
    }

    updateHUD() {
        if (this.dom.honeyEl) this.dom.honeyEl.textContent = this.honey;
        if (this.dom.livesEl) this.dom.livesEl.textContent = this.lives;
        if (this.dom.waveEl) this.dom.waveEl.textContent = this.wave;
    }

    updateHighScore() {
        if (this.dom.highScoreEl) {
            this.dom.highScoreEl.textContent = this.highScore;
        }
    }

    setAlert(text, duration = 3000) {
        if (!this.dom.alertEl) return;
        
        // Clear any existing timeout
        if (this.alertTimeout) {
            clearTimeout(this.alertTimeout);
            this.alertTimeout = null;
        }
        
        this.dom.alertEl.textContent = text;
        this.dom.alertEl.style.opacity = '1';
        
        if (duration > 0) {
            this.alertTimeout = setTimeout(() => {
                this.dom.alertEl.style.opacity = '0';
                this.alertTimeout = null;
            }, duration);
        }
    }

    updateWaveStatus(text) {
        if (!this.dom.waveStatusEl) return;
        this.dom.waveStatusEl.textContent = text;
    }

    drawBackground() {
        const ctx = this.ctx;
        
        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height * 0.6);
        skyGrad.addColorStop(0, '#87CEEB');
        skyGrad.addColorStop(0.6, '#B0D0E3');
        skyGrad.addColorStop(1, '#FFF7EC');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.width, this.height * 0.6);

        // Sun
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.width * 0.9, this.height * 0.15, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Sun glow
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(this.width * 0.9, this.height * 0.15, 30, 0, Math.PI * 2);
        ctx.fill();

        // Ground
        const groundGrad = ctx.createLinearGradient(0, this.height * 0.6, 0, this.height);
        groundGrad.addColorStop(0, '#8FBC8F');
        groundGrad.addColorStop(1, '#7B9C7B');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, this.height * 0.6, this.width, this.height * 0.4);

        // Distant hills
        ctx.fillStyle = '#2F4F2F';
        this.drawHill(ctx, this.width * 0.3, this.height * 0.6, 150, 60);
        this.drawHill(ctx, this.width * 0.7, this.height * 0.6, 120, 50);
        this.drawHill(ctx, this.width * 0.5, this.height * 0.6, 100, 40);
    }

    drawHill(ctx, x, y, width, height) {
        ctx.beginPath();
        ctx.moveTo(x - width/2, y);
        ctx.quadraticCurveTo(x, y - height, x + width/2, y);
        ctx.fill();
    }

    drawClouds() {
        const ctx = this.ctx;
        this.clouds.forEach(cloud => {
            ctx.save();
            ctx.globalAlpha = cloud.opacity;
            ctx.fillStyle = 'white';
            
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.4, cloud.y - cloud.size * 0.2, cloud.size * 0.4, 0, Math.PI * 2);
            ctx.arc(cloud.x - cloud.size * 0.3, cloud.y, cloud.size * 0.45, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }

    drawFlowers() {
        const ctx = this.ctx;
        this.flowers.forEach(flower => {
            ctx.save();
            ctx.translate(flower.x, flower.y);
            
            // Stem
            ctx.strokeStyle = '#2E8B57';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, flower.size * 2);
            ctx.stroke();
            
            // Flower with sway
            const sway = Math.sin(flower.sway) * 5;
            ctx.translate(sway, 0);
            
            // Petals
            ctx.fillStyle = flower.color;
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const petalX = Math.cos(angle) * flower.size;
                const petalY = Math.sin(angle) * flower.size;
                ctx.beginPath();
                ctx.ellipse(petalX, petalY, flower.size * 0.8, flower.size * 0.4, angle, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Center
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, flower.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }

    drawPath() {
        const ctx = this.ctx;
        
        // Path shadow
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
        ctx.lineWidth = Math.max(18, this.height * 0.1);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        this.path.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        
        // Main path
        ctx.strokeStyle = '#E6B86A';
        ctx.lineWidth = Math.max(16, this.height * 0.09);
        ctx.beginPath();
        this.path.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        
        // Path details
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.4)';
        ctx.lineWidth = Math.max(6, this.height * 0.025);
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        this.path.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Honey drops along path
        for (let i = 0; i < 5; i++) {
            const t = i / 5;
            const point = this.getPointOnPath(t + 0.1);
            ctx.fillStyle = 'rgba(255, 196, 43, 0.6)';
            ctx.beginPath();
            ctx.arc(point.x, point.y + Math.sin(Date.now() * 0.001 + i) * 3, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawTowers() {
        const ctx = this.ctx;
        this.towers.forEach((tower, index) => {
            const bounce = Math.sin(tower.bounce) * 3;
            
            // Range indicator on hover
            if (this.showingRange && this.hoveredTower === index) {
                ctx.beginPath();
                ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(176, 208, 227, 0.25)';
                ctx.fill();
                ctx.strokeStyle = tower.color;
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Level indicator
                ctx.fillStyle = tower.color;
                ctx.font = 'bold 14px "Patrick Hand"';
                ctx.textAlign = 'center';
                ctx.fillText(`Lvl ${tower.level}`, tower.x, tower.y - tower.range - 10);
            }
            
            ctx.save();
            ctx.translate(tower.x, tower.y + bounce);
            
            // Base platform
            ctx.fillStyle = '#9CAD90';
            ctx.beginPath();
            ctx.roundRect(-15, 5, 30, 10, 5);
            ctx.fill();
            
            // Character
            ctx.font = '32px "Segoe UI Emoji"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tower.icon, 0, -5);
            
            // Level badge
            if (tower.level > 1) {
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(12, -15, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#2f1a0e';
                ctx.font = 'bold 10px "Lato"';
                ctx.fillText(tower.level.toString(), 12, -15);
            }
            
            ctx.restore();
        });
    }

    drawBees() {
        const ctx = this.ctx;
        this.bees.forEach(bee => {
            const pos = this.getPointOnPath(bee.t);
            const wobbleX = Math.sin(bee.wobble) * 5;
            const wobbleY = Math.cos(bee.wobble * 1.5) * 3;
            const size = Math.max(8, this.width * 0.015) * bee.size;
            
            ctx.save();
            ctx.translate(pos.x + wobbleX, pos.y + wobbleY);
            
            // Body gradient
            const bodyGrad = ctx.createRadialGradient(-size*0.3, -size*0.3, 0, 0, 0, size);
            bodyGrad.addColorStop(0, bee.isBoss ? '#FF8C00' : '#FFD700');
            bodyGrad.addColorStop(1, bee.isBoss ? '#FF4500' : '#FFA500');
            
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, size * 1.2, size * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Stripes
            ctx.fillStyle = '#2f1a0e';
            ctx.fillRect(-size * 0.7, -size * 0.7, size * 0.3, size * 1.4);
            ctx.fillRect(-size * 0.15, -size * 0.8, size * 0.3, size * 1.6);
            
            // Wings
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            const wingFlap = Math.sin(Date.now() * 0.005 + bee.wobble) * 0.3;
            ctx.beginPath();
            ctx.ellipse(-size * 0.3, -size * 0.9 + wingFlap, size * 0.6, size * 0.9, -0.3, 0, Math.PI * 2);
            ctx.ellipse(size * 0.3, -size * 0.9 - wingFlap, size * 0.6, size * 0.9, 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            // Boss crown
            if (bee.isBoss) {
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.moveTo(-size * 0.8, -size * 1.2);
                ctx.lineTo(0, -size * 1.8);
                ctx.lineTo(size * 0.8, -size * 1.2);
                ctx.closePath();
                ctx.fill();
                
                ctx.fillStyle = '#8B4513';
                ctx.font = 'bold 12px "Lato"';
                ctx.textAlign = 'center';
                ctx.fillText('👑', 0, -size * 1.5);
            }
            
            // Health bar for boss
            if (bee.isBoss) {
                const healthWidth = size * 2;
                const healthHeight = 6;
                ctx.fillStyle = '#8B0000';
                ctx.fillRect(-healthWidth/2, -size * 1.5, healthWidth, healthHeight);
                ctx.fillStyle = '#32CD32';
                ctx.fillRect(-healthWidth/2, -size * 1.5, healthWidth * (bee.health / bee.maxHealth), healthHeight);
            }
            
            ctx.restore();
        });
    }

    drawProjectiles() {
        const ctx = this.ctx;
        this.projectiles.forEach(p => {
            // Draw trail
            ctx.strokeStyle = p.color + '60';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            p.trail.forEach((point, i) => {
                if (i === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
            
            // Draw projectile
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Glow
            ctx.fillStyle = p.color + '40';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawParticles() {
        const ctx = this.ctx;
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            
            if (p.type === 'ring') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.stroke();
            } else if (p.type === 'sparkle') {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                
                // Star shape
                ctx.fillStyle = p.color;
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2;
                    const radius = p.size;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
            } else if (p.type === 'honey') {
                // Honey drop
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }

    drawHUD() {
        const ctx = this.ctx;
        ctx.fillStyle = '#2f1a0e';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.font = `bold ${Math.max(14, this.width * 0.04)}px "Lato", system-ui`;
        ctx.fillText(`🍯: ${this.honey}`, 10, 8);
        
        // Lives with heart pulse
        const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 1;
        ctx.textAlign = 'center';
        ctx.fillStyle = this.lives > 10 ? '#32CD32' : this.lives > 5 ? '#FFA500' : '#FF4500';
        ctx.save();
        ctx.translate(this.width / 2, 8);
        ctx.scale(pulse, 1);
        ctx.fillText(`❤️: ${this.lives}`, 0, 0);
        ctx.restore();
        
        ctx.textAlign = 'right';
        ctx.fillStyle = '#2f1a0e';
        ctx.fillText(`Wave: ${this.wave}`, this.width - 10, 8);
        
        // Next wave timer
        if (this.waveTimer > 0 && this.totalSpawned >= this.beesPerWave) {
            ctx.fillStyle = '#8B4513';
            ctx.textAlign = 'center';
            ctx.font = `bold ${Math.max(12, this.width * 0.035)}px "Lato"`;
            ctx.fillText(`Next wave in: ${Math.ceil(this.waveTimer/1000)}s`, this.width/2, 30);
        }
    }

    loop(timestamp) {
        const t = timestamp || 0;
        const dt = this.lastTime ? (t - this.lastTime) / 1000 : 0.016;
        this.lastTime = t;

        this.update(dt);

        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawBackground();
        this.drawClouds();
        this.drawFlowers();
        this.drawPath();
        this.drawTowers();
        this.drawBees();
        this.drawProjectiles();
        this.drawParticles();
        this.drawHUD();

        requestAnimationFrame((time) => this.loop(time));
    }
}
