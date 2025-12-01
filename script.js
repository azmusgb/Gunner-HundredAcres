// ============================================
// AMAZING GAME FRAMEWORK - FULL IMPLEMENTATION
// ============================================

// ============ MATH UTILITIES ==============
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
    subtract(v) { return new Vector2(this.x - v.x, this.y - v.y); }
    multiply(scalar) { return new Vector2(this.x * scalar, this.y * scalar); }
    divide(scalar) { return new Vector2(this.x / scalar, this.y / scalar); }
    magnitude() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() { const mag = this.magnitude(); return mag === 0 ? new Vector2() : this.divide(mag); }
    distance(v) { return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2); }
    dot(v) { return this.x * v.x + this.y * v.y; }
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }
    clone() { return new Vector2(this.x, this.y); }
}

class MathUtils {
    static lerp(a, b, t) { return a + (b - a) * t; }
    static clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
    static randomRange(min, max) { return Math.random() * (max - min) + min; }
    static randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    static degToRad(degrees) { return degrees * (Math.PI / 180); }
    static radToDeg(radians) { return radians * (180 / Math.PI); }
    static map(value, fromMin, fromMax, toMin, toMax) {
        return (value - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
    }
    static smoothStep(edge0, edge1, x) {
        x = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return x * x * (3 - 2 * x);
    }
}

// ============ INPUT SYSTEM ==============
class InputSystem {
    constructor() {
        this.keys = new Set();
        this.previousKeys = new Set();
        this.mouse = {
            x: 0, y: 0,
            left: false, middle: false, right: false,
            previousLeft: false, previousMiddle: false, previousRight: false,
            wheel: 0
        };
        this.touches = [];
        this.gamepads = [];
        
        this.init();
    }
    
    init() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            if (!e.repeat) this.keys.add(e.code);
        });
        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });
        
        // Mouse events
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.left = true;
            if (e.button === 1) this.mouse.middle = true;
            if (e.button === 2) this.mouse.right = true;
        });
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.left = false;
            if (e.button === 1) this.mouse.middle = false;
            if (e.button === 2) this.mouse.right = false;
        });
        window.addEventListener('wheel', (e) => {
            this.mouse.wheel = e.deltaY;
        });
        window.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Touch events
        window.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touches = Array.from(e.touches);
        });
        window.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.touches = Array.from(e.touches);
        });
        window.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touches = Array.from(e.touches);
        });
        
        // Gamepad events
        window.addEventListener('gamepadconnected', (e) => {
            this.gamepads[e.gamepad.index] = e.gamepad;
        });
        window.addEventListener('gamepaddisconnected', (e) => {
            delete this.gamepads[e.gamepad.index];
        });
    }
    
    update() {
        // Store previous states
        this.previousKeys = new Set(this.keys);
        this.mouse.previousLeft = this.mouse.left;
        this.mouse.previousMiddle = this.mouse.middle;
        this.mouse.previousRight = this.mouse.right;
        this.mouse.wheel = 0;
        
        // Update gamepads
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) this.gamepads[i] = gamepads[i];
        }
    }
    
    isKeyDown(key) { return this.keys.has(key); }
    isKeyPressed(key) { return this.keys.has(key) && !this.previousKeys.has(key); }
    isKeyReleased(key) { return !this.keys.has(key) && this.previousKeys.has(key); }
    
    isMouseDown(button = 'left') {
        return button === 'left' ? this.mouse.left :
               button === 'middle' ? this.mouse.middle :
               this.mouse.right;
    }
    
    isMousePressed(button = 'left') {
        return button === 'left' ? (this.mouse.left && !this.mouse.previousLeft) :
               button === 'middle' ? (this.mouse.middle && !this.mouse.previousMiddle) :
               (this.mouse.right && !this.mouse.previousRight);
    }
    
    isMouseReleased(button = 'left') {
        return button === 'left' ? (!this.mouse.left && this.mouse.previousLeft) :
               button === 'middle' ? (!this.mouse.middle && this.mouse.previousMiddle) :
               (!this.mouse.right && this.mouse.previousRight);
    }
    
    getMousePosition() { return new Vector2(this.mouse.x, this.mouse.y); }
    getMouseWheel() { return this.mouse.wheel; }
}

// ============ AUDIO SYSTEM ==============
class AudioSystem {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = new Map();
        this.music = null;
        this.musicGainNode = null;
        this.soundGainNode = null;
        this.masterGainNode = null;
        this.musicVolume = 0.7;
        this.soundVolume = 0.8;
        this.masterVolume = 1.0;
        this.init();
    }
    
    init() {
        this.masterGainNode = this.context.createGain();
        this.musicGainNode = this.context.createGain();
        this.soundGainNode = this.context.createGain();
        
        this.musicGainNode.connect(this.masterGainNode);
        this.soundGainNode.connect(this.masterGainNode);
        this.masterGainNode.connect(this.context.destination);
        
        this.updateVolumes();
    }
    
    async loadSound(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            this.sounds.set(name, audioBuffer);
            return audioBuffer;
        } catch (error) {
            console.error(`Failed to load sound ${name}:`, error);
            return null;
        }
    }
    
    playSound(name, options = {}) {
        const buffer = this.sounds.get(name);
        if (!buffer) {
            console.warn(`Sound ${name} not found`);
            return null;
        }
        
        const source = this.context.createBufferSource();
        const gainNode = this.context.createGain();
        const panNode = this.context.createStereoPanner();
        
        source.buffer = buffer;
        source.connect(panNode);
        panNode.connect(gainNode);
        gainNode.connect(this.soundGainNode);
        
        // Apply options
        if (options.volume !== undefined) {
            gainNode.gain.value = MathUtils.clamp(options.volume, 0, 1);
        }
        if (options.pan !== undefined) {
            panNode.pan.value = MathUtils.clamp(options.pan, -1, 1);
        }
        if (options.rate !== undefined) {
            source.playbackRate.value = Math.max(options.rate, 0.1);
        }
        if (options.loop) {
            source.loop = true;
        }
        
        source.start();
        return { source, gainNode, panNode };
    }
    
    playMusic(name, loop = true) {
        this.stopMusic();
        const sound = this.playSound(name, { volume: this.musicVolume, loop });
        this.music = sound;
        return sound;
    }
    
    stopMusic() {
        if (this.music) {
            this.music.source.stop();
            this.music = null;
        }
    }
    
    setMasterVolume(volume) {
        this.masterVolume = MathUtils.clamp(volume, 0, 1);
        this.updateVolumes();
    }
    
    setMusicVolume(volume) {
        this.musicVolume = MathUtils.clamp(volume, 0, 1);
        this.updateVolumes();
    }
    
    setSoundVolume(volume) {
        this.soundVolume = MathUtils.clamp(volume, 0, 1);
        this.updateVolumes();
    }
    
    updateVolumes() {
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = this.masterVolume;
        }
        if (this.musicGainNode && this.music) {
            this.music.gainNode.gain.value = this.musicVolume;
        }
        this.soundGainNode.gain.value = this.soundVolume;
    }
    
    createOscillator(frequency, type = 'sine') {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        return { oscillator, gainNode };
    }
}

// ============ PARTICLE SYSTEM ==============
class Particle {
    constructor(x, y) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2();
        this.acceleration = new Vector2();
        this.life = 1.0;
        this.maxLife = 1.0;
        this.size = 10;
        this.startSize = 10;
        this.endSize = 0;
        this.color = '#ffffff';
        this.startColor = '#ffffff';
        this.endColor = '#ffffff';
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.opacity = 1.0;
        this.startOpacity = 1.0;
        this.endOpacity = 0;
        this.gravity = 0;
        this.damping = 0.99;
    }
    
    update(deltaTime) {
        this.velocity = this.velocity.add(this.acceleration.multiply(deltaTime));
        this.velocity = this.velocity.multiply(this.damping);
        this.velocity.y += this.gravity * deltaTime;
        this.position = this.position.add(this.velocity.multiply(deltaTime));
        this.rotation += this.rotationSpeed * deltaTime;
        this.life -= deltaTime / this.maxLife;
        
        // Interpolate values based on life
        const t = 1 - this.life;
        this.size = MathUtils.lerp(this.startSize, this.endSize, t);
        this.opacity = MathUtils.lerp(this.startOpacity, this.endOpacity, t);
        
        // Color interpolation
        if (this.startColor !== this.endColor) {
            this.color = this.interpolateColor(this.startColor, this.endColor, t);
        }
    }
    
    interpolateColor(color1, color2, t) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        const r = MathUtils.lerp(c1.r, c2.r, t);
        const g = MathUtils.lerp(c1.g, c2.g, t);
        const b = MathUtils.lerp(c1.b, c2.b, t);
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }
    
    isAlive() {
        return this.life > 0;
    }
}

class ParticleSystem {
    constructor(maxParticles = 1000) {
        this.particles = [];
        this.maxParticles = maxParticles;
        this.emitters = new Map();
        this.pool = [];
    }
    
    createEmitter(config = {}) {
        const emitter = {
            x: config.x || 0,
            y: config.y || 0,
            rate: config.rate || 10,
            burst: config.burst || 0,
            timer: 0,
            active: true,
            particleConfig: {
                startSize: config.startSize || 5,
                endSize: config.endSize || 0,
                startColor: config.startColor || '#ffffff',
                endColor: config.endColor || '#ff0000',
                startOpacity: config.startOpacity || 1,
                endOpacity: config.endOpacity || 0,
                minSpeed: config.minSpeed || 50,
                maxSpeed: config.maxSpeed || 200,
                minAngle: config.minAngle || 0,
                maxAngle: config.maxAngle || Math.PI * 2,
                minLife: config.minLife || 1,
                maxLife: config.maxLife || 3,
                gravity: config.gravity || 0,
                rotationSpeed: config.rotationSpeed || 0,
                damping: config.damping || 0.99
            }
        };
        
        const id = Date.now() + Math.random();
        this.emitters.set(id, emitter);
        
        if (config.burst > 0) {
            this.emitBurst(emitter.x, emitter.y, config.burst, emitter.particleConfig);
        }
        
        return id;
    }
    
