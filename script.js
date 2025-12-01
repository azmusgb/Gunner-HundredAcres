// script.js - Corrected version

class HundredAcreGame {
    constructor() {
        this.init();
    }

    init() {
        try {
            this.cacheElements();
            this.setupEventListeners();
            this.setupIntersectionObservers();
            this.initPreferences();
            this.checkExistingRSVP();
            this.startLoadingSequence();
            
            // Add an initial check for scroll animations
            setTimeout(() => {
                this.checkScrollAnimations();
                this.updateReadingProgress();
            }, 500);
        } catch (error) {
            console.error('Game initialization failed:', error);
            this.safeHideLoading();
        }
    }

    cacheElements() {
        // Base elements
        this.elements = {
            body: document.body,
            storybookCover: document.getElementById('storybookCover'),
            openBookBtn: document.getElementById('openBookBtn'),
            storybook: document.getElementById('storybook'),
            contentSections: document.querySelectorAll('.content-section'),
            scrollAnimateElements: document.querySelectorAll('.scroll-animate'),
            navItems: document.querySelectorAll('.nav-item'),
            navMenu: document.getElementById('navMenu'),
            navToggle: document.getElementById('navToggle'),
            loadingScreen: document.getElementById('loadingScreen'),
            readingProgress: document.getElementById('readingProgress'),
            scrollTopFab: document.getElementById('scrollTopFab'),
            scrollRsvpFab: document.getElementById('scrollRsvpFab'),
            musicToggle: document.getElementById('musicToggle'),
            motionToggle: document.getElementById('motionToggle'),
            rsvpForm: document.getElementById('rsvpForm'),
            rsvpStatus: document.getElementById('rsvpStatus'),
            bgMusic: document.getElementById('bgMusic')
        };

        // Character modal
        this.modal = {
            character: document.getElementById('characterModal'),
            closeCharacter: document.getElementById('closeCharacterModal'),
            characterIcon: document.getElementById('modalCharacterIcon'),
            characterTitle: document.getElementById('characterModalTitle'),
            characterQuote: document.getElementById('modalCharacterQuote'),
            characterBio: document.getElementById('modalCharacterBio')
        };

        // Game instruction modal
        this.gameModal = {
            instruction: document.getElementById('gameInstructionModal'),
            close: document.getElementById('closeGameModal'),
            title: document.getElementById('gameInstructionTitle'),
            list: document.getElementById('gameInstructionList')
        };

        // Game canvases
        this.canvases = {
            honey: document.getElementById('honey-game'),
            defense: document.getElementById('defense-game')
        };
    }

