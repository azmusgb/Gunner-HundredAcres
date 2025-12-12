// game.js - Simple Honey Hunt Game for Baby Gunnar's Shower

// Game Variables
let canvas, ctx;
let gameRunning = false;
let isPaused = false;
let score = 0;
let bestScore = 0;
let timeLeft = 60;
let lives = 3;
let poohX = 350;
let poohY = 500;
let poohWidth = 80;
let poohHeight = 80;

// Game Objects
let honeyJars = [];
let bees = [];
let fallingLeaves = [];
let gameInterval;
let countdownInterval;

// Key States
let keys = {
    ArrowLeft: false,
    ArrowRight: false
};

// DOM Elements
const gameCanvas = document.getElementById('gameCanvas');
const scoreValue = document.getElementById('scoreValue');
const timeValue = document.getElementById('timeValue');
const livesValue = document.getElementById('livesValue');
const bestValue = document.getElementById('bestValue');
const timeBar = document.getElementById('timeBar');
const statusBanner = document.getElementById('gameStatus');
const gameStartOverlay = document.getElementById('gameStartOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const gameStartButton = document.getElementById('gameStartButton');
const gameStartButtonOverlay = document.getElementById('gameStartButtonOverlay');
const gameRestartButton = document.getElementById('gameRestartButton');
const finalScore = document.getElementById('finalScore');
const pauseToggleButton = document.getElementById('togglePauseButton');
const controlLeft = document.getElementById('controlLeft');
const controlRight = document.getElementById('controlRight');

const BEST_SCORE_KEY = 'honeyHunt_bestScore_simple';

// Initialize Game
function initGame() {
    if (!gameCanvas) {
        console.error('Canvas not found!');
        return;
    }
    
    canvas = gameCanvas;
    ctx = canvas.getContext('2d');
    
    // Load best score
    const storedBest = localStorage.getItem(BEST_SCORE_KEY);
    bestScore = storedBest ? parseInt(storedBest, 10) || 0 : 0;
    updateStatus('Ready to play? Tap Start or press Space.');

    // Set up canvas size
    resizeCanvas();
    
    // Set up event listeners
    setupEventListeners();

    // Initial render
    render();
    updateUI();
    updatePauseButton();
    
    console.log('Game initialized');
}

// Resize canvas to container
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    if (container && canvas) {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        poohX = canvas.width / 2 - poohWidth / 2;
        poohY = canvas.height - poohHeight - 20;
    }
}

function updateStatus(message) {
    if (statusBanner) {
        statusBanner.textContent = message;
    }
}

function updatePauseButton() {
    if (!pauseToggleButton) return;

    pauseToggleButton.textContent = isPaused ? 'Resume' : 'Pause';
    pauseToggleButton.setAttribute('aria-pressed', isPaused);
    pauseToggleButton.disabled = !gameRunning;
}

function setupHoldControl(button, key) {
    if (!button) return;

    const setPressed = (pressed) => {
        keys[key] = pressed;
        button.setAttribute('aria-pressed', String(pressed));
    };

    ['mousedown', 'touchstart'].forEach((evt) => {
        button.addEventListener(evt, (e) => {
            e.preventDefault();
            setPressed(true);
        });
    });

    ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach((evt) => {
        button.addEventListener(evt, (e) => {
            e.preventDefault();
            setPressed(false);
        });
    });
}

// Set up event listeners
function setupEventListeners() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    [gameStartButton, gameStartButtonOverlay].forEach((btn) => {
        if (btn) {
            btn.addEventListener('click', startGame);
        }
    });

    if (gameRestartButton) {
        gameRestartButton.addEventListener('click', restartGame);
    }

    if (pauseToggleButton) {
        pauseToggleButton.addEventListener('click', togglePause);
    }

    setupHoldControl(controlLeft, 'ArrowLeft');
    setupHoldControl(controlRight, 'ArrowRight');

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('blur', () => {
        if (gameRunning && !isPaused) {
            pauseGame();
        }
    });
}

