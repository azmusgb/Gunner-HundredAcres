// Add missing variable
let poohSpriteReady = false;
let poohSprite = null;

// Add missing function
function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
  gradient.addColorStop(0, '#A3D5FF');
  gradient.addColorStop(0.3, '#C1E3FF');
  gradient.addColorStop(0.6, '#D8F0FF');
  gradient.addColorStop(1, '#E6F7FF');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);
}

// Add missing function that was referenced but not defined
function createSpecialEffect(combo) {
  if (!canvasContainer) return;

  if (combo >= 8) {
    // Star burst effect
    for (let i = 0; i < 8; i++) {
      const star = document.createElement('div');
      star.className = 'sparkle';
      star.style.left = '50%';
      star.style.top = '50%';
      star.style.width = '12px';
      star.style.height = '12px';
      star.style.background = 'radial-gradient(circle, #FFD166, #FF9E00)';
      star.style.animation = 'sparklePop 1s ease-out forwards';
      canvasContainer.appendChild(star);

      setTimeout(() => {
        const angle = (i / 8) * Math.PI * 2;
        const distance = 100;
        star.style.left = `calc(50% + ${Math.cos(angle) * distance}px)`;
        star.style.top = `calc(50% + ${Math.sin(angle) * distance}px)`;
      }, 10);

      setTimeout(() => star.remove(), 1000);
    }
  } else if (combo >= 5) {
    // Ring effect
    const ring = document.createElement('div');
    ring.className = 'combo-ring';
    canvasContainer.appendChild(ring);
    setTimeout(() => ring.remove(), 800);
  }
}

// Add canvas resize handler
function handleResize() {
  if (!canvas || !canvasContainer) return;
  
  const containerWidth = canvasContainer.clientWidth;
  const containerHeight = canvasContainer.clientHeight;
  
  canvas.width = containerWidth;
  canvas.height = containerHeight;
  
  // Redraw if game is active
  if (state.playing && !state.paused) {
    loop();
  }
}

// Add missing initialization function
function initGame() {
  // Set initial canvas size
  handleResize();
  
  // Initialize player position
  state.player.x = canvas.width / 2 - CONFIG.GAME.PLAYER_WIDTH / 2;
  
  // Setup sprite if available
  if (typeof Image !== 'undefined') {
    poohSprite = new Image();
    poohSprite.onload = () => {
      poohSpriteReady = true;
    };
    poohSprite.onerror = () => {
      poohSpriteReady = false;
      console.log('Sprite failed to load, using default graphics');
    };
    poohSprite.src = 'pooh-sprite.png'; // This should exist or be handled
  }
  
  // Add event listeners with null checks
  window.addEventListener('resize', handleResize);
  
  // Initialize page turns
  updatePageTurns();
}

