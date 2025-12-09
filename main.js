// ==========================================================================
// BABY GUNNAR'S HUNDRED ACRE WOOD ADVENTURE - FIXED LOADING SCREEN
// ==========================================================================

// FIXED: Simple and reliable loading screen
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎉 Baby Gunnar\'s Storybook Initializing...');

    // Show progress animation immediately
    let progress = 0;
    const progressFill = document.getElementById('progressFillAnim');
    const progressText = document.getElementById('progressText');

    // Animate progress from 0% to 100% over 1.5 seconds
    const progressInterval = setInterval(() => {
        progress += 2;
        if (progress > 100) progress = 100;

        if (progressFill) progressFill.style.width = progress + '%';
        if (progressText) progressText.textContent = Math.floor(progress) + '%';

        if (progress >= 100) {
            clearInterval(progressInterval);

            // Wait for window to fully load, then hide loading screen
            if (document.readyState === 'complete') {
                hideLoadingScreen();
            } else {
                window.addEventListener('load', hideLoadingScreen);
            }

            // Safety timeout: always hide after 3 seconds max
            setTimeout(hideLoadingScreen, 3000);
        }
    }, 30); // Update every 30ms for smooth animation
});

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('enhancedLoadingScreen');
    if (loadingScreen) {
        // Fade out animation
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 0.5s ease';

        // Remove from DOM after fade
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            document.body.style.overflow = 'auto';

            // Initialize the storybook
            initializeStorybook();
        }, 500);
    } else {
        // If loading screen doesn't exist, just initialize
        initializeStorybook();
    }
}