    emitParticle(x, y, config) {
        let particle;
        if (this.pool.length > 0) {
            particle = this.pool.pop();
            particle.position.x = x;
            particle.position.y = y;
            particle.life = 1.0;
        } else {
            particle = new Particle(x, y);
        }
        
        // Configure particle
        const angle = MathUtils.randomRange(config.minAngle, config.maxAngle);
        const speed = MathUtils.randomRange(config.minSpeed, config.maxSpeed);
        particle.velocity.x = Math.cos(angle) * speed;
        particle.velocity.y = Math.sin(angle) * speed;
        
        particle.startSize = config.startSize;
        particle.endSize = config.endSize;
        particle.size = config.startSize;
        
        particle.startColor = config.startColor;
        particle.endColor = config.endColor;
        particle.color = config.startColor;
        
        particle.startOpacity = config.startOpacity;
        particle.endOpacity = config.endOpacity;
        particle.opacity = config.startOpacity;
        
        particle.maxLife = MathUtils.randomRange(config.minLife, config.maxLife);
        particle.life = 1.0;
        
        particle.gravity = config.gravity;
        particle.rotationSpeed = config.rotationSpeed;
        particle.damping = config.damping;
        
        this.particles.push(particle);
        return particle;
    }
    
    emitBurst(x, y, count, config) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;
            this.emitParticle(x, y, config);
        }
    }
    
    update(deltaTime) {
        // Update emitters
        this.emitters.forEach((emitter, id) => {
            if (!emitter.active) return;
            
            emitter.timer += deltaTime;
            const emitInterval = 1 / emitter.rate;
            
            while (emitter.timer >= emitInterval && this.particles.length < this.maxParticles) {
                this.emitParticle(emitter.x, emitter.y, emitter.particleConfig);
                emitter.timer -= emitInterval;
            }
        });
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);
            
            if (!particle.isAlive()) {
                this.pool.push(particle);
                this.particles.splice(i, 1);
            }
        }
    }
    
    render(ctx) {
        ctx.save();
        this.particles.forEach(particle => {
            ctx.save();
            ctx.translate(particle.position.x, particle.position.y);
            ctx.rotate(particle.rotation);
            ctx.globalAlpha = particle.opacity;
            
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        ctx.restore();
    }
    
    removeEmitter(id) {
        this.emitters.delete(id);
    }
    
    clear() {
        this.particles = [];
        this.emitters.clear();
    }
}

// ============ PHYSICS SYSTEM ==============
class PhysicsSystem {
    constructor() {
        this.gravity = new Vector2(0, 500);
        this.worldBounds = { min: new Vector2(-1000, -1000), max: new Vector2(1000, 1000) };
        this.colliders = new Set();
        this.collisionLayers = new Map();
        this.debugDraw = false;
        
        // Create default layers
        this.createLayer('default', ['default']);
        this.createLayer('player', ['environment', 'enemies', 'items']);
        this.createLayer('enemies', ['player', 'environment', 'projectiles']);
        this.createLayer('projectiles', ['enemies', 'environment']);
        this.createLayer('environment', ['default']);
        this.createLayer('items', ['player']);
    }
    
    createLayer(name, collidesWith) {
        this.collisionLayers.set(name, {
            collidesWith: new Set(collidesWith),
            objects: new Set()
        });
    }
    
    addCollider(collider, layer = 'default') {
        collider.layer = layer;
        this.colliders.add(collider);
        const layerData = this.collisionLayers.get(layer);
        if (layerData) {
            layerData.objects.add(collider);
        }
    }
    
    removeCollider(collider) {
        this.colliders.delete(collider);
        const layerData = this.collisionLayers.get(collider.layer);
        if (layerData) {
            layerData.objects.delete(collider);
        }
    }
    
    update(deltaTime) {
        // Apply gravity to dynamic bodies
        this.colliders.forEach(collider => {
            if (collider.body && collider.body.type === 'dynamic') {
                collider.body.velocity = collider.body.velocity.add(this.gravity.multiply(deltaTime));
                collider.position = collider.position.add(collider.body.velocity.multiply(deltaTime));
            }
        });
        
        // Check collisions
        this.checkCollisions();
        
        // Apply world bounds
        this.applyWorldBounds();
    }
    
    checkCollisions() {
        const collidersArray = Array.from(this.colliders);
        
        for (let i = 0; i < collidersArray.length; i++) {
            const colliderA = collidersArray[i];
            if (!colliderA.enabled) continue;
            
            const layerA = this.collisionLayers.get(colliderA.layer);
            if (!layerA) continue;
            
            for (let j = i + 1; j < collidersArray.length; j++) {
                const colliderB = collidersArray[j];
                if (!colliderB.enabled) continue;
                
                // Check if layers can collide
                if (!layerA.collidesWith.has(colliderB.layer)) continue;
                
                // Check collision
                const collision = this.checkCollision(colliderA, colliderB);
                if (collision) {
                    this.resolveCollision(colliderA, colliderB, collision);
                    
                    // Trigger collision events
                    if (colliderA.onCollision) colliderA.onCollision(colliderB, collision);
                    if (colliderB.onCollision) colliderB.onCollision(colliderA, {
                        ...collision,
                        normal: collision.normal.multiply(-1)
                    });
                }
            }
        }
    }
    
    checkCollision(a, b) {
        if (a.shape === 'circle' && b.shape === 'circle') {
            return this.circleVsCircle(a, b);
        } else if (a.shape === 'aabb' && b.shape === 'aabb') {
            return this.aabbVsAabb(a, b);
        } else if (a.shape === 'circle' && b.shape === 'aabb') {
            const collision = this.circleVsAabb(a, b);
            if (collision) return collision;
        } else if (a.shape === 'aabb' && b.shape === 'circle') {
            const collision = this.circleVsAabb(b, a);
            if (collision) {
                // Swap normal for correct direction
                collision.normal = collision.normal.multiply(-1);
                return collision;
            }
        }
        return null;
    }
    
    circleVsCircle(circleA, circleB) {
        const dx = circleB.position.x - circleA.position.x;
        const dy = circleB.position.y - circleA.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radiusSum = circleA.radius + circleB.radius;
        
        if (distance < radiusSum) {
            return {
                depth: radiusSum - distance,
                normal: new Vector2(dx / distance, dy / distance),
                point: new Vector2(
                    circleA.position.x + (dx / distance) * circleA.radius,
                    circleA.position.y + (dy / distance) * circleA.radius
                )
            };
        }
        return null;
    }
    
    aabbVsAabb(a, b) {
        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        
        const overlapX = a.halfWidth + b.halfWidth - Math.abs(dx);
        const overlapY = a.halfHeight + b.halfHeight - Math.abs(dy);
        
        if (overlapX > 0 && overlapY > 0) {
            if (overlapX < overlapY) {
                return {
                    depth: overlapX,
                    normal: new Vector2(dx > 0 ? 1 : -1, 0),
                    point: new Vector2(
                        a.position.x + (dx > 0 ? a.halfWidth : -a.halfWidth),
                        a.position.y
                    )
                };
            } else {
                return {
                    depth: overlapY,
                    normal: new Vector2(0, dy > 0 ? 1 : -1),
                    point: new Vector2(
                        a.position.x,
                        a.position.y + (dy > 0 ? a.halfHeight : -a.halfHeight)
                    )
                };
            }
        }
        return null;
    }
    
    circleVsAabb(circle, aabb) {
        // Find closest point on AABB to circle
        let closestX = MathUtils.clamp(circle.position.x, aabb.position.x - aabb.halfWidth, aabb.position.x + aabb.halfWidth);
        let closestY = MathUtils.clamp(circle.position.y, aabb.position.y - aabb.halfHeight, aabb.position.y + aabb.halfHeight);
        
        const dx = circle.position.x - closestX;
        const dy = circle.position.y - closestY;
        const distanceSquared = dx * dx + dy * dy;
        
        if (distanceSquared < circle.radius * circle.radius) {
            const distance = Math.sqrt(distanceSquared);
            if (distance === 0) {
                // Circle center is inside AABB
                const overlapX = aabb.halfWidth + circle.radius - Math.abs(circle.position.x - aabb.position.x);
                const overlapY = aabb.halfHeight + circle.radius - Math.abs(circle.position.y - aabb.position.y);
                
                if (overlapX < overlapY) {
                    return {
                        depth: overlapX,
                        normal: new Vector2(circle.position.x < aabb.position.x ? -1 : 1, 0),
                        point: new Vector2(closestX, circle.position.y)
                    };
                } else {
                    return {
                        depth: overlapY,
                        normal: new Vector2(0, circle.position.y < aabb.position.y ? -1 : 1),
                        point: new Vector2(circle.position.x, closestY)
                    };
                }
            } else {
                return {
                    depth: circle.radius - distance,
                    normal: new Vector2(dx / distance, dy / distance),
                    point: new Vector2(closestX, closestY)
                };
            }
        }
        return null;
    }
    
    resolveCollision(a, b, collision) {
        // Move objects apart
        const totalInverseMass = (a.body ? 1 / a.body.mass : 0) + (b.body ? 1 / b.body.mass : 0);
        if (totalInverseMass === 0) return;
        
        const separation = collision.normal.multiply(collision.depth / totalInverseMass);
        
        if (a.body) {
            a.position = a.position.subtract(separation.multiply(a.body.inverseMass));
        }
        if (b.body) {
            b.position = b.position.add(separation.multiply(b.body.inverseMass));
        }
        
        // Apply bounce
        if (a.body && b.body) {
            const relativeVelocity = b.body.velocity.subtract(a.body.velocity);
            const velocityAlongNormal = relativeVelocity.dot(collision.normal);
            
            if (velocityAlongNormal > 0) return; // Objects are moving apart
            
            const restitution = Math.min(a.body.restitution, b.body.restitution);
            let impulseScalar = -(1 + restitution) * velocityAlongNormal;
            impulseScalar /= totalInverseMass;
            
            const impulse = collision.normal.multiply(impulseScalar);
            
            if (a.body.type === 'dynamic') {
                a.body.velocity = a.body.velocity.subtract(impulse.multiply(a.body.inverseMass));
            }
            if (b.body.type === 'dynamic') {
                b.body.velocity = b.body.velocity.add(impulse.multiply(b.body.inverseMass));
            }
        }
    }
    
    applyWorldBounds() {
        this.colliders.forEach(collider => {
            if (!collider.body || collider.body.type !== 'dynamic') return;
            
            if (collider.shape === 'circle') {
                if (collider.position.x - collider.radius < this.worldBounds.min.x) {
                    collider.position.x = this.worldBounds.min.x + collider.radius;
                    collider.body.velocity.x = Math.abs(collider.body.velocity.x) * collider.body.restitution;
                }
                if (collider.position.x + collider.radius > this.worldBounds.max.x) {
                    collider.position.x = this.worldBounds.max.x - collider.radius;
                    collider.body.velocity.x = -Math.abs(collider.body.velocity.x) * collider.body.restitution;
                }
                if (collider.position.y - collider.radius < this.worldBounds.min.y) {
                    collider.position.y = this.worldBounds.min.y + collider.radius;
                    collider.body.velocity.y = Math.abs(collider.body.velocity.y) * collider.body.restitution;
                }
                if (collider.position.y + collider.radius > this.worldBounds.max.y) {
                    collider.position.y = this.worldBounds.max.y - collider.radius;
                    collider.body.velocity.y = -Math.abs(collider.body.velocity.y) * collider.body.restitution;
                }
            } else if (collider.shape === 'aabb') {
                if (collider.position.x - collider.halfWidth < this.worldBounds.min.x) {
                    collider.position.x = this.worldBounds.min.x + collider.halfWidth;
                    collider.body.velocity.x = Math.abs(collider.body.velocity.x) * collider.body.restitution;
                }
                if (collider.position.x + collider.halfWidth > this.worldBounds.max.x) {
                    collider.position.x = this.worldBounds.max.x - collider.halfWidth;
                    collider.body.velocity.x = -Math.abs(collider.body.velocity.x) * collider.body.restitution;
                }
                if (collider.position.y - collider.halfHeight < this.worldBounds.min.y) {
                    collider.position.y = this.worldBounds.min.y + collider.halfHeight;
                    collider.body.velocity.y = Math.abs(collider.body.velocity.y) * collider.body.restitution;
                }
                if (collider.position.y + collider.halfHeight > this.worldBounds.max.y) {
                    collider.position.y = this.worldBounds.max.y - collider.halfHeight;
                    collider.body.velocity.y = -Math.abs(collider.body.velocity.y) * collider.body.restitution;
                }
            }
        });
    }
    
    raycast(start, end, layer = 'default') {
        const direction = end.subtract(start).normalize();
        const maxDistance = start.distance(end);
        let closestHit = null;
        
        this.colliders.forEach(collider => {
            if (!collider.enabled) return;
            const layerData = this.collisionLayers.get(collider.layer);
            if (!layerData || !layerData.collidesWith.has(layer)) return;
            
            const hit = this.raycastVsCollider(start, direction, maxDistance, collider);
            if (hit && (!closestHit || hit.distance < closestHit.distance)) {
                closestHit = hit;
            }
        });
        
        return closestHit;
    }
    
    raycastVsCollider(start, direction, maxDistance, collider) {
        if (collider.shape === 'circle') {
            return this.raycastVsCircle(start, direction, maxDistance, collider);
        } else if (collider.shape === 'aabb') {
            return this.raycastVsAabb(start, direction, maxDistance, collider);
        }
        return null;
    }
    
    raycastVsCircle(start, direction, maxDistance, circle) {
        const toCircle = circle.position.subtract(start);
        const projection = toCircle.dot(direction);
        const closestPoint = start.add(direction.multiply(projection));
        const distanceToCenter = closestPoint.distance(circle.position);
        
        if (distanceToCenter <= circle.radius) {
            // Calculate intersection point
            const inside = circle.position.distance(start) <= circle.radius;
            if (inside) {
                return {
                    point: start.clone(),
                    normal: direction.multiply(-1),
                    distance: 0,
                    collider: circle
                };
            }
            
            const offset = Math.sqrt(circle.radius * circle.radius - distanceToCenter * distanceToCenter);
            const distance = projection - offset;
            
            if (distance >= 0 && distance <= maxDistance) {
                const point = start.add(direction.multiply(distance));
                return {
                    point: point,
                    normal: point.subtract(circle.position).normalize(),
                    distance: distance,
                    collider: circle
                };
            }
        }
        return null;
    }
    
    raycastVsAabb(start, direction, maxDistance, aabb) {
        const invDir = new Vector2(
            direction.x !== 0 ? 1 / direction.x : Number.MAX_VALUE,
            direction.y !== 0 ? 1 / direction.y : Number.MAX_VALUE
        );
        
        const t1 = (aabb.position.x - aabb.halfWidth - start.x) * invDir.x;
        const t2 = (aabb.position.x + aabb.halfWidth - start.x) * invDir.x;
        const t3 = (aabb.position.y - aabb.halfHeight - start.y) * invDir.y;
        const t4 = (aabb.position.y + aabb.halfHeight - start.y) * invDir.y;
        
        const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
        const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));
        
        if (tmax < 0 || tmin > tmax) return null;
        
        const distance = tmin < 0 ? tmax : tmin;
        if (distance < 0 || distance > maxDistance) return null;
        
        const point = start.add(direction.multiply(distance));
        let normal = new Vector2();
        
        if (distance === t1) normal.x = -1;
        else if (distance === t2) normal.x = 1;
        else if (distance === t3) normal.y = -1;
        else if (distance === t4) normal.y = 1;
        
        return {
            point: point,
            normal: normal,
            distance: distance,
            collider: aabb
        };
    }
    
    drawDebug(ctx) {
        if (!this.debugDraw) return;
        
        ctx.save();
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        
        this.colliders.forEach(collider => {
            ctx.save();
            ctx.translate(collider.position.x, collider.position.y);
            
            if (collider.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, collider.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // Draw velocity vector
                if (collider.body) {
                    ctx.strokeStyle = '#ff0000';
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(collider.body.velocity.x * 0.1, collider.body.velocity.y * 0.1);
                    ctx.stroke();
                }
            } else if (collider.shape === 'aabb') {
                ctx.strokeRect(-collider.halfWidth, -collider.halfHeight, 
                             collider.halfWidth * 2, collider.halfHeight * 2);
            }
            
            ctx.restore();
        });
        
        // Draw world bounds
        ctx.strokeStyle = '#0000ff';
        ctx.strokeRect(this.worldBounds.min.x, this.worldBounds.min.y,
                      this.worldBounds.max.x - this.worldBounds.min.x,
                      this.worldBounds.max.y - this.worldBounds.min.y);
        
        ctx.restore();
    }
}

