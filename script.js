/* ==================== STORYBOOK CUSTOM PROPERTIES ==================== */
:root {
  --storybook-parchment: #fffaf0;
  --storybook-page: #fef9f3;
  --storybook-ink: #2c1810;
  --storybook-gold: #d4a017;
  --storybook-honey: #ffb347;
  --storybook-forest: #2d5a27;
  --storybook-leaf: #7ca982;
  --storybook-poppy: #ff6b6b;
  --storybook-shadow: 0 10px 30px rgba(44, 24, 16, 0.1);
  --storybook-border: #e8d8b6;
  --storybook-highlight: #fff9e6;
  --pooh-yellow: #ffc72c;
  --pooh-red: #da291c;
  --pooh-brown: #8b4513;
}

/* ==================== STORYBOOK BASE STYLES ==================== */
body {
  font-family: 'Georgia', 'Times New Roman', serif;
  background: linear-gradient(to bottom, #fff8e1, #fff0d6);
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(212, 160, 23, 0.05) 0%, transparent 20%),
    radial-gradient(circle at 90% 80%, rgba(125, 169, 130, 0.05) 0%, transparent 20%),
    url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23d4a017' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
  color: var(--storybook-ink);
  line-height: 1.6;
  letter-spacing: 0.3px;
}

.storybook-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  position: relative;
}

.storybook-main::before {
  content: '';
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 1200px;
  height: 100%;
  background: 
    linear-gradient(90deg, transparent 95%, rgba(212, 160, 23, 0.05) 100%),
    linear-gradient(90deg, rgba(212, 160, 23, 0.05) 0%, transparent 5%);
  pointer-events: none;
  z-index: 1;
}

/* ==================== STORYBOOK LOADER ==================== */
.storybook-loader {
  background: linear-gradient(135deg, #fff0d6, #ffe4b5);
  font-family: 'Schoolbell', cursive;
}

.storybook-loader__text-container {
  text-align: center;
  margin-top: 30px;
}

.storybook-loader__text {
  font-size: 1.2rem;
  color: var(--storybook-gold);
  margin-bottom: 20px;
}

.storybook-loader__book {
  display: flex;
  justify-content: center;
  gap: 5px;
}

.book-page {
  width: 30px;
  height: 40px;
  background: var(--storybook-page);
  border: 2px solid var(--storybook-border);
  border-radius: 3px;
  animation: pageTurn 1.5s ease-in-out infinite;
  transform-origin: left center;
}

.book-page:nth-child(2) { animation-delay: 0.2s; }
.book-page:nth-child(3) { animation-delay: 0.4s; }

@keyframes pageTurn {
  0%, 100% { transform: rotateY(0); }
  50% { transform: rotateY(-30deg); }
}

/* ==================== STORYBOOK NAVIGATION ==================== */
.storybook-nav {
  background: linear-gradient(to bottom, #fff8e1, #f5e6d3);
  border-bottom: 3px double var(--storybook-border);
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 100;
}

.storybook-nav::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--storybook-gold), var(--storybook-leaf), var(--storybook-poppy));
}

.storybook-nav__book {
  display: flex;
  align-items: center;
  gap: 15px;
}

.storybook-nav__book-spine {
  width: 20px;
  height: 50px;
  background: linear-gradient(to bottom, #8b4513, #654321);
  border-radius: 3px;
  position: relative;
}

.storybook-nav__book-spine::after {
  content: '';
  position: absolute;
  top: 10px;
  left: 5px;
  right: 5px;
  height: 30px;
  background: linear-gradient(to bottom, #d4a017, transparent);
  border-radius: 2px;
}

.storybook-nav__book-cover {
  padding: 10px 15px;
  background: var(--pooh-red);
  border-radius: 5px;
  color: white;
  box-shadow: var(--storybook-shadow);
  border: 2px solid #8b4513;
}

.storybook-nav__title {
  font-size: 0.8rem;
  opacity: 0.9;
  font-family: 'Schoolbell', cursive;
}

.storybook-nav__main-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.4rem;
  font-weight: bold;
  margin: 2px 0;
}

.storybook-nav__subtitle {
  font-size: 0.7rem;
  opacity: 0.8;
  font-style: italic;
}

.storybook-nav__links {
  display: flex;
  gap: 10px;
}

.storybook-nav__link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px 15px;
  background: var(--storybook-page);
  border: 2px solid var(--storybook-border);
  border-radius: 8px;
  color: var(--storybook-ink);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  min-width: 80px;
}

.storybook-nav__link:hover {
  background: var(--storybook-highlight);
  transform: translateY(-2px);
  box-shadow: var(--storybook-shadow);
  border-color: var(--storybook-gold);
}

.storybook-nav__link i {
  font-size: 1.2rem;
  color: var(--storybook-gold);
}

/* ==================== STORYBOOK COVER ==================== */
.storybook-cover {
  background: linear-gradient(135deg, #fff0d6, #ffe8bd);
  border: 15px solid var(--storybook-page);
  border-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,0 L100,0 L100,100 L0,100 Z' fill='none' stroke='%23d4a017' stroke-width='10' stroke-dasharray='10,5'/%3E%3C/svg%3E") 30 stretch;
  padding: 60px 40px;
  position: relative;
  margin-bottom: 50px;
}

.storybook-cover__decoration {
  position: absolute;
  top: 20px;
  width: 100px;
  height: 100%;
}

.storybook-cover__decoration--left {
  left: 20px;
}

.storybook-cover__decoration--right {
  right: 20px;
  transform: scaleX(-1);
}

.storybook-vine {
  position: absolute;
  width: 3px;
  height: 80%;
  background: var(--storybook-leaf);
  left: 50%;
  transform: translateX(-50%);
}

.storybook-vine::before,
.storybook-vine::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--storybook-leaf);
  opacity: 0.3;
}

.storybook-vine::before {
  top: 20%;
  left: -8px;
}

.storybook-vine::after {
  top: 60%;
  right: -8px;
}

.storybook-cover__title-container {
  text-align: center;
  margin-bottom: 40px;
}

.storybook-cover__eyebrow {
  font-family: 'Schoolbell', cursive;
  font-size: 1.2rem;
  color: var(--storybook-gold);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 3px;
}

