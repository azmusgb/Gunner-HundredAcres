// game.js — Honey Pot Catch (Performance Optimized Ultimate Edition)
'use strict';

(function () {
  // ---------------------------------------------------------------------------
  // PERFORMANCE MONITORING & DEBUGGING
  // ---------------------------------------------------------------------------
  const DEBUG_MODE = localStorage.getItem('honeyDebug') === 'true';
  const PERFORMANCE_SAMPLING_RATE = 1000; // ms
  
  class PerformanceMonitor {
    constructor() {
      this.frameTimes = [];
      this.lastSampleTime = 0;
      this.sampleCount = 0;
      this.memorySamples = [];
      this.maxMemoryUsage = 0;
      this.fps = 60;
      this.startTime = performance.now();
      
      if (DEBUG_MODE) {
        this.setupDebugPanel();
      }
    }
    
    recordFrame(deltaTime) {
      this.frameTimes.push(deltaTime);
      if (this.frameTimes.length > 60) this.frameTimes.shift();
      
      const now = performance.now();
      if (now - this.lastSampleTime >= PERFORMANCE_SAMPLING_RATE) {
        this.calculateFPS();
        this.sampleMemory();
        this.lastSampleTime = now;
        this.sampleCount++;
        
        if (DEBUG_MODE) {
          this.updateDebugPanel();
        }
        
        // Auto-optimize if performance degrades
        if (this.fps < 30 && this.sampleCount > 5) {
          this.triggerOptimization();
        }
        
        // Memory warning
        if (this.maxMemoryUsage > 100) { // 100MB threshold
          this.showMemoryWarning();
        }
      }
    }
    
    calculateFPS() {
      if (this.frameTimes.length === 0) {
        this.fps = 60;
        return;
      }
      
      const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      this.fps = Math.round(1000 / avgFrameTime);
    }
    
    sampleMemory() {
      if (performance.memory) {
        const usedJSHeapSize = performance.memory.usedJSHeapSize;
        const memoryMB = Math.round(usedJSHeapSize / (1024 * 1024));
        this.memorySamples.push(memoryMB);
        if (this.memorySamples.length > 30) this.memorySamples.shift();
        this.maxMemoryUsage = Math.max(this.maxMemoryUsage, memoryMB);
      }
    }
    
    triggerOptimization() {
      console.warn('[Performance] Auto-optimizing due to low FPS:', this.fps);
      
      // Reduce particle count
      if (window.game?.particles) {
        window.game.particles.maxParticles = Math.floor(window.game.particles.maxParticles * 0.7);
      }
      
      // Reduce object pool sizes
      if (window.game?.objectPools) {
        Object.values(window.game.objectPools).forEach(pool => {
          pool.maxSize = Math.floor(pool.maxSize * 0.8);
          pool.optimize();
        });
      }
      
      // Clear old samples
      this.frameTimes.length = 0;
      this.sampleCount = 0;
    }
    
    showMemoryWarning() {
      const warningEl = document.getElementById('memoryWarning');
      if (warningEl && !warningEl.style.display || warningEl.style.display === 'none') {
        warningEl.style.display = 'block';
        setTimeout(() => {
          warningEl.style.display = 'none';
        }, 5000);
      }
    }
    
    setupDebugPanel() {
      const panel = document.getElementById('debugPanel');
      if (panel) {
        panel.style.display = 'block';
      }
    }
    
    updateDebugPanel() {
      if (!DEBUG_MODE) return;
      
      const objects = window.game?.state?.pots?.length + window.game?.state?.bees?.length + window.game?.state?.powerUps?.length || 0;
      const particles = window.game?.particles?.getCount?.() || 0;
      const memory = this.memorySamples.length > 0 ? this.memorySamples[this.memorySamples.length - 1] : 0;
      
      document.getElementById('debugObjects')?.textContent = objects;
      document.getElementById('debugParticles')?.textContent = particles;
      document.getElementById('debugMemory')?.textContent = memory;
      document.getElementById('debugDrawCalls')?.textContent = window.game?.drawCallCount || 0;
      document.getElementById('fpsCounter')?.textContent = this.fps;
      document.getElementById('memoryCounter')?.textContent = memory;
    }
    
    getPerformanceGrade() {
      if (this.fps >= 55) return 'A';
      if (this.fps >= 45) return 'B';
      if (this.fps >= 30) return 'C';
      return 'D';
    }
    
    logPerformance() {
      console.log(`[Performance] FPS: ${this.fps}, Memory: ${this.maxMemoryUsage}MB, Grade: ${this.getPerformanceGrade()}`);
    }
  }

  // ---------------------------------------------------------------------------
  // MEMORY-MANAGED OBJECT POOLS
  // ---------------------------------------------------------------------------
  class MemoryManagedPool {
    constructor(createFn, resetFn, initialSize = 30, maxSize = 100) {
      this.createFn = createFn;
      this.resetFn = resetFn;
      this.pool = [];
      this.active = new Set();
      this.maxSize = maxSize;
      this.createdCount = 0;
      this.recycledCount = 0;
      
      for (let i = 0; i < initialSize; i++) {
        this.pool.push(this.createFn());
      }
    }
    
    get() {
      let obj;
      
      if (this.pool.length > 0) {
        obj = this.pool.pop();
        this.recycledCount++;
      } else if (this.active.size + this.pool.length < this.maxSize) {
        obj = this.createFn();
        this.createdCount++;
      } else {
        // Recycle oldest active object
        const iterator = this.active.values();
        obj = iterator.next().value;
        this.active.delete(obj);
        this.resetFn(obj);
        this.recycledCount++;
      }
      
      this.active.add(obj);
      return obj;
    }
    
    release(obj) {
      if (this.active.has(obj)) {
        this.active.delete(obj);
        this.resetFn(obj);
        
        if (this.pool.length < this.maxSize * 0.8) { // Keep pool at 80% capacity
          this.pool.push(obj);
        } else {
          // Allow garbage collection
          obj = null;
        }
      }
    }
    
    releaseAll() {
      for (const obj of this.active) {
        this.resetFn(obj);
        if (this.pool.length < this.maxSize) {
          this.pool.push(obj);
        }
      }
      this.active.clear();
    }
    
    optimize() {
      // Reduce pool size if over-allocated
      const targetSize = Math.floor(this.maxSize * 0.6);
      if (this.pool.length > targetSize) {
        this.pool.length = targetSize;
      }
    }
    
    getStats() {
      return {
        total: this.active.size + this.pool.length,
        active: this.active.size,
        available: this.pool.length,
        created: this.createdCount,
        recycled: this.recycledCount,
        efficiency: this.createdCount > 0 ? 
          Math.round((this.recycledCount / (this.createdCount + this.recycledCount)) * 100) : 100
      };
    }
  }

  // ---------------------------------------------------------------------------
  // GPU-OPTIMIZED RENDERER
  // ---------------------------------------------------------------------------
  class OptimizedRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', {
        alpha: true,
        desynchronized: true,
        powerPreference: 'high-performance'
      });
      
      this.lastDrawTime = 0;
      this.drawCallCount = 0;
      this.batchOperations = true;
      this.stateChanges = 0;
      
      // Batch containers
      this.spriteBatches = new Map();
      this.currentBatch = null;
    }
    
    beginBatch(spriteType) {
      if (!this.batchOperations) return;
      
      if (!this.spriteBatches.has(spriteType)) {
        this.spriteBatches.set(spriteType, []);
      }
      this.currentBatch = this.spriteBatches.get(spriteType);
    }
    
    addToBatch(sprite, x, y, rotation = 0, scale = 1) {
      if (!this.batchOperations || !this.currentBatch) {
        return false;
      }
      
      this.currentBatch.push({ sprite, x, y, rotation, scale });
      return true;
    }
    
    flushBatch(spriteType) {
      const batch = this.spriteBatches.get(spriteType);
      if (!batch || batch.length === 0) return;
      
      this.ctx.save();
      
      // Sort by texture if needed (reduce state changes)
      batch.sort((a, b) => (a.sprite.textureId || 0) - (b.sprite.textureId || 0));
      
      let lastTexture = null;
      
      for (const item of batch) {
        if (item.sprite !== lastTexture) {
          // Texture changed - could set globalAlpha, compositeOperation, etc.
          lastTexture = item.sprite;
        }
        
        this.ctx.translate(item.x, item.y);
        this.ctx.rotate(item.rotation);
        this.ctx.scale(item.scale, item.scale);
        
        item.sprite.draw(this.ctx);
        
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.drawCallCount++;
      }
      
      this.ctx.restore();
      batch.length = 0;
    }
    
    clear() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawCallCount = 0;
      this.stateChanges = 0;
      this.spriteBatches.clear();
    }
    
    measurePerformance() {
      const now = performance.now();
      const frameTime = now - this.lastDrawTime;
      this.lastDrawTime = now;
      
      return {
        drawCalls: this.drawCallCount,
        stateChanges: this.stateChanges,
        frameTime: frameTime
      };
    }
  }

  // ---------------------------------------------------------------------------
  // INPUT MANAGER WITH DEBOUNCING
  // ---------------------------------------------------------------------------
  class InputManager {
    constructor() {
      this.keys = {};
      this.pointers = new Map();
      this.gamepad = null;
      this.lastInputTime = 0;
      this.inputBuffer = [];
      this.maxBufferSize = 10;
      this.pointerMoveThrottle = 16;
      this.lastPointerMove = 0;
      this.deadZone = 0.18;

      this.setupEventListeners();
    }
    
    setupEventListeners() {
      // Keyboard
      window.addEventListener('keydown', (e) => this.handleKeyDown(e));
      window.addEventListener('keyup', (e) => this.handleKeyUp(e));
      
      // Pointer events
      window.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
      window.addEventListener('pointermove', (e) => this.handlePointerMove(e));
      window.addEventListener('pointerup', (e) => this.handlePointerUp(e));
      window.addEventListener('pointercancel', (e) => this.handlePointerUp(e));
      
      // Touch events
      window.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
          this.handlePointerDown(e.touches[0]);
        }
      }, { passive: false });
      
      window.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
          this.handlePointerMove(e.touches[0]);
        }
      }, { passive: false });
      
      window.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.handlePointerUp(e.changedTouches[0]);
      }, { passive: false });
      
      // Gamepad
      window.addEventListener('gamepadconnected', (e) => {
        this.gamepad = e.gamepad;
        console.log('Gamepad connected:', this.gamepad.id);
      });
      
      window.addEventListener('gamepaddisconnected', () => {
        this.gamepad = null;
        console.log('Gamepad disconnected');
      });
    }
    
    handleKeyDown(e) {
      if (!this.keys[e.code]) {
        this.keys[e.code] = {
          pressed: true,
          timestamp: performance.now(),
          duration: 0
        };
        this.recordInput('keydown', e.code);
      }
    }
    
    handleKeyUp(e) {
      if (this.keys[e.code]) {
        this.keys[e.code].pressed = false;
        this.keys[e.code].duration = performance.now() - this.keys[e.code].timestamp;
        this.recordInput('keyup', e.code);
        
        // Clean up after a while
        setTimeout(() => {
          delete this.keys[e.code];
        }, 1000);
      }
    }
    
    handlePointerDown(e) {
      const pointer = {
        id: e.pointerId || 0,
        x: e.clientX,
        y: e.clientY,
        pressed: true,
        timestamp: performance.now(),
        type: e.pointerType
      };
      
      this.pointers.set(pointer.id, pointer);
      this.recordInput('pointerdown', pointer.id);
    }
    
    handlePointerMove(e) {
      const pointer = this.pointers.get(e.pointerId || 0);
      if (pointer && pointer.pressed) {
        const now = performance.now();
        if (now - this.lastPointerMove < this.pointerMoveThrottle) return;
        this.lastPointerMove = now;
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.moved = true;
        this.recordInput('pointermove', pointer.id);
      }
    }
    
    handlePointerUp(e) {
      const pointer = this.pointers.get(e.pointerId || 0);
      if (pointer) {
        pointer.pressed = false;
        pointer.duration = performance.now() - pointer.timestamp;
        this.recordInput('pointerup', pointer.id);
        
        // Clean up after a while
        setTimeout(() => {
          this.pointers.delete(e.pointerId || 0);
        }, 1000);
      }
    }
    
    recordInput(type, id) {
      this.lastInputTime = performance.now();
      
      this.inputBuffer.push({
        type,
        id,
        timestamp: this.lastInputTime
      });
      
      if (this.inputBuffer.length > this.maxBufferSize) {
        this.inputBuffer.shift();
      }
    }
    
    update() {
      // Update key durations
      for (const code in this.keys) {
        if (this.keys[code].pressed) {
          this.keys[code].duration = performance.now() - this.keys[code].timestamp;
        }
      }
      
      // Update gamepad state
      if (this.gamepad) {
        const gamepads = navigator.getGamepads();
        this.gamepad = gamepads[this.gamepad.index] || this.gamepad;
      }
    }
    
    isPressed(code) {
      return this.keys[code]?.pressed || false;
    }
    
    getPointer(id = 0) {
      return this.pointers.get(id);
    }
    
    getActivePointers() {
      return Array.from(this.pointers.values()).filter(p => p.pressed);
    }
    
    getGamepadAxis(axisIndex) {
      if (!this.gamepad) return 0;
      const value = this.gamepad.axes[axisIndex];
      const abs = Math.abs(value);
      if (abs < this.deadZone) return 0;
      const scaled = (abs - this.deadZone) / (1 - this.deadZone);
      return Math.sign(value) * Math.min(1, scaled);
    }
    
    getGamepadButton(buttonIndex) {
      if (!this.gamepad) return false;
      return this.gamepad.buttons[buttonIndex]?.pressed || false;
    }
    
    clear() {
      this.keys = {};
      this.pointers.clear();
      this.inputBuffer.length = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // MAIN GAME ENGINE
  // ---------------------------------------------------------------------------
  class HoneyPotCatchGame {
    constructor() {
      console.log('[Game] Initializing Honey Pot Catch Ultimate Edition');
      
      // Performance monitoring
      this.performance = new PerformanceMonitor();
      this.frameId = null;
      this.lastFrameTime = 0;
      this.accumulatedTime = 0;
      this.fixedTimeStep = 1000 / 60; // 60 FPS target

      // Accessibility & motion preferences
      this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion = this.motionQuery.matches;
      this.motionQuery.addEventListener('change', (event) => {
        this.reducedMotion = event.matches;
        this.updateMotionBudgets();
      });

      // Core systems
      this.canvas = null;
      this.ctx = null;
      this.renderer = null;
      this.input = new InputManager();
      
      // Game state
      this.state = this.createInitialState();
      this.modeConfig = this.getModeConfig();
      
      // Object pools
      this.objectPools = this.createObjectPools();
      
      // Particle system
      this.particles = new OptimizedParticleSystem();

      // Score system
      this.scorePopups = new ScorePopupSystem();

      this.updateMotionBudgets();

      // Collision helpers
      this.collisionCellSize = 96;
      this.spatialBuckets = {
        pots: new Map(),
        bees: new Map(),
        powerUps: new Map()
      };

      // Initialize
      this.init();
    }

    updateMotionBudgets() {
      this.screenShakeIntensityScale = this.reducedMotion ? 0 : 1;
      if (this.particles?.setMotionBudget) {
        this.particles.setMotionBudget({ reduced: this.reducedMotion });
      }
    }
    
    createInitialState() {
      return {
        // Game status
        running: false,
        paused: false,
        gameOver: false,
        countdown: false,
        
        // Player stats
        score: 0,
        timeLeft: 60,
        lives: 3,
        combos: 0,
        multiplier: 1,
        streak: 0,
        lastCatchTime: 0,
        
        // Player object
        pooh: {
          x: 0,
          y: 0,
          width: 58,
          height: 58,
          targetX: 0,
          speed: 12,
          trail: [],
          maxTrailLength: 8
        },
        
        // Power-ups
        activePowerUps: new Map(),
        powerUpTimers: new Map(),
        
        // Game objects
        pots: [],
        bees: [],
        powerUps: [],
        
        // Game settings
        mode: 'calm',
        difficulty: 0,
        bestScore: parseInt(localStorage.getItem('honeyCatchBestScore')) || 0,
        
        // Statistics
        stats: this.loadStats(),
        
        // Timing
        gameStartTime: 0,
        lastSpawnTime: 0,
        
        // Controls
        joystickActive: false,
        joystickValue: 0
      };
    }
    
    getModeConfig() {
      return {
        calm: {
          label: 'Calm Stroll',
          time: 70,
          lives: 4,
          spawnRate: 0.02,
          beeSpawnRate: 0.01,
          powerUpSpawnRate: 0.004,
          honeyValue: 10,
          goldenValue: 50,
          speedScale: 0.9,
          color: '#4CAF50'
        },
        brisk: {
          label: 'Adventure',
          time: 60,
          lives: 3,
          spawnRate: 0.025,
          beeSpawnRate: 0.015,
          powerUpSpawnRate: 0.005,
          honeyValue: 15,
          goldenValue: 75,
          speedScale: 1.0,
          color: '#2196F3'
        },
        rush: {
          label: 'Honey Rush',
          time: 50,
          lives: 2,
          spawnRate: 0.03,
          beeSpawnRate: 0.02,
          powerUpSpawnRate: 0.006,
          honeyValue: 20,
          goldenValue: 100,
          speedScale: 1.1,
          color: '#FF5722'
        }
      };
    }
    
    createObjectPools() {
      return {
        pots: new MemoryManagedPool(
          () => ({
            x: 0, y: 0, radius: 14, speed: 0,
            type: 'normal', wobble: 0, rotation: 0,
            collected: false, trail: []
          }),
          (obj) => {
            obj.x = 0; obj.y = 0; obj.type = 'normal';
            obj.collected = false; obj.trail = [];
          },
          30, 60
        ),
        
        bees: new MemoryManagedPool(
          () => ({
            x: 0, y: 0, radius: 12, speed: 0,
            type: 'normal', wobble: 0, vx: 0,
            rotation: 0, trail: []
          }),
          (obj) => {
            obj.x = 0; obj.y = 0; obj.type = 'normal';
            obj.vx = 0; obj.trail = [];
          },
          20, 40
        ),
        
        powerUps: new MemoryManagedPool(
          () => ({
            x: 0, y: 0, radius: 14, speed: 0,
            type: 'heart', wobble: 0, rotation: 0,
            collected: false, trail: []
          }),
          (obj) => {
            obj.x = 0; obj.y = 0; obj.type = 'heart';
            obj.collected = false; obj.trail = [];
          },
          15, 30
        )
      };
    }
    
    loadStats() {
      try {
        const saved = localStorage.getItem('honeyCatch_stats');
        return saved ? JSON.parse(saved) : {
          gamesPlayed: 0,
          totalScore: 0,
          potsCaught: 0,
          goldenPotsCaught: 0,
          beesAvoided: 0,
          powerUpsCollected: 0,
          highestCombo: 0,
          highestStreak: 0
        };
      } catch (e) {
        return {
          gamesPlayed: 0,
          totalScore: 0,
          potsCaught: 0,
          goldenPotsCaught: 0,
          beesAvoided: 0,
          powerUpsCollected: 0,
          highestCombo: 0,
          highestStreak: 0
        };
      }
    }
    
    saveStats() {
      try {
        localStorage.setItem('honeyCatch_stats', JSON.stringify(this.state.stats));
      } catch (e) {
        console.warn('[Game] Could not save stats:', e);
      }
    }
    
    // -------------------------------------------------------------------------
    // INITIALIZATION
    // -------------------------------------------------------------------------
    init() {
      this.setupCanvas();
      this.setupUI();
      this.setupEventListeners();
      this.loadBestScore();
      this.resize();
      
      console.log('[Game] Initialization complete');
      
      // Start game loop
      this.gameLoop();
    }
    
    setupCanvas() {
      this.canvas = document.getElementById('honey-game');
      if (!this.canvas) {
        throw new Error('Canvas element not found');
      }
      
      this.ctx = this.canvas.getContext('2d', {
        alpha: true,
        desynchronized: true,
        powerPreference: 'high-performance'
      });
      
      this.renderer = new OptimizedRenderer(this.canvas);
    }
    
    setupUI() {
      // Cache DOM elements
      this.ui = {
        score: document.getElementById('score-count'),
        time: document.getElementById('time-count'),
        lives: document.getElementById('catch-lives'),
        combo: document.getElementById('catch-combo'),
        multiplier: document.getElementById('catch-multiplier'),
        bestScore: document.getElementById('catch-best'),
        fps: document.getElementById('catch-fps'),
        startBtn: document.getElementById('start-catch'),
        pauseBtn: document.getElementById('pause-catch'),
        overlay: document.getElementById('catch-overlay'),
        overlayText: document.getElementById('catch-countdown'),
        overlayHint: document.getElementById('catch-hint'),
        status: document.getElementById('catchStatus'),
        timeBar: document.getElementById('catch-timebar'),
        lifeBar: document.getElementById('catch-life-bar'),
        modeDescription: document.getElementById('catch-mode-description')
      };
      
      // Set initial values
      this.updateUI();
    }
    
    setupEventListeners() {
      // Game controls
      if (this.ui.startBtn) {
        this.ui.startBtn.addEventListener('click', () => this.startGame());
      }
      
      if (this.ui.pauseBtn) {
        this.ui.pauseBtn.addEventListener('click', () => this.togglePause());
      }
      
      // Mode buttons
      document.querySelectorAll('[data-catch-mode]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const mode = e.target.dataset.catchMode;
          this.setGameMode(mode);
        });
      });
      
      // Window resize
      window.addEventListener('resize', () => this.resize());
      
      // Visibility change (pause on tab switch)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.state.running && !this.state.paused) {
          this.togglePause();
        }
      });
    }
    
    // -------------------------------------------------------------------------
    // GAME LOOP
    // -------------------------------------------------------------------------
    gameLoop(currentTime = 0) {
      this.frameId = requestAnimationFrame((time) => this.gameLoop(time));
      
      // Calculate delta time
      const deltaTime = Math.min(100, currentTime - this.lastFrameTime);
      this.lastFrameTime = currentTime;
      
      // Record performance
      this.performance.recordFrame(deltaTime);
      
      // Update input
      this.input.update();
      
      // Fixed timestep update
      this.accumulatedTime += deltaTime;
      while (this.accumulatedTime >= this.fixedTimeStep) {
        this.update(this.fixedTimeStep / 1000); // Convert to seconds
        this.accumulatedTime -= this.fixedTimeStep;
      }
      
      // Render
      this.render();
      
      // Update FPS counter
      if (this.ui.fps && currentTime % 500 < 16) {
        this.ui.fps.textContent = this.performance.fps;
      }
    }
    
    update(deltaTime) {
      if (!this.state.running || this.state.paused || this.state.gameOver) {
        return;
      }
      
      // Update game time
      this.state.timeLeft -= deltaTime;
      if (this.state.timeLeft <= 0) {
        this.endGame(true);
        return;
      }
      
      // Update player
      this.updatePlayer(deltaTime);
      
      // Update objects
      this.updateObjects(deltaTime);
      
      // Update particles
      this.particles.update(deltaTime);
      this.scorePopups.update(deltaTime);
      
      // Update power-up timers
      this.updatePowerUpTimers(deltaTime);
      
      // Spawn new objects
      this.spawnObjects(deltaTime);
      
      // Update UI
      this.updateUI();
      
      // Check collisions
      this.checkCollisions();
    }
    
    updatePlayer(deltaTime) {
      const pooh = this.state.pooh;
      const speed = pooh.speed * this.modeConfig[this.state.mode].speedScale;
      
      // Handle input
      let moveInput = 0;
      
      // Keyboard
      if (this.input.isPressed('ArrowLeft') || this.input.isPressed('KeyA')) {
        moveInput -= 1;
      }
      if (this.input.isPressed('ArrowRight') || this.input.isPressed('KeyD')) {
        moveInput += 1;
      }
      
      // Gamepad
      moveInput += this.input.getGamepadAxis(0);
      
      // Joystick
      if (this.state.joystickActive) {
        moveInput += this.state.joystickValue;
      }
      
      // Pointer/touch
      const pointers = this.input.getActivePointers();
      if (pointers.length > 0) {
        const pointer = pointers[0];
        const rect = this.canvas.getBoundingClientRect();
        const targetX = (pointer.x - rect.left) / rect.width * this.canvas.width;
        moveInput = Math.sign(targetX - pooh.x);
      }
      
      // Apply movement
      pooh.targetX += moveInput * speed * deltaTime * 60; // Scale for FPS
      pooh.targetX = Math.max(pooh.width / 2, Math.min(this.canvas.width - pooh.width / 2, pooh.targetX));
      
      // Smooth movement
      pooh.x += (pooh.targetX - pooh.x) * 0.2;
      
      // Update trail
      pooh.trail.push({ x: pooh.x, y: pooh.y });
      if (pooh.trail.length > pooh.maxTrailLength) {
        pooh.trail.shift();
      }
    }
    
    updateObjects(deltaTime) {
      const mode = this.modeConfig[this.state.mode];
      const difficultyScale = 1 + this.state.difficulty * 0.2;
      
      // Update pots
      for (let i = this.state.pots.length - 1; i >= 0; i--) {
        const pot = this.state.pots[i];
        pot.y += pot.speed * deltaTime * 60 * mode.speedScale * difficultyScale;
        pot.wobble += 0.05 * deltaTime * 60;
        pot.rotation += 0.02 * deltaTime * 60;
        
        // Remove if off screen
        if (pot.y > this.canvas.height + 30) {
          this.objectPools.pots.release(pot);
          this.state.pots.splice(i, 1);
        }
      }
      
      // Update bees
      for (let i = this.state.bees.length - 1; i >= 0; i--) {
        const bee = this.state.bees[i];
        bee.y += bee.speed * deltaTime * 60 * mode.speedScale * difficultyScale;
        bee.wobble += 0.03 * deltaTime * 60;
        
        // Angry bees chase player
        if (bee.type === 'angry') {
          const dx = this.state.pooh.x - bee.x;
          bee.vx += Math.sign(dx) * 0.02 * deltaTime * 60;
          bee.vx = Math.max(-2, Math.min(2, bee.vx));
          bee.x += bee.vx * deltaTime * 60;
        }
        
        // Remove if off screen
        if (bee.y > this.canvas.height + 30) {
          this.objectPools.bees.release(bee);
          this.state.bees.splice(i, 1);
          this.state.stats.beesAvoided++;
        }
      }
      
      // Update power-ups
      for (let i = this.state.powerUps.length - 1; i >= 0; i--) {
        const powerUp = this.state.powerUps[i];
        powerUp.y += powerUp.speed * deltaTime * 60 * mode.speedScale;
        powerUp.wobble += 0.02 * deltaTime * 60;
        powerUp.rotation += 0.01 * deltaTime * 60;
        
        // Remove if off screen
        if (powerUp.y > this.canvas.height + 30) {
          this.objectPools.powerUps.release(powerUp);
          this.state.powerUps.splice(i, 1);
        }
      }
    }
    
    spawnObjects(deltaTime) {
      const now = performance.now();
      const mode = this.modeConfig[this.state.mode];
      const difficultyScale = 1 + this.state.difficulty * 0.1;
      
      // Spawn pots
      if (now - this.state.lastSpawnTime > 1000 / (mode.spawnRate * difficultyScale * 60)) {
        if (this.state.pots.length < 15) {
          this.spawnPot();
        }
        this.state.lastSpawnTime = now;
      }
      
      // Spawn bees (less frequent)
      if (Math.random() < mode.beeSpawnRate * deltaTime * 60 * difficultyScale) {
        if (this.state.bees.length < 10) {
          this.spawnBee();
        }
      }
      
      // Spawn power-ups (rare)
      if (Math.random() < mode.powerUpSpawnRate * deltaTime * 60) {
        if (this.state.powerUps.length < 5) {
          this.spawnPowerUp();
        }
      }
    }
    
    spawnPot() {
      const pot = this.objectPools.pots.get();
      pot.x = 20 + Math.random() * (this.canvas.width - 40);
      pot.y = -20;
      pot.speed = 2 + Math.random() * 1.5;
      pot.type = Math.random() < 0.15 ? 'golden' : 'normal';
      pot.wobble = Math.random() * Math.PI * 2;
      
      this.state.pots.push(pot);
    }
    
    spawnBee() {
      const bee = this.objectPools.bees.get();
      bee.x = 20 + Math.random() * (this.canvas.width - 40);
      bee.y = -20;
      bee.speed = 2.5 + Math.random() * 1.5;
      bee.type = Math.random() < 0.2 ? 'angry' : 'normal';
      bee.wobble = Math.random() * Math.PI * 2;
      bee.vx = 0;
      
      this.state.bees.push(bee);
    }
    
    spawnPowerUp() {
      const types = ['heart', 'shield', 'clock', 'star', 'lightning'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const powerUp = this.objectPools.powerUps.get();
      powerUp.x = 24 + Math.random() * (this.canvas.width - 48);
      powerUp.y = -20;
      powerUp.speed = 1.8 + Math.random() * 1;
      powerUp.type = type;
      powerUp.wobble = Math.random() * Math.PI * 2;
      
      this.state.powerUps.push(powerUp);
    }

    buildSpatialBuckets() {
      const cellSize = this.collisionCellSize;
      const resetBucket = (bucket) => bucket.clear();
      Object.values(this.spatialBuckets).forEach(resetBucket);

      const addToBucket = (map, entity) => {
        const cellX = Math.floor(entity.x / cellSize);
        const cellY = Math.floor(entity.y / cellSize);
        const key = `${cellX}|${cellY}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(entity);
      };

      this.state.pots.forEach((pot) => addToBucket(this.spatialBuckets.pots, pot));
      this.state.bees.forEach((bee) => addToBucket(this.spatialBuckets.bees, bee));
      this.state.powerUps.forEach((pu) => addToBucket(this.spatialBuckets.powerUps, pu));
    }

    getNearby(map, x, y) {
      const cellSize = this.collisionCellSize;
      const cellX = Math.floor(x / cellSize);
      const cellY = Math.floor(y / cellSize);
      const candidates = [];

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = `${cellX + dx}|${cellY + dy}`;
          const bucket = map.get(key);
          if (bucket) {
            candidates.push(...bucket);
          }
        }
      }

      return candidates;
    }

    checkCollisions() {
      const pooh = this.state.pooh;
      const poohRadius = pooh.width * 0.35;

      this.buildSpatialBuckets();
      const potCandidates = this.getNearby(this.spatialBuckets.pots, pooh.x, pooh.y);
      const beeCandidates = this.getNearby(this.spatialBuckets.bees, pooh.x, pooh.y);
      const powerUpCandidates = this.getNearby(this.spatialBuckets.powerUps, pooh.x, pooh.y);

      // Check pot collisions
      for (let i = potCandidates.length - 1; i >= 0; i--) {
        const pot = potCandidates[i];
        const dx = pot.x - pooh.x;
        const dy = pot.y - (pooh.y - pooh.height * 0.4);
        const radius = pot.radius + poohRadius;

        if ((dx * dx + dy * dy) < radius * radius) {
          const index = this.state.pots.indexOf(pot);
          if (index !== -1) this.collectPot(pot, index);
        }
      }

      // Check bee collisions (skip if invincible)
      if (!this.state.activePowerUps.has('shield')) {
        for (let i = beeCandidates.length - 1; i >= 0; i--) {
          const bee = beeCandidates[i];
          const dx = bee.x - pooh.x;
          const dy = bee.y - (pooh.y - pooh.height * 0.4);
          const radius = bee.radius + poohRadius;

          if ((dx * dx + dy * dy) < radius * radius) {
            const index = this.state.bees.indexOf(bee);
            if (index !== -1) this.hitByBee(bee, index);
          }
        }
      }

      // Check power-up collisions
      for (let i = powerUpCandidates.length - 1; i >= 0; i--) {
        const powerUp = powerUpCandidates[i];
        const dx = powerUp.x - pooh.x;
        const dy = powerUp.y - (pooh.y - pooh.height * 0.4);
        const radius = powerUp.radius + poohRadius;

        if ((dx * dx + dy * dy) < radius * radius) {
          const index = this.state.powerUps.indexOf(powerUp);
          if (index !== -1) this.collectPowerUp(powerUp, index);
        }
      }
    }

    emitParticles(x, y, count, color, options = {}) {
      if (this.reducedMotion) {
        const trimmedCount = Math.max(0, Math.round(count * 0.35));
        if (trimmedCount === 0) return;
        this.particles.burst(x, y, trimmedCount, color, {
          ...options,
          speed: (options.speed || 3) * 0.6,
          spread: options.spread || 45
        });
        return;
      }

      this.particles.burst(x, y, count, color, options);
    }

    collectPot(pot, index) {
      const mode = this.modeConfig[this.state.mode];
      const isGolden = pot.type === 'golden';
      let points = isGolden ? mode.goldenValue : mode.honeyValue;
      
      // Apply multiplier
      points = Math.round(points * this.state.multiplier);
      
      // Update score
      this.state.score += points;
      
      // Update statistics
      this.state.stats.potsCaught++;
      this.state.stats.totalScore += points;
      if (isGolden) {
        this.state.stats.goldenPotsCaught++;
      }
      
      // Update combo
      const now = performance.now();
      if (now - this.state.lastCatchTime < 2000) {
        this.state.combos++;
        this.state.streak++;
        this.state.multiplier = Math.min(5, 1 + this.state.combos * 0.15);
        
        // Update highest combo
        if (this.state.combos > this.state.stats.highestCombo) {
          this.state.stats.highestCombo = this.state.combos;
        }
      } else {
        this.state.combos = 1;
        this.state.streak = 1;
        this.state.multiplier = 1.15;
      }
      this.state.lastCatchTime = now;
      
      // Update highest streak
      if (this.state.streak > this.state.stats.highestStreak) {
        this.state.stats.highestStreak = this.state.streak;
      }
      
      // Create score popup
      this.scorePopups.create(pot.x, pot.y, points, isGolden ? 'golden' : 'normal');
      
      // Particle effect
      this.emitParticles(pot.x, pot.y, isGolden ? 20 : 12,
                          isGolden ? '#FFD700' : '#FFD54F',
                          { size: isGolden ? 5 : 3, speed: 4 });
      
      // Release pot
      this.objectPools.pots.release(pot);
      this.state.pots.splice(index, 1);
      
      // Play sound
      this.playSound(isGolden ? 'golden' : 'collect');
    }
    
    hitByBee(bee, index) {
      const damage = bee.type === 'angry' ? 2 : 1;
      this.state.lives -= damage;
      
      // Reset combo
      this.state.combos = 0;
      this.state.multiplier = 1;
      this.state.streak = 0;
      
      // Particle effect
      this.emitParticles(bee.x, bee.y, 15, '#FF6B6B', { size: 4, speed: 3 });
      
      // Release bee
      this.objectPools.bees.release(bee);
      this.state.bees.splice(index, 1);
      
      // Check game over
      if (this.state.lives <= 0) {
        this.endGame(false);
      } else {
        // Screen shake effect
        this.screenShake(10, 300);
        
        // Update UI
        this.updateUI();
        
        // Play sound
        this.playSound('damage');
        
        // Show notification
        this.showNotification('Ouch!', 'Bee stung Pooh!', 1000);
      }
    }
    
    collectPowerUp(powerUp, index) {
      const type = powerUp.type;
      
      // Update statistics
      this.state.stats.powerUpsCollected++;
      
      // Apply power-up effect
      this.applyPowerUp(type);
      
      // Particle effect
      const colors = {
        heart: '#FF6B6B',
        shield: '#4285F4',
        clock: '#4CAF50',
        star: '#FFD700',
        lightning: '#9C27B0'
      };
      
      this.emitParticles(powerUp.x, powerUp.y, 15, colors[type] || '#FFFFFF',
                          { size: 5, speed: 4 });
      
      // Release power-up
      this.objectPools.powerUps.release(powerUp);
      this.state.powerUps.splice(index, 1);
      
      // Play sound
      this.playSound('powerup');
      
      // Show notification
      this.showNotification('Power Up!', this.getPowerUpName(type), 1000);
    }
    
    applyPowerUp(type) {
      const duration = {
        shield: 5000,
        star: 8000,
        lightning: 6000
      }[type] || 0;
      
      if (duration > 0) {
        this.state.activePowerUps.set(type, true);
        this.state.powerUpTimers.set(type, performance.now() + duration);
      }
      
      switch (type) {
        case 'heart':
          this.state.lives = Math.min(this.modeConfig[this.state.mode].lives + 2, 
                                     this.state.lives + 1);
          break;
          
        case 'clock':
          this.state.timeLeft = Math.min(this.modeConfig[this.state.mode].time,
                                        this.state.timeLeft + 10);
          break;
      }
    }
    
    updatePowerUpTimers(deltaTime) {
      const now = performance.now();
      
      for (const [type, expiry] of this.state.powerUpTimers) {
        if (now > expiry) {
          this.state.activePowerUps.delete(type);
          this.state.powerUpTimers.delete(type);
        }
      }
    }
    
    getPowerUpName(type) {
      const names = {
        heart: 'Extra Heart',
        shield: 'Shield',
        clock: 'Bonus Time',
        star: 'Double Points',
        lightning: 'Slow Motion'
      };
      return names[type] || 'Power Up';
    }
    
    // -------------------------------------------------------------------------
    // RENDERING
    // -------------------------------------------------------------------------
    render() {
      if (!this.ctx) return;
      
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw background
      this.drawBackground();
      
      // Draw game objects
      this.state.pots.forEach(pot => this.drawPot(pot));
      this.state.bees.forEach(bee => this.drawBee(bee));
      this.state.powerUps.forEach(pu => this.drawPowerUp(pu));
      
      // Draw particles
      this.particles.render(this.ctx);
      
      // Draw score popups
      this.scorePopups.render(this.ctx);
      
      // Draw player
      this.drawPlayer();
      
      // Draw UI overlays
      this.drawUIOverlay();
    }
    
    drawBackground() {
      const ctx = this.ctx;
      const width = this.canvas.width;
      const height = this.canvas.height;
      
      // Sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
      skyGradient.addColorStop(0, '#87CEEB');
      skyGradient.addColorStop(0.7, '#98D8E8');
      skyGradient.addColorStop(1, '#B0E0E6');
      
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height);
      
      // Clouds
      this.drawClouds();
      
      // Ground
      const groundY = height - 50;
      ctx.fillStyle = '#7CFC00';
      ctx.fillRect(0, groundY, width, height - groundY);
      
      // Grass details
      ctx.strokeStyle = '#32CD32';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 3) {
        const heightVar = 3 + Math.sin(i * 0.1 + performance.now() * 0.002) * 2;
        ctx.beginPath();
        ctx.moveTo(i, groundY);
        ctx.lineTo(i, groundY - heightVar);
        ctx.stroke();
      }
    }
    
    drawClouds() {
      const ctx = this.ctx;
      const width = this.canvas.width;
      const cloudCount = Math.floor(width / 200);
      
      for (let i = 0; i < cloudCount; i++) {
        const x = (i * width / cloudCount + (performance.now() * 0.01) % width) % (width + 200) - 100;
        const y = 40 + Math.sin(i * 2.5) * 20;
        const size = 30 + Math.sin(i * 3) * 10;
        
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#FFFFFF';
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.7, y - size * 0.3, size * 0.8, 0, Math.PI * 2);
        ctx.arc(x + size * 1.4, y, size * 0.9, 0, Math.PI * 2);
        ctx.arc(x + size * 0.7, y + size * 0.3, size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    
    drawPlayer() {
      const ctx = this.ctx;
      const pooh = this.state.pooh;
      const x = pooh.x;
      const y = pooh.y;
      const w = pooh.width;
      const h = pooh.height;
      
      // Draw trail
      ctx.save();
      pooh.trail.forEach((pos, i) => {
        const alpha = (i / pooh.trail.length) * 0.3;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FF9800';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - h * 0.4, w * 0.15, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      
      // Shadow
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(x, y + 15, w * 0.4, h * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Body
      const bodyGradient = ctx.createLinearGradient(x - w/2, y - h, x - w/2, y);
      bodyGradient.addColorStop(0, '#FFC107');
      bodyGradient.addColorStop(1, '#FF9800');
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.roundRect(x - w/2, y - h, w, h, 12);
      ctx.fill();
      
      // Shirt
      const modeColor = this.modeConfig[this.state.mode].color;
      ctx.fillStyle = modeColor;
      ctx.fillRect(x - w/2, y - h * 0.7, w, h * 0.25);
      
      // Belly
      ctx.fillStyle = 'rgba(255, 216, 166, 0.9)';
      ctx.beginPath();
      ctx.ellipse(x, y - h * 0.5, w * 0.25, h * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x - w * 0.2, y - h * 0.8, 2.5, 0, Math.PI * 2);
      ctx.arc(x + w * 0.2, y - h * 0.8, 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Nose
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.arc(x, y - h * 0.65, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Shield effect
      if (this.state.activePowerUps.has('shield')) {
        ctx.save();
        const alpha = 0.4 + Math.sin(performance.now() / 150) * 0.3;
        ctx.strokeStyle = `rgba(66, 133, 244, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(66, 133, 244, 0.5)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x, y - h * 0.5, w * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
    
    drawPot(pot) {
      const ctx = this.ctx;
      const x = pot.x + Math.sin(pot.wobble + performance.now() / 500) * 2;
      const y = pot.y;
      const isGolden = pot.type === 'golden';
      
      // Golden glow
      if (isGolden) {
        ctx.save();
        ctx.shadowColor = 'rgba(255, 215, 0, 0.7)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(x, y, pot.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      
      // Pot body
      const gradient = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, pot.radius);
      gradient.addColorStop(0, '#FFEB3B');
      gradient.addColorStop(0.8, '#FFD54F');
      gradient.addColorStop(1, '#FFB300');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, pot.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Outline
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Lid
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x - 7, y - 12, 14, 3);
      ctx.fillRect(x - 3, y - 15, 6, 3);
      
      // Honey drip
      ctx.fillStyle = '#FF9800';
      ctx.beginPath();
      ctx.ellipse(x, y + 3, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    drawBee(bee) {
      const ctx = this.ctx;
      const x = bee.x + Math.sin(bee.wobble + performance.now() / 300) * 3;
      const y = bee.y + Math.cos(bee.wobble * 1.5 + performance.now() / 400) * 2;
      
      // Wings
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const wingTime = performance.now() / 80;
      const wingOffset = Math.sin(wingTime) * 3;
      
      ctx.beginPath();
      ctx.arc(x - 9, y - 8 + wingOffset, 7, 0, Math.PI * 2);
      ctx.arc(x + 9, y - 8 - wingOffset, 7, 0, Math.PI * 2);
      ctx.fill();
      
      // Body
      const bodyGradient = ctx.createRadialGradient(x, y, 2, x, y, 10);
      bodyGradient.addColorStop(0, '#FFEB3B');
      bodyGradient.addColorStop(1, '#FF9800');
      
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Stripes
      ctx.fillStyle = '#000';
      ctx.fillRect(x - 5, y - 5, 3, 8);
      ctx.fillRect(x + 2, y - 5, 3, 8);
      
      // Eyes
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x - 3, y - 2, 1.5, 0, Math.PI * 2);
      ctx.arc(x + 3, y - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Angry face
      if (bee.type === 'angry') {
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💢', x, y - 20);
      }
    }
    
    drawPowerUp(pu) {
      const ctx = this.ctx;
      const x = pu.x + Math.sin(pu.wobble + performance.now() / 600) * 3;
      const y = pu.y;
      
      const colors = {
        heart: '#FF6B6B',
        shield: '#4285F4',
        clock: '#4CAF50',
        star: '#FFD700',
        lightning: '#9C27B0'
      };
      
      const icons = {
        heart: '❤️',
        shield: '🛡️',
        clock: '⏱️',
        star: '⭐',
        lightning: '⚡'
      };
      
      const color = colors[pu.type] || '#FFFFFF';
      const icon = icons[pu.type] || '❓';
      
      // Glow
      ctx.save();
      ctx.shadowColor = color + '80';
      ctx.shadowBlur = 10;
      ctx.fillStyle = color + '40';
      ctx.beginPath();
      ctx.arc(x, y, pu.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Outline
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, pu.radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Icon
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#111';
      ctx.fillText(icon, x, y);
    }
    
    drawUIOverlay() {
      const ctx = this.ctx;
      const width = this.canvas.width;
      
      // Combo text
      if (this.state.combos >= 3) {
        ctx.save();
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(`${this.state.combos} Combo! ×${this.state.multiplier.toFixed(1)}`, width / 2, 40);
        ctx.restore();
      }
      
      // Active power-ups
      const now = performance.now();
      let yOffset = 20;
      
      for (const [type, expiry] of this.state.powerUpTimers) {
        const seconds = Math.ceil((expiry - now) / 1000);
        const icons = {
          shield: '🛡️',
          star: '⭐',
          lightning: '⚡'
        };
        
        ctx.save();
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0b2d17';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 3;
        ctx.fillText(`${icons[type] || '⚡'} ${seconds}s`, 10, yOffset);
        ctx.restore();
        
        yOffset += 20;
      }
    }
    
    // -------------------------------------------------------------------------
    // GAME CONTROL
    // -------------------------------------------------------------------------
    startGame() {
      if (this.state.running && !this.state.gameOver) {
        // Already running, just unpause if paused
        if (this.state.paused) {
          this.togglePause();
        }
        return;
      }
      
      // Reset game state
      this.resetGame();
      
      // Start countdown
      this.startCountdown();
    }
    
    startCountdown() {
      let countdown = 3;
      
      this.showOverlay(`Starting in ${countdown}...`, 'Get ready!');
      this.playSound('countdown');
      
      const countdownInterval = setInterval(() => {
        countdown--;
        
        if (countdown > 0) {
          this.showOverlay(`Starting in ${countdown}...`, 'Get ready!');
          this.playSound('countdown');
        } else {
          clearInterval(countdownInterval);
          
          // Start the game
          this.state.running = true;
          this.state.gameOver = false;
          this.state.paused = false;
          this.state.gameStartTime = performance.now();
          this.state.stats.gamesPlayed++;
          
          this.showOverlay('Go!', 'Catch honey, avoid bees!', 800);
          this.playSound('start');
          
          // Start game timer
          this.startGameTimer();
        }
      }, 1000);
    }
    
    startGameTimer() {
      if (this.gameTimer) {
        clearInterval(this.gameTimer);
      }
      
      this.gameTimer = setInterval(() => {
        if (!this.state.running || this.state.paused || this.state.gameOver) {
          return;
        }
        
        this.state.timeLeft--;
        
        if (this.state.timeLeft <= 0) {
          this.endGame(true);
        }
      }, 1000);
    }
    
    togglePause() {
      if (!this.state.running || this.state.gameOver) return;
      
      this.state.paused = !this.state.paused;
      
      if (this.state.paused) {
        this.showOverlay('Paused', 'Click pause again to resume', 0);
        this.playSound('pause');
      } else {
        this.hideOverlay();
        this.playSound('resume');
      }
      
      this.updateUI();
    }
    
    endGame(timeExpired) {
      if (!this.state.running || this.state.gameOver) return;
      
      this.state.running = false;
      this.state.gameOver = true;
      
      // Clear timer
      if (this.gameTimer) {
        clearInterval(this.gameTimer);
        this.gameTimer = null;
      }
      
      // Calculate final score with bonuses
      const bonuses = {
        lives: Math.max(0, this.state.lives - 1) * 25,
        combo: this.state.combos >= 10 ? 50 : 0,
        streak: this.state.streak >= 15 ? 75 : 0,
        difficulty: this.state.difficulty * 20,
        timeBonus: Math.max(0, Math.floor(this.state.timeLeft / 5)) * 5
      };
      
      const totalBonus = Object.values(bonuses).reduce((a, b) => a + b, 0);
      const finalScore = Math.round((this.state.score + totalBonus) * 
                                   this.modeConfig[this.state.mode].speedScale);
      
      // Update total score
      this.state.stats.totalScore += finalScore;
      
      // Check if new high score
      if (finalScore > this.state.bestScore) {
        this.state.bestScore = finalScore;
        this.saveBestScore();
      }
      
      // Save statistics
      this.saveStats();
      
      // Show game over screen
      const message = timeExpired ? "Time's Up!" : "Game Over!";
      const details = `Final Score: ${finalScore}${totalBonus > 0 ? ` (+${totalBonus} bonus)` : ''}${finalScore > this.state.bestScore ? ' - New Best!' : ''}`;
      
      this.showOverlay(message, details, 0);
      this.playSound(timeExpired ? 'victory' : 'defeat');
      
      // Celebration particles
      this.emitParticles(this.canvas.width / 2, this.canvas.height / 2, 50,
                          timeExpired ? '#4CAF50' : '#FF9800',
                          { size: 6, speed: 6, gravity: 0.1 });
      
      // Clear all objects
      this.clearAllObjects();
      
      // Update UI
      this.updateUI();
    }
    
    resetGame() {
      // Clear all objects
      this.clearAllObjects();
      
      // Reset game state
      const mode = this.modeConfig[this.state.mode];
      this.state.score = 0;
      this.state.timeLeft = mode.time;
      this.state.lives = mode.lives;
      this.state.combos = 0;
      this.state.multiplier = 1;
      this.state.streak = 0;
      this.state.lastCatchTime = 0;
      this.state.difficulty = 0;
      
      // Reset player
      this.state.pooh.x = this.canvas.width / 2;
      this.state.pooh.y = this.canvas.height - 50;
      this.state.pooh.targetX = this.canvas.width / 2;
      this.state.pooh.trail = [];
      
      // Clear power-ups
      this.state.activePowerUps.clear();
      this.state.powerUpTimers.clear();
      
      // Clear particles
      this.particles.clear();
      this.scorePopups.clear();
      
      // Update UI
      this.updateUI();
    }
    
    clearAllObjects() {
      // Release all objects back to pools
      this.state.pots.forEach(pot => this.objectPools.pots.release(pot));
      this.state.pots.length = 0;
      
      this.state.bees.forEach(bee => this.objectPools.bees.release(bee));
      this.state.bees.length = 0;
      
      this.state.powerUps.forEach(pu => this.objectPools.powerUps.release(pu));
      this.state.powerUps.length = 0;
    }
    
    setGameMode(mode) {
      if (!this.modeConfig[mode]) {
        mode = 'calm';
      }
      
      this.state.mode = mode;
      
      // Update UI
      document.querySelectorAll('[data-catch-mode]').forEach(btn => {
        const isActive = btn.dataset.catchMode === mode;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', isActive);
      });
      
      if (this.ui.modeDescription) {
        this.ui.modeDescription.textContent = this.modeConfig[mode].label + ' - ' + 
          this.modeConfig[mode].time + ' seconds, ' + 
          this.modeConfig[mode].lives + ' lives';
      }
      
      // Reset game if not running
      if (!this.state.running) {
        this.resetGame();
      }
    }
    
    // -------------------------------------------------------------------------
    // UI MANAGEMENT
    // -------------------------------------------------------------------------
    updateUI() {
      // Update score
      if (this.ui.score) {
        this.ui.score.textContent = this.state.score.toLocaleString();
      }
      
      // Update time
      if (this.ui.time) {
        this.ui.time.textContent = Math.max(0, Math.ceil(this.state.timeLeft));
      }
      
      // Update lives
      if (this.ui.lives) {
        this.ui.lives.textContent = this.state.lives;
      }
      
      // Update combo
      if (this.ui.combo) {
        this.ui.combo.textContent = this.state.combos;
      }
      
      // Update multiplier
      if (this.ui.multiplier) {
        const mult = Math.round(this.state.multiplier * 10) / 10;
        this.ui.multiplier.textContent = mult % 1 === 0 ? mult : mult.toFixed(1);
      }
      
      // Update best score
      if (this.ui.bestScore) {
        this.ui.bestScore.textContent = this.state.bestScore.toLocaleString();
      }
      
      // Update pause button
      if (this.ui.pauseBtn) {
        this.ui.pauseBtn.setAttribute('aria-pressed', this.state.paused);
        this.ui.pauseBtn.querySelector('i').className = 
          this.state.paused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
        this.ui.pauseBtn.setAttribute('aria-label', 
          this.state.paused ? 'Resume game' : 'Pause game');
      }
      
      // Update progress bars
      if (this.ui.timeBar) {
        const mode = this.modeConfig[this.state.mode];
        const timePercent = Math.max(0, (this.state.timeLeft / mode.time) * 100);
        this.ui.timeBar.style.width = `${timePercent}%`;
        this.ui.timeBar.style.setProperty('--w', `${timePercent}%`);
      }
      
      if (this.ui.lifeBar) {
        const mode = this.modeConfig[this.state.mode];
        const lifePercent = Math.max(0, (this.state.lives / mode.lives) * 100);
        this.ui.lifeBar.style.width = `${lifePercent}%`;
        this.ui.lifeBar.style.setProperty('--w', `${lifePercent}%`);
        this.ui.lifeBar.style.backgroundColor = lifePercent < 30 ? '#FF6B6B' : '#4CAF50';
      }
    }
    
    showOverlay(title, subtitle, duration = 1500) {
      if (this.ui.overlay && this.ui.overlayText && this.ui.overlayHint) {
        this.ui.overlayText.textContent = title;
        this.ui.overlayHint.textContent = subtitle;
        this.ui.overlay.classList.add('active');
        
        if (duration > 0) {
          setTimeout(() => {
            this.ui.overlay.classList.remove('active');
          }, duration);
        }
      }
    }
    
    hideOverlay() {
      if (this.ui.overlay) {
        this.ui.overlay.classList.remove('active');
      }
    }
    
    showNotification(message, details, duration = 2000) {
      // Update status text
      if (this.ui.status) {
        this.ui.status.textContent = `${message} ${details}`;
        this.ui.status.className = 'tip tip--info';
        
        setTimeout(() => {
          if (this.ui.status && !this.state.running) {
            this.ui.status.textContent = 'Ready to play';
            this.ui.status.className = 'tip';
          }
        }, duration);
      }
      
      // Announce to screen reader
      this.announceToScreenReader(`${message}. ${details}`);
    }
    
    // -------------------------------------------------------------------------
    // UTILITIES
    // -------------------------------------------------------------------------
    resize() {
      if (!this.canvas || !this.canvas.parentElement) return;
      
      const container = this.canvas.parentElement;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // Maintain aspect ratio
      const targetAspect = 16/9;
      let width = containerWidth;
      let height = containerHeight;
      
      if (width / height > targetAspect) {
        width = Math.floor(height * targetAspect);
      } else {
        height = Math.floor(width / targetAspect);
      }
      
      // Set canvas dimensions
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      
      // Handle high DPI displays
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.floor(width * dpr);
      this.canvas.height = Math.floor(height * dpr);
      
      // Scale context
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      // Update player position
      this.state.pooh.x = width / 2;
      this.state.pooh.y = height - 50;
      this.state.pooh.targetX = width / 2;
    }
    
    screenShake(intensity, duration) {
      if (this.screenShakeIntensityScale === 0) return;

      const scaledIntensity = intensity * this.screenShakeIntensityScale;
      const scaledDuration = this.reducedMotion ? Math.min(duration, 120) : duration;

      const originalTransform = this.canvas.style.transform;
      const shakeInterval = setInterval(() => {
        const x = (Math.random() - 0.5) * scaledIntensity;
        const y = (Math.random() - 0.5) * scaledIntensity;
        this.canvas.style.transform = `translate(${x}px, ${y}px)`;
      }, this.reducedMotion ? 32 : 16);

      setTimeout(() => {
        clearInterval(shakeInterval);
        this.canvas.style.transform = originalTransform;
      }, scaledDuration);
    }
    
    playSound(type) {
      // Simple audio implementation
      // In a real implementation, you would use Web Audio API
      try {
        const frequencies = {
          collect: [523.25, 659.25],
          golden: [783.99, 987.77],
          damage: [220, 164.81],
          powerup: [659.25, 830.61],
          countdown: [392, 329.63],
          start: [523.25, 659.25, 783.99],
          pause: [329.63, 261.63],
          resume: [523.25, 659.25],
          victory: [1046.5, 1318.51, 1567.98],
          defeat: [220, 196, 174.61]
        };
        
        const freq = frequencies[type];
        if (freq && window.AudioContext) {
          const audioContext = window.audioContext || new (window.AudioContext || window.webkitAudioContext)();
          const now = audioContext.currentTime;
          
          freq.forEach((f, i) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = f;
            gainNode.gain.value = 0.1;
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + i * 0.05);
            oscillator.start(now + i * 0.05);
            oscillator.stop(now + 0.1 + i * 0.05);
          });
        }
      } catch (e) {
        console.log('Audio not supported:', e);
      }
    }
    
    announceToScreenReader(message) {
      // Create aria-live region for screen readers
      let liveRegion = document.getElementById('sr-announcements');
      if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'sr-announcements';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.cssText = `
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        `;
        document.body.appendChild(liveRegion);
      }
      
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
    
    loadBestScore() {
      try {
        const saved = localStorage.getItem('honeyCatchBestScore');
        if (saved) {
          const score = parseInt(saved, 10);
          if (!isNaN(score)) {
            this.state.bestScore = score;
          }
        }
      } catch (e) {
        console.warn('[Game] Could not load best score:', e);
      }
    }
    
    saveBestScore() {
      try {
        localStorage.setItem('honeyCatchBestScore', this.state.bestScore.toString());
      } catch (e) {
        console.warn('[Game] Could not save best score:', e);
      }
    }
    
    // -------------------------------------------------------------------------
    // PUBLIC API
    // -------------------------------------------------------------------------
    getGameState() {
      return {
        score: this.state.score,
        timeLeft: this.state.timeLeft,
        lives: this.state.lives,
        running: this.state.running,
        paused: this.state.paused,
        gameOver: this.state.gameOver,
        mode: this.state.mode,
        bestScore: this.state.bestScore
      };
    }
    
    getPerformanceStats() {
      return {
        fps: this.performance.fps,
        memory: this.performance.maxMemoryUsage,
        grade: this.performance.getPerformanceGrade(),
        objects: this.state.pots.length + this.state.bees.length + this.state.powerUps.length,
        particles: this.particles.getCount()
      };
    }
    
    getObjectPoolStats() {
      return {
        pots: this.objectPools.pots.getStats(),
        bees: this.objectPools.bees.getStats(),
        powerUps: this.objectPools.powerUps.getStats()
      };
    }
    
    optimize() {
      console.log('[Game] Manual optimization triggered');
      
      // Reduce particle count
      this.particles.maxParticles = Math.floor(this.particles.maxParticles * 0.7);
      
      // Optimize object pools
      Object.values(this.objectPools).forEach(pool => pool.optimize());
      
      // Clear old particles
      this.particles.clearOld(2000); // Clear particles older than 2 seconds
      
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }
      
      return this.getPerformanceStats();
    }
    
    destroy() {
      // Clean up resources
      if (this.frameId) {
        cancelAnimationFrame(this.frameId);
      }
      
      if (this.gameTimer) {
        clearInterval(this.gameTimer);
      }
      
      this.input.clear();
      this.clearAllObjects();
      
      // Save stats
      this.saveStats();
      this.saveBestScore();
      
      console.log('[Game] Destroyed');
    }
  }

  // ---------------------------------------------------------------------------
  // OPTIMIZED PARTICLE SYSTEM
  // ---------------------------------------------------------------------------
  class OptimizedParticleSystem {
    constructor(maxParticles = 200) {
      this.particles = [];
      this.baseMaxParticles = maxParticles;
      this.maxParticles = maxParticles;
      this.motionScale = 1;
      this.reducedMotion = false;
      this.pool = new MemoryManagedPool(
        () => ({
          x: 0, y: 0, vx: 0, vy: 0,
          life: 1, decay: 0.03,
          size: 4, color: '#FFFFFF',
          rotation: 0, rotationSpeed: 0,
          createdAt: 0
        }),
        (p) => {
          p.x = 0; p.y = 0; p.vx = 0; p.vy = 0;
          p.life = 1; p.createdAt = 0;
        },
        50, maxParticles
      );
    }

    setMotionBudget({ reduced }) {
      this.reducedMotion = reduced;
      this.motionScale = reduced ? 0.35 : 1;
      this.maxParticles = reduced
        ? Math.max(60, Math.floor(this.baseMaxParticles * 0.6))
        : this.baseMaxParticles;
    }

    burst(x, y, count, color, options = {}) {
      const { size = 4, speed = 3, gravity = 0.1, spread = 360 } = options;

      const targetCount = Math.max(1, Math.round(count * this.motionScale));

      for (let i = 0; i < targetCount && this.particles.length < this.maxParticles; i++) {
        const particle = this.pool.get();
        
        const angle = (Math.random() * spread * Math.PI / 180) - (spread * Math.PI / 360);
        const velocity = 0.5 + Math.random() * (speed - 0.5);
        
        particle.x = x;
        particle.y = y;
        particle.vx = Math.cos(angle) * velocity;
        particle.vy = Math.sin(angle) * velocity;
        particle.life = 1;
        particle.decay = 0.03 * (0.8 + Math.random() * 0.4);
        particle.size = size * (0.5 + Math.random());
        particle.color = color;
        particle.gravity = gravity;
        particle.rotation = Math.random() * Math.PI * 2;
        particle.rotationSpeed = (Math.random() - 0.5) * 0.1;
        particle.createdAt = performance.now();
        
        this.particles.push(particle);
      }
    }
    
    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        
        // Update position
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        
        // Update rotation
        p.rotation += p.rotationSpeed * dt;
        
        // Air resistance
        p.vx *= 0.98;
        p.vy *= 0.98;
        
        // Fade out
        p.life -= p.decay * dt;
        
        // Remove dead particles
        if (p.life <= 0 || p.y > window.innerHeight + 50 || 
            p.x < -50 || p.x > window.innerWidth + 50) {
          this.pool.release(p);
          this.particles.splice(i, 1);
        }
      }
    }
    
    render(ctx) {
      ctx.save();
      
      for (const p of this.particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        // Simple circle particles (fastest to render)
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      
      ctx.restore();
    }
    
    clear() {
      for (const p of this.particles) {
        this.pool.release(p);
      }
      this.particles.length = 0;
    }
    
    clearOld(maxAge) {
      const now = performance.now();
      for (let i = this.particles.length - 1; i >= 0; i--) {
        if (now - this.particles[i].createdAt > maxAge) {
          this.pool.release(this.particles[i]);
          this.particles.splice(i, 1);
        }
      }
    }
    
    getCount() {
      return this.particles.length;
    }
  }

  // ---------------------------------------------------------------------------
  // SCORE POPUP SYSTEM
  // ---------------------------------------------------------------------------
  class ScorePopupSystem {
    constructor() {
      this.popups = [];
    }
    
    create(x, y, value, type = 'normal') {
      this.popups.push({
        x, y, value, type,
        life: 1,
        velocity: { x: (Math.random() - 0.5) * 1.5, y: -2 - Math.random() * 1.5 },
        scale: type === 'golden' ? 1.3 : type === 'combo' ? 1.5 : 1,
        rotation: (Math.random() - 0.5) * 0.2
      });
    }
    
    update(dt) {
      for (let i = this.popups.length - 1; i >= 0; i--) {
        const popup = this.popups[i];
        
        popup.x += popup.velocity.x * dt;
        popup.y += popup.velocity.y * dt;
        popup.velocity.x *= 0.99;
        popup.scale = Math.max(0.5, popup.scale - 0.01 * dt);
        popup.rotation *= 0.95;
        popup.life -= 0.02 * dt;
        
        if (popup.life <= 0) {
          this.popups.splice(i, 1);
        }
      }
    }
    
    render(ctx) {
      ctx.save();
      
      for (const popup of this.popups) {
        ctx.globalAlpha = Math.max(0, popup.life);
        ctx.translate(popup.x, popup.y);
        ctx.scale(popup.scale, popup.scale);
        ctx.rotate(popup.rotation);
        
        let color;
        switch (popup.type) {
          case 'golden': color = '#FFD700'; break;
          case 'combo': color = '#4CAF50'; break;
          case 'power': color = '#9C27B0'; break;
          default: color = '#FFD54F';
        }
        
        ctx.shadowColor = color + '70';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 2;
        
        ctx.font = `bold ${18 + (popup.type === 'combo' ? 6 : 0)}px 'Playfair Display', serif`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${popup.value}`, 0, 0);
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      
      ctx.restore();
    }
    
    clear() {
      this.popups.length = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION AND EXPORT
  // ---------------------------------------------------------------------------
  let gameInstance = null;
  
  function initializeGame() {
    if (gameInstance) {
      console.warn('[Game] Already initialized');
      return gameInstance;
    }
    
    try {
      gameInstance = new HoneyPotCatchGame();
      window.honeyGame = gameInstance; // Export to global scope
      
      // Performance monitoring toggle
      document.getElementById('togglePerf')?.addEventListener('click', () => {
        const monitor = document.getElementById('performanceMonitor');
        if (monitor) {
          monitor.style.display = monitor.style.display === 'none' ? 'block' : 'none';
        }
      });
      
      console.log('[Game] Successfully initialized');
      return gameInstance;
    } catch (error) {
      console.error('[Game] Initialization failed:', error);
      return null;
    }
  }
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
  } else {
    initializeGame();
  }
  
  // Export for module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HoneyPotCatchGame, initializeGame };
  }
})();