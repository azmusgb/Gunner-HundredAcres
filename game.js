// game.js - Honey Hunt Game (Enhanced Edition)
// This file contains all the enhanced game logic with improved bear animations and effects

(function () {
    "use strict";

    const STORAGE_KEYS = {
        BEST: "honeyHunt_bestScore_v2",
        GAMES: "honeyHunt_gamesPlayed_v2",
        SETTINGS: "honeyHunt_settings_v2",
        THEME: "honeyHunt_theme_v2"
    };

    const GAME_DURATION = 60;
    const MAX_LIVES = 3;

    const gameContainer = document.getElementById("gameContainer");
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    const scoreValue = document.getElementById("scoreValue");
    const bestValue = document.getElementById("bestValue");
    const timeValue = document.getElementById("timeValue");
    const streakValue = document.getElementById("streakValue");
    const livesValue = document.getElementById("livesValue");
    const streakBadge = document.getElementById("streakBadge");
    const comboIndicator = document.getElementById("comboIndicator");
    const powerupIndicator = document.getElementById("powerupIndicator");

    const startOverlay = document.getElementById("startOverlay");
    const pauseOverlay = document.getElementById("pauseOverlay");
    const gameOverOverlay = document.getElementById("gameOverOverlay");
    const startButton = document.getElementById("startButton");
    const resumeButton = document.getElementById("resumeButton");
    const restartButton = document.getElementById("restartButton");
    const overlayBest = document.getElementById("overlayBest");
    const overlayGames = document.getElementById("overlayGames");
    const finalScore = document.getElementById("finalScore");
    const finalBest = document.getElementById("finalBest");

    const helpToggle = document.getElementById("helpToggle");
    const helpToggleSecondary = document.getElementById("helpToggleSecondary");
    const helpPanel = document.getElementById("helpPanel");

    const settingsToggle = document.getElementById("settingsToggle");
    const settingsModal = document.getElementById("settingsModal");
    const settingsPanel = document.getElementById("settingsPanel");
    const settingsClose = document.getElementById("settingsClose");
    const musicToggle = document.getElementById("musicToggle");
    const sfxToggle = document.getElementById("sfxToggle");
    const diffButtons = Array.from(document.querySelectorAll(".diff-btn"));
    const resetProgress = document.getElementById("resetProgress");
    const settingsBest = document.getElementById("settingsBest");

    const themeToggle = document.getElementById("themeToggle");
    const fullscreenToggle = document.getElementById("fullscreenToggle");

    const liveRegion = document.getElementById("liveRegion");

    const keys = {
        left: false,
        right: false
    };

    let settingsState = {
        musicOn: false,
        sfxOn: false,
        difficulty: 1
    };

    let gameState = {
        running: false,
        paused: false,
        timeLeft: GAME_DURATION,
        score: 0,
        best: 0,
        gamesPlayed: 0,
        streak: 0,
        lives: MAX_LIVES,
        shieldTime: 0
    };

    const world = {
        width: 0,
        height: 0
    };

    const bear = {
        x: 0,
        y: 0,
        width: 40,
        height: 60,
        speed: 260,
        vx: 0,
        dir: 0,
        // Enhanced animation properties
        animation: {
            walkCycle: 0,
            bobPhase: 0,
            scaleX: 1,
            squashStretch: 1,
            isMoving: false,
            blinkTimer: 0,
            mood: "happy", // happy, worried, excited
            lastMoodChange: 0,
            celebrationTimer: 0
        }
    };

    const jars = [];
    const bees = [];
    const scorePopups = [];
    const particles = [];
    const bearTrail = [];

    let screenShake = {
        intensity: 0,
        duration: 0,
        timer: 0
    };

    let lastTimestamp = 0;
    let jarSpawnTimer = 0;
    let beeSpawnTimer = 0;

    // ==================== UTILITY FUNCTIONS ====================
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    function togglePause() {
        if (!gameState.running) return;
        if (gameState.paused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }

    // ==================== PERSISTENCE ====================
    function loadPersistedState() {
        try {
            const best = Number(localStorage.getItem(STORAGE_KEYS.BEST) || "0");
            const games = Number(localStorage.getItem(STORAGE_KEYS.GAMES) || "0");
            gameState.best = isFinite(best) ? best : 0;
            gameState.gamesPlayed = isFinite(games) ? games : 0;

            const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                settingsState = Object.assign(settingsState, parsed);
            }

            const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
            if (savedTheme === "dark") {
                document.body.classList.add("dark");
                themeToggle.setAttribute("aria-pressed", "true");
                themeToggle.innerHTML = '<i class="fas fa-sun" aria-hidden="true"></i><span>Theme</span>';
            }
        } catch (e) {
            console.warn("Failed to load saved state", e);
        }
    }

    function saveProgress() {
        try {
            localStorage.setItem(STORAGE_KEYS.BEST, String(gameState.best));
            localStorage.setItem(STORAGE_KEYS.GAMES, String(gameState.gamesPlayed));
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settingsState));
        } catch (e) {
            console.warn("Failed to save progress", e);
        }
    }

    // ==================== SCREEN SHAKE ====================
    function shakeScreen(intensity = 5, duration = 0.3) {
        screenShake.intensity = intensity;
        screenShake.duration = duration;
        screenShake.timer = duration;
    }

    // ==================== PARTICLE SYSTEM ====================
    function createJarParticles(x, y, type) {
        const colors = {
            normal: ["#facc15", "#eab308", "#fbbf24"],
            gold: ["#f97316", "#ea580c", "#fb923c"],
            shield: ["#38bdf8", "#0ea5e9", "#7dd3fc"]
        };

        const particleCount = type === "gold" ? 20 : type === "shield" ? 15 : 12;
        const colorSet = colors[type] || colors.normal;

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 120;
            const size = 3 + Math.random() * 4;

            particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 40,
                color: colorSet[Math.floor(Math.random() * colorSet.length)],
                life: 1,
                decay: 0.012 + Math.random() * 0.008,
                radius: size,
                gravity: 120,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }

        // Add sparkle particles for gold jars
        if (type === "gold") {
            for (let i = 0; i < 6; i++) {
                particles.push({
                    x,
                    y,
                    vx: (Math.random() - 0.5) * 60,
                    vy: -80 - Math.random() * 60,
                    color: "#ffffff",
                    life: 1,
                    decay: 0.02,
                    radius: 1.5,
                    gravity: 60
                });
            }
        }
    }

    function createBeeHitParticles(x, y, count = 16) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 90;

            particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: "#ef4444",
                life: 1,
                decay: 0.02,
                radius: 2 + Math.random() * 3,
                gravity: 100,
                rotation: Math.random() * Math.PI * 2
            });
        }
    }

    function updateParticles(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += (p.gravity || 200) * dt;
            p.life -= p.decay;

            if (p.rotation !== undefined) {
                p.rotation += (p.rotationSpeed || 0) * dt;
            }

            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function drawParticles() {
        for (const p of particles) {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;

            if (p.rotation !== undefined) {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.beginPath();
                ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // ==================== BEAR ANIMATION ====================
    function updateBearAnimation(dt) {
        const anim = bear.animation;

        // Walking animation
        if (bear.vx !== 0) {
            anim.isMoving = true;
            anim.walkCycle += Math.abs(bear.vx) * 0.01 * dt;
            anim.bobPhase += dt * 8;

            // Squash/stretch on direction change
            if (Math.sign(bear.vx) !== Math.sign(bear.dir) && bear.dir !== 0) {
                anim.squashStretch = 0.8;
            } else {
                anim.squashStretch = 1 + Math.sin(anim.walkCycle * 2) * 0.05;
            }
        } else {
            anim.isMoving = false;
            anim.squashStretch = 1 + Math.sin(performance.now() / 1000) * 0.02;
            anim.bobPhase += dt * 2;
        }

        // Blinking animation
        anim.blinkTimer -= dt;
        if (anim.blinkTimer <= 0) {
            anim.blinkTimer = 3 + Math.random() * 4;
        }

        // Mood based on game state
        const newMood = gameState.lives === 1 ? "worried" :
            gameState.streak >= 10 ? "excited" : "happy";

        if (newMood !== anim.mood) {
            anim.mood = newMood;
            anim.lastMoodChange = performance.now();
        }

        // Celebration timer for combos
        if (anim.celebrationTimer > 0) {
            anim.celebrationTimer -= dt;
        }

        // Direction flipping
        anim.scaleX = bear.dir < 0 ? -1 : 1;
    }

    function triggerBearCelebration() {
        bear.animation.celebrationTimer = 0.5;
        bear.animation.mood = "excited";

        // Jump animation
        bear.animation.squashStretch = 0.7;
        setTimeout(() => {
            bear.animation.squashStretch = 1.3;
        }, 100);
        setTimeout(() => {
            bear.animation.squashStretch = 1;
        }, 200);
    }

    // ==================== DRAWING FUNCTIONS ====================
    function drawBear() {
        const x = bear.x;
        const y = bear.y;
        const anim = bear.animation;

        ctx.save();
        ctx.translate(x, y);

        // Apply direction and squash/stretch
        ctx.scale(anim.scaleX * anim.squashStretch, 1 / anim.squashStretch);

        const bob = Math.sin(anim.bobPhase) * (anim.isMoving ? 4 : 2);
        const tilt = bear.vx * 0.01 * anim.scaleX;

        ctx.rotate(tilt);
        ctx.translate(0, bob);

        // Draw speed trail if moving fast
        if (anim.isMoving && Math.abs(bear.vx) > 150) {
            drawSpeedTrail(anim);
        }

        // Shadow with movement blur
        ctx.fillStyle = anim.isMoving ?
            `rgba(0, 0, 0, 0.2)` :
            `rgba(0, 0, 0, 0.15)`;

        ctx.beginPath();
        ctx.ellipse(0, 32,
            anim.isMoving ? 28 : 24,
            anim.isMoving ? 10 : 8,
            0, 0, Math.PI * 2);
        ctx.fill();

        // Body with gradient
        const bodyGradient = ctx.createLinearGradient(-25, -40, 25, 40);
        bodyGradient.addColorStop(0, "#fbbf24");
        bodyGradient.addColorStop(1, "#eab308");

        // Main body
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();

        // Walking animation - slight leaning
        const leanOffset = anim.isMoving ? Math.sin(anim.walkCycle * 2) * 3 : 0;

        // Bear body with more shape
        ctx.ellipse(leanOffset, -10, 25, 35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw bear components
        drawBearHead(anim);
        drawBearArms(anim);
        drawJarWithBear(anim);

        // Shield effect
        if (gameState.shieldTime > 0) {
            drawShieldEffect();
        }

        ctx.restore();
    }

    function drawBearHead(anim) {
        // Head
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(0, -28, 20, 0, Math.PI * 2);
        ctx.fill();

        // Ears with fluff
        drawEars(anim);

        // Face based on mood
        drawBearFace(anim);

        // Cheeks blush when excited
        if (anim.mood === "excited") {
            ctx.fillStyle = "rgba(255, 100, 100, 0.3)";
            ctx.beginPath();
            ctx.arc(-8, -22, 4, 0, Math.PI * 2);
            ctx.arc(8, -22, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawEars(anim) {
        // Left ear
        ctx.save();
        ctx.translate(-14, -38);
        ctx.rotate(Math.sin(anim.walkCycle) * 0.1);
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();

        // Inner ear
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Right ear
        ctx.save();
        ctx.translate(14, -38);
        ctx.rotate(-Math.sin(anim.walkCycle) * 0.1);
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();

        // Inner ear
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawBearFace(anim) {
        // Eyes with blinking
        const blink = anim.blinkTimer < 0.1 ? 0.1 : 1;

        ctx.fillStyle = "#1f2937";

        // Left eye
        ctx.save();
        ctx.translate(-8, -30);
        ctx.scale(1, blink);
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eye sparkle
        if (blink > 0.5) {
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(-1, -1, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Right eye
        ctx.save();
        ctx.translate(8, -30);
        ctx.scale(1, blink);
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eye sparkle
        if (blink > 0.5) {
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(-1, -1, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Mouth based on mood
        ctx.strokeStyle = "#1f2937";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";

        if (anim.mood === "happy") {
            // Smile
            ctx.beginPath();
            ctx.arc(0, -22, 6, 0.2, Math.PI - 0.2);
            ctx.stroke();
        } else if (anim.mood === "worried") {
            // Worried mouth
            ctx.beginPath();
            ctx.moveTo(-4, -20);
            ctx.quadraticCurveTo(0, -18, 4, -20);
            ctx.stroke();
        } else if (anim.mood === "excited") {
            // Open mouth (excited)
            ctx.fillStyle = "#dc2626";
            ctx.beginPath();
            ctx.ellipse(0, -21, 5, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Tongue
            ctx.fillStyle = "#fb7185";
            ctx.beginPath();
            ctx.ellipse(0, -19, 3, 2, 0, 0, Math.PI);
            ctx.fill();
        }
    }

    function drawBearArms(anim) {
        // Walking arm animation
        const armSwing = anim.isMoving ? Math.sin(anim.walkCycle * 4) * 15 : 0;

        // Left arm
        ctx.save();
        ctx.translate(-22, -15);
        ctx.rotate(armSwing * 0.03);
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.roundRect(-5, 0, 10, 25, 5);
        ctx.fill();

        // Paw
        ctx.fillStyle = "#d97706";
        ctx.beginPath();
        ctx.arc(0, 25, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Right arm
        ctx.save();
        ctx.translate(22, -15);
        ctx.rotate(-armSwing * 0.03);
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.roundRect(-5, 0, 10, 25, 5);
        ctx.fill();

        // Paw
        ctx.fillStyle = "#d97706";
        ctx.beginPath();
        ctx.arc(0, 25, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawJarWithBear(anim) {
        // Jar body with honey level that changes with streak
        const honeyLevel = Math.min(0.7 + (gameState.streak * 0.02), 0.95);

        // Jar outline
        ctx.fillStyle = "#b91c1c";
        ctx.beginPath();
        ctx.roundRect(-25, 0, 50, 40, 12);
        ctx.fill();

        // Honey fill with gradient
        const honeyGradient = ctx.createLinearGradient(-20, 40, -20, 40 - (40 * honeyLevel));
        honeyGradient.addColorStop(0, "#facc15");
        honeyGradient.addColorStop(1, "#eab308");

        ctx.fillStyle = honeyGradient;
        ctx.beginPath();
        ctx.roundRect(-20, 40 - (40 * honeyLevel), 40, 40 * honeyLevel, 8);
        ctx.fill();

        // Honey bubbles when excited
        if (anim.mood === "excited") {
            const bubbleTime = performance.now() / 200;
            for (let i = 0; i < 3; i++) {
                const bubbleY = 40 - (40 * honeyLevel) - 5;
                const bubbleX = (Math.sin(bubbleTime + i) * 10);
                const bubbleSize = 2 + Math.sin(bubbleTime * 2 + i) * 1;

                ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
                ctx.beginPath();
                ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Jar label with streak number
        ctx.fillStyle = "#78350f";
        ctx.font = "bold 12px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(gameState.streak > 0 ? `x${gameState.streak}` : "HONEY", 0, 20);

        // Jar lid
        ctx.fillStyle = "#92400e";
        ctx.beginPath();
        ctx.roundRect(-22, -5, 44, 10, 4);
        ctx.fill();

        // Jar gloss reflection
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.ellipse(0, 15, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawShieldEffect() {
        const pulse = 1 + Math.sin(performance.now() / 200) * 0.1;
        const alpha = 0.3 + Math.sin(performance.now() / 300) * 0.2;

        // Outer shield
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, -8, 45 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Inner shield
        ctx.strokeStyle = `rgba(96, 165, 250, ${alpha + 0.2})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -8, 40 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Rotating sparks
        const sparkTime = performance.now() / 500;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + sparkTime;
            const sx = Math.cos(angle) * 42;
            const sy = Math.sin(angle) * 42 - 8;

            // Spark trail
            ctx.strokeStyle = `rgba(96, 165, 250, 0.7)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx - Math.cos(angle) * 6, sy - Math.sin(angle) * 6);
            ctx.stroke();

            // Spark head
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.beginPath();
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawSpeedTrail(anim) {
        const trailCount = 5;
        for (let i = 0; i < trailCount; i++) {
            const alpha = 0.2 * (1 - i / trailCount);
            const offset = -i * 8 * anim.scaleX;

            ctx.save();
            ctx.translate(offset, 0);
            ctx.globalAlpha = alpha;

            // Simplified bear silhouette
            ctx.fillStyle = "#f59e0b";
            ctx.beginPath();
            ctx.arc(0, -28, 18, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.ellipse(0, -10, 22, 32, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    // ==================== GAME INITIALIZATION ====================
    function resizeCanvas() {
        const rect = gameContainer.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = rect.width;
        const height = rect.height;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        world.width = width;
        world.height = height;

        bear.y = world.height * 0.85;
        bear.x = clamp(bear.x || world.width / 2, 30, world.width - 30);
    }

    function resetGameState() {
        gameState.running = false;
        gameState.paused = false;
        gameState.timeLeft = GAME_DURATION;
        gameState.score = 0;
        gameState.streak = 0;
        gameState.lives = MAX_LIVES;
        gameState.shieldTime = 0;
        jars.length = 0;
        bees.length = 0;
        scorePopups.length = 0;
        particles.length = 0;
        bearTrail.length = 0;
        jarSpawnTimer = 0;
        beeSpawnTimer = 0;
        screenShake.timer = 0;

        bear.x = world.width / 2;
        bear.y = world.height * 0.85;

        // Reset bear animation
        bear.animation.walkCycle = 0;
        bear.animation.bobPhase = 0;
        bear.animation.scaleX = 1;
        bear.animation.squashStretch = 1;
        bear.animation.isMoving = false;
        bear.animation.mood = "happy";
        bear.animation.celebrationTimer = 0;
    }

    // ==================== GAME LOGIC ====================
    function difficultyConfig() {
        if (settingsState.difficulty === 0) {
            return {
                jarRate: 0.9,
                beeRate: 2.2,
                fallSpeed: 150
            };
        } else if (settingsState.difficulty === 2) {
            return {
                jarRate: 0.55,
                beeRate: 1.3,
                fallSpeed: 220
            };
        }
        return {
            jarRate: 0.7,
            beeRate: 1.7,
            fallSpeed: 190
        };
    }

    function spawnJar() {
        const {fallSpeed} = difficultyConfig();
        const x = rand(30, world.width - 30);
        const kindRand = Math.random();
        let type = "normal";
        let value = 10;
        if (kindRand > 0.85) {
            type = "gold";
            value = 30;
        } else if (kindRand > 0.7) {
            type = "shield";
            value = 15;
        }

        jars.push({
            x,
            y: -20,
            radius: 12,
            vy: fallSpeed + rand(-20, 20),
            type,
            value
        });
    }

    function spawnBee() {
        const {fallSpeed} = difficultyConfig();
        const x = Math.random() < 0.5 ? -30 : world.width + 30;
        const vy = fallSpeed * 0.7;
        const dir = x < 0 ? 1 : -1;
        bees.push({
            x,
            y: rand(world.height * 0.2, world.height * 0.7),
            vx: dir * rand(80, 140),
            vy,
            radius: 14
        });
    }

    function updateEntities(dt) {
        const {jarRate, beeRate} = difficultyConfig();

        jarSpawnTimer += dt;
        beeSpawnTimer += dt;

        const jarInterval = jarRate;
        const beeInterval = beeRate;

        while (jarSpawnTimer > jarInterval) {
            jarSpawnTimer -= jarInterval;
            spawnJar();
        }

        while (beeSpawnTimer > beeInterval) {
            beeSpawnTimer -= beeInterval;
            spawnBee();
        }

        const targetDir = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
        bear.dir = targetDir;
        bear.vx = bear.dir * bear.speed;
        bear.x = clamp(bear.x + bear.vx * dt, 26, world.width - 26);

        for (let i = jars.length - 1; i >= 0; i--) {
            const jar = jars[i];
            jar.y += jar.vy * dt;
            if (jar.y - jar.radius > world.height + 40) {
                jars.splice(i, 1);
                gameState.streak = 0;
            }
        }

        for (let i = bees.length - 1; i >= 0; i--) {
            const bee = bees[i];
            bee.x += bee.vx * dt;
            bee.y += bee.vy * dt * 0.04;

            if (bee.x < -60 || bee.x > world.width + 60 || bee.y > world.height + 40) {
                bees.splice(i, 1);
            }
        }

        if (gameState.shieldTime > 0) {
            gameState.shieldTime -= dt;
            if (gameState.shieldTime <= 0) {
                gameState.shieldTime = 0;
                powerupIndicator.classList.remove("visible");
            }
        }
    }

    function addScorePopup(amount, x, y, color) {
        scorePopups.push({
            amount: amount > 0 ? "+" + amount : String(amount),
            x,
            y,
            color,
            start: performance.now(),
            duration: 650
        });
    }

    function handleCollisions() {
        for (let i = jars.length - 1; i >= 0; i--) {
            const jar = jars[i];
            const dx = jar.x - bear.x;
            const dy = jar.y - (bear.y - 10);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < jar.radius + 26) {
                jars.splice(i, 1);
                let mult = 1 + Math.min(gameState.streak * 0.05, 1.5);
                let gain = Math.round(jar.value * mult);
                gameState.score += gain;
                gameState.streak += 1;

                const popColor = jar.type === "gold" ? "#f97316" : jar.type === "shield" ? "#38bdf8" : "#0f766e";
                addScorePopup(gain, bear.x, bear.y - 50, popColor);
                createJarParticles(jar.x, jar.y, jar.type);
                showComboIfNeeded();

                if (jar.type === "shield") {
                    gameState.shieldTime = 5;
                    powerupIndicator.classList.add("visible");
                    liveRegion.textContent = "Shield active for five seconds.";
                }
            }
        }

        for (let i = bees.length - 1; i >= 0; i--) {
            const bee = bees[i];
            const dx = bee.x - bear.x;
            const dy = bee.y - (bear.y - 10);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bee.radius + 24) {
                bees.splice(i, 1);
                if (gameState.shieldTime > 0) {
                    gameState.shieldTime = 0;
                    powerupIndicator.classList.remove("visible");
                    addScorePopup(0, bear.x, bear.y - 50, "#e5e7eb");
                    createJarParticles(bee.x, bee.y, "shield");
                    liveRegion.textContent = "Bee blocked by shield.";
                } else {
                    gameState.lives -= 1;
                    gameState.streak = 0;
                    createBeeHitParticles(bear.x, bear.y - 10);
                    shakeScreen(8, 0.4);
                    liveRegion.textContent = "Bee hit! Lives left: " + gameState.lives;
                    if (gameState.lives <= 0) {
                        endGame();
                        return;
                    }
                }
            }
        }
    }

    function triggerComboEffect() {
        // Create celebration particles
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: bear.x,
                y: bear.y - 30,
                vx: (Math.random() - 0.5) * 300,
                vy: -100 - Math.random() * 200,
                color: i < 10 ? "#f97316" : i < 20 ? "#facc15" : "#38bdf8",
                life: 1.5,
                decay: 0.01,
                radius: 3 + Math.random() * 4,
                gravity: 80
            });
        }

        triggerBearCelebration();
    }

    function showComboIfNeeded() {
        streakValue.textContent = String(gameState.streak);
        if (gameState.streak >= 5) {
            streakBadge.textContent = "Combo!";
            streakBadge.classList.add("visible");
        } else {
            streakBadge.classList.remove("visible");
        }

        if (gameState.streak > 0 && gameState.streak % 10 === 0) {
            comboIndicator.textContent = "x" + (1 + Math.floor(gameState.streak / 10)) + " Combo!";
            comboIndicator.classList.add("visible");
            triggerComboEffect();
            setTimeout(() => comboIndicator.classList.remove("visible"), 700);
        }
    }

    function drawJars() {
        for (const jar of jars) {
            ctx.save();
            ctx.translate(jar.x, jar.y);

            const rot = jar.y * 0.01;
            ctx.rotate(rot);

            let bodyColor = "#facc15";
            let glowColor = "rgba(250, 204, 21, 0.6)";
            if (jar.type === "gold") {
                bodyColor = "#f97316";
                glowColor = "rgba(249, 115, 22, 0.7)";
            }
            if (jar.type === "shield") {
                bodyColor = "#38bdf8";
                glowColor = "rgba(56, 189, 248, 0.7)";
            }

            ctx.shadowColor = glowColor;
            ctx.shadowBlur = jar.type === "gold" || jar.type === "shield" ? 12 : 6;

            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.roundRect(-10, -14, 20, 26, 6);
            ctx.fill();

            ctx.shadowBlur = 0;

            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.fillRect(-10, -18, 20, 6);

            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.beginPath();
            ctx.ellipse(-3, -8, 4, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
            ctx.fillRect(-6, -10, 12, 2);

            ctx.restore();
        }
    }

    function drawBees() {
        for (const bee of bees) {
            ctx.save();
            ctx.translate(bee.x, bee.y);

            const wingFlap = Math.sin(performance.now() / 80) * 0.3;

            ctx.fillStyle = "#facc15";
            ctx.beginPath();
            ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#111827";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-8, -3);
            ctx.lineTo(8, -3);
            ctx.moveTo(-8, 0);
            ctx.lineTo(8, 0);
            ctx.moveTo(-8, 3);
            ctx.lineTo(8, 3);
            ctx.stroke();

            ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
            ctx.save();
            ctx.translate(-6, -10);
            ctx.rotate(-0.8 + wingFlap);
            ctx.beginPath();
            ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.translate(6, -10);
            ctx.rotate(0.8 - wingFlap);
            ctx.beginPath();
            ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
            ctx.shadowBlur = 4;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(-6, -10, 9, 5, -0.8 + wingFlap, 0, Math.PI * 2);
            ctx.ellipse(6, -10, 9, 5, 0.8 - wingFlap, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = "#111827";
            ctx.beginPath();
            ctx.arc(8, -1, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    function drawScorePopups() {
        const now = performance.now();
        for (let i = scorePopups.length - 1; i >= 0; i--) {
            const p = scorePopups[i];
            const t = (now - p.start) / p.duration;
            if (t >= 1) {
                scorePopups.splice(i, 1);
                continue;
            }
            const easeOut = 1 - Math.pow(1 - t, 3);
            const y = p.y - easeOut * 40;
            const alpha = 1 - Math.pow(t, 2);
            const scale = 1 + Math.sin(t * Math.PI) * 0.2;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(p.x, y);
            ctx.scale(scale, scale);
            ctx.fillStyle = p.color;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
            ctx.lineWidth = 3;
            ctx.font = "bold 18px system-ui";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.strokeText(p.amount, 0, 0);
            ctx.fillText(p.amount, 0, 0);
            ctx.restore();
        }
    }

    function render() {
        ctx.clearRect(0, 0, world.width, world.height);

        // Apply screen shake
        if (screenShake.timer > 0) {
            screenShake.timer -= 1/60; // Approximate dt
        }

        const shakeX = screenShake.timer > 0 ?
            (Math.random() - 0.5) * screenShake.intensity * (screenShake.timer / screenShake.duration) : 0;
        const shakeY = screenShake.timer > 0 ?
            (Math.random() - 0.5) * screenShake.intensity * (screenShake.timer / screenShake.duration) : 0;

        ctx.save();
        ctx.translate(shakeX, shakeY);

        // Draw game elements
        drawParticles();
        drawJars();
        drawBees();
        drawBear();
        drawScorePopups();

        ctx.restore();
    }

    function updateHud() {
        scoreValue.textContent = String(gameState.score);
        bestValue.textContent = String(gameState.best);
        timeValue.textContent = String(Math.max(0, Math.floor(gameState.timeLeft)));
        streakValue.textContent = String(gameState.streak);
        if (livesValue) {
            const full = "♥".repeat(gameState.lives);
            const empty = "♡".repeat(MAX_LIVES - gameState.lives);
            livesValue.textContent = full + empty;
        }
    }

    function gameLoop(timestamp) {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const dt = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;

        if (gameState.running && !gameState.paused) {
            gameState.timeLeft -= dt;
            if (gameState.timeLeft <= 0) {
                gameState.timeLeft = 0;
                endGame();
            } else {
                updateBearAnimation(dt);
                updateEntities(dt);
                updateParticles(dt);
                handleCollisions();
            }
            updateHud();
        }

        render();
        requestAnimationFrame(gameLoop);
    }

    // ==================== OVERLAY MANAGEMENT ====================
    function showOverlay(overlay) {
        [startOverlay, pauseOverlay, gameOverOverlay].forEach(function (el) {
            if (!el) return;
            const isTarget = el === overlay;
            el.classList.toggle("visible", isTarget);
            el.setAttribute("aria-hidden", String(!isTarget));
        });
    }

    function hideOverlay(overlay) {
        if (!overlay) return;
        overlay.classList.remove("visible");
        overlay.setAttribute("aria-hidden", "true");
    }

    function startGame() {
        resetGameState();
        gameState.running = true;
        hideOverlay(startOverlay);
        hideOverlay(gameOverOverlay);
        hideOverlay(pauseOverlay);
        updateHud();
        liveRegion.textContent = "Game started. Catch the honey and avoid the bees.";
    }

    function pauseGame() {
        if (!gameState.running) return;
        gameState.paused = true;
        showOverlay(pauseOverlay);
        liveRegion.textContent = "Game paused.";
    }

    function resumeGame() {
        if (!gameState.running) return;
        gameState.paused = false;
        hideOverlay(pauseOverlay);
        liveRegion.textContent = "Game resumed.";
    }

    function endGame() {
        if (!gameState.running) return;
        gameState.running = false;
        gameState.paused = false;
        gameState.gamesPlayed += 1;

        if (gameState.score > gameState.best) {
            gameState.best = gameState.score;
            liveRegion.textContent = "New high score " + gameState.best + "!";
        } else {
            liveRegion.textContent = "Final score " + gameState.score + ".";
        }

        saveProgress();
        finalScore.textContent = String(gameState.score);
        finalBest.textContent = String(gameState.best);
        overlayBest.textContent = String(gameState.best);
        overlayGames.textContent = String(gameState.gamesPlayed);

        showOverlay(gameOverOverlay);
    }

    // ==================== UI CONTROLS ====================
    function toggleHelp() {
        const isOpen = helpPanel.classList.toggle("visible");
        helpPanel.setAttribute("aria-hidden", String(!isOpen));
        helpToggle.setAttribute("aria-expanded", String(isOpen));
        helpToggleSecondary.setAttribute("aria-expanded", String(isOpen));
    }

    function openSettings() {
        settingsModal.classList.add("visible");
        settingsToggle.setAttribute("aria-expanded", "true");
        settingsBest.textContent = String(gameState.best);
        settingsPanel.focus();
    }

    function closeSettings() {
        settingsModal.classList.remove("visible");
        settingsToggle.setAttribute("aria-expanded", "false");
    }

    function applySettingsToUi() {
        musicToggle.dataset.on = settingsState.musicOn ? "true" : "false";
        musicToggle.setAttribute("aria-pressed", String(settingsState.musicOn));
        sfxToggle.dataset.on = settingsState.sfxOn ? "true" : "false";
        sfxToggle.setAttribute("aria-pressed", String(settingsState.sfxOn));

        diffButtons.forEach(btn => {
            const level = Number(btn.dataset.level);
            btn.classList.toggle("active", level === settingsState.difficulty);
        });
    }

    function initTheme() {
        if (document.body.classList.contains("dark")) {
            themeToggle.setAttribute("aria-pressed", "true");
            themeToggle.innerHTML = '<i class="fas fa-sun" aria-hidden="true"></i><span>Theme</span>';
        } else {
            themeToggle.setAttribute("aria-pressed", "false");
            themeToggle.innerHTML = '<i class="fas fa-moon" aria-hidden="true"></i><span>Theme</span>';
        }
    }

    function isFullscreen() {
        return (
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
    }

    function enterFullscreen(el) {
        if (el.requestFullscreen) {
            el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
            el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
            el.msRequestFullscreen();
        }
    }

    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    function updateFullscreenButton() {
        const isFs = isFullscreen();
        const icon = isFs ? "fa-down-left-and-up-right-to-center" : "fa-up-right-and-down-left-from-center";
        const text = isFs ? "Exit Fullscreen" : "Fullscreen";

        fullscreenToggle.innerHTML = `<i class="fas ${icon}" aria-hidden="true"></i><span>${text}</span>`;
    }

    function initFullscreen() {
        fullscreenToggle.addEventListener("click", () => {
            if (isFullscreen()) {
                exitFullscreen();
            } else {
                enterFullscreen(gameContainer);
            }
        });

        document.addEventListener("fullscreenchange", () => {
            updateFullscreenButton();
            resizeCanvas();
        });

        document.addEventListener("webkitfullscreenchange", () => {
            updateFullscreenButton();
            resizeCanvas();
        });

        document.addEventListener("mozfullscreenchange", () => {
            updateFullscreenButton();
            resizeCanvas();
        });

        document.addEventListener("msfullscreenchange", () => {
            updateFullscreenButton();
            resizeCanvas();
        });

        updateFullscreenButton();

        document.addEventListener("keydown", (e) => {
            if (e.key === "F11") {
                e.preventDefault();
                if (isFullscreen()) {
                    exitFullscreen();
                } else {
                    enterFullscreen(gameContainer);
                }
            }
        });
    }

    function handleKeyDown(e) {
        if (e.key === "ArrowLeft") {
            keys.left = true;
        } else if (e.key === "ArrowRight") {
            keys.right = true;
        } else if (e.key === " " || e.code === "Space") {
            e.preventDefault();
            if (!gameState.running) {
                startGame();
            } else {
                togglePause();
            }
        } else if (e.key === "p" || e.key === "P") {
            e.preventDefault();
            togglePause();
        } else if (e.key === "Escape") {
            if (settingsModal.classList.contains("visible")) {
                closeSettings();
                e.preventDefault();
            }
            if (helpPanel.classList.contains("visible")) {
                toggleHelp();
                e.preventDefault();
            }
            if (isFullscreen()) {
                exitFullscreen();
                e.preventDefault();
            }
        }
    }

    function handleKeyUp(e) {
        if (e.key === "ArrowLeft") {
            keys.left = false;
        } else if (e.key === "ArrowRight") {
            keys.right = false;
        }
    }

    function bindPadButton(btn, direction) {
        if (!btn) return;

        const set = (pressed) => {
            btn.setAttribute("aria-pressed", String(pressed));
            if (direction === "left") {
                keys.left = pressed;
            } else if (direction === "right") {
                keys.right = pressed;
            }
        };

        btn.addEventListener("mousedown", (e) => {
            e.preventDefault();
            set(true);
        });

        btn.addEventListener("mouseup", (e) => {
            e.preventDefault();
            set(false);
        });

        btn.addEventListener("mouseleave", () => set(false));

        btn.addEventListener("touchstart", (e) => {
            e.preventDefault();
            set(true);
        });

        btn.addEventListener("touchend", (e) => {
            e.preventDefault();
            set(false);
        });

        btn.addEventListener("touchcancel", () => set(false));
    }

    function initControls() {
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        const hudPause = document.getElementById("pauseBtn");
        if (hudPause) {
            hudPause.onclick = (e) => {
                e.preventDefault();
                togglePause();
            };
        }

        const leftBtn = document.getElementById("btnLeft");
        const rightBtn = document.getElementById("btnRight");
        bindPadButton(leftBtn, "left");
        bindPadButton(rightBtn, "right");
    }

    function initSettings() {
        settingsToggle.addEventListener("click", openSettings);
        settingsClose.addEventListener("click", closeSettings);
        settingsModal.addEventListener("click", (e) => {
            if (e.target === settingsModal) {
                closeSettings();
            }
        });

        musicToggle.addEventListener("click", () => {
            settingsState.musicOn = !settingsState.musicOn;
            applySettingsToUi();
            saveProgress();
            liveRegion.textContent = "Music " + (settingsState.musicOn ? "enabled" : "disabled");
        });

        sfxToggle.addEventListener("click", () => {
            settingsState.sfxOn = !settingsState.sfxOn;
            applySettingsToUi();
            saveProgress();
            liveRegion.textContent = "Sound effects " + (settingsState.sfxOn ? "enabled" : "disabled");
        });

        diffButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                const level = Number(btn.dataset.level);
                settingsState.difficulty = level;
                applySettingsToUi();
                saveProgress();
                liveRegion.textContent = "Difficulty set to " + btn.textContent + ".";
            });
        });

        resetProgress.addEventListener("click", () => {
            if (confirm("Are you sure you want to reset all progress? This will delete your high score and games played.")) {
                gameState.best = 0;
                gameState.gamesPlayed = 0;
                saveProgress();
                settingsBest.textContent = "0";
                bestValue.textContent = "0";
                overlayBest.textContent = "0";
                overlayGames.textContent = "0";
                liveRegion.textContent = "Progress reset.";
            }
        });
    }

    function initTopbar() {
        themeToggle.addEventListener("click", () => {
            const isDark = document.body.classList.toggle("dark");
            localStorage.setItem(STORAGE_KEYS.THEME, isDark ? "dark" : "light");
            initTheme();
        });
        initTheme();
        initFullscreen();
    }

    function initOverlays() {
        startButton.addEventListener("click", startGame);
        resumeButton.addEventListener("click", resumeGame);
        restartButton.addEventListener("click", startGame);

        overlayBest.textContent = String(gameState.best);
        overlayGames.textContent = String(gameState.gamesPlayed);
    }

    function initHelp() {
        helpToggle.addEventListener("click", toggleHelp);
        helpToggleSecondary.addEventListener("click", toggleHelp);
    }

    // ==================== MAIN INITIALIZATION ====================
    function init() {
        console.log("Initializing Honey Hunt...");
        loadPersistedState();
        resizeCanvas();
        updateHud();
        applySettingsToUi();
        initControls();
        initSettings();
        initTopbar();
        initOverlays();
        initHelp();

        // Initialize bear animation
        bear.animation.blinkTimer = 1 + Math.random() * 2;

        window.addEventListener("resize", resizeCanvas);
        requestAnimationFrame(gameLoop);
        console.log("Honey Hunt initialized successfully!");
    }

    // Export functions for external use
    window.HoneyHuntGame = {
        startGame,
        pauseGame,
        resumeGame,
        endGame,
        togglePause,
        getScore: () => gameState.score,
        getBestScore: () => gameState.best,
        getGameState: () => ({...gameState}),
        getSettings: () => ({...settingsState}),
        isRunning: () => gameState.running,
        isPaused: () => gameState.paused
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();