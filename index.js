:root {
    --pooh-yellow: #FFC42B;
    --pooh-red: #D62E2E;
    --honey-gold: #E6B86A;
    --soft-blue: #B0D0E3;
    --sage-green: #9CAD90;
    --cream: #FFF7EC;
    --text-dark: #43302a;
    --storybook-brown: #8B4513;
    --page-yellow: #FEF9E7;
    --deep-ink: #2f1a0e;
    --shadow-soft: 0 20px 60px rgba(15, 23, 42, 0.16);
    --radius-lg: 24px;
    --radius-pill: 999px;
    --transition-smooth: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    --font-heading: 'Playfair Display', serif;
    --font-body: 'Lato', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

*, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
    scroll-padding-top: 100px;
}

body {
    font-family: var(--font-body);
    background: radial-gradient(circle at top, #FFFDF6 0%, #F7EAD5 40%, #E2D1B5 80%), linear-gradient(180deg, #f4ebdd 0%, #e2cfb5 60%, #d6c2a8 100%);
    color: var(--text-dark);
    -webkit-font-smoothing: antialiased;
    line-height: 1.7;
    overflow-x: hidden;
}

/* Reduced motion */
body.reduce-motion,
body.reduce-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition: none !important;
    scroll-behavior: auto !important;
}

/* Accessibility */
.skip-link {
    position: absolute;
    top: -100px;
    left: 16px;
    background: #fff;
    color: var(--storybook-brown);
    padding: 10px 14px;
    border-radius: 12px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    transition: top 0.3s ease;
    z-index: 1100;
    font-weight: 700;
}

.skip-link:focus-visible {
    top: 16px;
    outline: 3px solid var(--pooh-red);
    outline-offset: 4px;
}

:focus-visible {
    outline: 3px solid var(--pooh-red);
    outline-offset: 4px;
    box-shadow: 0 0 0 4px rgba(255, 196, 43, 0.45);
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

/* Loading screen */
.loading-screen {
    position: fixed;
    inset: 0;
    background: radial-gradient(circle at top, #FFEAA7 0, #FBBF24 35%, #D97706 70%, #7C2D12 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10002;
    transition: opacity 0.6s ease, visibility 0.6s ease;
}

.loading-screen.hidden {
    opacity: 0;
    visibility: hidden;
}

.honey-spinner {
    width: 120px;
    height: 120px;
    position: relative;
    margin-bottom: 25px;
}

.loading-jar {
    width: 80px;
    height: 96px;
    background: var(--honey-gold);
    border-radius: 16px 16px 10px 10px;
    position: relative;
    overflow: hidden;
    margin: 0 auto;
    box-shadow: 0 8px 20px rgba(0,0,0,0.25);
    border: 3px solid #FFF7EC;
}

.loading-honey-fill {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 0%;
    background: linear-gradient(to top, #FFC42B, #FACC15);
    animation: fill-honey 2s ease-in-out infinite;
}

@keyframes fill-honey {
    0%, 100% { height: 25%; }
    50% { height: 92%; }
}

.loading-text {
    font-family: var(--font-heading);
    font-size: 2.2rem;
    color: #FFF;
    text-align: center;
    text-shadow: 0 3px 18px rgba(0,0,0,0.4);
    margin-bottom: 8px;
    letter-spacing: 0.04em;
}

.loading-subtext {
    font-size: 1rem;
    color: #FFF;
    text-align: center;
    opacity: 0.9;
    max-width: 480px;
    line-height: 1.6;
}

.loading-dots {
    display: flex;
    gap: 10px;
    margin-top: 16px;
}

.loading-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: white;
    animation: dot-bounce 1.3s ease-in-out infinite both;
}

.loading-dot:nth-child(1) { animation-delay: -0.28s; }
.loading-dot:nth-child(2) { animation-delay: -0.14s; }

@keyframes dot-bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
}

.loading-hint {
    margin-top: 18px;
    font-size: 0.9rem;
    color: rgba(255,255,255,0.9);
}

/* Nav */
.main-nav {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: rgba(255, 250, 241, 0.96);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(139, 69, 19, 0.14);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    border-radius: 0 0 18px 18px;
    transition: all 0.3s ease;
}

.nav-container {
    max-width: 1240px;
    margin: 0 auto;
    padding: 10px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-brand {
    display: flex;
    flex-direction: column;
    gap: 2px;
    transition: all 0.3s ease;
}

.nav-title {
    font-family: var(--font-heading);
    font-size: 1.6rem;
    color: var(--storybook-brown);
    text-decoration: none;
    letter-spacing: 0.03em;
    transition: all 0.3s ease;
}

.nav-subtitle {
    font-family: var(--font-heading);
    font-style: italic;
    font-size: 1.05rem;
    color: var(--pooh-red);
    transition: all 0.3s ease;
}

.nav-menu {
    display: flex;
    gap: 6px;
    align-items: center;
}

.nav-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 999px;
    text-decoration: none;
    color: var(--storybook-brown);
    font-weight: 700;
    transition: all 0.22s ease;
    border: 1px solid rgba(148, 81, 35, 0.14);
    box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    font-size: 0.9rem;
    white-space: nowrap;
    position: relative;
    overflow: hidden;
}

.nav-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
    transition: left 0.5s ease;
}