// Start Game
function startGame() {
    console.log('Starting game...');

    // Reset game state
    gameRunning = true;
    isPaused = false;
    score = 0;
    timeLeft = 60;
    lives = 3;
    honeyJars = [];
    bees = [];
    fallingLeaves = [];

    // Reset Pooh position
    poohX = canvas.width / 2 - poohWidth / 2;

    // Hide start overlay
    if (gameStartOverlay) {
        gameStartOverlay.style.display = 'none';
    }
    if (gameOverOverlay) {
        gameOverOverlay.style.display = 'none';
    }

    updateStatus('Catch as much honey as you can!');
    updatePauseButton();

    // Update UI
    updateUI();
    
    // Start game loop
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    countdownInterval = setInterval(() => {
        if (gameRunning && !isPaused) {
            timeLeft--;
            updateUI();

            if (timeLeft <= 0) {
                endGame('Time\'s up!');
            }
        }
    }, 1000);
    
    gameInterval = setInterval(gameLoop, 1000 / 60);
    
    console.log('Game started');
}

// Game Loop
function gameLoop() {
    if (!gameRunning) return;

    if (isPaused) {
        render();
        return;
    }

    // Update
    update();

    // Render
    render();
}

function handleKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        keys[e.key] = true;
        return;
    }

    if (e.code === 'Space') {
        e.preventDefault();
        if (!gameRunning) {
            startGame();
        } else {
            togglePause();
        }
    } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
    }
}

function handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        keys[e.key] = false;
    }
}

function pauseGame() {
    if (!gameRunning || isPaused) return;
    isPaused = true;
    updatePauseButton();
    updateStatus('Paused — press Resume, Space, or P to continue');
}

function resumeGame() {
    if (!gameRunning) return;
    isPaused = false;
    updatePauseButton();
    updateStatus('Back in the honey hunt!');
}

