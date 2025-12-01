// games.js - Enhanced Interactive Games with Professional Polish
class GameEngine {
  constructor() {
    this.animations = new Map();
    this.particles = new Map();
    this.gameStates = new Map();
    this.lastTime = 0;
    this.rafId = null;
  }

  init() {
    this.setupDefenseGame();
    this.setupHoneyGame();
    this.setupEventListeners();
    this.startAnimationLoop();
  }

  startAnimationLoop() {
    const loop = (time) => {
      const delta = time - this.lastTime;
      this.lastTime = time;
      
      // Update all animations
      this.animations.forEach((animation, id) => {
        if (animation.update(delta, time)) {
          animation.draw();
        }
      });
      
      // Update particles
      this.updateParticles(delta);
      
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  createParticleSystem(canvasId, config) {
    const system = new ParticleSystem(canvasId, config);
    this.particles.set(canvasId, system);
    return system;
  }
}

class ParticleSystem {
  constructor(canvasId, config) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas?.getContext('2d');
    this.particles = [];
    this.config = {
      maxParticles: 100,
      gravity: 0.1,
      wind: 0,
      ...config
    };
  }

  emit(x, y, count, options = {}) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * (options.spread || 3),
        vy: -Math.random() * (options.speed || 4),
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        size: options.size || 2 + Math.random() * 4,
        color: options.color || '#FFC42B',
        glow: options.glow || false
      });
    }
  }

  update(delta) {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += this.config.gravity;
      p.vx += this.config.wind;
      p.life -= p.decay;
      return p.life > 0;
    });
  }

  draw() {
    this.ctx.save();
    this.particles.forEach(p => {
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      
      if (p.glow) {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = p.color;
      }
      
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.shadowBlur = 0;
    });
    this.ctx.restore();
  }
}

class GameState {
  constructor() {
    this.score = 0;
    this.health = 100;
    this.money = 500;
    this.wave = 1;
    this.paused = false;
    this.gameOver = false;
  }
}

// Enhanced Tower Defense Game with Interactive Elements
class DefenseGame {
  constructor() {
    this.canvas = document.getElementById('defense-game');
    if (!this.canvas) return;
    
    this.setupCanvas();
    this.setupGameState();
    this.setupTowers();
    this.setupBees();
    this.setupProjectiles();
    this.setupUI();
    this.bindEvents();
  }

  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
    
    this.width = rect.width;
    this.height = rect.height;
    