.nav-item:hover::before {
    left: 100%;
}

.nav-item i {
    font-size: 0.95rem;
    transition: transform 0.3s ease;
}

.nav-item:hover i {
    transform: scale(1.1);
}

.nav-item:hover,
.nav-item.active {
    background: linear-gradient(135deg, #fdf2cc, #f3d28a);
    color: #5b3a1b;
    border-color: rgba(139, 69, 19, 0.28);
    box-shadow: 0 8px 18px rgba(149, 92, 24, 0.22);
    transform: translateY(-1px);
}

.nav-toggle {
    display: none;
    background: var(--pooh-yellow);
    border: 2px solid var(--storybook-brown);
    border-radius: 12px;
    width: 44px;
    height: 44px;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
}

.nav-toggle::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.nav-toggle:hover::before {
    opacity: 1;
}

.nav-toggle:hover {
    background: var(--pooh-red);
    transform: scale(1.06);
}

.nav-toggle i {
    color: white;
    font-size: 1.3rem;
    transition: transform 0.3s ease;
}

.nav-toggle:hover i {
    transform: rotate(90deg);
}

/* Storybook cover */
.storybook-cover {
    position: fixed;
    inset: 0;
    background: radial-gradient(circle at top, #fff8e8 0%, #f4d9a6 45%, #e4b96f 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10001;
    transition: transform 1.1s cubic-bezier(0.77, 0, 0.175, 1), opacity 0.8s ease;
    transform-style: preserve-3d;
    box-shadow: 0 18px 90px rgba(0,0,0,0.25);
    overflow: hidden;
    padding: 20px;
}

.storybook-cover.closed {
    transform: rotateY(88deg) scale(0.78);
    opacity: 0;
    pointer-events: none;
}

.cover-decoration {
    position: absolute;
    inset: 8%;
    border-radius: 26px;
    border: 2px solid rgba(255,255,255,0.65);
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08), 0 0 60px rgba(0,0,0,0.2);
    background: radial-gradient(circle at center, rgba(255,255,255,0.14) 0, transparent 60%);
}

.cover-title {
    font-family: var(--font-heading);
    font-size: clamp(2.8rem, 6vw, 4.4rem);
    color: #4a2f1e;
    text-align: center;
    margin-bottom: 0.5rem;
    text-shadow: 0 7px 28px rgba(0,0,0,0.22);
    position: relative;
    z-index: 2;
    line-height: 1.08;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

.cover-subtitle {
    font-family: var(--font-heading);
    font-style: italic;
    font-size: clamp(1.9rem, 3.6vw, 2.7rem);
    color: #6f492d;
    text-align: center;
    margin-bottom: 2.1rem;
    opacity: 0.95;
    position: relative;
    z-index: 2;
}

.open-book-btn {
    padding: 13px 34px;
    font-size: 1.1rem;
    background: linear-gradient(135deg, #fef6e4, #f3dfb2);
    color: #6a3d24;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    font-weight: 700;
    box-shadow: 0 10px 26px rgba(0,0,0,0.25);
    transition: all 0.3s ease;
    font-family: var(--font-heading);
    position: relative;
    z-index: 2;
    overflow: hidden;
    letter-spacing: 0.09em;
    text-transform: uppercase;
}

.open-book-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top left, rgba(255,255,255,0.7), transparent 55%);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.open-book-btn:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 14px 32px rgba(0,0,0,0.3);
}

.open-book-btn:hover::after {
    opacity: 1;
}

/* Background */
.honeycomb-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(circle at 25% 25%, rgba(255, 196, 43, 0.06) 0%, transparent 55%), radial-gradient(circle at 75% 75%, rgba(230, 184, 106, 0.08) 0%, transparent 55%), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><path d="M60,0 L90,30 L90,90 L60,120 L30,90 L30,30 Z" fill="%23E6B86A" opacity="0.04"/></svg>');
    background-size: auto, auto, 120px;
    z-index: -3;
    pointer-events: none;
}