// ============ LIGHTING SYSTEM ==============
class Light {
    constructor(x, y, radius = 100) {
        this.position = new Vector2(x, y);
        this.radius = radius;
        this.color = '#ffffff';
        this.intensity = 1.0;
        this.flicker = false;
        this.flickerSpeed = 5;
        this.flickerAmount = 0.1;
        this.pulse = false;
        this.pulseSpeed = 2;
        this.pulseAmount = 0.2;
        this.time = 0;
        this.active = true;
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        
        if (this.flicker) {
            const flicker = Math.sin(this.time * this.flickerSpeed) * this.flickerAmount;
            this.intensity = MathUtils.clamp(1.0 + flicker, 0.5, 1.5);
        }
        
        if (this.pulse) {
            const pulse = (Math.sin(this.time * this.pulseSpeed) + 1) * 0.5;
            this.radius = this.radius * (1 + pulse * this.pulseAmount);
        }
    }
    
    getCurrentRadius() {
        if (this.pulse) {
            const pulse = (Math.sin(this.time * this.pulseSpeed) + 1) * 0.5;
            return this.radius * (1 + pulse * this.pulseAmount);
        }
        return this.radius;
    }
}

class LightingSystem {
    constructor() {
        this.lights = new Set();
        this.ambientColor = '#111122';
        this.ambientIntensity = 0.3;
        this.shadowsEnabled = true;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.lightBuffer = document.createElement('canvas');
        this.lightCtx = this.lightBuffer.getContext('2d');
        this.shadowBuffer = document.createElement('canvas');
        this.shadowCtx = this.shadowBuffer.getContext('2d');
        this.enabled = true;
    }
    
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.lightBuffer.width = width;
        this.lightBuffer.height = height;
        this.shadowBuffer.width = width;
        this.shadowBuffer.height = height;
    }
    
    addLight(light) {
        this.lights.add(light);
        return light;
    }
    
    removeLight(light) {
        this.lights.delete(light);
    }
    
    update(deltaTime) {
        this.lights.forEach(light => {
            if (light.active) {
                light.update(deltaTime);
            }
        });
    }
    
    render(ctx, gameObjects = []) {
        if (!this.enabled) return;
        
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        this.resize(width, height);
        
        // Clear buffers
        this.lightCtx.clearRect(0, 0, width, height);
        this.shadowCtx.clearRect(0, 0, width, height);
        
        // Draw ambient light
        this.lightCtx.fillStyle = this.ambientColor;
        this.lightCtx.globalAlpha = this.ambientIntensity;
        this.lightCtx.fillRect(0, 0, width, height);
        this.lightCtx.globalAlpha = 1;
        
        // Draw each light
        this.lights.forEach(light => {
            if (!light.active) return;
            
            const radius = light.getCurrentRadius();
            const gradient = this.lightCtx.createRadialGradient(
                light.position.x, light.position.y, 0,
                light.position.x, light.position.y, radius
            );
            
            gradient.addColorStop(0, light.color);
            gradient.addColorStop(1, 'transparent');
            
            this.lightCtx.globalCompositeOperation = 'lighter';
            this.lightCtx.fillStyle = gradient;
            this.lightCtx.globalAlpha = light.intensity;
            this.lightCtx.beginPath();
            this.lightCtx.arc(light.position.x, light.position.y, radius, 0, Math.PI * 2);
            this.lightCtx.fill();
        });
        
        // Generate shadows if enabled
        if (this.shadowsEnabled && gameObjects.length > 0) {
            this.generateShadows(gameObjects);
            
            // Apply shadows to light buffer
            this.lightCtx.globalCompositeOperation = 'destination-out';
            this.lightCtx.drawImage(this.shadowBuffer, 0, 0);
        }
        
        // Apply lighting to main context
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(this.lightBuffer, 0, 0);
        ctx.restore();
    }
    
    generateShadows(gameObjects) {
        this.shadowCtx.clearRect(0, 0, this.shadowBuffer.width, this.shadowBuffer.height);
        this.shadowCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        
        this.lights.forEach(light => {
            if (!light.active) return;
            
            gameObjects.forEach(obj => {
                if (!obj.castShadow || !obj.getBounds) return;
                
                const bounds = obj.getBounds();
                if (!bounds) return;
                
                // Calculate shadow direction from light
                const lightToObj = new Vector2(
                    bounds.x + bounds.width / 2 - light.position.x,
                    bounds.y + bounds.height / 2 - light.position.y
                );
                const distance = lightToObj.magnitude();
                const lightRadius = light.getCurrentRadius();
                
                if (distance < lightRadius) {
                    // Create shadow polygon
                    const shadowLength = lightRadius * 2;
                    const angle = Math.atan2(lightToObj.y, lightToObj.x);
                    
                    this.shadowCtx.save();
                    this.shadowCtx.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
                    this.shadowCtx.rotate(angle);
                    
                    // Draw shadow polygon
                    this.shadowCtx.beginPath();
                    this.shadowCtx.moveTo(-bounds.width / 2, -bounds.height / 2);
                    this.shadowCtx.lineTo(bounds.width / 2, -bounds.height / 2);
                    this.shadowCtx.lineTo(bounds.width / 2 + shadowLength, shadowLength);
                    this.shadowCtx.lineTo(-bounds.width / 2 + shadowLength, shadowLength);
                    this.shadowCtx.closePath();
                    this.shadowCtx.fill();
                    
                    this.shadowCtx.restore();
                }
            });
        });
    }
}