    setupEventListeners() {
        const { elements, modal, gameModal } = this;

        // Storybook controls
        elements.openBookBtn?.addEventListener('click', () => this.openStorybook());

        // Navigation
        elements.navToggle?.addEventListener('click', () => this.toggleNavigation());
        elements.navItems?.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.scrollToSection(section);
                this.closeNavigation();
            });
        });

        // Scroll events - FIXED: bind this context
        const throttledCheckScroll = this.throttle(() => this.checkScrollAnimations(), 100);
        const throttledUpdateProgress = this.throttle(() => this.updateReadingProgress(), 50);
        
        window.addEventListener('scroll', () => {
            throttledCheckScroll();
            throttledUpdateProgress();
        });

        // FAB controls
        elements.scrollTopFab?.addEventListener('click', () => this.scrollToTop());
        elements.scrollRsvpFab?.addEventListener('click', () => this.scrollToRSVP());

        // Preferences
        elements.musicToggle?.addEventListener('click', () => this.toggleMusic());
        elements.motionToggle?.addEventListener('click', () => this.toggleReduceMotion());

        // RSVP Form
        elements.rsvpForm?.addEventListener('submit', (e) => this.handleRsvpSubmit(e));

        // Modals
        modal.closeCharacter?.addEventListener('click', () => this.closeModal(modal.character));
        modal.character?.addEventListener('click', (e) => {
            if (e.target === modal.character) this.closeModal(modal.character);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Window resize
        const throttledResize = this.throttle(() => this.handleResize(), 250);
        window.addEventListener('resize', throttledResize);
    }

    // Throttle function for performance - FIXED: preserve context
    throttle(func, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Scroll to specific section
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    // Storybook Functions
    openStorybook() {
        const { elements } = this;
        elements.storybookCover.classList.add('closed');
        elements.storybookCover.style.display = 'none';
        
        // Show main content
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.classList.remove('hidden');
            mainContent.style.display = 'block';
        }

        setTimeout(() => {
            // Scroll to the first section
            this.scrollToSection('section1');
        }, 300);
    }

    // Navigation Functions
    toggleNavigation() {
        const isOpen = this.elements.navMenu.classList.toggle('open');
        this.elements.navToggle.setAttribute('aria-expanded', isOpen);
    }

    closeNavigation() {
        this.elements.navMenu.classList.remove('open');
        this.elements.navToggle.setAttribute('aria-expanded', 'false');
    }

    setupIntersectionObservers() {
        const sections = document.querySelectorAll('.content-section');
        const options = {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0.1
        };

        this.sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = entry.target.id;
                const navItem = document.querySelector(`.nav-item[data-section="${id}"]`);
                
                if (entry.isIntersecting) {
                    this.elements.navItems.forEach(item => item.classList.remove('active'));
                    if (navItem) navItem.classList.add('active');
                }
            });
        }, options);

        sections.forEach(section => {
            this.sectionObserver.observe(section);
        });
    }

    // Scroll Animation Functions - FIXED: check if elements exist
    checkScrollAnimations() {
        if (!this.elements || !this.elements.scrollAnimateElements) return;
        
        const windowHeight = window.innerHeight;
        const triggerBottom = windowHeight * 0.8;

        this.elements.scrollAnimateElements.forEach(element => {
            if (!element) return;
            
            const elementTop = element.getBoundingClientRect().top;
            if (elementTop < triggerBottom) {
                element.classList.add('visible');
            }
        });
    }

    updateReadingProgress() {
        if (!this.elements || !this.elements.readingProgress) return;
        
        const doc = document.documentElement;
        const scrollTop = doc.scrollTop || document.body.scrollTop;
        const scrollHeight = doc.scrollHeight - doc.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        
        this.elements.readingProgress.style.width = `${progress}%`;
        this.elements.readingProgress.setAttribute('aria-valuenow', Math.round(progress));
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    scrollToRSVP() {
        const rsvpSection = document.getElementById('rsvp');
        if (rsvpSection) {
            rsvpSection.scrollIntoView({
                behavior: 'smooth'
            });
        }
    }

    // Accessibility & Preferences
    initPreferences() {
        this.initReduceMotionPreference();
        this.initMusicPreference();
    }

    initReduceMotionPreference() {
        const stored = localStorage.getItem('reduce-motion');
        if (stored === 'true') {
            this.elements.body.classList.add('reduce-motion');
        }
    }

    toggleReduceMotion() {
        const enabled = this.elements.body.classList.toggle('reduce-motion');
        localStorage.setItem('reduce-motion', enabled ? 'true' : 'false');
    }

    initMusicPreference() {
        if (!this.elements.bgMusic || !this.elements.musicToggle) return;
        
        const stored = localStorage.getItem('bg-music');
        const icon = this.elements.musicToggle.querySelector('i');
        
        if (stored === 'on') {
            this.elements.bgMusic.volume = 0.35;
            this.playBackgroundMusic();
            if (icon) {
                icon.classList.remove('fa-volume-xmark');
                icon.classList.add('fa-music');
            }
        } else {
            if (icon) {
                icon.classList.remove('fa-music');
                icon.classList.add('fa-volume-xmark');
            }
        }
    }

    async playBackgroundMusic() {
        try {
            if (this.elements.bgMusic) {
                await this.elements.bgMusic.play();
            }
        } catch (error) {
            console.log('Autoplay prevented:', error);
        }
    }

    toggleMusic() {
        if (!this.elements.bgMusic || !this.elements.musicToggle) return;
        
        const icon = this.elements.musicToggle.querySelector('i');
        if (!icon) return;
        
        if (this.elements.bgMusic.paused) {
            this.elements.bgMusic.volume = 0.35;
            this.playBackgroundMusic();
            icon.classList.replace('fa-volume-xmark', 'fa-music');
            localStorage.setItem('bg-music', 'on');
        } else {
            this.elements.bgMusic.pause();
            icon.classList.replace('fa-music', 'fa-volume-xmark');
            localStorage.setItem('bg-music', 'off');
        }
    }

    // Modal Functions
    showCharacterModal(character) {
        const characterData = {
            pooh: {
                name: 'Winnie the Pooh',
                quote: '"A little Consideration, a little Thought for Others, makes all the difference."',
                icon: 'fas fa-bear',
                bio: 'Pooh has volunteered to be in charge of honey jars, hugs, and quiet snuggles. He is quite certain Baby Gunner will need all three in generous amounts.'
            },
            piglet: {
                name: 'Piglet',
                quote: '"It is hard to be brave, when you\'re only a Very Small Animal — but I\'ll do it for Baby Gunner."',
                icon: 'fas fa-heart',
                bio: 'Piglet has carefully arranged the soft blankets and tiny clothes, making sure everything feels cozy, safe, and just right for someone very small.'
            },
            tigger: {
                name: 'Tigger',
                quote: '"The wonderful thing about babies is that babies are wonderful things!"',
                icon: 'fas fa-paw',
                bio: 'Tigger is in charge of games, giggles, and any moment that calls for a bounce. He\'s especially excited about showing everyone how to make Baby Gunner smile.'
            },
            eeyore: {
                name: 'Eeyore',
                quote: '"Not much of a tail, but it\'s my tail. And this is our baby, and that\'s rather special."',
                icon: 'fas fa-cloud',
                bio: 'Eeyore has quietly found the best spot for photos and moments of quiet. He is making sure there\'s always a comfortable place to sit and simply be together.'
            }
        };

        const data = characterData[character];
        if (!data) return;

        const { modal } = this;
        if (!modal.characterIcon || !modal.characterTitle || !modal.characterQuote || !modal.characterBio) return;

        modal.characterIcon.innerHTML = `<i class="${data.icon}"></i>`;
        modal.characterIcon.className = `modal-character-icon ${character}-icon-modal`;
        modal.characterTitle.textContent = data.name;
        modal.characterQuote.textContent = data.quote;
        modal.characterBio.textContent = data.bio;
        
        modal.character.setAttribute('aria-hidden', 'false');
        modal.character.style.display = 'flex';
    }

    closeModal(modalElement) {
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.style.display = 'none';
    }

    // RSVP Functions
    handleRsvpSubmit(e) {
        e.preventDefault();
        
        if (!this.elements.rsvpForm || !this.elements.rsvpStatus) return;
        
        const formData = new FormData(this.elements.rsvpForm);
        const guestName = formData.get('guestName')?.trim();
        const guestCount = formData.get('guestCount');
        const guestNote = formData.get('guestNote')?.trim();

        if (!guestName) {
            this.showRsvpStatus('Please enter your name', 'error');
            return;
        }

        this.processSuccessfulRSVP(guestName, guestCount, guestNote);
    }

    processSuccessfulRSVP(name, count, note) {
        const { elements } = this;
        if (!elements.rsvpForm || !elements.rsvpStatus) return;
        
        elements.rsvpForm.style.display = 'none';
        elements.rsvpStatus.innerHTML = this.createRsvpSuccessHTML(name, count, note);
        elements.rsvpStatus.style.color = 'inherit';
        
        // Celebration effects
        this.createConfetti();
        this.createHoneyAnimation();
        
        // Store RSVP data
        this.storeRsvpData(name, count, note);
    }

    createRsvpSuccessHTML(name, count, note) {
        return `
            <div class="form-success">
                <div class="success-icon">🎉</div>
                <div class="success-message">Thank you, ${name}!</div>
                <div class="success-submessage">
                    We're excited to celebrate with ${count === '1' ? 'you' : `your party of ${count}`}!
                    ${note ? '<br>We appreciate your note!' : ''}
                </div>
            </div>
        `;
    }

    storeRsvpData(name, count, note) {
        const rsvpData = {
            name: name,
            count: count,
            note: note,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('babyGunnerRSVP', JSON.stringify(rsvpData));
    }

    checkExistingRSVP() {
        const existingRSVP = localStorage.getItem('babyGunnerRSVP');
        if (!existingRSVP || !this.elements.rsvpForm || !this.elements.rsvpStatus) return;

        try {
            const rsvpData = JSON.parse(existingRSVP);
            this.populateRsvpForm(rsvpData);
            this.showExistingRsvpConfirmation(rsvpData);
        } catch (error) {
            console.log('Error parsing RSVP data:', error);
        }
    }

    populateRsvpForm(rsvpData) {
        const nameField = document.getElementById('guestName');
        const countField = document.getElementById('guestCount');
        const noteField = document.getElementById('guestNote');
        
        if (nameField && rsvpData.name) nameField.value = rsvpData.name;
        if (countField && rsvpData.count) countField.value = rsvpData.count;
        if (noteField && rsvpData.note) noteField.value = rsvpData.note;
    }

    showExistingRsvpConfirmation(rsvpData) {
        if (!this.elements.rsvpForm || !this.elements.rsvpStatus) return;
        
        this.elements.rsvpForm.style.display = 'none';
        this.elements.rsvpStatus.innerHTML = `
            <div class="form-success">
                <div class="success-icon">✅</div>
                <div class="success-message">RSVP Confirmed!</div>
                <div class="success-submessage">
                    We have your RSVP for ${rsvpData.name} and ${rsvpData.count} guest${rsvpData.count === '1' ? '' : 's'}.
                    <br><button onclick="editRSVP()" class="back-btn" style="margin-top: 10px;">Edit RSVP</button>
                </div>
            </div>
        `;
    }

    showRsvpStatus(message, type = 'info') {
        if (!this.elements.rsvpStatus) return;
        
        this.elements.rsvpStatus.textContent = message;
        this.elements.rsvpStatus.className = `form-status ${type}`;
    }

    // Celebration Effects
    createConfetti() {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);
        
        const colors = ['#FFC42B', '#D62E2E', '#E6B86A', '#B0D0E3', '#9CAD90'];
        
        for (let i = 0; i < 150; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.cssText = this.generateConfettiStyle(colors);
            container.appendChild(confetti);
        }
        
        setTimeout(() => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }, 3000);
    }

    generateConfettiStyle(colors) {
        const isCircle = Math.random() > 0.7;
        const isRectangle = Math.random() > 0.5 && !isCircle;
        
        return `
            left: ${Math.random() * 100}vw;
            animation-delay: ${Math.random() * 2}s;
            background-color: ${colors[Math.floor(Math.random() * colors.length)]};
            transform: rotate(${Math.random() * 360}deg);
            ${isCircle ? 'border-radius: 50%; width: 8px; height: 8px;' : ''}
            ${isRectangle ? 'width: 12px; height: 4px;' : 'width: 10px; height: 10px;'}
        `;
    }

    createHoneyAnimation() {
        const honeyIcon = document.createElement('div');
        honeyIcon.innerHTML = '🍯';
        honeyIcon.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            font-size: 4rem;
            transform: translate(-50%, -50%) scale(0);
            animation: honeyPop 1s ease-out forwards;
            z-index: 10005;
        `;
        document.body.appendChild(honeyIcon);
        
        setTimeout(() => {
            if (honeyIcon.parentNode) {
                honeyIcon.parentNode.removeChild(honeyIcon);
            }
        }, 1000);
    }

    // Woodland Sound Function
    playWoodlandSound(event) {
        if (event) {
            event.preventDefault();
            this.animateWoodlandSign(event);
        }

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createWoodlandSound(audioContext);
        } catch (error) {
            console.log("Web Audio API not supported");
        }
    }

    createWoodlandSound(audioContext) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        const times = [0, 0.1, 0.2];
        const frequencies = [523.25, 659.25, 783.99];
        
        times.forEach((time, index) => {
            oscillator.frequency.setValueAtTime(frequencies[index], audioContext.currentTime + time);
        });

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.8);
    }

    animateWoodlandSign(event) {
        const sign = event.target.closest('.woodland-sign');
        if (sign) {
            sign.style.transform = 'scale(1.08) rotate(-1deg)';
            setTimeout(() => {
                sign.style.transform = '';
            }, 300);
        }
    }

    // Keyboard Shortcuts
    handleKeyboardShortcuts(e) {
        // Escape key closes modals
        if (e.key === 'Escape') {
            this.closeModal(this.modal.character);
        }
        
        // Space key toggles music (when not in input fields)
        if (e.key === ' ' && !this.isInputElement(e.target)) {
            e.preventDefault();
            this.toggleMusic();
        }
    }

    isInputElement(element) {
        return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable;
    }

    // Resize Handler
    handleResize() {
        // Reinitialize games if needed
        if (this.honeyGame && typeof this.honeyGame.handleResize === 'function') {
            this.honeyGame.handleResize();
        }
        if (this.defenseGame && typeof this.defenseGame.handleResize === 'function') {
            this.defenseGame.handleResize();
        }
    }

    // Loading Functions
    startLoadingSequence() {
        setTimeout(() => {
            this.safeHideLoading();
        }, 2000);
    }

    safeHideLoading() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.classList.add('hidden');
        }
    }

    // Game Initialization
    initHoneyCatchGame() {
        // Check if canvas exists
        if (this.canvases.honey) {
            try {
                this.honeyGame = new HoneyCatchGame(this.canvases.honey);
            } catch (error) {
                console.log('Could not initialize honey catch game:', error);
            }
        }
    }

    initTowerDefenseGame() {
        // Check if canvas exists
        if (this.canvases.defense) {
            try {
                this.defenseGame = new TowerDefenseGame(this.canvases.defense);
            } catch (error) {
                console.log('Could not initialize tower defense game:', error);
            }
        }
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add CSS animations if not already added
    if (!document.getElementById('game-animations')) {
        const style = document.createElement('style');
        style.id = 'game-animations';
        style.textContent = `
            @keyframes honeyPop {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            
            @keyframes bounce {
                0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
                40%, 43% { transform: translate3d(0,-20px,0); }
                70% { transform: translate3d(0,-10px,0); }
                90% { transform: translate3d(0,-4px,0); }
            }
            
            @keyframes confetti-fall {
                0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
            }
            
            .confetti {
                animation: confetti-fall 3s ease-in forwards;
                position: absolute;
                width: 10px;
                height: 10px;
            }
            
            .form-success {
                text-align: center;
                padding: 20px;
            }
            
            .success-icon {
                font-size: 3rem;
                margin-bottom: 10px;
            }
            
            .success-message {
                font-size: 1.5rem;
                font-weight: bold;
                margin-bottom: 10px;
                color: #2E7D32;
            }
            
            .success-submessage {
                color: #555;
            }
            
            .back-btn {
                background: #FFC42B;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: background 0.3s;
            }
            
            .back-btn:hover {
                background: #E6A800;
            }
            
            .form-status.success {
                background: #DFF2BF;
                color: #4F8A10;
                padding: 10px;
                border-radius: 5px;
                margin-top: 10px;
            }
            
            .form-status.error {
                background: #FFBABA;
                color: #D8000C;
                padding: 10px;
                border-radius: 5px;
                margin-top: 10px;
            }
            
            .form-status.info {
                background: #BDE5F8;
                color: #00529B;
                padding: 10px;
                border-radius: 5px;
                margin-top: 10px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize game
    window.game = new HundredAcreGame();
});

// Global functions for inline event handlers
window.showCharacterModal = function(character) {
    if (window.game) {
        window.game.showCharacterModal(character);
    }
};

window.playWoodlandSound = function(event) {
    if (window.game) {
        window.game.playWoodlandSound(event);
    }
};

window.editRSVP = function() {
    if (window.game) {
        // Clear RSVP from localStorage
        localStorage.removeItem('babyGunnerRSVP');
        
        // Show form again
        const rsvpForm = document.getElementById('rsvpForm');
        const rsvpStatus = document.getElementById('rsvpStatus');
        
        if (rsvpForm && rsvpStatus) {
            rsvpForm.style.display = 'block';
            rsvpStatus.innerHTML = '';
        }
    }
};

// Add a simplified HoneyCatchGame class to prevent errors
class HoneyCatchGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.init();
    }

    init() {
        console.log('Honey Catch Game initialized');
        // Add basic initialization here
    }

    handleResize() {
        console.log('Honey Catch Game handleResize called');
    }
}

// Add a simplified TowerDefenseGame class to prevent errors
class TowerDefenseGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.init();
    }

    init() {
        console.log('Tower Defense Game initialized');
        // Add basic initialization here
    }

    handleResize() {
        console.log('Tower Defense Game handleResize called');
    }
}
