// game.js - Honey Hunt Game (Complete Fixed Version)

(function () {
    "use strict";

    const STORAGE_KEYS = {
        BEST: "honeyHunt_bestScore_v2",
        GAMES: "honeyHunt_gamesPlayed_v2",
        SETTINGS: "honeyHunt_settings_v2",
        THEME: "honeyHunt_theme_v2"
    };

    function createPlaceholder(id) {
        const el = document.createElement("div");
        if (id) el.id = `placeholder-${id}`;
        return el;
    }

    function getEl(...ids) {
    for (const id of ids) {
        const el = document.getElementById(id);
        if (el) return el;
    }

    // If in development mode, log warning but create placeholder
    if (ids.length > 0) {
        console.warn(
            "[Honey Hunt] Creating placeholder for missing element(s):",
            ids.join(", ")
        );
        
        // Create a safe placeholder element
        const placeholder = document.createElement("div");
        placeholder.id = `placeholder-${ids[0]}`;
        placeholder.style.cssText = "display: none !important; visibility: hidden !important;";
        placeholder.setAttribute("aria-hidden", "true");
        
        // Try to add to body, but only if body exists
        if (document.body) {
            document.body.appendChild(placeholder);
        } else {
            // If body doesn't exist yet, wait for DOMContentLoaded
            document.addEventListener("DOMContentLoaded", () => {
                if (!document.getElementById(placeholder.id)) {
                    document.body.appendChild(placeholder);
                }
            });
        }
        
        return placeholder;
    }

    // Return a dummy element as last resort
    return { textContent: "", style: {} };
}

    const GAME_DURATION = 60;
    const MAX_LIVES = 3;
    const DIFFICULTY_LABELS = ["Chill", "Classic", "Spicy"];

    const gameContainer = getEl("gameContainer", "gameEmbed");
    const existingCanvas = document.getElementById("gameCanvas");
    const canvas = existingCanvas || document.createElement("canvas");
    const ctx = canvas.getContext ? canvas.getContext("2d") : null;

    const scoreValue = getEl("scoreValue", "hudScore");
    const bestValue = getEl("bestValue", "hudBest");
    const timeValue = getEl("timeValue", "hudTime");
    const streakValue = getEl("streakValue", "hudStreak");
    const livesValue = getEl("livesValue", "hudLives");
    const streakBadge = getEl("streakBadge", "statusBadge");
    const comboIndicator = getEl("comboIndicator");
    const powerupIndicator = getEl("powerupIndicator");

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

    const helpToggle = getEl("helpToggle");
    const helpToggleSecondary = getEl("helpToggleSecondary");
    const helpPanel = getEl("helpPanel");
    const helpClose = getEl("helpClose");
    const helpPanelPrimary = getEl("helpPanelPrimary");

    const settingsToggle = getEl("settingsToggle");
    const settingsModal = getEl("settingsModal");
    const settingsPanel = getEl("settingsPanel");
    const settingsClose = getEl("settingsClose");
    const musicToggle = getEl("musicToggle");
    const sfxToggle = getEl("sfxToggle");
    const diffButtons = Array.from(document.querySelectorAll(".diff-btn"));
    const resetProgress = getEl("resetProgress");
    const settingsBest = getEl("settingsBest", "hudBest");

    const themeToggle = getEl("themeToggle");
    const fullscreenToggle = getEl("fullscreenToggle");

    const liveRegion = getEl("liveRegion");

    const timeProgress = getEl("timeProgress");
    const timeSubtitle = getEl("timeSubtitle");
    const streakProgress = getEl("streakProgress");
    const streakSubtitle = getEl("streakSubtitle");
    const sessionDifficulty = getEl("sessionDifficulty");
    const sessionGames = getEl("sessionGames");
    const sessionMood = getEl("sessionMood");

    // ==================== ENHANCED AUDIO SYSTEM ====================
    let audioContext = null;
    let audioBuffers = {};
    let isAudioInitialized = false;
    let musicSource = null;
    let musicPlaying = false;
    let backgroundMusic = null;
    let musicGainNode = null;
    let musicAudioElement = null;

    const SOUNDS = {
        // Jar catching sounds
        CATCH_NORMAL: 'catch_normal',
        CATCH_GOLD: 'catch_gold',
        CATCH_SHIELD: 'catch_shield',
        CATCH_POWERUP: 'catch_powerup',

        // Bee sounds
        BEE_HIT: 'bee_hit',
        BEE_MISS: 'bee_miss',
        BEE_SWOOP: 'bee_swoop',

        // Power-up sounds
        SHIELD_ACTIVATE: 'shield_activate',
        SHIELD_BLOCK: 'shield_block',
        POWERUP_ACTIVATE: 'powerup_activate',
        POWERUP_EXPIRE: 'powerup_expire',
        POWERUP_COLLECT: 'powerup_collect',

        // Combo & streak sounds
        COMBO_START: 'combo_start',
        COMBO_CHAIN: 'combo_chain',
        COMBO_BREAK: 'combo_break',
        STREAK_5: 'streak_5',
        STREAK_10: 'streak_10',

        // Game state sounds
        GAME_START: 'game_start',
        GAME_OVER: 'game_over',
        GAME_PAUSE: 'game_pause',
        GAME_RESUME: 'game_resume',

        // UI sounds
        BUTTON_CLICK: 'button_click',
        BUTTON_HOVER: 'button_hover',
        MENU_OPEN: 'menu_open',
        MENU_CLOSE: 'menu_close',

        // Evolution & achievement sounds
        EVOLUTION_UPGRADE: 'evolution_upgrade',
        ACHIEVEMENT_UNLOCK: 'achievement_unlock',

        // Daily challenge sounds
        CHALLENGE_PROGRESS: 'challenge_progress',
        CHALLENGE_COMPLETE: 'challenge_complete'
    };

    // ==================== SAFE AUDIO FUNCTIONS ====================
    
    function safeInitAudio() {
        try {
            if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                audioContext = new AudioContextClass();
                generateSoundEffects();
                console.log("Audio system initialized with Web Audio API");
            } else {
                console.log("Web Audio API not available, using silent mode");
            }
        } catch (error) {
            console.warn("Audio initialization failed:", error);
        }
        isAudioInitialized = true;
    }
    
    function safePlaySound(soundType) {
        if (!settingsState.sfxOn) return;
        
        try {
            playSound(soundType);
        } catch (error) {
            console.warn("Could not play sound:", soundType, error);
            // Simple fallback beep
            try {
                if (audioContext && audioContext.state === 'running') {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.value = 800;
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
                    
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.1);
                }
            } catch (e) {
                // Silent fallback
            }
        }
    }
    
    function safeBackgroundMusic() {
        if (!settingsState.musicOn || musicPlaying) return;
        
        try {
            startBackgroundMusic();
        } catch (error) {
            console.warn("Background music failed:", error);
            // Fallback to simple music
            playSynthesizedMusic();
        }
    }

    function initAudio() {
        if (isAudioInitialized) return;

        try {
            // Try to create audio context
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error("Web Audio API not supported");
            }

            audioContext = new AudioContextClass();

            // Create audio gain nodes
            musicGainNode = audioContext.createGain();
            musicGainNode.connect(audioContext.destination);
            musicGainNode.gain.value = settingsState.musicOn ? 0.6 : 0;

            // Load background music (uses synthesized music)
            loadBackgroundMusic();

            // Generate sound effects
            generateSoundEffects();

            // Add click handler to unlock audio
            const unlockAudio = () => {
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('touchstart', unlockAudio);
            };

            document.addEventListener('click', unlockAudio);
            document.addEventListener('touchstart', unlockAudio);

            isAudioInitialized = true;
            console.log("Audio system initialized successfully");
        } catch (error) {
            console.warn("Audio initialization failed, using fallback:", error);
            // Fallback: create dummy audio system
            audioBuffers = {};
            isAudioInitialized = true;
        }
    }

    function loadBackgroundMusic() {
        // Use synthesized music as primary
        console.log("Using synthesized background music");
        createSynthesizedBackgroundMusic();

        // Create fallback audio element
        musicAudioElement = new Audio();
        musicAudioElement.loop = true;
        musicAudioElement.volume = settingsState.musicOn ? 0.6 : 0;
    }

    function createSynthesizedBackgroundMusic() {
        // Fallback synthesized music
        const createNote = (frequency, duration, startTime, type = 'sine', volume = 0.15) => {
            if (!audioContext) return;

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(musicGainNode);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            const fadeTime = 0.05;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume, startTime + fadeTime);
            gainNode.gain.setValueAtTime(volume, startTime + duration - fadeTime);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };

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

        let musicSynthesisInterval = null;

        const playMelody = () => {
            if (!audioContext || !musicPlaying || !settingsState.musicOn) return;

            let currentTime = audioContext.currentTime;

            melody.forEach(({ note, duration }) => {
                createNote(noteToFrequency[note], duration, currentTime, 'triangle', 0.12);

                if (note === 'C4' || note === 'C5') {
                    createNote(noteToFrequency[note] * 1.5, duration, currentTime, 'sine', 0.06);
                }

                currentTime += duration;
            });

            // Schedule next melody
            return (currentTime - audioContext.currentTime) * 1000;
        };

        backgroundMusic = {
            play: () => {
                if (musicPlaying || !settingsState.musicOn) return;
                musicPlaying = true;

                if (!audioContext) return;

                const interval = playMelody();
                if (musicSynthesisInterval) {
                    clearInterval(musicSynthesisInterval);
                }
                musicSynthesisInterval = setInterval(() => {
                    if (musicPlaying && settingsState.musicOn) {
                        playMelody();
                    } else {
                        clearInterval(musicSynthesisInterval);
                        musicSynthesisInterval = null;
                    }
                }, interval);
            },
            stop: () => {
                musicPlaying = false;
                if (musicSynthesisInterval) {
                    clearInterval(musicSynthesisInterval);
                    musicSynthesisInterval = null;
                }
            },
            setVolume: (volume) => {
                const safeVolume = Math.max(0, Math.min(1, volume));
                if (musicGainNode) {
                    musicGainNode.gain.value = safeVolume;
                }
                if (musicAudioElement) {
                    musicAudioElement.volume = safeVolume;
                }
            }
        };
    }

    function playSynthesizedMusic() {
        // Fallback if both Web Audio API and HTML5 Audio fail
        console.log("Playing synthesized fallback music");

        if (!audioContext) return;

        const tempo = 120;
        const quarterNote = 60 / tempo;
        const melody = [
            { note: 'C4', duration: quarterNote },
            { note: 'E4', duration: quarterNote },
            { note: 'G4', duration: quarterNote },
            { note: 'C5', duration: quarterNote },
            { note: 'E5', duration: quarterNote },
            { note: 'G4', duration: quarterNote },
            { note: 'C5', duration: quarterNote },
            { note: 'B4', duration: quarterNote * 2 }
        ];

        const noteToFrequency = {
            'C4': 261.63, 'E4': 329.63, 'G4': 392.00,
            'C5': 523.25, 'E5': 659.25, 'B4': 493.88
        };

        let currentTime = audioContext.currentTime;

        melody.forEach(({ note, duration }, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = noteToFrequency[note];
            oscillator.type = 'triangle';

            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(0.03, currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration - 0.05);

            oscillator.start(currentTime);
            oscillator.stop(currentTime + duration);
            currentTime += duration;
        });

        if (musicSource) {
            clearTimeout(musicSource);
        }
        musicSource = setTimeout(() => {
            if (musicPlaying && settingsState.musicOn) playSynthesizedMusic();
        }, currentTime - audioContext.currentTime + 500);
    }

    function generateSoundEffects() {
        if (!audioContext) return;

        // Normal jar catch - happy pluck sound
        audioBuffers[SOUNDS.CATCH_NORMAL] = createPluckSound(523.25, 0.2, 0.15, 'sine');

        // Gold jar catch - richer, more rewarding sound
        audioBuffers[SOUNDS.CATCH_GOLD] = createRichPluckSound(659.25, 0.3, 0.2);

        // Shield jar catch - shimmering, magical sound
        audioBuffers[SOUNDS.CATCH_SHIELD] = createShimmerSound(392.00, 0.4, 0.18);

        // Power-up jar catch - exciting, ascending sound
        audioBuffers[SOUNDS.CATCH_POWERUP] = createAscendingSound(261.63, 1046.50, 0.5, 0.2);

        // Power-up collect - distinct from activation
        audioBuffers[SOUNDS.POWERUP_COLLECT] = createSparkleSound(0.3, 0.15);

        // Bee hit - sharp, painful sound
        audioBuffers[SOUNDS.BEE_HIT] = createBeeHitSound();

        // Bee miss (near miss) - warning whoosh
        audioBuffers[SOUNDS.BEE_MISS] = createWhooshSound(0.2, 0.1);

        // Bee swoop - movement sound
        audioBuffers[SOUNDS.BEE_SWOOP] = createSwoopSound(0.3, 0.08);

        // Shield activate - protective bubble sound
        audioBuffers[SOUNDS.SHIELD_ACTIVATE] = createBubbleSound(0.4, 0.15);

        // Shield block - satisfying deflection sound
        audioBuffers[SOUNDS.SHIELD_BLOCK] = createDeflectSound(0.3, 0.12);

        // Power-up activate - exciting activation
        audioBuffers[SOUNDS.POWERUP_ACTIVATE] = createPowerupActivateSound();

        // Power-up expire - fading out sound
        audioBuffers[SOUNDS.POWERUP_EXPIRE] = createFadeOutSound(0.4, 0.1);

        // Combo start - exciting beginning
        audioBuffers[SOUNDS.COMBO_START] = createComboStartSound();

        // Combo chain - continuation sound
        audioBuffers[SOUNDS.COMBO_CHAIN] = createChainSound(0.2, 0.08);

        // Combo break - disappointing sound
        audioBuffers[SOUNDS.COMBO_BREAK] = createBreakSound(0.3, 0.12);

        // Streak milestones
        audioBuffers[SOUNDS.STREAK_5] = createMilestoneSound(5, 0.3, 0.15);
        audioBuffers[SOUNDS.STREAK_10] = createMilestoneSound(10, 0.4, 0.18);

        // Game state sounds
        audioBuffers[SOUNDS.GAME_START] = createGameStartSound();
        audioBuffers[SOUNDS.GAME_OVER] = createGameOverSound();
        audioBuffers[SOUNDS.GAME_PAUSE] = createPauseSound();
        audioBuffers[SOUNDS.GAME_RESUME] = createResumeSound();

        // UI sounds
        audioBuffers[SOUNDS.BUTTON_CLICK] = createClickSound();
        audioBuffers[SOUNDS.BUTTON_HOVER] = createHoverSound();
        audioBuffers[SOUNDS.MENU_OPEN] = createMenuOpenSound();
        audioBuffers[SOUNDS.MENU_CLOSE] = createMenuCloseSound();

        // Evolution & achievement sounds
        audioBuffers[SOUNDS.EVOLUTION_UPGRADE] = createEvolutionSound();
        audioBuffers[SOUNDS.ACHIEVEMENT_UNLOCK] = createAchievementSound();

        // Daily challenge sounds
        audioBuffers[SOUNDS.CHALLENGE_PROGRESS] = createProgressSound();
        audioBuffers[SOUNDS.CHALLENGE_COMPLETE] = createCompleteSound();
    }

    // ==================== SOUND GENERATORS ====================

    function createPluckSound(freq, duration, volume, type = 'sine') {
        if (!audioContext) return { oscillator: null, gainNode: null, duration };

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

        return { oscillator, gainNode, duration };
    }

    function createRichPluckSound(freq, duration, volume) {
        if (!audioContext) return { oscillators: [], duration };

        const oscillators = [];

        for (let i = 0; i < 3; i++) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = freq * (1 + (i - 1) * 0.01);
            oscillator.type = i === 0 ? 'sine' : i === 1 ? 'triangle' : 'sawtooth';

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume * (1 - i * 0.3), audioContext.currentTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration * (1 + i * 0.1));

            oscillators.push({ oscillator, gainNode });
        }

        return { oscillators, duration };
    }

    function createShimmerSound(freq, duration, volume) {
        if (!audioContext) return { oscillators: [], duration };

        const oscillators = [];

        for (let i = 0; i < 4; i++) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = freq * Math.pow(2, i/12);
            oscillator.type = 'sine';

            const startTime = audioContext.currentTime + i * 0.05;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume * 0.7, startTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            oscillators.push({ oscillator, gainNode });
        }

        return { oscillators, duration };
    }

    function createAscendingSound(startFreq, endFreq, duration, volume) {
        if (!audioContext) return { oscillator: null, gainNode: null, duration };

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(startFreq, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(endFreq, audioContext.currentTime + duration);
        oscillator.type = 'sawtooth';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

        return { oscillator, gainNode, duration };
    }

    function createSparkleSound(duration, volume) {
        if (!audioContext) return { oscillators: [], duration };

        const oscillators = [];

        for (let i = 0; i < 6; i++) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 1000 + Math.random() * 2000;
            oscillator.type = 'sine';

            const startTime = audioContext.currentTime + Math.random() * 0.1;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume * 0.5, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.5);

            oscillators.push({ oscillator, gainNode });
        }

        return { oscillators, duration };
    }

    function createBeeHitSound() {
        if (!audioContext) return { oscillator: null, gainNode: null, duration: 0.3 };

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
        oscillator.type = 'sawtooth';

        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

        return { oscillator, gainNode, duration: 0.3 };
    }

    function createWhooshSound(duration, volume) {
        if (!audioContext) return { oscillator: null, gainNode: null, duration };

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + duration);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

        return { oscillator, gainNode, duration };
    }

    function createSwoopSound(duration, volume) {
        if (!audioContext) return { oscillator: null, gainNode: null, duration };

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(600, audioContext.currentTime + duration/2);
        oscillator.frequency.linearRampToValueAtTime(200, audioContext.currentTime + duration);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

        return { oscillator, gainNode, duration };
    }

    function createBubbleSound(duration, volume) {
        if (!audioContext) return { oscillators: [], duration };

        const oscillators = [];

        for (let i = 0; i < 3; i++) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 300 + i * 100;
            oscillator.type = 'sine';

            const startTime = audioContext.currentTime + i * 0.1;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume * 0.8, startTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.8);

            oscillators.push({ oscillator, gainNode });
        }

        return { oscillators, duration };
    }

    function createDeflectSound(duration, volume) {
        if (!audioContext) return { oscillator: null, gainNode: null, duration };

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + duration);
        oscillator.type = 'square';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

        return { oscillator, gainNode, duration };
    }

    function createPowerupActivateSound() {
        if (!audioContext) return { oscillators: [], duration: 0.5 };

        const oscillators = [];

        for (let i = 0; i < 4; i++) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 200 * (i + 1);
            oscillator.type = i % 2 === 0 ? 'sawtooth' : i === 1 ? 'triangle' : 'sawtooth';

            const startTime = audioContext.currentTime + i * 0.05;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

            oscillators.push({ oscillator, gainNode });
        }

        return { oscillators, duration: 0.5 };
    }

    function createFadeOutSound(duration, volume) {
        if (!audioContext) return { oscillator: null, gainNode: null, duration };

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 400;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

        return { oscillator, gainNode, duration };
    }

    function createComboStartSound() {
        if (!audioContext) return { oscillators: [], duration: 0.4 };

        const oscillators = [];
        const frequencies = [523.25, 659.25, 783.99, 1046.50];

        frequencies.forEach((freq, i) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = freq;
            oscillator.type = 'square';

            const startTime = audioContext.currentTime + i * 0.05;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

            oscillators.push({ oscillator, gainNode });
        });

        return { oscillators, duration: 0.4 };
    }

    function createChainSound(duration, volume) {
        if (!audioContext) return { oscillators: [], duration };

        const oscillators = [];

        for (let i = 0; i < 3; i++) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 600 + i * 100;
            oscillator.type = 'sine';

            const startTime = audioContext.currentTime + i * 0.05;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.7);

            oscillators.push({ oscillator, gainNode });
        }

        return { oscillators, duration };
    }

    function createBreakSound(duration, volume) {
        if (!audioContext) return { oscillator: null, gainNode: null, duration };

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + duration);
        oscillator.type = 'sawtooth';

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

        return { oscillator, gainNode, duration };
    }

    function createMilestoneSound(streak, duration, volume) {
        if (!audioContext) return { oscillators: [], duration };

        const oscillators = [];
        const noteCount = Math.min(streak / 5, 5);

        for (let i = 0; i < noteCount; i++) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 300 + i * 100;
            oscillator.type = 'triangle';

            const startTime = audioContext.currentTime + i * 0.1;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            oscillators.push({ oscillator, gainNode });
        }

        return { oscillators, duration };
    }

    function createGameStartSound() {
        if (!audioContext) return { oscillators: [], duration: 0.6 };

        const oscillators = [];
        const frequencies = [261.63, 329.63, 392.00, 523.25];

        frequencies.forEach((freq, i) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = freq;
            oscillator.type = 'sine';

            const startTime = audioContext.currentTime + i * 0.1;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

            oscillators.push({ oscillator, gainNode });
        });

        return { oscillators, duration: 0.6 };
    }

    function createGameOverSound() {
        if (!audioContext) return { oscillator: null, gainNode: null, duration: 0.8 };

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(130.81, audioContext.currentTime + 0.8);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);

        return { oscillator, gainNode, duration: 0.8 };
    }

    function createPauseSound() {
        if (!audioContext) return { oscillator: null, gainNode: null, duration: 0.1 };

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 200;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

        return { oscillator, gainNode, duration: 0.1 };
    }

    function createResumeSound() {
        if (!audioContext) return { oscillators: [], duration: 0.25 };

        const oscillators = [];

        for (let i = 0; i < 2; i++) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 300 + i * 100;
            oscillator.type = 'sine';

            const startTime = audioContext.currentTime + i * 0.05;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

            oscillators.push({ oscillator, gainNode });
        }

        return { oscillators, duration: 0.25 };
    }

    function createClickSound() {
        if (!audioContext) return { oscillator: null, gainNode: null, duration: 0.05 };

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);

        return { oscillator, gainNode, duration: 0.05 };
    }

    function createHoverSound() {
        if (!audioContext) return { oscillator: null, gainNode: null, duration: 0.1 };

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 600;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

        return { oscillator, gainNode, duration: 0.1 };
    }

    function createMenuOpenSound() {
        if (!audioContext) return { oscillator: null, gainNode: null, duration: 0.2 };

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(600, audioContext.currentTime + 0.2);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);

        return { oscillator, gainNode, duration: 0.2 };
    }

    function createMenuCloseSound() {
        if (!audioContext) return { oscillator: null, gainNode: null, duration: 0.2 };

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(300, audioContext.currentTime + 0.2);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);

        return { oscillator, gainNode, duration: 0.2 };
    }

    function createEvolutionSound() {
        if (!audioContext) return { oscillators: [], duration: 0.4 };

        const oscillators = [];
        const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51];

        frequencies.forEach((freq, i) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = freq;
            oscillator.type = 'triangle';

            const startTime = audioContext.currentTime + i * 0.08;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.12, startTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

            oscillators.push({ oscillator, gainNode });
        });

        return { oscillators, duration: 0.4 };
    }

    function createAchievementSound() {
        if (!audioContext) return { oscillators: [], duration: 0.35 };

        const oscillators = [];

        for (let i = 0; i < 5; i++) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800 + i * 200;
            oscillator.type = 'sine';

            const startTime = audioContext.currentTime + i * 0.05;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

            oscillators.push({ oscillator, gainNode });
        }

        return { oscillators, duration: 0.35 };
    }

    function createProgressSound() {
        if (!audioContext) return { oscillator: null, gainNode: null, duration: 0.15 };

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 400;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);

        return { oscillator, gainNode, duration: 0.15 };
    }

    function createCompleteSound() {
        if (!audioContext) return { oscillators: [], duration: 0.5 };

        const oscillators = [];
        const frequencies = [261.63, 329.63, 392.00];

        frequencies.forEach((freq, i) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = freq;
            oscillator.type = 'sine';

            const startTime = audioContext.currentTime + i * 0.1;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.12, startTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

            oscillators.push({ oscillator, gainNode });
        });

        return { oscillators, duration: 0.5 };
    }

    function playSound(soundType) {
        if (!settingsState.sfxOn || !isAudioInitialized || !audioContext || audioContext.state === 'suspended') return;

        const sound = audioBuffers[soundType];
        if (!sound) {
            return;
        }

        try {
            if (sound.oscillators) {
                sound.oscillators.forEach(({ oscillator, gainNode }) => {
                    const newOscillator = audioContext.createOscillator();
                    const newGainNode = audioContext.createGain();

                    newOscillator.connect(newGainNode);
                    newGainNode.connect(audioContext.destination);

                    newOscillator.frequency.value = oscillator.frequency.value;
                    newOscillator.type = oscillator.type;

                    const currentTime = audioContext.currentTime;
                    newGainNode.gain.cancelScheduledValues(currentTime);
                    newGainNode.gain.setValueAtTime(0, currentTime);
                    newGainNode.gain.linearRampToValueAtTime(gainNode.gain.value || 0.1, currentTime + 0.01);
                    newGainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + sound.duration);

                    newOscillator.start(currentTime);
                    newOscillator.stop(currentTime + sound.duration);
                });
            } else {
                const newOscillator = audioContext.createOscillator();
                const newGainNode = audioContext.createGain();

                newOscillator.connect(newGainNode);
                newGainNode.connect(audioContext.destination);

                newOscillator.frequency.value = sound.oscillator.frequency.value;
                newOscillator.type = sound.oscillator.type;

                const currentTime = audioContext.currentTime;
                newGainNode.gain.cancelScheduledValues(currentTime);
                newGainNode.gain.setValueAtTime(0, currentTime);
                newGainNode.gain.linearRampToValueAtTime(sound.gainNode.gain.value || 0.1, currentTime + 0.01);
                newGainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + sound.duration);

                newOscillator.start(currentTime);
                newOscillator.stop(currentTime + sound.duration);
            }
        } catch (error) {
            console.warn("Failed to play sound:", error);
        }
    }

    function startBackgroundMusic() {
        if (!settingsState.musicOn || musicPlaying) return;

        if (musicGainNode) {
            musicGainNode.gain.value = 0.6;
        }

        if (backgroundMusic && backgroundMusic.play) {
            backgroundMusic.play();
        } else {
            // Fallback to synthesized music
            musicPlaying = true;
            playSynthesizedMusic();
        }
    }

    function stopBackgroundMusic() {
        musicPlaying = false;

        if (musicGainNode) {
            musicGainNode.gain.value = 0;
        }

        if (backgroundMusic && backgroundMusic.stop) {
            backgroundMusic.stop();
        }

        if (musicSource) {
            clearTimeout(musicSource);
            musicSource = null;
        }
    }

    function setMusicVolume(volume) {
        const safeVolume = Math.max(0, Math.min(1, volume));

        if (backgroundMusic && backgroundMusic.setVolume) {
            backgroundMusic.setVolume(safeVolume);
        } else if (musicGainNode) {
            musicGainNode.gain.value = safeVolume;
        }

        if (musicAudioElement) {
            musicAudioElement.volume = safeVolume;
        }
    }

    function playCatchSound(jarType) {
        switch(jarType) {
            case 'gold':
                safePlaySound(SOUNDS.CATCH_GOLD);
                break;
            case 'shield':
                safePlaySound(SOUNDS.CATCH_SHIELD);
                break;
            case 'powerup':
                safePlaySound(SOUNDS.CATCH_POWERUP);
                break;
            default:
                safePlaySound(SOUNDS.CATCH_NORMAL);
        }
    }

    function playBeeHitSound() {
        safePlaySound(SOUNDS.BEE_HIT);
    }

    function playButtonClickSound() {
        safePlaySound(SOUNDS.BUTTON_CLICK);
    }

    function playGameStartSound() {
        safePlaySound(SOUNDS.GAME_START);
    }

    function playGameOverSound() {
        safePlaySound(SOUNDS.GAME_OVER);
    }

    function playShieldBlockSound() {
        safePlaySound(SOUNDS.SHIELD_BLOCK);
    }

    function playPowerupActivateSound() {
        safePlaySound(SOUNDS.POWERUP_ACTIVATE);
    }

    function playPowerupExpireSound() {
        safePlaySound(SOUNDS.POWERUP_EXPIRE);
    }

    function playComboSound() {
        safePlaySound(SOUNDS.COMBO_START);
    }

    function playStreakSound(streak) {
        if (streak === 5) {
            safePlaySound(SOUNDS.STREAK_5);
        } else if (streak === 10) {
            safePlaySound(SOUNDS.STREAK_10);
        }
    }

    function playEvolutionSound() {
        safePlaySound(SOUNDS.EVOLUTION_UPGRADE);
    }

    function playAchievementSound() {
        safePlaySound(SOUNDS.ACHIEVEMENT_UNLOCK);
    }

    function playPauseSound() {
        safePlaySound(SOUNDS.GAME_PAUSE);
    }

    function playResumeSound() {
        safePlaySound(SOUNDS.GAME_RESUME);
    }

    const keys = {
        left: false,
        right: false
    };

    // ==================== SETTINGS STATE ====================
    let settingsState = {
        musicOn: true,  // Changed to true by default
        sfxOn: true,    // Changed to true by default
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

    // ==================== DYNAMIC DIFFICULTY ====================
    let dynamicDifficulty = {
        multiplier: 1,
        performanceHistory: [],
        lastAdjustment: 0
    };

    // ==================== TUTORIAL SYSTEM ====================
    let tutorialState = {
        currentStep: 1,
        totalSteps: 4,
        completed: false
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

    // ==================== QUICK WINS CONSTANTS ====================
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

    const BEAR_EVOLUTIONS = [
        { score: 0, size: 1, color: "#fbbf24", hat: null, name: "Cub" },
        { score: 500, size: 1.1, color: "#f59e0b", hat: "cap", name: "Adventurer" },
        { score: 1000, size: 1.2, color: "#d97706", hat: "crown", name: "Champion" },
        { score: 2000, size: 1.3, color: "#92400e", hat: "majestic_crown", name: "Monarch" }
    ];

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
            playResumeSound();
        } else {
            pauseGame();
            playPauseSound();
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
                settingsState = {
                    musicOn: parsed.musicOn !== undefined ? parsed.musicOn : true,
                    sfxOn: parsed.sfxOn !== undefined ? parsed.sfxOn : true,
                    difficulty: parsed.difficulty !== undefined ? parsed.difficulty : 1
                };
            } else {
                // Default settings if none saved
                settingsState = {
                    musicOn: true,
                    sfxOn: true,
                    difficulty: 1
                };
            }

            const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
            if (savedTheme === "dark") {
                document.body.classList.add("dark");
                themeToggle.setAttribute("aria-pressed", "true");
                themeToggle.innerHTML = '<i class="fas fa-sun" aria-hidden="true"></i><span>Theme</span>';
            }

            // Load achievements
            const savedAchievements = localStorage.getItem("honeyHunt_achievements");
            if (savedAchievements) {
                gameState.achievements = JSON.parse(savedAchievements);
            }

            // Load daily challenge progress
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const savedDailyProgress = localStorage.getItem(`dailyChallenge_${today}`);
            if (savedDailyProgress) {
                gameState.dailyProgress = JSON.parse(savedDailyProgress);
            }
        } catch (e) {
            console.warn("Failed to load saved state", e);
            // Set default settings on error
            settingsState = {
                musicOn: true,
                sfxOn: true,
                difficulty: 1
            };
        }

        applySettingsToUi();
    }

    function saveProgress() {
        try {
            localStorage.setItem(STORAGE_KEYS.BEST, String(gameState.best));
            localStorage.setItem(STORAGE_KEYS.GAMES, String(gameState.gamesPlayed));
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settingsState));
            localStorage.setItem("honeyHunt_achievements", JSON.stringify(gameState.achievements || []));
            console.log("Settings saved:", settingsState);
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

        // Add sparkle particles for special jars
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

    // ==================== QUICK WINS: POWER-UP SYSTEM ====================
    function createPowerupIndicators() {
        // Remove existing indicators if any
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
        gameContainer.appendChild(container);
    }

    function activatePowerup(type) {
        const powerup = POWERUPS[type];
        if (!powerup) return;

        gameState.activeEffects[type] = {
            timeLeft: powerup.duration,
            ...powerup
        };

        gameState.stats.powerupsCollected++;

        // Update UI indicator
        const indicator = document.querySelector(`.powerup-indicator[data-type="${type}"]`);
        if (indicator) {
            indicator.classList.add('active');
            const timer = indicator.querySelector('.powerup-timer');
            if (timer) {
                timer.style.width = '100%';
            }
        }

        // Show notification
        showNotification(`Power-up: ${powerup.name} activated!`, powerup.color);
        playPowerupActivateSound();
    }

    function updatePowerups(dt) {
        for (const type in gameState.activeEffects) {
            const effect = gameState.activeEffects[type];
            effect.timeLeft -= dt;

            // Update UI timer
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

    // ==================== QUICK WINS: BEAR EVOLUTION ====================

    function showEvolutionUpgrade(level) {
        const evolution = BEAR_EVOLUTIONS[level];
        if (!evolution) return;

        const evolutionDisplay = document.getElementById("evolutionDisplay");
        if (!evolutionDisplay) {
            const display = document.createElement("div");
            display.id = "evolutionDisplay";
            display.className = "evolution-display";
            gameContainer.appendChild(display);
        }

        const display = document.getElementById("evolutionDisplay");
        display.innerHTML = `
        <span class="evolution-level">${level + 1}</span>
        <span class="evolution-name">${evolution.name} Bear</span>
        <span class="evolution-icon">${level === 0 ? '🐻' : level === 1 ? '🐻‍❄️' : level === 2 ? '👑' : '🏆'}</span>
    `;

        // Show with animation
        display.style.display = 'flex';
        display.style.animation = 'evolutionPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';

        // Hide after 3 seconds
        setTimeout(() => {
            display.style.animation = 'none';
            setTimeout(() => {
                display.style.display = 'none';
            }, 300);
        }, 3000);

        showNotification(`Evolved to ${evolution.name}!`, "#fbbf24");
        triggerHaptic("evolution");
        playEvolutionSound();
    }

    // ==================== QUICK WINS: ACHIEVEMENT SYSTEM ====================
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
        // Create popup element
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

        // Remove after animation
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 3000);

        liveRegion.textContent = `Achievement unlocked: ${achievement.name}! ${achievement.desc}`;
    }

    // ==================== QUICK WINS: DAILY CHALLENGE SYSTEM ====================
    function initDailyChallenge() {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const challenge = DAILY_CHALLENGES[today];

        const dailyChallengePanel = document.getElementById("dailyChallengePanel");
        const dailyChallengeText = document.getElementById("dailyChallengeText");
        const dailyChallengeProgress = document.getElementById("dailyChallengeProgress");
        const dailyChallengeReward = document.getElementById("dailyChallengeReward");

        if (!challenge || !dailyChallengePanel || !dailyChallengeText || !dailyChallengeProgress || !dailyChallengeReward) return;

        // Update UI
        dailyChallengeText.textContent = challenge.objective;
        dailyChallengeReward.innerHTML = `<span>🎁</span> Reward: ${challenge.reward}`;

        updateDailyChallengeProgress();

        // Show panel
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

        // Check if challenge completed
        if (progress >= challenge.target && (!gameState.dailyProgress || !gameState.dailyProgress.completed)) {
            completeDailyChallenge(challenge);
        }
    }

    function completeDailyChallenge(challenge) {
        gameState.dailyProgress.completed = true;
        gameState.dailyProgress.rewardClaimed = false;

        showNotification(`Daily Challenge Complete! Reward: ${challenge.reward}`, "#fbbf24");
        liveRegion.textContent = `Daily challenge completed! You earned: ${challenge.reward}`;
        playSound(SOUNDS.CHALLENGE_COMPLETE);

        // Save progress
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        localStorage.setItem(`dailyChallenge_${today}`, JSON.stringify(gameState.dailyProgress));
    }

    // ==================== QUICK WINS: NOTIFICATION SYSTEM ====================
    function showNotification(text, color) {
        // Create notification element
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

        // Remove after 2 seconds
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    // ==================== DRAWING FUNCTIONS ====================
    function drawBear() {
        const x = bear.x;
        const y = bear.y;
        const anim = bear.animation;
        const evolution = BEAR_EVOLUTIONS[gameState.currentEvolution];

        ctx.save();
        ctx.translate(x, y);

        // Apply evolution scaling
        if (evolution && evolution.size) {
            ctx.scale(evolution.size, evolution.size);
        }

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
            `rgba(0, 0, 0, 0.25)` :
            `rgba(0, 0, 0, 0.2)`;

        ctx.beginPath();
        ctx.ellipse(0, 40,
            anim.isMoving ? 32 : 28,
            anim.isMoving ? 12 : 10,
            0, 0, Math.PI * 2);
        ctx.fill();

        // ============= ENHANCED WINNIE THE POOH BODY =============

        // Body with Pooh's classic red shirt
        ctx.fillStyle = "#e02828"; // Pooh's classic red color
        ctx.beginPath();

        // Walking animation - slight leaning
        const leanOffset = anim.isMoving ? Math.sin(anim.walkCycle * 2) * 3 : 0;

        // Pooh's body - rounder and more huggable
        ctx.ellipse(leanOffset, 0, 32, 42, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw evolution hat if any
        if (evolution && evolution.hat) {
            drawEvolutionHat(evolution.hat);
        }

        // ============= ENHANCED HEAD =============
        drawBearHead(anim);

        // ============= ENHANCED ARMS =============
        drawBearArms(anim);

        // ============= ENHANCED HONEY JAR =============
        drawJarWithBear(anim);

        // ============= ADDITIONAL POOH DETAILS =============
        drawPoohDetails(anim);

        // Shield effect
        if (gameState.shieldTime > 0) {
            drawShieldEffect();
        }

        ctx.restore();
    }

    function drawBearHead(anim) {
        // Head with classic Pooh shape
        ctx.fillStyle = "#fbbf24"; // Lighter yellow for Pooh
        ctx.beginPath();

        // Classic Pooh head shape - rounder
        ctx.ellipse(0, -30, 24, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears with more character
        drawEars(anim);

        // Face with classic Pooh expression
        drawPoohFace(anim);

        // Neck and shirt collar
        ctx.fillStyle = "#e02828";
        ctx.beginPath();
        ctx.arc(0, -10, 18, 0.2, Math.PI - 0.2);
        ctx.fill();

        // Shirt collar detail
        ctx.fillStyle = "#b91c1c";
        ctx.beginPath();
        ctx.ellipse(0, -8, 20, 5, 0, 0, Math.PI);
        ctx.fill();
    }

    function drawEars(anim) {
        // Left ear with more animation
        ctx.save();
        ctx.translate(-18, -40);
        ctx.rotate(Math.sin(anim.walkCycle) * 0.15);

        // Outer ear
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        // Inner ear - lighter color
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Ear highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.arc(-2, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Right ear
        ctx.save();
        ctx.translate(18, -40);
        ctx.rotate(-Math.sin(anim.walkCycle) * 0.15);

        // Outer ear
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        // Inner ear
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Ear highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.arc(-2, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawPoohFace(anim) {
        // Eyes with blinking
        const blink = anim.blinkTimer < 0.1 ? 0.1 : 1;
        const isExcited = anim.mood === "excited";
        const isWorried = anim.mood === "worried";

        ctx.fillStyle = "#1f2937"; // Dark brown for Pooh's eyes

        // Left eye
        ctx.save();
        ctx.translate(-8, -28);
        ctx.scale(1, blink);

        // Eye shape - more rounded
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye sparkle (except when blinking)
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

        // Eye sparkle
        if (blink > 0.5) {
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(-1, -1, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Snout/nose
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
            // Big happy smile for excitement
            ctx.beginPath();
            ctx.arc(0, -15, 8, 0.1, Math.PI - 0.1);
            ctx.stroke();

            // Tongue sticking out
            ctx.fillStyle = "#fb7185";
            ctx.beginPath();
            ctx.ellipse(0, -8, 4, 3, 0, 0, Math.PI);
            ctx.fill();
        } else if (isWorried) {
            // Concerned expression
            ctx.beginPath();
            ctx.moveTo(-5, -15);
            ctx.quadraticCurveTo(0, -12, 5, -15);
            ctx.stroke();

            // Worry lines
            ctx.beginPath();
            ctx.moveTo(-2, -18);
            ctx.lineTo(-2, -16);
            ctx.moveTo(2, -18);
            ctx.lineTo(2, -16);
            ctx.stroke();
        } else {
            // Default gentle smile
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
        // Walking arm animation
        const armSwing = anim.isMoving ? Math.sin(anim.walkCycle * 4) * 20 : 0;

        // Left arm
        ctx.save();
        ctx.translate(-26, -8);
        ctx.rotate(armSwing * 0.04);

        // Arm sleeve (red part)
        ctx.fillStyle = "#e02828";
        ctx.beginPath();
        ctx.roundRect(-6, 0, 12, 28, 6);
        ctx.fill();

        // Arm end (yellow fur)
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.roundRect(-5, 28, 10, 10, 5);
        ctx.fill();

        // Paw
        ctx.fillStyle = "#d97706";
        ctx.beginPath();
        ctx.arc(0, 38, 8, 0, Math.PI * 2);
        ctx.fill();

        // Paw pads
        ctx.fillStyle = "#92400e";
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const px = Math.cos(angle) * 4;
            const py = 38 + Math.sin(angle) * 4;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Right arm
        ctx.save();
        ctx.translate(26, -8);
        ctx.rotate(-armSwing * 0.04);

        // Arm sleeve
        ctx.fillStyle = "#e02828";
        ctx.beginPath();
        ctx.roundRect(-6, 0, 12, 28, 6);
        ctx.fill();

        // Arm end
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.roundRect(-5, 28, 10, 10, 5);
        ctx.fill();

        // Paw
        ctx.fillStyle = "#d97706";
        ctx.beginPath();
        ctx.arc(0, 38, 8, 0, Math.PI * 2);
        ctx.fill();

        // Paw pads
        ctx.fillStyle = "#92400e";
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const px = Math.cos(angle) * 4;
            const py = 38 + Math.sin(angle) * 4;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawJarWithBear(anim) {
        // Jar body with honey level that changes with streak
        const honeyLevel = Math.min(0.7 + (gameState.streak * 0.02), 0.95);

        // Jar outline - more detailed
        ctx.fillStyle = "#7c2d12"; // Darker brown for jar
        ctx.beginPath();
        ctx.roundRect(-22, 10, 44, 50, 15);
        ctx.fill();

        // Jar glass effect with gradient
        const jarGradient = ctx.createLinearGradient(-20, 60, -20, 10);
        jarGradient.addColorStop(0, "rgba(254, 215, 170, 0.7)"); // Light amber
        jarGradient.addColorStop(0.3, "rgba(253, 186, 116, 0.9)"); // Medium amber
        jarGradient.addColorStop(1, "rgba(251, 146, 60, 0.95)"); // Dark amber

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

        // Jar label with Winnie the Pooh style
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

        // Jar lid with more detail
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
        ctx.fillStyle = "#fbbf24"; // Yellow buttons
        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.arc(0, 5 + (i * 15), 3, 0, Math.PI * 2);
            ctx.fill();

            // Button highlight
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            ctx.beginPath();
            ctx.arc(-1, 4 + (i * 15), 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fbbf24";
        }

        // Belly fur
        ctx.fillStyle = "#fde047"; // Lighter yellow for belly
        ctx.beginPath();
        ctx.ellipse(0, 10, 20, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs (simplified)
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

        // Outer shield - honey-themed
        const shieldGradient = ctx.createRadialGradient(0, -5, 0, 0, -5, 50 * pulse);
        shieldGradient.addColorStop(0, "rgba(251, 191, 36, 0.6)");
        shieldGradient.addColorStop(1, "rgba(251, 191, 36, 0.1)");

        ctx.fillStyle = shieldGradient;
        ctx.beginPath();
        ctx.arc(0, -5, 50 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Honeycomb pattern in shield
        ctx.strokeStyle = `rgba(120, 53, 15, ${alpha})`;
        ctx.lineWidth = 2;

        const hexSize = 15;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + performance.now() / 1000;
            const sx = Math.cos(angle) * 30;
            const sy = -5 + Math.sin(angle) * 30;

            // Draw hexagon
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

        // Rotating honey drips
        const dripTime = performance.now() / 800;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + dripTime;
            const sx = Math.cos(angle) * 40;
            const sy = -5 + Math.sin(angle) * 40;

            // Honey drip shape
            ctx.fillStyle = `rgba(251, 191, 36, ${alpha + 0.3})`;
            ctx.beginPath();
            ctx.ellipse(sx, sy, 3, 6, angle, 0, Math.PI * 2);
            ctx.fill();

            // Drip trail
            const trailLength = 8;
            const trailGradient = ctx.createLinearGradient(
                sx, sy - trailLength,
                sx, sy
            );
            trailGradient.addColorStop(0, "rgba(251, 191, 36, 0)");
            trailGradient.addColorStop(1, `rgba(251, 191, 36, ${alpha})`);

            ctx.fillStyle = trailGradient;
            ctx.beginPath();
            ctx.ellipse(sx, sy - trailLength/2, 2, trailLength, angle, 0, Math.PI * 2);
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

    function drawEvolutionHat(hatType) {
        if (!hatType) return;

        ctx.save();
        ctx.translate(0, -40);

        switch(hatType) {
            case 'cap':
                // Baseball cap
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
                // Simple crown
                ctx.fillStyle = "#fbbf24";
                const points = 5;
                const radius = 18;
                for (let i = 0; i < points; i++) {
                    const angle = (i * Math.PI * 2) / points - Math.PI/2;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (i === 0) {
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
                break;
            case 'majestic_crown':
                // Fancy crown
                ctx.fillStyle = "gold";
                ctx.beginPath();
                // Crown base
                ctx.roundRect(-20, -10, 40, 8, 3);
                // Crown spikes
                for (let i = 0; i < 5; i++) {
                    const x = -15 + i * 7.5;
                    ctx.moveTo(x, -10);
                    ctx.lineTo(x + 3.75, -20);
                    ctx.lineTo(x + 7.5, -10);
                }
                ctx.fill();
                // Jewels
                ctx.fillStyle = "#ef4444";
                ctx.beginPath();
                ctx.arc(0, -5, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        ctx.restore();
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

        // Reset power-up indicators
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
        const {fallSpeed} = difficultyConfig();
        const x = rand(30, world.width - 30);
        const kindRand = Math.random();
        let type = "normal";
        let value = 10;

        if (kindRand > 0.95) {
            // Power-up jar (5% chance)
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
        // Apply slow time effect
        const timeScale = gameState.activeEffects.SLOW_TIME ? 0.5 : 1;
        const scaledDt = dt * timeScale;

        const {jarRate, beeRate} = difficultyConfig();

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
                powerupIndicator.classList.remove("visible");
            }
        }

        // Update power-ups
        updatePowerups(dt);
    }

    // ==================== NEW UI/UX FUNCTIONS ====================

    // Floating Score System
    function createFloatingScore(amount, x, y, type = "normal") {
        const scoreElement = document.createElement("div");
        scoreElement.className = `floating-score ${type}`;
        scoreElement.textContent = amount > 0 ? `+${amount}` : amount;
        scoreElement.style.left = `${x}px`;
        scoreElement.style.top = `${y}px`;
        scoreElement.style.color = getScoreColor(type, amount);
        gameContainer.appendChild(scoreElement);
        setTimeout(() => { if (scoreElement.parentNode) scoreElement.parentNode.removeChild(scoreElement); }, 1000);
    }

    function getScoreColor(type, amount) {
        switch(type) {
            case "combo": return "#f97316";
            case "gold": return "#fbbf24";
            case "shield": return "#60a5fa";
            case "powerup": return "#22c55e";
            case "negative": return "#ef4444";
            default: return amount >= 30 ? "#f59e0b" : "#84cc16";
        }
    }

    function addScorePopup(amount, x, y, color, type = "normal") {
        scorePopups.push({
            amount: amount > 0 ? "+" + amount : String(amount),
            x,
            y,
            color,
            start: performance.now(),
            duration: 650
        });
        createFloatingScore(amount, x, y - 30, type);
    }

    // Haptic Feedback
    function triggerHaptic(feedbackType) {
        if ('vibrate' in navigator) {
            const patterns = {
                catch: 30,
                catchGold: [30, 20, 30],
                catchPowerup: 100,
                beeHit: [80, 40, 80],
                shieldBlock: 50,
                combo: [20, 20, 20, 20, 20],
                gameOver: [200],
                evolution: [50, 30, 50]
            };
            navigator.vibrate(patterns[feedbackType] || 30);
        }
    }

    // Tutorial System
    function initTutorial() {
        const tutorialOverlay = document.getElementById("tutorialOverlay");
        const skipTutorial = document.getElementById("skipTutorial");
        const nextTutorial = document.getElementById("nextTutorial");
        const startTutorial = document.getElementById("startTutorial");
        const hasSeenTutorial = localStorage.getItem("honeyHunt_tutorialSeen");
        if (!hasSeenTutorial && gameState.gamesPlayed === 0) showTutorial();
        if (skipTutorial) {
            skipTutorial.addEventListener("click", () => {
                hideTutorial();
                localStorage.setItem("honeyHunt_tutorialSeen", "true");
            });
        }
        if (nextTutorial) {
            nextTutorial.addEventListener("click", nextTutorialStep);
        }
        if (startTutorial) {
            startTutorial.addEventListener("click", () => {
                hideTutorial();
                localStorage.setItem("honeyHunt_tutorialSeen", "true");
                startGame();
            });
        }
    }

    function showTutorial() {
        const tutorialOverlay = document.getElementById("tutorialOverlay");
        if (tutorialOverlay) {
            tutorialOverlay.classList.add("visible");
            tutorialOverlay.setAttribute("aria-hidden", "false");
            updateTutorialStep();
        }
    }

    function hideTutorial() {
        const tutorialOverlay = document.getElementById("tutorialOverlay");
        if (tutorialOverlay) {
            tutorialOverlay.classList.remove("visible");
            tutorialOverlay.setAttribute("aria-hidden", "true");
        }
    }

    function nextTutorialStep() {
        if (tutorialState.currentStep < tutorialState.totalSteps) {
            tutorialState.currentStep++;
            updateTutorialStep();
        }
    }

    function updateTutorialStep() {
        document.querySelectorAll(".tutorial-step").forEach(step => step.classList.remove("active"));
        const currentStep = document.querySelector(`.tutorial-step[data-step="${tutorialState.currentStep}"]`);
        if (currentStep) {
            currentStep.classList.add("active");
        }
        document.querySelectorAll(".tutorial-dot").forEach((dot, index) => dot.classList.toggle("active", index + 1 === tutorialState.currentStep));
        const nextButton = document.getElementById("nextTutorial");
        const startButton = document.getElementById("startTutorial");
        if (nextButton && startButton) {
            if (tutorialState.currentStep === tutorialState.totalSteps) {
                nextButton.style.display = "none";
                startButton.style.display = "inline-flex";
            } else {
                nextButton.style.display = "inline-flex";
                startButton.style.display = "none";
            }
        }
    }

    // Dynamic Difficulty
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
        showDifficultyIndicator();
    }

    function showDifficultyIndicator() {
        if (Math.abs(dynamicDifficulty.multiplier - 1) > 0.05) {
            const indicator = document.createElement("div");
            indicator.className = "difficulty-indicator";
            indicator.textContent = dynamicDifficulty.multiplier > 1 ? "⚡ Harder" : "🕊️ Easier";
            indicator.style.cssText = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: ${dynamicDifficulty.multiplier > 1 ? "#ef4444" : "#22c55e"}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; z-index: 100; animation: fadeOut 1.5s ease forwards;`;
            gameContainer.appendChild(indicator);
            setTimeout(() => indicator.remove(), 1500);
        }
    }

    // Share Functionality
    function initShareFunctionality() {
        const shareButton = document.getElementById("shareScoreButton");
        if (!shareButton) return;
        shareButton.addEventListener("click", shareScore);
        shareButton.addEventListener("click", function() {
            this.classList.add("share-success");
            setTimeout(() => this.classList.remove("share-success"), 500);
        });
    }

    function shareScore() {
        const score = gameState.score;
        const best = gameState.best;
        const isNewBest = score === best && score > 0;
        const shareText = `I scored ${score} points${isNewBest ? ' (NEW BEST!)' : ''} in Honey Hunt! 🍯🐻\n\nCan you beat my score?\n\nPlay at: ${window.location.href}`;
        const shareData = {
            title: 'Honey Hunt Score',
            text: shareText,
            url: window.location.href
        };
        if (navigator.share && navigator.canShare(shareData)) {
            navigator.share(shareData)
                .then(() => showNotification('Score shared successfully!', '#22c55e'))
                .catch(err => fallbackShare(shareText));
        } else {
            fallbackShare(shareText);
        }
    }

    function fallbackShare(shareText) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareText)
                .then(() => showNotification('Score copied to clipboard! 📋', '#fbbf24'))
                .catch(err => prompt('Copy this text to share:', shareText));
        } else {
            prompt('Copy this text to share:', shareText);
        }
    }

    // Trail Effects
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

    // Button Click Sounds
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

    // ==================== UPDATED GAME FUNCTIONS ====================

    function handleCollisions() {
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
                    liveRegion.textContent = `Collected ${POWERUPS[jar.value].name} power-up!`;
                    triggerHaptic("catchPowerup");
                    addScorePopup("POWER UP!", bear.x, bear.y - 50, POWERUPS[jar.value].color, "powerup");
                    playSound(SOUNDS.POWERUP_COLLECT);
                    continue;
                }

                let mult = 1 + Math.min(gameState.streak * 0.05, 1.5);
                if (gameState.activeEffects.DOUBLE_POINTS) mult *= 2;
                let gain = Math.round(jar.value * mult);
                gameState.score += gain;
                gameState.streak += 1;
                gameState.stats.jarsCaught++;
                gameState.stats.consecutiveCatches++;
                if (gameState.streak > gameState.stats.highestCombo) gameState.stats.highestCombo = gameState.streak;
                if (jar.type === "gold") gameState.stats.goldJarsCaught++;
                const now = performance.now() / 1000;
                if (gameState.stats.lastCatchTime > 0) {
                    const timeDiff = now - gameState.stats.lastCatchTime;
                    if (gameState.stats.consecutiveCatches >= 5) {
                        const catchTime = timeDiff * 5;
                        if (catchTime < gameState.stats.fastest5Catches) gameState.stats.fastest5Catches = catchTime;
                    }
                }
                gameState.stats.lastCatchTime = now;
                const type = jar.type === "gold" ? "gold" : jar.type === "shield" ? "shield" : gameState.streak >= 10 ? "combo" : "normal";
                const popColor = jar.type === "gold" ? "#f97316" : jar.type === "shield" ? "#38bdf8" : gameState.streak >= 10 ? "#f97316" : "#0f766e";
                addScorePopup(gain, bear.x, bear.y - 50, popColor, type);
                createJarParticles(jar.x, jar.y, jar.type);
                triggerHaptic(jar.type === "gold" ? "catchGold" : "catch");
                playCatchSound(jar.type);

                // Play streak milestone sounds
                if (gameState.streak === 5 || gameState.streak === 10) {
                    playStreakSound(gameState.streak);
                }

                showComboIfNeeded();

                if (jar.type === "shield") {
                    gameState.shieldTime = 5;
                    powerupIndicator.classList.add("visible");
                    liveRegion.textContent = "Shield active for five seconds.";
                    triggerHaptic("shieldBlock");
                    playSound(SOUNDS.SHIELD_ACTIVATE);
                }
            }
        }

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
                    triggerHaptic("shieldBlock");
                    playShieldBlockSound();
                } else {
                    gameState.lives -= 1;
                    gameState.streak = 0;
                    gameState.stats.consecutiveCatches = 0;
                    createBeeHitParticles(bear.x, bear.y - 10);
                    shakeScreen(8, 0.4);
                    liveRegion.textContent = "Bee hit! Lives left: " + gameState.lives;
                    triggerHaptic("beeHit");
                    playBeeHitSound();
                    if (gameState.lives <= 0) {
                        endGame();
                        return;
                    }
                }
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
        triggerHaptic("combo");
        playComboSound();
    }

    function showComboIfNeeded() {
        streakValue.textContent = String(gameState.streak);
        if (gameState.streak >= 5) {
            if (streakBadge) {
                streakBadge.textContent = "Combo!";
                streakBadge.classList.add("visible");
            }
        } else {
            if (streakBadge) streakBadge.classList.remove("visible");
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

    function render() {
        ctx.clearRect(0, 0, world.width, world.height);

        // Apply screen shake
        if (screenShake.timer > 0) {
            screenShake.timer -= 1/60;
        }

        const shakeX = screenShake.timer > 0 ?
            (Math.random() - 0.5) * screenShake.intensity * (screenShake.timer / screenShake.duration) : 0;
        const shakeY = screenShake.timer > 0 ?
            (Math.random() - 0.5) * screenShake.intensity * (screenShake.timer / screenShake.duration) : 0;

        ctx.save();
        ctx.translate(shakeX, shakeY);

        // Draw game elements
        drawParticles();
        drawBearTrail();
        drawJars();
        drawBees();
        drawBear();

        // Draw magnet effect
        drawMagnetEffect();

        drawScorePopups();

        ctx.restore();
    }

    function updateHud() {
    try {
        // SAFE ELEMENT ACCESS - Always check if element exists
        if (scoreValue && 'textContent' in scoreValue) scoreValue.textContent = String(gameState.score);
        if (bestValue && 'textContent' in bestValue) bestValue.textContent = String(gameState.best);
        if (timeValue && 'textContent' in timeValue) timeValue.textContent = String(Math.max(0, Math.floor(gameState.timeLeft)));
        if (streakValue && 'textContent' in streakValue) streakValue.textContent = String(gameState.streak);
        
        if (livesValue && 'textContent' in livesValue) {
            const full = "♥".repeat(gameState.lives);
            const empty = "♡".repeat(MAX_LIVES - gameState.lives);
            livesValue.textContent = full + empty;
        }

        // Update combo badge safely
        if (streakBadge) {
            streakBadge.textContent = "Combo!";
            if (gameState.streak >= 5) {
                streakBadge.classList.add("visible");
            } else {
                streakBadge.classList.remove("visible");
            }
        }

        // Update powerup indicator
        if (powerupIndicator) {
            if (gameState.shieldTime > 0) {
                powerupIndicator.classList.add("visible");
            } else {
                powerupIndicator.classList.remove("visible");
            }
        }

        // Progress deck elements
        if (timeProgress && 'style' in timeProgress) {
            const percent = Math.max(0, Math.min(100, (gameState.timeLeft / GAME_DURATION) * 100));
            timeProgress.style.width = `${percent}%`;
            if (timeProgress.classList) {
                timeProgress.classList.toggle("low", percent < 25);
            }
        }
        
        if (timeSubtitle && 'textContent' in timeSubtitle) {
            const secondsLeft = Math.max(0, Math.ceil(gameState.timeLeft));
            timeSubtitle.textContent = secondsLeft > 0 ? `${secondsLeft}s to shine` : "Out of time";
        }

        if (streakProgress && 'style' in streakProgress) {
            const streakPercent = Math.min(50, gameState.streak) / 50 * 100;
            streakProgress.style.width = `${streakPercent}%`;
        }
        
        if (streakSubtitle && 'textContent' in streakSubtitle) {
            if (gameState.streak >= 20) {
                streakSubtitle.textContent = "Combo legend in motion";
            } else if (gameState.streak >= 10) {
                streakSubtitle.textContent = "Streak is heating up";
            } else {
                streakSubtitle.textContent = "Build that combo";
            }
        }

        // Session banner microcopy
        if (sessionDifficulty && 'textContent' in sessionDifficulty) {
            const level = DIFFICULTY_LABELS[settingsState.difficulty] || "Classic";
            sessionDifficulty.textContent = `${level} mode`;
        }
        
        if (sessionGames && 'textContent' in sessionGames) {
            const games = gameState.gamesPlayed || 0;
            sessionGames.textContent = `${games} lifetime run${games === 1 ? "" : "s"}`;
        }
        
        if (sessionMood && 'textContent' in sessionMood) {
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
        // Don't crash the game on UI update errors
    }
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
        playGameStartSound();
        if (settingsState.musicOn) startBackgroundMusic();
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
        if (finalScore) finalScore.textContent = String(gameState.score);
        if (finalBest) finalBest.textContent = String(gameState.best);
        if (overlayBest) overlayBest.textContent = String(gameState.best);
        if (overlayGames) overlayGames.textContent = String(gameState.gamesPlayed);

        showOverlay(gameOverOverlay);
        triggerHaptic("gameOver");
        playGameOverSound();
        stopBackgroundMusic();
    }

    // ==================== UI CONTROLS ====================
    function toggleHelp() {
        if (!helpPanel) return;
        const isOpen = helpPanel.classList.toggle("visible");
        helpPanel.setAttribute("aria-hidden", String(!isOpen));
        if (helpToggle) helpToggle.setAttribute("aria-expanded", String(isOpen));
        if (helpToggleSecondary) helpToggleSecondary.setAttribute("aria-expanded", String(isOpen));
        playSound(isOpen ? SOUNDS.MENU_OPEN : SOUNDS.MENU_CLOSE);
    }

    function openSettings() {
        console.log("Opening settings modal...");
        if (!settingsModal) {
            console.error("Settings modal element not found!");
            return;
        }
        settingsModal.classList.add("visible");
        settingsModal.style.display = "flex";
        if (settingsToggle) settingsToggle.setAttribute("aria-expanded", "true");
        if (settingsBest) settingsBest.textContent = String(gameState.best);
        if (settingsPanel) settingsPanel.focus();
        playSound(SOUNDS.MENU_OPEN);
        console.log("Settings modal opened");
    }

    function closeSettings() {
        console.log("Closing settings modal...");
        if (!settingsModal) return;
        settingsModal.classList.remove("visible");
        settingsModal.style.display = "none";
        if (settingsToggle) settingsToggle.setAttribute("aria-expanded", "false");
        playSound(SOUNDS.MENU_CLOSE);
        console.log("Settings modal closed");
    }

    function applySettingsToUi() {
        console.log("Applying settings to UI:", settingsState);

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

    function initTheme() {
        if (document.body.classList.contains("dark")) {
            if (themeToggle) {
                themeToggle.setAttribute("aria-pressed", "true");
                themeToggle.innerHTML = '<i class="fas fa-sun" aria-hidden="true"></i><span>Theme</span>';
            }
        } else {
            if (themeToggle) {
                themeToggle.setAttribute("aria-pressed", "false");
                themeToggle.innerHTML = '<i class="fas fa-moon" aria-hidden="true"></i><span>Theme</span>';
            }
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

        if (fullscreenToggle) {
            fullscreenToggle.innerHTML = `<i class="fas ${icon}" aria-hidden="true"></i><span>${text}</span>`;
        }
    }

    function initFullscreen() {
        if (!fullscreenToggle) return;

        fullscreenToggle.addEventListener("click", () => {
            if (isFullscreen()) {
                exitFullscreen();
            } else {
                enterFullscreen(gameContainer);
            }
            playButtonClickSound();
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
            if (settingsModal && settingsModal.classList.contains("visible")) {
                closeSettings();
                e.preventDefault();
            }
            if (helpPanel && helpPanel.classList.contains("visible")) {
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
        console.log("Initializing settings...");

        if (!settingsToggle) {
            console.error("Settings toggle button not found!");
            return;
        }

        if (!settingsModal) {
            console.error("Settings modal not found!");
            return;
        }

        if (!settingsClose) {
            console.error("Settings close button not found!");
            return;
        }

        console.log("All settings elements found, setting up event listeners...");

        // Setup settings toggle
        settingsToggle.addEventListener("click", function(e) {
            console.log("Settings toggle clicked!");
            e.preventDefault();
            e.stopPropagation();
            openSettings();
        });

        // Setup settings close
        settingsClose.addEventListener("click", function(e) {
            console.log("Settings close clicked!");
            e.preventDefault();
            e.stopPropagation();
            closeSettings();
        });

        // Close modal when clicking outside
        settingsModal.addEventListener("click", function(e) {
            if (e.target === settingsModal) {
                console.log("Clicked outside modal, closing...");
                closeSettings();
            }
        });

        // Setup music toggle
        if (musicToggle) {
            musicToggle.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log("Music toggle clicked, current state:", settingsState.musicOn);
                settingsState.musicOn = !settingsState.musicOn;
                applySettingsToUi();
                saveProgress();

                if (settingsState.musicOn) {
                    startBackgroundMusic();
                    setMusicVolume(0.6);
                    liveRegion.textContent = "Music enabled";
                    console.log("Music enabled");
                } else {
                    stopBackgroundMusic();
                    setMusicVolume(0);
                    liveRegion.textContent = "Music disabled";
                    console.log("Music disabled");
                }
                playButtonClickSound();
            });
        }

        // Setup SFX toggle
        if (sfxToggle) {
            sfxToggle.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log("SFX toggle clicked, current state:", settingsState.sfxOn);
                settingsState.sfxOn = !settingsState.sfxOn;
                applySettingsToUi();
                saveProgress();
                liveRegion.textContent = "Sound effects " + (settingsState.sfxOn ? "enabled" : "disabled");
                console.log("SFX:", settingsState.sfxOn ? "enabled" : "disabled");
                playButtonClickSound();
            });
        }

        // Setup difficulty buttons
        diffButtons.forEach(btn => {
            btn.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                const level = Number(btn.dataset.level);
                console.log("Difficulty button clicked, level:", level);
                settingsState.difficulty = level;
                applySettingsToUi();
                saveProgress();
                liveRegion.textContent = "Difficulty set to " + btn.textContent + ".";
                console.log("Difficulty set to:", level);
                playButtonClickSound();
            });
        });

        // Setup reset progress
        if (resetProgress) {
            resetProgress.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log("Reset progress clicked");
                if (confirm("Are you sure you want to reset all progress? This will delete your high score and games played.")) {
                    gameState.best = 0;
                    gameState.gamesPlayed = 0;
                    gameState.achievements = [];
                    saveProgress();
                    if (settingsBest) settingsBest.textContent = "0";
                    if (bestValue) bestValue.textContent = "0";
                    if (overlayBest) overlayBest.textContent = "0";
                    if (overlayGames) overlayGames.textContent = "0";
                    liveRegion.textContent = "Progress reset.";
                    console.log("Progress reset");
                    playButtonClickSound();
                }
            });
        }

        console.log("Settings initialization complete");
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
        initFullscreen();
    }

    function initOverlays() {
        if (startButton) startButton.addEventListener("click", startGame);
        if (resumeButton) resumeButton.addEventListener("click", resumeGame);
        if (restartButton) restartButton.addEventListener("click", startGame);
        if (restartButton2) restartButton2.addEventListener("click", startGame);

        if (overlayBest) overlayBest.textContent = String(gameState.best);
        if (overlayGames) overlayGames.textContent = String(gameState.gamesPlayed);
    }

    function initHelp() {
        if (helpToggle) helpToggle.addEventListener("click", toggleHelp);
        if (helpToggleSecondary) helpToggleSecondary.addEventListener("click", toggleHelp);
        if (helpClose) helpClose.addEventListener("click", toggleHelp);
        if (helpPanelPrimary) {
            helpPanelPrimary.addEventListener("click", () => {
                toggleHelp();
                startGame();
            });
        }
    }

    // ==================== QUICK WINS: CSS INJECTION ====================
    function injectQuickWinsCSS() {
    // Avoid injecting the same CSS block multiple times
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
            display: none;
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
            display: none;
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

        .achievements-container {
            max-height: 400px;
            overflow-y: auto;
            margin-top: 20px;
            padding: 15px;
            background: rgba(30, 41, 59, 0.9);
            border-radius: 15px;
            border: 2px solid #fbbf24;
        }

        .achievement {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 12px;
            margin-bottom: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            border-left: 4px solid #fbbf24;
        }

        .achievement-icon {
            font-size: 24px;
            min-width: 40px;
            text-align: center;
        }

        .achievement-name {
            font-weight: bold;
            color: #fbbf24;
            font-size: 16px;
        }

        .achievement-desc {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.id = "honey-powerup-css";
    styleSheet.textContent = powerupCSS;
    document.head.appendChild(styleSheet);
}

    // ==================== MAIN INITIALIZATION ====================
    let hasInitialized = false;

    function initOnce() {
        if (hasInitialized) return;
        hasInitialized = true;

        init();
    }

    function init() {
    console.log("Initializing Honey Hunt with Enhanced Features & Audio...");
    
    // CRITICAL SAFETY CHECK: Ensure essential elements exist
    const requiredElements = [
        { name: 'gameContainer', element: gameContainer },
        { name: 'canvas', element: canvas },
        { name: 'ctx', element: ctx },
        { name: 'scoreValue', element: scoreValue },
        { name: 'bestValue', element: bestValue },
        { name: 'timeValue', element: timeValue }
    ];
    
    const missingElements = requiredElements.filter(item => !item.element);
    
    if (missingElements.length > 0) {
        console.error("Essential game elements not found. Missing:", missingElements.map(item => item.name).join(', '));
        
        // Show user-friendly error
        const errorDiv = document.createElement('div');
        errorDiv.id = 'gameInitError';
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #dc2626;
            color: white;
            padding: 30px;
            border-radius: 15px;
            z-index: 99999;
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        
        errorDiv.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 15px;">⚠️ Game Initialization Error</h3>
            <p style="margin-bottom: 20px; line-height: 1.5;">
                Some game elements could not be loaded. This might be due to:
            </p>
            <ul style="text-align: left; margin-bottom: 20px; padding-left: 20px;">
                <li>Page not fully loaded</li>
                <li>Missing HTML elements</li>
                <li>Browser compatibility issue</li>
            </ul>
            <button onclick="location.reload()" style="
                background: white;
                color: #dc2626;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                margin: 5px;
            ">Refresh Page</button>
            <button onclick="document.getElementById('gameInitError').remove()" style="
                background: transparent;
                color: white;
                border: 1px solid white;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                margin: 5px;
            ">Dismiss</button>
        `;
        
        document.body.appendChild(errorDiv);
        return; // Stop initialization
    }
    
    // Initialize settings UI first
    applySettingsToUi();
    
    // Setup canvas
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
    
    // Setup game container if needed
    if (gameContainer) {
        gameContainer.style.cssText = `
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
        `;
    }
    
    // Initialize subsystems
    injectQuickWinsCSS();
    loadPersistedState();
    resizeCanvas();
    
    // Initialize bear position
    bear.x = world.width / 2;
    bear.y = world.height * 0.85;
    
    // Initialize UI
    updateHud();
    
    // Initialize controls
    initControls();
    initSettings();
    initTopbar();
    initOverlays();
    initHelp();
    initTutorial();
    initShareFunctionality();
    
    // Safe audio initialization
    safeInitAudio();
    
    // Setup powerups and challenges
    createPowerupIndicators();
    initDailyChallenge();
    
    // Initialize animation timers
    bear.animation.blinkTimer = 1 + Math.random() * 2;
    dynamicDifficulty.multiplier = 1;
    dynamicDifficulty.performanceHistory = [];
    
    // Setup event listeners
    window.addEventListener("resize", resizeCanvas);
    
    // Handle visibility change for pause
    document.addEventListener("visibilitychange", function() {
        if (document.hidden && gameState.running && !gameState.paused) {
            pauseGame();
        }
    });
    
    // Start music after user interaction (required by browsers)
    function startMusicOnInteraction() {
        if (settingsState.musicOn && !musicPlaying) {
            safeBackgroundMusic();
        }
        document.removeEventListener('click', startMusicOnInteraction);
        document.removeEventListener('keydown', startMusicOnInteraction);
    }
    
    document.addEventListener('click', startMusicOnInteraction);
    document.addEventListener('keydown', startMusicOnInteraction);
    
    // Add button click sounds after audio is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", addButtonClickSounds);
    } else {
        setTimeout(addButtonClickSounds, 100);
    }
    
    // Initialize game state displays
    if (overlayBest) overlayBest.textContent = String(gameState.best);
    if (overlayGames) overlayGames.textContent = String(gameState.gamesPlayed);
    if (settingsBest) settingsBest.textContent = String(gameState.best);
    
    // Start game loop
    lastTimestamp = 0;
    requestAnimationFrame(gameLoop);
    
    // Show start screen
    showOverlay(startOverlay);
    
    // Log successful initialization
    console.log("Honey Hunt Enhanced with Audio initialized successfully!");
    console.log("Game stats:", {
        bestScore: gameState.best,
        gamesPlayed: gameState.gamesPlayed,
        difficulty: settingsState.difficulty,
        music: settingsState.musicOn,
        sfx: settingsState.sfxOn
    });
    
    // Announce readiness
    if (liveRegion) {
        liveRegion.textContent = "Honey Hunt game loaded. Press Start to begin or Space to start.";
    }
}