function togglePause() {
    if (!gameRunning) {
        startGame();
        return;
    }

    if (isPaused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

// Update Game State
function update() {
    // Move Pooh
    if (keys.ArrowLeft) {
        poohX -= 8;
        if (poohX < 0) poohX = 0;
    }
    if (keys.ArrowRight) {
        poohX += 8;
        if (poohX > canvas.width - poohWidth) poohX = canvas.width - poohWidth;
    }
    
    // Spawn honey jars (random)
    if (Math.random() < 0.03) {
        honeyJars.push({
            x: Math.random() * (canvas.width - 40),
            y: -40,
            width: 40,
            height: 50,
            speed: 3 + Math.random() * 2,
            type: Math.random() < 0.8 ? 'normal' : Math.random() < 0.9 ? 'gold' : 'special'
        });
    }
    
    // Spawn bees (less frequent)
    if (Math.random() < 0.01) {
        bees.push({
            x: Math.random() * (canvas.width - 30),
            y: -30,
            width: 30,
            height: 30,
            speed: 2 + Math.random() * 2
        });
    }
    
    // Spawn falling leaves (background effect)
    if (Math.random() < 0.02) {
        fallingLeaves.push({
            x: Math.random() * canvas.width,
            y: -20,
            size: 10 + Math.random() * 20,
            speed: 1 + Math.random() * 2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        });
    }
    
    // Update honey jars
    for (let i = honeyJars.length - 1; i >= 0; i--) {
        const jar = honeyJars[i];
        jar.y += jar.speed;
        
        // Check collision with Pooh
        if (jar.y + jar.height > poohY && 
            jar.y < poohY + poohHeight &&
            jar.x + jar.width > poohX && 
            jar.x < poohX + poohWidth) {
            
            // Add score based on jar type
            let points = 10;
            if (jar.type === 'gold') points = 30;
            if (jar.type === 'special') points = 50;
            
            score += points;
            updateUI();
            
            // Create particle effect
            createCatchEffect(jar.x + jar.width / 2, jar.y + jar.height / 2, jar.type);
            
            // Remove jar
            honeyJars.splice(i, 1);
        }
        // Remove if off screen
        else if (jar.y > canvas.height) {
            honeyJars.splice(i, 1);
        }
    }
    
    // Update bees
    for (let i = bees.length - 1; i >= 0; i--) {
        const bee = bees[i];
        bee.y += bee.speed;
        
        // Check collision with Pooh
        if (bee.y + bee.height > poohY && 
            bee.y < poohY + poohHeight &&
            bee.x + bee.width > poohX && 
            bee.x < poohX + poohWidth) {
            
            lives--;
            updateUI();
            updateStatus(`Ouch! ${lives} ${lives === 1 ? 'life' : 'lives'} left.`);

            // Create hit effect
            createHitEffect(bee.x + bee.width / 2, bee.y + bee.height / 2);
            
            // Remove bee
            bees.splice(i, 1);
            
            // Check game over
            if (lives <= 0) {
                endGame('No more lives!');
            }
        }
        // Remove if off screen
        else if (bee.y > canvas.height) {
            bees.splice(i, 1);
        }
    }
    
    // Update falling leaves
    for (let i = fallingLeaves.length - 1; i >= 0; i--) {
        const leaf = fallingLeaves[i];
        leaf.y += leaf.speed;
        leaf.rotation += leaf.rotationSpeed;
        
        // Remove if off screen
        if (leaf.y > canvas.height) {
            fallingLeaves.splice(i, 1);
        }
    }
}

// Render Game
function render() {
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.6, '#87CEEB');
    skyGradient.addColorStop(0.6, '#8B4513');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
    
    // Draw grass texture
    ctx.fillStyle = '#90C695';
    for (let i = 0; i < canvas.width; i += 4) {
        const height = 5 + Math.sin(i * 0.1) * 3;
        ctx.fillRect(i, canvas.height * 0.6, 2, height);
    }
    
    // Draw falling leaves
    fallingLeaves.forEach(leaf => {
        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.rotation);
        ctx.fillStyle = '#90C695';
        ctx.beginPath();
        ctx.ellipse(0, 0, leaf.size / 2, leaf.size / 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    
    // Draw honey jars
    honeyJars.forEach(jar => {
        ctx.save();
        
        // Jar shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(jar.x + 3, jar.y + 5, jar.width, jar.height);
        
        // Jar color based on type
        if (jar.type === 'gold') {
            ctx.fillStyle = '#FFD700';
        } else if (jar.type === 'special') {
            // Rainbow effect for special jars
            const gradient = ctx.createLinearGradient(jar.x, jar.y, jar.x, jar.y + jar.height);
            gradient.addColorStop(0, '#FF6B6B');
            gradient.addColorStop(0.5, '#4ECDC4');
            gradient.addColorStop(1, '#45B7D1');
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = '#f4a944';
        }
        
        // Jar body
        ctx.fillRect(jar.x, jar.y, jar.width, jar.height);
        
        // Jar lid
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(jar.x - 5, jar.y, jar.width + 10, 10);
        
        // Honey level
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        const honeyHeight = jar.height * 0.7;
        ctx.fillRect(jar.x + 5, jar.y + jar.height - honeyHeight, jar.width - 10, honeyHeight);
        
        // Jar label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('HONEY', jar.x + jar.width / 2, jar.y + jar.height / 2);
        
        ctx.restore();
    });
    
    // Draw bees
    bees.forEach(bee => {
        const wingFlap = Math.sin(Date.now() / 100) * 0.3;
        
        ctx.save();
        ctx.translate(bee.x + bee.width / 2, bee.y + bee.height / 2);
        
        // Bee body
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(0, 0, bee.width / 2, bee.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bee stripes
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-bee.width / 3, -bee.height / 6);
        ctx.lineTo(-bee.width / 3, bee.height / 6);
        ctx.moveTo(0, -bee.height / 6);
        ctx.lineTo(0, bee.height / 6);
        ctx.moveTo(bee.width / 3, -bee.height / 6);
        ctx.lineTo(bee.width / 3, bee.height / 6);
        ctx.stroke();
        
        // Wings
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        // Left wing
        ctx.save();
        ctx.rotate(-0.5 + wingFlap);
        ctx.beginPath();
        ctx.ellipse(-bee.width / 3, -bee.height / 2, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Right wing
        ctx.save();
        ctx.rotate(0.5 - wingFlap);
        ctx.beginPath();
        ctx.ellipse(bee.width / 3, -bee.height / 2, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ctx.restore();
    });
    
    // Draw Pooh
    drawPooh();
}

// Draw Pooh character
function drawPooh() {
    ctx.save();
    
    // Pooh shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(poohX + poohWidth / 2, poohY + poohHeight + 5, poohWidth / 2, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Pooh body
    ctx.fillStyle = '#f4a944';
    ctx.fillRect(poohX, poohY, poohWidth, poohHeight);
    
    // Pooh's red shirt
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(poohX + 10, poohY + 30, poohWidth - 20, poohHeight - 40);
    
    // Pooh head
    ctx.fillStyle = '#f4a944';
    ctx.beginPath();
    ctx.arc(poohX + poohWidth / 2, poohY - 10, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Pooh ears
    ctx.beginPath();
    ctx.arc(poohX + poohWidth / 2 - 15, poohY - 20, 10, 0, Math.PI * 2);
    ctx.arc(poohX + poohWidth / 2 + 15, poohY - 20, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Pooh face
    ctx.fillStyle = '#000000';
    
    // Eyes
    ctx.beginPath();
    ctx.arc(poohX + poohWidth / 2 - 8, poohY - 5, 3, 0, Math.PI * 2);
    ctx.arc(poohX + poohWidth / 2 + 8, poohY - 5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Nose
    ctx.beginPath();
    ctx.arc(poohX + poohWidth / 2, poohY + 5, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Smile
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(poohX + poohWidth / 2, poohY + 5, 10, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Honey pot in hand
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(poohX + 5, poohY + 10, 20, 25);
    ctx.fillStyle = '#f4a944';
    ctx.fillRect(poohX + 8, poohY + 15, 14, 15);
    
    ctx.restore();
}

// Create catch effect
function createCatchEffect(x, y, type) {
    // Simple particle effect
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const particle = {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: -Math.random() * 10,
                size: 3 + Math.random() * 4,
                color: type === 'gold' ? '#FFD700' : type === 'special' ? '#FF6B6B' : '#f4a944',
                life: 1
            };
            
            // Draw particle
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }, i * 30);
    }
}

// Create hit effect
function createHitEffect(x, y) {
    // Red flash effect
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Remove flash after 100ms
    setTimeout(() => {
        if (gameRunning) {
            render();
        }
    }, 100);
}

// Update UI
function updateUI() {
    if (scoreValue) scoreValue.textContent = score;
    if (timeValue) timeValue.textContent = `${Math.max(0, timeLeft)}s`;
    if (livesValue) livesValue.textContent = lives;
    if (bestValue) bestValue.textContent = bestScore;
    if (timeBar) {
        const percent = Math.max(0, timeLeft) / 60 * 100;
        timeBar.style.width = `${percent}%`;
        const track = timeBar.parentElement;
        if (track) {
            track.setAttribute('aria-valuenow', Math.max(0, timeLeft));
            track.setAttribute('aria-valuemin', '0');
            track.setAttribute('aria-valuemax', '60');
        }
    }
}

// End Game
function endGame(reason) {
    gameRunning = false;
    isPaused = false;

    if (gameInterval) {
        clearInterval(gameInterval);
    }
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem(BEST_SCORE_KEY, bestScore.toString());
    }

    // Update final score
    if (finalScore) {
        finalScore.textContent = score;
    }

    updateUI();
    updatePauseButton();
    updateStatus(reason);

    // Show game over overlay
    if (gameOverOverlay) {
        gameOverOverlay.style.display = 'flex';
    }
    
    console.log(`Game over: ${reason}`);
}

// Restart Game
function restartGame() {
    if (gameOverOverlay) {
        gameOverOverlay.style.display = 'none';
    }
    startGame();
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', initGame);
