// game.js - Honey Hunt Game (Complete Fixed Version - FULL RESTORED)
/* jshint esversion: 6 */

(function () {
    "use strict";

    const STORAGE_KEYS = {
        BEST: "honeyHunt_bestScore_v2",
        GAMES: "honeyHunt_gamesPlayed_v2",
        SETTINGS: "honeyHunt_settings_v2",
        THEME: "honeyHunt_theme_v2"
    };

    function getEl(...ids) {
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el) return el;
        }
        
        const placeholder = document.createElement('div');
        placeholder.id = `placeholder-${ids[0] || 'missing'}`;
        placeholder.style.cssText = 'display: none !important;';
        console.warn(`Element not found: ${ids.join(', ')}. Using placeholder.`);
        return placeholder;
    }

    const GAME_DURATION = 60;
    const MAX_LIVES = 3;
    const DIFFICULTY_LABELS = ["Chill", "Classic", "Spicy"];

    // Get all DOM elements
    const gameContainer = getEl("gameContainer", "gameEmbed");
    const existingCanvas = document.getElementById("gameCanvas");
    const canvas = existingCanvas || document.createElement("canvas");
    const ctx = canvas.getContext ? canvas.getContext("2d") : null;

    // HUD elements
    const scoreValue = getEl("scoreValue", "hudScore");
    const bestValue = getEl("bestValue", "hudBest");
    const timeValue = getEl("timeValue", "hudTime");
    const streakValue = getEl("streakValue", "hudStreak");
    const livesValue = getEl("livesValue", "hudLives");
    const streakBadge = getEl("streakBadge", "statusBadge");
    const comboIndicator = getEl("comboIndicator");
    const powerupIndicator = getEl("powerupIndicator");

    // Overlay elements
    const startOverlay = getEl("startOverlay");
    const pauseOverlay = getEl("pauseOverlay");
    const gameOverOverlay = getEl("gameOverOverlay");
    const startButton = getEl("startButton", "btnStart");
    const resumeButton = getEl("resumeButton", "btnPause");
    const restartButton = getEl("restartButton", "btnStart");
    const restartButton2 = getEl("restartButton2");
    const overlayBest = getEl("overlayBest", "hudBest");
    const overlayGames = getEl("overlayGames");
    const finalScore = getEl("finalScore");
    const finalBest = getEl("finalBest", "hudBest");

    // Settings elements
    const settingsToggle = getEl("settingsToggle");
    const settingsModal = getEl("settingsModal");
    const settingsPanel = getEl("settingsPanel");
    const settingsClose = getEl("settingsClose");
    const musicToggle = getEl("musicToggle");
    const sfxToggle = getEl("sfxToggle");
    const diffButtons = Array.from(document.querySelectorAll(".diff-btn"));
    const resetProgress = getEl("resetProgress");
    const settingsBest = getEl("settingsBest", "hudBest");

    // Theme and fullscreen
    const themeToggle = getEl("themeToggle");
    const fullscreenToggle = getEl("fullscreenToggle");
    const liveRegion = getEl("liveRegion");

    // Progress elements
    const timeProgress = getEl("timeProgress");
    const timeSubtitle = getEl("timeSubtitle");
    const streakProgress = getEl("streakProgress");
    const streakSubtitle = getEl("streakSubtitle");
    const sessionDifficulty = getEl("sessionDifficulty");
    const sessionGames = getEl("sessionGames");
    const sessionMood = getEl("sessionMood");

    // ==================== GAME STATE ====================
    let gameState = {
        running: false,
        paused: false,
        timeLeft: GAME_DURATION,
        score: 0,
        best: 0,
        gamesPlayed: 0,
        streak: 0,
        lives: MAX_LIVES,
        shieldTime: 0,
        activeEffects: {},
        stats: {
            jarsCaught: 0,
            beesAvoided: 0,
            consecutiveCatches: 0,
            highestCombo: 0,
            fastest5Catches: Infinity,
            lastCatchTime: 0,
            powerupsCollected: 0,
            goldJarsCaught: 0
        },
        achievements: [],
        currentEvolution: 0,
        dailyProgress: {}
    };

    // ==================== SETTINGS STATE ====================
    let settingsState = {
        musicOn: true,
        sfxOn: true,
        difficulty: 1
    };

    // ==================== GAME VARIABLES ====================
    const keys = {
        left: false,
        right: false
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
        animation: {
            walkCycle: 0,
            bobPhase: 0,
            scaleX: 1,
            squashStretch: 1,
            isMoving: false,
            blinkTimer: 0,
            mood: "happy",
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

    // ==================== POWER-UP SYSTEM ====================
    const POWERUPS = {
        DOUBLE_POINTS: {
            name: "Double Points",
            duration: 10,
            icon: "✖️2",
            color: "#fbbf24",
            effect: "doublePoints"
        },
        SLOW_TIME: {
            name: "Slow Time",
            duration: 8,
            icon: "⏱️",
            color: "#60a5fa",
            effect: "slowTime"
        },
        MAGNET: {
            name: "Magnet",
            duration: 12,
            icon: "🧲",
            color: "#ef4444",
            effect: "magnet",
            radius: 120
        },
        BEE_REPELLENT: {
            name: "Bee Repellent",
            duration: 15,
            icon: "🐝🚫",
            color: "#22c55e",
            effect: "beeRepellent"
        }
    };

    // ==================== BEAR EVOLUTIONS ====================
    const BEAR_EVOLUTIONS = [
        { score: 0, size: 1, color: "#fbbf24", hat: null, name: "Cub" },
        { score: 500, size: 1.1, color: "#f59e0b", hat: "cap", name: "Adventurer" },
        { score: 1000, size: 1.2, color: "#d97706", hat: "crown", name: "Champion" },
        { score: 2000, size: 1.3, color: "#92400e", hat: "majestic_crown", name: "Monarch" }
    ];

    // ==================== ACHIEVEMENTS ====================
    const ACHIEVEMENTS = [
        {
            id: "first_100",
            name: "Honey Starter",
            desc: "Score 100 points",
            icon: "🍯",
            condition: (score, stats) => score >= 100
        },
        {
            id: "perfect_50",
            name: "Untouched",
            desc: "Catch 50 jars without bee hits",
            icon: "👑",
            condition: (score, stats) => stats.consecutiveCatches >= 50
        },
        {
            id: "combo_master",
            name: "Combo King",
            desc: "Reach 15x combo",
            icon: "🔥",
            condition: (score, stats) => stats.highestCombo >= 15
        },
        {
            id: "speed_demon",
            name: "Speed Demon",
            desc: "Catch 5 jars in 3 seconds",
            icon: "⚡",
            condition: (score, stats) => stats.fastest5Catches <= 3
        },
        {
            id: "power_collector",
            name: "Power Collector",
            desc: "Collect 10 power-ups",
            icon: "✨",
            condition: (score, stats) => stats.powerupsCollected >= 10
        }
    ];

    // ==================== DAILY CHALLENGES ====================
    const DAILY_CHALLENGES = {
        monday: {
            objective: "Catch 30 gold jars",
            target: 30,
            type: "goldJars",
            reward: "Golden Bear Skin",
            active: true
        },
        tuesday: {
            objective: "Reach 20x combo",
            target: 20,
            type: "combo",
            reward: "Combo Master Title",
            active: true
        },
        wednesday: {
            objective: "Score 1000 points",
            target: 1000,
            type: "score",
            reward: "Crown Accessory",
            active: true
        },
        thursday: {
            objective: "Survive 45 seconds without hits",
            target: 45,
            type: "survival",
            reward: "Shield Power-up Pack",
            active: true
        },
        friday: {
            objective: "Collect 5 power-ups",
            target: 5,
            type: "powerups",
            reward: "Mega Magnet",
            active: true
        }
    };

    let dynamicDifficulty = {
        multiplier: 1,
        performanceHistory: [],
        lastAdjustment: 0
    };

    let tutorialState = {
        currentStep: 1,
        totalSteps: 4,
        completed: false
    };

    // ==================== UTILITY FUNCTIONS ====================
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    // ==================== ENHANCED AUDIO SYSTEM ====================
    let audioContext = null;
    let audioBuffers = {};
    let isAudioInitialized = false;
    let musicPlaying = false;
    let musicGainNode = null;

    const SOUNDS = {
        CATCH_NORMAL: 'catch_normal',
        CATCH_GOLD: 'catch_gold',
        CATCH_SHIELD: 'catch_shield',
        CATCH_POWERUP: 'catch_powerup',
        BEE_HIT: 'bee_hit',
        SHIELD_ACTIVATE: 'shield_activate',
        SHIELD_BLOCK: 'shield_block',
        POWERUP_ACTIVATE: 'powerup_activate',
        POWERUP_EXPIRE: 'powerup_expire',
        GAME_START: 'game_start',
        GAME_OVER: 'game_over',
        BUTTON_CLICK: 'button_click',
        COMBO_START: 'combo_start',
        STREAK_5: 'streak_5',
        STREAK_10: 'streak_10',
        EVOLUTION_UPGRADE: 'evolution_upgrade',
        ACHIEVEMENT_UNLOCK: 'achievement_unlock'
    };

    function initAudio() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioContext = new AudioContextClass();
                musicGainNode = audioContext.createGain();
                musicGainNode.connect(audioContext.destination);
                musicGainNode.gain.value = settingsState.musicOn ? 0.6 : 0;
                generateSoundEffects();
                console.log("Audio system initialized");
            }
        } catch (error) {
            console.warn("Audio initialization failed:", error);
        }
        isAudioInitialized = true;
    }

    function generateSoundEffects() {
        if (!audioContext) return;

        // Simple sound generators
        const createSound = (frequency, duration, type = 'sine', volume = 0.1) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            const currentTime = audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
            
            oscillator.start(currentTime);
            oscillator.stop(currentTime + duration);
            
            return { oscillator, gainNode, duration };
        };

        // Generate basic sounds
        audioBuffers[SOUNDS.CATCH_NORMAL] = () => createSound(523.25, 0.15, 'sine', 0.1);
        audioBuffers[SOUNDS.CATCH_GOLD] = () => createSound(659.25, 0.2, 'sine', 0.15);
        audioBuffers[SOUNDS.CATCH_SHIELD] = () => createSound(392.00, 0.25, 'sine', 0.15);
        audioBuffers[SOUNDS.CATCH_POWERUP] = () => createSound(783.99, 0.3, 'sine', 0.2);
        audioBuffers[SOUNDS.BEE_HIT] = () => createSound(220, 0.3, 'sawtooth', 0.2);
        audioBuffers[SOUNDS.SHIELD_ACTIVATE] = () => createSound(523.25, 0.4, 'sine', 0.15);
        audioBuffers[SOUNDS.SHIELD_BLOCK] = () => createSound(800, 0.2, 'square', 0.15);
        audioBuffers[SOUNDS.POWERUP_ACTIVATE] = () => createSound(1046.50, 0.5, 'sawtooth', 0.2);
        audioBuffers[SOUNDS.POWERUP_EXPIRE] = () => createSound(261.63, 0.4, 'sine', 0.15);
        audioBuffers[SOUNDS.GAME_START] = () => createSound(523.25, 0.6, 'sine', 0.15);
        audioBuffers[SOUNDS.GAME_OVER] = () => createSound(220, 0.8, 'sine', 0.2);
        audioBuffers[SOUNDS.BUTTON_CLICK] = () => createSound(800, 0.05, 'sine', 0.1);
        audioBuffers[SOUNDS.COMBO_START] = () => createSound(1046.50, 0.4, 'square', 0.2);
        audioBuffers[SOUNDS.STREAK_5] = () => createSound(659.25, 0.3, 'triangle', 0.15);
        audioBuffers[SOUNDS.STREAK_10] = () => createSound(1046.50, 0.4, 'triangle', 0.18);
        audioBuffers[SOUNDS.EVOLUTION_UPGRADE] = () => createSound(1318.51, 0.4, 'triangle', 0.15);
        audioBuffers[SOUNDS.ACHIEVEMENT_UNLOCK] = () => createSound(1567.98, 0.35, 'sine', 0.15);
    }

    function playSound(soundType) {
        if (!settingsState.sfxOn || !isAudioInitialized || !audioContext || audioContext.state === 'suspended') return;
        
        const soundGenerator = audioBuffers[soundType];
        if (soundGenerator) {
            try {
                soundGenerator();
            } catch (error) {
                console.warn("Failed to play sound:", soundType, error);
            }
        }
    }

    function playCatchSound(jarType) {
        switch(jarType) {
            case 'gold':
                playSound(SOUNDS.CATCH_GOLD);
                break;
            case 'shield':
                playSound(SOUNDS.CATCH_SHIELD);
                break;
            case 'powerup':
                playSound(SOUNDS.CATCH_POWERUP);
                break;
            default:
                playSound(SOUNDS.CATCH_NORMAL);
        }
    }

    function playBeeHitSound() {
        playSound(SOUNDS.BEE_HIT);
    }

    function playButtonClickSound() {
        playSound(SOUNDS.BUTTON_CLICK);
    }

    function playGameStartSound() {
        playSound(SOUNDS.GAME_START);
    }

    function playGameOverSound() {
        playSound(SOUNDS.GAME_OVER);
    }

    function playShieldBlockSound() {
        playSound(SOUNDS.SHIELD_BLOCK);
    }

    function playPowerupActivateSound() {
        playSound(SOUNDS.POWERUP_ACTIVATE);
    }

    function playPowerupExpireSound() {
        playSound(SOUNDS.POWERUP_EXPIRE);
    }

    function playComboSound() {
        playSound(SOUNDS.COMBO_START);
    }

    function playStreakSound(streak) {
        if (streak === 5) {
            playSound(SOUNDS.STREAK_5);
        } else if (streak === 10) {
            playSound(SOUNDS.STREAK_10);
        }
    }

    function playEvolutionSound() {
        playSound(SOUNDS.EVOLUTION_UPGRADE);
    }

    function playAchievementSound() {
        playSound(SOUNDS.ACHIEVEMENT_UNLOCK);
    }

    // ==================== ENHANCED BACKGROUND MUSIC ====================
    function startBackgroundMusic() {
        if (!settingsState.musicOn || musicPlaying || !audioContext) return;
        
        musicPlaying = true;
        playBackgroundMusicLoop();
    }

    function playBackgroundMusicLoop() {
        if (!musicPlaying || !settingsState.musicOn || !audioContext) return;
        
        const melody = [
            { note: 'C4', duration: 0.5 },
            { note: 'E4', duration: 0.5 },
            { note: 'G4', duration: 0.5 },
            { note: 'C5', duration: 0.75 },
            { note: 'G4', duration: 0.25 },
            { note: 'E4', duration: 0.5 },
            { note: 'C4', duration: 0.5 },
            { note: 'G3', duration: 1 }
        ];

        const noteToFrequency = {
            'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77
        };

        let currentTime = audioContext.currentTime;

        melody.forEach(({ note, duration }) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(musicGainNode);
            
            oscillator.frequency.value = noteToFrequency[note];
            oscillator.type = 'triangle';
            
            const fadeTime = 0.05;
            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(0.12, currentTime + fadeTime);
            gainNode.gain.setValueAtTime(0.12, currentTime + duration - fadeTime);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);
            
            oscillator.start(currentTime);
            oscillator.stop(currentTime + duration);
            
            currentTime += duration;
        });

        setTimeout(() => {
            if (musicPlaying && settingsState.musicOn) {
                playBackgroundMusicLoop();
            }
        }, (currentTime - audioContext.currentTime) * 1000);
    }

    function stopBackgroundMusic() {
        musicPlaying = false;
        if (musicGainNode) {
            musicGainNode.gain.value = 0;
        }
    }

    // ==================== GAME LOOP ====================
    function gameLoop(timestamp) {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const dt = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;
        
        if (gameState.running && !gameState.paused) {
            updateEntities(dt);
            handleCollisions();
            updateBearAnimation(dt);
            updateParticles(dt);
            updateBearTrail(dt);
            updatePowerups(dt);
            updateDynamicDifficulty();
            checkAchievements();
            updateDailyChallengeProgress();
            checkEvolutionUpgrade();
            
            gameState.timeLeft -= dt;
            if (gameState.timeLeft <= 0) {
                endGame();
            }
        }
        
        updateHud();
        render();
        
        if (gameState.running || particles.length > 0) {
            requestAnimationFrame(gameLoop);
        }
    }

    // ==================== GAME LOGIC ====================
    function difficultyConfig() {
        const baseConfig = { jarRate: 0.7, beeRate: 1.7, fallSpeed: 190 };
        if (settingsState.difficulty === 0) {
            baseConfig.jarRate = 0.9;
            baseConfig.beeRate = 2.2;
            baseConfig.fallSpeed = 150;
        }
        else if (settingsState.difficulty === 2) {
            baseConfig.jarRate = 0.55;
            baseConfig.beeRate = 1.3;
            baseConfig.fallSpeed = 220;
        }
        return {
            jarRate: baseConfig.jarRate / dynamicDifficulty.multiplier,
            beeRate: baseConfig.beeRate * dynamicDifficulty.multiplier,
            fallSpeed: baseConfig.fallSpeed * dynamicDifficulty.multiplier
        };
    }

    function spawnJar() {
        const { fallSpeed } = difficultyConfig();
        const x = rand(30, world.width - 30);
        const kindRand = Math.random();
        let type = "normal";
        let value = 10;

        if (kindRand > 0.95) {
            type = "powerup";
            const powerupTypes = Object.keys(POWERUPS);
            value = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        } else if (kindRand > 0.85) {
            type = "gold";
            value = 30;
        } else if (kindRand > 0.7) {
            type = "shield";
            value = 15;
        }

        jars.push({
            x,
            y: -20,
            radius: type === "powerup" ? 16 : 12,
            vy: fallSpeed + rand(-20, 20),
            type,
            value
        });
    }

    function spawnBee() {
        const { fallSpeed } = difficultyConfig();
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
        const timeScale = gameState.activeEffects.SLOW_TIME ? 0.5 : 1;
        const scaledDt = dt * timeScale;

        const { jarRate, beeRate } = difficultyConfig();

        jarSpawnTimer += scaledDt;
        beeSpawnTimer += scaledDt;

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
        bear.vx = bear.dir * bear.speed * timeScale;
        bear.x = clamp(bear.x + bear.vx * dt, 26, world.width - 26);

        for (let i = jars.length - 1; i >= 0; i--) {
            const jar = jars[i];
            jar.y += jar.vy * scaledDt;
            if (jar.y - jar.radius > world.height + 40) {
                jars.splice(i, 1);
                gameState.streak = 0;
                gameState.stats.consecutiveCatches = 0;
            }
        }

        for (let i = bees.length - 1; i >= 0; i--) {
            const bee = bees[i];
            bee.x += bee.vx * scaledDt;
            bee.y += bee.vy * scaledDt * 0.04;

            if (bee.x < -60 || bee.x > world.width + 60 || bee.y > world.height + 40) {
                bees.splice(i, 1);
            }
        }

        if (gameState.shieldTime > 0) {
            gameState.shieldTime -= dt;
            if (gameState.shieldTime <= 0) {
                gameState.shieldTime = 0;
                if (powerupIndicator) powerupIndicator.classList.remove("visible");
            }
        }

        updatePowerups(dt);
    }

    function handleCollisions() {
        // Magnet effect
        if (gameState.activeEffects.MAGNET) {
            const magnetRadius = gameState.activeEffects.MAGNET.radius || 120;
            for (let i = jars.length - 1; i >= 0; i--) {
                const jar = jars[i];
                const dx = jar.x - bear.x;
                const dy = jar.y - (bear.y - 10);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < magnetRadius) {
                    const speed = 300;
                    const angle = Math.atan2(bear.y - 10 - jar.y, bear.x - jar.x);
                    jar.x += Math.cos(angle) * speed * (1/60);
                    jar.y += Math.sin(angle) * speed * (1/60);
                }
            }
        }

        // Bee repellent effect
        if (gameState.activeEffects.BEE_REPELLENT) {
            for (let i = bees.length - 1; i >= 0; i--) {
                const bee = bees[i];
                const dx = bee.x - bear.x;
                const dy = bee.y - (bear.y - 10);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    const angle = Math.atan2(bee.y - (bear.y - 10), bee.x - bear.x);
                    bee.x += Math.cos(angle) * 200 * (1/60);
                    bee.y += Math.sin(angle) * 200 * (1/60);
                }
            }
        }

        // Jar collisions
        for (let i = jars.length - 1; i >= 0; i--) {
            const jar = jars[i];
            const dx = jar.x - bear.x;
            const dy = jar.y - (bear.y - 10);
            const dist = Math.sqrt(dx * dx + dy * dy);
            const collisionRadius = jar.type === "powerup" ? 30 : 26;

            if (dist < jar.radius + collisionRadius) {
                jars.splice(i, 1);

                if (jar.type === "powerup") {
                    activatePowerup(jar.value);
                    createJarParticles(jar.x, jar.y, "powerup");
                    if (liveRegion) liveRegion.textContent = `Collected ${POWERUPS[jar.value].name} power-up!`;
                    addScorePopup("POWER UP!", bear.x, bear.y - 50, POWERUPS[jar.value].color, "powerup");
                    playSound(SOUNDS.CATCH_POWERUP);
                    continue;
                }

                let mult = 1 + Math.min(gameState.streak * 0.05, 1.5);
                if (gameState.activeEffects.DOUBLE_POINTS) mult *= 2;
                let gain = Math.round(jar.value * mult);
                gameState.score += gain;
                gameState.streak += 1;
                gameState.stats.jarsCaught++;
                gameState.stats.consecutiveCatches++;
                if (gameState.streak > gameState.stats.highestCombo) {
                    gameState.stats.highestCombo = gameState.streak;
                }
                if (jar.type === "gold") gameState.stats.goldJarsCaught++;
                
                const now = performance.now() / 1000;
                if (gameState.stats.lastCatchTime > 0) {
                    const timeDiff = now - gameState.stats.lastCatchTime;
                    if (gameState.stats.consecutiveCatches >= 5) {
                        const catchTime = timeDiff * 5;
                        if (catchTime < gameState.stats.fastest5Catches) {
                            gameState.stats.fastest5Catches = catchTime;
                        }
                    }
                }
                gameState.stats.lastCatchTime = now;
                
                const type = jar.type === "gold" ? "gold" : jar.type === "shield" ? "shield" : gameState.streak >= 10 ? "combo" : "normal";
                const popColor = jar.type === "gold" ? "#f97316" : jar.type === "shield" ? "#38bdf8" : gameState.streak >= 10 ? "#f97316" : "#0f766e";
                addScorePopup(gain, bear.x, bear.y - 50, popColor, type);
                createJarParticles(jar.x, jar.y, jar.type);
                playCatchSound(jar.type);

                if (gameState.streak === 5 || gameState.streak === 10) {
                    playStreakSound(gameState.streak);
                }

                showComboIfNeeded();

                if (jar.type === "shield") {
                    gameState.shieldTime = 5;
                    if (powerupIndicator) powerupIndicator.classList.add("visible");
                    if (liveRegion) liveRegion.textContent = "Shield active for five seconds.";
                    playSound(SOUNDS.SHIELD_ACTIVATE);
                }
            }
        }

        // Bee collisions
        for (let i = bees.length - 1; i >= 0; i--) {
            const bee = bees[i];
            const dx = bee.x - bear.x;
            const dy = bee.y - (bear.y - 10);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bee.radius + 24) {
                bees.splice(i, 1);
                if (gameState.shieldTime > 0) {
                    gameState.shieldTime = 0;
                    if (powerupIndicator) powerupIndicator.classList.remove("visible");
                    createJarParticles(bee.x, bee.y, "shield");
                    if (liveRegion) liveRegion.textContent = "Bee blocked by shield.";
                    playShieldBlockSound();
                } else {
                    gameState.lives -= 1;
                    gameState.streak = 0;
                    gameState.stats.consecutiveCatches = 0;
                    createBeeHitParticles(bear.x, bear.y - 10);
                    shakeScreen(8, 0.4);
                    if (liveRegion) liveRegion.textContent = "Bee hit! Lives left: " + gameState.lives;
                    playBeeHitSound();
                    if (gameState.lives <= 0) {
                        endGame();
                        return;
                    }
                }
            }
        }
    }

    // ==================== ENHANCED RENDERING ====================
    function render() {
        ctx.clearRect(0, 0, world.width, world.height);

        if (screenShake.timer > 0) {
            screenShake.timer -= 1/60;
        }

        const shakeX = screenShake.timer > 0 ?
            (Math.random() - 0.5) * screenShake.intensity * (screenShake.timer / screenShake.duration) : 0;
        const shakeY = screenShake.timer > 0 ?
            (Math.random() - 0.5) * screenShake.intensity * (screenShake.timer / screenShake.duration) : 0;

        ctx.save();
        ctx.translate(shakeX, shakeY);

        drawParticles();
        drawBearTrail();
        drawJars();
        drawBees();
        drawBear();
        drawMagnetEffect();
        drawScorePopups();

        ctx.restore();
    }

    // ==================== ENHANCED BEAR DRAWING ====================
    function drawBear() {
        const x = bear.x;
        const y = bear.y;
        const anim = bear.animation;
        const evolution = BEAR_EVOLUTIONS[gameState.currentEvolution];

        ctx.save();
        ctx.translate(x, y);

        if (evolution && evolution.size) {
            ctx.scale(evolution.size, evolution.size);
        }

        ctx.scale(anim.scaleX * anim.squashStretch, 1 / anim.squashStretch);

        const bob = Math.sin(anim.bobPhase) * (anim.isMoving ? 4 : 2);
        const tilt = bear.vx * 0.01 * anim.scaleX;

        ctx.rotate(tilt);
        ctx.translate(0, bob);

        // Shadow
        ctx.fillStyle = anim.isMoving ?
            `rgba(0, 0, 0, 0.25)` :
            `rgba(0, 0, 0, 0.2)`;
        ctx.beginPath();
        ctx.ellipse(0, 40,
            anim.isMoving ? 32 : 28,
            anim.isMoving ? 12 : 10,
            0, 0, Math.PI * 2);
        ctx.fill();

        // Body with Pooh's classic red shirt
        ctx.fillStyle = "#e02828";
        ctx.beginPath();
        const leanOffset = anim.isMoving ? Math.sin(anim.walkCycle * 2) * 3 : 0;
        ctx.ellipse(leanOffset, 0, 32, 42, 0, 0, Math.PI * 2);
        ctx.fill();

        // Evolution hat
        if (evolution && evolution.hat) {
            drawEvolutionHat(evolution.hat);
        }

        // Enhanced head
        drawBearHead(anim);

        // Arms
        drawBearArms(anim);

        // Honey jar
        drawJarWithBear(anim);

        // Additional Pooh details
        drawPoohDetails(anim);

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
        ctx.ellipse(0, -30, 24, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(-18, -40, 10, 0, Math.PI * 2);
        ctx.arc(18, -40, 10, 0, Math.PI * 2);
        ctx.fill();

        // Inner ears
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        ctx.arc(-18, -40, 6, 0, Math.PI * 2);
        ctx.arc(18, -40, 6, 0, Math.PI * 2);
        ctx.fill();

        // Face
        drawPoohFace(anim);

        // Neck and shirt collar
        ctx.fillStyle = "#e02828";
        ctx.beginPath();
        ctx.arc(0, -10, 18, 0.2, Math.PI - 0.2);
        ctx.fill();

        ctx.fillStyle = "#b91c1c";
        ctx.beginPath();
        ctx.ellipse(0, -8, 20, 5, 0, 0, Math.PI);
        ctx.fill();
    }

    function drawPoohFace(anim) {
        const blink = anim.blinkTimer < 0.1 ? 0.1 : 1;
        const isExcited = anim.mood === "excited";
        const isWorried = anim.mood === "worried";

        // Eyes
        ctx.fillStyle = "#1f2937";
        
        // Left eye
        ctx.save();
        ctx.translate(-8, -28);
        ctx.scale(1, blink);
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        if (blink > 0.5) {
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(-1, -1, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Right eye
        ctx.save();
        ctx.translate(8, -28);
        ctx.scale(1, blink);
        ctx.fillStyle = "#1f2937";
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        if (blink > 0.5) {
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(-1, -1, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Nose
        ctx.fillStyle = "#1f2937";
        ctx.beginPath();
        ctx.arc(0, -20, 5, 0, Math.PI * 2);
        ctx.fill();

        // Nose highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.arc(-1, -21, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Mouth based on mood
        ctx.strokeStyle = "#1f2937";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";

        if (isExcited) {
            ctx.beginPath();
            ctx.arc(0, -15, 8, 0.1, Math.PI - 0.1);
            ctx.stroke();
            
            ctx.fillStyle = "#fb7185";
            ctx.beginPath();
            ctx.ellipse(0, -8, 4, 3, 0, 0, Math.PI);
            ctx.fill();
        } else if (isWorried) {
            ctx.beginPath();
            ctx.moveTo(-5, -15);
            ctx.quadraticCurveTo(0, -12, 5, -15);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(-2, -18);
            ctx.lineTo(-2, -16);
            ctx.moveTo(2, -18);
            ctx.lineTo(2, -16);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(0, -15, 6, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }

        // Cheeks blush when excited
        if (isExcited) {
            ctx.fillStyle = "rgba(255, 100, 100, 0.4)";
            ctx.beginPath();
            ctx.arc(-10, -20, 3, 0, Math.PI * 2);
            ctx.arc(10, -20, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawBearArms(anim) {
        const armSwing = anim.isMoving ? Math.sin(anim.walkCycle * 4) * 20 : 0;

        // Left arm
        ctx.save();
        ctx.translate(-26, -8);
        ctx.rotate(armSwing * 0.04);

        ctx.fillStyle = "#e02828";
        ctx.beginPath();
        ctx.roundRect(-6, 0, 12, 28, 6);
        ctx.fill();

        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.roundRect(-5, 28, 10, 10, 5);
        ctx.fill();

        ctx.fillStyle = "#d97706";
        ctx.beginPath();
        ctx.arc(0, 38, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Right arm
        ctx.save();
        ctx.translate(26, -8);
        ctx.rotate(-armSwing * 0.04);

        ctx.fillStyle = "#e02828";
        ctx.beginPath();
        ctx.roundRect(-6, 0, 12, 28, 6);
        ctx.fill();

        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.roundRect(-5, 28, 10, 10, 5);
        ctx.fill();

        ctx.fillStyle = "#d97706";
        ctx.beginPath();
        ctx.arc(0, 38, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    function drawJarWithBear(anim) {
        const honeyLevel = Math.min(0.7 + (gameState.streak * 0.02), 0.95);

        // Jar outline
        ctx.fillStyle = "#7c2d12";
        ctx.beginPath();
        ctx.roundRect(-22, 10, 44, 50, 15);
        ctx.fill();

        // Jar glass with gradient
        const jarGradient = ctx.createLinearGradient(-20, 60, -20, 10);
        jarGradient.addColorStop(0, "rgba(254, 215, 170, 0.7)");
        jarGradient.addColorStop(0.3, "rgba(253, 186, 116, 0.9)");
        jarGradient.addColorStop(1, "rgba(251, 146, 60, 0.95)");

        ctx.fillStyle = jarGradient;
        ctx.beginPath();
        ctx.roundRect(-18, 60 - (50 * honeyLevel), 36, 50 * honeyLevel, 12);
        ctx.fill();

        // Honey bubbles
        const bubbleTime = performance.now() / 300;
        for (let i = 0; i < 5; i++) {
            const bubbleY = 60 - (50 * honeyLevel) + Math.sin(bubbleTime + i) * 3;
            const bubbleX = (Math.cos(bubbleTime * 1.5 + i) * 8);
            const bubbleSize = 2 + Math.sin(bubbleTime * 2 + i) * 1.5;

            ctx.fillStyle = "rgba(255, 237, 213, 0.7)";
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Jar label
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.roundRect(-15, 25, 30, 20, 8);
        ctx.fill();

        // Label text
        ctx.fillStyle = "#78350f";
        ctx.font = "bold 14px 'Comic Sans MS', cursive";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Pooh's", 0, 30);
        ctx.fillText("Honey", 0, 40);

        // Jar lid
        ctx.fillStyle = "#92400e";
        ctx.beginPath();
        ctx.roundRect(-20, 5, 40, 12, 6);
        ctx.fill();

        // Lid highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.beginPath();
        ctx.roundRect(-18, 6, 36, 4, 3);
        ctx.fill();

        // Jar gloss reflection
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.beginPath();
        ctx.ellipse(5, 40, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawPoohDetails(anim) {
        // Shirt buttons
        ctx.fillStyle = "#fbbf24";
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.arc(0, 5 + (i * 15), 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            ctx.beginPath();
            ctx.arc(-1, 4 + (i * 15), 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fbbf24";
        }

        // Belly fur
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        ctx.ellipse(0, 10, 20, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.ellipse(-12, 35, 8, 6, 0, 0, Math.PI * 2);
        ctx.ellipse(12, 35, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Feet
        ctx.fillStyle = "#d97706";
        ctx.beginPath();
        ctx.ellipse(-12, 42, 6, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(12, 42, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawShieldEffect() {
        const pulse = 1 + Math.sin(performance.now() / 200) * 0.1;
        const alpha = 0.4 + Math.sin(performance.now() / 300) * 0.3;

        // Outer shield
        const shieldGradient = ctx.createRadialGradient(0, -5, 0, 0, -5, 50 * pulse);
        shieldGradient.addColorStop(0, "rgba(251, 191, 36, 0.6)");
        shieldGradient.addColorStop(1, "rgba(251, 191, 36, 0.1)");

        ctx.fillStyle = shieldGradient;
        ctx.beginPath();
        ctx.arc(0, -5, 50 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Honeycomb pattern
        ctx.strokeStyle = `rgba(120, 53, 15, ${alpha})`;
        ctx.lineWidth = 2;

        const hexSize = 15;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + performance.now() / 1000;
            const sx = Math.cos(angle) * 30;
            const sy = -5 + Math.sin(angle) * 30;

            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const hexAngle = (j / 6) * Math.PI * 2 + angle;
                const hexX = sx + Math.cos(hexAngle) * hexSize;
                const hexY = sy + Math.sin(hexAngle) * hexSize;

                if (j === 0) {
                    ctx.moveTo(hexX, hexY);
                } else {
                    ctx.lineTo(hexX, hexY);
                }
            }
            ctx.closePath();
            ctx.stroke();
        }
    }

    function drawEvolutionHat(hatType) {
        if (!hatType) return;

        ctx.save();
        ctx.translate(0, -40);

        switch(hatType) {
            case 'cap':
                ctx.fillStyle = "#1e40af";
                ctx.beginPath();
                ctx.ellipse(0, -10, 20, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "#3b82f6";
                ctx.beginPath();
                ctx.roundRect(-15, -15, 30, 10, 5);
                ctx.fill();
                break;
            case 'crown':
                ctx.fillStyle = "#fbbf24";
                const points = 5;
                const radius = 18;
                ctx.beginPath();
                for (let i = 0; i < points; i++) {
                    const angle = (i * Math.PI * 2) / points - Math.PI/2;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
                break;
            case 'majestic_crown':
                ctx.fillStyle = "gold";
                ctx.beginPath();
                ctx.roundRect(-20, -10, 40, 8, 3);
                for (let i = 0; i < 5; i++) {
                    const x = -15 + i * 7.5;
                    ctx.moveTo(x, -10);
                    ctx.lineTo(x + 3.75, -20);
                    ctx.lineTo(x + 7.5, -10);
                }
                ctx.fill();
                ctx.fillStyle = "#ef4444";
                ctx.beginPath();
                ctx.arc(0, -5, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        ctx.restore();
    }

    function drawMagnetEffect() {
        if (!gameState.activeEffects.MAGNET) return;

        const magnet = gameState.activeEffects.MAGNET;
        const radius = magnet.radius || 120;

        ctx.save();
        ctx.translate(bear.x, bear.y - 10);

        // Draw magnet field
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw pulsing rings
        const pulse = (Math.sin(performance.now() / 300) * 0.2 + 0.8);
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 * pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius * pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    // ==================== DRAWING OTHER ELEMENTS ====================
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
            } else if (jar.type === "shield") {
                bodyColor = "#38bdf8";
                glowColor = "rgba(56, 189, 248, 0.7)";
            } else if (jar.type === "powerup") {
                const powerup = POWERUPS[jar.value];
                bodyColor = powerup ? powerup.color : "#facc15";
                glowColor = `rgba(${parseInt(bodyColor.slice(1,3), 16)}, ${parseInt(bodyColor.slice(3,5), 16)}, ${parseInt(bodyColor.slice(5,7), 16)}, 0.7)`;
            }

            ctx.shadowColor = glowColor;
            ctx.shadowBlur = jar.type === "gold" || jar.type === "shield" || jar.type === "powerup" ? 12 : 6;

            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.roundRect(-10, -14, 20, 26, 6);
            ctx.fill();

            ctx.shadowBlur = 0;

            // Power-up icon
            if (jar.type === "powerup") {
                const powerup = POWERUPS[jar.value];
                if (powerup) {
                    ctx.fillStyle = "white";
                    ctx.font = "bold 10px system-ui";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(powerup.icon, 0, 0);
                }
            } else {
                ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
                ctx.fillRect(-10, -18, 20, 6);

                ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                ctx.beginPath();
                ctx.ellipse(-3, -8, 4, 6, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
                ctx.fillRect(-6, -10, 12, 2);
            }

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

    // ==================== PARTICLE SYSTEM ====================
    function createJarParticles(x, y, type) {
        const colors = {
            normal: ["#facc15", "#eab308", "#fbbf24"],
            gold: ["#f97316", "#ea580c", "#fb923c"],
            shield: ["#38bdf8", "#0ea5e9", "#7dd3fc"],
            powerup: ["#fbbf24", "#60a5fa", "#ef4444", "#22c55e"]
        };

        const particleCount = type === "gold" ? 20 : type === "shield" || type === "powerup" ? 15 : 12;
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

        if (type === "gold" || type === "powerup") {
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

    // ==================== BEAR ANIMATION SYSTEM ====================
    function updateBearAnimation(dt) {
        const anim = bear.animation;

        if (bear.vx !== 0) {
            anim.isMoving = true;
            anim.walkCycle += Math.abs(bear.vx) * 0.01 * dt;
            anim.bobPhase += dt * 8;

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

        anim.blinkTimer -= dt;
        if (anim.blinkTimer <= 0) {
            anim.blinkTimer = 3 + Math.random() * 4;
        }

        const newMood = gameState.lives === 1 ? "worried" :
            gameState.streak >= 10 ? "excited" : "happy";

        if (newMood !== anim.mood) {
            anim.mood = newMood;
            anim.lastMoodChange = performance.now();
        }

        if (anim.celebrationTimer > 0) {
            anim.celebrationTimer -= dt;
        }

        anim.scaleX = bear.dir < 0 ? -1 : 1;
    }

    function triggerBearCelebration() {
        bear.animation.celebrationTimer = 0.5;
        bear.animation.mood = "excited";

        bear.animation.squashStretch = 0.7;
        setTimeout(() => {
            bear.animation.squashStretch = 1.3;
        }, 100);
        setTimeout(() => {
            bear.animation.squashStretch = 1;
        }, 200);
    }

    // ==================== BEAR TRAIL SYSTEM ====================
    function updateBearTrail(dt) {
        if (Math.abs(bear.vx) > 80 && gameState.running && !gameState.paused) {
            bearTrail.push({
                x: bear.x,
                y: bear.y,
                life: 1,
                decay: 0.03 + Math.random() * 0.02,
                size: 6 + Math.random() * 4,
                color: `rgba(${gameState.currentEvolution * 40 + 200}, ${150 + gameState.currentEvolution * 20}, ${50}, 0.6)`,
                vx: (Math.random() - 0.5) * 20,
                vy: -20 - Math.random() * 20
            });
        }
        for (let i = bearTrail.length - 1; i >= 0; i--) {
            const trail = bearTrail[i];
            trail.x += trail.vx * dt;
            trail.y += trail.vy * dt;
            trail.life -= trail.decay;
            trail.size *= 0.97;
            if (trail.life <= 0) bearTrail.splice(i, 1);
        }
    }

    function drawBearTrail() {
        for (const trail of bearTrail) {
            ctx.save();
            ctx.globalAlpha = trail.life * 0.7;
            ctx.fillStyle = trail.color;
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, trail.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = trail.life * 0.3;
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, trail.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // ==================== SCREEN SHAKE ====================
    function shakeScreen(intensity = 5, duration = 0.3) {
        screenShake.intensity = intensity;
        screenShake.duration = duration;
        screenShake.timer = duration;
    }

    // ==================== POWER-UP SYSTEM ====================
    function createPowerupIndicators() {
        const existing = document.getElementById("powerupIndicators");
        if (existing) {
            existing.remove();
        }

        const container = document.createElement("div");
        container.id = "powerupIndicators";
        container.className = "powerup-indicators";
        container.innerHTML = `
            <div class="powerup-indicator" data-type="DOUBLE_POINTS">
                <span class="powerup-icon">✖️2</span>
                <div class="powerup-timer"></div>
            </div>
            <div class="powerup-indicator" data-type="SLOW_TIME">
                <span class="powerup-icon">⏱️</span>
                <div class="powerup-timer"></div>
            </div>
            <div class="powerup-indicator" data-type="MAGNET">
                <span class="powerup-icon">🧲</span>
                <div class="powerup-timer"></div>
            </div>
            <div class="powerup-indicator" data-type="BEE_REPELLENT">
                <span class="powerup-icon">🐝🚫</span>
                <div class="powerup-timer"></div>
            </div>
        `;
        if (gameContainer) gameContainer.appendChild(container);
    }

    function activatePowerup(type) {
        const powerup = POWERUPS[type];
        if (!powerup) return;

        gameState.activeEffects[type] = {
            timeLeft: powerup.duration,
            ...powerup
        };

        gameState.stats.powerupsCollected++;

        const indicator = document.querySelector(`.powerup-indicator[data-type="${type}"]`);
        if (indicator) {
            indicator.classList.add('active');
            const timer = indicator.querySelector('.powerup-timer');
            if (timer) {
                timer.style.width = '100%';
            }
        }

        showNotification(`Power-up: ${powerup.name} activated!`, powerup.color);
        playPowerupActivateSound();
    }

    function updatePowerups(dt) {
        for (const type in gameState.activeEffects) {
            const effect = gameState.activeEffects[type];
            effect.timeLeft -= dt;

            const indicator = document.querySelector(`.powerup-indicator[data-type="${type}"]`);
            if (indicator) {
                const timer = indicator.querySelector('.powerup-timer');
                if (timer) {
                    const percent = (effect.timeLeft / POWERUPS[type].duration) * 100;
                    timer.style.width = `${percent}%`;
                }
            }

            if (effect.timeLeft <= 0) {
                deactivatePowerup(type);
            }
        }
    }

    function deactivatePowerup(type) {
        delete gameState.activeEffects[type];

        const indicator = document.querySelector(`.powerup-indicator[data-type="${type}"]`);
        if (indicator) {
            indicator.classList.remove('active');
        }

        showNotification(`Power-up: ${POWERUPS[type].name} expired!`, '#64748b');
        playPowerupExpireSound();
    }

    // ==================== EVOLUTION SYSTEM ====================
    function checkEvolutionUpgrade() {
        for (let i = BEAR_EVOLUTIONS.length - 1; i >= 0; i--) {
            if (gameState.score >= BEAR_EVOLUTIONS[i].score && gameState.currentEvolution < i) {
                gameState.currentEvolution = i;
                showEvolutionUpgrade(i);
                break;
            }
        }
    }

    function showEvolutionUpgrade(level) {
        const evolution = BEAR_EVOLUTIONS[level];
        if (!evolution) return;

        const evolutionDisplay = document.getElementById("evolutionDisplay");
        if (!evolutionDisplay) {
            const display = document.createElement("div");
            display.id = "evolutionDisplay";
            display.className = "evolution-display";
            if (gameContainer) gameContainer.appendChild(display);
        }

        const display = document.getElementById("evolutionDisplay");
        display.innerHTML = `
            <span class="evolution-level">${level + 1}</span>
            <span class="evolution-name">${evolution.name} Bear</span>
            <span class="evolution-icon">${level === 0 ? '🐻' : level === 1 ? '🐻‍❄️' : level === 2 ? '👑' : '🏆'}</span>
        `;

        display.style.display = 'flex';
        display.style.animation = 'evolutionPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';

        setTimeout(() => {
            display.style.animation = 'none';
            setTimeout(() => {
                display.style.display = 'none';
            }, 300);
        }, 3000);

        showNotification(`Evolved to ${evolution.name}!`, "#fbbf24");
        playEvolutionSound();
    }

    // ==================== ACHIEVEMENT SYSTEM ====================
    function checkAchievements() {
        for (const achievement of ACHIEVEMENTS) {
            if (!gameState.achievements.includes(achievement.id)) {
                if (achievement.condition(gameState.score, gameState.stats)) {
                    unlockAchievement(achievement);
                }
            }
        }
    }

    function unlockAchievement(achievement) {
        gameState.achievements.push(achievement.id);
        showAchievementPopup(achievement);
        playAchievementSound();
        saveProgress();
    }

    function showAchievementPopup(achievement) {
        const popup = document.createElement("div");
        popup.className = "achievement-popup";
        popup.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-text">
                <div class="achievement-title">Achievement Unlocked!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.desc}</div>
            </div>
        `;

        document.body.appendChild(popup);

        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 3000);

        if (liveRegion) liveRegion.textContent = `Achievement unlocked: ${achievement.name}! ${achievement.desc}`;
    }

    // ==================== DAILY CHALLENGE SYSTEM ====================
    function initDailyChallenge() {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const challenge = DAILY_CHALLENGES[today];

        const dailyChallengePanel = document.getElementById("dailyChallengePanel");
        const dailyChallengeText = document.getElementById("dailyChallengeText");
        const dailyChallengeProgress = document.getElementById("dailyChallengeProgress");
        const dailyChallengeReward = document.getElementById("dailyChallengeReward");

        if (!challenge || !dailyChallengePanel || !dailyChallengeText || !dailyChallengeProgress || !dailyChallengeReward) return;

        dailyChallengeText.textContent = challenge.objective;
        dailyChallengeReward.innerHTML = `<span>🎁</span> Reward: ${challenge.reward}`;

        updateDailyChallengeProgress();

        dailyChallengePanel.style.display = 'block';
    }

    function updateDailyChallengeProgress() {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const challenge = DAILY_CHALLENGES[today];

        const dailyChallengeProgress = document.getElementById("dailyChallengeProgress");
        if (!challenge || !dailyChallengeProgress) return;

        let progress = 0;
        switch(challenge.type) {
            case 'goldJars':
                progress = gameState.stats.goldJarsCaught;
                break;
            case 'combo':
                progress = gameState.stats.highestCombo;
                break;
            case 'score':
                progress = gameState.score;
                break;
            case 'survival':
                progress = GAME_DURATION - gameState.timeLeft;
                break;
            case 'powerups':
                progress = gameState.stats.powerupsCollected;
                break;
        }

        const percent = Math.min((progress / challenge.target) * 100, 100);
        dailyChallengeProgress.style.width = `${percent}%`;

        if (progress >= challenge.target && (!gameState.dailyProgress || !gameState.dailyProgress.completed)) {
            completeDailyChallenge(challenge);
        }
    }

    function completeDailyChallenge(challenge) {
        gameState.dailyProgress.completed = true;
        gameState.dailyProgress.rewardClaimed = false;

        showNotification(`Daily Challenge Complete! Reward: ${challenge.reward}`, "#fbbf24");
        if (liveRegion) liveRegion.textContent = `Daily challenge completed! You earned: ${challenge.reward}`;

        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        localStorage.setItem(`dailyChallenge_${today}`, JSON.stringify(gameState.dailyProgress));
    }

    // ==================== COMBO SYSTEM ====================
    function showComboIfNeeded() {
        if (streakValue) streakValue.textContent = String(gameState.streak);
        
        if (streakBadge) {
            if (gameState.streak >= 5) {
                streakBadge.textContent = "Combo!";
                streakBadge.classList.add("visible");
            } else {
                streakBadge.classList.remove("visible");
            }
        }

        if (gameState.streak > 0 && gameState.streak % 10 === 0) {
            if (comboIndicator) {
                comboIndicator.textContent = "x" + (1 + Math.floor(gameState.streak / 10)) + " Combo!";
                comboIndicator.classList.add("visible");
                triggerComboEffect();
                setTimeout(() => comboIndicator.classList.remove("visible"), 700);
            }
        }
    }

    function triggerComboEffect() {
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
        playComboSound();
    }

    // ==================== SCORE POPUPS ====================
    function addScorePopup(amount, x, y, color, type = "normal") {
        scorePopups.push({
            amount: amount > 0 ? "+" + amount : String(amount),
            x,
            y,
            color,
            start: performance.now(),
            duration: 650
        });
    }

    // ==================== DYNAMIC DIFFICULTY ====================
    function updateDynamicDifficulty() {
        if (gameState.timeLeft % 10 > 1) return;
        const currentPerformance = gameState.score / (GAME_DURATION - gameState.timeLeft);
        dynamicDifficulty.performanceHistory.push(currentPerformance);
        if (dynamicDifficulty.performanceHistory.length > 3) dynamicDifficulty.performanceHistory.shift();
        const avgPerformance = dynamicDifficulty.performanceHistory.reduce((a, b) => a + b, 0) / dynamicDifficulty.performanceHistory.length;
        if (avgPerformance > 12) {
            dynamicDifficulty.multiplier = Math.min(1.5, 1 + (avgPerformance - 12) * 0.04);
            showNotification("Difficulty increased!", "#ef4444");
        } else if (avgPerformance < 6) {
            dynamicDifficulty.multiplier = Math.max(0.7, 1 - (6 - avgPerformance) * 0.05);
            showNotification("Difficulty decreased", "#22c55e");
        } else {
            dynamicDifficulty.multiplier = 1;
        }
    }

    // ==================== NOTIFICATION SYSTEM ====================
    function showNotification(text, color) {
        const notification = document.createElement("div");
        notification.className = "notification";
        notification.textContent = text;
        notification.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: ${color};
            color: white;
            padding: 10px 20px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            animation: slideDown 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    // ==================== HUD UPDATE ====================
    function updateHud() {
        try {
            if (scoreValue) scoreValue.textContent = String(gameState.score);
            if (bestValue) bestValue.textContent = String(gameState.best);
            if (timeValue) timeValue.textContent = String(Math.max(0, Math.floor(gameState.timeLeft)));
            if (streakValue) streakValue.textContent = String(gameState.streak);
            
            if (livesValue) {
                const full = "♥".repeat(gameState.lives);
                const empty = "♡".repeat(MAX_LIVES - gameState.lives);
                livesValue.textContent = full + empty;
            }

            if (streakBadge) {
                streakBadge.textContent = "Combo!";
                if (gameState.streak >= 5) {
                    streakBadge.classList.add("visible");
                } else {
                    streakBadge.classList.remove("visible");
                }
            }

            if (powerupIndicator) {
                if (gameState.shieldTime > 0) {
                    powerupIndicator.classList.add("visible");
                } else {
                    powerupIndicator.classList.remove("visible");
                }
            }

            if (timeProgress) {
                const percent = Math.max(0, Math.min(100, (gameState.timeLeft / GAME_DURATION) * 100));
                timeProgress.style.width = `${percent}%`;
                if (timeProgress.classList) {
                    timeProgress.classList.toggle("low", percent < 25);
                }
            }
            
            if (timeSubtitle) {
                const secondsLeft = Math.max(0, Math.ceil(gameState.timeLeft));
                timeSubtitle.textContent = secondsLeft > 0 ? `${secondsLeft}s to shine` : "Out of time";
            }

            if (streakProgress) {
                const streakPercent = Math.min(50, gameState.streak) / 50 * 100;
                streakProgress.style.width = `${streakPercent}%`;
            }
            
            if (streakSubtitle) {
                if (gameState.streak >= 20) {
                    streakSubtitle.textContent = "Combo legend in motion";
                } else if (gameState.streak >= 10) {
                    streakSubtitle.textContent = "Streak is heating up";
                } else {
                    streakSubtitle.textContent = "Build that combo";
                }
            }

            if (sessionDifficulty) {
                const level = DIFFICULTY_LABELS[settingsState.difficulty] || "Classic";
                sessionDifficulty.textContent = `${level} mode`;
            }
            
            if (sessionGames) {
                const games = gameState.gamesPlayed || 0;
                sessionGames.textContent = `${games} lifetime run${games === 1 ? "" : "s"}`;
            }
            
            if (sessionMood) {
                let mood = "Cozy start";
                if (gameState.streak >= 25) {
                    mood = "Unstoppable flow";
                } else if (gameState.streak >= 10) {
                    mood = "Streaking nicely";
                } else if (gameState.lives < MAX_LIVES) {
                    mood = "Shake it off and recover";
                }
                sessionMood.textContent = mood;
            }
        } catch (error) {
            console.warn("Error in updateHud:", error);
        }
    }

    // ==================== GAME STATE MANAGEMENT ====================
    function resetGameState() {
        gameState.running = false;
        gameState.paused = false;
        gameState.timeLeft = GAME_DURATION;
        gameState.score = 0;
        gameState.streak = 0;
        gameState.lives = MAX_LIVES;
        gameState.shieldTime = 0;
        gameState.activeEffects = {};
        gameState.stats = {
            jarsCaught: 0,
            beesAvoided: 0,
            consecutiveCatches: 0,
            highestCombo: 0,
            fastest5Catches: Infinity,
            lastCatchTime: 0,
            powerupsCollected: 0,
            goldJarsCaught: 0
        };
        gameState.currentEvolution = 0;
        gameState.dailyProgress = {};
        jars.length = 0;
        bees.length = 0;
        scorePopups.length = 0;
        particles.length = 0;
        bearTrail.length = 0;
        jarSpawnTimer = 0;
        beeSpawnTimer = 0;
        screenShake.timer = 0;

        if (world.width > 0) {
            bear.x = world.width / 2;
            bear.y = world.height * 0.85;
        }

        bear.animation.walkCycle = 0;
        bear.animation.bobPhase = 0;
        bear.animation.scaleX = 1;
        bear.animation.squashStretch = 1;
        bear.animation.isMoving = false;
        bear.animation.mood = "happy";
        bear.animation.celebrationTimer = 0;

        document.querySelectorAll('.powerup-indicator').forEach(indicator => {
            indicator.classList.remove('active');
            const timer = indicator.querySelector('.powerup-timer');
            if (timer) {
                timer.style.width = '0%';
            }
        });

        dynamicDifficulty.multiplier = 1;
        dynamicDifficulty.performanceHistory = [];
    }

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
        if (liveRegion) liveRegion.textContent = "Game started. Catch the honey and avoid the bees.";
        playGameStartSound();
        if (settingsState.musicOn) startBackgroundMusic();
        requestAnimationFrame(gameLoop);
    }

    function togglePause() {
        if (!gameState.running) return;

        if (gameState.paused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }

    function pauseGame() {
        if (!gameState.running) return;
        gameState.paused = true;
        showOverlay(pauseOverlay);
        if (liveRegion) liveRegion.textContent = "Game paused.";
    }

    function resumeGame() {
        if (!gameState.running) return;
        gameState.paused = false;
        hideOverlay(pauseOverlay);
        if (liveRegion) liveRegion.textContent = "Game resumed.";
        requestAnimationFrame(gameLoop);
    }

    function endGame() {
        if (!gameState.running) return;
        gameState.running = false;
        gameState.paused = false;
        gameState.gamesPlayed += 1;

        if (gameState.score > gameState.best) {
            gameState.best = gameState.score;
            if (liveRegion) liveRegion.textContent = "New high score " + gameState.best + "!";
        } else {
            if (liveRegion) liveRegion.textContent = "Final score " + gameState.score + ".";
        }

        saveProgress();
        if (finalScore) finalScore.textContent = String(gameState.score);
        if (finalBest) finalBest.textContent = String(gameState.best);
        if (overlayBest) overlayBest.textContent = String(gameState.best);
        if (overlayGames) overlayGames.textContent = String(gameState.gamesPlayed);

        showOverlay(gameOverOverlay);
        playGameOverSound();
        stopBackgroundMusic();
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
                settingsState = {
                    musicOn: parsed.musicOn !== undefined ? parsed.musicOn : true,
                    sfxOn: parsed.sfxOn !== undefined ? parsed.sfxOn : true,
                    difficulty: parsed.difficulty !== undefined ? parsed.difficulty : 1
                };
            }

            const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
            if (savedTheme === "dark") {
                document.body.classList.add("dark");
                if (themeToggle) {
                    themeToggle.setAttribute("aria-pressed", "true");
                    themeToggle.innerHTML = '<i class="fas fa-sun" aria-hidden="true"></i><span>Theme</span>';
                }
            }

            const savedAchievements = localStorage.getItem("honeyHunt_achievements");
            if (savedAchievements) {
                gameState.achievements = JSON.parse(savedAchievements);
            }

            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const savedDailyProgress = localStorage.getItem(`dailyChallenge_${today}`);
            if (savedDailyProgress) {
                gameState.dailyProgress = JSON.parse(savedDailyProgress);
            }
        } catch (e) {
            console.warn("Failed to load saved state", e);
        }

        applySettingsToUi();
    }

    function saveProgress() {
        try {
            localStorage.setItem(STORAGE_KEYS.BEST, String(gameState.best));
            localStorage.setItem(STORAGE_KEYS.GAMES, String(gameState.gamesPlayed));
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settingsState));
            localStorage.setItem("honeyHunt_achievements", JSON.stringify(gameState.achievements || []));
        } catch (e) {
            console.warn("Failed to save progress", e);
        }
    }

    // ==================== UI CONTROLS ====================
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
            if (settingsModal && settingsModal.classList.contains("visible")) {
                closeSettings();
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

    function initSettings() {
        if (settingsToggle) {
            settingsToggle.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                openSettings();
            });
        }

        if (settingsClose) {
            settingsClose.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeSettings();
            });
        }

        if (settingsModal) {
            settingsModal.addEventListener("click", function(e) {
                if (e.target === settingsModal) {
                    closeSettings();
                }
            });
        }

        if (musicToggle) {
            musicToggle.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                settingsState.musicOn = !settingsState.musicOn;
                applySettingsToUi();
                saveProgress();
                if (settingsState.musicOn) {
                    startBackgroundMusic();
                    if (liveRegion) liveRegion.textContent = "Music enabled";
                } else {
                    stopBackgroundMusic();
                    if (liveRegion) liveRegion.textContent = "Music disabled";
                }
                playButtonClickSound();
            });
        }

        if (sfxToggle) {
            sfxToggle.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                settingsState.sfxOn = !settingsState.sfxOn;
                applySettingsToUi();
                saveProgress();
                if (liveRegion) liveRegion.textContent = "Sound effects " + (settingsState.sfxOn ? "enabled" : "disabled");
                playButtonClickSound();
            });
        }

        diffButtons.forEach(btn => {
            btn.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                const level = Number(btn.dataset.level);
                settingsState.difficulty = level;
                applySettingsToUi();
                saveProgress();
                if (liveRegion) liveRegion.textContent = "Difficulty set to " + btn.textContent + ".";
                playButtonClickSound();
            });
        });

        if (resetProgress) {
            resetProgress.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (confirm("Are you sure you want to reset all progress? This will delete your high score and games played.")) {
                    gameState.best = 0;
                    gameState.gamesPlayed = 0;
                    gameState.achievements = [];
                    saveProgress();
                    if (settingsBest) settingsBest.textContent = "0";
                    if (bestValue) bestValue.textContent = "0";
                    if (overlayBest) overlayBest.textContent = "0";
                    if (overlayGames) overlayGames.textContent = "0";
                    if (liveRegion) liveRegion.textContent = "Progress reset.";
                    playButtonClickSound();
                }
            });
        }
    }

    function openSettings() {
        if (settingsModal) {
            settingsModal.classList.add("visible");
            settingsModal.style.display = "flex";
            if (settingsToggle) settingsToggle.setAttribute("aria-expanded", "true");
            if (settingsBest) settingsBest.textContent = String(gameState.best);
            if (settingsPanel) settingsPanel.focus();
            playButtonClickSound();
        }
    }

    function closeSettings() {
        if (settingsModal) {
            settingsModal.classList.remove("visible");
            settingsModal.style.display = "none";
            if (settingsToggle) settingsToggle.setAttribute("aria-expanded", "false");
            playButtonClickSound();
        }
    }

    function applySettingsToUi() {
        if (musicToggle) {
            musicToggle.dataset.on = settingsState.musicOn ? "true" : "false";
            musicToggle.setAttribute("aria-pressed", String(settingsState.musicOn));
            musicToggle.innerHTML = settingsState.musicOn ?
                '<i class="fas fa-volume-up" aria-hidden="true"></i><span>Music</span>' :
                '<i class="fas fa-volume-mute" aria-hidden="true"></i><span>Music</span>';
        }

        if (sfxToggle) {
            sfxToggle.dataset.on = settingsState.sfxOn ? "true" : "false";
            sfxToggle.setAttribute("aria-pressed", String(settingsState.sfxOn));
            sfxToggle.innerHTML = settingsState.sfxOn ?
                '<i class="fas fa-volume-up" aria-hidden="true"></i><span>SFX</span>' :
                '<i class="fas fa-volume-mute" aria-hidden="true"></i><span>SFX</span>';
        }

        diffButtons.forEach(btn => {
            const level = Number(btn.dataset.level);
            btn.classList.toggle("active", level === settingsState.difficulty);
        });

        if (sessionDifficulty) {
            const level = DIFFICULTY_LABELS[settingsState.difficulty] || "Classic";
            sessionDifficulty.textContent = `${level} mode`;
        }
    }

    function initOverlays() {
        if (startButton) startButton.addEventListener("click", startGame);
        if (resumeButton) resumeButton.addEventListener("click", resumeGame);
        if (restartButton) restartButton.addEventListener("click", startGame);
        if (restartButton2) restartButton2.addEventListener("click", startGame);

        if (overlayBest) overlayBest.textContent = String(gameState.best);
        if (overlayGames) overlayGames.textContent = String(gameState.gamesPlayed);
    }

    function initTheme() {
        if (themeToggle) {
            const isDark = document.body.classList.contains("dark");
            themeToggle.setAttribute("aria-pressed", String(isDark));
            themeToggle.innerHTML = isDark ?
                '<i class="fas fa-sun" aria-hidden="true"></i><span>Theme</span>' :
                '<i class="fas fa-moon" aria-hidden="true"></i><span>Theme</span>';
        }
    }

    function initTopbar() {
        if (!themeToggle) return;

        themeToggle.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            const isDark = document.body.classList.toggle("dark");
            localStorage.setItem(STORAGE_KEYS.THEME, isDark ? "dark" : "light");
            initTheme();
            playButtonClickSound();
        });
        initTheme();
    }

    // ==================== CSS INJECTION ====================
    function injectQuickWinsCSS() {
        if (document.getElementById("honey-powerup-css")) return;

        const powerupCSS = `
            .powerup-indicators {
                position: absolute;
                top: 80px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 100;
            }

            .powerup-indicator {
                width: 50px;
                height: 50px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                position: relative;
                opacity: 0.3;
                transition: all 0.3s ease;
                transform: scale(0.9);
            }

            .powerup-indicator.active {
                opacity: 1;
                transform: scale(1);
                box-shadow: 0 0 20px currentColor;
            }

            .powerup-indicator[data-type="DOUBLE_POINTS"] {
                background: linear-gradient(135deg, #fbbf24, #f59e0b);
                color: #78350f;
            }

            .powerup-indicator[data-type="SLOW_TIME"] {
                background: linear-gradient(135deg, #60a5fa, #3b82f6);
                color: white;
            }

            .powerup-indicator[data-type="MAGNET"] {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
            }

            .powerup-indicator[data-type="BEE_REPELLENT"] {
                background: linear-gradient(135deg, #22c55e, #16a34a);
                color: white;
            }

            .powerup-timer {
                position: absolute;
                bottom: -8px;
                left: 5px;
                right: 5px;
                height: 3px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
                overflow: hidden;
            }

            .powerup-timer::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                background: white;
                width: 100%;
                transition: width linear;
            }

            .achievement-popup {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #fbbf24, #f59e0b);
                color: #78350f;
                padding: 20px;
                border-radius: 20px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 15px;
                min-width: 300px;
                animation: achievementPopup 3s ease forwards;
                border: 3px solid #78350f;
            }

            @keyframes achievementPopup {
                0% { opacity: 0; transform: translate(-50%, -40%); }
                10% { opacity: 1; transform: translate(-50%, -50%); }
                90% { opacity: 1; transform: translate(-50%, -50%); }
                100% { opacity: 0; transform: translate(-50%, -60%); }
            }

            .achievement-icon {
                font-size: 40px;
                filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.2));
            }

            .achievement-text {
                flex: 1;
            }

            .achievement-title {
                font-weight: bold;
                font-size: 18px;
                margin-bottom: 5px;
            }

            .achievement-name {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 5px;
            }

            .achievement-desc {
                font-size: 14px;
                opacity: 0.9;
            }

            .daily-challenge-panel {
                position: absolute;
                top: 80px;
                left: 20px;
                background: rgba(30, 41, 59, 0.9);
                border-radius: 15px;
                padding: 15px;
                color: white;
                width: 250px;
                backdrop-filter: blur(10px);
                border: 2px solid #fbbf24;
                z-index: 50;
            }

            .daily-challenge-title {
                font-weight: bold;
                color: #fbbf24;
                margin-bottom: 10px;
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .daily-challenge-title::before {
                content: '🏆';
                font-size: 14px;
            }

            .daily-challenge-progress {
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                margin: 10px 0;
                overflow: hidden;
            }

            .daily-challenge-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #fbbf24, #f59e0b);
                border-radius: 4px;
                transition: width 0.3s ease;
            }

            .daily-challenge-reward {
                font-size: 12px;
                color: #fbbf24;
                margin-top: 8px;
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .evolution-display {
                position: absolute;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(30, 41, 59, 0.9);
                border-radius: 15px;
                padding: 8px 20px;
                color: white;
                backdrop-filter: blur(10px);
                border: 2px solid #fbbf24;
                z-index: 50;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .evolution-level {
                color: #fbbf24;
                font-size: 18px;
            }

            .evolution-name {
                font-size: 14px;
            }

            @keyframes slideDown {
                from { transform: translate(-50%, -20px); opacity: 0; }
                to { transform: translate(-50%, 0); opacity: 1; }
            }

            @keyframes slideUp {
                from { transform: translate(-50%, 0); opacity: 1; }
                to { transform: translate(-50%, -20px); opacity: 0; }
            }

            @keyframes evolutionPopIn {
                0% { transform: translateX(-50%) scale(0.8); opacity: 0; }
                70% { transform: translateX(-50%) scale(1.05); opacity: 1; }
                100% { transform: translateX(-50%) scale(1); opacity: 1; }
            }
        `;

        const styleSheet = document.createElement("style");
        styleSheet.id = "honey-powerup-css";
        styleSheet.textContent = powerupCSS;
        document.head.appendChild(styleSheet);
    }

    // ==================== MAIN INITIALIZATION ====================
    function resizeCanvas() {
        if (!gameContainer || !ctx) return;
        
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

    function addButtonClickSounds() {
        document.querySelectorAll('button').forEach(button => {
            if (button.hasAttribute('data-has-sound')) return;
            button.addEventListener('click', (e) => {
                if (button.disabled || button.getAttribute('aria-disabled') === 'true') return;
                playButtonClickSound();
            });
            button.setAttribute('data-has-sound', 'true');
        });
    }

    function init() {
        console.log("Initializing Honey Hunt with Enhanced Features...");
        
        if (!gameContainer || !canvas || !ctx) {
            console.error("Essential game elements not found!");
            return;
        }
        
        if (!existingCanvas) {
            canvas.id = "gameCanvas";
            canvas.style.cssText = `
                display: block;
                width: 100%;
                height: 100%;
                background: linear-gradient(to bottom, #0f766e 0%, #0e7490 50%, #0369a1 100%);
            `;
            gameContainer.appendChild(canvas);
        }
        
        if (gameContainer) {
            gameContainer.style.cssText = `
                position: relative;
                width: 100%;
                height: 100%;
                overflow: hidden;
            `;
        }
        
        injectQuickWinsCSS();
        loadPersistedState();
        resizeCanvas();
        
        bear.x = world.width / 2;
        bear.y = world.height * 0.85;
        
        updateHud();
        
        initControls();
        initSettings();
        initTopbar();
        initOverlays();
        
        initAudio();
        
        createPowerupIndicators();
        initDailyChallenge();
        
        bear.animation.blinkTimer = 1 + Math.random() * 2;
        dynamicDifficulty.multiplier = 1;
        dynamicDifficulty.performanceHistory = [];
        
        window.addEventListener("resize", resizeCanvas);
        
        document.addEventListener("visibilitychange", function() {
            if (document.hidden && gameState.running && !gameState.paused) {
                pauseGame();
            }
        });
        
        setTimeout(addButtonClickSounds, 100);
        
        if (overlayBest) overlayBest.textContent = String(gameState.best);
        if (overlayGames) overlayGames.textContent = String(gameState.gamesPlayed);
        if (settingsBest) settingsBest.textContent = String(gameState.best);
        
        showOverlay(startOverlay);
        
        console.log("Honey Hunt Enhanced initialized successfully!");
        
        if (liveRegion) {
            liveRegion.textContent = "Honey Hunt game loaded. Press Start to begin or Space to start.";
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        setTimeout(init, 100);
    }

})();