.golden-light {
    position: fixed;
    inset: 0;
    background: radial-gradient(ellipse at center, rgba(255, 215, 0, 0.18) 0%, rgba(255, 215, 0, 0) 70%);
    z-index: -1;
    animation: light-pulse 16s ease-in-out infinite;
    pointer-events: none;
}

@keyframes light-pulse {
    0%, 100% { opacity: 0.12; }
    50% { opacity: 0.26; }
}

.enchanted-forest {
    position: fixed;
    inset: 0;
    z-index: -2;
    overflow: hidden;
    opacity: 0.33;
    pointer-events: none;
}

.tree {
    position: absolute;
    bottom: -40px;
    width: 180px;
    height: 220px;
    background: linear-gradient(to right, #8B5A2B, #A0522D);
    border-radius: 20px 20px 0 0;
    transform-origin: bottom;
    box-shadow: 0 0 18px rgba(0,0,0,0.25);
}

.floating-leaf {
    position: absolute;
    width: 40px;
    height: 40px;
    background: radial-gradient(ellipse at center, #BBF7D0, #22C55E);
    border-radius: 50% 0 50% 50%;
    transform: rotate(45deg);
    animation: leaf-fall 15s linear infinite;
    opacity: 0.7;
    filter: drop-shadow(0 5px 5px rgba(0,0,0,0.18));
}

@keyframes leaf-fall {
    0% { transform: translateY(-100vh) rotate(0deg); opacity: 0; }
    10% { opacity: 0.9; }
    90% { opacity: 0.7; }
    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
}

/* Main content shell */
.storybook-shell {
    max-width: 1180px;
    margin: 0 auto;
    padding: 40px 20px 60px;
}

.storybook {
    position: relative;
    width: 100%;
    opacity: 0;
    transition: opacity 1.2s ease;
    background: rgba(255, 252, 244, 0.98);
    border-radius: 28px;
    box-shadow: var(--shadow-soft);
    padding: 34px 32px 40px;
    border: 1px solid rgba(148, 81, 35, 0.22);
    overflow: hidden;
}

.storybook::before {
    content: '';
    position: absolute;
    inset: 16px;
    background-image: linear-gradient(90deg, rgba(255,255,255,0.5) 0, rgba(230, 215, 190, 0.45) 50%, rgba(255,255,255,0.5) 100%);
    opacity: 0.12;
    pointer-events: none;
    mix-blend-mode: multiply;
}

.storybook::after {
    content: '';
    position: absolute;
    top: 16px;
    bottom: 16px;
    left: 50%;
    width: 2px;
    background: linear-gradient(to bottom, rgba(160, 120, 80, 0.0), rgba(160, 120, 80, 0.33), rgba(160, 120, 80, 0.0));
    opacity: 0.7;
}

.storybook.visible {
    opacity: 1;
}

.storybook-inner {
    max-width: 880px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
}

.storybook-header {
    text-align: center;
    margin-bottom: 18px;
}

.storybook-heading {
    font-family: var(--font-heading);
    font-size: 2.35rem;
    color: var(--storybook-brown);
    margin-bottom: 4px;
    letter-spacing: 0.03em;
}

.storybook-subheading {
    font-family: var(--font-heading);
    font-style: italic;
    font-size: 1.5rem;
    color: var(--pooh-red);
}

/* Sections */
.content-section {
    background: var(--page-yellow);
    width: 100%;
    margin: 30px 0;
    border-radius: 22px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14);
    position: relative;
    overflow: hidden;
    padding: 26px 24px 30px;
    transform-style: preserve-3d;
    transition: opacity 0.6s ease, transform 0.6s ease, box-shadow 0.25s ease;
    opacity: 0;
    transform: translateY(32px);
    border: 1px solid rgba(148, 81, 35, 0.18);
}

.content-section.visible {
    opacity: 1;
    transform: translateY(0);
}

.content-section:hover {
    box-shadow: 0 14px 40px rgba(15, 23, 42, 0.18);
}

.content-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle at 5% 5%, rgba(252, 211, 77, 0.15) 0, transparent 45%), radial-gradient(circle at 95% 95%, rgba(252, 211, 77, 0.12) 0, transparent 45%);
    opacity: 0.8;
    pointer-events: none;
}