.storybook-cover__title {
  font-family: 'Playfair Display', serif;
  font-size: 3.5rem;
  color: var(--storybook-ink);
  margin: 10px 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.storybook-cover__subtitle {
  font-size: 1.3rem;
  color: var(--storybook-forest);
  font-style: italic;
  margin-top: 10px;
}

.storybook-cover__quote {
  max-width: 600px;
  margin: 40px auto;
  padding: 30px;
  background: var(--storybook-page);
  border-left: 5px solid var(--storybook-gold);
  border-right: 5px solid var(--storybook-gold);
  position: relative;
  box-shadow: var(--storybook-shadow);
}

.storybook-quote-mark {
  position: absolute;
  font-size: 4rem;
  color: var(--storybook-gold);
  font-family: 'Playfair Display', serif;
  opacity: 0.5;
}

.storybook-quote-mark--left {
  top: 10px;
  left: 10px;
}

.storybook-quote-mark--right {
  bottom: 10px;
  right: 10px;
}

.storybook-cover__quote-text {
  font-size: 1.5rem;
  font-style: italic;
  color: var(--storybook-ink);
  text-align: center;
  line-height: 1.8;
  margin: 0;
}

.storybook-cover__quote-author {
  text-align: right;
  font-family: 'Schoolbell', cursive;
  color: var(--storybook-gold);
  margin-top: 15px;
  font-size: 1.1rem;
}

.storybook-cover__cta {
  justify-content: center;
  margin: 40px 0;
}

.storybook-btn {
  font-family: 'Georgia', serif;
  padding: 15px 30px;
  font-size: 1.1rem;
  border: 3px solid var(--storybook-border);
  background: linear-gradient(to bottom, var(--storybook-page), #f5e6d3);
  color: var(--storybook-ink);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.storybook-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.storybook-btn:hover::before {
  left: 100%;
}

.storybook-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  border-color: var(--storybook-gold);
}

.storybook-btn--secondary {
  background: linear-gradient(to bottom, var(--storybook-highlight), #fff0d6);
}

.storybook-cover__stats {
  max-width: 800px;
  margin: 40px auto 0;
}

.storybook-stat {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: var(--storybook-page);
  border: 2px solid var(--storybook-border);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.storybook-stat:hover {
  transform: translateY(-5px);
  border-color: var(--storybook-gold);
  box-shadow: var(--storybook-shadow);
}

.storybook-stat__icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--storybook-highlight);
  border-radius: 50%;
  border: 2px solid var(--storybook-border);
}

.storybook-stat__content {
  flex: 1;
}

.storybook-stat__content strong {
  display: block;
  font-size: 1.1rem;
  color: var(--storybook-forest);
  margin-bottom: 5px;
}

.storybook-stat__content span {
  color: var(--storybook-ink);
  opacity: 0.8;
  font-size: 0.95rem;
}

/* ==================== POOH CHARACTER STYLES ==================== */
.storybook-pooh-character {
  position: absolute;
  right: 60px;
  bottom: 60px;
  width: 200px;
  height: 250px;
}

.pooh-character {
  position: relative;
  width: 100%;
  height: 100%;
}

.pooh-head {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 120px;
}

.pooh-ear {
  position: absolute;
  width: 40px;
  height: 40px;
  background: var(--pooh-yellow);
  border-radius: 50%;
  border: 3px solid var(--pooh-brown);
}

.pooh-ear--left {
  top: 10px;
  left: 15px;
  transform: rotate(-20deg);
}

.pooh-ear--right {
  top: 10px;
  right: 15px;
  transform: rotate(20deg);
}

.pooh-face {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 90px;
  background: var(--pooh-yellow);
  border-radius: 50%;
  border: 3px solid var(--pooh-brown);
  overflow: hidden;
}

.pooh-eyes {
  position: absolute;
  top: 25px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  display: flex;
  justify-content: space-between;
}

.pooh-eye {
  width: 15px;
  height: 15px;
  background: var(--pooh-brown);
  border-radius: 50%;
}

.pooh-snout {
  position: absolute;
  bottom: 25px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 35px;
  background: #ffdb58;
  border-radius: 50%;
  border: 2px solid var(--pooh-brown);
}

.pooh-mouth {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 15px;
  border-bottom: 3px solid var(--pooh-brown);
  border-radius: 0 0 15px 15px;
}

.pooh-body {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 140px;
  height: 140px;
  background: var(--pooh-red);
  border-radius: 50% 50% 40% 40%;
  border: 3px solid var(--pooh-brown);
}

.pooh-arm {
  position: absolute;
  width: 40px;
  height: 80px;
  background: var(--pooh-yellow);
  border-radius: 20px;
  border: 3px solid var(--pooh-brown);
}

.pooh-arm--left {
  top: 30px;
  left: -20px;
  transform: rotate(-30deg);
}

.pooh-arm--right {
  top: 30px;
  right: -20px;
  transform: rotate(30deg);
}

.pooh-honey-pot {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.honey-pot {
  position: relative;
  width: 80px;
  height: 60px;
}

.honey-pot__body {
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, #ffd700, #daa520);
  border-radius: 20px 20px 10px 10px;
  border: 3px solid #8b4513;
  position: relative;
  overflow: hidden;
}

.honey-pot__body::after {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  background: linear-gradient(to bottom, #ffef00, #ffd700);
  border-radius: 10px;
}

.honey-pot__handle {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 20px;
  border: 5px solid #8b4513;
  border-bottom: none;
  border-radius: 30px 30px 0 0;
}

.honey-pot__lid {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  width: 90px;
  height: 15px;
  background: #654321;
  border-radius: 10px 10px 0 0;
  border: 3px solid #8b4513;
}

.honey-drips {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
}

.honey-drip {
  width: 10px;
  height: 30px;
  background: linear-gradient(to bottom, #ffd700, transparent);
  border-radius: 5px;
  margin: 0 5px;
  display: inline-block;
  animation: dripAnimation 2s ease-in-out infinite;
}

.honey-drip:nth-child(2) { animation-delay: 0.4s; }
.honey-drip:nth-child(3) { animation-delay: 0.8s; }

@keyframes dripAnimation {
  0%, 100% { transform: translateY(0) scaleY(1); }
  50% { transform: translateY(20px) scaleY(1.2); }
}

/* ==================== STORYBOOK NOTES ==================== */
.storybook-notes {
  position: absolute;
  left: 30px;
  bottom: 30px;
}

.storybook-note {
  position: relative;
  margin-bottom: 15px;
  max-width: 200px;
}

.storybook-note__pin {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 16px;
  background: #c0c0c0;
  border-radius: 50%;
  z-index: 2;
}

.storybook-note__pin::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  width: 8px;
  height: 8px;
  background: #ff6b6b;
  border-radius: 50%;
}

.storybook-note__content {
  background: #ffff88;
  padding: 15px;
  border-radius: 5px;
  font-family: 'Schoolbell', cursive;
  font-size: 0.9rem;
  color: #333;
  border: 1px dashed #ff6b6b;
  position: relative;
  transform: rotate(-2deg);
  box-shadow: 3px 3px 5px rgba(0,0,0,0.1);
}

.storybook-note--2 {
  transform: rotate(1deg);
  margin-left: 30px;
}

.storybook-note--3 {
  transform: rotate(-3deg);
}

/* ==================== STORYBOOK BEE ==================== */
.storybook-bee {
  position: absolute;
  top: 50px;
  right: 150px;
  animation: beeFly 8s ease-in-out infinite;
}

.bee-body {
  width: 40px;
  height: 25px;
  background: linear-gradient(to right, #ffd700, #ffa500);
  border-radius: 50%;
  position: relative;
  border: 2px solid #333;
}

.bee-wing {
  position: absolute;
  width: 25px;
  height: 25px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  top: -10px;
  animation: beeWingFlap 0.3s ease-in-out infinite;
}

.bee-wing--left {
  left: -5px;
  animation-delay: 0.15s;
}

.bee-wing--right {
  right: -5px;
}

.bee-stripe {
  position: absolute;
  width: 100%;
  height: 5px;
  background: #333;
  left: 0;
}

.bee-stripe:nth-child(3) { top: 25%; }
.bee-stripe:nth-child(4) { top: 50%; }
.bee-stripe:nth-child(5) { top: 75%; }

@keyframes beeFly {
  0%, 100% { transform: translate(0, 0) rotate(0); }
  25% { transform: translate(20px, -15px) rotate(5deg); }
  50% { transform: translate(-15px, 10px) rotate(-5deg); }
  75% { transform: translate(10px, -5px) rotate(3deg); }
}

@keyframes beeWingFlap {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.8); }
}

/* ==================== STORYBOOK PAGE TURN ==================== */
.storybook-page-turn {
  text-align: center;
  margin: 40px 0;
  padding: 20px;
  position: relative;
}

.storybook-page-turn::before,
.storybook-page-turn::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--storybook-gold), transparent);
}