// ============ UI SYSTEM ==============
class UIElement {
    constructor(x, y, width, height) {
        this.position = new Vector2(x, y);
        this.size = new Vector2(width, height);
        this.children = [];
        this.parent = null;
        this.visible = true;
        this.active = true;
        this.id = `ui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.style = {
            backgroundColor: 'transparent',
            color: '#ffffff',
            fontSize: 16,
            fontFamily: 'Arial, sans-serif',
            borderColor: 'transparent',
            borderWidth: 0,
            borderRadius: 0,
            padding: 0,
            margin: 0,
            opacity: 1,
            textAlign: 'center',
            textBaseline: 'middle'
        };
        this.events = new Map();
        this.hovered = false;
        this.pressed = false;
    }
    
    addChild(element) {
        element.parent = this;
        this.children.push(element);
        return element;
    }
    
    removeChild(element) {
        const index = this.children.indexOf(element);
        if (index > -1) {
            element.parent = null;
            this.children.splice(index, 1);
        }
    }
    
    getAbsolutePosition() {
        let x = this.position.x;
        let y = this.position.y;
        let parent = this.parent;
        
        while (parent) {
            x += parent.position.x;
            y += parent.position.y;
            parent = parent.parent;
        }
        
        return new Vector2(x, y);
    }
    
    containsPoint(x, y) {
        const absPos = this.getAbsolutePosition();
        return x >= absPos.x && x <= absPos.x + this.size.x &&
               y >= absPos.y && y <= absPos.y + this.size.y;
    }
    
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    }
    
    emit(event, data = {}) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                callback({ ...data, target: this });
            });
        }
    }
    
    update(input, deltaTime) {
        if (!this.active || !this.visible) return;
        
        // Update children
        this.children.forEach(child => {
            child.update(input, deltaTime);
        });
    }
    
    render(ctx) {
        if (!this.visible) return;
        
        const absPos = this.getAbsolutePosition();
        ctx.save();
        ctx.translate(absPos.x, absPos.y);
        ctx.globalAlpha = this.style.opacity;
        
        // Draw background
        if (this.style.backgroundColor !== 'transparent') {
            ctx.fillStyle = this.style.backgroundColor;
            if (this.style.borderRadius > 0) {
                this.drawRoundedRect(ctx, 0, 0, this.size.x, this.size.y, this.style.borderRadius);
                ctx.fill();
            } else {
                ctx.fillRect(0, 0, this.size.x, this.size.y);
            }
        }
        
        // Draw border
        if (this.style.borderColor !== 'transparent' && this.style.borderWidth > 0) {
            ctx.strokeStyle = this.style.borderColor;
            ctx.lineWidth = this.style.borderWidth;
            if (this.style.borderRadius > 0) {
                this.drawRoundedRect(ctx, 0, 0, this.size.x, this.size.y, this.style.borderRadius);
                ctx.stroke();
            } else {
                ctx.strokeRect(0, 0, this.size.x, this.size.y);
            }
        }
        
        // Draw children
        this.children.forEach(child => {
            child.render(ctx);
        });
        
        ctx.restore();
    }
    
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

class Button extends UIElement {
    constructor(x, y, width, height, text = '') {
        super(x, y, width, height);
        this.text = text;
        this.style.backgroundColor = '#4a4a4a';
        this.style.color = '#ffffff';
        this.style.borderRadius = 5;
        this.hoverColor = '#5a5a5a';
        this.pressColor = '#3a3a3a';
        this.normalColor = this.style.backgroundColor;
    }
    
    update(input, deltaTime) {
        if (!this.active || !this.visible) return;
        
        const mousePos = input.getMousePosition();
        const absPos = this.getAbsolutePosition();
        const wasHovered = this.hovered;
        const wasPressed = this.pressed;
        
        this.hovered = this.containsPoint(mousePos.x, mousePos.y);
        
        if (this.hovered) {
            this.style.backgroundColor = this.hoverColor;
            
            if (input.isMouseDown('left')) {
                this.pressed = true;
                this.style.backgroundColor = this.pressColor;
            } else if (this.pressed && input.isMouseReleased('left')) {
                this.pressed = false;
                this.emit('click');
            }
        } else {
            this.style.backgroundColor = this.normalColor;
            this.pressed = false;
        }
        
        // Emit hover events
        if (!wasHovered && this.hovered) {
            this.emit('mouseenter');
        } else if (wasHovered && !this.hovered) {
            this.emit('mouseleave');
        }
        
        super.update(input, deltaTime);
    }
    
    render(ctx) {
        super.render(ctx);
        
        // Draw text
        if (this.text) {
            const absPos = this.getAbsolutePosition();
            ctx.save();
            ctx.translate(absPos.x, absPos.y);
            ctx.fillStyle = this.style.color;
            ctx.font = `${this.style.fontSize}px ${this.style.fontFamily}`;
            ctx.textAlign = this.style.textAlign;
            ctx.textBaseline = this.style.textBaseline;
            
            const textX = this.style.textAlign === 'center' ? this.size.x / 2 :
                         this.style.textAlign === 'right' ? this.size.x :
                         0;
            const textY = this.style.textBaseline === 'middle' ? this.size.y / 2 :
                         this.style.textBaseline === 'bottom' ? this.size.y :
                         0;
            
            ctx.fillText(this.text, textX, textY);
            ctx.restore();
        }
    }
}

class Label extends UIElement {
    constructor(x, y, text = '', fontSize = 16, measureCtx = null) {
        super(x, y, 0, 0);
        this.text = text;
        this.style.fontSize = fontSize;
        this.style.textAlign = 'left';
        this.style.color = '#ffffff';
        this.measureCtx = measureCtx || Label.getMeasureContext();
        this.calculateSize();
    }

    static getMeasureContext() {
        if (!Label.measureCanvas) {
            Label.measureCanvas = document.createElement('canvas');
            Label.measureCtx = Label.measureCanvas.getContext('2d');
        }
        return Label.measureCtx;
    }

    calculateSize(ctx = this.measureCtx) {
        ctx.save();
        ctx.font = `${this.style.fontSize}px ${this.style.fontFamily}`;
        const metrics = ctx.measureText(this.text);
        this.size.x = metrics.width;
        this.size.y = this.style.fontSize;
        ctx.restore();
    }
    
    render(ctx) {
        if (!this.visible) return;
        
        const absPos = this.getAbsolutePosition();
        ctx.save();
        ctx.translate(absPos.x, absPos.y);
        ctx.fillStyle = this.style.color;
        ctx.font = `${this.style.fontSize}px ${this.style.fontFamily}`;
        ctx.textAlign = this.style.textAlign;
        ctx.textBaseline = this.style.textBaseline;
        ctx.globalAlpha = this.style.opacity;
        
        const textY = this.style.textBaseline === 'middle' ? this.size.y / 2 :
                     this.style.textBaseline === 'bottom' ? this.size.y :
                     0;
        
        ctx.fillText(this.text, 0, textY);
        ctx.restore();
        
        // Render children
        this.children.forEach(child => {
            child.render(ctx);
        });
    }
}

class Panel extends UIElement {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.style.borderColor = '#444444';
        this.style.borderWidth = 2;
        this.style.borderRadius = 8;
        this.scrollable = false;
        this.scrollOffset = new Vector2(0, 0);
    }
    
    render(ctx) {
        if (!this.visible) return;
        
        const absPos = this.getAbsolutePosition();
        ctx.save();
        ctx.translate(absPos.x, absPos.y);
        ctx.globalAlpha = this.style.opacity;
        
        // Draw background
        if (this.style.backgroundColor !== 'transparent') {
            ctx.fillStyle = this.style.backgroundColor;
            if (this.style.borderRadius > 0) {
                this.drawRoundedRect(ctx, 0, 0, this.size.x, this.size.y, this.style.borderRadius);
                ctx.fill();
            } else {
                ctx.fillRect(0, 0, this.size.x, this.size.y);
            }
        }
        
        // Draw border
        if (this.style.borderColor !== 'transparent' && this.style.borderWidth > 0) {
            ctx.strokeStyle = this.style.borderColor;
            ctx.lineWidth = this.style.borderWidth;
            if (this.style.borderRadius > 0) {
                this.drawRoundedRect(ctx, 0, 0, this.size.x, this.size.y, this.style.borderRadius);
                ctx.stroke();
            } else {
                ctx.strokeRect(0, 0, this.size.x, this.size.y);
            }
        }
        
        // Setup clipping for children
        ctx.save();
        if (this.style.borderRadius > 0) {
            this.drawRoundedRect(ctx, 0, 0, this.size.x, this.size.y, this.style.borderRadius);
            ctx.clip();
        } else {
            ctx.rect(0, 0, this.size.x, this.size.y);
            ctx.clip();
        }
        
        // Translate for scrolling
        ctx.translate(-this.scrollOffset.x, -this.scrollOffset.y);
        
        // Draw children
        this.children.forEach(child => {
            child.render(ctx);
        });
        
        ctx.restore();
        ctx.restore();
    }
}

class UISystem {
    constructor() {
        this.root = new UIElement(0, 0, 0, 0);
        this.focusedElement = null;
        this.hoveredElement = null;
    }
    
    addElement(element) {
        this.root.addChild(element);
        return element;
    }
    
    removeElement(element) {
        this.root.removeChild(element);
    }
    
    update(input, deltaTime) {
        // Update hover state
        const mousePos = input.getMousePosition();
        this.updateHoverState(this.root, mousePos, input);
        
        // Update all elements
        this.root.update(input, deltaTime);
    }
    
    updateHoverState(element, mousePos, input) {
        if (!element.active || !element.visible) return;
        
        // Check if mouse is over this element
        const isHovered = element.containsPoint(mousePos.x, mousePos.y);
        
        // Update children first (bottom to top for z-order)
        element.children.slice().reverse().forEach(child => {
            this.updateHoverState(child, mousePos, input);
        });
        
        // Only set hovered if no child is hovered (prevent parent hover when child is hovered)
        if (isHovered && !this.hoveredElement) {
            this.hoveredElement = element;
            if (element.hovered !== true) {
                element.hovered = true;
                element.emit('mouseenter');
            }
        } else if (element.hovered && !isHovered) {
            element.hovered = false;
            element.emit('mouseleave');
        }
    }
    
    render(ctx) {
        this.root.render(ctx);
    }
    
    getElementById(id) {
        return this.findElementById(this.root, id);
    }
    
    findElementById(element, id) {
        if (element.id === id) return element;
        
        for (const child of element.children) {
            const found = this.findElementById(child, id);
            if (found) return found;
        }
        
        return null;
    }
}

// ============ SCENE MANAGEMENT ==============
class Scene {
    constructor(name) {
        this.name = name;
        this.gameObjects = new Set();
        this.systems = new Map();
        this.active = false;
        this.paused = false;
    }
    
    addGameObject(obj) {
        this.gameObjects.add(obj);
        if (this.active && obj.start) {
            obj.start();
        }
        return obj;
    }
    
    removeGameObject(obj) {
        this.gameObjects.delete(obj);
        if (obj.destroy) {
            obj.destroy();
        }
    }
    
    addSystem(name, system) {
        this.systems.set(name, system);
        return system;
    }
    
    getSystem(name) {
        return this.systems.get(name);
    }
    
    start() {
        this.active = true;
        this.paused = false;
        this.gameObjects.forEach(obj => {
            if (obj.start) obj.start();
        });
    }
    
    update(deltaTime) {
        if (!this.active || this.paused) return;
        
        // Update systems
        this.systems.forEach(system => {
            if (system.update) system.update(deltaTime);
        });
        
        // Update game objects
        this.gameObjects.forEach(obj => {
            if (obj.update && obj.active) obj.update(deltaTime);
        });
    }
    
    render(ctx) {
        if (!this.active) return;
        
        // Render game objects (sorted by z-index if available)
        const sortedObjects = Array.from(this.gameObjects).sort((a, b) => {
            const aZ = a.zIndex || 0;
            const bZ = b.zIndex || 0;
            return aZ - bZ;
        });
        
        sortedObjects.forEach(obj => {
            if (obj.render && obj.visible !== false) obj.render(ctx);
        });
    }
    
    pause() {
        this.paused = true;
    }
    
    resume() {
        this.paused = false;
    }
    
    stop() {
        this.active = false;
        this.paused = false;
    }
}

class SceneManager {
    constructor() {
        this.scenes = new Map();
        this.currentScene = null;
        this.previousScene = null;
        this.transitioning = false;
        this.transitionTime = 0;
        this.transitionDuration = 0;
        this.transitionCallback = null;
    }
    
    addScene(scene) {
        this.scenes.set(scene.name, scene);
        return scene;
    }
    
    loadScene(name, transitionDuration = 0) {
        const scene = this.scenes.get(name);
        if (!scene) {
            console.error(`Scene ${name} not found`);
            return;
        }
        
        if (this.transitioning) return;
        
        this.previousScene = this.currentScene;
        this.currentScene = scene;
        
        if (transitionDuration > 0) {
            this.transitioning = true;
            this.transitionDuration = transitionDuration;
            this.transitionTime = 0;
            
            if (this.previousScene) {
                this.previousScene.pause();
            }
        } else {
            if (this.previousScene) {
                this.previousScene.stop();
            }
            scene.start();
        }
    }
    
    update(deltaTime) {
        if (this.transitioning) {
            this.transitionTime += deltaTime;
            
            if (this.transitionTime >= this.transitionDuration) {
                this.transitioning = false;
                
                if (this.previousScene) {
                    this.previousScene.stop();
                }
                this.currentScene.start();
                
                if (this.transitionCallback) {
                    this.transitionCallback();
                    this.transitionCallback = null;
                }
            }
        }
        
        if (this.currentScene) {
            this.currentScene.update(deltaTime);
        }
    }
    
    render(ctx) {
        if (!this.currentScene) return;
        
        if (this.transitioning && this.previousScene) {
            // Render transition
            const progress = this.transitionTime / this.transitionDuration;
            
            // Fade out previous scene
            ctx.save();
            ctx.globalAlpha = 1 - progress;
            this.previousScene.render(ctx);
            ctx.restore();
            
            // Fade in current scene
            ctx.save();
            ctx.globalAlpha = progress;
            this.currentScene.render(ctx);
            ctx.restore();
        } else {
            this.currentScene.render(ctx);
        }
    }
}

// ============ GAME OBJECT SYSTEM ==============
class GameObject {
    constructor(x = 0, y = 0) {
        this.id = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.position = new Vector2(x, y);
        this.rotation = 0;
        this.scale = new Vector2(1, 1);
        this.active = true;
        this.visible = true;
        this.zIndex = 0;
        this.components = new Map();
        this.tags = new Set();
        this.scene = null;
    }
    
    addComponent(component) {
        component.gameObject = this;
        this.components.set(component.constructor.name, component);
        if (this.scene && this.scene.active && component.start) {
            component.start();
        }
        return component;
    }
    
    getComponent(type) {
        return this.components.get(type.name);
    }
    
    hasComponent(type) {
        return this.components.has(type.name);
    }
    
    removeComponent(type) {
        const component = this.components.get(type.name);
        if (component) {
            if (component.destroy) component.destroy();
            component.gameObject = null;
            this.components.delete(type.name);
        }
    }
    
    addTag(tag) {
        this.tags.add(tag);
    }
    
    hasTag(tag) {
        return this.tags.has(tag);
    }
    
    removeTag(tag) {
        this.tags.delete(tag);
    }
    
    start() {
        this.components.forEach(component => {
            if (component.start) component.start();
        });
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.components.forEach(component => {
            if (component.update) component.update(deltaTime);
        });
    }
    
    render(ctx) {
        if (!this.visible) return;
        
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale.x, this.scale.y);
        
        this.components.forEach(component => {
            if (component.render) component.render(ctx);
        });
        
        ctx.restore();
    }
    
    destroy() {
        this.components.forEach(component => {
            if (component.destroy) component.destroy();
        });
        this.components.clear();
    }
}

// ============ COMPONENTS ==============
class SpriteComponent {
    constructor(imageSrc, width = 32, height = 32) {
        this.gameObject = null;
        this.image = new Image();
        this.image.src = imageSrc;
        this.width = width;
        this.height = height;
        this.opacity = 1;
        this.tint = null;
        this.flipX = false;
        this.flipY = false;
        this.offset = new Vector2(0, 0);
        this.loaded = false;
        
        this.image.onload = () => {
            this.loaded = true;
        };
    }
    
    render(ctx) {
        if (!this.loaded || !this.gameObject.active) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        if (this.tint) {
            ctx.fillStyle = this.tint;
            ctx.fillRect(-this.width / 2 + this.offset.x, -this.height / 2 + this.offset.y, this.width, this.height);
            ctx.globalCompositeOperation = 'multiply';
        }
        
        // Apply flipping
        let scaleX = this.flipX ? -1 : 1;
        let scaleY = this.flipY ? -1 : 1;
        
        if (this.flipX || this.flipY) {
            ctx.scale(scaleX, scaleY);
        }
        
        const drawX = this.flipX ? -this.offset.x - this.width : this.offset.x - this.width / 2;
        const drawY = this.flipY ? -this.offset.y - this.height : this.offset.y - this.height / 2;
        
        ctx.drawImage(this.image, drawX, drawY, this.width, this.height);
        ctx.restore();
    }
}

class AnimatorComponent {
    constructor(spriteSheet, frameWidth, frameHeight) {
        this.gameObject = null;
        this.spriteSheet = spriteSheet;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.animations = new Map();
        this.currentAnimation = null;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.playing = false;
        this.loop = true;
        this.speed = 1;
        this.flipX = false;
        this.flipY = false;
    }
    
    addAnimation(name, frames, frameRate = 12) {
        this.animations.set(name, {
            frames: Array.isArray(frames) ? frames : [frames],
            frameRate: frameRate,
            duration: frames.length / frameRate
        });
    }
    
    play(name, loop = true, restart = false) {
        if (!restart && this.currentAnimation === name) return;
        
        const animation = this.animations.get(name);
        if (!animation) {
            console.warn(`Animation ${name} not found`);
            return;
        }
        
        this.currentAnimation = name;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.playing = true;
        this.loop = loop;
    }
    
    stop() {
        this.playing = false;
        this.currentFrame = 0;
    }
    
    update(deltaTime) {
        if (!this.playing || !this.currentAnimation) return;
        
        const animation = this.animations.get(this.currentAnimation);
        this.frameTimer += deltaTime * this.speed;
        
        if (this.frameTimer >= 1 / animation.frameRate) {
            this.currentFrame++;
            this.frameTimer = 0;
            
            if (this.currentFrame >= animation.frames.length) {
                if (this.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = animation.frames.length - 1;
                    this.playing = false;
                    if (this.gameObject && this.gameObject.onAnimationComplete) {
                        this.gameObject.onAnimationComplete(this.currentAnimation);
                    }
                }
            }
        }
    }
    
    render(ctx) {
        if (!this.currentAnimation || !this.spriteSheet.complete) return;
        
        const animation = this.animations.get(this.currentAnimation);
        const frame = animation.frames[this.currentFrame];
        
        // Calculate source rectangle
        const framesPerRow = Math.floor(this.spriteSheet.width / this.frameWidth);
        const sx = (frame % framesPerRow) * this.frameWidth;
        const sy = Math.floor(frame / framesPerRow) * this.frameHeight;
        
        ctx.save();
        
        if (this.flipX || this.flipY) {
            ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
        }
        
        const drawX = this.flipX ? -this.frameWidth / 2 : -this.frameWidth / 2;
        const drawY = this.flipY ? -this.frameHeight / 2 : -this.frameHeight / 2;
        
        ctx.drawImage(
            this.spriteSheet,
            sx, sy, this.frameWidth, this.frameHeight,
            drawX, drawY, this.frameWidth, this.frameHeight
        );
        
        ctx.restore();
    }
}

class ColliderComponent {
    constructor(shape = 'circle', radius = 16, halfWidth = 16, halfHeight = 16) {
        this.gameObject = null;
        this.shape = shape;
        this.radius = radius;
        this.halfWidth = halfWidth;
        this.halfHeight = halfHeight;
        this.position = new Vector2(0, 0);
        this.enabled = true;
        this.isTrigger = false;
        this.layer = 'default';
        this.body = null;
        this.onCollision = null;
        this.onTriggerEnter = null;
        this.onTriggerExit = null;
    }
    
    start() {
        if (this.gameObject) {
            this.position = this.gameObject.position.clone();
        }
        
        // Create physics body
        this.body = {
            type: 'dynamic',
            mass: 1,
            inverseMass: 1,
            velocity: new Vector2(0, 0),
            restitution: 0.2,
            useGravity: true
        };
    }
    
    update(deltaTime) {
        if (this.gameObject && this.body && this.body.type === 'dynamic') {
            this.gameObject.position = this.gameObject.position.add(this.body.velocity.multiply(deltaTime));
        }
        
        if (this.gameObject) {
            this.position = this.gameObject.position.clone();
        }
    }
    
    getBounds() {
        if (this.shape === 'circle') {
            return {
                x: this.position.x - this.radius,
                y: this.position.y - this.radius,
                width: this.radius * 2,
                height: this.radius * 2
            };
        } else {
            return {
                x: this.position.x - this.halfWidth,
                y: this.position.y - this.halfHeight,
                width: this.halfWidth * 2,
                height: this.halfHeight * 2
            };
        }
    }
}

class CameraComponent {
    constructor() {
        this.gameObject = null;
        this.position = new Vector2(0, 0);
        this.zoom = 1;
        this.rotation = 0;
        this.bounds = null;
        this.followTarget = null;
        this.followSpeed = 5;
        this.shakeAmount = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
    }
    
    start() {
        if (this.gameObject) {
            this.position = this.gameObject.position.clone();
        }
    }
    
    update(deltaTime) {
        // Follow target
        if (this.followTarget) {
            const targetPos = this.followTarget.position || this.followTarget;
            const desiredPosition = targetPos.clone();
            
            // Apply bounds
            if (this.bounds) {
                desiredPosition.x = MathUtils.clamp(desiredPosition.x, 
                    this.bounds.x + this.getViewportWidth() / 2,
                    this.bounds.x + this.bounds.width - this.getViewportWidth() / 2);
                desiredPosition.y = MathUtils.clamp(desiredPosition.y,
                    this.bounds.y + this.getViewportHeight() / 2,
                    this.bounds.y + this.bounds.height - this.getViewportHeight() / 2);
            }
            
            // Smooth follow
            this.position.x = MathUtils.lerp(this.position.x, desiredPosition.x, this.followSpeed * deltaTime);
            this.position.y = MathUtils.lerp(this.position.y, desiredPosition.y, this.followSpeed * deltaTime);
        }
        
        // Update camera shake
        if (this.shakeDuration > 0) {
            this.shakeTimer += deltaTime;
            if (this.shakeTimer >= this.shakeDuration) {
                this.shakeAmount = 0;
                this.shakeDuration = 0;
                this.shakeTimer = 0;
            }
        }
        
        if (this.gameObject) {
            this.gameObject.position = this.position.clone();
        }
    }
    
    apply(ctx, canvasWidth, canvasHeight) {
        ctx.save();
        
        // Center on camera position
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.rotate(this.rotation);
        ctx.translate(-this.position.x, -this.position.y);
        
        // Apply shake
        if (this.shakeAmount > 0) {
            const shakeX = (Math.random() - 0.5) * this.shakeAmount * 2;
            const shakeY = (Math.random() - 0.5) * this.shakeAmount * 2;
            ctx.translate(shakeX, shakeY);
        }
    }
    
    restore(ctx) {
        ctx.restore();
    }
    
    screenToWorld(screenX, screenY, canvasWidth, canvasHeight) {
        // Convert screen coordinates to world coordinates
        const x = (screenX - canvasWidth / 2) / this.zoom + this.position.x;
        const y = (screenY - canvasHeight / 2) / this.zoom + this.position.y;
        return new Vector2(x, y);
    }
    
    worldToScreen(worldX, worldY, canvasWidth, canvasHeight) {
        // Convert world coordinates to screen coordinates
        const x = (worldX - this.position.x) * this.zoom + canvasWidth / 2;
        const y = (worldY - this.position.y) * this.zoom + canvasHeight / 2;
        return new Vector2(x, y);
    }
    
    getViewportWidth(canvasWidth) {
        return canvasWidth / this.zoom;
    }
    
    getViewportHeight(canvasHeight) {
        return canvasHeight / this.zoom;
    }
    
    shake(amount, duration) {
        this.shakeAmount = amount;
        this.shakeDuration = duration;
        this.shakeTimer = 0;
    }
    
    zoomTo(targetZoom, duration = 1) {
        // Could implement smooth zoom interpolation
        this.zoom = targetZoom;
    }
}

// ============ GAME ENGINE ==============
class AmazingGameEngine {
    constructor(config = {}) {
        this.config = {
            canvasId: 'gameCanvas',
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: '#000011',
            maxFPS: 144,
            pixelated: false,
            debug: false,
            ...config
        };
        
        // Core systems
        this.canvas = null;
        this.ctx = null;
        this.input = null;
        this.audio = null;
        this.physics = null;
        this.particles = null;
        this.lighting = null;
        this.ui = null;
        this.sceneManager = null;
        
        // Game state
        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.accumulatedTime = 0;
        this.fixedDeltaTime = 1 / 60; // 60 FPS for physics
        
        // Camera
        this.mainCamera = null;
        
        this.init();
    }
    
    init() {
        // Create or get canvas
        this.canvas = document.getElementById(this.config.canvasId) || this.createCanvas();
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        
        // Set pixelated rendering if requested
        if (this.config.pixelated) {
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.webkitImageSmoothingEnabled = false;
            this.ctx.mozImageSmoothingEnabled = false;
        }
        
        // Initialize systems
        this.input = new InputSystem();
        this.audio = new AudioSystem();
        this.physics = new PhysicsSystem();
        this.particles = new ParticleSystem();
        this.lighting = new LightingSystem();
        this.ui = new UISystem();
        this.sceneManager = new SceneManager();
        
        // Setup canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Create main camera
        this.mainCamera = new CameraComponent();
        
        // Start the game
        this.start();
    }
    
    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = this.config.canvasId;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '1';
        document.body.appendChild(canvas);
        return canvas;
    }
    
    resizeCanvas() {
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;
        this.lighting.resize(this.canvas.width, this.canvas.height);
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        
        const gameLoop = (currentTime) => {
            if (!this.isRunning) return;
            
            // Calculate delta time
            this.deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            
            // Cap delta time for stability
            this.deltaTime = Math.min(this.deltaTime, 0.1);
            
            // Update FPS counter
            this.updateFPS(currentTime);
            
            // Update input system
            this.input.update();
            
            // Clear canvas
            this.ctx.fillStyle = this.config.backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Apply camera transform
            if (this.mainCamera) {
                this.mainCamera.apply(this.ctx, this.canvas.width, this.canvas.height);
            }
            
            // Fixed timestep for physics
            this.accumulatedTime += this.deltaTime;
            while (this.accumulatedTime >= this.fixedDeltaTime) {
                this.physics.update(this.fixedDeltaTime);
                this.accumulatedTime -= this.fixedDeltaTime;
            }
            
            // Update game systems
            this.particles.update(this.deltaTime);
            this.lighting.update(this.deltaTime);
            this.sceneManager.update(this.deltaTime);
            
            // Render game objects
            this.sceneManager.render(this.ctx);
            
            // Render particles
            this.particles.render(this.ctx);
            
            // Restore camera transform
            if (this.mainCamera) {
                this.mainCamera.restore(this.ctx);
            }
            
            // Render lighting
            const gameObjects = this.getAllGameObjects();
            this.lighting.render(this.ctx, gameObjects);
            
            // Render UI
            this.ui.update(this.input, this.deltaTime);
            this.ui.render(this.ctx);
            
            // Debug rendering
            if (this.config.debug) {
                this.renderDebugInfo();
                if (this.mainCamera) {
                    this.mainCamera.apply(this.ctx, this.canvas.width, this.canvas.height);
                    this.physics.drawDebug(this.ctx);
                    this.mainCamera.restore(this.ctx);
                }
            }
            
            // Request next frame
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    updateFPS(currentTime) {
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
    }
    
    renderDebugInfo() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(5, 5, 200, 120);
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        const scene = this.sceneManager.currentScene;
        const objectCount = scene ? scene.gameObjects.size : 0;
        
        this.ctx.fillText(`FPS: ${this.fps}`, 10, 10);
        this.ctx.fillText(`Delta: ${this.deltaTime.toFixed(4)}`, 10, 25);
        this.ctx.fillText(`Objects: ${objectCount}`, 10, 40);
        this.ctx.fillText(`Particles: ${this.particles.particles.length}`, 10, 55);
        this.ctx.fillText(`Lights: ${this.lighting.lights.size}`, 10, 70);
        this.ctx.fillText(`Scene: ${scene ? scene.name : 'None'}`, 10, 85);
        this.ctx.fillText(`Input: ${this.input.keys.size} keys`, 10, 100);
        
        // Memory usage (approximate)
        if (performance.memory) {
            const usedMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
            const totalMB = Math.round(performance.memory.totalJSHeapSize / 1048576);
            this.ctx.fillText(`Memory: ${usedMB}MB / ${totalMB}MB`, 10, 115);
        }
        
        this.ctx.restore();
    }
    
    getAllGameObjects() {
        const scene = this.sceneManager.currentScene;
        if (!scene) return [];
        
        return Array.from(scene.gameObjects);
    }
    
    createGameObject(x = 0, y = 0) {
        const obj = new GameObject(x, y);
        const scene = this.sceneManager.currentScene;
        if (scene) {
            scene.addGameObject(obj);
            obj.scene = scene;
        }
        return obj;
    }
    
    findGameObjectsByTag(tag) {
        const scene = this.sceneManager.currentScene;
        if (!scene) return [];
        
        return Array.from(scene.gameObjects).filter(obj => obj.hasTag(tag));
    }
    
    findGameObjectById(id) {
        const scene = this.sceneManager.currentScene;
        if (!scene) return null;
        
        return Array.from(scene.gameObjects).find(obj => obj.id === id);
    }
    
    loadScene(name, transitionDuration = 0) {
        this.sceneManager.loadScene(name, transitionDuration);
    }
    
    setCamera(camera) {
        this.mainCamera = camera;
    }
    
    getCamera() {
        return this.mainCamera;
    }
    
    screenToWorld(screenX, screenY) {
        if (!this.mainCamera) return new Vector2(screenX, screenY);
        return this.mainCamera.screenToWorld(screenX, screenY, this.canvas.width, this.canvas.height);
    }
    
    worldToScreen(worldX, worldY) {
        if (!this.mainCamera) return new Vector2(worldX, worldY);
        return this.mainCamera.worldToScreen(worldX, worldY, this.canvas.width, this.canvas.height);
    }
    
    stop() {
        this.isRunning = false;
    }
    
    // Utility methods
    loadImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (error) => {
                console.error(`Failed to load image ${url}:`, error);
                const fallback = document.createElement('canvas');
                fallback.width = 1;
                fallback.height = 1;
                resolve(fallback);
            };
            img.src = url;
        });
    }
    
    loadJSON(url) {
        return fetch(url).then(response => response.json());
    }
    
    createCollider(shape, ...args) {
        const collider = new ColliderComponent(shape, ...args);
        this.physics.addCollider(collider);
        return collider;
    }
    
    raycast(start, end, layer = 'default') {
        return this.physics.raycast(start, end, layer);
    }
    
    emitParticles(x, y, count, config) {
        this.particles.emitBurst(x, y, count, config);
    }
    
    createLight(x, y, radius) {
        const light = new Light(x, y, radius);
        this.lighting.addLight(light);
        return light;
    }
    
    createUIElement(type, ...args) {
        let element;
        switch (type) {
            case 'button':
                element = new Button(...args);
                break;
            case 'label':
                element = new Label(...args);
                break;
            case 'panel':
                element = new Panel(...args);
                break;
            default:
                element = new UIElement(...args);
        }
        this.ui.addElement(element);
        return element;
    }
}

// ============ GAME TEMPLATE ==============
class AmazingGameTemplate {
    constructor() {
        this.engine = null;
        this.player = null;
        this.score = 0;
        this.isGameOver = false;
    }
    
    async init() {
        // Create game engine
        this.engine = new AmazingGameEngine({
            canvasId: 'gameCanvas',
            width: 1280,
            height: 720,
            backgroundColor: '#111133',
            debug: false
        });
        
        // Create main menu scene
        const mainMenu = new Scene('MainMenu');
        this.setupMainMenu(mainMenu);
        this.engine.sceneManager.addScene(mainMenu);
        
        // Create game scene
        const gameScene = new Scene('Game');
        this.setupGameScene(gameScene);
        this.engine.sceneManager.addScene(gameScene);
        
        // Create game over scene
        const gameOverScene = new Scene('GameOver');
        this.setupGameOverScene(gameOverScene);
        this.engine.sceneManager.addScene(gameOverScene);
        
        // Load assets
        await this.loadAssets();
        
        // Start with main menu
        this.engine.loadScene('MainMenu');
    }
    
    async loadAssets() {
        // Load images
        const playerImage = await this.engine.loadImage('assets/player.png');
        const enemyImage = await this.engine.loadImage('assets/enemy.png');
        const bulletImage = await this.engine.loadImage('assets/bullet.png');
        const backgroundImage = await this.engine.loadImage('assets/background.png');
        
        // Load sounds
        await this.engine.audio.loadSound('shoot', 'assets/shoot.wav');
        await this.engine.audio.loadSound('explosion', 'assets/explosion.wav');
        await this.engine.audio.loadSound('music', 'assets/music.mp3');
        
        // Store assets
        this.assets = {
            playerImage,
            enemyImage,
            bulletImage,
            backgroundImage
        };
    }
    
    setupMainMenu(scene) {
        // Background
        const background = this.engine.createGameObject(0, 0);
        background.addComponent(new SpriteComponent('assets/background.png', 1280, 720));
        
        // Title
        const title = this.engine.createGameObject(640, 200);
        const titleText = new Label(0, 0, 'AMAZING GAME', 48);
        titleText.style.color = '#ffcc00';
        titleText.style.textAlign = 'center';
        scene.addGameObject(title);
        
        // Start button
        const startButton = this.engine.createGameObject(640, 360);
        const buttonUI = this.engine.createUIElement('button', 0, 0, 200, 60, 'START GAME');
        buttonUI.style.backgroundColor = '#4a4a4a';
        buttonUI.style.color = '#ffffff';
        buttonUI.style.fontSize = 24;
        buttonUI.style.borderRadius = 10;
        buttonUI.position.x = -100; // Center relative to parent
        
        buttonUI.on('click', () => {
            this.engine.audio.playSound('shoot', { volume: 0.5 });
            this.engine.loadScene('Game', 1.0);
        });
        
        scene.addGameObject(startButton);
    }
    
    setupGameScene(scene) {
        // Background
        const background = this.engine.createGameObject(640, 360);
        background.addComponent(new SpriteComponent('assets/background.png', 1280, 720));
        background.zIndex = -100;
        
        // Player
        this.player = this.engine.createGameObject(640, 360);
        const playerSprite = new SpriteComponent('assets/player.png', 64, 64);
        this.player.addComponent(playerSprite);
        
        const playerCollider = new ColliderComponent('circle', 24);
        playerCollider.layer = 'player';
        playerCollider.onCollision = (other, collision) => {
            if (other.gameObject && other.gameObject.hasTag('enemy')) {
                this.gameOver();
            }
        };
        this.player.addComponent(playerCollider);
        
        // Player controller component
        const playerController = {
            gameObject: this.player,
            speed: 300,
            shootCooldown: 0,
            shootDelay: 0.2,
            
            update: function(deltaTime) {
                // Movement
                const input = this.gameObject.engine.input;
                let moveX = 0;
                let moveY = 0;
                
                if (input.isKeyDown('ArrowLeft') || input.isKeyDown('KeyA')) moveX = -1;
                if (input.isKeyDown('ArrowRight') || input.isKeyDown('KeyD')) moveX = 1;
                if (input.isKeyDown('ArrowUp') || input.isKeyDown('KeyW')) moveY = -1;
                if (input.isKeyDown('ArrowDown') || input.isKeyDown('KeyS')) moveY = 1;
                
                if (moveX !== 0 || moveY !== 0) {
                    const direction = new Vector2(moveX, moveY).normalize();
                    this.gameObject.position = this.gameObject.position.add(direction.multiply(this.speed * deltaTime));
                }
                
                // Shooting
                this.shootCooldown -= deltaTime;
                if (input.isKeyDown('Space') && this.shootCooldown <= 0) {
                    this.shoot();
                    this.shootCooldown = this.shootDelay;
                }
                
                // Mouse shooting
                if (input.isMouseDown('left') && this.shootCooldown <= 0) {
                    this.shootAtMouse();
                    this.shootCooldown = this.shootDelay;
                }
            },
            
            shoot: function() {
                this.createBullet(0, -1);
            },
            
            shootAtMouse: function() {
                const mousePos = this.gameObject.engine.input.getMousePosition();
                const worldPos = this.gameObject.engine.screenToWorld(mousePos.x, mousePos.y);
                const direction = worldPos.subtract(this.gameObject.position).normalize();
                this.createBullet(direction.x, direction.y);
            },
            
            createBullet: function(dirX, dirY) {
                const bullet = this.gameObject.engine.createGameObject(
                    this.gameObject.position.x,
                    this.gameObject.position.y
                );
                
                bullet.addTag('bullet');
                
                const bulletSprite = new SpriteComponent('assets/bullet.png', 16, 16);
                bullet.addComponent(bulletSprite);
                
                const bulletCollider = new ColliderComponent('circle', 6);
                bulletCollider.layer = 'projectiles';
                bulletCollider.body.velocity = new Vector2(dirX * 500, dirY * 500);
                bulletCollider.onCollision = (other, collision) => {
                    if (other.gameObject && other.gameObject.hasTag('enemy')) {
                        // Destroy enemy
                        other.gameObject.scene.removeGameObject(other.gameObject);
                        // Destroy bullet
                        bullet.scene.removeGameObject(bullet);
                        // Add score
                        this.gameObject.engine.score += 100;
                        // Play sound
                        this.gameObject.engine.audio.playSound('explosion', { volume: 0.7 });
                        // Create explosion particles
                        this.gameObject.engine.emitParticles(
                            bullet.position.x, bullet.position.y, 20,
                            {
                                startSize: 10,
                                endSize: 0,
                                startColor: '#ffaa00',
                                endColor: '#ff0000',
                                minSpeed: 50,
                                maxSpeed: 200,
                                minLife: 0.5,
                                maxLife: 1.5
                            }
                        );
                    }
                };
                bullet.addComponent(bulletCollider);
                
                // Play shoot sound
                this.gameObject.engine.audio.playSound('shoot', { volume: 0.3 });
            }
        };
        
        this.player.addComponent(playerController);
        scene.addGameObject(this.player);
        
        // Score display
        const scoreDisplay = this.engine.createGameObject(100, 50);
        const scoreUI = this.engine.createUIElement('label', 0, 0, 'SCORE: 0', 24);
        scoreUI.style.color = '#ffffff';
        scoreDisplay.addComponent({
            gameObject: scoreDisplay,
            update: function(deltaTime) {
                scoreUI.text = `SCORE: ${this.gameObject.engine.score}`;
            }
        });
        scene.addGameObject(scoreDisplay);
        
        // Enemy spawner
        const spawner = this.engine.createGameObject(0, 0);
        spawner.addComponent({
            gameObject: spawner,
            spawnTimer: 0,
            spawnDelay: 1.0,
            
            update: function(deltaTime) {
                this.spawnTimer -= deltaTime;
                if (this.spawnTimer <= 0) {
                    this.spawnEnemy();
                    this.spawnTimer = this.spawnDelay;
                    
                    // Increase difficulty
                    this.spawnDelay = Math.max(0.3, this.spawnDelay * 0.99);
                }
            },
            
            spawnEnemy: function() {
                const side = Math.floor(Math.random() * 4);
                let x, y;
                
                switch (side) {
                    case 0: // Top
                        x = Math.random() * 1280;
                        y = -50;
                        break;
                    case 1: // Right
                        x = 1330;
                        y = Math.random() * 720;
                        break;
                    case 2: // Bottom
                        x = Math.random() * 1280;
                        y = 770;
                        break;
                    case 3: // Left
                        x = -50;
                        y = Math.random() * 720;
                        break;
                }
                
                const enemy = this.gameObject.engine.createGameObject(x, y);
                enemy.addTag('enemy');
                
                const enemySprite = new SpriteComponent('assets/enemy.png', 48, 48);
                enemy.addComponent(enemySprite);
                
                const enemyCollider = new ColliderComponent('circle', 20);
                enemyCollider.layer = 'enemies';
                enemy.addComponent(enemyCollider);
                
                // AI component
                enemy.addComponent({
                    gameObject: enemy,
                    speed: 100,
                    
                    start: function() {
                        // Find player
                        const player = this.gameObject.engine.player;
                        if (player) {
                            const direction = player.position.subtract(this.gameObject.position).normalize();
                            this.gameObject.collider.body.velocity = direction.multiply(this.speed);
                        }
                    },
                    
                    update: function(deltaTime) {
                        // Wrap around screen
                        if (this.gameObject.position.x < -100) this.gameObject.position.x = 1380;
                        if (this.gameObject.position.x > 1380) this.gameObject.position.x = -100;
                        if (this.gameObject.position.y < -100) this.gameObject.position.y = 820;
                        if (this.gameObject.position.y > 820) this.gameObject.position.y = -100;
                    }
                });
                
                scene.addGameObject(enemy);
            }
        });
        scene.addGameObject(spawner);
        
        // Background music
        this.engine.audio.playMusic('music', true);
    }
    
    setupGameOverScene(scene) {
        // Background
        const background = this.engine.createGameObject(640, 360);
        background.addComponent(new SpriteComponent('assets/background.png', 1280, 720));
        
        // Game Over text
        const gameOverText = this.engine.createGameObject(640, 200);
        const text = new Label(0, 0, 'GAME OVER', 64);
        text.style.color = '#ff0000';
        text.style.textAlign = 'center';
        gameOverText.addComponent(text);
        scene.addGameObject(gameOverText);
        
        // Final score
        const scoreText = this.engine.createGameObject(640, 300);
        const scoreLabel = new Label(0, 0, `FINAL SCORE: ${this.score}`, 36);
        scoreLabel.style.color = '#ffffff';
        scoreLabel.style.textAlign = 'center';
        scoreText.addComponent(scoreLabel);
        scene.addGameObject(scoreText);
        
        // Retry button
        const retryButton = this.engine.createGameObject(640, 450);
        const buttonUI = this.engine.createUIElement('button', 0, 0, 200, 60, 'RETRY');
        buttonUI.style.backgroundColor = '#4a4a4a';
        buttonUI.style.color = '#ffffff';
        buttonUI.style.fontSize = 24;
        buttonUI.style.borderRadius = 10;
        buttonUI.position.x = -100;
        
        buttonUI.on('click', () => {
            this.restartGame();
        });
        
        scene.addGameObject(retryButton);
    }
    
    gameOver() {
        this.isGameOver = true;
        this.engine.audio.stopMusic();
        this.engine.audio.playSound('explosion', { volume: 1.0 });
        this.engine.loadScene('GameOver', 1.5);
    }
    
    restartGame() {
        this.score = 0;
        this.isGameOver = false;
        this.engine.loadScene('Game', 1.0);
    }
}

// ============ INITIALIZE GAME ==============
// When the page loads, create and start the game
window.addEventListener('load', () => {
    // Check for WebGL support
    if (!window.AudioContext && !window.webkitAudioContext) {
        alert('Your browser does not support Web Audio API. Please use a modern browser.');
        return;
    }
    
    // Create and start the game
    const game = new AmazingGameTemplate();
    game.init().catch(error => {
        console.error('Failed to initialize game:', error);
        document.body.innerHTML = `
            <div style="color: white; font-family: Arial; text-align: center; padding: 50px;">
                <h1>Error Loading Game</h1>
                <p>${error.message}</p>
                <p>Please check the console for more details.</p>
            </div>
        `;
    });
});

// Export classes for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AmazingGameEngine,
        GameObject,
        Vector2,
        MathUtils,
        InputSystem,
        AudioSystem,
        ParticleSystem,
        PhysicsSystem,
        LightingSystem,
        UISystem,
        Scene,
        SceneManager,
        SpriteComponent,
        AnimatorComponent,
        ColliderComponent,
        CameraComponent,
        AmazingGameTemplate
    };
}
