// games.js - Basic Game Visuals

document.addEventListener('DOMContentLoaded', function() {
  // Initialize game canvases
  initDefenseGame();
  initHoneyGame();
});

// Canvas helpers
function setupCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  // Match the backing resolution to the rendered size for crisp edges
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  return { ctx, width, height };
}

function drawRoundedRect(ctx, x, y, width, height, radius = 0) {
  // Build the path on Path2D when available for consistent fill/stroke; otherwise draw on the context
  const usePath2D = typeof Path2D !== 'undefined';
  const path = usePath2D ? new Path2D() : ctx;
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));

  if (!usePath2D) ctx.beginPath();

  if (typeof path.roundRect === 'function') {
    path.roundRect(x, y, width, height, r);
  } else {
    path.moveTo(x + r, y);
    path.lineTo(x + width - r, y);
    path.quadraticCurveTo(x + width, y, x + width, y + r);
    path.lineTo(x + width, y + height - r);
    path.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    path.lineTo(x + r, y + height);
    path.quadraticCurveTo(x, y + height, x, y + height - r);
    path.lineTo(x, y + r);
    path.quadraticCurveTo(x, y, x + r, y);
  }

  if (usePath2D) {
    path.closePath();
    return path;
  }

  ctx.closePath();
  return null;
}