// Fix event listeners to check for element existence
function setupEventListeners() {
  // Safe event listener helper
  const safeAddListener = (element, event, handler) => {
    if (element) {
      element.addEventListener(event, handler);
    }
  };
  
  safeAddListener(promptBtn, 'click', () => {
    const next = prompts[Math.floor(Math.random() * prompts.length)];
    if (promptText) promptText.textContent = `"${next}"`;
  });
  
  safeAddListener(chimeToggle, 'click', () => {
    if (chime) {
      chime.currentTime = 0;
      chime.play().catch(e => console.log('Audio play failed:', e));
    }
  });
  
  safeAddListener(playBtn, 'click', startGame);
  safeAddListener(pauseBtn, 'click', togglePause);
  
  if (openInstructions) {
    openInstructions.addEventListener('click', showInstructions);
  }
  
  if (closeInstructions) {
    closeInstructions.addEventListener('click', () => startGame());
  }
  
  safeAddListener(leftBtn, 'pointerdown', () => {
    if (state.playing && !state.paused) movePlayer(-26);
  });
  
  safeAddListener(rightBtn, 'pointerdown', () => {
    if (state.playing && !state.paused) movePlayer(26);
  });
  
  safeAddListener(canvas, 'pointerdown', () => {
    if (!state.playing) startGame();
  });
  
  safeAddListener(playAgain, 'click', () => {
    if (gameOverOverlay) gameOverOverlay.classList.remove('is-visible');
    startGame();
  });
  
  if (closeGameOver) {
    closeGameOver.addEventListener('click', () => {
      gameOverOverlay.classList.remove('is-visible');
    });
  }
  
  // Character modal
  document.querySelectorAll('.character-card').forEach(card => {
    card.addEventListener('click', () => {
      const char = card.dataset.character;
      if (char) openCharacter(char);
    });
  });
  
  if (closeModal) {
    closeModal.addEventListener('click', closeCharacterModal);
  }
  
  if (characterModal) {
    characterModal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal__backdrop')) closeCharacterModal();
    });
  }
  
  // RSVP Banner
  if (bannerClose) {
    bannerClose.addEventListener('click', () => {
      if (rsvpBanner) rsvpBanner.classList.remove('is-visible');
    });
  }
  
  // Page navigation
  if (prevPage) {
    prevPage.addEventListener('click', () => {
      const activeIndex = pages.findIndex(page => {
        if (!page) return false;
        const rect = page.getBoundingClientRect();
        return rect.top >= 0 && rect.top < window.innerHeight;
      });
      if (activeIndex > 0 && pages[activeIndex - 1]) {
        pages[activeIndex - 1].scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
  
  if (nextPage) {
    nextPage.addEventListener('click', () => {
      const activeIndex = pages.findIndex(page => {
        if (!page) return false;
        const rect = page.getBoundingClientRect();
        return rect.top >= 0 && rect.top < window.innerHeight;
      });
      if (activeIndex < pages.length - 1 && pages[activeIndex + 1]) {
        pages[activeIndex + 1].scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

// Update DOMContentLoaded to call initialization
document.addEventListener('DOMContentLoaded', () => {
  // Add reveal class to elements
  document.querySelectorAll('.panel, .card, .experience, .detail, .character-card').forEach(el => {
    if (el) el.classList.add('reveal');
  });
  
  revealOnScroll();
  hideLoader();
  
  // Initialize values
  if (bestEl) bestEl.textContent = state.best;
  if (timerEl) timerEl.textContent = `${state.time}s`;
  
  // Initialize game
  initGame();
  setupEventListeners();
  
  // Initialize enhanced visuals
  setTimeout(initEnhancedVisuals, 100);
  
  // Add polyfill for roundRect
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      this.beginPath();
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }
});

// Fix hideLoader to check element
function hideLoader() {
  if (!loader) return;
  
  const elapsed = performance.now() - loaderStart;
  const remaining = Math.max(2200 - elapsed, 0);
  setTimeout(() => {
    loader.classList.add('is-hidden');
    setTimeout(() => {
      if (loader && loader.parentNode) {
        loader.remove();
      }
    }, 400);
  }, remaining);
}

// Fix revealOnScroll to handle null elements
function revealOnScroll() {
  document.querySelectorAll('.panel, .card, .experience, .detail, .character-card').forEach(el => {
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 60) {
        el.classList.remove('reveal');
      }
    }
  });
}

// Fix showInstructions to check for overlay
function showInstructions() {
  if (!instructionOverlay) return;
  
  instructionOverlay.classList.remove('is-hidden');
  instructionOverlay.removeAttribute('aria-hidden');
  
  if (state.playing) {
    state.paused = true;
    clearInterval(state.timerId);
    if (gameStatus) {
      gameStatus.textContent = 'Paused for a quick refresher. Tap resume when ready!';
    }
    if (pauseBtn) {
      pauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
    }
  }
}

// Add cleanup function
function cleanupGame() {
  if (state.timerId) clearInterval(state.timerId);
  if (state.ambientTimer) clearInterval(state.ambientTimer);
  window.removeEventListener('resize', handleResize);
}