// Main initialization function
function initializeStorybook() {
    console.log('✅ Storybook fully loaded! Ready for adventure!');

    // ========== STATE MANAGEMENT ==========
    let currentChapter = 1;
    const totalChapters = 4;
    let isTransitioning = false;
// Add this function in initializeStorybook()
    function preloadGame() {
        const gameIframe = document.getElementById('honeyGameIframe');
        if (!gameIframe) return;

        // Create a hidden iframe to preload the game
        const preloadIframe = document.createElement('iframe');
        preloadIframe.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
    `;
        preloadIframe.src = gameIframe.getAttribute('data-src');
        document.body.appendChild(preloadIframe);

        // Remove preload iframe after a while
        setTimeout(() => {
            if (preloadIframe.parentNode) {
                document.body.removeChild(preloadIframe);
            }
        }, 10000); // Remove after 10 seconds
    }

// Call this in initializeStorybook()
    function initializeStorybook() {
        // ... existing code ...

        // Preload the game for better performance
        preloadGame();
    }
    // ========== HERO / COVER MANAGEMENT ==========
    function showHero() {
        const hero = document.getElementById('bookCoverScreen');
        const storybook = document.getElementById('storybook');
        const backBtn = document.getElementById('backToCoverBtn');

        if (hero && storybook) {
            hero.classList.remove('hero-hidden');
            storybook.classList.add('hidden');
            if (backBtn) backBtn.classList.remove('visible');

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Announce to screen reader
            announceToScreenReader('Returned to book cover. Use the buttons to start reading.');
        }
    }

    function showStorybook() {
        const hero = document.getElementById('bookCoverScreen');
        const storybook = document.getElementById('storybook');
        const backBtn = document.getElementById('backToCoverBtn');

        if (hero && storybook) {
            hero.classList.add('hero-hidden');
            storybook.classList.remove('hidden');
            if (backBtn) backBtn.classList.add('visible');

            // Show chapter 1
            showChapter(1);

            // Announce to screen reader
            announceToScreenReader('Storybook opened. Starting Chapter 1: A Special Day in the Hundred Acre Wood.');
        }
    }

    // ========== CHAPTER MANAGEMENT ==========
    function showChapter(chapterNumber) {
        if (chapterNumber < 1 || chapterNumber > totalChapters || isTransitioning) return;

        isTransitioning = true;

        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page
        const targetPage = document.querySelector(`[data-chapter="${chapterNumber}"]`);
        if (targetPage) {
            targetPage.classList.add('active');
            currentChapter = chapterNumber;

            // Update UI
            updateNavigation();
            updateProgress();

            // Scroll to top of page with offset for mobile nav
            setTimeout(() => {
                const offset = window.innerWidth <= 768 ? 150 : 100;
                const targetPosition = targetPage.offsetTop - offset;
                window.scrollTo({ top: Math.max(0, targetPosition), behavior: 'smooth' });
                isTransitioning = false;

                // Announce chapter change
                const chapterTitle = targetPage.querySelector('.chapter-title')?.textContent || `Chapter ${chapterNumber}`;
                announceChapterChange(chapterNumber, chapterTitle);

                // Load game if chapter 2
                if (chapterNumber === 2) {
                    loadGameIframe();
                }
            }, 300);
        }
    }

    function updateNavigation() {
        // Update chapter pills
        document.querySelectorAll('.chapter-pill').forEach((pill, index) => {
            const pillChapter = parseInt(pill.getAttribute('data-chapter-target'));
            if (pillChapter === currentChapter) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }

            // Mark previous chapters as completed
            if (pillChapter < currentChapter) {
                pill.classList.add('completed');
            } else {
                pill.classList.remove('completed');
            }
        });

        // Update previous/next buttons
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageIndicator = document.getElementById('pageIndicator');

        if (prevBtn) {
            prevBtn.disabled = currentChapter === 1;
        }
        if (nextBtn) {
            nextBtn.disabled = currentChapter === totalChapters;
        }
        if (pageIndicator) {
            pageIndicator.textContent = `Chapter ${currentChapter} of ${totalChapters}`;
        }

        // Update mobile navigation
        updateMobileNav();
    }

    function updateProgress() {
        const progress = ((currentChapter - 1) / (totalChapters - 1)) * 100;
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
    }

    // ========== GAME IFRAME LOADING ==========
// In your existing JavaScript, enhance the loadGameIframe function
    // Replace the existing loadGameIframe function with this:
    function loadGameIframe() {
        console.log('Loading game iframe...');

        const gameIframe = document.getElementById('honeyGameIframe');
        const gameLoading = document.getElementById('gameLoading');
        const gameProgressFill = document.getElementById('gameProgressFill');
        const manualLoadBtn = document.getElementById('manualLoadBtn');

        if (!gameIframe) {
            console.error('Game iframe not found');
            return;
        }

        // If already loaded, just show it
        if (gameIframe.src && gameIframe.src.includes('game.html')) {
            console.log('Game already loaded, showing iframe');
            gameIframe.style.display = 'block';
            if (gameLoading) gameLoading.style.display = 'none';
            return;
        }

        // Show loading animation
        if (gameLoading) {
            gameLoading.style.display = 'block';
        }

        // Simulate loading progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            if (progress > 90) progress = 90; // Stop at 90% until actual load

            if (gameProgressFill) {
                gameProgressFill.style.width = progress + '%';
            }

            if (progress >= 90) {
                clearInterval(progressInterval);
            }
        }, 50);

        // Load the game
        try {
            console.log('Setting iframe src to game.html');
            gameIframe.src = 'game.html';

            // Handle successful load
            gameIframe.onload = function() {
                console.log('Game iframe loaded successfully');
                clearInterval(progressInterval);

                if (gameProgressFill) {
                    gameProgressFill.style.width = '100%';
                }

                // Show iframe and hide loading
                setTimeout(() => {
                    gameIframe.style.display = 'block';
                    if (gameLoading) {
                        gameLoading.style.display = 'none';
                    }
                }, 500);
            };

            // Handle load error
            gameIframe.onerror = function() {
                console.error('Failed to load game iframe');
                clearInterval(progressInterval);

                if (gameLoading) {
                    gameLoading.innerHTML = `
                    <div style="text-align: center; padding: 30px;">
                        <div style="font-size: 3rem; margin-bottom: 15px;">😔</div>
                        <h3 style="color: var(--color-pooh-red);">Game Failed to Load</h3>
                        <p>Please check if game.html exists in the same folder.</p>
                        <button onclick="window.location.reload()" class="load-game-btn" style="margin-top: 20px;">
                            🔄 Retry Loading
                        </button>
                        <p style="margin-top: 20px; font-size: 0.9em; color: var(--color-text-muted);">
                            If the problem persists, try opening the game directly:<br>
                            <a href="game.html" target="_blank" style="color: var(--color-honey);">Open Game in New Tab</a>
                        </p>
                    </div>
                `;
                }
            };

        } catch (error) {
            console.error('Error loading game:', error);
            if (gameLoading) {
                gameLoading.innerHTML = `
                <div style="text-align: center; padding: 30px;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">⚠️</div>
                    <h3>Loading Error</h3>
                    <p>${error.message}</p>
                </div>
            `;
            }
        }
    }

// Add manual load button handler
    document.addEventListener('DOMContentLoaded', function() {
        const manualLoadBtn = document.getElementById('manualLoadBtn');
        if (manualLoadBtn) {
            manualLoadBtn.addEventListener('click', function() {
                loadGameIframe();
            });
        }
    });
    // ========== CHARACTER INTERACTIONS ==========
    function initCharacters() {
        const characters = document.querySelectorAll('.clickable-character');

        characters.forEach(character => {
            character.addEventListener('click', function() {
                const charType = this.getAttribute('data-character');
                const messages = {
                    pooh: [
                        "Oh bother! I think I left my honey pot somewhere...",
                        "Would you like a smackerel of honey with your tea?",
                        "A day without a friend is like a pot without a single drop of honey left inside."
                    ],
                    piglet: [
                        "Oh d-d-dear! It's a very grand party, isn't it?",
                        "I'm not very brave, but I do love celebrations!",
                        "The things that make me different are the things that make me, me."
                    ],
                    tigger: [
                        "Hoo-hoo-hoo-HOO! That's what Tiggers do best!",
                        "Bouncing is what Tiggers do best! Want to bounce with me?",
                        "The most wonderful thing about Tiggers is I'm the only one!"
                    ],
                    roo: [
                        "Look at me bounce! I'm getting very good at it!",
                        "Mama says I'm growing bigger every single day!",
                        "I want to be brave like Tigger when I grow up!"
                    ],
                    gunnar: [
                        "Coming soon to make new friends in the Hundred Acre Wood!",
                        "Can't wait to meet everyone and have adventures!",
                        "My story is just beginning..."
                    ]
                };

                const charMessages = messages[charType] || ["Hello there!"];
                const randomMessage = charMessages[Math.floor(Math.random() * charMessages.length)];

                const messageElement = this.querySelector('.character-message');
                if (messageElement) {
                    messageElement.textContent = randomMessage;
                    messageElement.style.display = 'block';

                    // Hide message after delay
                    setTimeout(() => {
                        messageElement.style.display = 'none';
                    }, 3000);
                }
            });

            // Touch support for mobile
            character.addEventListener('touchstart', function(e) {
                e.preventDefault();
                this.click();
            }, { passive: false });

            // Also show message on hover for desktop
            character.addEventListener('mouseenter', function() {
                if (window.innerWidth > 768) {
                    const messageElement = this.querySelector('.character-message');
                    if (messageElement && !messageElement.textContent) {
                        // Set a default message
                        const charType = this.getAttribute('data-character');
                        const defaultMessages = {
                            pooh: "Would you like some honey?",
                            piglet: "Oh d-d-dear!",
                            tigger: "Hoo-hoo-hoo-HOO!",
                            roo: "Look at me bounce!",
                            gunnar: "Coming soon!"
                        };
                        messageElement.textContent = defaultMessages[charType] || "Hello!";
                        messageElement.style.display = 'block';
                    }
                }
            });

            character.addEventListener('mouseleave', function() {
                const messageElement = this.querySelector('.character-message');
                if (messageElement) {
                    setTimeout(() => {
                        messageElement.style.display = 'none';
                    }, 1000);
                }
            });
        });
    }

    // ========== WISHES FORM ==========
    function initWishesForm() {
        const form = document.getElementById('wishesForm');
        const wishMessage = document.getElementById('wishMessage');
        const characterCount = document.getElementById('characterCount');
        const feedback = document.getElementById('wishFeedback');
        const wishesDisplay = document.getElementById('wishesDisplay');

        if (!form) return;

        // Character counter
        if (wishMessage && characterCount) {
            wishMessage.addEventListener('input', function() {
                const count = this.value.length;
                characterCount.textContent = `${count}/500 characters`;

                // Update color based on count
                if (count > 450) {
                    characterCount.style.color = 'var(--color-pooh-red)';
                } else if (count > 400) {
                    characterCount.style.color = 'var(--color-honey)';
                } else {
                    characterCount.style.color = 'var(--color-text-muted)';
                }
            });
        }

        // Form submission
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = document.getElementById('guestName').value.trim();
            const relation = document.getElementById('guestRelation').value;
            const message = document.getElementById('wishMessage').value.trim();

            // Validation
            if (!name || !message) {
                showFeedback('Please fill in all required fields.', 'error');
                return;
            }

            if (message.length > 500) {
                showFeedback('Message must be 500 characters or less.', 'error');
                return;
            }

            // Sanitize input
            const safeName = sanitizeInput(name);
            const safeMessage = sanitizeInput(message);

            // Create wish object
            const wish = {
                id: Date.now(),
                name: safeName,
                relation: relation || 'friend',
                message: safeMessage,
                timestamp: new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                likes: 0
            };

            // Save to localStorage
            saveWish(wish);

            // Add to display
            displayWish(wish);

            // Reset form
            form.reset();
            if (characterCount) characterCount.textContent = '0/500 characters';

            // Show success message
            showFeedback('Thank you for sharing your wish! It has been added to Gunnar\'s storybook.', 'success');
        });

        function sanitizeInput(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function saveWish(wish) {
            try {
                const wishes = JSON.parse(localStorage.getItem('babyGunnarWishes')) || [];
                wishes.unshift(wish); // Add to beginning
                localStorage.setItem('babyGunnarWishes', JSON.stringify(wishes));
                return true;
            } catch (error) {
                console.error('Error saving wish:', error);
                return false;
            }
        }

        function loadWishes() {
            if (!wishesDisplay) return;

            try {
                const wishes = JSON.parse(localStorage.getItem('babyGunnarWishes')) || [];

                if (wishes.length === 0) {
                    wishesDisplay.innerHTML = `
                                <div style="text-align: center; padding: 40px; color: var(--color-text-muted);">
                                    <div style="font-size: 3rem; margin-bottom: 20px;">💭</div>
                                    <h3>No wishes yet</h3>
                                    <p>Be the first to share your well-wishes for Baby Gunnar!</p>
                                    <p style="font-size: 0.9rem; margin-top: 10px;">Your message will appear here and become part of his storybook.</p>
                                </div>
                            `;
                    return;
                }

                wishesDisplay.innerHTML = '';
                wishes.forEach(wish => {
                    displayWish(wish);
                });
            } catch (error) {
                console.error('Error loading wishes:', error);
            }
        }

        function displayWish(wish) {
            if (!wishesDisplay) return;

            const wishElement = document.createElement('div');
            wishElement.className = 'wish-card';
            wishElement.style.cssText = `
                        background: white;
                        border-radius: var(--radius-md);
                        padding: var(--space-md);
                        margin-bottom: var(--space-sm);
                        border-left: 4px solid var(--color-honey);
                        box-shadow: var(--shadow-sm);
                        transition: all var(--transition-normal);
                    `;

            const relationIcons = {
                family: '👨‍👩‍👦',
                friend: '👫',
                colleague: '💼',
                'woodland-friend': '🐻'
            };

            wishElement.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <span style="font-size: 1.2em;">${relationIcons[wish.relation] || '💝'}</span>
                            <div style="flex: 1;">
                                <strong style="color: var(--color-forest);">${wish.name}</strong>
                                <div style="font-size: 0.8em; color: var(--color-text-muted); text-transform: capitalize;">${wish.relation.replace('-', ' ')}</div>
                            </div>
                            <span style="font-size: 0.8em; color: var(--color-text-muted);">${wish.timestamp}</span>
                        </div>
                        <div style="color: var(--color-text); line-height: 1.6; margin: 10px 0;">
                            ${wish.message.replace(/\n/g, '<br>')}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                            <button class="wish-like-btn" data-id="${wish.id}" style="background: none; border: 1px solid var(--color-border); border-radius: 15px; padding: 4px 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s ease;">
                                <span>❤️</span>
                                <span class="like-count">${wish.likes || 0}</span>
                            </button>
                            <span style="font-size: 0.7em; color: var(--color-text-muted); opacity: 0.6;">#${wish.id.toString().slice(-6)}</span>
                        </div>
                    `;

            // If this is the first wish, clear the "no wishes" message
            if (wishesDisplay.querySelector('div[style*="text-align: center"]')) {
                wishesDisplay.innerHTML = '';
            }

            wishesDisplay.appendChild(wishElement);

            // Add like functionality
            const likeBtn = wishElement.querySelector('.wish-like-btn');
            likeBtn.addEventListener('click', function() {
                const countSpan = this.querySelector('.like-count');
                let count = parseInt(countSpan.textContent) || 0;
                count++;
                countSpan.textContent = count;
                this.style.background = 'rgba(220, 77, 63, 0.1)';
                this.style.borderColor = 'var(--color-pooh-red)';

                // Update localStorage
                updateWishLikes(wish.id, count);
            });
        }

        function updateWishLikes(wishId, newLikes) {
            try {
                const wishes = JSON.parse(localStorage.getItem('babyGunnarWishes')) || [];
                const wishIndex = wishes.findIndex(w => w.id === wishId);
                if (wishIndex !== -1) {
                    wishes[wishIndex].likes = newLikes;
                    localStorage.setItem('babyGunnarWishes', JSON.stringify(wishes));
                }
            } catch (error) {
                console.error('Error updating wish likes:', error);
            }
        }

        function showFeedback(message, type) {
            if (!feedback) return;

            feedback.textContent = message;
            feedback.setAttribute('data-type', type);
            feedback.style.display = 'block';

            // Auto-hide after 5 seconds
            setTimeout(() => {
                feedback.style.display = 'none';
            }, 5000);
        }

        // Load existing wishes
        loadWishes();
    }

    // ========== COUNTDOWN TIMER ==========
    function initCountdown() {
        const daysElement = document.getElementById('days');
        const hoursElement = document.getElementById('hours');

        if (!daysElement || !hoursElement) return;

        // Expected arrival date (Late August 2025)
        const dueDate = new Date('2025-08-25T00:00:00');

        function updateCountdown() {
            const now = new Date();
            const timeDiff = dueDate - now;

            if (timeDiff > 0) {
                const totalDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                const totalHours = Math.floor(timeDiff / (1000 * 60 * 60));

                const days = totalDays;
                const hours = totalHours % 24;

                daysElement.textContent = days.toString().padStart(2, '0');
                hoursElement.textContent = hours.toString().padStart(2, '0');
            } else {
                // Baby has arrived!
                daysElement.textContent = '00';
                hoursElement.textContent = '00';

                // Update message
                const countdownNote = document.querySelector('.countdown-note');
                if (countdownNote) {
                    countdownNote.innerHTML = `
                                <span style="color: var(--color-pooh-red); font-weight: bold;">
                                    🎉 BABY GUNNAR HAS ARRIVED! 🎉
                                </span>
                            `;
                }
            }
        }

        // Initial update
        updateCountdown();

        // Update every hour
        setInterval(updateCountdown, 3600000);
    }

    // ========== MOBILE NAVIGATION ==========
    function updateMobileNav() {
        const mobileBtns = document.querySelectorAll('.mobile-nav-btn');
        mobileBtns.forEach(btn => btn.classList.remove('active'));

        // Highlight current chapter
        switch(currentChapter) {
            case 1:
                document.getElementById('mobileStoryBtn')?.classList.add('active');
                break;
            case 2:
                document.getElementById('mobileGameBtn')?.classList.add('active');
                break;
            case 3:
                document.getElementById('mobileWishesBtn')?.classList.add('active');
                break;
            case 4:
                document.getElementById('mobileStoryBtn')?.classList.add('active');
                break;
        }
    }

    function initMobileNav() {
        // Home button
        document.getElementById('mobileHomeBtn')?.addEventListener('click', showHero);

        // Story button
        document.getElementById('mobileStoryBtn')?.addEventListener('click', () => {
            showStorybook();
            showChapter(1);
        });

        // Game button
        document.getElementById('mobileGameBtn')?.addEventListener('click', () => {
            showStorybook();
            showChapter(2);
        });

        // Wishes button
        document.getElementById('mobileWishesBtn')?.addEventListener('click', () => {
            showStorybook();
            showChapter(3);
        });

        // Menu button
        document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
            showToast('Menu options: Chapter selection, Settings, Share, Print');
        });
    }

    // ========== UTILITY FUNCTIONS ==========
    function announceToScreenReader(message) {
        // Create and remove an aria-live element for screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';

        announcement.textContent = message;
        document.body.appendChild(announcement);

        setTimeout(() => {
            if (announcement.parentNode) {
                document.body.removeChild(announcement);
            }
        }, 1000);
    }

    function announceChapterChange(chapterNumber, chapterTitle) {
        const messages = [
            'A Special Day in the Hundred Acre Wood. An invitation to celebrate.',
            'Pooh\'s Honey Gathering Adventure. Use arrow keys to play the honey catching game.',
            'Gifts from the Heart. View registry and share your wishes.',
            'The Gathering. Celebrating what\'s to come.'
        ];

        const message = messages[chapterNumber - 1] || `Chapter ${chapterNumber}: ${chapterTitle}`;
        announceToScreenReader(message);
    }

    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer') || document.body;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        if (type === 'error') {
            toast.style.background = 'var(--color-pooh-red)';
        }

        toastContainer.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // ========== EVENT LISTENERS ==========
    function setupEventListeners() {
        // Hero buttons
        document.getElementById('startReadingBtn')?.addEventListener('click', showStorybook);
        document.getElementById('playGameBtn')?.addEventListener('click', () => {
            showStorybook();
            showChapter(2);
        });
        document.getElementById('viewRegistryBtn')?.addEventListener('click', () => {
            showStorybook();
            showChapter(3);
        });

        // Back to cover button
        document.getElementById('backToCoverBtn')?.addEventListener('click', showHero);

        // Chapter pills
        document.querySelectorAll('.chapter-pill').forEach(pill => {
            pill.addEventListener('click', function() {
                const chapter = parseInt(this.getAttribute('data-chapter-target'));
                showChapter(chapter);
            });
        });

        // Previous/Next buttons
        document.getElementById('prevBtn')?.addEventListener('click', () => {
            if (currentChapter > 1) {
                showChapter(currentChapter - 1);
            }
        });

        document.getElementById('nextBtn')?.addEventListener('click', () => {
            if (currentChapter < totalChapters) {
                showChapter(currentChapter + 1);
            }
        });

        // Add Hope button
        document.getElementById('addHopeBtn')?.addEventListener('click', () => {
            showChapter(3);
            setTimeout(() => {
                document.getElementById('wishMessage')?.focus();
            }, 500);
        });

        // Footer buttons
        document.getElementById('printPageBtn')?.addEventListener('click', () => {
            window.print();
        });

        document.getElementById('sharePageBtn')?.addEventListener('click', () => {
            if (navigator.share) {
                navigator.share({
                    title: "Baby Gunnar's Hundred Acre Wood Adventure",
                    text: "Join the celebration! Read the storybook, play the honey game, and share your wishes for Baby Gunnar.",
                    url: window.location.href
                }).catch(err => {
                    console.log('Error sharing:', err);
                });
            } else if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(window.location.href)
                    .then(() => showToast('Link copied to clipboard!', 'success'))
                    .catch(() => showToast('Failed to copy link', 'error'));
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = window.location.href;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    showToast('Link copied to clipboard!', 'success');
                } catch (err) {
                    showToast('Failed to copy link', 'error');
                }
                document.body.removeChild(textArea);
            }
        });

        document.getElementById('toggleAnimationsBtn')?.addEventListener('click', () => {
            const isReduced = document.body.classList.toggle('reduced-motion');
            localStorage.setItem('reducedMotion', isReduced ? 'true' : 'false');
            showToast(isReduced ? 'Animations reduced' : 'Animations enabled');
        });

        document.getElementById('soundToggle')?.addEventListener('click', function() {
            const isMuted = document.body.classList.toggle('audio-muted');
            localStorage.setItem('audioMuted', isMuted ? 'true' : 'false');
            showToast(isMuted ? 'Sound muted' : 'Sound enabled');
        });

        document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });

        document.getElementById('themeToggle')?.addEventListener('click', function() {
            const isDark = document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            showToast(`${isDark ? 'Dark' : 'Light'} theme enabled`);
        });

        // Skip link
        document.getElementById('skipLink')?.addEventListener('click', function(e) {
            e.preventDefault();
            showStorybook();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.setAttribute('tabindex', '-1');
                target.focus();
                setTimeout(() => target.removeAttribute('tabindex'), 1000);
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            // Don't interfere with form inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }

            // Arrow keys for chapter navigation
            switch(e.key) {
                case 'ArrowLeft':
                    if (currentChapter > 1) {
                        e.preventDefault();
                        showChapter(currentChapter - 1);
                    }
                    break;
                case 'ArrowRight':
                    if (currentChapter < totalChapters) {
                        e.preventDefault();
                        showChapter(currentChapter + 1);
                    }
                    break;
                case 'Escape':
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                    break;
                case 'Home':
                    e.preventDefault();
                    showHero();
                    break;
                case 'End':
                    e.preventDefault();
                    showStorybook();
                    showChapter(totalChapters);
                    break;
            }
        });
    }

    // ========== INITIALIZATION ==========
    function initApp() {
        // Load preferences
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }

        const reducedMotion = localStorage.getItem('reducedMotion');
        if (reducedMotion === 'true') {
            document.body.classList.add('reduced-motion');
        }

        // Initialize modules
        initCharacters();
        initWishesForm();
        initCountdown();
        initMobileNav();
        setupEventListeners();

        // Update initial state
        updateNavigation();
        updateProgress();
        updateMobileNav();

        // Show hero by default
        showHero();

        // Add resize handler for responsive adjustments
        window.addEventListener('resize', updateMobileNav);
    }

    // Start the app
    initApp();
}

// Safety fallback: if loading gets stuck, hide it after 5 seconds
setTimeout(() => {
    const loadingScreen = document.getElementById('enhancedLoadingScreen');
    if (loadingScreen && loadingScreen.style.display !== 'none') {
        console.log('Safety timeout: Hiding loading screen');
        hideLoadingScreen();
    }
}, 5000);