// Tower Defense Game Visuals
function initDefenseGame() {
  const canvas = document.getElementById('defense-game');
  if (!canvas) return;

  const { ctx, width, height } = setupCanvas(canvas);

  let animationFrame;
  const beeOffsets = [0, 0.16, 0.32];

  const fieldGradient = ctx.createLinearGradient(0, 0, 0, height);
  fieldGradient.addColorStop(0, '#d5e8b5');
  fieldGradient.addColorStop(1, '#b2d18b');

  // Draw honey path
  function drawHoneyPath(time) {
    ctx.save();

    const pathTop = 150;
    const pathHeight = 100;
    const honeyFill = ctx.createLinearGradient(50, pathTop, width - 50, pathTop + pathHeight);
    honeyFill.addColorStop(0, '#ffefc6');
    honeyFill.addColorStop(1, '#ffd56b');

    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 4;
    ctx.fillStyle = honeyFill;

    const honeyPath = drawRoundedRect(ctx, 50, pathTop, width - 100, pathHeight, 22);
    if (honeyPath) {
      ctx.fill(honeyPath);
      ctx.stroke(honeyPath);
    } else {
      ctx.fill();
      ctx.stroke();
    }

    // Honey shimmer stripes
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 12;
    ctx.setLineDash([30, 30]);
    ctx.lineCap = 'round';
    const stripePath = drawRoundedRect(ctx, 60, pathTop + 12, width - 120, pathHeight - 24, 18);
    if (stripePath) {
      ctx.stroke(stripePath);
    } else {
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Honey droplets
    for (let i = 0; i < 8; i++) {
      const wobble = Math.sin((time / 600) + i) * 6;
      const x = 80 + i * ((width - 160) / 7);
      const y = 200 + wobble;

      ctx.fillStyle = '#FFC42B';
      ctx.beginPath();
      ctx.ellipse(x, y, 15, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFAA00';
      ctx.beginPath();
      ctx.ellipse(x, y, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Start and end points
    ctx.fillStyle = '#2F4F2F';
    ctx.beginPath();
    ctx.arc(50, 200, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(width - 50, 200, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('START', 35, 180);
    ctx.fillText('HIVE', width - 65, 180);
    
    ctx.restore();
  }
  
  // Draw sample towers
  function drawTowers() {
    const towers = [
      { x: 100, y: 80, type: 'pooh' },
      { x: 200, y: 280, type: 'tigger' },
      { x: 350, y: 100, type: 'rabbit' }
    ];
    
    towers.forEach(tower => {
      // Tower base
      ctx.fillStyle = '#A0522D';
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 25, 0, Math.PI * 2);
      ctx.fill();
      
      // Tower platform
      ctx.fillStyle = '#D2691E';
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Character
      const emojis = {
        pooh: '🐻',
        tigger: '🐯',
        rabbit: '🐰'
      };
      
      ctx.font = '30px Arial';
      ctx.fillText(emojis[tower.type] || '❓', tower.x - 15, tower.y + 10);
      
      // Range indicator (hidden by default, shown on hover)
      ctx.strokeStyle = 'rgba(255, 196, 43, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }
  
  // Draw bees
  function drawBees(time) {
    beesLoop(time, (x, y, isBoss) => {
      if (isBoss) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('👑', x - 10, y + 8);
      } else {
        ctx.fillStyle = '#FFC42B';
        ctx.beginPath();
        ctx.ellipse(x, y, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.fillText('🐝', x - 10, y + 8);
      }
    });
  }

  function beesLoop(time, drawFn) {
    const pathLength = width - 100;
    const baseY = 200;
    const speed = 0.04;

    beeOffsets.forEach((offset, index) => {
      const t = (offset + (time * speed) / 1000) % 1;
      const x = 50 + pathLength * t;
      const sway = Math.sin((time / 300) + index) * 12;
      const y = baseY + sway;
      const isBoss = index === beeOffsets.length - 1;
      drawFn(x, y, isBoss);
    });
  }
  
  // Draw projectiles
  function drawProjectiles(time) {
    const pulses = [
      { x: 100, y: 80, targetX: 70, targetY: 200, phase: 0 },
      { x: 200, y: 280, targetX: 120, targetY: 200, phase: Math.PI }
    ];

    pulses.forEach(proj => {
      const headOffset = (Math.sin(time / 200 + proj.phase) + 1) / 2;
      const headX = proj.x + (proj.targetX - proj.x) * headOffset;
      const headY = proj.y + (proj.targetY - proj.y) * headOffset;

      ctx.strokeStyle = '#FF8C00';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(proj.x, proj.y);
      ctx.lineTo(headX, headY);
      ctx.stroke();

      ctx.fillStyle = '#FF4500';
      ctx.beginPath();
      ctx.arc(headX, headY, 8, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  // Draw game elements
  function drawDefenseGame(time = 0) {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = fieldGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw all elements
    drawHoneyPath(time);
    drawTowers();
    drawBees(time);
    drawProjectiles(time);

    // Draw UI elements
    ctx.fillStyle = '#8B4513';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Tower Defense Demo', width / 2 - 100, 40);
    
    ctx.fillStyle = '#5D4037';
    ctx.font = '16px Arial';
    ctx.fillText('Place towers along the path to defend the hive!', width / 2 - 150, 70);
  }

  // Initial draw
  function loop(time) {
    drawDefenseGame(time);
    animationFrame = requestAnimationFrame(loop);
  }

  loop(0);

  // Clean up on page unload
  window.addEventListener('beforeunload', () => cancelAnimationFrame(animationFrame));
}

// Honey Catch Game Visuals
function initHoneyGame() {
  const canvas = document.getElementById('honey-game');
  if (!canvas) return;

  const { ctx, width, height } = setupCanvas(canvas);

  // Draw Pooh character
  function drawPooh(x, y) {
    // Body
    ctx.fillStyle = '#FFC42B';
    ctx.beginPath();
    ctx.ellipse(x, y, 30, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Tummy
    ctx.fillStyle = '#FFE4B5';
    ctx.beginPath();
    ctx.ellipse(x, y, 20, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Face
    ctx.fillStyle = '#000';
    ctx.font = '30px Arial';
    ctx.fillText('🐻', x - 15, y + 10);
  }

  // Draw honey pots
  function drawHoneyPots(time) {
    const pots = [
      { x: 100, y: 100, type: 'normal', sway: 0 },
      { x: 200, y: 150, type: 'golden', sway: Math.PI / 3 },
      { x: 300, y: 200, type: 'normal', sway: Math.PI / 1.5 },
      { x: 400, y: 80, type: 'normal', sway: Math.PI / 2 }
    ];

    pots.forEach(pot => {
      const bob = Math.sin(time / 800 + pot.sway) * 8;
      const x = pot.x;
      const y = pot.y + bob;

      if (pot.type === 'golden') {
        // Golden pot
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(x, y, 20, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#B8860B';
        ctx.beginPath();
        ctx.ellipse(x, y, 15, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFD700';
        ctx.font = '20px Arial';
        ctx.fillText('🌟', x - 10, y + 8);
      } else {
        // Normal honey pot
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(x, y, 15, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFC42B';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#8B4513';
        ctx.font = '20px Arial';
        ctx.fillText('🍯', x - 10, y + 8);
      }
    });
  }
  
  // Draw rocks
  function drawRocks() {
    const rocks = [
      { x: 150, y: 250 },
      { x: 350, y: 180 },
      { x: 450, y: 300 }
    ];
    
    rocks.forEach(rock => {
      ctx.fillStyle = '#8B8680';
      ctx.beginPath();
      ctx.arc(rock.x, rock.y, 15, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#696969';
      ctx.beginPath();
      ctx.arc(rock.x - 5, rock.y - 5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rock.x + 5, rock.y + 5, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000';
      ctx.font = '20px Arial';
      ctx.fillText('🪨', rock.x - 10, rock.y + 8);
    });
  }
  
  // Draw particle effects
  function drawParticles(time) {
    const particles = [
      { x: 50, y: 50 },
      { x: 150, y: 50 },
      { x: 250, y: 50 },
      { x: 350, y: 50 }
    ];

    particles.forEach(particle => {
      const twinkle = 0.3 + Math.abs(Math.sin(time / 500 + particle.x * 0.1)) * 0.3;
      ctx.fillStyle = `rgba(255, 196, 43, ${twinkle})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 4 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Draw falling objects
  function drawFallingObjects(time) {
    const dripY = 300 + Math.sin(time / 500) * 20;

    // Falling honey drip
    ctx.fillStyle = 'rgba(255, 196, 43, 0.7)';
    ctx.beginPath();
    ctx.ellipse(250, dripY, 3, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Splash effect
    ctx.fillStyle = 'rgba(255, 196, 43, 0.3)';
    ctx.beginPath();
    ctx.arc(250, dripY + 10, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw game elements
  function drawHoneyGame(time = 0) {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = '#AED9E0';
    ctx.fillRect(0, 0, width, height);
    
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#AED9E0');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Cloud
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(100, 80, 20, 0, Math.PI * 2);
    ctx.arc(130, 70, 25, 0, Math.PI * 2);
    ctx.arc(160, 80, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw all elements
    drawPooh(width / 2, height - 60); // Pooh at bottom
    drawHoneyPots(time);
    drawRocks();
    drawParticles(time);
    drawFallingObjects(time);
    
    // Draw UI elements
    ctx.fillStyle = '#8B4513';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Honey Catch Demo', width / 2 - 100, 40);
    
    ctx.fillStyle = '#5D4037';
    ctx.font = '16px Arial';
    ctx.fillText('Catch honey pots, avoid rocks!', width / 2 - 110, 70);
    
    // Score display
    ctx.fillStyle = '#2F4F2F';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('Score: 1250', width - 150, 40);
    
    // Timer
    ctx.fillStyle = '#D42E22';
    ctx.fillText('Time: 45s', width - 150, 70);
  }
  
  let animationFrame;

  function loop(time) {
    drawHoneyGame(time);
    animationFrame = requestAnimationFrame(loop);
  }

  loop(0);

  window.addEventListener('beforeunload', () => cancelAnimationFrame(animationFrame));
}

// Add to your HTML
// <script src="games.js"></script>
