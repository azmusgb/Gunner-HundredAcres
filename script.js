/* ==========================================================================
   Baby Gunnar — Hundred Acre Wood Adventure
   script.js — site-wide UI only (nav, cover, modals, progress, accessibility)
   NOTE: Honey Pot Catch game logic is owned by game.js (do not duplicate here)
   ========================================================================== */

/* eslint-disable no-console */
'use strict';

(function () {
  // ------------------------------------------------------------
  // Tiny utils
  // ------------------------------------------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function safeFocus(el) {
    try {
      if (el && typeof el.focus === 'function') el.focus();
    } catch (_) {}
  }

  // ------------------------------------------------------------
  // DOM refs (site)
  // ------------------------------------------------------------
  const dom = {
    // Nav
    navToggle: $('.nav-toggle'),
    navMenu: $('.nav-menu'),

    // Cover / loading
    cover: $('.storybook-cover'),
    coverForm: $('.storybook-form'),
    coverName: $('#guestName'),
    coverBtn: $('#enterAdventure'),
    loading: $('.loading-screen'),
    loadingFill: $('.loading-progress-fill'),
    loadingPct: $('.loading-percentage'),

    // Reading progress
    readingProgress: $('.reading-progress'),

    // Character modal system (single)
    characterModal: $('#characterModal'),
    characterModalClose: $('#closeCharacterModal'),
    characterModalContent: $('#characterModalContent'),

    // Floating buttons (optional)
    musicBtn: $('#musicToggle'),
    accessibilityBtn: $('#accessibilityToggle'),
    scrollTopBtn: $('#scrollTopBtn'),
    favoriteBtn: $('#favoriteBtn'),

    // Misc
    page: $('.page') || document.body
  };

  // ------------------------------------------------------------
  // NAV (hamburger + close-on-outside/esc)
  // ------------------------------------------------------------
  function initNav() {
    if (!dom.navToggle || !dom.navMenu) return;

    const closeMenu = () => {
      dom.navToggle.classList.remove('active');
      dom.navMenu.classList.remove('open');
      dom.navToggle.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
      dom.navToggle.classList.add('active');
      dom.navMenu.classList.add('open');
      dom.navToggle.setAttribute('aria-expanded', 'true');
    };

    const toggleMenu = () => {
      const isOpen = dom.navMenu.classList.contains('open');
      if (isOpen) closeMenu();
      else openMenu();
    };

    // Harden attributes
    dom.navToggle.setAttribute('aria-controls', dom.navMenu.id || 'navMenu');
    dom.navToggle.setAttribute('aria-expanded', 'false');

    dom.navToggle.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMenu();
    });

    // Close when clicking a nav link (mobile)
    dom.navMenu.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a) closeMenu();
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      const isClickInside =
        dom.navMenu.contains(e.target) || dom.navToggle.contains(e.target);
      if (!isClickInside) closeMenu();
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  // ------------------------------------------------------------
  // COVER + LOADING (lightweight “enter” flow)
  // ------------------------------------------------------------
  function setLoadingProgress(pct) {
    if (!dom.loadingFill || !dom.loadingPct) return;
    const clamped = Math.max(0, Math.min(100, pct));
    dom.loadingFill.style.width = `${clamped}%`;
    dom.loadingPct.textContent = `${Math.round(clamped)}%`;
  }

  function showLoading() {
    if (!dom.loading) return;
    dom.loading.style.opacity = '1';
    dom.loading.style.transform = 'translateY(0)';
    dom.loading.classList.remove('hidden');
  }

  function hideLoading() {
    if (!dom.loading) return;
    dom.loading.style.opacity = '0';
    dom.loading.style.transform = 'translateY(8px)';
    setTimeout(() => dom.loading.classList.add('hidden'), 240);
  }

  function closeCover() {
    if (!dom.cover) return;
    dom.cover.classList.add('closed');
    // Prevent focus traps behind overlay
    setTimeout(() => {
      dom.cover.setAttribute('aria-hidden', 'true');
    }, 400);
  }

  function initCover() {
    if (!dom.cover || !dom.coverBtn) return;

    // Enter button should work even if form markup varies
    const onEnter = (e) => {
      e.preventDefault();

      // Start a tiny “loading” progression (purely cosmetic)
      showLoading();
      setLoadingProgress(12);

      const steps = prefersReducedMotion()
        ? [40, 70, 100]
        : [20, 38, 52, 68, 82, 92, 100];

      let i = 0;
      const tick = () => {
        setLoadingProgress(steps[i]);
        i++;
        if (i < steps.length) {
          setTimeout(tick, prefersReducedMotion() ? 80 : 120);
        } else {
          setTimeout(() => {
            hideLoading();
            closeCover();
            // Focus first heading for accessibility
            const h1 = $('.storybook-heading') || $('h1') || $('main');
            safeFocus(h1);
          }, 180);
        }
      };

      // Store guest name (optional)
      const name = dom.coverName ? String(dom.coverName.value || '').trim() : '';
      if (name) {
        try {
          localStorage.setItem('gunnar_guest_name', name);
        } catch (_) {}
      }

      tick();
    };

    dom.coverBtn.addEventListener('click', onEnter);

    // Support submit on Enter
    if (dom.coverForm) {
      dom.coverForm.addEventListener('submit', onEnter);
    }

    // Pre-fill name if stored
    if (dom.coverName) {
      try {
        const stored = localStorage.getItem('gunnar_guest_name');
        if (stored) dom.coverName.value = stored;
      } catch (_) {}
    }
  }

  // ------------------------------------------------------------
  // READING PROGRESS BAR
  // ------------------------------------------------------------
  function initReadingProgress() {
    if (!dom.readingProgress) return;

    const update = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const height = Math.max(1, doc.scrollHeight - window.innerHeight);
      const pct = Math.max(0, Math.min(1, scrollTop / height));
      dom.readingProgress.style.width = `${pct * 100}%`;
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  // ------------------------------------------------------------
  // CHARACTER MODAL (single system; cards just need data-attrs)
  // ------------------------------------------------------------
  function openCharacterModal(payload) {
    if (!dom.characterModal || !dom.characterModalContent) return;

    dom.characterModalContent.innerHTML = `
      <div class="modal-character">
        <div class="modal-character-icon ${payload.iconClass || ''}">
          ${payload.img ? `<img src="${payload.img}" alt="${payload.name || 'Character'}">` : ''}
        </div>
        <div>
          <h3 class="modal-character-name">${payload.name || 'Friend'}</h3>
        </div>
      </div>
      ${payload.quote ? `<p class="modal-character-quote">“${payload.quote}”</p>` : ''}
      ${payload.bio ? `<div class="modal-character-bio">${payload.bio}</div>` : ''}
    `;

    dom.characterModal.classList.add('active');
    dom.characterModal.setAttribute('aria-hidden', 'false');

    // focus close button
    safeFocus(dom.characterModalClose || $('.close-modal', dom.characterModal));
  }

  function closeCharacterModal() {
    if (!dom.characterModal) return;
    dom.characterModal.classList.remove('active');
    dom.characterModal.setAttribute('aria-hidden', 'true');
  }

  function initCharacterCards() {
    // Supports: .clickable-character, .character-card-enhanced, .character-spotlight
    const cards = $$('.clickable-character, .character-card-enhanced, .character-spotlight');
    if (!cards.length) return;

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const name =
          card.getAttribute('data-name') ||
          card.getAttribute('data-character') ||
          card.querySelector('.character-name')?.textContent?.trim() ||
          'Friend';

        const quote =
          card.getAttribute('data-quote') ||
          card.querySelector('.character-quote')?.textContent?.trim() ||
          '';

        const bio = card.getAttribute('data-bio') || card.getAttribute('data-message') || '';

        const img = card.querySelector('img')?.getAttribute('src') || '';
        const iconClass = card.getAttribute('data-icon-class') || '';

        openCharacterModal({ name, quote, bio, img, iconClass });
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    // Close handlers
    if (dom.characterModal) {
      dom.characterModal.addEventListener('click', (e) => {
        if (e.target === dom.characterModal) closeCharacterModal();
      });
    }
    if (dom.characterModalClose) dom.characterModalClose.addEventListener('click', closeCharacterModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dom.characterModal?.classList.contains('active')) {
        closeCharacterModal();
      }
    });
  }

  // ------------------------------------------------------------
  // FLOATING BUTTONS (optional wiring)
  // ------------------------------------------------------------
  function initFloatingButtons() {
    // Scroll to top
    if (dom.scrollTopBtn) {
      dom.scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      });
    }

    // Favorites (simple UI-only toggle)
    if (dom.favoriteBtn) {
      dom.favoriteBtn.addEventListener('click', () => {
        dom.favoriteBtn.classList.toggle('active');
        try {
          localStorage.setItem(
            'gunnar_favorite_active',
            dom.favoriteBtn.classList.contains('active') ? '1' : '0'
          );
        } catch (_) {}
      });

      try {
        const v = localStorage.getItem('gunnar_favorite_active');
        if (v === '1') dom.favoriteBtn.classList.add('active');
      } catch (_) {}
    }

    // Accessibility quick toggle (example: bigger text)
    if (dom.accessibilityBtn) {
      dom.accessibilityBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('a11y-bigtext');
        const on = document.documentElement.classList.contains('a11y-bigtext');
        dom.accessibilityBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        try {
          localStorage.setItem('gunnar_a11y_bigtext', on ? '1' : '0');
        } catch (_) {}
      });

      try {
        const on = localStorage.getItem('gunnar_a11y_bigtext') === '1';
        if (on) {
          document.documentElement.classList.add('a11y-bigtext');
          dom.accessibilityBtn.setAttribute('aria-pressed', 'true');
        }
      } catch (_) {}
    }

    // Music toggle (delegates to window.audioManager if present)
    if (dom.musicBtn) {
      dom.musicBtn.addEventListener('click', async () => {
        const am = window.audioManager;
        if (!am) {
          console.warn('audioManager not found (ok if you removed audio).');
          return;
        }

        try {
          const isMuted = !!am.isMuted;
          if (typeof am.setMuted === 'function') am.setMuted(!isMuted);
          else am.isMuted = !isMuted;

          dom.musicBtn.classList.toggle('muted', !(!am.isMuted));
          dom.musicBtn.setAttribute('aria-pressed', am.isMuted ? 'true' : 'false');
        } catch (e) {
          console.error('Music toggle failed:', e);
        }
      });
    }
  }

  // ------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    try {
      initNav();
      initCover();
      initReadingProgress();
      initCharacterCards();
      initFloatingButtons();
    } catch (err) {
      console.error('script.js init failed:', err);
    }
  });
})();