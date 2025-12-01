// games.js - Basic Game Visuals

document.addEventListener('DOMContentLoaded', function() {
  // Initialize game canvases
  initDefenseGame();
  initHoneyGame();
});

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

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Draw honey path
  function drawHoneyPath() {
    ctx.save();
    
    // Path background
    // Path border
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 4;

    ctx.fillStyle = '#FFF0C2';
    const honeyPath = drawRoundedRect(ctx, 50, 150, width - 100, 100, 20);
    if (honeyPath) {
      ctx.fill(honeyPath);
      ctx.stroke(honeyPath);
    } else {
      ctx.fill();
      ctx.stroke();
    }
    
    // Honey droplets
    for (let i = 0; i < 8; i++) {
      const x = 80 + i * 50;
      const y = 200;
      
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
  function drawBees() {
    const bees = [
      { x: 70, y: 200, type: 'normal' },
      { x: 120, y: 200, type: 'normal' },
      { x: 170, y: 200, type: 'boss' }
    ];
    
    bees.forEach(bee => {
      if (bee.type === 'boss') {
        // Boss bee
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(bee.x, bee.y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('👑', bee.x - 10, bee.y + 8);
      } else {
        // Normal bee
        ctx.fillStyle = '#FFC42B';
        ctx.beginPath();
        ctx.ellipse(bee.x, bee.y, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.fillText('🐝', bee.x - 10, bee.y + 8);
      }
    });
  }
  
  // Draw projectiles
  function drawProjectiles() {
    const projectiles = [
      { x: 100, y: 80, targetX: 70, targetY: 200 },
      { x: 200, y: 280, targetX: 120, targetY: 200 }
    ];
    
    projectiles.forEach(proj => {
      // Projectile trail
      ctx.strokeStyle = '#FF8C00';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(proj.x, proj.y);
      ctx.lineTo(proj.targetX, proj.targetY);
      ctx.stroke();
      
      // Projectile head
      ctx.fillStyle = '#FF4500';
      ctx.beginPath();
      ctx.arc(proj.targetX, proj.targetY, 8, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  // Draw game elements
  function drawDefenseGame() {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = '#C1D7A7';
    ctx.fillRect(0, 0, width, height);
    
    // Draw all elements
    drawHoneyPath();
    drawTowers();
    drawBees();
    drawProjectiles();
    
    // Draw UI elements
    ctx.fillStyle = '#8B4513';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Tower Defense Demo', width / 2 - 100, 40);
    
    ctx.fillStyle = '#5D4037';
    ctx.font = '16px Arial';
    ctx.fillText('Place towers along the path to defend the hive!', width / 2 - 150, 70);
  }
  
  // Initial draw
  drawDefenseGame();
  
  // Redraw every 2 seconds to show animation
  setInterval(drawDefenseGame, 2000);
}

// Honey Catch Game Visuals
function initHoneyGame() {
  const canvas = document.getElementById('honey-game');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
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
  function drawHoneyPots() {
    const pots = [
      { x: 100, y: 100, type: 'normal' },
      { x: 200, y: 150, type: 'golden' },
      { x: 300, y: 200, type: 'normal' },
      { x: 400, y: 80, type: 'normal' }
    ];
    
    pots.forEach(pot => {
      if (pot.type === 'golden') {
        // Golden pot
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(pot.x, pot.y, 20, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#B8860B';
        ctx.beginPath();
        ctx.ellipse(pot.x, pot.y, 15, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = '20px Arial';
        ctx.fillText('🌟', pot.x - 10, pot.y + 8);
      } else {
        // Normal honey pot
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(pot.x, pot.y, 15, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFC42B';
        ctx.beginPath();
        ctx.arc(pot.x, pot.y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#8B4513';
        ctx.font = '20px Arial';
        ctx.fillText('🍯', pot.x - 10, pot.y + 8);
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
  function drawParticles() {
    const particles = [
      { x: 50, y: 50 },
      { x: 150, y: 50 },
      { x: 250, y: 50 },
      { x: 350, y: 50 }
    ];
    
    particles.forEach(particle => {
      ctx.fillStyle = `rgba(255, 196, 43, ${0.3 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 4 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  // Draw falling objects
  function drawFallingObjects() {
    // Falling honey drip
    ctx.fillStyle = 'rgba(255, 196, 43, 0.7)';
    ctx.beginPath();
    ctx.ellipse(250, 350, 3, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Splash effect
    ctx.fillStyle = 'rgba(255, 196, 43, 0.3)';
    ctx.beginPath();
    ctx.arc(250, 360, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw game elements
  function drawHoneyGame() {
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
    drawHoneyPots();
    drawRocks();
    drawParticles();
    drawFallingObjects();
    
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
  
  // Initial draw
  drawHoneyGame();
  
  // Animate falling objects
  let fallOffset = 0;
  setInterval(() => {
    fallOffset += 5;
    if (fallOffset > 100) fallOffset = 0;
    
    // Redraw with updated positions
    drawHoneyGame();
    
    // Update some falling objects
    const rocks = document.querySelectorAll('.rock');
    rocks.forEach(rock => {
      // This would be updated in a real game
    });
  }, 100);
}

// Add to your HTML
// <script src="games.js"></script>
