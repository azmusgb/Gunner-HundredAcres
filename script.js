// script.js - Complete Fixed Navigation System

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing navigation...');
    
    // DOM Elements
    const chapterPills = document.querySelectorAll('.chapter-pill');
    const pages = document.querySelectorAll('.page');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageIndicator = document.getElementById('pageIndicator');
    const progressFill = document.getElementById('progressFill');
    const settingsButton = document.getElementById('settingsButton');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const closeSettings = document.getElementById('closeSettings');
    
    // Current chapter state
    let currentChapter = 1;
    const totalChapters = 4;
    
    // ==================== MAIN NAVIGATION FUNCTIONS ====================
    
    function navigateToChapter(chapter) {
        console.log('Navigating to chapter:', chapter);
        
        // Validate chapter number
        if (chapter < 1 || chapter > totalChapters) {
            console.log('Invalid chapter number');
            return;
        }
        
        // Update current chapter
        currentChapter = chapter;
        
        // Hide all pages
        pages.forEach(page => {
            page.classList.remove('active');
        });
        
        // Show the active page
        const activePage = document.querySelector(`.page[data-chapter="${chapter}"]`);
        if (activePage) {
            activePage.classList.add('active');
            console.log('Page found and activated:', activePage);
        } else {
            console.error('Page not found for chapter:', chapter);
        }
        
        // Update pill states
        chapterPills.forEach(pill => {
            const pillChapter = parseInt(pill.getAttribute('data-chapter-target'));
            if (pillChapter === chapter) {
                pill.classList.add('active');
                pill.setAttribute('aria-current', 'page');
            } else {
                pill.classList.remove('active');
                pill.removeAttribute('aria-current');
            }
        });
        
        // Update progress bar
        updateProgressBar();
        
        // Update navigation buttons
        updateNavigation();
        
        // Scroll to top of book
        const book = document.querySelector('.book');
        if (book) {
            book.scrollTop = 0;
        }
        
        // Play page turn sound if available
        playPageSound();
        
        // Initialize game if on chapter 2
        if (chapter === 2) {
            console.log('On game chapter, checking for game...');
            setTimeout(initializeGame, 100);
        }
    }
    
    function updateProgressBar() {
        if (progressFill) {
            const progressPercent = ((currentChapter - 1) / (totalChapters - 1)) * 100;
            progressFill.style.width = `${progressPercent}%`;
            progressFill.setAttribute('aria-valuenow', progressPercent);
        }
    }
    
    function updateNavigation() {
        console.log('Updating navigation for chapter:', currentChapter);
        
        // Update indicator text
        if (pageIndicator) {
            pageIndicator.textContent = `Chapter ${currentChapter} of ${totalChapters}`;
        }
        
        // Update previous button
        if (prevBtn) {
            if (currentChapter === 1) {
                prevBtn.disabled = true;
                prevBtn.style.opacity = '0.5';
                prevBtn.style.cursor = 'not-allowed';
            } else {
                prevBtn.disabled = false;
                prevBtn.style.opacity = '1';
                prevBtn.style.cursor = 'pointer';
            }
        }
        
        // Update next button
        if (nextBtn) {
            if (currentChapter === totalChapters) {
                nextBtn.disabled = true;
                nextBtn.style.opacity = '0.5';
                nextBtn.style.cursor = 'not-allowed';
            } else {
                nextBtn.disabled = false;
                nextBtn.style.opacity = '1';
                nextBtn.style.cursor = 'pointer';
            }
        }
    }
    
    function playPageSound() {
        try {
            const pageSound = document.getElementById('pageSound');
            if (pageSound) {
                pageSound.currentTime = 0;
                pageSound.play().catch(e => console.log('Could not play page sound:', e));
            }
        } catch (e) {
            console.log('Error playing sound:', e);
        }
    }
    
    // ==================== GAME INITIALIZATION ====================
    
    function initializeGame() {
        console.log('Initializing game for chapter 2...');
        
        // Check if game.js loaded properly
        if (typeof window.gameInitialized !== 'undefined' && window.gameInitialized) {
            console.log('Game already initialized');
            return;
        }
        
        // If game.js hasn't loaded, show a message
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            console.log('Game container found');
            
            // Ensure the canvas exists
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) {
                console.log('Creating canvas...');
                const newCanvas = document.createElement('canvas');
                newCanvas.id = 'gameCanvas';
                newCanvas.width = 800;
                newCanvas.height = 600;
                gameContainer.appendChild(newCanvas);
            }
        } else {
            console.error('Game container not found!');
        }
        
        // Mark game as initialized
        window.gameInitialized = true;
    }
    
    // ==================== SETTINGS FUNCTIONS ====================
    
    function initSettings() {
        console.log('Initializing settings...');
        
        if (settingsButton && settingsOverlay && closeSettings) {
            settingsButton.addEventListener('click', function() {
                settingsOverlay.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                console.log('Settings opened');
            });
            
            closeSettings.addEventListener('click', function() {
                settingsOverlay.style.display = 'none';
                document.body.style.overflow = '';
                console.log('Settings closed');
            });
            
            // Close overlay when clicking outside
            settingsOverlay.addEventListener('click', function(e) {
                if (e.target === settingsOverlay) {
                    settingsOverlay.style.display = 'none';
                    document.body.style.overflow = '';
                }
            });
            
            // Theme switching
            const themeOptions = document.querySelectorAll('.theme-option');
            if (themeOptions.length > 0) {
                themeOptions.forEach(option => {
                    option.addEventListener('click', function() {
                        const theme = this.getAttribute('data-theme');
                        setTheme(theme);
                        
                        // Update active state
                        themeOptions.forEach(opt => opt.classList.remove('active'));
                        this.classList.add('active');
                        
                        console.log('Theme changed to:', theme);
                    });
                });
            }
            
            // Apply settings button
            const applySettingsBtn = document.getElementById('applySettingsBtn');
            if (applySettingsBtn) {
                applySettingsBtn.addEventListener('click', function() {
                    console.log('Settings applied');
                    settingsOverlay.style.display = 'none';
                    document.body.style.overflow = '';
                });
            }
            
            // Reset settings button
            const resetSettingsBtn = document.getElementById('resetSettingsBtn');
            if (resetSettingsBtn) {
                resetSettingsBtn.addEventListener('click', function() {
                    console.log('Settings reset to defaults');
                    // Add your reset logic here
                });
            }
        }
    }
    
    function setTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else if (theme === 'light') {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        } else {
            // Auto theme based on system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
            localStorage.removeItem('theme');
        }
    }
    
    // ==================== WISH FORM FUNCTIONS ====================
    
    function initWishForm() {
        console.log('Initializing wish form...');
        
        const wishesForm = document.getElementById('wishesForm');
        const wishMessage = document.getElementById('wishMessage');
        const characterCount = document.querySelector('.character-count');
        
        if (wishesForm) {
            // Character counter for message
            if (wishMessage && characterCount) {
                wishMessage.addEventListener('input', function() {
                    const count = this.value.length;
                    characterCount.textContent = `${count}/500 characters`;
                    
                    if (count > 500) {
                        characterCount.style.color = '#e74c3c';
                        this.style.borderColor = '#e74c3c';
                    } else {
                        characterCount.style.color = '#7a5c3c';
                        this.style.borderColor = '#f4a944';
                    }
                });
            }
            
            // Form submission
            wishesForm.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('Wish form submitted');
                
                const name = document.getElementById('guestName').value;
                const message = wishMessage.value;
                
                if (!name || !message) {
                    alert('Please fill in all fields');
                    return;
                }
                
                if (message.length > 500) {
                    alert('Message must be 500 characters or less');
                    return;
                }
                
                // Add wish to display
                addWishToDisplay(name, message);
                
                // Reset form
                wishesForm.reset();
                if (characterCount) {
                    characterCount.textContent = '0/500 characters';
                }
                
                // Show success message
                const feedback = document.getElementById('wishFeedback');
                if (feedback) {
                    feedback.textContent = 'Thank you for your wishes!';
                    feedback.style.color = '#2ecc71';
                    setTimeout(() => {
                        feedback.textContent = '';
                    }, 3000);
                }
                
                console.log('Wish saved:', { name, message });
            });
        }
    }
    
    function addWishToDisplay(name, message) {
        const wishesDisplay = document.getElementById('wishesDisplay');
        if (!wishesDisplay) {
            console.log('Wishes display not found');
            return;
        }
        
        const wishElement = document.createElement('div');
        wishElement.className = 'wish-item';
        wishElement.innerHTML = `
            <h4>${name}</h4>
            <p>${message}</p>
            <span class="wish-date">${new Date().toLocaleDateString()}</span>
        `;
        
        wishesDisplay.prepend(wishElement);
    }
    
    // ==================== COUNTDOWN FUNCTIONS ====================
    
    function initCountdown() {
        console.log('Initializing countdown...');
        
        const expectedDate = new Date('2025-08-31');
        const now = new Date();
        const timeDiff = expectedDate.getTime() - now.getTime();
        
        if (timeDiff > 0) {
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            
            const daysElement = document.getElementById('days');
            const hoursElement = document.getElementById('hours');
            
            if (daysElement) daysElement.textContent = days;
            if (hoursElement) hoursElement.textContent = hours;
            
            console.log(`Countdown: ${days} days, ${hours} hours`);
        }
    }
    
    // ==================== CLICKABLE CHARACTERS ====================
    
    function initClickableCharacters() {
        console.log('Initializing clickable characters...');
        
        const characters = document.querySelectorAll('.clickable-character');
        characters.forEach(character => {
            character.addEventListener('click', function() {
                const charName = this.getAttribute('data-character');
                const messages = {
                    'pooh': '"Oh bother! Let me have a little smackerel of honey."',
                    'piglet': '"Oh d-d-dear! That was a close one!"',
                    'tigger': '"Hoo-hoo-hoo-hoo! That\'s what Tiggers do best!"',
                    'roo': '"Look at me! I can bounce too!"',
                    'gunnar': 'Coming soon to the Hundred Acre Wood!'
                };
                
                const message = messages[charName] || 'Hello from the Hundred Acre Wood!';
                
                const messageDiv = this.querySelector('.character-message');
                if (messageDiv) {
                    messageDiv.textContent = message;
                    messageDiv.style.display = 'block';
                    
                    setTimeout(() => {
                        messageDiv.style.display = 'none';
                    }, 3000);
                }
                
                console.log(`${charName} says: ${message}`);
            });
        });
    }
    
    // ==================== GLOBAL FUNCTIONS ====================
    
    // Make scrollToChapter available globally
    window.scrollToChapter = function(chapter) {
        console.log('scrollToChapter called with:', chapter);
        
        // Navigate to chapter
        navigateToChapter(chapter);
        
        // Scroll to book container
        const storybook = document.getElementById('storybook');
        if (storybook) {
            storybook.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    };
    
    // ==================== INITIALIZATION ====================
    
    function initializeEverything() {
        console.log('Initializing everything...');
        
        // Initialize navigation
        if (chapterPills.length > 0) {
            chapterPills.forEach(pill => {
                pill.addEventListener('click', function(e) {
                    e.preventDefault();
                    const chapter = parseInt(this.getAttribute('data-chapter-target'));
                    navigateToChapter(chapter);
                });
            });
            console.log('Chapter pills initialized:', chapterPills.length);
        }
        
        // Initialize navigation buttons
        if (prevBtn) {
            prevBtn.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToChapter(currentChapter - 1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToChapter(currentChapter + 1);
            });
        }
        
        // Initialize settings
        initSettings();
        
        // Initialize wish form
        initWishForm();
        
        // Initialize countdown
        initCountdown();
        
        // Initialize clickable characters
        initClickableCharacters();
        
        // Set initial state
        updateProgressBar();
        updateNavigation();
        
        // Check for saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme);
            
            // Update theme option active state
            const themeOptions = document.querySelectorAll('.theme-option');
            themeOptions.forEach(option => {
                if (option.getAttribute('data-theme') === savedTheme) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        }
        
        console.log('Navigation system fully initialized');
    }
    
    // Start initialization
    initializeEverything();
    
    // Debug info
    console.log('Elements found:', {
        chapterPills: chapterPills.length,
        pages: pages.length,
        prevBtn: !!prevBtn,
        nextBtn: !!nextBtn,
        settingsButton: !!settingsButton,
        currentChapter: currentChapter
    });
});

// Make sure functions are available globally for button onclick handlers
window.addEventListener('load', function() {
    console.log('Page fully loaded');
});