.content-section-inner {
    position: relative;
    z-index: 1;
}

.section-number {
    position: absolute;
    top: 16px;
    right: 22px;
    font-family: var(--font-heading);
    font-size: 1.4rem;
    color: rgba(67, 48, 42, 0.6);
}

.section-header {
    text-align: center;
    margin-bottom: 18px;
}

.story-title {
    font-family: var(--font-heading);
    font-size: 2.1rem;
    color: var(--pooh-red);
    position: relative;
}

.story-title::after {
    content: '🍯';
    display: block;
    font-size: 1.5rem;
    margin-top: 4px;
    color: var(--pooh-yellow);
}

/* Storytelling */
.story-section {
    margin: 16px 0;
    padding: 20px 20px 18px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    border-left: 4px solid var(--pooh-yellow);
    position: relative;
}

.story-section::before {
    content: '“';
    position: absolute;
    top: -24px;
    left: 14px;
    font-size: 3.6rem;
    color: rgba(250, 204, 21, 0.4);
    font-family: 'Playfair Display', serif;
}

.story-text {
    font-size: 1.04rem;
    line-height: 1.8;
    color: var(--text-dark);
}

.woodland-sign {
    position: relative;
    background: var(--storybook-brown);
    color: white;
    padding: 11px 20px;
    border-radius: 12px;
    margin: 10px auto 16px;
    max-width: 320px;
    text-align: center;
    font-family: var(--font-heading);
    font-size: 1.35rem;
    box-shadow: 0 8px 22px rgba(55, 31, 14, 0.5);
    transform: rotate(-1deg);
    border: 3px solid rgba(250, 204, 21, 0.9);
    cursor: pointer;
    transition: all 0.3s ease;
}

.woodland-sign:hover {
    transform: scale(1.05) rotate(-1deg);
    box-shadow: 0 15px 30px rgba(139, 69, 19, 0.4);
}

.woodland-sign::before {
    content: '';
    position: absolute;
    bottom: -22px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 14px solid transparent;
    border-right: 14px solid transparent;
    border-top: 20px solid var(--storybook-brown);
}