.storybook-page-turn::before { top: 0; }
.storybook-page-turn::after { bottom: 0; }

.storybook-page-turn__content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.storybook-page-turn__icon {
  font-size: 2rem;
  animation: pageTurnIcon 2s ease-in-out infinite;
}

@keyframes pageTurnIcon {
  0%, 100% { transform: rotateY(0); }
  50% { transform: rotateY(180deg); }
}

/* ==================== STORYBOOK TABLE OF CONTENTS ==================== */
.storybook-toc {
  background: var(--storybook-page);
  border: 3px double var(--storybook-border);
  padding: 40px;
  margin: 40px 0;
  position: relative;
}

.storybook-toc::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border: 1px solid rgba(212, 160, 23, 0.2);
  pointer-events: none;
}

.storybook-toc__header {
  text-align: center;
  margin-bottom: 40px;
}

.storybook-toc__title {
  font-family: 'Playfair Display', serif;
  font-size: 2.5rem;
  color: var(--storybook-ink);
  margin-bottom: 10px;
}

.storybook-toc__subtitle {
  color: var(--storybook-gold);
  font-style: italic;
  font-size: 1.1rem;
}

.storybook-toc__chapters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.storybook-toc__chapter {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: var(--storybook-highlight);
  border: 2px solid var(--storybook-border);
  border-radius: 10px;
  text-decoration: none;
  color: var(--storybook-ink);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.storybook-toc__chapter::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.storybook-toc__chapter:hover::before {
  left: 100%;
}

.storybook-toc__chapter:hover {
  transform: translateX(10px);
  border-color: var(--storybook-gold);
  box-shadow: var(--storybook-shadow);
}

.storybook-toc__number {
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  color: var(--storybook-gold);
  min-width: 60px;
}

.storybook-toc__content {
  flex: 1;
}

.storybook-toc__content h3 {
  font-size: 1.2rem;
  color: var(--storybook-forest);
  margin-bottom: 5px;
}

.storybook-toc__content p {
  font-size: 0.9rem;
  color: var(--storybook-ink);
  opacity: 0.8;
  margin: 0;
}

.storybook-toc__arrow {
  font-size: 1.5rem;
  color: var(--storybook-gold);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.storybook-toc__chapter:hover .storybook-toc__arrow {
  opacity: 1;
  transform: translateX(0);
}

/* ==================== STORYBOOK CHAPTERS ==================== */
.storybook-chapter {
  background: var(--storybook-page);
  border: 2px solid var(--storybook-border);
  padding: 50px;
  margin: 60px 0;
  position: relative;
  box-shadow: var(--storybook-shadow);
}

.storybook-chapter::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border: 1px solid rgba(212, 160, 23, 0.1);
  z-index: -1;
}

.storybook-chapter__header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
}

.storybook-chapter__number {
  font-family: 'Playfair Display', serif;
  font-size: 4rem;
  color: rgba(212, 160, 23, 0.2);
  position: absolute;
  top: -30px;
  left: 0;
  right: 0;
  z-index: 0;
}

.storybook-chapter__title {
  font-family: 'Playfair Display', serif;
  font-size: 2.5rem;
  color: var(--storybook-ink);
  position: relative;
  z-index: 1;
  margin-bottom: 20px;
}

.storybook-chapter__illustration {
  height: 100px;
  position: relative;
  margin-top: 20px;
}

.storybook-tree {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 80px;
  background: #8b4513;
  border-radius: 5px;
}

.storybook-tree::before {
  content: '';
  position: absolute;
  top: -30px;
  left: -30px;
  right: -30px;
  height: 60px;
  background: #2d5a27;
  border-radius: 50%;
}

.storybook-tree--small {
  left: 30%;
  transform: scale(0.7);
}

.storybook-bird {
  position: absolute;
  top: 20px;
  right: 30%;
  width: 20px;
  height: 10px;
  background: #ff6b6b;
  border-radius: 50%;
  animation: birdFly 3s ease-in-out infinite;
}

.storybook-bird::before {
  content: '';
  position: absolute;
  top: -5px;
  right: -8px;
  width: 15px;
  height: 8px;
  background: #ff6b6b;
  clip-path: polygon(100% 0, 0 50%, 100% 100%);
}

