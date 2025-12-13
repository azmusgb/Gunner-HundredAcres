/* ==========================================================================
   Baby Gunnar — Site UX Controller
   script.js
   --------------------------------------------------------------------------
   Owns:
   - Loading screen
   - Storybook cover
   - Navigation (desktop + mobile)
   - Audio toggle (autoplay-safe)
   - Character modal (single source of truth)
   - Scroll helpers / progress
   - Reduced motion toggle
   - Wishes form UX

   Does NOT touch:
   - Canvas
   - Game loop
   - Game scoring / input
   ========================================================================== */

(() => {
  "use strict";

  /* -----------------------------------------------------------------------
     0) UTILITIES
  ----------------------------------------------------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------------------
     1) LOADING SCREEN
     Hide only when page is actually ready
  ----------------------------------------------------------------------- */
  const loadingScreen = $("#loadingScreen");

  window.addEventListener("load", () => {
    if (!loadingScreen) return;

    loadingScreen.style.opacity = "0";
    loadingScreen.style.pointerEvents = "none";

    setTimeout(() => {
      loadingScreen.remove();
    }, 400);
  });

  /* -----------------------------------------------------------------------
     2) STORYBOOK COVER
  ----------------------------------------------------------------------- */
  const cover = $(".storybook-cover");
  const openBookBtn = $("#openBookBtn");

  if (openBookBtn && cover) {
    openBookBtn.addEventListener("click", () => {
      cover.classList.add("closed");
      document.body.style.overflow = "";
    });
  }

  /* -----------------------------------------------------------------------
     3) NAVIGATION (single controller)
  ----------------------------------------------------------------------- */
  const navToggle = $("#navToggle");
  const navMenu = $("#navMenu");

  function setNav(open) {
    if (!navMenu || !navToggle) return;

    navMenu.classList.toggle("open", open);
    navToggle.classList.toggle("active", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navMenu.hidden = !open;
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.contains("open");
      setNav(!isOpen);
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (!navMenu.classList.contains("open")) return;
      if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
      setNav(false);
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setNav(false);
    });
  }

  /* -----------------------------------------------------------------------
     4) AUDIO TOGGLE (autoplay-safe)
  ----------------------------------------------------------------------- */
  const audio = $("#bgMusic");
  const musicToggle = $("#musicToggle");

  let audioState = {
    enabled: localStorage.getItem("musicEnabled") === "true",
    armed: false
  };

  function updateMusicIcon() {
    if (!musicToggle) return;
    const icon = musicToggle.querySelector("i");
    if (!icon) return;

    icon.className = audioState.enabled
      ? "fa-solid fa-volume-high"
      : "fa-solid fa-volume-xmark";

    musicToggle.setAttribute("aria-pressed", String(audioState.enabled));
  }

  function tryPlayAudio() {
    if (!audio || !audioState.enabled) return;

    audio.play()
      .then(() => {
        audioState.armed = true;
      })
      .catch(() => {
        // iOS needs user gesture — arm instead
        audioState.armed = true;
      });
  }

  if (musicToggle && audio) {
    updateMusicIcon();

    musicToggle.addEventListener("click", () => {
      audioState.enabled = !audioState.enabled;
      localStorage.setItem("musicEnabled", String(audioState.enabled));
      updateMusicIcon();

      if (audioState.enabled) {
        tryPlayAudio();
      } else {
        audio.pause();
      }
    });

    // First user interaction unlocks audio
    document.addEventListener("click", () => {
      if (audioState.enabled && audioState.armed) {
        tryPlayAudio();
      }
    }, { once: true });
  }

  /* -----------------------------------------------------------------------
     5) REDUCED MOTION TOGGLE
  ----------------------------------------------------------------------- */
  const motionToggle = $("#motionToggle");

  function setReducedMotion(enabled) {
    document.documentElement.classList.toggle("reduce-motion", enabled);
    motionToggle?.setAttribute("aria-pressed", String(enabled));
    localStorage.setItem("reduceMotion", String(enabled));
  }

  if (motionToggle) {
    const saved = localStorage.getItem("reduceMotion") === "true";
    setReducedMotion(saved || prefersReducedMotion);

    motionToggle.addEventListener("click", () => {
      const enabled = !document.documentElement.classList.contains("reduce-motion");
      setReducedMotion(enabled);
    });
  }

  /* -----------------------------------------------------------------------
     6) SCROLL TO TOP + READING PROGRESS
  ----------------------------------------------------------------------- */
  const scrollTopBtn = $("#scrollTopBtn");
  const progressBar = $(".reading-progress");

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (progressBar) {
    window.addEventListener("scroll", () => {
      const scrollTop = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const progress = height > 0 ? (scrollTop / height) * 100 : 0;
      progressBar.style.width = `${progress}%`;
    });
  }

  /* -----------------------------------------------------------------------
     7) CHARACTER MODAL (single canonical system)
  ----------------------------------------------------------------------- */
  const modal = $("#characterModal");
  const modalBackdrop = modal?.querySelector("[data-close-modal]");
  const modalClose = modal?.querySelector(".modal-close");

  const modalEls = {
    title: $("#characterModalTitle"),
    role: $("#characterModalRole"),
    quote: $("#characterModalQuote"),
    bio: $("#characterModalBio"),
    icon: $("#characterModalIcon"),
    funFact: $("#characterModalFunFact"),
    responsibilities: $("#characterModalResponsibilities")
  };

  const characterData = {
    pooh: {
      name: "Winnie the Pooh",
      role: "Lover of honey",
      quote: "Sometimes the smallest things take up the most room in your heart.",
      bio: "A gentle bear with a big heart and an even bigger appreciation for honey.",
      iconClass: "pooh-icon-modal",
      funFact: "Pooh is left-handed.",
      responsibilities: ["Honey tasting", "Thoughtful advice", "Quiet friendship"]
    },
    piglet: {
      name: "Piglet",
      role: "Bravest small friend",
      quote: "Even the smallest person can change the course of the future.",
      bio: "Soft-spoken, loyal, and far braver than he realizes.",
      iconClass: "piglet-icon-modal",
      funFact: "Piglet is afraid of many things — except being a good friend.",
      responsibilities: ["Encouragement", "Listening", "Sticking close"]
    },
    tigger: {
      name: "Tigger",
      role: "Bounce specialist",
      quote: "Bouncing is what Tiggers do best!",
      bio: "Endless energy, optimism, and a tendency to land on his friends.",
      iconClass: "tigger-icon-modal",
      funFact: "Tigger can only bounce.",
      responsibilities: ["Morale boosting", "Exploration", "Chaos management"]
    },
    eeyore: {
      name: "Eeyore",
      role: "Quiet observer",
      quote: "It’s not much of a tail, but I’m sort of attached to it.",
      bio: "A thoughtful soul who loves deeply, even when he expects the worst.",
      iconClass: "eeyore-icon-modal",
      funFact: "Eeyore’s house is made of sticks.",
      responsibilities: ["Perspective", "Loyalty", "Honest insight"]
    }
  };

  function openCharacterModal(key) {
    const data = characterData[key];
    if (!data || !modal) return;

    modalEls.title.textContent = data.name;
    modalEls.role.textContent = data.role;
    modalEls.quote.textContent = data.quote;
    modalEls.bio.textContent = data.bio;
    modalEls.funFact.textContent = data.funFact;

    modalEls.icon.className = `modal-character-icon ${data.iconClass}`;

    modalEls.responsibilities.innerHTML = "";
    data.responsibilities.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      modalEls.responsibilities.appendChild(li);
    });

    modal.hidden = false;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeCharacterModal() {
    if (!modal) return;
    modal.classList.remove("active");
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  // Character card wiring
  $$(".character-spotlight").forEach(card => {
    card.addEventListener("click", () => {
      const key = card.dataset.character;
      openCharacterModal(key);
    });
  });

  modalBackdrop?.addEventListener("click", closeCharacterModal);
  modalClose?.addEventListener("click", closeCharacterModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCharacterModal();
  });

  /* -----------------------------------------------------------------------
     8) WISH FORM UX (no backend assumed)
  ----------------------------------------------------------------------- */
  const wishForm = $("#wishForm");
  const wishNote = $("#wishNote");

  if (wishForm) {
    wishForm.addEventListener("submit", (e) => {
      e.preventDefault();
      wishNote.textContent = "Your wish has been sent with love 💛";
      wishForm.reset();
    });
  }

})();