.woodland-sign::after {
    content: '';
    position: absolute;
    bottom: -28px;
    left: 50%;
    transform: translateX(-50%);
    width: 26px;
    height: 26px;
    background: #5D4037;
    border-radius: 999px;
}

/* Character spotlights */
.character-spotlight {
    display: flex;
    align-items: center;
    gap: 18px;
    margin: 18px 0;
    padding: 16px 18px;
    background: radial-gradient(circle at top left, rgba(255, 244, 214, 0.96), #ffffff 60%);
    border-radius: 18px;
    border: 1px solid rgba(148, 81, 35, 0.2);
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.12);
    transition: all 0.25s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.character-spotlight::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top right, rgba(255, 223, 138, 0.2), transparent 60%);
    opacity: 0;
    transition: opacity 0.25s ease;
}

.character-spotlight:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.18);
}

.character-spotlight:hover::before {
    opacity: 1;
}

.character-illustration {
    width: 105px;
    height: 105px;
    border-radius: 999px;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.22);
    border: 4px solid var(--pooh-yellow);
    background: var(--page-yellow);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.25s ease;
}

.character-illustration img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.character-spotlight:hover .character-illustration {
    transform: scale(1.04);
}

.character-spotlight-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.character-quote {
    font-family: var(--font-heading);
    font-size: 1.35rem;
    color: var(--storybook-brown);
    line-height: 1.5;
    text-shadow: 0 1px 0 rgba(255,255,255,0.7);
}

.character-name {
    font-family: var(--font-heading);
    font-weight: 700;
    color: var(--pooh-red);
    font-size: 1rem;
}

/* Invitation details & RSVP */
.invitation-details {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin: 22px 0 10px;
}

.detail-card {
    background: #FFFFFF;
    padding: 16px 16px 14px;
    border-radius: 16px;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
    border-top: 4px solid var(--pooh-yellow);
    transition: all 0.22s ease;
    position: relative;
    overflow: hidden;
}

.detail-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 249, 219, 0.8), transparent);
    opacity: 0;
    transition: opacity 0.22s ease;
}

.detail-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.18);
}

.detail-card:hover::before {
    opacity: 1;
}

.detail-title {
    font-family: var(--font-heading);
    color: var(--pooh-red);
    font-size: 1.1rem;
    margin-bottom: 6px;
}

.detail-content {
    font-size: 0.96rem;
    color: var(--storybook-brown);
    line-height: 1.7;
}

.rsvp-form {
    background: rgba(255, 255, 255, 0.96);
    border-radius: 16px;
    padding: 18px;
    border: 1px solid rgba(148, 81, 35, 0.18);
    box-shadow: 0 12px 26px rgba(15, 23, 42, 0.12);
    margin-top: 12px;
}

.storybook-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.field-label {
    font-weight: 800;
    color: var(--deep-ink);
    font-size: 0.96rem;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.storybook-form .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
}

.storybook-form input,
.storybook-form select,
.storybook-form textarea {
    width: 100%;
    padding: 11px 13px;
    border-radius: 12px;
    border: 2px solid rgba(148, 81, 35, 0.18);
    background: #fff;
    font-family: inherit;
    font-size: 0.98rem;
    color: var(--text-dark);
    transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.storybook-form input:focus,
.storybook-form select:focus,
.storybook-form textarea:focus {
    border-color: var(--pooh-red);
    box-shadow: 0 0 0 3px rgba(214, 46, 46, 0.18);
    outline: none;
    background: #fffdf7;
}

.storybook-form button {
    align-self: flex-start;
}

.form-status {
    margin-top: 4px;
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--deep-ink);
}

/* Buttons */
.magical-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 11px 26px;
    background: radial-gradient(circle at top, #ffe9a8 0, #f7c948 40%, #d69e2e 100%);
    color: var(--deep-ink);
    border: none;
    border-radius: 50px;
    font-family: 'Playfair Display', serif;
    font-size: 1.02rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.32);
    transition: all 0.24s ease;
    text-decoration: none;
    position: relative;
    overflow: hidden;
}

