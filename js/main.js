// main.js - basic site behaviors for Baby Gunner invite

document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll for header nav links
  const navLinks = document.querySelectorAll('.nav__link[href^="#"]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;
      e.preventDefault();
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // RSVP form (no backend wiring here, just UX feedback)
  const form = document.getElementById('rsvpForm');
  const note = document.getElementById('rsvpNote');
  if (form && note) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      note.textContent = "Thank you! Your RSVP has been noted. If this is a static site, please also text or email the hosts so nothing gets lost in the Wood.";
    });
  }
});
