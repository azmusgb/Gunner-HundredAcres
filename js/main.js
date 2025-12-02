// js/main.js
// Core UI: loader, navigation, smooth scroll, RSVP, prompts, audio helper

(function () {
  "use strict";

  function qs(selector) {
    return document.querySelector(selector);
  }
  function qsa(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function initLoader() {
    const loader = qs("#loader");
    if (!loader) return;

    // quick fake "page turn" feel
    window.setTimeout(() => {
      loader.classList.add("loader--hidden");
    }, 1100);
  }

  function initNav() {
    const toggle = qs("#navToggle");
    const list = qs("#storybookNavList");
    if (!toggle || !list) return;

    toggle.addEventListener("click", () => {
      const isOpen = list.classList.toggle("storybook-nav__list--open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Smooth scroll on nav links
    qsa(".storybook-nav__link[href^='#']").forEach((link) => {
      link.addEventListener("click", (e) => {
        const targetId = link.getAttribute("href");
        if (!targetId) return;
        const el = document.querySelector(targetId);
        if (!el) return;

        e.preventDefault();
        list.classList.remove("storybook-nav__list--open");
        toggle.setAttribute("aria-expanded", "false");

        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    // Smooth scroll for skip links too
    qsa(".skip-link[href^='#']").forEach((link) => {
      link.addEventListener("click", (e) => {
        const targetId = link.getAttribute("href");
        if (!targetId) return;
        const el = document.querySelector(targetId);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.focus({ preventScroll: true });
      });
    });
  }

  function initRSVP() {
    const form = qs("#rsvp-form");
    const statusEl = qs("#formStatus");
    if (!form || !statusEl) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = qs("#guestName")?.value.trim();
      const count = qs("#guestCount")?.value;
      const attendance = qs("#attendance")?.value;

      if (!name || !count || !attendance) {
        statusEl.textContent =
          "Please fill in your name, guest count, and attendance so we can save your place in the story.";
        statusEl.style.color = "#b91c1c";
        return;
      }

      // In a static deployment, we just show a friendly confirmation.
      statusEl.textContent =
        "Thank you for your RSVP. If plans change, a quick text is more than enough — we’re just glad you’re part of Gunner’s story.";
      statusEl.style.color = "#166534";

      form.reset();
    });
  }

  function initPrompts() {
    const button = qs("#promptButton");
    const display = qs("#promptText");
    if (!button || !display) return;

    const prompts = [
      "What’s one small, everyday moment you hope Gunner gets to enjoy again and again?",
      "What’s a bit of advice you wish someone had given you earlier in life?",
      "Share a favorite children’s book or story you think should be on Gunner’s shelf.",
      "What’s a tiny tradition you’d start for a new baby in the family?",
      "Finish the sentence: “Gunner, I hope you always remember…”",
      "What’s a mistake you made growing up that turned into a good lesson?",
      "Share a cozy memory that still makes you feel safe when you think of it.",
      "What’s one thing you’d tell Gunner about friendship?",
      "What’s a small act of kindness you still remember from childhood?",
      "If Gunner could borrow one quality from you, what would you hope it is?"
    ];

    button.addEventListener("click", () => {
      const idx = Math.floor(Math.random() * prompts.length);
      display.textContent = prompts[idx];
    });
  }

  function initAudioHelper() {
    const audio = qs("#lullabyAudio");
    if (!audio) return;

    // We can't autoplay; attach to any obvious interaction
    function tryPlay() {
      audio.play().catch(() => {
        // ignore; browser will block until later gestures
      });
      window.removeEventListener("click", tryPlay);
      window.removeEventListener("keydown", tryPlay);
    }

    window.addEventListener("click", tryPlay);
    window.addEventListener("keydown", tryPlay);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initLoader();
    initNav();
    initRSVP();
    initPrompts();
    initAudioHelper();
  });
})();