.magical-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top left, rgba(255,255,255,0.7), transparent 55%);
    mix-blend-mode: screen;
    opacity: 0;
    transition: opacity 0.24s ease;
}

.magical-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 26px rgba(15, 23, 42, 0.4);
}

.magical-btn:hover::after {
    opacity: 1;
}

.back-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.9);
    color: var(--storybook-brown);
    border: 1px solid rgba(148, 81, 35, 0.3);
    border-radius: 50px;
    font-family: var(--font-body);
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.24s ease;
    text-decoration: none;
    margin-top: 10px;
}

.back-btn:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

/* Multi-game: selector + containers */
.games-selector {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin: 24px 0;
}

.game-card {
    background: rgba(255, 255, 255, 0.97);
    border-radius: 20px;
    padding: 22px 20px 20px;
    text-align: center;
    border: 2px dashed rgba(250, 204, 21, 0.9);
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.16);
    cursor: pointer;
    transition: all 0.3s ease;
}

.game-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(15, 23, 42, 0.2);
}

.game-card.active {
    border-color: var(--pooh-yellow);
    box-shadow: 0 0 0 3px rgba(255, 196, 43, 0.3);
}

.game-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 15px;
    font-size: 2.5rem;
    color: white;
}

.honey-icon {
    background: var(--pooh-yellow);
}

.defense-icon {
    background: var(--pooh-red);
}

.game-card-title {
    font-family: var(--font-heading);
    font-size: 1.8rem;
    color: var(--pooh-red);
    margin-bottom: 10px;
}

.game-card-description {
    font-size: 1rem;
    color: var(--storybook-brown);
    line-height: 1.6;
    margin-bottom: 15px;
}

.game-container {
    background: rgba(255, 255, 255, 0.97);
    border-radius: 20px;
    padding: 22px 20px 20px;
    margin: 24px 0;
    text-align: center;
    border: 2px dashed rgba(250, 204, 21, 0.9);
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.16);
}

.game-header {
    text-align: center;
    margin-bottom: 18px;
    position: relative;
}

.game-header h1 {
    color: var(--pooh-red);
    text-shadow: 1px 2px 0 #ffccbc;
    font-size: 2rem;
    margin-bottom: 6px;
    animation: bounce 2.4s infinite;
    font-family: var(--font-heading);
    letter-spacing: 0.03em;
}

.game-header p {
    font-size: 0.96rem;
    color: var(--storybook-brown);
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
}

.game-area {
    position: relative;
    width: 100%;
    height: 400px;
    background: linear-gradient(to bottom, #a5d6a7, #81c784);
    border-radius: 16px;
    margin: 16px 0;
    overflow: hidden;
    border: 3px solid var(--storybook-brown);
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    touch-action: none;
}

.game-area.hit {
    animation: hit-shake 0.35s ease;
}

@keyframes hit-shake {
    0% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
    100% { transform: translateX(0); }
}

#honeyCanvas,
#defenseCanvas {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
}

.game-controls {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin: 16px 0;
    flex-wrap: wrap;
}

.game-btn {
    padding: 10px 22px;
    background: linear-gradient(135deg, #ffb74d, #f57c00);
    border: none;
    border-radius: 50px;
    color: white;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 0 #e65100;
    transition: all 0.2s;
    font-size: 0.96rem;
    position: relative;
    overflow: hidden;
}

.game-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    transition: left 0.5s ease;
}

.game-btn:hover::before {
    left: 100%;
}

.game-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 0 #e65100;
}

.game-btn:active:not(:disabled) {
    transform: translateY(1px);
    box-shadow: 0 2px 0 #e65100;
}

.game-btn:disabled {
    background: #bdbdbd;
    box-shadow: 0 4px 0 #757575;
    cursor: not-allowed;
}