    // Create offscreen canvas for background
    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = this.canvas.width;
    this.bgCanvas.height = this.canvas.height;
    this.bgCtx = this.bgCanvas.getContext('2d');
    this.bgCtx.scale(dpr, dpr);
  }

  setupGameState() {
    this.state = {
      score: 0,
      health: 100,
      money: 500,
      wave: 1,
      placingTower: null,
      selectedTower: null,
      gameSpeed: 1
    };
  }

  setupTowers() {
    this.towers = [
      {
        id: 1,
        x: 100,
        y: 80,
        type: 'pooh',
        range: 120,
        damage: 20,
        cooldown: 1000,
        lastShot: 0,
        cost: 100,
        color: '#FF6B35'
      },
      {
        id: 2,
        x: 250,
        y: 280,
        type: 'tigger',
        range: 80,
        damage: 40,
        cooldown: 2000,
        lastShot: 0,
        cost: 150,
        color: '#FFA500'
      },
      {
        id: 3,
        x: 400,
        y: 120,
        type: 'rabbit',
        range: 160,
        damage: 15,
        cooldown: 500,
        lastShot: 0,
        cost: 200,
        color: '#4ECDC4'
      }
    ];
  }

  setupBees() {
    this.bees = [];
    this.bossBee = null;
    this.beeSpawnTimer = 0;
    
    // Pre-bake bee sprites
    this.beeSprite = this.createBeeSprite();
    this.bossSprite = this.createBossSprite();
  }

  createBeeSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    
    // Draw bee with gradient
    const gradient = ctx.createRadialGradient(20, 20, 0, 20, 20, 15);
    gradient.addColorStop(0, '#FFF9C4');
    gradient.addColorStop(1, '#FFC42B');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(20, 20, 15, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Stripes
    ctx.fillStyle = '#000';
    ctx.fillRect(10, 15, 20, 3);
    ctx.fillRect(10, 20, 20, 3);
    
    // Wings
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(25, 10, 8, 5, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    
    return canvas;
  }

  setupProjectiles() {
    this.projectiles = [];
    this.particleSystem = new ParticleSystem('defense-game', {
      maxParticles: 200,
      gravity: 0.05
    });
  }

  setupUI() {
    this.ui = {
      towerButtons: [
        { type: 'pooh', cost: 100, icon: '🐻', color: '#FF6B35' },
        { type: 'tigger', cost: 150, icon: '🐯', color: '#FFA500' },
        { type: 'rabbit', cost: 200, icon: '🐰', color: '#4ECDC4' }
      ],
      showRange: false
    };
  }

  bindEvents() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ') this.togglePause();
      if (e.key === 'r') this.resetGame();
      if (e.key === '+') this.state.gameSpeed = Math.min(3, this.state.gameSpeed + 0.5);
      if (e.key === '-') this.state.gameSpeed = Math.max(0.5, this.state.gameSpeed - 0.5);
    });
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking tower button
    this.ui.towerButtons.forEach((btn, i) => {
      const btnX = 10;
      const btnY = 100 + i * 60;
      
      if (x >= btnX && x <= btnX + 50 && y >= btnY && y <= btnY + 50) {
        if (this.state.money >= btn.cost) {
          this.state.placingTower = btn.type;
        }
      }
    });
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (this.state.placingTower) {
      this.placeTower(x, y);
      return;
    }
    
    // Select tower
    this.state.selectedTower = null;
    this.towers.forEach(tower => {
      const dx = x - tower.x;
      const dy = y - tower.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 25) {
        this.state.selectedTower = tower;
        this.ui.showRange = true;
      }
    });
  }

  placeTower(x, y) {
    if (y < 50 || y > this.height - 50) return; // Keep towers away from edges
    
    const towerType = this.ui.towerButtons.find(b => b.type === this.state.placingTower);
    if (!towerType) return;
    
    if (this.state.money >= towerType.cost) {
      this.towers.push({
        id: Date.now(),
        x: x,
        y: y,
        type: this.state.placingTower,
        range: 120,
        damage: 20,
        cooldown: 1000,
        lastShot: 0,
        cost: towerType.cost,
        color: towerType.color
      });
      
      this.state.money -= towerType.cost;
      this.state.placingTower = null;
      
      // Particle effect
      this.particleSystem.emit(x, y, 30, {
        color: towerType.color,
        spread: 5,
        speed: 3
      });
    }
  }

  update(delta) {
    if (this.state.health <= 0) return;
    
    const adjustedDelta = delta * this.state.gameSpeed;
    
    // Update bees
    this.updateBees(adjustedDelta);
    
    // Update projectiles
    this.updateProjectiles(adjustedDelta);
    
    // Spawn new bees
    this.beeSpawnTimer += adjustedDelta;
    if (this.beeSpawnTimer > 2000) {
      this.spawnBee();
      this.beeSpawnTimer = 0;
    }
    
    // Tower shooting
    this.updateTowers(adjustedDelta);
  }

  spawnBee() {
    const isBoss = Math.random() < 0.1 && this.state.wave > 3;
    
    this.bees.push({
      id: Date.now(),
      x: 50,
      y: 200 + Math.random() * 20 - 10,
      speed: isBoss ? 0.3 : 0.5,
      health: isBoss ? 100 : 20,
      maxHealth: isBoss ? 100 : 20,
      isBoss: isBoss,
      pathProgress: 0
    });
  }

  updateTowers(delta) {
    this.towers.forEach(tower => {
      tower.lastShot += delta;
      
      if (tower.lastShot >= tower.cooldown) {
        const target = this.findTargetForTower(tower);
        if (target) {
          this.shootProjectile(tower, target);
          tower.lastShot = 0;
        }
      }
    });
  }

  findTargetForTower(tower) {
    let closest = null;
    let closestDist = Infinity;
    
    this.bees.forEach(bee => {
      const dx = bee.x - tower.x;
      const dy = bee.y - tower.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= tower.range && dist < closestDist) {
        closestDist = dist;
        closest = bee;
      }
    });
    
    return closest;
  }

  shootProjectile(tower, target) {
    this.projectiles.push({
      x: tower.x,
      y: tower.y,
      targetX: target.x,
      targetY: target.y,
      damage: tower.damage,
      color: tower.color,
      progress: 0,
      speed: 0.05
    });
  }

  updateProjectiles(delta) {
    this.projectiles = this.projectiles.filter(proj => {
      proj.progress += proj.speed * delta * 0.01;
      
      if (proj.progress >= 1) {
        // Hit target
        this.bees.forEach(bee => {
          const dx = bee.x - proj.targetX;
          const dy = bee.y - proj.targetY;
          if (Math.sqrt(dx * dx + dy * dy) < 15) {
            bee.health -= proj.damage;
            
            // Hit particles
            this.particleSystem.emit(bee.x, bee.y, 10, {
              color: proj.color,
              spread: 3,
              speed: 2
            });
          }
        });
        return false;
      }
      return true;
    });
  }

  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw background
    this.drawBackground();
    
    // Draw honey path
    this.drawHoneyPath();
    
    // Draw towers
    this.towers.forEach(tower => this.drawTower(tower));
    
    // Draw bees
    this.bees.forEach(bee => this.drawBee(bee));
    
    // Draw projectiles
    this.projectiles.forEach(proj => this.drawProjectile(proj));
    
    // Draw UI
    this.drawUI();
    
    // Draw particles
    this.particleSystem.draw();
    
    // Draw placing preview
    if (this.state.placingTower) {
      this.drawTowerPlacementPreview();
    }
  }

  drawBackground() {
    // Gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#1a5f7a');
    gradient.addColorStop(1, '#0a3d62');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Subtle grid
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    
    for (let x = 0; x < this.width; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y < this.height; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  drawHoneyPath() {
    const pathY = 200;
    const pathHeight = 100;
    
    // Glowing path
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = '#FFC42B';
    
    // Honey gradient
    const gradient = this.ctx.createLinearGradient(0, pathY, 0, pathY + pathHeight);
    gradient.addColorStop(0, '#FFE082');
    gradient.addColorStop(0.5, '#FFC42B');
    gradient.addColorStop(1, '#FF8C00');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.roundRect(50, pathY, this.width - 100, pathHeight, 25);
    this.ctx.fill();
    
    this.ctx.shadowBlur = 0;
    
    // Path outline
    this.ctx.strokeStyle = '#8B4513';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.roundRect(50, pathY, this.width - 100, pathHeight, 25);
    this.ctx.stroke();
    
    // Honey drips animation
    const time = Date.now() * 0.001;
    for (let i = 0; i < 5; i++) {
      const dripX = 100 + i * 150;
      const dripY = pathY + pathHeight + Math.sin(time * 2 + i) * 10;
      
      this.ctx.fillStyle = '#FFC42B';
      this.ctx.beginPath();
      this.ctx.ellipse(dripX, dripY, 8, 12, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawTower(tower) {
    // Tower base with glow
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = tower.color;
    
    // Base
    this.ctx.fillStyle = tower.color;
    this.ctx.beginPath();
    this.ctx.arc(tower.x, tower.y, 20, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Platform
    this.ctx.fillStyle = '#FFF';
    this.ctx.beginPath();
    this.ctx.arc(tower.x, tower.y, 15, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.shadowBlur = 0;
    
    // Tower icon
    const icons = {
      pooh: '🐻',
      tigger: '🐯',
      rabbit: '🐰'
    };
    
    this.ctx.font = '24px Arial';
    this.ctx.fillText(icons[tower.type], tower.x - 12, tower.y + 8);
    
    // Range indicator (when selected)
    if (this.state.selectedTower?.id === tower.id && this.ui.showRange) {
      this.ctx.strokeStyle = tower.color + '40';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }

  drawBee(bee) {
    // Bee body
    this.ctx.fillStyle = bee.isBoss ? '#FFD700' : '#FFC42B';
    
    // Health bar
    if (bee.health < bee.maxHealth) {
      const healthWidth = 40;
      const healthPercent = bee.health / bee.maxHealth;
      
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(bee.x - 20, bee.y - 30, healthWidth, 4);
      
      this.ctx.fillStyle = bee.isBoss ? '#FF4444' : '#4CAF50';
      this.ctx.fillRect(bee.x - 20, bee.y - 30, healthWidth * healthPercent, 4);
    }
    
    // Draw bee sprite
    this.ctx.save();
    this.ctx.translate(bee.x, bee.y);
    
    // Wing animation
    const wingAngle = Math.sin(Date.now() * 0.01) * 0.2;
    this.ctx.rotate(wingAngle);
    
    this.ctx.drawImage(bee.isBoss ? this.bossSprite : this.beeSprite, -20, -20, 40, 40);
    this.ctx.restore();
    
    // Boss crown
    if (bee.isBoss) {
      this.ctx.font = '20px Arial';
      this.ctx.fillText('👑', bee.x - 10, bee.y - 15);
    }
  }

  drawProjectile(proj) {
    const x = proj.x + (proj.targetX - proj.x) * proj.progress;
    const y = proj.y + (proj.targetY - proj.y) * proj.progress;
    
    // Glowing projectile
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = proj.color;
    
    this.ctx.fillStyle = proj.color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 6, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.shadowBlur = 0;
    
    // Trail
    this.ctx.strokeStyle = proj.color + '80';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(proj.x, proj.y);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  drawUI() {
    // Game info panel
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.roundRect(10, 10, 180, 80, 10);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillText(`Wave: ${this.state.wave}`, 20, 35);
    this.ctx.fillText(`Health: ${this.state.health}`, 20, 55);
    this.ctx.fillText(`Money: $${this.state.money}`, 20, 75);
    this.ctx.fillText(`Score: ${this.state.score}`, 20, 95);
    
    // Tower shop
    this.ui.towerButtons.forEach((btn, i) => {
      const btnX = 10;
      const btnY = 120 + i * 60;
      
      // Button background
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.roundRect(btnX, btnY, 50, 50, 8);
      this.ctx.fill();
      
      // Button icon
      this.ctx.font = '24px Arial';
      this.ctx.fillText(btn.icon, btnX + 13, btnY + 32);
      
      // Cost
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`$${btn.cost}`, btnX, btnY + 70);
      
      // Highlight if selected
      if (this.state.placingTower === btn.type) {
        this.ctx.strokeStyle = btn.color;
        this.ctx.lineWidth = 3;
        this.ctx.roundRect(btnX, btnY, 50, 50, 8);
        this.ctx.stroke();
      }
    });
    
    // Instructions
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.font = '12px Arial';
    this.ctx.fillText('Click towers to select', this.width - 150, 30);
    this.ctx.fillText('Space: Pause | R: Reset', this.width - 150, 50);
    this.ctx.fillText('+/ - : Speed Up/Down', this.width - 150, 70);
  }

  drawTowerPlacementPreview() {
    const rect = this.canvas.getBoundingClientRect();
    const towerType = this.ui.towerButtons.find(b => b.type === this.state.placingTower);
    
    if (!towerType) return;
    
    // Draw range preview
    this.ctx.strokeStyle = towerType.color + '40';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.arc(event.clientX - rect.left, event.clientY - rect.top, 120, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    // Draw tower preview
    this.ctx.fillStyle = towerType.color + '80';
    this.ctx.beginPath();
    this.ctx.arc(event.clientX - rect.left, event.clientY - rect.top, 20, 0, Math.PI * 2);
    this.ctx.fill();
  }

  togglePause() {
    this.state.paused = !this.state.paused;
  }

  resetGame() {
    this.setupGameState();
    this.setupTowers();
    this.setupBees();
    this.setupProjectiles();
  }
}

// Honey Catch Game with Physics and Interaction
class HoneyGame {
  constructor() {
    this.canvas = document.getElementById('honey-game');
    if (!this.canvas) return;
    
    this.setupCanvas();
    this.setupGameState();
    this.setupPhysics();
    this.setupObjects();
    this.bindEvents();
    this.startGameLoop();
  }

  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
    
    this.width = rect.width;
    this.height = rect.height;
    
    // Create parallax layers
    this.createParallaxLayers();
  }

  createParallaxLayers() {
    this.layers = [
      { speed: 0.1, color: '#1a5f7a', height: this.height },
      { speed: 0.3, color: '#0a3d62', height: this.height * 0.8 },
      { speed: 0.5, color: '#0c2461', height: this.height * 0.6 }
    ];
  }

  setupGameState() {
    this.state = {
      score: 0,
      lives: 3,
      time: 60,
      combo: 0,
      multiplier: 1,
      gameActive: true
    };
    
    this.pooh = {
      x: this.width / 2,
      y: this.height - 60,
      width: 60,
      height: 80,
      velocity: { x: 0, y: 0 },
      speed: 8,
      jumping: false
    };
  }

  setupPhysics() {
    this.gravity = 0.5;
    this.friction = 0.9;
    this.objects = [];
    this.particles = new ParticleSystem('honey-game', {
      maxParticles: 300,
      gravity: 0.2
    });
    
    this.spawnTimer = 0;
    this.spawnRate = 1000; // ms
  }

  setupObjects() {
    // Initial objects
    for (let i = 0; i < 5; i++) {
      this.spawnObject();
    }
  }

  bindEvents() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowLeft':
          this.pooh.velocity.x = -this.pooh.speed;
          break;
        case 'ArrowRight':
          this.pooh.velocity.x = this.pooh.speed;
          break;
        case ' ':
          if (!this.pooh.jumping) {
            this.pooh.velocity.y = -15;
            this.pooh.jumping = true;
          }
          break;
      }
    });
    
    document.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        this.pooh.velocity.x = 0;
      }
    });
    
    // Touch/mouse controls
    this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
    this.canvas.addEventListener('mousedown', this.handleClick.bind(this));
    
    // Mouse movement for desktop
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.state.gameActive) return;
      
      const rect = this.canvas.getBoundingClientRect();
      const targetX = e.clientX - rect.left;
      
      // Smooth follow
      this.pooh.x += (targetX - this.pooh.x) * 0.1;
    });
  }

  handleTouch(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const targetX = touch.clientX - rect.left;
    
    this.pooh.x = targetX;
    
    // Jump on double tap
    if (!this.pooh.jumping) {
      this.pooh.velocity.y = -15;
      this.pooh.jumping = true;
    }
  }

  spawnObject() {
    const types = ['honey', 'golden', 'rock'];
    const weights = [0.7, 0.2, 0.1];
    let rand = Math.random();
    let typeIndex = 0;
    
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        typeIndex = i;
        break;
      }
    }
    
    const type = types[typeIndex];
    
    this.objects.push({
      x: Math.random() * (this.width - 40),
      y: -50,
      type: type,
      width: 40,
      height: 40,
      velocity: { x: 0, y: 2 + Math.random() * 3 },
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1
    });
  }

  update(delta) {
    if (!this.state.gameActive) return;
    
    // Update timer
    this.state.time -= delta / 1000;
    if (this.state.time <= 0) {
      this.state.gameActive = false;
      return;
    }
    
    // Update Pooh
    this.updatePooh(delta);
    
    // Update objects
    this.updateObjects(delta);
    
    // Spawn new objects
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnRate) {
      this.spawnObject();
      this.spawnTimer = 0;
      this.spawnRate = Math.max(300, this.spawnRate * 0.99); // Gradually increase difficulty
    }
    
    // Check collisions
    this.checkCollisions();
  }

  updatePooh(delta) {
    // Apply physics
    this.pooh.velocity.y += this.gravity;
    this.pooh.x += this.pooh.velocity.x;
    this.pooh.y += this.pooh.velocity.y;
    
    // Apply friction
    this.pooh.velocity.x *= this.friction;
    
    // Boundary check
    this.pooh.x = Math.max(this.pooh.width / 2, 
                         Math.min(this.width - this.pooh.width / 2, this.pooh.x));
    
    // Floor collision
    if (this.pooh.y > this.height - this.pooh.height / 2) {
      this.pooh.y = this.height - this.pooh.height / 2;
      this.pooh.velocity.y = 0;
      this.pooh.jumping = false;
    }
  }

  updateObjects(delta) {
    this.objects = this.objects.filter(obj => {
      obj.y += obj.velocity.y;
      obj.x += obj.velocity.x;
      obj.rotation += obj.rotationSpeed;
      
      // Bounce off walls
      if (obj.x <= 0 || obj.x >= this.width) {
        obj.velocity.x *= -0.8;
      }
      
      return obj.y < this.height + 100; // Remove if far below screen
    });
  }

  checkCollisions() {
    this.objects.forEach((obj, index) => {
      const dx = obj.x - this.pooh.x;
      const dy = obj.y - this.pooh.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = (obj.width + this.pooh.width) / 2;
      
      if (distance < minDistance) {
        // Collision detected
        this.handleCollision(obj);
        this.objects.splice(index, 1);
      }
    });
  }

  handleCollision(obj) {
    const particleColor = obj.type === 'rock' ? '#888' : 
                         obj.type === 'golden' ? '#FFD700' : '#FFC42B';
    
    this.particles.emit(obj.x, obj.y, 20, {
      color: particleColor,
      spread: 5,
      speed: 3
    });
    
    if (obj.type === 'rock') {
      this.state.lives--;
      this.state.combo = 0;
      this.state.multiplier = 1;
      
      // Screen shake effect
      this.shakeScreen(10);
      
      if (this.state.lives <= 0) {
        this.state.gameActive = false;
      }
    } else {
      this.state.combo++;
      this.state.multiplier = Math.min(5, 1 + Math.floor(this.state.combo / 10));
      
      const baseScore = obj.type === 'golden' ? 100 : 50;
      this.state.score += baseScore * this.state.multiplier;
    }
  }

  shakeScreen(intensity) {
    this.canvas.style.transform = `translate(${Math.random() * intensity - intensity/2}px, 
                                             ${Math.random() * intensity - intensity/2}px)`;
    
    setTimeout(() => {
      this.canvas.style.transform = 'translate(0, 0)';
    }, 100);
  }

  draw() {
    // Clear with fade effect for motion blur
    this.ctx.fillStyle = 'rgba(26, 95, 122, 0.1)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw parallax background
    this.drawParallaxBackground();
    
    // Draw objects
    this.objects.forEach(obj => this.drawObject(obj));
    
    // Draw Pooh
    this.drawPooh();
    
    // Draw particles
    this.particles.draw();
    
    // Draw UI
    this.drawUI();
    
    // Draw game over screen
    if (!this.state.gameActive) {
      this.drawGameOver();
    }
  }

  drawParallaxBackground() {
    const time = Date.now() * 0.001;
    
    this.layers.forEach((layer, i) => {
      this.ctx.fillStyle = layer.color;
      this.ctx.fillRect(0, this.height - layer.height, this.width, layer.height);
      
      // Animated clouds
      this.ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + i * 0.1})`;
      for (let j = 0; j < 3; j++) {
        const cloudX = (time * 20 * layer.speed + j * 200) % (this.width + 200) - 100;
        const cloudY = 50 + j * 60;
        const cloudSize = 40 + j * 10;
        
        this.ctx.beginPath();
        this.ctx.arc(cloudX, cloudY, cloudSize, 0, Math.PI * 2);
        this.ctx.arc(cloudX + cloudSize * 0.7, cloudY - 20, cloudSize * 0.6, 0, Math.PI * 2);
        this.ctx.arc(cloudX + cloudSize * 1.4, cloudY, cloudSize * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }

  drawPooh() {
    this.ctx.save();
    this.ctx.translate(this.pooh.x, this.pooh.y);
    
    // Apply jump squash/stretch
    const jumpFactor = 1 - Math.abs(this.pooh.velocity.y) * 0.02;
    this.ctx.scale(1, Math.max(0.7, Math.min(1.3, jumpFactor)));
    
    // Body with gradient
    const bodyGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
    bodyGradient.addColorStop(0, '#FFD166');
    bodyGradient.addColorStop(1, '#FF9E00');
    
    this.ctx.fillStyle = bodyGradient;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 30, 40, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Tummy
    this.ctx.fillStyle = '#FFF9C4';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 5, 20, 25, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Shadow/outline
    this.ctx.strokeStyle = '#FF8C00';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 30, 40, 0, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Face
    this.ctx.font = '30px Arial';
    this.ctx.fillText('🐻', -15, 10);
    
    this.ctx.restore();
  }

  drawObject(obj) {
    this.ctx.save();
    this.ctx.translate(obj.x, obj.y);
    this.ctx.rotate(obj.rotation);
    
    // Glow effect for golden pots
    if (obj.type === 'golden') {
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = '#FFD700';
    }
    
    switch(obj.type) {
      case 'honey':
        this.drawHoneyPot();
        break;
      case 'golden':
        this.drawGoldenPot();
        break;
      case 'rock':
        this.drawRock();
        break;
    }
    
    this.ctx.shadowBlur = 0;
    this.ctx.restore();
  }

  drawHoneyPot() {
    // Pot body
    this.ctx.fillStyle = '#8B4513';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 15, 20, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Honey
    const honeyGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
    honeyGradient.addColorStop(0, '#FFD166');
    honeyGradient.addColorStop(1, '#FF9E00');
    
    this.ctx.fillStyle = honeyGradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Handle
    this.ctx.strokeStyle = '#D2691E';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(0, -15, 5, Math.PI, 0);
    this.ctx.stroke();
  }

  drawGoldenPot() {
    // Pot body with gradient
    const potGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
    potGradient.addColorStop(0, '#FFEA00');
    potGradient.addColorStop(1, '#FF8C00');
    
    this.ctx.fillStyle = potGradient;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 15, 20, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Highlight
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(-8, -8, 5, 3, Math.PI / 4, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawRock() {
    // Rock with texture
    this.ctx.fillStyle = '#666';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Texture lines
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(-10, -5);
    this.ctx.lineTo(5, 8);
    this.ctx.moveTo(-5, 10);
    this.ctx.lineTo(10, -8);
    this.ctx.stroke();
  }

  drawUI() {
    // Score display with shadow
    this.ctx.shadowBlur = 4;
    this.ctx.shadowColor = '#000';
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.roundRect(10, 10, 200, 120, 15);
    this.ctx.fill();
    
    this.ctx.shadowBlur = 0;
    
    // Text
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText(`Score: ${this.state.score}`, 20, 40);
    
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillStyle = this.state.lives > 1 ? '#4CAF50' : '#FF4444';
    this.ctx.fillText(`Lives: ${this.state.lives}`, 20, 70);
    
    this.ctx.fillStyle = this.state.time > 10 ? '#2196F3' : '#FF4444';
    this.ctx.fillText(`Time: ${Math.ceil(this.state.time)}s`, 20, 100);
    
    // Combo display
    if (this.state.combo > 0) {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = `bold ${20 + this.state.combo}px Arial`;
      this.ctx.fillText(`${this.state.combo}x COMBO!`, this.width / 2 - 60, 50);
      this.ctx.fillText(`x${this.state.multiplier}`, this.width / 2 - 20, 80);
    }
    
    // Controls hint
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.font = '12px Arial';
    this.ctx.fillText('← → : Move | SPACE : Jump', this.width - 180, 30);
    this.ctx.fillText('Click/Tap to move Pooh', this.width - 180, 50);
  }

  drawGameOver() {
    // Overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Game over text
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);
    
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Final Score: ${this.state.score}`, this.width / 2, this.height / 2);
    
    // Restart button
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = this.width / 2 - buttonWidth / 2;
    const buttonY = this.height / 2 + 50;
    
    this.ctx.fillStyle = '#4CAF50';
    this.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText('PLAY AGAIN', this.width / 2, buttonY + 32);
    
    // Make button clickable
    this.canvas.style.cursor = 'pointer';
    this.canvas.onclick = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (x >= buttonX && x <= buttonX + buttonWidth && 
          y >= buttonY && y <= buttonY + buttonHeight) {
        this.resetGame();
      }
    };
  }

  startGameLoop() {
    let lastTime = 0;
    
    const loop = (time) => {
      const delta = time - lastTime;
      lastTime = time;
      
      this.update(delta);
      this.draw();
      
      requestAnimationFrame(loop);
    };
    
    requestAnimationFrame(loop);
  }

  resetGame() {
    this.setupGameState();
    this.setupPhysics();
    this.setupObjects();
    this.canvas.style.cursor = 'default';
    this.canvas.onclick = null;
  }
}

// Initialize games when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const defenseGame = new DefenseGame();
  const honeyGame = new HoneyGame();

  // Expose to global scope for debugging
  window.defenseGame = defenseGame;
  window.honeyGame = honeyGame;

  const speedDisplay = document.getElementById('game-speed');
  if (speedDisplay && defenseGame) {
    const updateSpeedDisplay = () => {
      const speed = defenseGame.state.gameSpeed || 1;
      speedDisplay.textContent = `${Number(speed.toFixed(1)).toString()}x`;
      requestAnimationFrame(updateSpeedDisplay);
    };
    updateSpeedDisplay();
  }
  
  // Add CSS for canvas styling
  const style = document.createElement('style');
  style.textContent = `
    canvas {
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      transition: transform 0.3s ease;
    }
    
    canvas:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.4);
    }
    
    .game-container {
      position: relative;
      overflow: hidden;
    }
    
    .game-title {
      font-family: 'Arial Rounded MT Bold', sans-serif;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    }
  `;
  document.head.appendChild(style);
});
