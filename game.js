<!DOCTYPE html>
<html lang="en">
<head>
    <!-- ... existing head content ... -->
    
    <!-- Main CSS -->
    <link rel="stylesheet" href="styles.css">
    
    <!-- Game-specific CSS will be injected by game.js -->
</head>
<body>
    <!-- ... existing body content ... -->

    <!-- Chapter 2: Honey Hive Defense Game -->
    <section class="content-section" id="chapter2">
        <div class="game-description">
            <h3><i class="fas fa-shield-alt"></i> Honey Hive Defense</h3>
            <p>Protect the honey jars from Heffalumps, Woozles, and bees! Place your Hundred Acre Wood friends along the path and upgrade them to keep the honey safe.</p>
            
            <div class="game-tips">
                <div class="tip">
                    <i class="fas fa-mouse-pointer"></i>
                    <p><strong>Click</strong> on the field to place towers</p>
                </div>
                <div class="tip">
                    <i class="fas fa-coins"></i>
                    <p>Collect <strong>honey</strong> by defeating enemies</p>
                </div>
                <div class="tip">
                    <i class="fas fa-sync-alt"></i>
                    <p><strong>Upgrade</strong> towers for more power</p>
                </div>
            </div>
        </div>

        <div class="game-card" id="defense-card">
            <canvas id="defense-game" width="600" height="400" class="game-canvas"></canvas>
            
            <div class="game-controls">
                <div class="game-stats">
                    <div class="stat-item">
                        <span class="stat-label">Honey:</span>
                        <span id="honey-count" class="stat-value">100</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Lives:</span>
                        <span id="lives-count" class="stat-value">10</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Wave:</span>
                        <span id="wave-count" class="stat-value">1</span>
                    </div>
                </div>
                
                <div class="tower-selection">
                    <button class="tower-option selected" data-tower="pooh">
                        <i class="fas fa-bear"></i> Pooh
                    </button>
                    <button class="tower-option" data-tower="tigger">
                        <i class="fas fa-paw"></i> Tigger
                    </button>
                    <button class="tower-option" data-tower="piglet">
                        <i class="fas fa-heart"></i> Piglet
                    </button>
                    <button class="tower-option" data-tower="eeyore">
                        <i class="fas fa-cloud"></i> Eeyore
                    </button>
                </div>
                
                <div class="game-actions">
                    <button id="start-defense" class="game-btn primary">
                        <i class="fas fa-play"></i> Start Wave
                    </button>
                    <button id="upgrade-tower" class="game-btn secondary">
                        <i class="fas fa-level-up-alt"></i> Upgrade All (50 honey)
                    </button>
                </div>
                
                <div id="defense-alert" class="game-alert"></div>
                <div id="defense-wave-status" class="wave-status"></div>
            </div>
        </div>
    </section>

    <!-- Chapter 3: Honey Pot Catch Game -->
    <section class="content-section" id="chapter3">
        <div class="game-description">
            <h3><i class="fas fa-basketball-ball"></i> Honey Pot Catch</h3>
            <p>Help Pooh catch falling honey pots while avoiding angry bees! Move left and right with arrow keys or touch controls.</p>
            
            <div class="game-tips">
                <div class="tip">
                    <i class="fas fa-arrow-left"></i>
                    <i class="fas fa-arrow-right"></i>
                    <p>Use <strong>arrow keys</strong> or <strong>touch</strong> to move Pooh</p>
                </div>
                <div class="tip">
                    <i class="fas fa-star"></i>
                    <p>Catch <strong>honey pots</strong> for 10 points each</p>
                </div>
                <div class="tip">
                    <i class="fas fa-bug"></i>
                    <p>Avoid <strong>bees</strong> - they cost 1 life</p>
                </div>
            </div>
        </div>

        <div class="game-card" id="catch-card">
            <div class="game-container">
                <canvas id="honey-game" width="600" height="500" class="game-canvas"></canvas>
                
                <div id="catch-overlay" class="game-overlay">
                    <div id="catch-countdown" class="countdown-display">Ready when you are.</div>
                    <div id="catch-hint" class="hint-text">Press start to begin a calm 60 second run.</div>
                </div>
            </div>
            
            <div class="game-controls">
                <div class="game-stats">
                    <div class="stat-item">
                        <span class="stat-label">Score:</span>
                        <span id="score-count" class="stat-value">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Time:</span>
                        <span id="time-count" class="stat-value">60</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Lives:</span>
                        <span id="catch-lives" class="stat-value">3</span>
                    </div>
                </div>
                
                <div class="game-actions">
                    <button id="start-catch" class="game-btn primary">
                        <i class="fas fa-play"></i> Start Game
                    </button>
                    <button id="pause-catch" class="game-btn secondary">
                        <i class="fas fa-pause"></i> Pause
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- Scripts -->
    <!-- Main UI functionality -->
    <script src="script.js"></script>
    
    <!-- Consolidated game module -->
    <script src="game.js"></script>
    
    <!-- Optional: Load Font Awesome for icons -->
    <script src="https://kit.fontawesome.com/your-fontawesome-kit.js" crossorigin="anonymous"></script>
</body>
</html>