.mobile-controls {
    display: none;
    justify-content: center;
    margin: 16px 0;
    gap: 12px;
}

.mobile-control-btn {
    flex: 1;
    padding: 14px;
    max-width: 150px;
    background: linear-gradient(135deg, #ffb74d, #f57c00);
    border: none;
    border-radius: 16px;
    color: white;
    font-weight: bold;
    font-size: 1.4rem;
    box-shadow: 0 4px 0 #e65100;
    touch-action: manipulation;
    user-select: none;
}

.mobile-control-btn:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #e65100;
}

.stats-container {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    margin: 16px 0;
}

.stat {
    background: linear-gradient(135deg, #ffecb3 0%, #ffcc80 100%);
    padding: 10px 10px;
    border-radius: 14px;
    font-size: 1.02em;
    font-weight: bold;
    box-shadow: 0 4px 10px rgba(0,0,0,0.12);
    border: 2px solid #ffb300;
}

.message-box {
    background: #fff8e1;
    border: 3px dashed #ffb300;
    border-radius: 18px;
    padding: 14px 16px;
    margin: 16px 0 10px;
    min-height: 70px;
    font-size: 1.15em;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    position: relative;
    animation: pulse 2.2s infinite;
    font-family: var(--font-heading);
}

@keyframes pulse {
    0%, 100% { border-color: #ffb300; }
    50% { border-color: #ff9800; }
}

.pooh-face {
    font-size: 1.7em;
    margin-right: 8px;
}

.achievements {
    margin-top: 14px;
    padding: 12px 10px 8px;
    background: #ffecb3;
    border-radius: 14px;
    border: 2px solid #ffb300;
    text-align: left;
    font-size: 0.92rem;
}

.achievements h3 {
    margin-bottom: 4px;
    font-size: 0.98rem;
}

.achievement {
    display: inline-block;
    background: #ffcc80;
    padding: 6px 12px;
    margin: 3px;
    border-radius: 999px;
    font-size: 0.82em;
}

.hidden {
    display: none;
}

/* Defense-specific */
.defender-options {
    position: absolute;
    bottom: 10px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 15px;
    padding: 10px;
    z-index: 10;
}

.defender-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid transparent;
    min-width: 70px;
}

.defender-option.active {
    border-color: var(--pooh-yellow);
    background: rgba(255, 244, 184, 0.9);
    transform: scale(1.05);
}

.defender-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 5px;
    font-size: 1.2rem;
    color: white;
    overflow: hidden;
}

.defender-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.pooh-icon { background: var(--pooh-yellow); }
.piglet-icon { background: #F8BBD9; }
.tigger-icon { background: #FF8C42; }

.defender-name {
    font-size: 0.85rem;
    font-weight: bold;
    color: var(--storybook-brown);
    margin-bottom: 3px;
}

.defender-cost {
    font-size: 0.75rem;
    color: var(--pooh-red);
    font-weight: bold;
}

/* Particles */
.particle {
    position: absolute;
    pointer-events: none;
    z-index: 100;
}

/* Reading progress */
.reading-progress {
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 4px;
    background: linear-gradient(90deg, var(--pooh-yellow), var(--pooh-red));
    z-index: 1000;
    transition: width 0.25s ease;
}

/* Character modal */
.character-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.78);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.4s ease;
}

.character-modal.active {
    opacity: 1;
    visibility: visible;
}

.modal-content {
    background: #FEF9E7;
    width: 90%;
    max-width: 620px;
    border-radius: 20px;
    padding: 24px 24px 22px;
    position: relative;
    transform: scale(0.86);
    transition: transform 0.4s ease;
    box-shadow: 0 28px 80px rgba(0,0,0,0.55);
}

.character-modal.active .modal-content {
    transform: scale(1);
}

.close-modal {
    position: absolute;
    top: 12px;
    right: 14px;
    background: none;
    border: none;
    font-size: 1.4rem;
    cursor: pointer;
    color: var(--storybook-brown);
    transition: color 0.22s ease, transform 0.18s ease;
}

.close-modal:hover {
    color: var(--pooh-red);
    transform: scale(1.08);
}

.modal-character {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
}

.modal-character-icon {
    width: 76px;
    height: 76px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    color: white;
    flex-shrink: 0;
    overflow: hidden;
}

.modal-character-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.modal-character-name {
    font-family: 'Playfair Display', serif;
    font-size: 1.8rem;
    color: var(--pooh-red);
}

.modal-character-quote {
    font-family: var(--font-heading);
    font-size: 1.6rem;
    color: var(--storybook-brown);
    margin-bottom: 14px;
    text-align: center;
}

.modal-character-bio {
    font-size: 0.98rem;
    color: var(--storybook-brown);
    line-height: 1.8;
}

.pooh-icon-modal { background: var(--pooh-yellow); }
.piglet-icon-modal { background: #F8BBD9; }
.tigger-icon-modal { background: #FF8C42; }
.eeyore-icon-modal { background: #9CA3AF; }

/* FAB & music */
.fab-container {
    position: fixed;
    bottom: 92px;
    right: 22px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.fab {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: radial-gradient(circle at top, #ffe9a8 0, #f7c948 40%, #d69e2e 100%);
    border: none;
    color: white;
    font-size: 1.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.35);
    transition: all 0.22s ease;
    position: relative;
    overflow: hidden;
}

.fab::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.fab:hover::before {
    opacity: 1;
}

.fab:hover {
    background: radial-gradient(circle at top, #ffdba0 0, #f59e0b 40%, #c05621 100%);
    transform: translateY(-2px) scale(1.04);
}

.music-controls {
    position: fixed;
    bottom: 92px;
    left: 22px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.music-btn,
.accessibility-btn {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: radial-gradient(circle at top, #ffe9a8 0, #f7c948 40%, #d69e2e 100%);
    border: none;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.35);
    transition: all 0.22s ease;
    position: relative;
    overflow: hidden;
}

.music-btn::before,
.accessibility-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.music-btn:hover::before,
.accessibility-btn:hover::before {
    opacity: 1;
}

.music-btn:hover,
.accessibility-btn:hover {
    background: radial-gradient(circle at top, #ffdba0 0, #f59e0b 40%, #c05621 100%);
    transform: translateY(-2px) scale(1.04);
}

/* Footer */
.footer {
    text-align: center;
    padding: 24px 10px 6px;
    margin-top: 34px;
    font-family: var(--font-heading);
    font-size: 1.35rem;
    color: var(--storybook-brown);
    border-top: 1px dashed rgba(250, 204, 21, 0.9);
}

.footer p:last-child {
    font-size: 1.05rem;
    margin-top: 4px;
    opacity: 0.9;
}

/* Responsive */
@media (max-width: 900px) {
    .nav-toggle {
        display: flex;
    }

    .nav-menu {
        position: absolute;
        top: 60px;
        right: 14px;
        background: rgba(255, 250, 241, 0.98);
        padding: 10px;
        border-radius: 16px;
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.25);
        flex-direction: column;
        align-items: flex-start;
        display: none;
    }

    .nav-menu.open {
        display: flex;
    }

    .games-selector {
        grid-template-columns: 1fr;
    }

    .stats-container {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .game-area {
        height: 320px;
    }

    .defender-options {
        gap: 8px;
    }

    .defender-option {
        min-width: 60px;
        padding: 6px 8px;
    }

    .defender-icon {
        width: 30px;
        height: 30px;
        font-size: 1rem;
    }

    .invitation-details {
        grid-template-columns: 1fr;
    }

    .mobile-controls {
        display: flex;
    }
}

@media (max-width: 520px) {
    .game-controls {
        flex-direction: column;
    }

    .storybook {
        padding: 26px 18px 32px;
    }

    .game-area {
        height: 260px;
    }
}
