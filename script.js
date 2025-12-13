/* ==========================================================================
   script.js — Site UI only (cover, nav, progress, modal, basic toggles)
   Enhanced Version with better accessibility, animations, and features
   ========================================================================== */
'use strict';

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = {
    muted: localStorage.getItem('siteMuted') === 'true',
    accessibility: localStorage.getItem('accessibilityMode') === 'true',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    navOpen: false,
    coverClosed: false,
    activeSection: 'story',
    gamepadConnected: false
  };

  const WISHES_KEY = 'hundred-wishes-v2';
  const MAX_WISHES = 50;
  const ANIMATION_DELAY = 300;

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function throttle(func, limit = 100) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // ---------------------------------------------------------------------------
  // Enhanced Audio Helper with Web Audio API
  // ---------------------------------------------------------------------------
  const audio = (() => {
    let ctx = null;
    let enabled = true;
    let sounds = {};
    let gainNode = null;

    const ensure = () => {
      if (ctx || !enabled) return;
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) {
        enabled = false;
        return;
      }
      try {
        ctx = new Ctor();
        gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        gainNode.gain.value = 0.3;
        
        // Preload common sounds
        createSound('click', 523, 0.1, 'sine');
        createSound('confirm', 587, 0.2, 'triangle');
        createSound('error', 330, 0.15, 'sawtooth');
        createSound('success', 659, 0.25, 'sine');
        createSound('hover', 440, 0.08, 'sine');
        
        console.log('[Audio] Web Audio API initialized');
      } catch (err) {
        console.warn('[Audio] Could not initialize:', err);
        enabled = false;
      }
    };

    const createSound = (name, frequency = 440, duration = 0.12, type = 'sine') => {
      if (!ctx || !enabled) return;
      
      sounds[name] = () => {
        if (state.muted) return;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        osc.frequency.value = frequency;
        
        osc.connect(gain);
        gain.connect(gainNode);
        
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
      };
    };

    const play = (frequency = 440, duration = 0.12, type = 'sine') => {
      ensure();
      if (!enabled || state.muted || !ctx) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = frequency;
      
      osc.connect(gain);
      gain.connect(gainNode);
      
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      osc.start(now);
      osc.stop(now + duration);
    };

    const playSound = (name) => {
      if (sounds[name]) {
        sounds[name]();
      } else {
        play();
      }
    };

    const setVolume = (volume) => {
      if (gainNode) {
        gainNode.gain.value = clamp(volume, 0, 1);
      }
    };

    const toggleMute = () => {
      state.muted = !state.muted;
      localStorage.setItem('siteMuted', state.muted);
      if (gainNode) {
        gainNode.gain.value = state.muted ? 0 : 0.3;
      }
      return state.muted;
    };

    return { 
      ensure, 
      play, 
      playSound,
      createSound,
      setVolume,
      toggleMute,
      getMuted: () => state.muted
    };
  })();

  // ---------------------------------------------------------------------------
  // Toast Notification System
  // ---------------------------------------------------------------------------
  const toast = (() => {
    const container = $('#toast') || (() => {
      const el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'alert');
      el.setAttribute('aria-live', 'assertive');
      el.setAttribute('aria-atomic', 'true');
      document.body.appendChild(el);
      return el;
    })();

    const show = (message, type = 'info', duration = 3000) => {
      const icon = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
      }[type] || 'ℹ';

      container.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
      `;
      container.className = `toast ${type}`;
      container.setAttribute('aria-label', message);

      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.className = 'sr-only';
      announcement.setAttribute('aria-live', 'assertive');
      announcement.textContent = message;
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 100);

      container.classList.add('visible');
      
      setTimeout(() => {
        container.classList.remove('visible');
      }, duration);
    };

    return { show };
  })();

  // ---------------------------------------------------------------------------
  // Cover
  // ---------------------------------------------------------------------------
  function initCover() {
    const cover = $('#cover');
    const enter = $('#enterStory');
    const installButton = $('#installButton');
    const installPrompt = $('#installPrompt');

    if (!cover || !enter) return;

    const closeCover = () => {
      cover.classList.add('closed');
      cover.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('cover-open');
      state.coverClosed = true;
      localStorage.setItem('coverClosed', 'true');
      
      // Focus management
      const main = $('#main');
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll: true });
        setTimeout(() => main.removeAttribute('tabindex'), 300);
      }
      
      audio.playSound('success');
      toast.show('Welcome to the Hundred Acre Wood!', 'success', 2000);
    };

    document.body.classList.add('cover-open');

    // Check if cover should be closed
    if (localStorage.getItem('coverClosed') === 'true') {
      closeCover();
    }

    enter.addEventListener('click', () => {
      audio.playSound('confirm');
      closeCover();
    });

    // Install PWA button
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      if (installPrompt && installButton) {
        installPrompt.style.display = 'block';
        
        installButton.addEventListener('click', async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            toast.show(outcome === 'accepted' 
              ? 'App installed successfully!' 
              : 'App install cancelled', 
              outcome === 'accepted' ? 'success' : 'warning'
            );
            deferredPrompt = null;
            installPrompt.style.display = 'none';
          }
        });
      }
    });

    // Escape closes cover
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !state.coverClosed) {
        closeCover();
      }
    });

    // Add hover effect to cover button
    enter.addEventListener('mouseenter', () => {
      if (!state.muted) audio.playSound('hover');
    });

    // Add keyboard navigation for cover
    enter.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        enter.click();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Navigation with active section tracking
  // ---------------------------------------------------------------------------
  function initNav() {
    const toggle = $('#navToggle');
    const menu = $('#navMenu');
    const navItems = $$('.nav-item');
    
    if (!toggle || !menu) return;

    const setNavOpen = (open) => {
      state.navOpen = open;
      menu.classList.toggle('active', open);
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      
      if (open) {
        // Focus first nav item when opening
        const firstItem = menu.querySelector('a');
        if (firstItem) firstItem.focus();
      }
    };

    toggle.addEventListener('click', () => {
      const open = !state.navOpen;
      setNavOpen(open);
      audio.playSound(open ? 'confirm' : 'click');
    });

    // Close when clicking a link
    menu.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      setNavOpen(false);
      audio.playSound('click');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!state.navOpen) return;
      const inside = e.target.closest('#navMenu') || e.target.closest('#navToggle');
      if (!inside) setNavOpen(false);
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.navOpen) {
        setNavOpen(false);
        toggle.focus();
      }
    });

    // Track active section
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          state.activeSection = id;
          
          // Update nav items
          navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === `#${id}`) {
              item.classList.add('active');
            } else {
              item.classList.remove('active');
            }
          });
        }
      });
    }, { threshold: 0.3 });

    // Observe sections
    const sections = ['story', 'friends', 'games', 'wishes'];
    sections.forEach(id => {
      const section = $(`#${id}`);
      if (section) observer.observe(section);
    });

    // Hide/show nav on scroll
    let lastScroll = 0;
    const nav = $('.nav');
    
    const handleScroll = throttle(() => {
      const currentScroll = window.pageYOffset;
      
      if (currentScroll <= 100) {
        nav.classList.remove('hidden');
      } else if (currentScroll > lastScroll && currentScroll > 200) {
        nav.classList.add('hidden');
      } else {
        nav.classList.remove('hidden');
      }
      
      lastScroll = currentScroll;
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // ---------------------------------------------------------------------------
  // Enhanced Reading Progress Bar
  // ---------------------------------------------------------------------------
  function initReadingProgress() {
    const bar = $('#readingProgress');
    if (!bar) return;

    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const height = (doc.scrollHeight - doc.clientHeight) || 1;
      const pct = clamp((scrollTop / height) * 100, 0, 100);
      
      bar.style.width = pct.toFixed(2) + '%';
      
      // Add gradient color based on progress
      const hue = 40 + (pct * 0.6); // 40 (orange) to 100 (green)
      bar.style.background = `linear-gradient(90deg, 
        hsl(${hue}, 80%, 60%), 
        hsl(${hue + 20}, 80%, 60%)
      )`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  // ---------------------------------------------------------------------------
  // Enhanced Floating Action Buttons
  // ---------------------------------------------------------------------------
  function initFABs() {
    const muteBtn = $('#muteToggle');
    const accBtn = $('#accessibilityToggle');
    const topBtn = $('#scrollTop');

    // Scroll to top with progress indication
    if (topBtn) {
      topBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        audio.playSound('click');
      });

      // Show/hide based on scroll position
      window.addEventListener('scroll', throttle(() => {
        if (window.pageYOffset > 300) {
          topBtn.classList.add('visible');
        } else {
          topBtn.classList.remove('visible');
        }
      }, 100));
    }

    // Mute toggle with visual feedback
    if (muteBtn) {
      const updateMuteButton = () => {
        muteBtn.setAttribute('aria-pressed', String(state.muted));
        muteBtn.innerHTML = state.muted
          ? '<i class="fa-solid fa-volume-xmark" aria-hidden="true"></i>'
          : '<i class="fa-solid fa-volume-high" aria-hidden="true"></i>';
        
        // Add visual feedback
        muteBtn.classList.add('pulse');
        setTimeout(() => muteBtn.classList.remove('pulse'), 300);
      };

      muteBtn.addEventListener('click', () => {
        const wasMuted = audio.toggleMute();
        state.muted = wasMuted;
        updateMuteButton();
        audio.playSound(wasMuted ? 'error' : 'success');
        toast.show(wasMuted ? 'Sound muted' : 'Sound enabled', 'info', 1500);
      });

      muteBtn.addEventListener('mouseenter', () => {
        if (!state.muted) audio.playSound('hover');
      });

      updateMuteButton();
    }

    // Accessibility toggle
    if (accBtn) {
      const updateAccessibilityButton = () => {
        accBtn.setAttribute('aria-pressed', String(state.accessibility));
        document.documentElement.classList.toggle('accessibility-mode', state.accessibility);
        document.body.classList.toggle('high-contrast', state.accessibility);
        
        // Store preference
        localStorage.setItem('accessibilityMode', state.accessibility);
      };

      accBtn.addEventListener('click', () => {
        state.accessibility = !state.accessibility;
        updateAccessibilityButton();
        audio.playSound('confirm');
        toast.show(
          state.accessibility ? 'Accessibility mode enabled' : 'Accessibility mode disabled',
          'info',
          1500
        );
      });

      accBtn.addEventListener('mouseenter', () => {
        if (!state.muted) audio.playSound('hover');
      });

      updateAccessibilityButton();
    }

    // Add tooltips to FABs
    [muteBtn, accBtn, topBtn].forEach(btn => {
      if (btn) {
        btn.addEventListener('focus', () => {
          btn.setAttribute('data-tooltip', btn.getAttribute('title') || '');
        });
        btn.addEventListener('blur', () => {
          btn.removeAttribute('data-tooltip');
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Enhanced Character Modal
  // ---------------------------------------------------------------------------
  function initCharacterModal() {
    const modal = $('#characterModal');
    const closeBtn = $('#closeCharacterModal');
    if (!modal || !closeBtn) return;

    const icon = $('#modalIcon');
    const name = $('#modalName');
    const quote = $('#modalQuote');
    const bio = $('#modalBio');

    const CHARACTER_DATA = {
      pooh: {
        name: 'Pooh',
        quote: 'A little honey goes a long way.',
        bio: 'Pooh reminds us that sometimes the sweetest things come in simple moments. Just like honey, kindness spreads and makes everything better.',
        iconClass: 'pooh-icon-modal',
        color: '#FFC107',
        sound: 'success'
      },
      piglet: {
        name: 'Piglet',
        quote: 'Small steps. Big heart.',
        bio: 'Piglet shows up even when things feel big. That\'s courage, plain and simple. Remember that even the smallest act of kindness can make a huge difference.',
        iconClass: 'piglet-icon-modal',
        color: '#FFB6C1',
        sound: 'click'
      },
      eeyore: {
        name: 'Eeyore',
        quote: 'Quiet love still counts.',
        bio: 'Eeyore won\'t make a big speech. He\'ll still be there. Sometimes the most meaningful support is just showing up and being present.',
        iconClass: 'eeyore-icon-modal',
        color: '#B0BEC5',
        sound: 'confirm'
      },
      tigger: {
        name: 'Tigger',
        quote: 'Bounce into the fun-fun.',
        bio: 'Tigger brings the energy. Sometimes the best plan is "boing." Embrace joy and enthusiasm - they\'re contagious and make everything more fun!',
        iconClass: 'tigger-icon-modal',
        color: '#FF9800',
        sound: 'success'
      }
    };

    let currentCharacter = null;

    function openCharacter(characterKey) {
      const data = CHARACTER_DATA[characterKey] || CHARACTER_DATA.pooh;
      currentCharacter = characterKey;

      if (name) name.textContent = data.name;
      if (quote) quote.textContent = data.quote;
      if (bio) bio.textContent = data.bio;

      if (icon) {
        icon.className = `modal-character-icon ${data.iconClass}`;
        icon.style.backgroundColor = data.color;
      }

      modal.classList.add('active');
      modal.setAttribute('aria-label', `${data.name} says: ${data.quote}`);
      
      // Focus management
      setTimeout(() => closeBtn.focus({ preventScroll: true }), 10);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
      
      // Play character sound
      audio.playSound(data.sound);
      
      // Announce to screen readers
      const announcement = `${data.name} says: ${data.quote}. ${data.bio}`;
      const srAnnouncement = document.createElement('div');
      srAnnouncement.className = 'sr-only';
      srAnnouncement.setAttribute('aria-live', 'assertive');
      srAnnouncement.textContent = announcement;
      document.body.appendChild(srAnnouncement);
      setTimeout(() => srAnnouncement.remove(), 100);
    }

    function closeCharacterModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      audio.playSound('click');
    }

    // Close button
    closeBtn.addEventListener('click', closeCharacterModal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeCharacterModal();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeCharacterModal();
      }
    });

    // Trap focus inside modal
    modal.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('active') || e.key !== 'Tab') return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });

    // Wire up character cards
    $$('.character-spotlight,[data-character]').forEach((card) => {
      const characterKey = card.getAttribute('data-character');
      if (!characterKey) return;

      // Click handler
      card.addEventListener('click', () => {
        openCharacter(characterKey);
      });

      // Keyboard handler
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openCharacter(characterKey);
        }
      });

      // Hover effect
      card.addEventListener('mouseenter', () => {
        if (!state.muted) audio.playSound('hover');
        card.classList.add('hover');
      });

      card.addEventListener('mouseleave', () => {
        card.classList.remove('hover');
      });
    });

    // Export for use elsewhere
    window.openCharacterModal = openCharacter;
    window.closeCharacterModal = closeCharacterModal;
  }

  // ---------------------------------------------------------------------------
  // Enhanced Smooth Scroll with offset and progress
  // ---------------------------------------------------------------------------
  function initSmoothScroll() {
    const headerHeight = 80;
    const scrollOffset = state.reducedMotion ? 0 : 100;

    $$('a[href^="#"]').forEach((anchor) => {
      // Skip if href is just "#"
      if (anchor.getAttribute('href') === '#') return;

      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (!targetId) return;

        const target = $(targetId);
        if (!target) return;

        e.preventDefault();

        // Calculate target position
        const targetRect = target.getBoundingClientRect();
        const targetTop = window.pageYOffset + targetRect.top - headerHeight;

        // Smooth scroll
        window.scrollTo({
          top: targetTop - scrollOffset,
          behavior: state.reducedMotion ? 'auto' : 'smooth'
        });

        // Update URL hash without scrolling
        history.pushState(null, null, targetId);

        // Audio feedback
        audio.playSound('click');

        // Update active nav item
        $$('.nav-item').forEach(item => {
          item.classList.remove('active');
          if (item.getAttribute('href') === targetId) {
            item.classList.add('active');
          }
        });
      });
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
      const hash = window.location.hash;
      if (hash) {
        const target = $(hash);
        if (target) {
          const targetTop = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          window.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Enhanced Entrance Animations with Intersection Observer
  // ---------------------------------------------------------------------------
  function initEntranceAnimations() {
    if (state.reducedMotion) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          // Add animation class
          element.classList.add('animate-in');
          
          // For cards with staggered children
          const children = element.querySelectorAll('.character-spotlight, .guide-card, .wish-item');
          children.forEach((child, index) => {
            child.style.animationDelay = `${index * 100}ms`;
            child.classList.add('animate-in');
          });
          
          observer.unobserve(element);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    });

    // Observe elements
    const elements = $$(
      '.content-section, .game-card, .characters-grid-enhanced, .game-guide-grid, .wishes-list'
    );
    
    elements.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s var(--animation-smooth), transform 0.6s var(--animation-smooth)';
      observer.observe(el);
    });
  }

  // ---------------------------------------------------------------------------
  // Enhanced Wishes System with Statistics and Filtering
  // ---------------------------------------------------------------------------
  function initWishes() {
    const form = $('#wishesForm');
    const list = $('#wishesList');
    const status = $('#wishStatus');
    const meta = $('#wishMeta');
    const nameInput = $('#wishName');
    const emojiInput = $('#wishEmoji');
    const messageInput = $('#wishMessage');
    const clearBtn = $('#clearWishes');
    const filterButtons = $$('.filter-btn');
    const sortSelect = $('#sortWishes');
    const totalWishesEl = $('#totalWishes');
    const todayWishesEl = $('#todayWishes');
    const lastWishEl = $('#lastWish');
    const emptyState = $('#emptyWishes');

    if (!form || !list || !messageInput) return;

    let wishes = loadWishes();
    let currentFilter = 'all';
    let currentSort = 'newest';

    // Statistics
    function updateStatistics() {
      const today = new Date().toDateString();
      const todayCount = wishes.filter(w => new Date(w.created).toDateString() === today).length;
      const lastWish = wishes[0] ? formatTime(wishes[0].created) : '--:--';
      
      if (totalWishesEl) totalWishesEl.textContent = wishes.length;
      if (todayWishesEl) todayWishesEl.textContent = todayCount;
      if (lastWishEl) lastWishEl.textContent = lastWish;
    }

    // Load wishes from localStorage
    function loadWishes() {
      try {
        const stored = localStorage.getItem(WISHES_KEY);
        if (!stored) return [];
        
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.warn('[Wishes] Could not load wishes:', err);
        return [];
      }
    }

    // Save wishes to localStorage
    function saveWishes() {
      try {
        localStorage.setItem(WISHES_KEY, JSON.stringify(wishes.slice(0, MAX_WISHES)));
      } catch (err) {
        console.warn('[Wishes] Could not save wishes:', err);
        toast.show('Failed to save wish', 'error');
      }
    }

    // Format time display
    function formatTime(isoString) {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Just now';
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric' 
      });
    }

    // Filter wishes
    function filterWishes(filterType) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      switch(filterType) {
        case 'today':
          return wishes.filter(w => new Date(w.created) >= today);
        case 'week':
          return wishes.filter(w => new Date(w.created) >= weekAgo);
        default:
          return wishes;
      }
    }

    // Sort wishes
    function sortWishes(wishesList, sortType) {
      return [...wishesList].sort((a, b) => {
        const dateA = new Date(a.created);
        const dateB = new Date(b.created);
        
        switch(sortType) {
          case 'oldest':
            return dateA - dateB;
          case 'name':
            return (a.name || 'A friend').localeCompare(b.name || 'A friend');
          default: // 'newest'
            return dateB - dateA;
        }
      });
    }

    // Render wishes list
    function renderWishes() {
      let filtered = filterWishes(currentFilter);
      filtered = sortWishes(filtered, currentSort);
      
      list.innerHTML = '';
      
      if (filtered.length === 0) {
        if (emptyState) {
          emptyState.style.display = 'block';
          list.appendChild(emptyState);
        } else {
          const empty = document.createElement('div');
          empty.className = 'empty-state';
          empty.innerHTML = `
            <div class="empty-icon">💭</div>
            <h3>No wishes yet</h3>
            <p>Be the first to leave a warm wish for Baby Gunnar!</p>
          `;
          list.appendChild(empty);
        }
        return;
      }
      
      if (emptyState) emptyState.style.display = 'none';
      
      filtered.forEach((wish, index) => {
        const card = document.createElement('article');
        card.className = 'wish-item';
        card.style.animationDelay = `${index * 50}ms`;
        card.innerHTML = `
          <div class="wish-header">
            <span class="wish-emoji" aria-hidden="true">${wish.emoji || '💌'}</span>
            <span class="wish-name">${wish.name || 'A friend'}</span>
            <span class="wish-time">${formatTime(wish.created)}</span>
          </div>
          <p class="wish-message">${wish.message}</p>
        `;
        list.appendChild(card);
      });
    }

    // Update character counter
    function updateCharCounter() {
      if (!meta) return;
      const count = messageInput.value.length;
      const max = messageInput.maxLength;
      meta.textContent = `${count} / ${max}`;
      meta.style.color = count > max * 0.9 ? 'var(--color-red)' : 'var(--color-text-light)';
    }

    // Set status message
    function setStatus(message, type = 'info') {
      if (!status) return;
      status.textContent = message;
      status.className = `wish-status ${type} show`;
      setTimeout(() => status.classList.remove('show'), 3000);
    }

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const message = messageInput.value.trim();
      const name = nameInput ? nameInput.value.trim() : '';
      const emoji = emojiInput ? emojiInput.value : '💌';
      
      // Validation
      if (message.length < 4) {
        setStatus('Please write a longer wish (at least 4 characters)', 'error');
        audio.playSound('error');
        messageInput.focus();
        return;
      }
      
      if (message.length > 240) {
        setStatus('Wish is too long (maximum 240 characters)', 'error');
        audio.playSound('error');
        messageInput.focus();
        return;
      }
      
      // Create wish object
      const wish = {
        name: name.slice(0, 60) || 'A friend',
        message: message.slice(0, 240),
        emoji: emoji,
        created: new Date().toISOString(),
        id: Date.now() + Math.random().toString(36).substr(2, 9)
      };
      
      // Add to beginning of array
      wishes.unshift(wish);
      
      // Save and update
      saveWishes();
      renderWishes();
      updateStatistics();
      
      // Reset form
      form.reset();
      updateCharCounter();
      
      // Show success
      setStatus('Wish sent with love! 🍯', 'success');
      audio.playSound('success');
      toast.show('Your wish has been saved!', 'success');
      
      // Focus on message input for next wish
      messageInput.focus();
    });

    // Clear all wishes
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (wishes.length === 0) {
          toast.show('No wishes to clear', 'info');
          return;
        }
        
        if (confirm('Are you sure you want to clear all wishes? This cannot be undone.')) {
          wishes = [];
          saveWishes();
          renderWishes();
          updateStatistics();
          setStatus('All wishes cleared', 'info');
          audio.playSound('success');
          toast.show('All wishes cleared', 'success');
        }
      });
    }

    // Filter buttons
    if (filterButtons.length > 0) {
      filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          filterButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentFilter = btn.dataset.filter;
          renderWishes();
          audio.playSound('click');
        });
      });
    }

    // Sort select
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        renderWishes();
        audio.playSound('click');
      });
    }

    // Character counter
    messageInput.addEventListener('input', updateCharCounter);
    
    // Initialize
    updateCharCounter();
    updateStatistics();
    renderWishes();
    
    // Export for external access
    window.wishesManager = {
      getWishes: () => [...wishes],
      addWish: (name, message, emoji = '💌') => {
        const wish = {
          name: name.slice(0, 60) || 'A friend',
          message: message.slice(0, 240),
          emoji,
          created: new Date().toISOString(),
          id: Date.now() + Math.random().toString(36).substr(2, 9)
        };
        wishes.unshift(wish);
        saveWishes();
        renderWishes();
        updateStatistics();
        return wish;
      },
      clearAll: () => {
        wishes = [];
        saveWishes();
        renderWishes();
        updateStatistics();
      }
    };
  }

  // ---------------------------------------------------------------------------
  // Particle System for Visual Effects
  // ---------------------------------------------------------------------------
  function initParticles() {
    window.createParticle = (x, y, options = {}) => {
      const {
        emoji = '✨',
        size = 24,
        duration = 1000,
        count = 5,
        spread = 120
      } = options;

      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const particle = document.createElement('div');
          particle.className = 'particle';
          particle.textContent = emoji;
          particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            font-size: ${size}px;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transform: translate(0, 0) scale(1);
            animation: particleFloat ${duration}ms ease-out forwards;
          `;

          // Random movement
          const tx = (Math.random() - 0.5) * spread;
          const ty = -50 - Math.random() * 80;
          const rotation = (Math.random() - 0.5) * 360;
          
          const style = document.createElement('style');
          style.textContent = `
            @keyframes particleFloat {
              0% {
                opacity: 0;
                transform: translate(0, 0) scale(0.5) rotate(0deg);
              }
              20% {
                opacity: 1;
                transform: translate(${tx * 0.2}px, ${ty * 0.2}px) scale(1.2) rotate(${rotation * 0.2}deg);
              }
              100% {
                opacity: 0;
                transform: translate(${tx}px, ${ty}px) scale(0.5) rotate(${rotation}deg);
              }
            }
          `;
          
          document.head.appendChild(style);
          document.body.appendChild(particle);
          
          setTimeout(() => {
            particle.remove();
            style.remove();
          }, duration);
        }, i * 60);
      }
    };

    // Add particle effects to buttons
    $$('.btn-primary, .btn-secondary, .mode-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        const emojis = btn.classList.contains('btn-primary') 
          ? ['🍯', '✨', '⭐', '💫']
          : ['🌟', '💖', '🌿', '🎈'];
        
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        window.createParticle(x, y, {
          emoji: randomEmoji,
          count: 3,
          size: 20
        });
      });
    });

    // Add hover particles to character cards
    $$('.character-spotlight').forEach(card => {
      card.addEventListener('mouseenter', (e) => {
        if (state.muted) return;
        
        const rect = card.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        window.createParticle(x, y, {
          emoji: '✨',
          count: 2,
          size: 16,
          duration: 800,
          spread: 40
        });
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Performance Monitoring and Analytics
  // ---------------------------------------------------------------------------
  function initPerformance() {
    // Log page load performance
    window.addEventListener('load', () => {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      console.log(`[Performance] Page loaded in ${loadTime}ms`);
      
      // Report slow loads
      if (loadTime > 3000) {
        console.warn('[Performance] Page load was slow');
      }
    });

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const { usedJSHeapSize, totalJSHeapSize } = performance.memory;
        const usage = (usedJSHeapSize / totalJSHeapSize * 100).toFixed(1);
        if (parseFloat(usage) > 80) {
          console.warn(`[Performance] High memory usage: ${usage}%`);
        }
      }, 30000);
    }
  }

  // ---------------------------------------------------------------------------
  // Gamepad Support for Navigation
  // ---------------------------------------------------------------------------
  function initGamepad() {
    let gamepadIndex = null;
    
    window.addEventListener('gamepadconnected', (e) => {
      gamepadIndex = e.gamepad.index;
      state.gamepadConnected = true;
      toast.show('Gamepad connected', 'success');
      console.log('[Gamepad] Connected:', e.gamepad.id);
    });
    
    window.addEventListener('gamepaddisconnected', () => {
      gamepadIndex = null;
      state.gamepadConnected = false;
      toast.show('Gamepad disconnected', 'warning');
    });
    
    // Gamepad navigation polling
    function pollGamepad() {
      if (gamepadIndex === null) return;
      
      const gamepad = navigator.getGamepads()[gamepadIndex];
      if (!gamepad) return;
      
      // Example: Use D-pad for navigation
      if (gamepad.buttons[12].pressed) { // Up
        window.scrollBy({ top: -50, behavior: 'smooth' });
      }
      if (gamepad.buttons[13].pressed) { // Down
        window.scrollBy({ top: 50, behavior: 'smooth' });
      }
      
      requestAnimationFrame(pollGamepad);
    }
    
    if (gamepadIndex !== null) {
      pollGamepad();
    }
  }

  // ---------------------------------------------------------------------------
  // Error Handling and Recovery
  // ---------------------------------------------------------------------------
  function initErrorHandling() {
    // Global error handler
    window.addEventListener('error', (e) => {
      console.error('[Global Error]', e.error);
      toast.show('Something went wrong. Please refresh the page.', 'error', 5000);
    });

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (e) => {
      console.error('[Unhandled Promise]', e.reason);
      toast.show('An unexpected error occurred.', 'error', 5000);
    });

    // Offline/online detection
    window.addEventListener('offline', () => {
      toast.show('You are offline. Some features may not work.', 'warning', 3000);
    });

    window.addEventListener('online', () => {
      toast.show('You are back online!', 'success', 2000);
    });
  }

  // ---------------------------------------------------------------------------
  // Initialize everything
  // ---------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[Site] Initializing...');
    
    // Start with audio context
    audio.ensure();
    
    // Initialize core modules
    initCover();
    initNav();
    initReadingProgress();
    initFABs();
    initCharacterModal();
    initSmoothScroll();
    initEntranceAnimations();
    initWishes();
    initParticles();
    
    // Initialize optional modules
    initPerformance();
    initGamepad();
    initErrorHandling();
    
    // Prevent iOS text selection
    document.addEventListener('contextmenu', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('selectstart', (e) => e.preventDefault(), { passive: false });
    
    // Show welcome message
    setTimeout(() => {
      if (!state.coverClosed) {
        toast.show('Welcome! Click "Enter the Storybook" to begin', 'info', 4000);
      }
    }, 1000);
    
    console.log('[Site] Initialization complete');
  });

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  window.siteManager = {
    audio,
    toast,
    state,
    openCharacterModal: window.openCharacterModal,
    closeCharacterModal: window.closeCharacterModal,
    createParticle: window.createParticle,
    wishesManager: window.wishesManager
  };
})();