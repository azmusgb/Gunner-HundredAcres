/* ==========================================================================
   script.js — Site UI only (cover, nav, progress, modal, basic toggles)
   Does NOT own the Honey Catch game (that’s game.js).
   ========================================================================== */
'use strict';

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = {
    muted: false,
    accessibility: false
  };

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  // ---------------------------------------------------------------------------
  // Lightweight audio helper (UI bleeps only)
  // ---------------------------------------------------------------------------
  const audio = (() => {
    let ctx = null;
    let enabled = false;

    const ensure = () => {
      if (ctx || state.muted) return;
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
      enabled = true;
    };

    const play = (frequency = 440, duration = 0.12, type = 'sine') => {
      ensure();
      if (!enabled || state.muted || !ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.value = frequency;

      osc.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    };

    return { ensure, play };
  })();

  // ---------------------------------------------------------------------------
  // Cover
  // ---------------------------------------------------------------------------
  function initCover() {
    const cover = $('#cover');
    const enter = $('#enterStory');

    if (!cover || !enter) return;

    const closeCover = () => {
      cover.classList.add('closed');
      cover.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('cover-open');
    };

    document.body.classList.add('cover-open');

    enter.addEventListener('click', () => {
      audio.ensure();
      audio.play(523, 0.18, 'sine');
      closeCover();
      // Nudge focus to main content for accessibility
      const main = $('#main');
      if (main) main.setAttribute('tabindex', '-1');
      if (main) main.focus({ preventScroll: true });
      window.setTimeout(() => main && main.removeAttribute('tabindex'), 300);
    });

    // Escape closes cover
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !cover.classList.contains('closed')) closeCover();
    });
  }

  // ---------------------------------------------------------------------------
  // Nav (mobile dropdown)
  // ---------------------------------------------------------------------------
  function initNav() {
    const toggle = $('#navToggle');
    const menu = $('#navMenu');
    if (!toggle || !menu) return;

    const setOpen = (open) => {
      menu.classList.toggle('open', open);
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    toggle.addEventListener('click', () => {
      const open = !menu.classList.contains('open');
      setOpen(open);
      audio.play(open ? 440 : 392, 0.1);
    });

    // Close when clicking a link
    menu.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      setOpen(false);
      audio.play(523, 0.08);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!menu.classList.contains('open')) return;
      const inside = e.target.closest('#navMenu') || e.target.closest('#navToggle');
      if (!inside) setOpen(false);
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  // ---------------------------------------------------------------------------
  // Reading progress bar
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
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  // ---------------------------------------------------------------------------
  // Floating buttons
  // ---------------------------------------------------------------------------
  function initFABs() {
    const muteBtn = $('#muteToggle');
    const accBtn = $('#accessibilityToggle');
    const topBtn = $('#scrollTop');

    if (topBtn) {
      topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    if (muteBtn) {
      const sync = () => {
        muteBtn.setAttribute('aria-pressed', String(state.muted));
        muteBtn.innerHTML = state.muted
          ? '<i class="fa-solid fa-volume-xmark" aria-hidden="true"></i>'
          : '<i class="fa-solid fa-volume-high" aria-hidden="true"></i>';
      };

      muteBtn.addEventListener('click', () => {
        state.muted = !state.muted;
        // If you have an audio manager, tell it (optional)
        if (window.audioManager && typeof window.audioManager.setMuted === 'function') {
          window.audioManager.setMuted(state.muted);
        }
        audio.play(state.muted ? 330 : 494, 0.12);
        sync();
      });

      sync();
    }

    if (accBtn) {
      const sync = () => {
        accBtn.setAttribute('aria-pressed', String(state.accessibility));
        document.documentElement.classList.toggle('a11y', state.accessibility);
      };

      accBtn.addEventListener('click', () => {
        state.accessibility = !state.accessibility;
        document.body.classList.toggle('accessibility-mode', state.accessibility);
        audio.play(523, 0.12);
        sync();
      });

      sync();
    }
  }

  // ---------------------------------------------------------------------------
  // Character modal
  // ---------------------------------------------------------------------------
  function initCharacterModal() {
    const modal = $('#characterModal');
    const closeBtn = $('#closeCharacterModal');
    if (!modal || !closeBtn) return;

    const icon = $('#modalIcon');
    const name = $('#modalName');
    const quote = $('#modalQuote');
    const bio = $('#modalBio');

    const DATA = {
      pooh: {
        name: 'Pooh',
        quote: 'A little honey goes a long way.',
        bio: 'Pooh is here for the sweet moments and the quiet joy. He approves of naps.',
        iconClass: 'pooh-icon-modal'
      },
      piglet: {
        name: 'Piglet',
        quote: 'Small steps. Big heart.',
        bio: 'Piglet shows up even when things feel big. That’s courage, plain and simple.',
        iconClass: 'piglet-icon-modal'
      },
      eeyore: {
        name: 'Eeyore',
        quote: 'Quiet love still counts.',
        bio: 'Eeyore won’t make a big speech. He’ll still be there.',
        iconClass: 'eeyore-icon-modal'
      },
      tigger: {
        name: 'Tigger',
        quote: 'Bounce into the fun-fun.',
        bio: 'Tigger brings the energy. Sometimes the best plan is “boing.”',
        iconClass: 'tigger-icon-modal'
      }
    };

    function open(characterKey) {
      const d = DATA[characterKey] || { name: 'Friend', quote: 'Hello.', bio: 'A gentle note.', iconClass: '' };

      if (name) name.textContent = d.name;
      if (quote) quote.textContent = d.quote;
      if (bio) bio.textContent = d.bio;

      if (icon) {
        icon.className = 'modal-character-icon ' + (d.iconClass || '');
        icon.innerHTML = ''; // keep simple; your CSS handles background
      }

      modal.classList.add('active');
      closeBtn.focus({ preventScroll: true });
      document.body.style.overflow = 'hidden';
      audio.ensure();
      audio.play(523, 0.16, 'triangle');
    }

    function close() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      audio.play(392, 0.12);
    }

    closeBtn.addEventListener('click', close);

    modal.addEventListener('click', (e) => {
      const inside = e.target.closest('.modal-content');
      if (!inside) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) close();
    });

    // Wire up friend cards
    $$('.character-spotlight,[data-character]').forEach((el) => {
      const key = el.getAttribute('data-character');
      if (!key) return;
      el.addEventListener('click', () => open(key));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(key);
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Smooth scroll for anchored links (offset header)
  // ---------------------------------------------------------------------------
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId === '#') return;
        const target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();
        const headerOffset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top, behavior: 'smooth' });
        audio.play(494, 0.1);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Entrance animations for sections/cards
  // ---------------------------------------------------------------------------
  function initEntranceAnimations() {
    const observed = $$('.content-section, .game-card, .character-spotlight');
    if (!observed.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    observed.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  // ---------------------------------------------------------------------------
  // Fun particle burst for CTA buttons
  // ---------------------------------------------------------------------------
  function initParticles() {
    window.createParticle = (x, y, emoji = '✨') => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.textContent = emoji;
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.position = 'fixed';
      particle.style.fontSize = '24px';
      particle.style.zIndex = '10000';
      particle.style.pointerEvents = 'none';

      const tx = (Math.random() - 0.5) * 120;
      const ty = -50 - Math.random() * 80;
      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);

      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 1000);
    };

    $$('.btn-primary, .btn-secondary').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rect = btn.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        for (let i = 0; i < 5; i += 1) {
          window.setTimeout(() => window.createParticle(x, y, '🍯'), i * 60);
        }
      });
    });
  }
  
  // iOS magnifier hard stop
  document.addEventListener('contextmenu', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('selectstart', (e) => e.preventDefault(), { passive: false });
  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initCover();
    initNav();
    initReadingProgress();
    initFABs();
    initCharacterModal();
    initSmoothScroll();
    initEntranceAnimations();
    initParticles();
  });
})();