@keyframes birdFly {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.storybook-sun {
  position: absolute;
  top: 20px;
  left: 40%;
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, #ffd700, #ff8c00);
  border-radius: 50%;
  animation: sunGlow 4s ease-in-out infinite;
}

@keyframes sunGlow {
  0%, 100% { box-shadow: 0 0 20px #ffd700; }
  50% { box-shadow: 0 0 40px #ff8c00; }
}

.storybook-cloud {
  position: absolute;
  top: 30px;
  right: 40%;
  width: 80px;
  height: 40px;
  background: white;
  border-radius: 40px;
  animation: cloudFloat 6s ease-in-out infinite;
}

.storybook-cloud::before,
.storybook-cloud::after {
  content: '';
  position: absolute;
  background: white;
  border-radius: 50%;
}

.storybook-cloud::before {
  width: 50px;
  height: 50px;
  top: -25px;
  left: 10px;
}

.storybook-cloud::after {
  width: 40px;
  height: 40px;
  top: -20px;
  right: 10px;
}

@keyframes cloudFloat {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(20px); }
}

.storybook-quill {
  position: absolute;
  top: 30px;
  left: 45%;
  width: 60px;
  height: 3px;
  background: #8b4513;
  transform: rotate(45deg);
}

.storybook-quill::before {
  content: '';
  position: absolute;
  top: -5px;
  left: 40px;
  width: 20px;
  height: 15px;
  background: #ff6b6b;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
}

.storybook-ink-spot {
  position: absolute;
  top: 50px;
  right: 45%;
  width: 30px;
  height: 30px;
  background: #2c1810;
  border-radius: 50%;
  opacity: 0.7;
}

.storybook-paw-print {
  position: absolute;
  width: 30px;
  height: 30px;
  background: #8b4513;
  border-radius: 50%;
  opacity: 0.3;
}

.storybook-paw-print:nth-child(1) {
  top: 30px;
  left: 40%;
  transform: rotate(20deg);
}

.storybook-paw-print:nth-child(2) {
  top: 50px;
  left: 45%;
  transform: rotate(-10deg);
}

.storybook-paw-print:nth-child(3) {
  top: 40px;
  right: 40%;
  transform: rotate(-20deg);
}

.storybook-honeycomb {
  position: absolute;
  top: 30px;
  left: 45%;
  width: 60px;
  height: 70px;
  background: 
    linear-gradient(60deg, transparent 47%, #ffd700 50%, transparent 53%),
    linear-gradient(-60deg, transparent 47%, #ffd700 50%, transparent 53%);
  background-size: 30px 30px;
  opacity: 0.5;
}

.storybook-honey-drip {
  position: absolute;
  top: 70px;
  right: 45%;
  width: 15px;
  height: 40px;
  background: linear-gradient(to bottom, #ffd700, transparent);
  border-radius: 7px;
  animation: honeyDrip 3s ease-in-out infinite;
}

@keyframes honeyDrip {
  0%, 100% { transform: translateY(0); height: 40px; }
  50% { transform: translateY(20px); height: 60px; }
}

.storybook-envelope {
  position: absolute;
  top: 30px;
  left: 45%;
  width: 60px;
  height: 40px;
  background: #ff6b6b;
  border-radius: 5px;
}

.storybook-envelope::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 0;
  width: 0;
  height: 0;
  border-left: 30px solid transparent;
  border-right: 30px solid transparent;
  border-bottom: 20px solid #ff6b6b;
}

.storybook-pen {
  position: absolute;
  top: 50px;
  right: 45%;
  width: 50px;
  height: 3px;
  background: #2c1810;
  transform: rotate(-45deg);
}

/* ==================== STORYBOOK TEXT STYLES ==================== */
.storybook-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--storybook-ink);
  max-width: 800px;
  margin: 0 auto 40px;
}

.storybook-dropcap::first-letter {
  float: left;
  font-family: 'Playfair Display', serif;
  font-size: 4rem;
  line-height: 1;
  margin: 0.1em 0.1em 0 0;
  color: var(--storybook-gold);
}

.storybook-quote--inline {
  margin: 30px 0;
  padding: 20px;
  background: var(--storybook-highlight);
  border-left: 5px solid var(--storybook-gold);
  font-style: italic;
  position: relative;
}

.storybook-quote--inline::before {
  content: '"';
  position: absolute;
  top: -10px;
  left: 10px;
  font-size: 3rem;
  color: var(--storybook-gold);
  opacity: 0.3;
  font-family: 'Playfair Display', serif;
}

/* ==================== STORYBOOK CARDS ==================== */
.storybook-cards {
  gap: 30px;
}

.storybook-card {
  border: 2px solid var(--storybook-border);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.storybook-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.storybook-card:hover::before {
  left: 100%;
}

.storybook-card:hover {
  transform: translateY(-10px);
  border-color: var(--storybook-gold);
  box-shadow: var(--storybook-shadow);
}

.storybook-card__icon {
  background: var(--storybook-highlight);
  border: 2px solid var(--storybook-border);
}

/* ==================== STORYBOOK DETAILS ==================== */
.storybook-details {
  gap: 30px;
}

.storybook-detail {
  border: 2px solid var(--storybook-border);
  transition: all 0.3s ease;
  position: relative;
}

.storybook-detail:hover {
  transform: translateY(-5px);
  border-color: var(--storybook-gold);
  box-shadow: var(--storybook-shadow);
}

.storybook-detail__icon {
  font-size: 2rem;
  margin-bottom: 15px;
  display: inline-block;
}

/* ==================== STORYBOOK EXPERIENCES ==================== */
.storybook-experiences {
  gap: 30px;
}

.storybook-experience {
  border: 2px solid var(--storybook-border);
  transition: all 0.3s ease;
}

.storybook-experience:hover {
  transform: translateY(-5px);
  border-color: var(--storybook-gold);
  box-shadow: var(--storybook-shadow);
}

.storybook-badge {
  border: 1px solid var(--storybook-border);
}

.storybook-prompt {
  margin-top: 20px;
}

.storybook-prompt-btn {
  background: linear-gradient(to bottom, var(--storybook-page), #f5e6d3);
  border: 2px solid var(--storybook-border);
  color: var(--storybook-ink);
  font-family: 'Georgia', serif;
}

.storybook-prompt-btn:hover {
  border-color: var(--storybook-gold);
  transform: translateY(-2px);
}

.storybook-prompt-text {
  background: var(--storybook-highlight);
  border: 1px dashed var(--storybook-gold);
  font-family: 'Schoolbell', cursive;
  font-size: 1.1rem;
}

.storybook-list {
  gap: 10px;
}

.storybook-list li {
  padding: 8px 0;
  border-bottom: 1px dotted var(--storybook-border);
}

.storybook-list li:last-child {
  border-bottom: none;
}

.storybook-chip-row {
  margin-top: 15px;
}

.storybook-chip {
  background: var(--storybook-highlight);
  border: 1px solid var(--storybook-border);
  font-family: 'Georgia', serif;
}

.storybook-sound-toggle {
  margin-top: 20px;
}

.storybook-sound-toggle__label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.storybook-sound-toggle__slider {
  width: 50px;
  height: 25px;
  background: var(--storybook-border);
  border-radius: 25px;
  position: relative;
  transition: background 0.3s ease;
}

.storybook-sound-toggle__slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 21px;
  height: 21px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.storybook-sound-toggle__label input:checked + .storybook-sound-toggle__slider {
  background: var(--storybook-gold);
}

.storybook-sound-toggle__label input:checked + .storybook-sound-toggle__slider::before {
  transform: translateX(25px);
}

.storybook-sound-toggle__text {
  font-size: 0.9rem;
  color: var(--storybook-ink);
}

/* ==================== STORYBOOK CHARACTERS ==================== */
.storybook-chapter--characters {
  background: linear-gradient(135deg, #fffaf0, #fff0d6);
}

.storybook-characters {
  gap: 20px;
}

.storybook-character-card {
  border: 2px solid var(--storybook-border);
  transition: all 0.3s ease;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.storybook-character-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.storybook-character-card:hover::before {
  left: 100%;
}

.storybook-character-card:hover {
  transform: translateY(-5px);
  border-color: var(--storybook-gold);
  box-shadow: var(--storybook-shadow);
}

.storybook-character-avatar {
  width: 70px;
  height: 70px;
  border-radius: 20px;
  border: 3px solid var(--storybook-border);
  display: grid;
  place-items: center;
  font-size: 2rem;
  transition: all 0.3s ease;
}

.storybook-character-avatar--pooh {
  background: linear-gradient(135deg, var(--pooh-yellow), #ffdb58);
  position: relative;
}

.pooh-mini {
  position: relative;
  width: 40px;
  height: 40px;
}

.pooh-mini-ear {
  position: absolute;
  top: 0;
  width: 15px;
  height: 15px;
  background: var(--pooh-yellow);
  border-radius: 50%;
  border: 2px solid var(--pooh-brown);
}

.pooh-mini-ear:nth-child(1) { left: 0; }
.pooh-mini-ear:nth-child(2) { right: 0; }

.pooh-mini-face {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 35px;
  height: 30px;
  background: var(--pooh-yellow);
  border-radius: 50%;
  border: 2px solid var(--pooh-brown);
}

.storybook-character-avatar--piglet {
  background: linear-gradient(135deg, #ffb6c1, #ff8ba0);
}

.storybook-character-avatar--tigger {
  background: linear-gradient(135deg, #ff8c00, #ff4500);
}

.storybook-character-avatar--eeyore {
  background: linear-gradient(135deg, #a9a9a9, #808080);
}

.storybook-character-avatar--rabbit {
  background: linear-gradient(135deg, #fffacd, #f0e68c);
}

.storybook-character-avatar--owl {
  background: linear-gradient(135deg, #8b4513, #654321);
  color: white;
}

.storybook-character-info {
  flex: 1;
}

.storybook-character-quote {
  font-family: 'Schoolbell', cursive;
  color: var(--storybook-gold);
  font-size: 0.9rem;
  margin-top: 5px;
  font-style: italic;
}

.storybook-character-btn {
  border: 2px solid var(--storybook-border);
  transition: all 0.3s ease;
}

.storybook-character-btn:hover {
  background: var(--storybook-highlight);
  border-color: var(--storybook-gold);
  transform: scale(1.1);
}

/* ==================== STORYBOOK GAME ==================== */
.storybook-chapter--game {
  background: linear-gradient(135deg, #fffaf0, #fff5e6);
}

.storybook-game-intro {
  text-align: center;
  max-width: 800px;
  margin: 0 auto 40px;
  padding: 30px;
  background: var(--storybook-highlight);
  border: 2px solid var(--storybook-border);
  border-radius: 15px;
}

.storybook-game-instruction {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.storybook-game-keys {
  display: flex;
  gap: 5px;
}

.storybook-game-keys kbd {
  padding: 8px 12px;
  background: var(--storybook-page);
  border: 2px solid var(--storybook-border);
  border-radius: 5px;
  font-family: monospace;
  font-size: 1.1rem;
  color: var(--storybook-ink);
  box-shadow: 2px 2px 0 var(--storybook-border);
}

.storybook-game {
  background: linear-gradient(135deg, #fffaf0, #fff5e6);
  border: 3px solid var(--storybook-border);
  padding: 30px;
  border-radius: 20px;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.05);
}

.storybook-game-hud {
  gap: 15px;
}

.storybook-game-stat {
  background: var(--storybook-page);
  border: 2px solid var(--storybook-border);
  border-radius: 15px;
  padding: 15px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.storybook-game-stat::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.storybook-game-stat:hover::before {
  left: 100%;
}

.storybook-game-stat:hover {
  transform: translateY(-3px);
  border-color: var(--storybook-gold);
  box-shadow: var(--storybook-shadow);
}

.storybook-game-stat span {
  font-size: 0.9rem;
  color: var(--storybook-ink);
  opacity: 0.8;
  display: block;
  margin-bottom: 5px;
}

.storybook-game-stat strong {
  font-size: 2rem;
  color: var(--storybook-forest);
  font-family: 'Playfair Display', serif;
}

.storybook-game-stat--combo strong {
  color: var(--storybook-gold);
}

.storybook-game-stat--best strong {
  color: var(--storybook-poppy);
}

.storybook-game-canvas {
  border: 5px solid var(--storybook-border);
  border-radius: 15px;
  overflow: hidden;
  position: relative;
  height: 500px;
  margin: 20px 0;
  background: linear-gradient(180deg, #87ceeb, #e0f7ff);
}

.storybook-game-pooh {
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 150px;
  pointer-events: none;
  z-index: 10;
  transition: left 0.1s linear;
}

.game-pooh {
  position: relative;
  width: 100%;
  height: 100%;
  animation: poohBounce 2s ease-in-out infinite;
}

.game-pooh__head {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 80px;
}

.game-pooh__ear {
  position: absolute;
  width: 25px;
  height: 25px;
  background: var(--pooh-yellow);
  border-radius: 50%;
  border: 2px solid var(--pooh-brown);
  top: 5px;
  animation: earWiggle 3s ease-in-out infinite;
}

.game-pooh__ear--left {
  left: 10px;
  transform: rotate(-20deg);
  animation-delay: 0.5s;
}

.game-pooh__ear--right {
  right: 10px;
  transform: rotate(20deg);
}

.game-pooh__face {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 65px;
  background: var(--pooh-yellow);
  border-radius: 50%;
  border: 2px solid var(--pooh-brown);
  overflow: hidden;
}

.game-pooh__eyes {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  display: flex;
  justify-content: space-between;
}

.game-pooh__eye {
  width: 10px;
  height: 10px;
  background: var(--pooh-brown);
  border-radius: 50%;
  animation: eyeBlink 4s ease-in-out infinite;
}

.game-pooh__snout {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 25px;
  background: #ffdb58;
  border-radius: 50%;
  border: 2px solid var(--pooh-brown);
}

.game-pooh__mouth {
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 25px;
  height: 10px;
  border-bottom: 3px solid var(--pooh-brown);
  border-radius: 0 0 12px 12px;
}

.game-pooh__body {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 90px;
  height: 90px;
  background: var(--pooh-red);
  border-radius: 50% 50% 40% 40%;
  border: 2px solid var(--pooh-brown);
}

.game-pooh__arm {
  position: absolute;
  width: 25px;
  height: 50px;
  background: var(--pooh-yellow);
  border-radius: 12px;
  border: 2px solid var(--pooh-brown);
  top: 20px;
  animation: armSwing 2s ease-in-out infinite;
}

.game-pooh__arm--left {
  left: -15px;
  transform: rotate(-30deg);
}

.game-pooh__arm--right {
  right: -15px;
  transform: rotate(30deg);
  animation-delay: 1s;
}

.game-pooh__honey-pot {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
}

.game-honey-pot {
  position: relative;
  width: 60px;
  height: 45px;
}

.game-honey-pot__body {
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, #ffd700, #daa520);
  border-radius: 15px 15px 8px 8px;
  border: 2px solid #8b4513;
  position: relative;
  overflow: hidden;
}

.game-honey-pot__body::after {
  content: '';
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 8px;
  background: linear-gradient(to bottom, #ffef00, #ffd700);
  border-radius: 8px;
}

.game-honey-pot__handle {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 45px;
  height: 15px;
  border: 4px solid #8b4513;
  border-bottom: none;
  border-radius: 22px 22px 0 0;
}

.game-honey-pot__lid {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 12px;
  background: #654321;
  border-radius: 8px 8px 0 0;
  border: 2px solid #8b4513;
}

@keyframes poohBounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-5px); }
}

@keyframes earWiggle {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}

@keyframes eyeBlink {
  0%, 45%, 55%, 100% { height: 10px; }
  50% { height: 2px; }
}

@keyframes armSwing {
  0%, 100% { transform: rotate(0); }
  50% { transform: rotate(10deg); }
}

.storybook-combo-display {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 247, 230, 0.95));
  border: 3px solid var(--storybook-gold);
  padding: 12px 20px;
  font-family: 'Playfair Display', serif;
}

.storybook-combo-text {
  font-size: 0.9rem;
  color: var(--storybook-gold);
  margin-left: 5px;
  font-weight: bold;
}

.storybook-game-controls {
  margin-top: 20px;
}

.storybook-game-btn {
  background: linear-gradient(to bottom, var(--storybook-page), #f5e6d3);
  border: 3px solid var(--storybook-border);
  color: var(--storybook-ink);
  font-family: 'Georgia', serif;
  padding: 12px 24px;
}

.storybook-game-btn:hover {
  border-color: var(--storybook-gold);
  transform: translateY(-2px);
}

.storybook-game-btn--secondary {
  background: linear-gradient(to bottom, var(--storybook-highlight), #fff0d6);
}

.storybook-game-btn--touch {
  min-width: 100px;
}

.storybook-game-status {
  font-family: 'Schoolbell', cursive;
  font-size: 1.1rem;
  text-align: center;
  margin-top: 15px;
  color: var(--storybook-forest);
}

/* ==================== STORYBOOK GAME OVERLAYS ==================== */
.storybook-game-overlay {
  background: rgba(44, 24, 16, 0.9);
}

.storybook-game-overlay-card {
  background: linear-gradient(135deg, #fffaf0, #fff5e6);
  border: 5px solid var(--storybook-border);
  border-radius: 20px;
  max-width: 600px;
  padding: 40px;
}

.storybook-game-overlay-title {
  font-family: 'Playfair Display', serif;
  color: var(--storybook-forest);
  text-align: center;
  margin-bottom: 30px;
  font-size: 2.2rem;
}

.storybook-game-instructions {
  gap: 15px;
  margin-bottom: 30px;
}

.storybook-game-instructions li {
  padding: 12px;
  background: var(--storybook-highlight);
  border-radius: 10px;
  border-left: 4px solid var(--storybook-gold);
  font-size: 1rem;
}

.storybook-game-instructions strong {
  color: var(--storybook-forest);
  min-width: 80px;
  display: inline-block;
}

.storybook-game-protip {
  background: var(--storybook-highlight);
  border: 2px dashed var(--storybook-gold);
  padding: 20px;
  border-radius: 15px;
  font-size: 1.1rem;
  margin-bottom: 30px;
}

.storybook-game-overlay-actions {
  justify-content: center;
}

.storybook-game-highlight {
  font-size: 1.8rem;
  color: var(--storybook-forest);
  text-align: center;
  margin: 20px 0;
}

.storybook-high-score-badge {
  background: linear-gradient(135deg, var(--storybook-gold), var(--pooh-red));
  color: white;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 1.2rem;
  margin: 20px auto;
  max-width: 300px;
}

.storybook-game-share {
  text-align: center;
  font-size: 1rem;
  color: var(--storybook-ink);
  margin: 20px 0;
}

.storybook-confetti {
  text-align: center;
  margin-bottom: 20px;
  animation: confettiFall 2s ease-in-out infinite;
}

@keyframes confettiFall {
  0%, 100% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-10px) rotate(10deg); }
}

/* ==================== STORYBOOK FORM ==================== */
.storybook-rsvp-intro {
  text-align: center;
  max-width: 800px;
  margin: 0 auto 40px;
  padding: 30px;
  background: var(--storybook-highlight);
  border: 2px solid var(--storybook-border);
  border-radius: 15px;
  font-size: 1.1rem;
  line-height: 1.8;
}

.storybook-form {
  max-width: 600px;
  margin: 0 auto;
}

.storybook-form-group {
  margin-bottom: 30px;
  position: relative;
}

.storybook-form-label {
  display: block;
}

.storybook-form-label-text {
  display: block;
  font-family: 'Playfair Display', serif;
  font-size: 1.1rem;
  color: var(--storybook-forest);
  margin-bottom: 10px;
  font-weight: bold;
}

.storybook-form-input,
.storybook-form-select,
.storybook-form-textarea {
  width: 100%;
  padding: 15px;
  background: var(--storybook-page);
  border: 2px solid var(--storybook-border);
  border-radius: 10px;
  font-family: 'Georgia', serif;
  font-size: 1rem;
  color: var(--storybook-ink);
  transition: all 0.3s ease;
}

.storybook-form-input:focus,
.storybook-form-select:focus,
.storybook-form-textarea:focus {
  outline: none;
  border-color: var(--storybook-gold);
  box-shadow: 0 0 0 3px rgba(212, 160, 23, 0.1);
}

.storybook-form-underline {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--storybook-gold);
  transition: width 0.3s ease;
}

.storybook-form-input:focus + .storybook-form-underline,
.storybook-form-select:focus + .storybook-form-underline,
.storybook-form-textarea:focus + .storybook-form-underline {
  width: 100%;
}

.storybook-form-textarea {
  min-height: 150px;
  resize: vertical;
}

.storybook-form-submit {
  width: 100%;
  padding: 20px;
  font-size: 1.2rem;
  background: linear-gradient(135deg, var(--storybook-gold), var(--pooh-red));
  color: white;
  border: none;
  border-radius: 15px;
  font-family: 'Playfair Display', serif;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.storybook-form-submit::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.storybook-form-submit:hover::before {
  left: 100%;
}

.storybook-form-submit:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

.storybook-form-status {
  text-align: center;
  margin-top: 20px;
  padding: 15px;
  background: var(--storybook-highlight);
  border: 2px solid var(--storybook-gold);
  border-radius: 10px;
  font-size: 1.1rem;
}

.storybook-guest-count {
  display: flex;
  align-items: center;
  gap: 20px;
  max-width: 400px;
  margin: 40px auto 0;
  padding: 20px;
  background: var(--storybook-highlight);
  border: 2px solid var(--storybook-border);
  border-radius: 15px;
}

.storybook-guest-count__icon {
  font-size: 2.5rem;
}

.storybook-guest-count__content strong {
  color: var(--storybook-forest);
  font-size: 1.2rem;
}

.storybook-guest-count__content small {
  display: block;
  color: var(--storybook-ink);
  opacity: 0.8;
  margin-top: 5px;
}

/* ==================== STORYBOOK FOOTER ==================== */
.storybook-footer {
  background: linear-gradient(to bottom, #f5e6d3, #e8d8b6);
  border-top: 3px double var(--storybook-border);
  padding: 40px 20px;
  margin-top: 60px;
  position: relative;
}

.storybook-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--storybook-gold), var(--storybook-leaf), var(--storybook-poppy));
}

.storybook-footer__content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
}

.storybook-footer__book {
  display: flex;
  align-items: center;
  gap: 15px;
}

.storybook-footer__book-spine {
  width: 25px;
  height: 80px;
  background: linear-gradient(to bottom, #8b4513, #654321);
  border-radius: 5px;
  position: relative;
}

.storybook-footer__book-spine::after {
  content: '';
  position: absolute;
  top: 15px;
  left: 5px;
  right: 5px;
  height: 50px;
  background: linear-gradient(to bottom, #d4a017, transparent);
  border-radius: 3px;
}

.storybook-footer__book-pages {
  display: flex;
  gap: 3px;
}

.storybook-footer__page {
  width: 40px;
  height: 60px;
  background: var(--storybook-page);
  border: 1px solid var(--storybook-border);
  border-radius: 3px;
}

.storybook-footer__text {
  text-align: center;
  flex: 1;
}

.storybook-footer__text p {
  margin: 10px 0;
  color: var(--storybook-ink);
}

.storybook-heart {
  color: var(--storybook-poppy);
  animation: heartbeat 1.5s ease-in-out infinite;
}

.storybook-honey {
  animation: honeyDrip 2s ease-in-out infinite;
}

.storybook-footer__copyright {
  font-size: 0.9rem;
  color: var(--storybook-ink);
  opacity: 0.7;
}

.storybook-footer__signature {
  text-align: right;
}

.storybook-paw-signature {
  width: 60px;
  height: 40px;
  background: var(--pooh-brown);
  border-radius: 50%;
  margin-left: auto;
  margin-bottom: 10px;
  position: relative;
  opacity: 0.3;
}

.storybook-paw-signature::before,
.storybook-paw-signature::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: var(--pooh-brown);
  border-radius: 50%;
}

.storybook-paw-signature::before {
  top: -10px;
  left: 10px;
}

.storybook-paw-signature::after {
  bottom: -10px;
  right: 10px;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* ==================== STORYBOOK MODAL ==================== */
.storybook-modal-backdrop {
  background: rgba(44, 24, 16, 0.95);
  backdrop-filter: blur(5px);
}

.storybook-modal-card {
  background: linear-gradient(135deg, #fffaf0, #fff5e6);
  border: 5px solid var(--storybook-border);
  border-radius: 20px;
  max-width: 500px;
  padding: 40px;
  position: relative;
}

.storybook-modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  background: var(--storybook-page);
  border: 2px solid var(--storybook-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--storybook-ink);
}

.storybook-modal-close:hover {
  background: var(--storybook-highlight);
  border-color: var(--storybook-gold);
  transform: rotate(90deg);
}

.storybook-modal-header {
  text-align: center;
  margin-bottom: 30px;
}

.storybook-modal-title {
  font-family: 'Playfair Display', serif;
  font-size: 2.5rem;
  color: var(--storybook-forest);
  margin-bottom: 10px;
}

.storybook-modal-subtitle {
  color: var(--storybook-gold);
  font-style: italic;
  font-size: 1.1rem;
}

.storybook-modal-character {
  text-align: center;
  margin: 30px 0;
}

.storybook-modal-avatar {
  display: inline-block;
  width: 120px;
  height: 120px;
  border-radius: 30px;
  border: 5px solid var(--storybook-border);
  position: relative;
  background: linear-gradient(135deg, var(--pooh-yellow), #ffdb58);
}

.storybook-modal-avatar--pooh {
  padding: 20px;
}

.modal-pooh {
  position: relative;
  width: 100%;
  height: 100%;
}

.modal-pooh__ear {
  position: absolute;
  width: 30px;
  height: 30px;
  background: var(--pooh-yellow);
  border-radius: 50%;
  border: 3px solid var(--pooh-brown);
  top: -15px;
}

.modal-pooh__ear--left {
  left: 10px;
  transform: rotate(-20deg);
}

.modal-pooh__ear--right {
  right: 10px;
  transform: rotate(20deg);
}

.modal-pooh__face {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 75px;
  background: var(--pooh-yellow);
  border-radius: 50%;
  border: 3px solid var(--pooh-brown);
  overflow: hidden;
}

.modal-pooh__eyes {
  position: absolute;
  top: 25px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  display: flex;
  justify-content: space-between;
}

.modal-pooh__eye {
  width: 12px;
  height: 12px;
  background: var(--pooh-brown);
  border-radius: 50%;
}

.modal-pooh__snout {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 35px;
  height: 30px;
  background: #ffdb58;
  border-radius: 50%;
  border: 3px solid var(--pooh-brown);
}

.modal-pooh__mouth {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 12px;
  border-bottom: 4px solid var(--pooh-brown);
  border-radius: 0 0 15px 15px;
}

.storybook-modal-quote {
  margin: 30px 0;
  padding: 30px;
  background: var(--storybook-highlight);
  border-radius: 15px;
  border-left: 5px solid var(--storybook-gold);
  border-right: 5px solid var(--storybook-gold);
  position: relative;
}

.storybook-modal-quote-mark {
  position: absolute;
  font-size: 3rem;
  color: var(--storybook-gold);
  font-family: 'Playfair Display', serif;
  opacity: 0.3;
}

.storybook-modal-quote-mark:first-child {
  top: 10px;
  left: 10px;
}

.storybook-modal-quote-mark:last-child {
  bottom: 10px;
  right: 10px;
}

.storybook-modal-quote-text {
  font-family: 'Schoolbell', cursive;
  font-size: 1.3rem;
  color: var(--storybook-ink);
  text-align: center;
  line-height: 1.8;
  margin: 0;
  font-style: italic;
}

.storybook-modal-gift {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 25px;
  background: var(--storybook-highlight);
  border: 2px dashed var(--storybook-gold);
  border-radius: 15px;
  margin-top: 30px;
}

.storybook-modal-gift-icon {
  font-size: 2.5rem;
  color: var(--storybook-gold);
}

.storybook-modal-gift-content h4 {
  font-family: 'Playfair Display', serif;
  color: var(--storybook-forest);
  margin-bottom: 10px;
  font-size: 1.2rem;
}

.storybook-modal-gift-content p {
  color: var(--storybook-ink);
  line-height: 1.6;
  margin: 0;
  font-size: 1rem;
}

/* ==================== STORYBOOK RSVP BANNER ==================== */
.storybook-rsvp-banner {
  background: linear-gradient(135deg, var(--storybook-gold), var(--pooh-red));
  color: white;
  padding: 20px 30px;
  border-bottom: 3px solid var(--storybook-border);
}

.storybook-rsvp-banner-content {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.storybook-rsvp-banner-icon {
  font-size: 2rem;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.storybook-rsvp-banner-text {
  flex: 1;
}

.storybook-rsvp-banner-main {
  font-family: 'Playfair Display', serif;
  font-size: 1.2rem;
  margin-bottom: 5px;
  font-weight: bold;
}

.storybook-rsvp-banner-sub {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 0;
}

.storybook-rsvp-banner-close {
  background: transparent;
  border: 2px solid white;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.storybook-rsvp-banner-close:hover {
  background: white;
  color: var(--storybook-gold);
  transform: rotate(90deg);
}

/* ==================== STORYBOOK PAGE TURNS ==================== */
.storybook-page-turns {
  background: linear-gradient(135deg, rgba(255, 250, 240, 0.95), rgba(255, 245, 230, 0.95));
  border: 3px solid var(--storybook-border);
  border-radius: 50px;
  padding: 15px 30px;
  backdrop-filter: blur(10px);
}

.storybook-page-turn-btn {
  background: var(--storybook-page);
  border: 2px solid var(--storybook-border);
  color: var(--storybook-ink);
  font-family: 'Georgia', serif;
  padding: 12px 25px;
  border-radius: 25px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

.storybook-page-turn-btn:hover:not(:disabled) {
  background: var(--storybook-highlight);
  border-color: var(--storybook-gold);
  transform: translateY(-2px);
  box-shadow: var(--storybook-shadow);
}

.storybook-page-turn-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.storybook-page-turn-status {
  padding: 0 20px;
}

.storybook-page-turn-icon {
  font-size: 1.5rem;
  animation: pageFlip 3s ease-in-out infinite;
}

@keyframes pageFlip {
  0%, 100% { transform: rotateY(0); }
  50% { transform: rotateY(180deg); }
}

.storybook-page-turn-text {
  font-family: 'Playfair Display', serif;
  color: var(--storybook-forest);
  font-weight: bold;
  font-size: 1.1rem;
}

/* ==================== RESPONSIVE DESIGN ==================== */
@media (max-width: 1024px) {
  .storybook-cover {
    padding: 40px 20px;
  }
  
  .storybook-cover__title {
    font-size: 2.8rem;
  }
  
  .storybook-pooh-character {
    position: relative;
    right: auto;
    bottom: auto;
    margin: 40px auto;
    width: 150px;
    height: 200px;
  }
  
  .storybook-notes {
    position: relative;
    left: auto;
    bottom: auto;
    margin-top: 40px;
  }
}

@media (max-width: 768px) {
  .storybook-nav {
    flex-direction: column;
    gap: 20px;
    padding: 15px;
  }
  
  .storybook-nav__links {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 10px;
  }
  
  .storybook-cover__title {
    font-size: 2.2rem;
  }
  
  .storybook-cover__quote-text {
    font-size: 1.2rem;
  }
  
  .storybook-chapter {
    padding: 30px 20px;
  }
  
  .storybook-chapter__title {
    font-size: 2rem;
  }
  
  .storybook-toc__chapters {
    grid-template-columns: 1fr;
  }
  
  .storybook-game-canvas {
    height: 400px;
  }
  
  .storybook-game-pooh {
    width: 100px;
    height: 130px;
  }
  
  .storybook-footer__content {
    flex-direction: column;
    text-align: center;
    gap: 30px;
  }
  
  .storybook-footer__signature {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .storybook-cover__title {
    font-size: 1.8rem;
  }
  
  .storybook-cover__subtitle {
    font-size: 1.1rem;
  }
  
  .storybook-btn {
    width: 100%;
    justify-content: center;
  }
  
  .storybook-game-hud {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .storybook-game-controls {
    flex-direction: column;
    gap: 15px;
  }
  
  .storybook-game-touch {
    width: 100%;
    justify-content: center;
  }
  
  .storybook-modal-card {
    padding: 30px 20px;
    margin: 20px;
  }
  
  .storybook-modal-title {
    font-size: 2rem;
  }
}
