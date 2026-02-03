/**
 * Space Ludo - Bundled Game (No Server Required)
 * All game code in one file for local file:// access
 */

// IMMEDIATELY remove debug panel on load (before anything else)
// This runs multiple times to ensure complete removal
(function removeDebugPanel() {
    function cleanup() {
        // Remove by ID
        var elementsToRemove = [
            'debug-panel',
            'debug-open',
            'debug-close',
            'debug-toggle',
            'debug-clear',
            'debug-btn',
            'debug-toolbar',
            'debug-status'
        ];

        elementsToRemove.forEach(function(id) {
            var el = document.getElementById(id);
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });

        // Remove by class name
        var classesToRemove = [
            'debug-panel',
            'debug-open',
            'debug-header',
            'debug-content',
            'debug-controls',
            'debug-btn',
            'debug-log',
            'debug-toolbar',
            'debug-open-btn'
        ];

        classesToRemove.forEach(function(className) {
            var elements = document.getElementsByClassName(className);
            // Convert to array to avoid live collection issues
            var arr = Array.prototype.slice.call(elements);
            arr.forEach(function(el) {
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            });
        });
    }

    // Run immediately
    cleanup();

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cleanup);
    } else {
        cleanup();
    }

    // Run after everything loads
    window.addEventListener('load', cleanup);

    // Run periodically for the first few seconds to catch any dynamically added panels
    var cleanupInterval = setInterval(cleanup, 100);
    setTimeout(function() {
        clearInterval(cleanupInterval);
    }, 3000);
})();

(function() {
    'use strict';

    // ============================================
    // CONSTANTS
    // ============================================

    const BOARD_SIZE = 15;
    const TOKENS_PER_PLAYER = 4;
    const TRACK_LENGTH = 52; // Main track has 52 cells (index 0-51)
    const HOME_PATH_LENGTH = 6;
    const MAX_CONSECUTIVE_SIXES = 3;

    const PLAYER_ORDER = ['RED', 'GREEN', 'YELLOW', 'BLUE'];

    const PLAYER_COLORS = {
        RED: { primary: '#ff3366', secondary: '#ff6699', glow: 'rgba(255, 51, 102, 0.6)' },
        GREEN: { primary: '#33ff66', secondary: '#66ff99', glow: 'rgba(51, 255, 102, 0.6)' },
        YELLOW: { primary: '#ffff33', secondary: '#ffff66', glow: 'rgba(255, 255, 51, 0.6)' },
        BLUE: { primary: '#3366ff', secondary: '#6699ff', glow: 'rgba(51, 102, 255, 0.6)' }
    };

    const GAME_PHASE = {
        MENU: 'MENU',
        SETUP: 'SETUP',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        GAME_OVER: 'GAME_OVER'
    };

    const TURN_PHASE = {
        WAITING: 'WAITING',
        ROLLING: 'ROLLING',
        SELECTING: 'SELECTING',
        MOVING: 'MOVING'
    };

    const AI_DIFFICULTY = {
        EASY: { name: 'Easy', thinkTime: 500, randomness: 0.7 },
        MEDIUM: { name: 'Medium', thinkTime: 800, randomness: 0.3 },
        HARD: { name: 'Hard', thinkTime: 1000, randomness: 0.1 }
    };

    const ANIMATION_DURATIONS = {
        DICE_ROLL: 800,
        TOKEN_MOVE: 300,
        TOKEN_CAPTURE: 500,
        TURN_DELAY: 500,
        MESSAGE_DISPLAY: 1500,
        AI_THINK: 600
    };

    // Home base positions for each player (4 slots each)
    const HOME_BASES = {
        RED: [
            { row: 1, col: 1 }, { row: 1, col: 2 },
            { row: 2, col: 1 }, { row: 2, col: 2 }
        ],
        GREEN: [
            { row: 1, col: 12 }, { row: 1, col: 13 },
            { row: 2, col: 12 }, { row: 2, col: 13 }
        ],
        YELLOW: [
            { row: 12, col: 12 }, { row: 12, col: 13 },
            { row: 13, col: 12 }, { row: 13, col: 13 }
        ],
        BLUE: [
            { row: 12, col: 1 }, { row: 12, col: 2 },
            { row: 13, col: 1 }, { row: 13, col: 2 }
        ]
    };

    // Entry positions onto main track for each player
    const ENTRY_POSITIONS = {
        RED: { row: 6, col: 1, trackIndex: 0 },
        GREEN: { row: 1, col: 8, trackIndex: 13 },
        YELLOW: { row: 8, col: 13, trackIndex: 26 },
        BLUE: { row: 13, col: 6, trackIndex: 39 }
    };

    // Main track path (52 cells, clockwise)
    const MAIN_TRACK = [
        // Red start area going up
        { row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 },
        // Turn up
        { row: 5, col: 6 }, { row: 4, col: 6 }, { row: 3, col: 6 }, { row: 2, col: 6 }, { row: 1, col: 6 },
        // Turn right
        { row: 0, col: 6 },
        // Green area going right
        { row: 0, col: 7 }, { row: 0, col: 8 },
        // Turn down
        { row: 1, col: 8 }, { row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 }, { row: 5, col: 8 },
        // Going right
        { row: 6, col: 9 }, { row: 6, col: 10 }, { row: 6, col: 11 }, { row: 6, col: 12 }, { row: 6, col: 13 },
        // Turn down
        { row: 6, col: 14 },
        // Yellow area going down
        { row: 7, col: 14 }, { row: 8, col: 14 },
        // Turn left
        { row: 8, col: 13 }, { row: 8, col: 12 }, { row: 8, col: 11 }, { row: 8, col: 10 }, { row: 8, col: 9 },
        // Going down
        { row: 9, col: 8 }, { row: 10, col: 8 }, { row: 11, col: 8 }, { row: 12, col: 8 }, { row: 13, col: 8 },
        // Turn left
        { row: 14, col: 8 },
        // Blue area going left
        { row: 14, col: 7 }, { row: 14, col: 6 },
        // Turn up
        { row: 13, col: 6 }, { row: 12, col: 6 }, { row: 11, col: 6 }, { row: 10, col: 6 }, { row: 9, col: 6 },
        // Going left
        { row: 8, col: 5 }, { row: 8, col: 4 }, { row: 8, col: 3 }, { row: 8, col: 2 }, { row: 8, col: 1 },
        // Turn up to complete loop
        { row: 8, col: 0 }, { row: 7, col: 0 }, { row: 6, col: 0 }
    ];

    // Home stretch paths (6 cells each, leading to center)
    const HOME_PATHS = {
        RED: [
            { row: 7, col: 1 }, { row: 7, col: 2 }, { row: 7, col: 3 },
            { row: 7, col: 4 }, { row: 7, col: 5 }, { row: 7, col: 6 }
        ],
        GREEN: [
            { row: 1, col: 7 }, { row: 2, col: 7 }, { row: 3, col: 7 },
            { row: 4, col: 7 }, { row: 5, col: 7 }, { row: 6, col: 7 }
        ],
        YELLOW: [
            { row: 7, col: 13 }, { row: 7, col: 12 }, { row: 7, col: 11 },
            { row: 7, col: 10 }, { row: 7, col: 9 }, { row: 7, col: 8 }
        ],
        BLUE: [
            { row: 13, col: 7 }, { row: 12, col: 7 }, { row: 11, col: 7 },
            { row: 10, col: 7 }, { row: 9, col: 7 }, { row: 8, col: 7 }
        ]
    };

    // Home entry points (where players enter home path from main track)
    // Each player enters their home path after passing their entry point
    const HOME_ENTRY_POINTS = {
        RED: 51,   // Last cell (index 51) before wrapping to 0
        GREEN: 12,
        YELLOW: 25,
        BLUE: 38
    };

    // Safe zone positions (starting positions only - cannot be captured here)
    const SAFE_ZONES = [
        { row: 6, col: 1 },   // Red start
        { row: 1, col: 8 },   // Green start
        { row: 8, col: 13 },  // Yellow start
        { row: 13, col: 6 }   // Blue start
    ];

    function isSafeZone(row, col) {
        return SAFE_ZONES.some(sz => sz.row === row && sz.col === col);
    }

    // ============================================
    // XP & LEVELING SYSTEM
    // ============================================

    const XP_CONFIG = {
        // XP rewards for actions
        REWARDS: {
            WIN_GAME: 100,
            CAPTURE_TOKEN: 15,
            FINISH_TOKEN: 25,
            PLAY_GAME: 20,
            ROLL_SIX: 5
        },
        // Level thresholds (XP needed for each level)
        getXPForLevel: (level) => Math.floor(100 * Math.pow(1.2, level - 1)),
        // Level rewards
        LEVEL_REWARDS: {
            5: { title: 'Rookie', reward: 'New title unlocked!' },
            10: { title: 'Player', reward: 'New title unlocked!' },
            15: { title: 'Skilled', reward: 'New title unlocked!' },
            20: { title: 'Expert', reward: 'New title unlocked!' },
            25: { title: 'Master', reward: 'New title unlocked!' },
            30: { title: 'Champion', reward: 'New title unlocked!' },
            40: { title: 'Legend', reward: 'New title unlocked!' },
            50: { title: 'Cosmic', reward: 'New title unlocked!' }
        }
    };

    // ============================================
    // EVENT BUS
    // ============================================

    const GameEvents = {
        // Game flow
        GAME_START: 'game:start',
        GAME_END: 'game:end',
        GAME_PAUSE: 'game:pause',
        GAME_RESUME: 'game:resume',

        // Turn events
        TURN_START: 'turn:start',
        TURN_END: 'turn:end',
        TURN_SKIP: 'turn:skip',

        // Dice events
        DICE_ROLL_START: 'dice:rollStart',
        DICE_ROLLED: 'dice:rolled',

        // Token events
        TOKEN_SELECT: 'token:select',
        TOKEN_DESELECT: 'token:deselect',
        TOKEN_MOVE_START: 'token:moveStart',
        TOKEN_MOVE: 'token:move',
        TOKEN_MOVE_COMPLETE: 'token:moveComplete',
        TOKEN_CAPTURE: 'token:capture',
        TOKEN_UNLOCK: 'token:unlock',
        TOKEN_FINISH: 'token:finish',

        // Player events
        PLAYER_WIN: 'player:win',

        // UI events
        SHOW_MESSAGE: 'ui:showMessage',
        VALID_MOVES_UPDATE: 'ui:validMovesUpdate',
        TOGGLE_SOUND: 'ui:toggleSound',

        // Effect events
        EFFECT_CAPTURE: 'effect:capture',
        EFFECT_SHAKE: 'effect:shake',
        EFFECT_VICTORY: 'effect:victory',

        // XP events
        XP_GAINED: 'xp:gained',
        LEVEL_UP: 'xp:levelUp'
    };

    class EventBus {
        constructor() {
            this.listeners = new Map();
        }

        on(event, callback) {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            this.listeners.get(event).push(callback);
            return () => this.off(event, callback);
        }

        off(event, callback) {
            if (!this.listeners.has(event)) return;
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }

        emit(event, data = {}) {
            if (!this.listeners.has(event)) return;
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }

        once(event, callback) {
            const wrapper = (data) => {
                this.off(event, wrapper);
                callback(data);
            };
            this.on(event, wrapper);
        }
    }

    const eventBus = new EventBus();

    // ============================================
    // TOKEN CLASS
    // ============================================

    class Token {
        constructor(id, playerIndex, color, homeSlot) {
            this.id = id;
            this.playerIndex = playerIndex;
            this.color = color;
            this.homeSlot = homeSlot;

            this.state = 'home'; // 'home', 'active', 'finished'
            this.position = null;
            this.trackIndex = -1;
            this.homePathIndex = -1;
        }

        isAtHome() {
            return this.state === 'home';
        }

        isActive() {
            return this.state === 'active';
        }

        isFinished() {
            return this.state === 'finished';
        }

        isOnHomePath() {
            return this.homePathIndex >= 0;
        }

        getHomeBasePosition() {
            return HOME_BASES[this.color][this.homeSlot];
        }

        getEntryPosition() {
            return ENTRY_POSITIONS[this.color];
        }

        getEntryTrackIndex() {
            return ENTRY_POSITIONS[this.color].trackIndex;
        }

        unlock() {
            if (this.state !== 'home') return false;

            this.state = 'active';
            const entry = this.getEntryPosition();
            this.position = { row: entry.row, col: entry.col };
            this.trackIndex = entry.trackIndex;
            this.homePathIndex = -1;

            return true;
        }

        moveTo(position, trackIndex, homePathIndex = -1) {
            this.position = { ...position };
            this.trackIndex = trackIndex;
            this.homePathIndex = homePathIndex;
        }

        finish() {
            this.state = 'finished';
            this.position = { row: 7, col: 7 }; // Center
            this.trackIndex = -1;
            this.homePathIndex = -1;
        }

        sendHome() {
            this.state = 'home';
            this.position = null;
            this.trackIndex = -1;
            this.homePathIndex = -1;
        }

        getProgress() {
            if (this.state === 'home') return 0;
            if (this.state === 'finished') return TRACK_LENGTH + HOME_PATH_LENGTH;

            if (this.homePathIndex >= 0) {
                return TRACK_LENGTH + this.homePathIndex;
            }

            const entryIndex = this.getEntryTrackIndex();
            if (this.trackIndex >= entryIndex) {
                return this.trackIndex - entryIndex;
            }
            return (TRACK_LENGTH - entryIndex) + this.trackIndex;
        }
    }

    // ============================================
    // PLAYER CLASS
    // ============================================

    class Player {
        constructor(index, config = {}) {
            this.index = index;
            this.id = index;
            this.color = PLAYER_ORDER[index];
            this.name = config.name || `Player ${index + 1}`;
            this.isAI = config.isAI || false;
            this.aiDifficulty = config.aiDifficulty || 'MEDIUM';

            this.tokens = this.initTokens();
            this.finishedTokens = 0;
            this.consecutiveSixes = 0;
        }

        initTokens() {
            const tokens = [];
            for (let i = 0; i < TOKENS_PER_PLAYER; i++) {
                tokens.push(new Token(
                    `${this.color}_${i}`,
                    this.index,
                    this.color,
                    i
                ));
            }
            return tokens;
        }

        getTokenById(tokenId) {
            return this.tokens.find(t => t.id === tokenId);
        }

        getHomeTokens() {
            return this.tokens.filter(t => t.isAtHome());
        }

        getActiveTokens() {
            return this.tokens.filter(t => t.isActive());
        }

        getFinishedTokens() {
            return this.tokens.filter(t => t.isFinished());
        }

        hasWon() {
            return this.finishedTokens >= TOKENS_PER_PLAYER;
        }

        recordSix() {
            this.consecutiveSixes++;
        }

        resetSixes() {
            this.consecutiveSixes = 0;
        }

        getOverallProgress() {
            let total = 0;
            const maxProgress = TRACK_LENGTH + HOME_PATH_LENGTH;
            for (const token of this.tokens) {
                total += token.getProgress() / maxProgress;
            }
            return total / TOKENS_PER_PLAYER;
        }

        toObject() {
            return {
                index: this.index,
                color: this.color,
                name: this.name,
                isAI: this.isAI,
                finishedTokens: this.finishedTokens,
                tokens: this.tokens.map(t => ({
                    id: t.id,
                    state: t.state,
                    position: t.position,
                    trackIndex: t.trackIndex,
                    homePathIndex: t.homePathIndex
                }))
            };
        }
    }

    // ============================================
    // GAME STATE
    // ============================================

    class GameState {
        constructor() {
            this.reset();
        }

        reset() {
            this.phase = GAME_PHASE.MENU;
            this.turnPhase = TURN_PHASE.WAITING;
            this.gameMode = null;
            this.aiDifficulty = 'MEDIUM';

            this.players = [];
            this.currentPlayerIndex = 0;

            this.diceValue = null;
            this.consecutiveSixes = 0;
            this.rollsThisTurn = 0;

            this.selectedToken = null;
            this.validMoves = [];

            this.winner = null;
            this.soundEnabled = true;
            this.isOnlineGame = false;
            this.isPaused = false;
        }

        togglePause() {
            if (this.isOnlineGame) {
                console.warn('Cannot pause online games');
                return false;
            }
            this.isPaused = !this.isPaused;
            console.log('Game ' + (this.isPaused ? 'PAUSED' : 'RESUMED'));
            eventBus.emit(this.isPaused ? GameEvents.GAME_PAUSE : GameEvents.GAME_RESUME, { paused: this.isPaused });
            return this.isPaused;
        }

        initGame(config) {
            this.reset();
            this.gameMode = config.mode;
            this.aiDifficulty = config.aiDifficulty || 'MEDIUM';

            this.players = config.players.map((playerData, index) => {
                return new Player(index, {
                    name: playerData.name || `Player ${index + 1}`,
                    isAI: playerData.isAI || false,
                    aiDifficulty: config.aiDifficulty || 'MEDIUM'
                });
            });

            this.phase = GAME_PHASE.PLAYING;
            this.turnPhase = TURN_PHASE.WAITING;
            this.currentPlayerIndex = 0;

            eventBus.emit(GameEvents.GAME_START, {
                players: this.players,
                mode: this.gameMode
            });
        }

        getCurrentPlayer() {
            return this.players[this.currentPlayerIndex];
        }

        getToken(tokenId) {
            for (const player of this.players) {
                const token = player.getTokenById(tokenId);
                if (token) return token;
            }
            return null;
        }

        getActiveTokens() {
            const active = [];
            for (const player of this.players) {
                active.push(...player.getActiveTokens());
            }
            return active;
        }

        getTokensAtPosition(row, col) {
            return this.getActiveTokens().filter(
                t => t.position && t.position.row === row && t.position.col === col
            );
        }

        setDiceValue(value) {
            this.diceValue = value;
            this.rollsThisTurn++;

            if (value === 6) {
                this.consecutiveSixes++;
            } else {
                this.consecutiveSixes = 0;
            }

            eventBus.emit(GameEvents.DICE_ROLLED, {
                value,
                player: this.getCurrentPlayer(),
                consecutiveSixes: this.consecutiveSixes
            });

            // Broadcast to online players (own turn or host for AI turn)
            if (this.isOnlineGame && networkManager.isOnline && networkManager.shouldHandleCurrentTurn()) {
                networkManager.broadcastAction('DICE_ROLL', {
                    value,
                    playerIndex: this.currentPlayerIndex,
                    consecutiveSixes: this.consecutiveSixes
                });
            }
        }

        canRollAgain() {
            return this.diceValue === 6 && this.consecutiveSixes < 3;
        }

        isTurnForfeited() {
            return this.consecutiveSixes >= 3;
        }

        selectToken(tokenId) {
            this.selectedToken = tokenId;
        }

        setValidMoves(moves) {
            this.validMoves = moves;
            eventBus.emit(GameEvents.VALID_MOVES_UPDATE, { moves });
        }

        nextTurn() {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            this.diceValue = null;
            this.consecutiveSixes = 0;
            this.rollsThisTurn = 0;
            this.selectedToken = null;
            this.validMoves = [];
            this.turnPhase = TURN_PHASE.WAITING;
        }

        setWinner(player) {
            this.winner = player;
            this.phase = GAME_PHASE.GAME_OVER;
            eventBus.emit(GameEvents.PLAYER_WIN, { player });
        }

        toggleSound() {
            this.soundEnabled = !this.soundEnabled;
            eventBus.emit(GameEvents.TOGGLE_SOUND, { enabled: this.soundEnabled });
            return this.soundEnabled;
        }

        // Save game to localStorage
        saveGame() {
            if (this.phase !== GAME_PHASE.PLAYING) return;

            const saveData = {
                phase: this.phase,
                turnPhase: this.turnPhase,
                gameMode: this.gameMode,
                aiDifficulty: this.aiDifficulty,
                currentPlayerIndex: this.currentPlayerIndex,
                diceValue: this.diceValue,
                consecutiveSixes: this.consecutiveSixes,
                soundEnabled: this.soundEnabled,
                players: this.players.map(p => ({
                    index: p.index,
                    color: p.color,
                    name: p.name,
                    isAI: p.isAI,
                    aiDifficulty: p.aiDifficulty,
                    finishedTokens: p.finishedTokens,
                    tokens: p.tokens.map(t => ({
                        id: t.id,
                        playerIndex: t.playerIndex,
                        color: t.color,
                        homeSlot: t.homeSlot,
                        state: t.state,
                        position: t.position,
                        trackIndex: t.trackIndex,
                        homePathIndex: t.homePathIndex
                    }))
                }))
            };

            try {
                localStorage.setItem('spaceLudoSave', JSON.stringify(saveData));
                console.log('Game saved!');
            } catch (e) {
                console.error('Failed to save game:', e);
            }
        }

        // Load game from localStorage
        loadGame() {
            try {
                const savedData = localStorage.getItem('spaceLudoSave');
                if (!savedData) return false;

                const data = JSON.parse(savedData);

                // Restore basic state
                this.phase = data.phase;
                this.turnPhase = TURN_PHASE.WAITING;
                this.gameMode = data.gameMode;
                this.aiDifficulty = data.aiDifficulty;
                this.currentPlayerIndex = data.currentPlayerIndex;
                this.diceValue = null;
                this.consecutiveSixes = data.consecutiveSixes || 0;
                this.soundEnabled = data.soundEnabled;
                this.validMoves = [];
                this.selectedToken = null;

                // Restore players and tokens
                this.players = data.players.map(pData => {
                    const player = new Player(pData.index, {
                        name: pData.name,
                        isAI: pData.isAI,
                        aiDifficulty: pData.aiDifficulty
                    });
                    player.finishedTokens = pData.finishedTokens;

                    // Restore token states
                    pData.tokens.forEach((tData, i) => {
                        const token = player.tokens[i];
                        token.state = tData.state;
                        token.position = tData.position;
                        token.trackIndex = tData.trackIndex;
                        token.homePathIndex = tData.homePathIndex;
                    });

                    return player;
                });

                console.log('Game loaded!');
                return true;
            } catch (e) {
                console.error('Failed to load game:', e);
                return false;
            }
        }

        // Check if save exists
        hasSavedGame() {
            return localStorage.getItem('spaceLudoSave') !== null;
        }

        // Clear saved game
        clearSave() {
            localStorage.removeItem('spaceLudoSave');
        }
    }

    const gameState = new GameState();

    // ============================================
    // BOARD LOGIC
    // ============================================

    const Board = {
        getTrackPosition(trackIndex) {
            if (trackIndex < 0 || trackIndex >= TRACK_LENGTH) return null;
            return MAIN_TRACK[trackIndex];
        },

        getHomePathPosition(color, homePathIndex) {
            if (homePathIndex < 0 || homePathIndex >= HOME_PATH_LENGTH) return null;
            return HOME_PATHS[color][homePathIndex];
        },

        calculateNewPosition(token, steps) {
            if (token.isAtHome()) {
                if (steps === 6) {
                    return {
                        position: token.getEntryPosition(),
                        trackIndex: token.getEntryTrackIndex(),
                        homePathIndex: -1,
                        type: 'unlock'
                    };
                }
                return null;
            }

            if (token.isOnHomePath()) {
                const newHomePathIndex = token.homePathIndex + steps;
                if (newHomePathIndex === HOME_PATH_LENGTH - 1) {
                    return {
                        position: HOME_PATHS[token.color][newHomePathIndex],
                        trackIndex: -1,
                        homePathIndex: newHomePathIndex,
                        type: 'finish'
                    };
                }
                if (newHomePathIndex > HOME_PATH_LENGTH - 1) {
                    return null; // Overshoot
                }
                return {
                    position: HOME_PATHS[token.color][newHomePathIndex],
                    trackIndex: -1,
                    homePathIndex: newHomePathIndex,
                    type: 'move'
                };
            }

            // On main track
            const entryIndex = token.getEntryTrackIndex();
            const homeEntryPoint = HOME_ENTRY_POINTS[token.color];

            // Calculate how far the token has traveled from its start
            let distanceFromStart;
            if (token.trackIndex >= entryIndex) {
                distanceFromStart = token.trackIndex - entryIndex;
            } else {
                distanceFromStart = (TRACK_LENGTH - entryIndex) + token.trackIndex;
            }

            // Token must travel at least 51 cells (almost full lap) before entering home
            // This is TRACK_LENGTH - 1 cells from start to be eligible for home entry
            const minDistanceForHome = TRACK_LENGTH - 1; // 51 cells

            // Calculate steps to home entry (only if eligible)
            let stepsToHomeEntry;
            if (token.trackIndex <= homeEntryPoint) {
                stepsToHomeEntry = homeEntryPoint - token.trackIndex;
            } else {
                stepsToHomeEntry = (TRACK_LENGTH - token.trackIndex) + homeEntryPoint;
            }

            // Check if token is eligible to enter home (has traveled enough)
            // Token is eligible if: distanceFromStart + steps >= minDistanceForHome
            const willBeEligible = (distanceFromStart + steps) >= minDistanceForHome;

            // Debug logging for home entry
            console.log(`HOME CHECK [${token.color}]: trackIndex=${token.trackIndex}, steps=${steps}, distanceFromStart=${distanceFromStart}, stepsToHomeEntry=${stepsToHomeEntry}, willBeEligible=${willBeEligible}, condition=${steps > stepsToHomeEntry}`);

            // Check if we should enter home path
            if (willBeEligible && steps > stepsToHomeEntry && stepsToHomeEntry >= 0) {
                const homePathSteps = steps - stepsToHomeEntry - 1;
                if (homePathSteps >= HOME_PATH_LENGTH) {
                    return null; // Overshoot
                }
                if (homePathSteps === HOME_PATH_LENGTH - 1) {
                    return {
                        position: HOME_PATHS[token.color][homePathSteps],
                        trackIndex: -1,
                        homePathIndex: homePathSteps,
                        type: 'finish'
                    };
                }
                return {
                    position: HOME_PATHS[token.color][homePathSteps],
                    trackIndex: -1,
                    homePathIndex: homePathSteps,
                    type: 'enterHome'
                };
            }

            // Normal track movement
            const newTrackIndex = (token.trackIndex + steps) % TRACK_LENGTH;
            const newPosition = MAIN_TRACK[newTrackIndex];
            if (!newPosition) {
                console.error('Invalid track index:', newTrackIndex, 'TRACK_LENGTH:', TRACK_LENGTH, 'MAIN_TRACK length:', MAIN_TRACK.length);
                return null;
            }
            return {
                position: newPosition,
                trackIndex: newTrackIndex,
                homePathIndex: -1,
                type: 'move'
            };
        },

        getPath(token, endPosition, endTrackIndex, endHomePathIndex) {
            const path = [];

            if (token.isAtHome()) {
                if (endPosition) path.push(endPosition);
                return path;
            }

            if (token.isOnHomePath()) {
                const homePath = HOME_PATHS[token.color];
                if (homePath) {
                    for (let i = token.homePathIndex + 1; i <= endHomePathIndex && i < homePath.length; i++) {
                        if (homePath[i]) path.push(homePath[i]);
                    }
                }
                return path;
            }

            // On main track
            let currentIndex = token.trackIndex;
            let loopGuard = 0; // Prevent infinite loop

            if (endHomePathIndex >= 0) {
                // Moving to home path
                const homeEntry = HOME_ENTRY_POINTS[token.color];
                while (currentIndex !== homeEntry && loopGuard < TRACK_LENGTH + 10) {
                    currentIndex = (currentIndex + 1) % TRACK_LENGTH;
                    if (MAIN_TRACK[currentIndex]) path.push(MAIN_TRACK[currentIndex]);
                    loopGuard++;
                }
                const homePath = HOME_PATHS[token.color];
                if (homePath) {
                    for (let i = 0; i <= endHomePathIndex && i < homePath.length; i++) {
                        if (homePath[i]) path.push(homePath[i]);
                    }
                }
            } else {
                // Staying on track - add each step including the final position
                while (loopGuard < TRACK_LENGTH + 10) {
                    currentIndex = (currentIndex + 1) % TRACK_LENGTH;
                    if (MAIN_TRACK[currentIndex]) path.push(MAIN_TRACK[currentIndex]);
                    loopGuard++;
                    if (currentIndex === endTrackIndex) break;
                }
            }

            return path;
        }
    };

    // ============================================
    // RULES ENGINE
    // ============================================

    const Rules = {
        getValidMoves(player, diceValue, allPlayers) {
            const moves = [];

            for (const token of player.tokens) {
                if (token.isFinished()) continue;

                const result = Board.calculateNewPosition(token, diceValue);
                if (!result) continue;

                const move = {
                    tokenId: token.id,
                    token: token,
                    fromPosition: token.position ? { ...token.position } : null,
                    toPosition: result.position,
                    fromTrackIndex: token.trackIndex,
                    toTrackIndex: result.trackIndex,
                    fromHomePathIndex: token.homePathIndex,
                    toHomePathIndex: result.homePathIndex,
                    type: result.type,
                    diceValue: diceValue
                };

                // Check for capture
                if (result.position && result.type !== 'unlock' && result.type !== 'finish' && result.homePathIndex < 0) {
                    const tokensAtTarget = this.getOpponentTokensAt(
                        result.position.row,
                        result.position.col,
                        player.index,
                        allPlayers
                    );

                    if (tokensAtTarget.length > 0 && !isSafeZone(result.position.row, result.position.col)) {
                        move.capture = tokensAtTarget[0];
                        move.type = 'capture';
                    }
                }

                if (result.position) {
                    move.path = Board.getPath(token, result.position, result.trackIndex, result.homePathIndex);
                } else {
                    move.path = [];
                }
                moves.push(move);
            }

            return moves;
        },

        getOpponentTokensAt(row, col, playerIndex, allPlayers) {
            const tokens = [];
            for (const player of allPlayers) {
                if (player.index === playerIndex) continue;
                for (const token of player.getActiveTokens()) {
                    if (token.position && token.position.row === row && token.position.col === col) {
                        tokens.push(token);
                    }
                }
            }
            return tokens;
        },

        executeMove(move) {
            const token = move.token;
            let captured = null;
            let extraTurn = false;

            if (move.type === 'unlock') {
                token.unlock();
                extraTurn = true;
            } else if (move.type === 'finish') {
                token.moveTo(move.toPosition, move.toTrackIndex, move.toHomePathIndex);
                token.finish();
                const player = gameState.players[token.playerIndex];
                player.finishedTokens++;
            } else {
                token.moveTo(move.toPosition, move.toTrackIndex, move.toHomePathIndex);

                if (move.capture) {
                    captured = move.capture;
                    captured.sendHome();
                    extraTurn = true;
                }
            }

            return {
                captured,
                finished: move.type === 'finish',
                extraTurn: extraTurn || move.diceValue === 6
            };
        },

        hasWon(player) {
            return player.finishedTokens >= TOKENS_PER_PLAYER;
        }
    };

    // ============================================
    // DICE
    // ============================================

    // Dice System - Fair random with 16.67% (1/6) chance for each number
    // Based on standard dice probability: https://www.statisticshowto.com/probability-and-statistics/probability-main-index/dice-roll-probability-6-sided-dice/

    const Dice = {
        value: null,
        isRolling: false,

        roll() {
            return new Promise(resolve => {
                this.isRolling = true;
                eventBus.emit(GameEvents.DICE_ROLL_START, {});

                setTimeout(() => {
                    // Fair dice roll - each number has exactly 16.67% (1/6) probability
                    // This matches real-world dice where P(any number) = 1/6
                    this.value = Math.floor(Math.random() * 6) + 1;

                    console.log('Dice rolled: ' + this.value + ' (fair 16.67% probability)');

                    this.isRolling = false;
                    resolve(this.value);
                }, ANIMATION_DURATIONS.DICE_ROLL);
            });
        },

        reset() {
            this.value = null;
        }
    };

    // ============================================
    // AI SYSTEM
    // ============================================

    const Heuristics = {
        evaluateMove(move, gs) {
            let score = 0;

            // Capture is very valuable
            if (move.type === 'capture') {
                score += 50;
            }

            // Finishing a token is best
            if (move.type === 'finish') {
                score += 100;
            }

            // Unlocking tokens is good
            if (move.type === 'unlock') {
                score += 30;
            }

            // Entering home path is great
            if (move.type === 'enterHome') {
                score += 40;
            }

            // Moving to safe zone is good
            if (move.toPosition && isSafeZone(move.toPosition.row, move.toPosition.col)) {
                score += 20;
            }

            // Progress toward home
            score += (move.diceValue || 0) * 2;

            // If on home path, prioritize advancing
            if (move.toHomePathIndex >= 0) {
                score += move.toHomePathIndex * 10;
            }

            return score;
        }
    };

    class EasyAI {
        selectMove(validMoves) {
            if (validMoves.length === 0) return null;
            const index = Math.floor(Math.random() * validMoves.length);
            return validMoves[index];
        }
    }

    class MediumAI {
        selectMove(validMoves, gs) {
            if (validMoves.length === 0) return null;
            if (validMoves.length === 1) return validMoves[0];

            // 30% chance of random move
            if (Math.random() < 0.3) {
                return validMoves[Math.floor(Math.random() * validMoves.length)];
            }

            let bestMove = validMoves[0];
            let bestScore = -Infinity;

            for (const move of validMoves) {
                const score = Heuristics.evaluateMove(move, gs);
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }

            return bestMove;
        }
    }

    class HardAI {
        selectMove(validMoves, gs) {
            if (validMoves.length === 0) return null;
            if (validMoves.length === 1) return validMoves[0];

            // 10% chance of random (to be less predictable)
            if (Math.random() < 0.1) {
                return validMoves[Math.floor(Math.random() * validMoves.length)];
            }

            let bestMove = validMoves[0];
            let bestScore = -Infinity;

            for (const move of validMoves) {
                let score = Heuristics.evaluateMove(move, gs);

                // Additional considerations for Hard AI
                // Defensive: avoid risky positions
                if (move.toPosition && !isSafeZone(move.toPosition.row, move.toPosition.col)) {
                    const player = gs.getCurrentPlayer();
                    for (const opp of gs.players) {
                        if (opp.index === player.index) continue;
                        for (const oppToken of opp.getActiveTokens()) {
                            // Check if opponent can capture us
                            const dist = this.getDistance(oppToken, move.toPosition);
                            if (dist > 0 && dist <= 6) {
                                score -= (7 - dist) * 5;
                            }
                        }
                    }
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }

            return bestMove;
        }

        getDistance(token, targetPos) {
            if (!token.position || !targetPos) return -1;
            // Simplified distance calculation on track
            return Math.abs(token.trackIndex - (MAIN_TRACK.findIndex(
                p => p.row === targetPos.row && p.col === targetPos.col
            ) || 0));
        }
    }

    const AIController = {
        easyAI: new EasyAI(),
        mediumAI: new MediumAI(),
        hardAI: new HardAI(),
        difficulty: 'MEDIUM',

        setDifficulty(diff) {
            this.difficulty = diff;
        },

        async selectMove(validMoves, gs) {
            await this.delay(AI_DIFFICULTY[this.difficulty]?.thinkTime || 800);

            switch (this.difficulty) {
                case 'EASY':
                    return this.easyAI.selectMove(validMoves, gs);
                case 'HARD':
                    return this.hardAI.selectMove(validMoves, gs);
                default:
                    return this.mediumAI.selectMove(validMoves, gs);
            }
        },

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };

    // ============================================
    // TURN MANAGER
    // ============================================

    const TurnManager = {
        isProcessing: false,
        autoPlayTimer: null,
        autoPlayCountdown: 10,
        autoPlayInterval: null,

        clearAutoPlayTimer() {
            if (this.autoPlayTimer) {
                clearTimeout(this.autoPlayTimer);
                this.autoPlayTimer = null;
            }
            if (this.autoPlayInterval) {
                clearInterval(this.autoPlayInterval);
                this.autoPlayInterval = null;
            }
            this.hideAutoPlayUI();
        },

        showAutoPlayUI(seconds) {
            let container = document.getElementById('auto-play-timer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'auto-play-timer';
                container.innerHTML = `
                    <div class="auto-play-content">
                        <span class="auto-play-text">Auto-play in</span>
                        <span class="auto-play-countdown">${seconds}</span>
                        <span class="auto-play-text">seconds</span>
                    </div>
                `;
                container.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, rgba(255, 100, 100, 0.9), rgba(200, 50, 50, 0.9));
                    padding: 12px 24px;
                    border-radius: 25px;
                    color: white;
                    font-weight: bold;
                    font-size: 16px;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 4px 20px rgba(255, 0, 0, 0.4);
                    animation: autoPlayPulse 1s ease-in-out infinite;
                `;
                document.body.appendChild(container);

                // Add animation style if not exists
                if (!document.getElementById('auto-play-style')) {
                    const style = document.createElement('style');
                    style.id = 'auto-play-style';
                    style.textContent = `
                        @keyframes autoPlayPulse {
                            0%, 100% { transform: translateX(-50%) scale(1); }
                            50% { transform: translateX(-50%) scale(1.05); }
                        }
                        .auto-play-countdown {
                            background: rgba(255, 255, 255, 0.3);
                            padding: 4px 12px;
                            border-radius: 15px;
                            min-width: 30px;
                            text-align: center;
                            font-size: 20px;
                        }
                    `;
                    document.head.appendChild(style);
                }
            }
            container.querySelector('.auto-play-countdown').textContent = seconds;
            container.style.display = 'flex';
        },

        hideAutoPlayUI() {
            const container = document.getElementById('auto-play-timer');
            if (container) {
                container.style.display = 'none';
            }
        },

        isAutoPlayEnabled() {
            const toggle = document.getElementById('autoplay-toggle');
            return toggle ? toggle.checked : true;
        },

        startAutoPlayTimer() {
            // Check if auto-play is enabled in settings
            if (!this.isAutoPlayEnabled()) return;

            const player = gameState.getCurrentPlayer();
            // Don't start timer for AI players or in online games where it's not your turn
            if (player.isAI) return;
            if (gameState.isOnlineGame && networkManager.isOnline && !networkManager.isLocalPlayerTurn()) return;

            this.clearAutoPlayTimer();
            this.autoPlayCountdown = 10;

            // Show UI and update every second
            this.autoPlayInterval = setInterval(() => {
                this.autoPlayCountdown--;
                if (this.autoPlayCountdown > 0) {
                    this.showAutoPlayUI(this.autoPlayCountdown);
                }
            }, 1000);

            this.showAutoPlayUI(this.autoPlayCountdown);

            // Auto-play after 10 seconds
            this.autoPlayTimer = setTimeout(async () => {
                this.clearAutoPlayTimer();
                await this.autoPlay();
            }, 10000);
        },

        async autoPlay() {
            const player = gameState.getCurrentPlayer();
            if (player.isAI) return;

            // If waiting to roll, roll the dice
            if (gameState.turnPhase === TURN_PHASE.WAITING) {
                eventBus.emit(GameEvents.SHOW_MESSAGE, {
                    message: 'Auto-playing...',
                    type: 'info'
                });
                await this.rollDice();
            }
            // If selecting a token, let AI choose
            else if (gameState.turnPhase === TURN_PHASE.SELECTING && gameState.validMoves.length > 0) {
                eventBus.emit(GameEvents.SHOW_MESSAGE, {
                    message: 'Auto-playing...',
                    type: 'info'
                });
                const move = await AIController.selectMove(gameState.validMoves, gameState);
                await this.executeMove(move);
            }
        },

        async waitWhilePaused() {
            while (gameState.isPaused) {
                await this.delay(100);
            }
        },

        async startTurn() {
            // Don't start turn if game is not in playing phase
            if (gameState.phase !== GAME_PHASE.PLAYING) return;

            await this.waitWhilePaused();

            // Check again after pause
            if (gameState.phase !== GAME_PHASE.PLAYING) return;

            const player = gameState.getCurrentPlayer();
            gameState.turnPhase = TURN_PHASE.WAITING;

            eventBus.emit(GameEvents.TURN_START, { player });

            await this.delay(ANIMATION_DURATIONS.TURN_DELAY);

            // Check again after delay
            if (gameState.phase !== GAME_PHASE.PLAYING) return;

            await this.waitWhilePaused();

            // AI players take their turn automatically
            if (player.isAI && (!gameState.isOnlineGame || (networkManager.isOnline && networkManager.isHost))) {
                await this.handleAITurn();
            } else {
                // Start auto-play timer for human players
                this.startAutoPlayTimer();
            }
        },

        async rollDice() {
            // Don't roll if game is not in playing phase
            if (gameState.phase !== GAME_PHASE.PLAYING) return null;

            await this.waitWhilePaused();
            if (gameState.turnPhase !== TURN_PHASE.WAITING) return null;

            // Clear auto-play timer when player takes action
            this.clearAutoPlayTimer();

            gameState.turnPhase = TURN_PHASE.ROLLING;
            const value = await Dice.roll();
            gameState.setDiceValue(value);

            // Check for three consecutive sixes
            if (gameState.isTurnForfeited()) {
                eventBus.emit(GameEvents.SHOW_MESSAGE, {
                    message: 'Three 6s! Turn forfeited!',
                    type: 'warning'
                });
                await this.delay(ANIMATION_DURATIONS.MESSAGE_DISPLAY);
                this.endTurn();
                return value;
            }

            const validMoves = Rules.getValidMoves(
                gameState.getCurrentPlayer(),
                value,
                gameState.players
            );

            gameState.setValidMoves(validMoves);

            if (validMoves.length === 0) {
                eventBus.emit(GameEvents.SHOW_MESSAGE, {
                    message: 'No valid moves!',
                    type: 'info'
                });
                await this.delay(ANIMATION_DURATIONS.MESSAGE_DISPLAY);
                this.endTurn();
                return value;
            }

            if (validMoves.length === 1) {
                await this.executeMove(validMoves[0]);
                return value;
            }

            gameState.turnPhase = TURN_PHASE.SELECTING;

            // AI selects move automatically
            if (gameState.getCurrentPlayer().isAI) {
                const move = await AIController.selectMove(validMoves, gameState);
                await this.executeMove(move);
            } else {
                // Start auto-play timer for human player to select token
                this.startAutoPlayTimer();
            }

            return value;
        },

        async selectToken(tokenId) {
            if (gameState.turnPhase !== TURN_PHASE.SELECTING) return;

            // In online mode, only local player can select tokens on their turn
            if (gameState.isOnlineGame && networkManager.isOnline && !networkManager.isLocalPlayerTurn()) {
                return;
            }

            // Clear auto-play timer when player selects token
            this.clearAutoPlayTimer();

            const move = gameState.validMoves.find(m => m.tokenId === tokenId);
            if (!move) return;

            // executeMove handles the broadcast now
            await this.executeMove(move);
        },

        async executeMove(move, skipBroadcast = false) {
            if (this.isProcessing) return;
            this.isProcessing = true;

            // Broadcast move in online mode (if not already broadcast by selectToken)
            if (!skipBroadcast && gameState.isOnlineGame && networkManager.isOnline && networkManager.shouldHandleCurrentTurn()) {
                const moveData = {
                    tokenId: move.tokenId,
                    fromPosition: move.fromPosition,
                    toPosition: move.toPosition,
                    fromTrackIndex: move.fromTrackIndex,
                    toTrackIndex: move.toTrackIndex,
                    fromHomePathIndex: move.fromHomePathIndex,
                    toHomePathIndex: move.toHomePathIndex,
                    type: move.type,
                    diceValue: move.diceValue,
                    path: move.path,
                    captureTokenId: move.capture ? move.capture.id : null
                };
                networkManager.broadcastAction('TOKEN_SELECT', {
                    tokenId: move.tokenId,
                    playerIndex: gameState.currentPlayerIndex,
                    moveData
                });
            }

            gameState.turnPhase = TURN_PHASE.MOVING;
            gameState.selectToken(move.tokenId);

            eventBus.emit(GameEvents.TOKEN_MOVE_START, { move });

            const result = Rules.executeMove(move);

            eventBus.emit(GameEvents.TOKEN_MOVE, { move, result });

            if (result.captured) {
                eventBus.emit(GameEvents.TOKEN_CAPTURE, {
                    capturer: move.token,
                    captured: result.captured
                });
                eventBus.emit(GameEvents.EFFECT_SHAKE, { intensity: 10 });
            }

            if (result.finished) {
                eventBus.emit(GameEvents.TOKEN_FINISH, {
                    token: move.token,
                    player: gameState.getCurrentPlayer()
                });
            }

            await this.delay(ANIMATION_DURATIONS.TOKEN_MOVE * (move.path?.length || 1));

            if (Rules.hasWon(gameState.getCurrentPlayer())) {
                gameState.setWinner(gameState.getCurrentPlayer());
                eventBus.emit(GameEvents.EFFECT_VICTORY, {
                    winner: gameState.getCurrentPlayer()
                });
                this.isProcessing = false;
                return;
            }

            eventBus.emit(GameEvents.TOKEN_MOVE_COMPLETE, { move, result });

            this.isProcessing = false;

            // Check for extra turn
            if (result.extraTurn || gameState.canRollAgain()) {
                gameState.turnPhase = TURN_PHASE.WAITING;
                gameState.selectToken(null);
                gameState.setValidMoves([]);

                // AI rolls again automatically
                if (gameState.getCurrentPlayer().isAI) {
                    await this.delay(ANIMATION_DURATIONS.AI_THINK);
                    await this.rollDice();
                } else {
                    // Start auto-play timer for human player's extra turn
                    this.startAutoPlayTimer();
                }
            } else {
                this.endTurn();
            }
        },

        async endTurn() {
            await this.waitWhilePaused();

            // Clear auto-play timer
            this.clearAutoPlayTimer();

            // Broadcast turn end in online mode (from active player or host for AI)
            if (gameState.isOnlineGame && networkManager.isOnline && networkManager.shouldHandleCurrentTurn()) {
                networkManager.broadcastAction('TURN_END', {
                    playerIndex: gameState.currentPlayerIndex,
                    nextPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length
                });
            }

            gameState.nextTurn();
            Dice.reset();
            // Auto-save after each turn
            gameState.saveGame();
            await this.delay(ANIMATION_DURATIONS.TURN_DELAY);
            await this.startTurn();
        },

        async handleAITurn() {
            // Don't handle AI turn if game is not in playing phase
            if (gameState.phase !== GAME_PHASE.PLAYING) return;

            await this.waitWhilePaused();

            // Check again after pause
            if (gameState.phase !== GAME_PHASE.PLAYING) return;

            await this.delay(ANIMATION_DURATIONS.AI_THINK);

            // Check again after delay
            if (gameState.phase !== GAME_PHASE.PLAYING) return;

            await this.waitWhilePaused();
            await this.rollDice();
        },

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };

    // ============================================
    // BOARD RENDERER
    // ============================================

    class BoardRenderer {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            this.cells = new Map();
        }

        render() {
            this.container.innerHTML = '';

            // Create 15x15 grid
            for (let row = 0; row < BOARD_SIZE; row++) {
                for (let col = 0; col < BOARD_SIZE; col++) {
                    const cell = this.createCell(row, col);
                    this.container.appendChild(cell);
                    this.cells.set(`${row}-${col}`, cell);
                }
            }
        }

        createCell(row, col) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            // Determine cell type
            const cellTypes = this.getCellType(row, col);
            if (cellTypes) {
                cellTypes.split(' ').forEach(cls => {
                    if (cls) cell.classList.add(cls);
                });
            }

            // Check if safe zone
            if (isSafeZone(row, col)) {
                cell.classList.add('safe-zone');
                // Star is added via CSS ::after pseudo-element
            }

            return cell;
        }

        getCellType(row, col) {
            // Home bases (corners)
            if (row <= 5 && col <= 5) return 'home-area red-home';
            if (row <= 5 && col >= 9) return 'home-area green-home';
            if (row >= 9 && col >= 9) return 'home-area yellow-home';
            if (row >= 9 && col <= 5) return 'home-area blue-home';

            // Track cells - check BEFORE center so track is visible
            const isTrack = MAIN_TRACK.some(p => p.row === row && p.col === col);
            if (isTrack) return 'track-cell';

            // Home paths - check BEFORE center so home paths are visible
            for (const color of PLAYER_ORDER) {
                const isHomePath = HOME_PATHS[color].some(p => p.row === row && p.col === col);
                if (isHomePath) return `home-path ${color.toLowerCase()}-path`;
            }

            // Center (winning area) - checked LAST
            if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return 'center-area';

            return 'empty-cell';
        }

        getCell(row, col) {
            return this.cells.get(`${row}-${col}`);
        }
    }

    // ============================================
    // TOKEN RENDERER
    // ============================================

    class TokenRenderer {
        constructor(boardRenderer) {
            this.boardRenderer = boardRenderer;
            this.tokenElements = new Map();

            this.setupEventListeners();
        }

        setupEventListeners() {
            eventBus.on(GameEvents.GAME_START, () => this.renderAllTokens());
            eventBus.on(GameEvents.TOKEN_MOVE, (data) => this.animateMove(data.move));
            eventBus.on(GameEvents.TOKEN_CAPTURE, (data) => this.handleCapture(data.captured));
            eventBus.on(GameEvents.VALID_MOVES_UPDATE, (data) => this.highlightValidTokens(data.moves));

            // Online game token rendering
            eventBus.on('online:gameReady', () => {
                setTimeout(() => this.renderAllTokens(), 100);
            });
        }

        renderAllTokens() {
            // Clear existing
            this.tokenElements.forEach(el => el.remove());
            this.tokenElements.clear();

            // Render all tokens
            for (const player of gameState.players) {
                for (const token of player.tokens) {
                    this.renderToken(token);
                }
            }
        }

        renderToken(token) {
            const element = this.createTokenElement(token);
            this.tokenElements.set(token.id, element);
            this.positionToken(token);
        }

        createTokenElement(token) {
            const el = document.createElement('div');
            el.className = `ufo-token ${token.color.toLowerCase()}`;
            el.dataset.tokenId = token.id;
            el.innerHTML = `
                <div class="ufo-dome"></div>
                <div class="ufo-body"></div>
                <div class="ufo-lights">
                    <span class="ufo-light"></span>
                    <span class="ufo-light"></span>
                    <span class="ufo-light"></span>
                </div>
            `;

            el.addEventListener('click', () => {
                if (gameState.turnPhase === TURN_PHASE.SELECTING) {
                    TurnManager.selectToken(token.id);
                }
            });

            return el;
        }

        positionToken(token) {
            const element = this.tokenElements.get(token.id);
            if (!element) return;

            let position;
            if (token.isAtHome()) {
                position = token.getHomeBasePosition();
            } else if (token.isFinished()) {
                position = { row: 7, col: 7 };
            } else {
                position = token.position;
            }

            if (!position) return;

            const cell = this.boardRenderer.getCell(position.row, position.col);
            if (cell) {
                cell.appendChild(element);
            }
        }

        async animateMove(move) {
            const element = this.tokenElements.get(move.tokenId);
            if (!element) return;

            element.classList.add('moving');

            // Animate through path
            if (move.path && move.path.length > 0) {
                for (const pos of move.path) {
                    // Skip undefined positions in path
                    if (!pos || pos.row === undefined || pos.col === undefined) {
                        continue;
                    }
                    const cell = this.boardRenderer.getCell(pos.row, pos.col);
                    if (cell) {
                        cell.appendChild(element);
                        await this.delay(ANIMATION_DURATIONS.TOKEN_MOVE);
                    }
                }
            }

            element.classList.remove('moving');

            // Update final position
            this.positionToken(move.token);
        }

        handleCapture(capturedToken) {
            // Animate capture then reposition
            const element = this.tokenElements.get(capturedToken.id);
            if (element) {
                element.classList.add('captured');
                setTimeout(() => {
                    element.classList.remove('captured');
                    this.positionToken(capturedToken);
                }, ANIMATION_DURATIONS.TOKEN_CAPTURE);
            }
        }

        highlightValidTokens(moves) {
            // Remove all highlights
            this.tokenElements.forEach(el => {
                el.classList.remove('selectable');
            });

            // Add highlights to valid tokens
            for (const move of moves) {
                const element = this.tokenElements.get(move.tokenId);
                if (element) {
                    element.classList.add('selectable');
                }
            }
        }

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    // ============================================
    // DICE RENDERER
    // ============================================

    class DiceRenderer {
        constructor() {
            this.diceElement = document.getElementById('dice');
            this.resultElement = document.getElementById('dice-result');
            this.rollButton = document.getElementById('roll-btn');

            this.setupEventListeners();
        }

        setupEventListeners() {
            eventBus.on(GameEvents.DICE_ROLL_START, () => this.startRollAnimation());
            eventBus.on(GameEvents.DICE_ROLLED, (data) => this.showResult(data.value));

            this.rollButton.addEventListener('click', () => {
                // Only allow rolling dice on YOUR turn (not other players or AI)
                const currentPlayer = gameState.getCurrentPlayer();
                const isMyTurn = !currentPlayer.isAI &&
                    (!gameState.isOnlineGame || (networkManager.isOnline && networkManager.isLocalPlayerTurn()));
                if (gameState.turnPhase === TURN_PHASE.WAITING && isMyTurn) {
                    TurnManager.rollDice();
                }
            });

            // Spacebar to roll
            document.addEventListener('keydown', (e) => {
                // Only allow rolling dice on YOUR turn (not other players or AI)
                const currentPlayer = gameState.getCurrentPlayer();
                const isMyTurn = !currentPlayer.isAI &&
                    (!gameState.isOnlineGame || (networkManager.isOnline && networkManager.isLocalPlayerTurn()));
                if (e.code === 'Space' && gameState.turnPhase === TURN_PHASE.WAITING && isMyTurn) {
                    e.preventDefault();
                    TurnManager.rollDice();
                }
            });
        }

        startRollAnimation() {
            this.diceElement.classList.add('rolling');
            this.resultElement.textContent = '';
            this.rollButton.disabled = true;
        }

        showResult(value) {
            this.diceElement.classList.remove('rolling');
            this.diceElement.dataset.value = value;
            this.resultElement.textContent = value;
            this.rollButton.disabled = false;

            // Set final rotation based on value
            // right face has 3 dots, left face has 4 dots
            // rotateY(-90deg) shows right face, rotateY(90deg) shows left face
            const rotations = {
                1: { x: 0, y: 0 },
                2: { x: -90, y: 0 },
                3: { x: 0, y: -90 },
                4: { x: 0, y: 90 },
                5: { x: 90, y: 0 },
                6: { x: 180, y: 0 }
            };

            const rot = rotations[value];
            this.diceElement.style.transform = `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`;
        }
    }

    // ============================================
    // UI RENDERER
    // ============================================

    class UIRenderer {
        constructor() {
            this.mainMenu = document.getElementById('main-menu');
            this.setupScreen = document.getElementById('setup-screen');
            this.gameScreen = document.getElementById('game-screen');
            this.onlineMenu = document.getElementById('online-menu');
            this.roomLobby = document.getElementById('room-lobby');
            this.victoryOverlay = document.getElementById('victory-overlay');
            this.announcement = document.getElementById('turn-announcement');

            this.setupEventListeners();
        }

        setupEventListeners() {
            eventBus.on(GameEvents.GAME_START, () => this.showScreen('game'));
            eventBus.on(GameEvents.TURN_START, (data) => this.onTurnStart(data.player));
            eventBus.on(GameEvents.PLAYER_WIN, (data) => this.showVictory(data.player));
            eventBus.on(GameEvents.SHOW_MESSAGE, (data) => this.showMessage(data.message));
        }

        showScreen(screenId) {
            // Hide all screens
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) {
                loginScreen.classList.remove('active');
                loginScreen.style.display = 'none';
            }
            this.mainMenu.classList.remove('active');
            this.mainMenu.style.display = 'none';
            this.setupScreen.classList.remove('active');
            this.setupScreen.style.display = 'none';
            this.gameScreen.classList.remove('active');
            this.gameScreen.style.display = 'none';
            if (this.onlineMenu) {
                this.onlineMenu.classList.remove('active');
                this.onlineMenu.style.display = 'none';
            }
            if (this.roomLobby) {
                this.roomLobby.classList.remove('active');
                this.roomLobby.style.display = 'none';
            }

            switch (screenId) {
                case 'menu':
                    this.mainMenu.style.display = 'flex';
                    this.mainMenu.classList.add('active');
                    break;
                case 'setup':
                    this.setupScreen.style.display = 'flex';
                    this.setupScreen.classList.add('active');
                    break;
                case 'game':
                    this.gameScreen.style.display = 'flex';
                    this.gameScreen.classList.add('active');
                    break;
                case 'online-menu':
                    if (this.onlineMenu) {
                        this.onlineMenu.style.display = 'flex';
                        this.onlineMenu.classList.add('active');
                    }
                    break;
                case 'room-lobby':
                    if (this.roomLobby) {
                        this.roomLobby.style.display = 'flex';
                        this.roomLobby.classList.add('active');
                    }
                    break;
            }
        }

        onTurnStart(player) {
            // Update player panels
            document.querySelectorAll('.player-info').forEach(el => {
                const idx = parseInt(el.dataset.player);
                if (idx === player.index) {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            });

            this.showAnnouncement(`${player.name}'s Turn`);
        }

        showAnnouncement(text) {
            const textEl = this.announcement.querySelector('.announcement-text');
            if (textEl) textEl.textContent = text;
            this.announcement.classList.add('active');
            setTimeout(() => {
                this.announcement.classList.remove('active');
            }, ANIMATION_DURATIONS.MESSAGE_DISPLAY);
        }

        showMessage(message) {
            this.showAnnouncement(message);
        }

        showVictory(player) {
            const winnerName = document.getElementById('winner-name');
            if (winnerName) {
                winnerName.textContent = `${player.name} Wins!`;
                winnerName.style.color = PLAYER_COLORS[player.color]?.primary || '#fff';
            }
            this.victoryOverlay.classList.add('active');
        }

        hideVictory() {
            this.victoryOverlay.classList.remove('active');
        }

        generatePlayerInputs(mode) {
            const container = document.getElementById('player-inputs');
            if (!container) return;
            container.innerHTML = '';

            const colors = ['red', 'green', 'yellow', 'blue'];

            // Get logged in username for Player 1
            const loggedInUser = localStorage.getItem('spaceludo_user');
            const username = loggedInUser ? JSON.parse(loggedInUser).username : null;

            for (let i = 0; i < 4; i++) {
                const row = document.createElement('div');
                row.className = 'player-input-row';

                const colorDot = document.createElement('div');
                colorDot.className = `player-color-dot ${colors[i]}`;

                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.placeholder = `Player ${i + 1}`;
                nameInput.className = 'player-name-input';
                nameInput.dataset.index = i;

                // Pre-fill Player 1 with logged in username
                if (i === 0 && username) {
                    nameInput.value = username;
                }

                row.appendChild(colorDot);
                row.appendChild(nameInput);

                if (mode === 'ai') {
                    const typeToggle = document.createElement('div');
                    typeToggle.className = 'player-type-toggle';

                    const humanBtn = document.createElement('button');
                    humanBtn.className = 'type-btn' + (i === 0 ? ' active' : '');
                    humanBtn.textContent = 'Human';
                    humanBtn.dataset.type = 'human';

                    const aiBtn = document.createElement('button');
                    aiBtn.className = 'type-btn' + (i !== 0 ? ' active' : '');
                    aiBtn.textContent = 'AI';
                    aiBtn.dataset.type = 'ai';

                    humanBtn.onclick = () => {
                        humanBtn.classList.add('active');
                        aiBtn.classList.remove('active');
                    };

                    aiBtn.onclick = () => {
                        aiBtn.classList.add('active');
                        humanBtn.classList.remove('active');
                    };

                    typeToggle.appendChild(humanBtn);
                    typeToggle.appendChild(aiBtn);
                    row.appendChild(typeToggle);
                }

                container.appendChild(row);
            }

            // Show/hide AI settings
            const aiSettings = document.getElementById('ai-settings');
            if (aiSettings) {
                aiSettings.style.display = mode === 'ai' ? 'block' : 'none';
            }
        }

        getPlayerConfig() {
            const players = [];
            const rows = document.querySelectorAll('.player-input-row');

            rows.forEach((row, index) => {
                const nameInput = row.querySelector('.player-name-input');
                const aiBtn = row.querySelector('.type-btn[data-type="ai"]');

                players.push({
                    name: nameInput?.value || `Player ${index + 1}`,
                    isAI: aiBtn ? aiBtn.classList.contains('active') : false
                });
            });

            const activeDiffBtn = document.querySelector('.diff-btn.active');
            const aiDifficulty = activeDiffBtn?.dataset?.difficulty?.toUpperCase() || 'MEDIUM';

            return { players, aiDifficulty };
        }
    }

    // ============================================
    // EFFECTS
    // ============================================

    class ParticleSystem {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) return;

            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.isRunning = false;

            this.resize();
            window.addEventListener('resize', () => this.resize());

            this.setupEventListeners();
        }

        setupEventListeners() {
            // Capture effect disabled
            // eventBus.on(GameEvents.TOKEN_CAPTURE, (data) => {
            //     this.captureEffect(data.captured);
            // });

            eventBus.on(GameEvents.EFFECT_VICTORY, () => {
                this.victoryEffect();
            });
        }

        resize() {
            if (!this.canvas) return;
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        captureEffect(token) {
            if (!this.canvas || !token.position) return;

            // Get screen position of token
            const cell = document.querySelector(`[data-row="${token.position.row}"][data-col="${token.position.col}"]`);
            if (!cell) return;

            const rect = cell.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            const color = PLAYER_COLORS[token.color]?.primary || '#fff';

            for (let i = 0; i < 30; i++) {
                this.particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 60,
                    maxLife: 60,
                    color,
                    size: 3 + Math.random() * 3
                });
            }

            if (!this.isRunning) this.animate();
        }

        victoryEffect() {
            if (!this.canvas) return;

            const colors = Object.values(PLAYER_COLORS).map(c => c.primary);

            for (let i = 0; i < 200; i++) {
                setTimeout(() => {
                    this.particles.push({
                        x: Math.random() * this.canvas.width,
                        y: -10,
                        vx: (Math.random() - 0.5) * 3,
                        vy: 2 + Math.random() * 3,
                        life: 200,
                        maxLife: 200,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        size: 4 + Math.random() * 4,
                        type: 'confetti',
                        rotation: Math.random() * 360,
                        rotationSpeed: (Math.random() - 0.5) * 10
                    });
                }, i * 15);
            }

            if (!this.isRunning) this.animate();
        }

        animate() {
            this.isRunning = true;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.particles = this.particles.filter(p => p.life > 0);

            for (const p of this.particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.life--;

                if (p.type === 'confetti') {
                    p.vy += 0.1;
                    p.rotation += p.rotationSpeed;
                }

                const alpha = p.life / p.maxLife;
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = p.color;

                if (p.type === 'confetti') {
                    this.ctx.translate(p.x, p.y);
                    this.ctx.rotate(p.rotation * Math.PI / 180);
                    this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                } else {
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    this.ctx.fill();
                }

                this.ctx.restore();
            }

            if (this.particles.length > 0) {
                requestAnimationFrame(() => this.animate());
            } else {
                this.isRunning = false;
            }
        }
    }

    class ScreenEffects {
        constructor() {
            this.gameContainer = document.querySelector('.game-container');
            this.setupEventListeners();
        }

        setupEventListeners() {
            eventBus.on(GameEvents.EFFECT_SHAKE, (data) => {
                this.shake(data.intensity || 10);
            });
        }

        shake(intensity = 10) {
            if (!this.gameContainer) return;

            this.gameContainer.classList.add('screen-shake');
            setTimeout(() => {
                this.gameContainer.classList.remove('screen-shake');
            }, 500);
        }
    }

    // ============================================
    // EMOJI EFFECTS
    // ============================================

    class EmojiEffects {
        constructor() {
            this.container = null;
            this.createContainer();
            this.setupEventListeners();
            this.setupEmoteButtons();
        }

        createContainer() {
            this.container = document.createElement('div');
            this.container.id = 'emoji-effects-container';
            this.container.style.cssText = `
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 1000;
                overflow: hidden;
            `;
            document.body.appendChild(this.container);
        }

        setupEventListeners() {
            // Token capture - disabled
            // eventBus.on(GameEvents.TOKEN_CAPTURE, (data) => {
            //     this.showEmojiBurst(['💥', '💢', '⚡', '🔥', '😈'], 'center', 12);
            // });

            // Token move to home/finish
            eventBus.on(GameEvents.TOKEN_FINISH, () => {
                this.showEmojiBurst(['🏆', '⭐', '✨', '🎊', '👏'], 'center', 10);
            });

            // Victory
            eventBus.on(GameEvents.PLAYER_WIN, (data) => {
                this.showVictoryEmojis();
            });

            // Turn start
            eventBus.on(GameEvents.TURN_START, (data) => {
                const playerEmojis = {
                    'RED': '🔴',
                    'GREEN': '🟢',
                    'YELLOW': '🟡',
                    'BLUE': '🔵'
                };
                this.showEmojiFloat([playerEmojis[data.player.color] || '🎮'], 'corner');
            });
        }

        showEmojiFloat(emojis, position = 'center') {
            const emoji = document.createElement('div');
            emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            emoji.style.cssText = `
                position: absolute;
                font-size: 60px;
                animation: emojiFloat 1.5s ease-out forwards;
                text-shadow: 0 0 20px rgba(255,255,255,0.8);
            `;

            if (position === 'dice') {
                emoji.style.top = '50%';
                emoji.style.left = '50%';
                emoji.style.transform = 'translate(-50%, -50%)';
            } else if (position === 'corner') {
                emoji.style.top = '20px';
                emoji.style.right = '20px';
                emoji.style.fontSize = '40px';
            } else {
                emoji.style.top = '50%';
                emoji.style.left = '50%';
                emoji.style.transform = 'translate(-50%, -50%)';
            }

            this.container.appendChild(emoji);
            setTimeout(() => emoji.remove(), 1500);
        }

        showEmojiBurst(emojis, position = 'center', count = 8) {
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    const emoji = document.createElement('div');
                    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];

                    const angle = (i / count) * Math.PI * 2;
                    const distance = 100 + Math.random() * 100;
                    const startX = window.innerWidth / 2;
                    const startY = window.innerHeight / 2;

                    emoji.style.cssText = `
                        position: absolute;
                        font-size: ${40 + Math.random() * 30}px;
                        left: ${startX}px;
                        top: ${startY}px;
                        transform: translate(-50%, -50%);
                        animation: emojiBurst 1s ease-out forwards;
                        --end-x: ${Math.cos(angle) * distance}px;
                        --end-y: ${Math.sin(angle) * distance}px;
                        text-shadow: 0 0 30px rgba(255,255,255,0.9);
                    `;

                    this.container.appendChild(emoji);
                    setTimeout(() => emoji.remove(), 1000);
                }, i * 50);
            }
        }

        showVictoryEmojis() {
            const victoryEmojis = ['🏆', '🎉', '🎊', '🥇', '👑', '⭐', '✨', '🎯', '💪', '🚀'];

            // Rain emojis from top
            for (let i = 0; i < 30; i++) {
                setTimeout(() => {
                    const emoji = document.createElement('div');
                    emoji.textContent = victoryEmojis[Math.floor(Math.random() * victoryEmojis.length)];
                    emoji.style.cssText = `
                        position: absolute;
                        font-size: ${30 + Math.random() * 40}px;
                        left: ${Math.random() * 100}%;
                        top: -50px;
                        animation: emojiRain ${2 + Math.random() * 2}s linear forwards;
                        text-shadow: 0 0 20px rgba(255,255,255,0.8);
                    `;

                    this.container.appendChild(emoji);
                    setTimeout(() => emoji.remove(), 4000);
                }, i * 100);
            }

            // Big trophy in center
            setTimeout(() => {
                const trophy = document.createElement('div');
                trophy.textContent = '🏆';
                trophy.style.cssText = `
                    position: absolute;
                    font-size: 150px;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%) scale(0);
                    animation: trophyAppear 1s ease-out forwards;
                    text-shadow: 0 0 50px gold, 0 0 100px rgba(255,215,0,0.5);
                `;
                this.container.appendChild(trophy);
                setTimeout(() => trophy.remove(), 3000);
            }, 500);
        }

        // Show big emote in center of screen
        showPlayerEmote(emoji) {
            // Create big emoji in center
            const emote = document.createElement('div');
            emote.textContent = emoji;
            emote.style.cssText = `
                position: absolute;
                font-size: 120px;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%) scale(0);
                animation: playerEmoteAppear 1.5s ease-out forwards;
                text-shadow: 0 0 30px rgba(255,255,255,0.8), 0 0 60px rgba(255,255,255,0.4);
                z-index: 1001;
            `;
            this.container.appendChild(emote);

            // Create burst of smaller emojis around it
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    const smallEmoji = document.createElement('div');
                    smallEmoji.textContent = emoji;
                    const angle = (i / 8) * Math.PI * 2;
                    const distance = 150 + Math.random() * 50;

                    smallEmoji.style.cssText = `
                        position: absolute;
                        font-size: 40px;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        animation: emojiBurst 1s ease-out forwards;
                        --end-x: ${Math.cos(angle) * distance}px;
                        --end-y: ${Math.sin(angle) * distance}px;
                        text-shadow: 0 0 15px rgba(255,255,255,0.6);
                    `;
                    this.container.appendChild(smallEmoji);
                    setTimeout(() => smallEmoji.remove(), 1000);
                }, i * 30);
            }

            setTimeout(() => emote.remove(), 1500);
        }

        // Setup emote button click handlers
        setupEmoteButtons() {
            const emoteMap = {
                'emote-happy': '😄',
                'emote-sad': '😢',
                'emote-angry': '😡',
                'emote-smile': '😊',
                'emote-love': '😍',
                'emote-cool': '😎',
                'emote-laugh': '🤣',
                'emote-think': '🤔'
            };

            Object.entries(emoteMap).forEach(([id, emoji]) => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.addEventListener('click', () => {
                        // Add button animation
                        btn.classList.add('emote-triggered');
                        setTimeout(() => btn.classList.remove('emote-triggered'), 500);

                        // Show the emote locally
                        this.showPlayerEmote(emoji);

                        // Broadcast to other players in online mode
                        if (typeof networkManager !== 'undefined' && networkManager.roomId) {
                            networkManager.broadcastAction('PLAYER_EMOTE', {
                                emoji: emoji,
                                playerName: localStorage.getItem('spaceludo_username') || 'Player'
                            });
                        }

                        // Play a sound if enabled
                        if (gameState.soundEnabled) {
                            this.playEmoteSound();
                        }
                    });
                }
            });

            // Listen for emotes from other players
            eventBus.on('online:playerEmote', (data) => {
                this.showPlayerEmote(data.emoji);
                if (gameState.soundEnabled) {
                    this.playEmoteSound();
                }
            });
        }

        playEmoteSound() {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 600;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            } catch (e) {}
        }
    }

    // Add emoji effect CSS animations
    const emojiStyles = document.createElement('style');
    emojiStyles.textContent = `
        @keyframes emojiFloat {
            0% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(0.5);
            }
            50% {
                opacity: 1;
                transform: translate(-50%, -100%) scale(1.2);
            }
            100% {
                opacity: 0;
                transform: translate(-50%, -150%) scale(1);
            }
        }

        @keyframes emojiBurst {
            0% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(0.5);
            }
            100% {
                opacity: 0;
                transform: translate(calc(-50% + var(--end-x)), calc(-50% + var(--end-y))) scale(1.5) rotate(360deg);
            }
        }

        @keyframes emojiRain {
            0% {
                opacity: 1;
                transform: translateY(0) rotate(0deg);
            }
            100% {
                opacity: 0.5;
                transform: translateY(calc(100vh + 100px)) rotate(720deg);
            }
        }

        @keyframes trophyAppear {
            0% {
                transform: translate(-50%, -50%) scale(0) rotate(-180deg);
                opacity: 0;
            }
            50% {
                transform: translate(-50%, -50%) scale(1.3) rotate(10deg);
                opacity: 1;
            }
            70% {
                transform: translate(-50%, -50%) scale(0.9) rotate(-5deg);
            }
            100% {
                transform: translate(-50%, -50%) scale(1) rotate(0deg);
                opacity: 1;
            }
        }

        @keyframes playerEmoteAppear {
            0% {
                transform: translate(-50%, -50%) scale(0) rotate(-30deg);
                opacity: 0;
            }
            30% {
                transform: translate(-50%, -50%) scale(1.4) rotate(10deg);
                opacity: 1;
            }
            50% {
                transform: translate(-50%, -50%) scale(1.1) rotate(-5deg);
            }
            70% {
                transform: translate(-50%, -50%) scale(1.2) rotate(3deg);
            }
            100% {
                transform: translate(-50%, -50%) scale(0) rotate(0deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(emojiStyles);


    // ============================================
    // LOGIN MANAGER
    // ============================================

    class LoginManager {
        constructor() {
            this.user = this.load();
            this.setupUI();
            this.setupEventListeners();
        }

        load() {
            const saved = localStorage.getItem('spaceludo_user');
            return saved ? JSON.parse(saved) : null;
        }

        save() {
            localStorage.setItem('spaceludo_user', JSON.stringify(this.user));
        }

        setupUI() {
            // Check if user is already logged in
            if (this.user) {
                this.showWelcomeBack();
            }

            // Show stats in footer if available
            this.updateLoginStats();
        }

        setupEventListeners() {
            // Avatar selection
            const avatarOptions = document.querySelectorAll('.avatar-option');
            avatarOptions.forEach(option => {
                option.addEventListener('click', () => {
                    avatarOptions.forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                });
            });

            // Login button
            const loginBtn = document.getElementById('btn-login');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => this.handleLogin());
            }

            // Enter key on input
            const usernameInput = document.getElementById('login-username');
            if (usernameInput) {
                usernameInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleLogin();
                    }
                });

                // If returning user, pre-fill username
                if (this.user) {
                    usernameInput.value = this.user.username;
                    // Select their avatar
                    const savedAvatar = document.querySelector(`.avatar-option[data-avatar="${this.user.avatar}"]`);
                    if (savedAvatar) {
                        document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
                        savedAvatar.classList.add('selected');
                    }
                }
            }
        }

        showWelcomeBack() {
            const loginForm = document.getElementById('login-form');
            if (!loginForm || !this.user) return;

            // Add welcome back message
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'welcome-back';
            welcomeDiv.innerHTML = `
                <div class="welcome-back-text">Welcome back!</div>
                <div class="welcome-back-name">${this.user.avatar} ${this.user.username}</div>
            `;
            loginForm.insertBefore(welcomeDiv, loginForm.firstChild);
        }

        updateLoginStats() {
            const statsContainer = document.getElementById('login-stats');
            if (!statsContainer) return;

            // Get XP data if available
            const xpData = localStorage.getItem('spaceludo_xp');
            if (xpData) {
                const data = JSON.parse(xpData);
                statsContainer.innerHTML = `
                    <div class="login-stat">
                        <span class="login-stat-value">${data.level}</span>
                        <span class="login-stat-label">Level</span>
                    </div>
                    <div class="login-stat">
                        <span class="login-stat-value">${data.wins || 0}</span>
                        <span class="login-stat-label">Wins</span>
                    </div>
                    <div class="login-stat">
                        <span class="login-stat-value">${data.gamesPlayed || 0}</span>
                        <span class="login-stat-label">Games</span>
                    </div>
                `;
            }
        }

        handleLogin() {
            const usernameInput = document.getElementById('login-username');
            const errorEl = document.getElementById('login-error');
            const selectedAvatar = document.querySelector('.avatar-option.selected');

            const username = usernameInput?.value.trim();

            // Validation
            if (!username) {
                this.showError('Please enter a username');
                usernameInput?.focus();
                return;
            }

            if (username.length < 2) {
                this.showError('Username must be at least 2 characters');
                usernameInput?.focus();
                return;
            }

            if (username.length > 15) {
                this.showError('Username must be 15 characters or less');
                usernameInput?.focus();
                return;
            }

            // Get avatar
            const avatar = selectedAvatar?.dataset.avatar || '🚀';

            // Save user
            this.user = {
                username,
                avatar,
                createdAt: this.user?.createdAt || Date.now(),
                lastLogin: Date.now()
            };
            this.save();

            // Transition to main menu
            this.transitionToMenu();
        }

        showError(message) {
            const errorEl = document.getElementById('login-error');
            if (errorEl) {
                errorEl.textContent = message;
                errorEl.classList.add('show');
                setTimeout(() => {
                    errorEl.classList.remove('show');
                }, 3000);
            }
        }

        transitionToMenu() {
            const loginScreen = document.getElementById('login-screen');
            const mainMenu = document.getElementById('main-menu');

            if (loginScreen && mainMenu) {
                // Fade out login
                loginScreen.style.opacity = '0';
                loginScreen.style.transform = 'scale(0.95)';
                loginScreen.style.transition = 'all 0.4s ease';

                setTimeout(() => {
                    loginScreen.classList.remove('active');
                    loginScreen.style.display = 'none';

                    mainMenu.classList.add('active');
                    mainMenu.style.opacity = '0';
                    mainMenu.style.display = 'flex';

                    // Create user display
                    this.createUserDisplay();

                    // Fade in menu
                    requestAnimationFrame(() => {
                        mainMenu.style.transition = 'opacity 0.4s ease';
                        mainMenu.style.opacity = '1';
                    });
                }, 400);
            }
        }

        createUserDisplay() {
            if (!this.user) return;

            // Remove existing display
            const existing = document.getElementById('user-display');
            if (existing) existing.remove();

            // Get XP data for level
            const xpData = localStorage.getItem('spaceludo_xp');
            const level = xpData ? JSON.parse(xpData).level : 1;
            const title = xpData ? JSON.parse(xpData).title : 'Newbie';

            const display = document.createElement('div');
            display.id = 'user-display';
            display.className = 'user-display';
            display.innerHTML = `
                <div class="user-avatar">${this.user.avatar}</div>
                <div class="user-info">
                    <span class="user-name">${this.user.username}</span>
                    <span class="user-level">Lv.${level} ${title}</span>
                </div>
            `;

            // Add click to show profile/logout options
            display.addEventListener('click', () => this.showUserMenu());

            document.body.appendChild(display);
        }

        showUserMenu() {
            // For now, just log out on click (can expand later)
            if (confirm('Log out?')) {
                this.logout();
            }
        }

        logout() {
            // Don't delete XP data, just user session
            this.user = null;
            localStorage.removeItem('spaceludo_user');

            // Reload page
            location.reload();
        }

        getUser() {
            return this.user;
        }

        getUsername() {
            return this.user?.username || 'Player';
        }

        getAvatar() {
            return this.user?.avatar || '🚀';
        }
    }

    // ============================================
    // XP MANAGER
    // ============================================

    class XPManager {
        constructor() {
            this.data = this.load();
            this.createUI();
            this.setupEventListeners();
        }

        load() {
            const saved = localStorage.getItem('spaceludo_xp');
            return saved ? JSON.parse(saved) : {
                xp: 0,
                level: 1,
                totalXP: 0,
                gamesPlayed: 0,
                wins: 0,
                captures: 0,
                title: 'Newbie'
            };
        }

        save() {
            localStorage.setItem('spaceludo_xp', JSON.stringify(this.data));
        }

        createUI() {
            // Create XP panel
            this.panel = document.createElement('div');
            this.panel.id = 'xp-panel';
            this.panel.className = 'xp-panel';
            this.panel.innerHTML = `
                <div class="xp-level-badge">
                    <span class="level-number">${this.data.level}</span>
                </div>
                <div class="xp-info">
                    <div class="xp-title">${this.data.title}</div>
                    <div class="xp-bar-container">
                        <div class="xp-bar-fill"></div>
                    </div>
                    <div class="xp-text">0 / 100 XP</div>
                </div>
            `;

            const gameScreen = document.getElementById('game-screen');
            if (gameScreen) {
                gameScreen.appendChild(this.panel);
            }

            // Create level up popup
            this.levelUpPopup = document.createElement('div');
            this.levelUpPopup.id = 'level-up-popup';
            this.levelUpPopup.className = 'level-up-popup';
            this.levelUpPopup.innerHTML = `
                <div class="level-up-content">
                    <div class="level-up-stars">★</div>
                    <div class="level-up-title">LEVEL UP!</div>
                    <div class="level-up-level">Level <span id="new-level">2</span></div>
                    <div class="level-up-reward" id="level-reward"></div>
                </div>
            `;
            document.body.appendChild(this.levelUpPopup);

            // Create XP gain popup
            this.xpPopup = document.createElement('div');
            this.xpPopup.id = 'xp-gain-popup';
            this.xpPopup.className = 'xp-gain-popup';
            document.body.appendChild(this.xpPopup);

            this.updateUI();
        }

        updateUI() {
            const levelEl = this.panel.querySelector('.level-number');
            const titleEl = this.panel.querySelector('.xp-title');
            const barEl = this.panel.querySelector('.xp-bar-fill');
            const textEl = this.panel.querySelector('.xp-text');

            const xpNeeded = XP_CONFIG.getXPForLevel(this.data.level);
            const progress = (this.data.xp / xpNeeded) * 100;

            if (levelEl) levelEl.textContent = this.data.level;
            if (titleEl) titleEl.textContent = this.data.title;
            if (barEl) barEl.style.width = `${Math.min(progress, 100)}%`;
            if (textEl) textEl.textContent = `${this.data.xp} / ${xpNeeded} XP`;
        }

        addXP(amount, reason = '') {
            this.data.xp += amount;
            this.data.totalXP += amount;

            // Show XP gain popup
            this.showXPGain(amount, reason);

            // Check for level up
            let levelsGained = 0;
            while (this.data.xp >= XP_CONFIG.getXPForLevel(this.data.level)) {
                this.data.xp -= XP_CONFIG.getXPForLevel(this.data.level);
                this.data.level++;
                levelsGained++;

                // Check for title reward
                const reward = XP_CONFIG.LEVEL_REWARDS[this.data.level];
                if (reward) {
                    this.data.title = reward.title;
                }
            }

            if (levelsGained > 0) {
                this.showLevelUp();
                eventBus.emit(GameEvents.LEVEL_UP, { level: this.data.level, title: this.data.title });
            }

            this.save();
            this.updateUI();

            eventBus.emit(GameEvents.XP_GAINED, { amount, total: this.data.totalXP });
        }

        showXPGain(amount, reason) {
            const popup = this.xpPopup;
            popup.textContent = `+${amount} XP${reason ? ` (${reason})` : ''}`;
            popup.classList.add('show');

            setTimeout(() => {
                popup.classList.remove('show');
            }, 1500);
        }

        showLevelUp() {
            const popup = this.levelUpPopup;
            const levelEl = document.getElementById('new-level');
            const rewardEl = document.getElementById('level-reward');

            if (levelEl) levelEl.textContent = this.data.level;

            const reward = XP_CONFIG.LEVEL_REWARDS[this.data.level];
            if (rewardEl) {
                rewardEl.textContent = reward ? `"${reward.title}" ${reward.reward}` : '';
                rewardEl.style.display = reward ? 'block' : 'none';
            }

            popup.classList.add('show');

            setTimeout(() => {
                popup.classList.remove('show');
            }, 3000);
        }

        show() {
            this.panel.classList.add('visible');
        }

        hide() {
            this.panel.classList.remove('visible');
        }

        setupEventListeners() {
            // Helper to check if a player is the logged-in user
            const isLoggedInPlayer = (player) => {
                if (!player || player.isAI) return false;
                const userData = localStorage.getItem('spaceludo_user');
                if (!userData) return false;
                const loggedInUser = JSON.parse(userData);
                return player.name === loggedInUser.username;
            };

            // Track game events for XP
            eventBus.on(GameEvents.TOKEN_CAPTURE, (data) => {
                // Only award XP to the logged-in user
                const player = gameState.players[data.capturer.playerIndex];
                if (isLoggedInPlayer(player)) {
                    this.data.captures++;
                    this.addXP(XP_CONFIG.REWARDS.CAPTURE_TOKEN, 'Capture');
                }
            });

            eventBus.on(GameEvents.TOKEN_FINISH, (data) => {
                if (isLoggedInPlayer(data.player)) {
                    this.addXP(XP_CONFIG.REWARDS.FINISH_TOKEN, 'Home');
                }
            });

            eventBus.on(GameEvents.PLAYER_WIN, (data) => {
                if (isLoggedInPlayer(data.player)) {
                    this.data.wins++;
                    this.addXP(XP_CONFIG.REWARDS.WIN_GAME, 'Victory!');
                }
            });

            eventBus.on(GameEvents.DICE_ROLLED, (data) => {
                if (data.value === 6 && isLoggedInPlayer(data.player)) {
                    this.addXP(XP_CONFIG.REWARDS.ROLL_SIX, 'Lucky 6');
                }
            });

            eventBus.on(GameEvents.GAME_START, () => {
                this.data.gamesPlayed++;
                this.save();
                this.show();
            });

            eventBus.on(GameEvents.GAME_END, () => {
                // Award participation XP only if logged-in user was playing
                const userData = localStorage.getItem('spaceludo_user');
                if (userData) {
                    const loggedInUser = JSON.parse(userData);
                    const wasPlaying = gameState.players.some(p => !p.isAI && p.name === loggedInUser.username);
                    if (wasPlaying) {
                        this.addXP(XP_CONFIG.REWARDS.PLAY_GAME, 'Game played');
                    }
                }
            });
        }

        getStats() {
            return { ...this.data };
        }
    }

    // ============================================
    // SOUND MANAGER
    // ============================================

    class SoundManager {
        constructor() {
            this.context = null;
            this.enabled = true;
            this.musicEnabled = false;
            this.initialized = false;
            this.musicNodes = [];
            this.musicGain = null;

            this.setupEventListeners();
            this.loadMusicSetting();
        }

        loadMusicSetting() {
            const saved = localStorage.getItem('spaceludo_music');
            // Default to ON if not set
            this.musicEnabled = saved !== 'false';
            const toggle = document.getElementById('music-toggle');
            if (toggle) toggle.checked = this.musicEnabled;
        }

        setupEventListeners() {
            eventBus.on(GameEvents.TOGGLE_SOUND, (data) => {
                this.enabled = data.enabled;
            });

            eventBus.on(GameEvents.DICE_ROLL_START, () => this.playDiceRoll());
            eventBus.on(GameEvents.TOKEN_MOVE, () => this.playMove());
            // Capture sound disabled
            // eventBus.on(GameEvents.TOKEN_CAPTURE, () => this.playCapture());
            eventBus.on(GameEvents.PLAYER_WIN, () => this.playVictory());

            // Music toggle handler
            document.getElementById('music-toggle')?.addEventListener('change', (e) => {
                this.musicEnabled = e.target.checked;
                localStorage.setItem('spaceludo_music', e.target.checked ? 'true' : 'false');
                if (e.target.checked) {
                    this.startBackgroundMusic();
                } else {
                    this.stopBackgroundMusic();
                }
            });

            // Start music when game starts if enabled
            eventBus.on(GameEvents.GAME_START, () => {
                if (this.musicEnabled && !this.audioElement) {
                    this.startBackgroundMusic();
                }
            });

            // Start music on first user interaction (browsers require this)
            const startMusicOnClick = () => {
                if (this.musicEnabled && !this.audioElement) {
                    this.startBackgroundMusic();
                }
            };

            // Keep trying to start music on clicks until it works
            const tryStartMusic = () => {
                if (this.musicEnabled && (!this.audioElement || this.audioElement.paused)) {
                    this.startBackgroundMusic();
                }
            };

            // Listen for clicks to start music
            document.addEventListener('click', tryStartMusic);
            document.addEventListener('touchstart', tryStartMusic);

            // Also try to start immediately (may work if user already interacted)
            setTimeout(tryStartMusic, 500);
            setTimeout(tryStartMusic, 1500);
        }

        init() {
            if (this.initialized) return;
            try {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
                this.initialized = true;

                // Create master gain for music
                this.musicGain = this.context.createGain();
                const savedVolume = localStorage.getItem('spaceLudoMusicVolume');
                this.musicGain.gain.value = savedVolume !== null ? parseFloat(savedVolume) : 0.3;
                this.musicGain.connect(this.context.destination);
            } catch (e) {
                console.warn('Audio not supported');
            }
        }

        startBackgroundMusic() {
            if (!this.musicEnabled) return;

            // Stop any existing music
            this.stopBackgroundMusic();

            // Play MP3 file
            this.audioElement = new Audio('assets/audio.mp3');
            this.audioElement.loop = true;

            // Get saved volume (default 9%)
            const savedVolume = localStorage.getItem('spaceLudoMusicVolume');
            this.audioElement.volume = savedVolume !== null ? parseFloat(savedVolume) : 0.09;

            // Add error handler
            this.audioElement.onerror = (e) => {
                console.error('Music file error:', e);
                console.error('Audio error code:', this.audioElement.error?.code);
            };

            this.audioElement.oncanplay = () => {
                console.log('Music ready to play');
            };

            this.audioElement.play().then(() => {
                console.log('Music playing!');
            }).catch(e => {
                console.warn('Could not autoplay music:', e);
            });
        }

        setMusicVolume(volume) {
            localStorage.setItem('spaceLudoMusicVolume', volume.toString());
            if (this.audioElement) {
                this.audioElement.volume = volume;
            }
            if (this.musicGain) {
                this.musicGain.gain.value = volume;
            }
        }

        stopBackgroundMusic() {
            // Stop audio element
            if (this.audioElement) {
                this.audioElement.pause();
                this.audioElement.currentTime = 0;
                this.audioElement = null;
            }

            this.musicNodes.forEach(node => {
                try {
                    if (node.osc) node.osc.stop();
                    if (node.lfo) node.lfo.stop();
                    if (node.freqLfo) node.freqLfo.stop();
                } catch (e) {
                    // Already stopped
                }
            });
            this.musicNodes = [];
        }

        playDiceRoll() {
            if (!this.enabled || !this.context) return;
            this.playTone(200, 0.1, 'square');
        }

        playMove() {
            if (!this.enabled || !this.context) return;
            this.playTone(500, 0.1, 'sine');
        }

        playCapture() {
            if (!this.enabled || !this.context) return;
            this.playTone(150, 0.3, 'sawtooth');
        }

        playVictory() {
            if (!this.enabled || !this.context) return;
            const notes = [523, 659, 784, 1047];
            notes.forEach((freq, i) => {
                setTimeout(() => this.playTone(freq, 0.3, 'sine'), i * 150);
            });
        }

        playTone(freq, duration, type = 'sine') {
            if (!this.context) return;

            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.type = type;
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.3, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.context.destination);

            osc.start();
            osc.stop(this.context.currentTime + duration);
        }
    }

    // ============================================
    // MENU CONTROLLER
    // ============================================

    class MenuController {
        constructor(uiRenderer, tokenRenderer) {
            this.uiRenderer = uiRenderer;
            this.tokenRenderer = tokenRenderer;
            this.gameMode = null;

            this.setupEventListeners();
            this.checkForSavedGame();
        }

        checkForSavedGame() {
            const resumeBtn = document.getElementById('btn-resume');
            if (resumeBtn && gameState.hasSavedGame()) {
                resumeBtn.style.display = 'flex';
            }
        }

        resumeGame() {
            if (gameState.loadGame()) {
                AIController.setDifficulty(gameState.aiDifficulty);
                this.uiRenderer.showScreen('game');

                // Re-render tokens at their saved positions
                if (this.tokenRenderer) {
                    this.tokenRenderer.renderAllTokens();
                }

                // Update player info display
                eventBus.emit(GameEvents.TURN_START, {
                    player: gameState.getCurrentPlayer()
                });

                console.log('Game resumed!');
            } else {
                console.error('Failed to resume game');
            }
        }

        setupEventListeners() {
            // Resume button
            document.getElementById('btn-resume')?.addEventListener('click', () => {
                this.resumeGame();
            });

            // Main menu buttons
            document.getElementById('btn-local')?.addEventListener('click', () => {
                this.gameMode = 'local';
                gameState.clearSave(); // Clear old save when starting new game
                this.uiRenderer.generatePlayerInputs('local');
                this.uiRenderer.showScreen('setup');
            });

            document.getElementById('btn-ai')?.addEventListener('click', () => {
                this.gameMode = 'ai';
                gameState.clearSave(); // Clear old save when starting new game
                this.uiRenderer.generatePlayerInputs('ai');
                this.uiRenderer.showScreen('setup');
            });

            // Profile pictures button
            document.getElementById('btn-profiles')?.addEventListener('click', () => {
                this.showProfileModal();
            });

            document.getElementById('btn-profile-done')?.addEventListener('click', () => {
                this.hideProfileModal();
            });

            // Reset all profiles button
            document.getElementById('btn-reset-all-profiles')?.addEventListener('click', () => {
                this.resetAllProfiles();
            });

            // Individual reset profile buttons
            document.querySelectorAll('.reset-profile-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Don't trigger the profile-item click
                    const playerIndex = parseInt(btn.dataset.player);
                    this.resetProfile(playerIndex);
                });
            });

            // Profile picture selection
            document.querySelectorAll('.profile-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    // Don't trigger if clicking the reset button
                    if (e.target.classList.contains('reset-profile-btn')) return;
                    const playerIndex = item.dataset.player;
                    const input = document.getElementById(`profile-input-${playerIndex}`);
                    input?.click();
                });
            });

            // Handle file selection for each player
            for (let i = 0; i < 4; i++) {
                const input = document.getElementById(`profile-input-${i}`);
                input?.addEventListener('change', (e) => {
                    this.handleProfileImageChange(i, e.target.files[0]);
                });
            }

            // Setup screen buttons
            document.getElementById('btn-back')?.addEventListener('click', () => {
                this.uiRenderer.showScreen('menu');
            });

            document.getElementById('btn-start')?.addEventListener('click', () => {
                this.startGame();
            });

            // Difficulty buttons
            document.querySelectorAll('.diff-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });

            // Victory screen buttons
            document.getElementById('btn-play-again')?.addEventListener('click', () => {
                this.uiRenderer.hideVictory();
                this.uiRenderer.showScreen('setup');
            });

            document.getElementById('btn-main-menu')?.addEventListener('click', () => {
                this.uiRenderer.hideVictory();
                this.uiRenderer.showScreen('menu');
            });

            // Game controls
            document.getElementById('btn-sound')?.addEventListener('click', () => {
                const enabled = gameState.toggleSound();
                this.updateSoundButton(enabled);
            });

            // Settings button
            document.getElementById('btn-settings')?.addEventListener('click', () => {
                this.showSettingsModal();
            });

            document.getElementById('btn-settings-done')?.addEventListener('click', () => {
                this.hideSettingsModal();
            });

            // Settings toggle handlers
            document.getElementById('sound-toggle')?.addEventListener('change', (e) => {
                gameState.soundEnabled = e.target.checked;
                this.updateSoundButton(e.target.checked);
            });

            // Auto-play toggle handler
            document.getElementById('autoplay-toggle')?.addEventListener('change', (e) => {
                localStorage.setItem('spaceludo_autoplay', e.target.checked ? 'true' : 'false');
                // If disabled, clear any existing timer
                if (!e.target.checked) {
                    TurnManager.clearAutoPlayTimer();
                }
            });

            // Load auto-play setting from localStorage
            const autoplayToggle = document.getElementById('autoplay-toggle');
            if (autoplayToggle) {
                const saved = localStorage.getItem('spaceludo_autoplay');
                autoplayToggle.checked = saved !== 'false'; // Default to true
            }

            // Music volume slider handler
            const volumeSlider = document.getElementById('music-volume');
            const volumeValue = document.getElementById('volume-value');
            if (volumeSlider) {
                // Load saved volume (default 9%)
                const savedVolume = localStorage.getItem('spaceLudoMusicVolume');
                const volumePercent = savedVolume !== null ? Math.round(parseFloat(savedVolume) * 100) : 9;
                volumeSlider.value = volumePercent;
                if (volumeValue) volumeValue.textContent = volumePercent + '%';

                volumeSlider.addEventListener('input', (e) => {
                    const percent = parseInt(e.target.value);
                    const volume = percent / 100;
                    if (volumeValue) volumeValue.textContent = percent + '%';
                    if (window.soundManager && window.soundManager.audioElement) {
                        window.soundManager.audioElement.volume = volume;
                    }
                    localStorage.setItem('spaceLudoMusicVolume', volume.toString());
                });
            }

            document.getElementById('btn-menu')?.addEventListener('click', () => {
                // Stop the game properly
                this.leaveGame();
                gameState.phase = GAME_PHASE.MENU;
                this.uiRenderer.showScreen('menu');
            });

            document.getElementById('btn-restart')?.addEventListener('click', () => {
                this.startGame();
            });

            // Setup floating volume controls
            this.setupFloatingVolumeControl('login');
            this.setupFloatingVolumeControl('menu');
        }

        setupFloatingVolumeControl(prefix) {
            const btn = document.getElementById(`${prefix}-volume-btn`);
            const popup = document.getElementById(`${prefix}-volume-popup`);
            const slider = document.getElementById(`${prefix}-volume-slider`);
            const percent = document.getElementById(`${prefix}-volume-percent`);

            if (!btn || !popup || !slider) return;

            // Load saved volume
            const savedVolume = localStorage.getItem('spaceLudoMusicVolume');
            const volumePercent = savedVolume !== null ? Math.round(parseFloat(savedVolume) * 100) : 9;
            slider.value = volumePercent;
            if (percent) percent.textContent = volumePercent + '%';

            // Update button icon based on volume
            const updateIcon = (vol) => {
                if (vol === 0) btn.textContent = '🔇';
                else if (vol < 30) btn.textContent = '🔈';
                else if (vol < 70) btn.textContent = '🔉';
                else btn.textContent = '🔊';
            };
            updateIcon(volumePercent);

            // Toggle popup
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                popup.classList.toggle('active');
            });

            // Close popup when clicking outside
            document.addEventListener('click', () => {
                popup.classList.remove('active');
            });

            popup.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // Volume slider change
            slider.addEventListener('input', (e) => {
                const vol = parseInt(e.target.value);
                const volume = vol / 100;
                if (percent) percent.textContent = vol + '%';
                updateIcon(vol);

                if (window.soundManager && window.soundManager.audioElement) {
                    window.soundManager.audioElement.volume = volume;
                }
                localStorage.setItem('spaceLudoMusicVolume', volume.toString());

                // Sync other volume controls
                this.syncVolumeControls(vol);
            });
        }

        syncVolumeControls(volumePercent) {
            ['login', 'menu', 'music'].forEach(prefix => {
                const slider = document.getElementById(`${prefix}-volume-slider`) || document.getElementById(`${prefix}-volume`);
                const percent = document.getElementById(`${prefix}-volume-percent`) || document.getElementById('volume-value');
                if (slider) slider.value = volumePercent;
                if (percent) percent.textContent = volumePercent + '%';
            });
        }

        updateSoundButton(enabled) {
            const btn = document.getElementById('btn-sound');
            const toggle = document.getElementById('sound-toggle');
            if (btn) {
                if (enabled) {
                    btn.classList.remove('muted');
                    btn.innerHTML = '&#128266;';  // Speaker icon
                    btn.title = 'Mute Sound';
                } else {
                    btn.classList.add('muted');
                    btn.innerHTML = '&#128263;';  // Muted speaker icon
                    btn.title = 'Unmute Sound';
                }
            }
            if (toggle) {
                toggle.checked = enabled;
            }
        }

        showSettingsModal() {
            const modal = document.getElementById('settings-modal');
            if (modal) {
                modal.style.display = 'flex';
                // Sync toggles with current state
                const soundToggle = document.getElementById('sound-toggle');
                if (soundToggle) soundToggle.checked = gameState.soundEnabled;

                const autoplayToggle = document.getElementById('autoplay-toggle');
                if (autoplayToggle) {
                    const saved = localStorage.getItem('spaceludo_autoplay');
                    autoplayToggle.checked = saved !== 'false';
                }
            }
        }

        hideSettingsModal() {
            const modal = document.getElementById('settings-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }

        showProfileModal() {
            const modal = document.getElementById('profile-modal');
            if (modal) {
                modal.style.display = 'flex';
                this.loadSavedProfileImages();

                // Determine which player slot to show
                // Online: show assigned slot, Offline: show Player 1 (human)
                let mySlot = 0;
                if (gameState.isOnlineGame && networkManager && networkManager.isOnline) {
                    mySlot = networkManager.playerSlot;
                }

                // Only show the local player's profile
                const profileItems = modal.querySelectorAll('.profile-item');
                profileItems.forEach((item) => {
                    const playerIndex = parseInt(item.dataset.player);
                    if (playerIndex === mySlot) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });

                // Hide reset all button (only one player shown)
                const resetAllBtn = document.getElementById('btn-reset-all-profiles');
                if (resetAllBtn) resetAllBtn.style.display = 'none';

                // Update title
                const title = modal.querySelector('.profile-title');
                if (title) title.textContent = 'Profile Picture';

                const subtitle = modal.querySelector('.profile-subtitle');
                if (subtitle) subtitle.textContent = 'Add a photo to personalize your game';

                // Hide the label since only one profile is shown
                const label = modal.querySelector('.profile-item:not([style*="display: none"]) .profile-label');
                if (label) label.style.display = 'none';
            }
        }

        hideProfileModal() {
            const modal = document.getElementById('profile-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }

        handleProfileImageChange(playerIndex, file) {
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target.result;

                // Update the preview in the modal
                const modalImg = document.getElementById(`profile-img-${playerIndex}`);
                if (modalImg) {
                    modalImg.src = imageData;
                    modalImg.classList.add('loaded');
                }

                // Update the game avatar
                const gameAvatar = document.querySelector(`.player-info[data-player="${playerIndex}"] .profile-pic`);
                if (gameAvatar) {
                    gameAvatar.src = imageData;
                    gameAvatar.classList.add('loaded');
                    gameAvatar.style.display = 'block';
                }

                // Save to localStorage
                this.saveProfileImage(playerIndex, imageData);
            };
            reader.readAsDataURL(file);
        }

        saveProfileImage(playerIndex, imageData) {
            try {
                const profiles = JSON.parse(localStorage.getItem('spaceLudoProfiles') || '{}');
                profiles[playerIndex] = imageData;
                localStorage.setItem('spaceLudoProfiles', JSON.stringify(profiles));
            } catch (e) {
                console.error('Failed to save profile image:', e);
            }
        }

        loadSavedProfileImages() {
            try {
                const profiles = JSON.parse(localStorage.getItem('spaceLudoProfiles') || '{}');
                for (let i = 0; i < 4; i++) {
                    if (profiles[i]) {
                        // Update modal preview
                        const modalImg = document.getElementById(`profile-img-${i}`);
                        if (modalImg) {
                            modalImg.src = profiles[i];
                            modalImg.classList.add('loaded');
                        }

                        // Update game avatar
                        const gameAvatar = document.querySelector(`.player-info[data-player="${i}"] .profile-pic`);
                        if (gameAvatar) {
                            gameAvatar.src = profiles[i];
                            gameAvatar.classList.add('loaded');
                            gameAvatar.style.display = 'block';
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to load profile images:', e);
            }
        }

        resetProfile(playerIndex) {
            try {
                // Remove from localStorage
                const profiles = JSON.parse(localStorage.getItem('spaceLudoProfiles') || '{}');
                delete profiles[playerIndex];
                localStorage.setItem('spaceLudoProfiles', JSON.stringify(profiles));

                // Reset modal preview
                const modalImg = document.getElementById(`profile-img-${playerIndex}`);
                if (modalImg) {
                    modalImg.src = '';
                    modalImg.classList.remove('loaded');
                }

                // Reset game avatar
                const gameAvatar = document.querySelector(`.player-info[data-player="${playerIndex}"] .profile-pic`);
                if (gameAvatar) {
                    gameAvatar.src = '';
                    gameAvatar.classList.remove('loaded');
                    gameAvatar.style.display = 'none';
                }

                console.log(`Profile ${playerIndex} reset to default`);
            } catch (e) {
                console.error('Failed to reset profile:', e);
            }
        }

        resetAllProfiles() {
            for (let i = 0; i < 4; i++) {
                this.resetProfile(i);
            }
            // Clear all from localStorage at once
            localStorage.removeItem('spaceLudoProfiles');
            console.log('All profiles reset to default');
        }

        leaveGame() {
            // Stop all game timers
            TurnManager.clearAutoPlayTimer();

            // Stop any ongoing animations/sounds
            if (window.soundManager) {
                window.soundManager.stopBackgroundMusic();
            }

            // Clear game state
            gameState.phase = GAME_PHASE.MENU;
            gameState.currentPlayerIndex = 0;
            gameState.diceValue = null;
            gameState.hasRolled = false;
            gameState.selectedToken = null;

            // Clear any active intervals
            if (gameState.gameLoopInterval) {
                clearInterval(gameState.gameLoopInterval);
                gameState.gameLoopInterval = null;
            }

            // Leave online room if connected
            if (typeof networkManager !== 'undefined' && networkManager.roomId) {
                networkManager.leaveRoom();
            }

            console.log('Left the game');
        }

        startGame() {
            const config = this.uiRenderer.getPlayerConfig();
            config.mode = this.gameMode;

            AIController.setDifficulty(config.aiDifficulty);

            gameState.initGame(config);

            // Assign avatars to all players (AI gets robot emojis, humans get their selected avatar)
            this.assignPlayerAvatars();

            TurnManager.startTurn();
        }

        assignPlayerAvatars() {
            const aiEmojis = ['🤖', '👾', '🛸', '👽'];
            const userManager = window.userManager;

            gameState.players.forEach((player, index) => {
                const avatarIcon = document.querySelector(`.player-info[data-player="${index}"] .avatar-icon`);
                const profilePic = document.querySelector(`.player-info[data-player="${index}"] .profile-pic`);
                const playerName = document.querySelector(`.player-info[data-player="${index}"] .player-name`);

                if (!avatarIcon) return;

                // Update player name
                if (playerName) {
                    playerName.textContent = player.name + (player.isAI ? ' (AI)' : '');
                }

                // Check if player has a saved profile picture
                const profiles = JSON.parse(localStorage.getItem('spaceLudoProfiles') || '{}');
                if (profiles[index] && profilePic) {
                    // Player has custom profile pic - use it
                    profilePic.src = profiles[index];
                    profilePic.classList.add('loaded');
                    profilePic.style.display = 'block';
                } else {
                    // No custom pic - use emoji
                    if (profilePic) {
                        profilePic.src = '';
                        profilePic.classList.remove('loaded');
                        profilePic.style.display = 'none';
                    }

                    if (player.isAI) {
                        // AI player gets robot emoji
                        avatarIcon.textContent = aiEmojis[index % aiEmojis.length];
                    } else if (index === 0 && userManager && userManager.getAvatar()) {
                        // Human player (first slot) gets their login avatar
                        avatarIcon.textContent = userManager.getAvatar();
                    } else {
                        // Default emoji for other human players
                        avatarIcon.textContent = '👤';
                    }
                }
            });
        }
    }

    // ============================================
    // CHAT SYSTEM
    // ============================================

    class ChatSystem {
        constructor() {
            this.chatBox = document.getElementById('chat-box');
            this.chatMessages = document.getElementById('chat-messages');
            this.chatInput = document.getElementById('chat-input');
            this.chatSend = document.getElementById('chat-send');
            this.chatToggle = document.getElementById('chat-toggle');
            this.chatHeader = document.querySelector('.chat-header');

            this.isMinimized = false;
            this.setupEventListeners();
            this.setupGameEventListeners();
        }

        setupEventListeners() {
            // Toggle chat minimize
            if (this.chatToggle) {
                this.chatToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleMinimize();
                });
            }

            if (this.chatHeader) {
                this.chatHeader.addEventListener('click', () => {
                    if (this.isMinimized) {
                        this.toggleMinimize();
                    }
                });
            }

            // Send message on button click
            if (this.chatSend) {
                this.chatSend.addEventListener('click', () => {
                    this.sendMessage();
                });
            }

            // Send message on Enter key
            if (this.chatInput) {
                this.chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.sendMessage();
                    }
                });
            }

            // Quick messages
            document.querySelectorAll('.quick-msg').forEach(btn => {
                btn.addEventListener('click', () => {
                    const msg = btn.dataset.msg;
                    if (msg) {
                        this.sendMessage(msg);
                    }
                });
            });
        }

        setupGameEventListeners() {
            // Game events to show in chat
            eventBus.on(GameEvents.GAME_START, () => {
                this.addSystemMessage('Game started! Good luck everyone!');
            });

            eventBus.on(GameEvents.TOKEN_CAPTURE, (data) => {
                const capturer = gameState.getCurrentPlayer();
                this.addSystemMessage(`${capturer.name} captured a token! 💥`);
            });

            eventBus.on(GameEvents.TOKEN_FINISH, () => {
                const player = gameState.getCurrentPlayer();
                this.addSystemMessage(`${player.name} got a token home! 🏠`);
            });

            eventBus.on(GameEvents.PLAYER_WIN, (data) => {
                this.addSystemMessage(`🎉 ${data.player.name} wins the game! 🎉`);
            });

            // Receive chat messages from other players in online mode
            eventBus.on('online:chatMessage', (data) => {
                // Don't duplicate our own messages (we already added them locally)
                if (gameState.isOnlineGame && networkManager && networkManager.playerSlot !== undefined) {
                    const localPlayer = gameState.players[networkManager.playerSlot];
                    if (!localPlayer || data.senderName !== localPlayer.name) {
                        this.addMessage(data.senderName, data.message, data.senderColor);
                    }
                }
            });
        }

        toggleMinimize() {
            this.isMinimized = !this.isMinimized;
            if (this.chatBox) {
                this.chatBox.classList.toggle('minimized', this.isMinimized);
            }
            if (this.chatToggle) {
                this.chatToggle.textContent = this.isMinimized ? '+' : '−';
            }
        }

        sendMessage(quickMsg = null) {
            const text = quickMsg || this.chatInput?.value.trim();
            if (!text) return;

            // In online mode, use the local player; otherwise use current turn player
            let player;
            if (gameState.isOnlineGame && networkManager && networkManager.playerSlot !== undefined) {
                player = gameState.players[networkManager.playerSlot];
            } else {
                player = gameState.getCurrentPlayer();
            }

            if (!player) {
                this.addSystemMessage('Start a game to chat!');
                return;
            }

            this.addMessage(player.name, text, player.color.toLowerCase());

            // Broadcast chat message to other players in online mode
            if (gameState.isOnlineGame && typeof networkManager !== 'undefined' && networkManager.isOnline) {
                networkManager.broadcastAction('CHAT_MESSAGE', {
                    senderName: player.name,
                    senderColor: player.color.toLowerCase(),
                    message: text,
                    timestamp: Date.now()
                });
            }

            if (this.chatInput) {
                this.chatInput.value = '';
            }
        }

        addMessage(sender, text, colorClass) {
            if (!this.chatMessages) return;

            const msgEl = document.createElement('div');
            msgEl.className = `chat-message ${colorClass}`;
            msgEl.innerHTML = `
                <div class="sender">${sender}</div>
                <div class="text">${this.escapeHtml(text)}</div>
            `;

            this.chatMessages.appendChild(msgEl);
            this.scrollToBottom();
        }

        addSystemMessage(text) {
            if (!this.chatMessages) return;

            const msgEl = document.createElement('div');
            msgEl.className = 'chat-message system';
            msgEl.innerHTML = `<div class="text">${this.escapeHtml(text)}</div>`;

            this.chatMessages.appendChild(msgEl);
            this.scrollToBottom();
        }

        scrollToBottom() {
            if (this.chatMessages) {
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            }
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    // ============================================
    // ONLINE MULTIPLAYER - NETWORK MANAGER
    // ============================================

    // Supabase configuration - Replace with your own Supabase project credentials
    const SUPABASE_CONFIG = {
        url: 'https://mwmnkckgxvzombgpfnim.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13bW5rY2tneHZ6b21iZ3BmbmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDg3NTIsImV4cCI6MjA4NTA4NDc1Mn0.66aF0PTsC8flbGbq0gwWkrR6tvar58C0FMySm4MVqJE'
    };

    class NetworkManager {
        constructor() {
            this.supabase = null;
            this.isOnline = false;
            this.isHost = false;
            this.roomId = null;
            this.roomCode = null;
            this.playerId = null;
            this.playerSlot = null;
            this.playerName = '';
            this.roomSubscription = null;
            this.actionsSubscription = null;
            this.playersSubscription = null;
            this.applyingRemote = false;
            this.reconnectAttempts = 0;
            this.maxReconnectAttempts = 5;
            this.heartbeatInterval = null;
        }

        async initialize() {
            if (typeof supabase === 'undefined') {
                console.warn('Supabase not loaded - online features disabled');
                return false;
            }

            if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL') {
                console.warn('Supabase not configured - please set your credentials in game-bundle.js');
                this.showConfigWarning();
                return false;
            }

            try {
                this.supabase = supabase.createClient(
                    SUPABASE_CONFIG.url,
                    SUPABASE_CONFIG.anonKey,
                    {
                        db: {
                            schema: 'public'
                        },
                        auth: {
                            persistSession: false
                        }
                    }
                );
                console.log('Supabase initialized');
                return true;
            } catch (error) {
                console.error('Failed to initialize Supabase:', error);
                return false;
            }
        }

        showConfigWarning() {
            const warning = document.createElement('div');
            warning.className = 'online-toast';
            warning.textContent = 'Online play requires Supabase setup. See README.';
            warning.style.background = 'rgba(255, 100, 100, 0.9)';
            document.body.appendChild(warning);
            setTimeout(() => warning.remove(), 4000);
        }

        generateRoomCode() {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let code = '';
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
        }

        generatePlayerId() {
            return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        async createRoom(playerName) {
            if (!this.supabase) {
                await this.initialize();
                if (!this.supabase) return null;
            }

            this.playerName = playerName || 'Player';
            this.playerId = this.generatePlayerId();
            this.roomCode = this.generateRoomCode();
            this.isHost = true;
            this.playerSlot = 0;

            try {
                // Create room
                const { data: room, error: roomError } = await this.supabase
                    .from('rooms')
                    .insert({
                        code: this.roomCode,
                        host_id: this.playerId,
                        status: 'waiting',
                        max_players: 4,
                        game_state: null
                    })
                    .select()
                    .single();

                if (roomError) throw roomError;

                this.roomId = room.id;

                // Add host as first player
                console.log('DEBUG: createRoom - Inserting host player with name:', this.playerName);
                const hostPlayerData = {
                    room_id: this.roomId,
                    name: this.playerName,
                    color: PLAYER_ORDER[0],
                    slot: 0,
                    is_host: true,
                    is_connected: true
                };
                console.log('DEBUG: createRoom - Data to insert:', hostPlayerData);

                const { data: playerData, error: playerError } = await this.supabase
                    .from('players')
                    .insert(hostPlayerData)
                    .select('id, room_id, name, color, slot, is_host, is_connected');

                if (playerError) {
                    console.error('DEBUG: createRoom - Player insert error:', playerError);
                    throw playerError;
                }
                console.log('DEBUG: createRoom - Successfully inserted player data:', JSON.stringify(playerData, null, 2));
                if (!playerData || playerData.length === 0) {
                    console.error('DEBUG: createRoom - WARNING: No data returned from insert!');
                } else {
                    console.log('DEBUG: createRoom - Host name confirmed:', playerData[0].name);
                }

                // Subscribe to room updates
                await this.subscribeToRoom();

                this.isOnline = true;
                this.updateConnectionStatus('connected');
                this.startHeartbeat();

                console.log('Room created:', this.roomCode);
                return this.roomCode;
            } catch (error) {
                console.error('Failed to create room:', error);
                this.showToast('Failed to create room. Please try again.');
                return null;
            }
        }

        async joinRoom(roomCode, playerName) {
            if (!this.supabase) {
                await this.initialize();
                if (!this.supabase) return null;
            }

            roomCode = roomCode.toUpperCase().trim();
            this.playerName = playerName || 'Player';
            this.playerId = this.generatePlayerId();
            this.isHost = false;

            try {
                // Find room
                const { data: room, error: roomError } = await this.supabase
                    .from('rooms')
                    .select('*')
                    .eq('code', roomCode)
                    .single();

                if (roomError || !room) {
                    this.showToast('Room not found. Check the code and try again.');
                    return null;
                }

                if (room.status !== 'waiting') {
                    this.showToast('Game already in progress.');
                    return null;
                }

                this.roomId = room.id;
                this.roomCode = roomCode;

                // Get current players
                const { data: players, error: playersError } = await this.supabase
                    .from('players')
                    .select('*')
                    .eq('room_id', this.roomId);

                if (playersError) throw playersError;

                if (players.length >= 4) {
                    this.showToast('Room is full.');
                    return null;
                }

                // Find next available slot
                const occupiedSlots = players.map(p => p.slot);
                for (let i = 0; i < 4; i++) {
                    if (!occupiedSlots.includes(i)) {
                        this.playerSlot = i;
                        break;
                    }
                }

                // Add player
                const newPlayer = {
                    room_id: this.roomId,
                    name: this.playerName,
                    color: PLAYER_ORDER[this.playerSlot],
                    slot: this.playerSlot,
                    is_host: false,
                    is_connected: true
                };

                console.log('DEBUG: joinRoom - Inserting player with data:', newPlayer);
                const { data: insertedPlayer, error: joinError } = await this.supabase
                    .from('players')
                    .insert(newPlayer)
                    .select('id, room_id, name, color, slot, is_host, is_connected');

                if (joinError) {
                    console.error('DEBUG: joinRoom - Player insert error:', joinError);
                    throw joinError;
                }
                console.log('DEBUG: joinRoom - Successfully inserted player data:', JSON.stringify(insertedPlayer, null, 2));
                if (!insertedPlayer || insertedPlayer.length === 0) {
                    console.error('DEBUG: joinRoom - WARNING: No data returned from insert!');
                } else {
                    console.log('DEBUG: joinRoom - Player name confirmed:', insertedPlayer[0].name);
                }

                // Subscribe to room updates
                await this.subscribeToRoom();

                this.isOnline = true;
                this.updateConnectionStatus('connected');
                this.startHeartbeat();

                // Add ourselves to the players list
                players.push(newPlayer);

                console.log('Joined room:', roomCode, 'as', this.playerName);
                return {
                    roomCode: this.roomCode,
                    slot: this.playerSlot,
                    players: players
                };
            } catch (error) {
                console.error('Failed to join room:', error);
                this.showToast('Failed to join room. Please try again.');
                return null;
            }
        }

        async subscribeToRoom() {
            if (!this.supabase || !this.roomId) return;

            // Subscribe to players changes
            this.playersSubscription = this.supabase
                .channel(`room-players-${this.roomId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'players',
                    filter: `room_id=eq.${this.roomId}`
                }, (payload) => {
                    this.handlePlayerChange(payload);
                })
                .subscribe();

            // Subscribe to room status changes
            this.roomSubscription = this.supabase
                .channel(`room-${this.roomId}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rooms',
                    filter: `id=eq.${this.roomId}`
                }, (payload) => {
                    this.handleRoomUpdate(payload);
                })
                .subscribe();

            // Subscribe to game actions
            this.actionsSubscription = this.supabase
                .channel(`room-actions-${this.roomId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'game_actions',
                    filter: `room_id=eq.${this.roomId}`
                }, (payload) => {
                    this.handleGameAction(payload);
                })
                .subscribe();
        }

        handlePlayerChange(payload) {
            console.log('Player change:', payload);
            eventBus.emit('online:playerChange', payload);

            if (payload.eventType === 'INSERT') {
                this.showToast(`${payload.new.name} joined the room`);
            } else if (payload.eventType === 'DELETE') {
                const leftPlayer = payload.old;
                this.showToast(`${leftPlayer.name} left the game`);

                // If game is in progress, convert the player to AI
                if (gameState.phase === GAME_PHASE.PLAYING && leftPlayer.slot !== undefined) {
                    this.convertPlayerToAI(leftPlayer.slot, leftPlayer.name);
                }
            } else if (payload.eventType === 'UPDATE' && payload.new.is_connected === false) {
                // Player disconnected but didn't leave yet
                const disconnectedPlayer = payload.new;
                this.showToast(`${disconnectedPlayer.name} disconnected`);

                // Convert to AI after a short delay if still disconnected
                if (gameState.phase === GAME_PHASE.PLAYING && disconnectedPlayer.slot !== undefined) {
                    setTimeout(() => {
                        // Check if player is still disconnected
                        const player = gameState.players[disconnectedPlayer.slot];
                        if (player && !player.isAI) {
                            this.convertPlayerToAI(disconnectedPlayer.slot, disconnectedPlayer.name);
                        }
                    }, 5000); // 5 second grace period
                }
            }
        }

        convertPlayerToAI(playerSlot, playerName) {
            const player = gameState.players[playerSlot];
            if (!player || player.isAI) return; // Already AI or doesn't exist

            console.log(`Converting player ${playerSlot} (${playerName}) to AI`);

            // Convert player to AI
            player.isAI = true;
            player.aiDifficulty = 'MEDIUM';
            player.name = `${playerName} (AI)`;

            // Show notification
            eventBus.emit(GameEvents.SHOW_MESSAGE, {
                message: `${playerName} left - AI taking over`,
                type: 'warning'
            });

            // Update the player name display in UI
            const playerInfo = document.querySelector(`.player-info[data-player="${playerSlot}"]`);
            if (playerInfo) {
                const nameEl = playerInfo.querySelector('.player-name');
                if (nameEl) {
                    nameEl.textContent = player.name;
                }
            }

            // If it's this player's turn and we're the host, trigger AI turn
            if (gameState.currentPlayerIndex === playerSlot && this.isHost) {
                console.log('Triggering AI turn for converted player');
                setTimeout(async () => {
                    if (gameState.turnPhase === TURN_PHASE.WAITING) {
                        await TurnManager.handleAITurn();
                    } else if (gameState.turnPhase === TURN_PHASE.SELECTING) {
                        // AI needs to select a token
                        const validMoves = gameState.validMoves;
                        if (validMoves && validMoves.length > 0) {
                            const move = await AIController.selectMove(validMoves, gameState);
                            await TurnManager.executeMove(move);
                        }
                    }
                }, 1000);
            }
        }

        handleRoomUpdate(payload) {
            console.log('Room update:', payload);

            if (payload.new.status === 'playing' && !this.isHost) {
                // Game started by host
                eventBus.emit('online:gameStart', payload.new);
            }
        }

        handleGameAction(payload) {
            if (this.applyingRemote) return;

            const action = payload.new;
            console.log('Received game action:', action);

            // Don't apply our own actions
            if (action.player_slot === this.playerSlot) return;

            this.applyingRemote = true;

            switch (action.action_type) {
                case 'DICE_ROLL':
                    this.handleRemoteDiceRoll(action.payload);
                    break;
                case 'TOKEN_SELECT':
                    this.handleRemoteTokenSelect(action.payload);
                    break;
                case 'TOKEN_MOVE':
                    eventBus.emit('online:tokenMove', action.payload);
                    break;
                case 'CHAT_MESSAGE':
                    eventBus.emit('online:chatMessage', action.payload);
                    break;
                case 'PLAYER_EMOTE':
                    eventBus.emit('online:playerEmote', action.payload);
                    break;
                case 'TURN_END':
                    this.handleRemoteTurnEnd(action.payload);
                    break;
                case 'TURN_SYNC':
                    this.handleRemoteTurnSync(action.payload);
                    break;
                case 'PROFILE_SYNC':
                    this.handleRemoteProfileSync(action.payload);
                    break;
            }

            this.applyingRemote = false;
        }

        handleRemoteDiceRoll(payload) {
            const { value, playerIndex, consecutiveSixes } = payload;
            console.log('Remote dice roll:', value, 'by player', playerIndex, 'current:', gameState.currentPlayerIndex);

            // Sync the player index if it doesn't match (handles desync)
            if (gameState.currentPlayerIndex !== playerIndex) {
                console.warn('Player index desync! Syncing to', playerIndex);
                gameState.currentPlayerIndex = playerIndex;
            }

            // Update game state with the dice value
            gameState.diceValue = value;
            gameState.consecutiveSixes = consecutiveSixes || 0;
            gameState.turnPhase = TURN_PHASE.ROLLING;

            // Emit dice rolled event for UI to show the result
            eventBus.emit(GameEvents.DICE_ROLLED, { value });

            // Check for forfeited turn (three 6s)
            if (gameState.isTurnForfeited()) {
                eventBus.emit(GameEvents.SHOW_MESSAGE, {
                    message: 'Three 6s! Turn forfeited!',
                    type: 'warning'
                });
                // The remote client will handle ending the turn
                return;
            }

            // Calculate valid moves for display
            const validMoves = Rules.getValidMoves(
                gameState.getCurrentPlayer(),
                value,
                gameState.players
            );
            gameState.setValidMoves(validMoves);

            if (validMoves.length === 0) {
                eventBus.emit(GameEvents.SHOW_MESSAGE, {
                    message: 'No valid moves!',
                    type: 'info'
                });
                // Remote will handle ending turn
            } else {
                gameState.turnPhase = TURN_PHASE.SELECTING;
            }
        }

        handleRemoteTokenSelect(payload) {
            const { tokenId, playerIndex, moveData } = payload;
            console.log('Remote token select:', tokenId, 'by player', playerIndex, 'moveData:', moveData);

            // Sync the player index if it doesn't match (handles desync)
            if (gameState.currentPlayerIndex !== playerIndex) {
                console.warn('Player index desync on token select! Syncing to', playerIndex);
                gameState.currentPlayerIndex = playerIndex;
            }

            // Get the current player and find the token
            const currentPlayer = gameState.getCurrentPlayer();
            if (!currentPlayer) {
                console.error('No current player found');
                return;
            }

            const token = currentPlayer.tokens.find(t => t.id === tokenId);
            if (!token) {
                console.error('Could not find token:', tokenId);
                return;
            }

            // Reconstruct the move from moveData (sent with broadcast) or fallback to validMoves
            let move;
            if (moveData) {
                // Use the move data sent by the remote player
                move = {
                    tokenId: moveData.tokenId,
                    token: token,
                    fromPosition: moveData.fromPosition,
                    toPosition: moveData.toPosition,
                    fromTrackIndex: moveData.fromTrackIndex,
                    toTrackIndex: moveData.toTrackIndex,
                    fromHomePathIndex: moveData.fromHomePathIndex,
                    toHomePathIndex: moveData.toHomePathIndex,
                    type: moveData.type,
                    diceValue: moveData.diceValue,
                    path: moveData.path
                };

                // Reconstruct capture token if any
                if (moveData.captureTokenId) {
                    for (const player of gameState.players) {
                        if (player.index === currentPlayer.index) continue;
                        const captureToken = player.tokens.find(t => t.id === moveData.captureTokenId);
                        if (captureToken) {
                            move.capture = captureToken;
                            break;
                        }
                    }
                }
            } else {
                // Fallback: try to find the move in validMoves
                move = gameState.validMoves.find(m => m.tokenId === tokenId);
                if (!move) {
                    console.warn('Could not find valid move for token:', tokenId);
                    return;
                }
            }

            console.log('Executing remote move:', move);

            // Execute the move locally
            gameState.turnPhase = TURN_PHASE.MOVING;
            gameState.selectToken(move.tokenId);

            eventBus.emit(GameEvents.TOKEN_MOVE_START, { move });

            const result = Rules.executeMove(move);

            eventBus.emit(GameEvents.TOKEN_MOVE, { move, result });

            if (result.captured) {
                eventBus.emit(GameEvents.TOKEN_CAPTURE, {
                    capturer: move.token,
                    captured: result.captured
                });
                eventBus.emit(GameEvents.EFFECT_SHAKE, { intensity: 10 });
            }

            if (result.finished) {
                eventBus.emit(GameEvents.TOKEN_FINISH, {
                    token: move.token,
                    player: gameState.getCurrentPlayer()
                });
            }

            // Check for win
            if (Rules.hasWon(gameState.getCurrentPlayer())) {
                gameState.setWinner(gameState.getCurrentPlayer());
                eventBus.emit(GameEvents.EFFECT_VICTORY, {
                    winner: gameState.getCurrentPlayer()
                });
                return;
            }

            eventBus.emit(GameEvents.TOKEN_MOVE_COMPLETE, { move, result });

            // Handle extra turn or end turn
            if (result.extraTurn || gameState.canRollAgain()) {
                gameState.turnPhase = TURN_PHASE.WAITING;
                gameState.selectToken(null);
                gameState.setValidMoves([]);
            }
            // Note: endTurn will be called by the active player's client
        }

        handleRemoteTurnEnd(payload) {
            const { nextPlayerIndex } = payload;
            console.log('Remote turn end, next player:', nextPlayerIndex);

            // Explicitly set the player index to stay in sync (don't use nextTurn which increments)
            gameState.currentPlayerIndex = nextPlayerIndex;
            gameState.turnPhase = TURN_PHASE.WAITING;
            gameState.selectToken(null);
            gameState.setValidMoves([]);
            Dice.reset();

            // Emit turn end event
            eventBus.emit(GameEvents.TURN_END, {
                playerIndex: nextPlayerIndex
            });

            // Start the new turn
            setTimeout(async () => {
                await TurnManager.startTurn();
            }, ANIMATION_DURATIONS.TURN_DELAY);
        }

        handleRemoteTurnSync(payload) {
            const { currentPlayerIndex, turnPhase } = payload;
            console.log('Turn sync received - player:', currentPlayerIndex, 'phase:', turnPhase);

            // Force sync the game state
            gameState.currentPlayerIndex = currentPlayerIndex;
            gameState.turnPhase = turnPhase || TURN_PHASE.WAITING;

            // Update UI to show correct active player
            eventBus.emit(GameEvents.TURN_START, {
                player: gameState.players[currentPlayerIndex]
            });
        }

        handleRemoteProfileSync(payload) {
            const { playerSlot, profileData, playerName } = payload;
            console.log('Received profile sync for player', playerSlot);

            // Update the game avatar for this player
            const gameAvatar = document.querySelector(`.player-info[data-player="${playerSlot}"] .profile-pic`);
            if (gameAvatar && profileData) {
                gameAvatar.src = profileData;
                gameAvatar.classList.add('loaded');
                gameAvatar.style.display = 'block';
            }

            // Also update lobby avatar if in lobby
            const lobbySlot = document.querySelector(`.player-slot[data-slot="${playerSlot}"] .slot-avatar`);
            if (lobbySlot && profileData) {
                // Create or update an img element in the lobby slot
                let lobbyImg = lobbySlot.querySelector('.lobby-profile-img');
                if (!lobbyImg) {
                    lobbyImg = document.createElement('img');
                    lobbyImg.className = 'lobby-profile-img';
                    lobbyImg.style.cssText = 'width: 100%; height: 100%; border-radius: 50%; object-fit: cover; position: absolute; top: 0; left: 0;';
                    lobbySlot.style.position = 'relative';
                    lobbySlot.appendChild(lobbyImg);
                }
                lobbyImg.src = profileData;
            }
        }

        broadcastProfile() {
            // Get local player's profile from localStorage
            try {
                const profiles = JSON.parse(localStorage.getItem('spaceLudoProfiles') || '{}');
                const myProfile = profiles[this.playerSlot];

                if (myProfile) {
                    this.broadcastAction('PROFILE_SYNC', {
                        playerSlot: this.playerSlot,
                        profileData: myProfile,
                        playerName: this.playerName
                    });
                }
            } catch (e) {
                console.error('Failed to broadcast profile:', e);
            }
        }

        async broadcastAction(actionType, payload) {
            if (!this.supabase || !this.roomId) {
                console.warn('Cannot broadcast - not connected:', { supabase: !!this.supabase, roomId: this.roomId });
                return;
            }
            if (this.applyingRemote) {
                console.log('Skipping broadcast - applying remote action');
                return;
            }

            console.log('Broadcasting action:', actionType, payload);

            try {
                const { error } = await this.supabase
                    .from('game_actions')
                    .insert({
                        room_id: this.roomId,
                        player_slot: this.playerSlot,
                        action_type: actionType,
                        payload: payload
                    });

                if (error) {
                    console.error('Supabase insert error:', error);
                } else {
                    console.log('Broadcast successful:', actionType);
                }
            } catch (error) {
                console.error('Failed to broadcast action:', error);
            }
        }

        async updateGameState(state) {
            if (!this.supabase || !this.roomId) return;

            try {
                await this.supabase
                    .from('rooms')
                    .update({ game_state: state })
                    .eq('id', this.roomId);
            } catch (error) {
                console.error('Failed to update game state:', error);
            }
        }

        async startGame() {
            if (!this.isHost || !this.supabase) return false;

            try {
                const { error } = await this.supabase
                    .from('rooms')
                    .update({ status: 'playing' })
                    .eq('id', this.roomId);

                if (error) throw error;

                return true;
            } catch (error) {
                console.error('Failed to start game:', error);
                return false;
            }
        }

        async leaveRoom() {
            if (!this.supabase || !this.roomId) return;

            try {
                // Remove player from room
                await this.supabase
                    .from('players')
                    .delete()
                    .eq('room_id', this.roomId)
                    .eq('slot', this.playerSlot);

                // If host, delete the room
                if (this.isHost) {
                    await this.supabase
                        .from('rooms')
                        .delete()
                        .eq('id', this.roomId);
                }

                // Cleanup subscriptions
                this.cleanup();

            } catch (error) {
                console.error('Failed to leave room:', error);
            }
        }

        async getPlayersInRoom() {
            if (!this.supabase || !this.roomId) return [];

            try {
                const { data, error } = await this.supabase
                    .from('players')
                    .select('id, room_id, name, color, slot, is_host, is_connected, last_seen, created_at')
                    .eq('room_id', this.roomId)
                    .order('slot');

                if (error) {
                    console.error('DEBUG: getPlayersInRoom - Supabase error:', error);
                    throw error;
                }
                console.log('DEBUG: getPlayersInRoom - Raw data from Supabase:', data);
                if (data && data.length > 0) {
                    console.log('DEBUG: First player sample:', JSON.stringify(data[0], null, 2));
                    console.log('DEBUG: First player name field:', data[0].name);
                    console.log('DEBUG: First player name type:', typeof data[0].name);
                    console.log('DEBUG: All columns:', Object.keys(data[0]));
                }
                return data || [];
            } catch (error) {
                console.error('Failed to get players:', error);
                console.error('Error details:', error.message, error.details, error.hint);
                return [];
            }
        }

        isLocalPlayerTurn() {
            if (!this.isOnline) return true;
            const currentPlayer = gameState.getCurrentPlayer();
            return currentPlayer && gameState.currentPlayerIndex === this.playerSlot;
        }

        // Check if local client should handle the current turn (own turn OR AI turn if host)
        shouldHandleCurrentTurn() {
            if (!this.isOnline) return true;
            const currentPlayer = gameState.getCurrentPlayer();
            if (!currentPlayer) return false;

            // It's our own turn
            if (gameState.currentPlayerIndex === this.playerSlot) return true;

            // It's an AI's turn and we're the host
            if (currentPlayer.isAI && this.isHost) return true;

            return false;
        }

        startHeartbeat() {
            this.heartbeatInterval = setInterval(async () => {
                if (this.supabase && this.roomId) {
                    try {
                        await this.supabase
                            .from('players')
                            .update({ last_seen: new Date().toISOString() })
                            .eq('room_id', this.roomId)
                            .eq('slot', this.playerSlot);
                    } catch (error) {
                        console.error('Heartbeat failed:', error);
                    }
                }
            }, 5000);
        }

        updateConnectionStatus(status) {
            const indicator = document.getElementById('connection-status');
            if (!indicator) return;

            indicator.classList.remove('hidden', 'connecting', 'disconnected');

            switch (status) {
                case 'connected':
                    indicator.querySelector('.status-text').textContent = 'Connected';
                    break;
                case 'connecting':
                    indicator.classList.add('connecting');
                    indicator.querySelector('.status-text').textContent = 'Connecting...';
                    break;
                case 'disconnected':
                    indicator.classList.add('disconnected');
                    indicator.querySelector('.status-text').textContent = 'Disconnected';
                    break;
            }
        }

        showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'online-toast';
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }

        cleanup() {
            this.isOnline = false;
            this.roomId = null;
            this.roomCode = null;
            this.isHost = false;

            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
                this.heartbeatInterval = null;
            }

            if (this.playersSubscription) {
                this.playersSubscription.unsubscribe();
                this.playersSubscription = null;
            }

            if (this.roomSubscription) {
                this.roomSubscription.unsubscribe();
                this.roomSubscription = null;
            }

            if (this.actionsSubscription) {
                this.actionsSubscription.unsubscribe();
                this.actionsSubscription = null;
            }

            const indicator = document.getElementById('connection-status');
            if (indicator) indicator.classList.add('hidden');
        }
    }

    // Create singleton instance
    const networkManager = new NetworkManager();

    // ============================================
    // ONLINE LOBBY CONTROLLER
    // ============================================

    class OnlineLobbyController {
        constructor(uiRenderer, menuController) {
            this.uiRenderer = uiRenderer;
            this.menuController = menuController;
            this.refreshInterval = null;
            this.setupEventListeners();
        }

        setupEventListeners() {
            // Play Online button
            document.getElementById('btn-online')?.addEventListener('click', () => {
                this.uiRenderer.showScreen('online-menu');
                // Username now comes automatically from login - no input fields needed
                // Force remove any cached name inputs that shouldn't exist
                const unwantedInputs = document.querySelectorAll('#online-player-name, #join-player-name, .create-option input[placeholder="Your Name"], .join-option input[placeholder="Your Name"]');
                unwantedInputs.forEach(input => input.remove());
            });

            // Back button from online menu
            document.getElementById('btn-back-online')?.addEventListener('click', () => {
                this.uiRenderer.showScreen('menu');
            });

            // Create Room button
            document.getElementById('btn-create-room')?.addEventListener('click', async () => {
                // Automatically use login username - no need to enter name again
                const playerName = window.loginManager?.getUsername() || localStorage.getItem('spaceludo_username') || 'Player';

                if (!playerName || playerName === 'Player') {
                    networkManager.showToast('Please login first to create a game');
                    return;
                }

                const btn = document.getElementById('btn-create-room');
                btn.disabled = true;
                btn.textContent = 'Creating...';

                const roomCode = await networkManager.createRoom(playerName);

                btn.disabled = false;
                btn.innerHTML = '<span class="btn-icon">&#128640;</span> Create Room';

                if (roomCode) {
                    this.showLobby(roomCode);
                }
            });

            // Join Room button
            document.getElementById('btn-join-room')?.addEventListener('click', async () => {
                const codeInput = document.getElementById('room-code-input');
                const roomCode = codeInput?.value.trim();

                // Automatically use login username - no need to enter name again
                const playerName = window.loginManager?.getUsername() || localStorage.getItem('spaceludo_username') || '';

                if (!roomCode || roomCode.length < 6) {
                    networkManager.showToast('Please enter a valid room code');
                    return;
                }

                if (!playerName || playerName.length === 0) {
                    networkManager.showToast('Please login first to join a game');
                    return;
                }

                console.log('Joining with login name:', playerName);

                const btn = document.getElementById('btn-join-room');
                btn.disabled = true;
                btn.textContent = 'Joining...';

                const result = await networkManager.joinRoom(roomCode, playerName);

                btn.disabled = false;
                btn.innerHTML = '<span class="btn-icon">&#127922;</span> Join Room';

                if (result) {
                    this.showLobby(result.roomCode);
                }
            });

            // Copy Room Code
            document.getElementById('btn-copy-code')?.addEventListener('click', () => {
                const code = document.getElementById('room-code-display')?.textContent;
                if (code) {
                    navigator.clipboard.writeText(code).then(() => {
                        const btn = document.getElementById('btn-copy-code');
                        btn.classList.add('copied');
                        btn.textContent = '✓';
                        setTimeout(() => {
                            btn.classList.remove('copied');
                            btn.innerHTML = '&#128203;';
                        }, 2000);
                    });
                }
            });

            // Leave Room button
            document.getElementById('btn-leave-room')?.addEventListener('click', async () => {
                await networkManager.leaveRoom();
                this.hideLobby();
                this.uiRenderer.showScreen('online-menu');
            });

            // Start Game button (host only)
            document.getElementById('btn-start-online')?.addEventListener('click', async () => {
                if (!networkManager.isHost) return;

                const players = await networkManager.getPlayersInRoom();
                if (players.length < 2) {
                    networkManager.showToast('Need at least 2 players to start');
                    return;
                }

                const started = await networkManager.startGame();
                if (started) {
                    this.startOnlineGame(players);
                }
            });

            // Listen for online events
            eventBus.on('online:playerChange', () => this.refreshLobby());
            eventBus.on('online:gameStart', (data) => this.handleGameStart(data));
        }

        showLobby(roomCode) {
            document.getElementById('room-code-display').textContent = roomCode;
            this.uiRenderer.showScreen('room-lobby');

            // Update start button visibility
            const startBtn = document.getElementById('btn-start-online');
            if (startBtn) {
                startBtn.style.display = networkManager.isHost ? 'flex' : 'none';
            }

            // Refresh lobby immediately and again after a short delay
            this.refreshLobby();
            setTimeout(() => this.refreshLobby(), 500);
            setTimeout(() => this.refreshLobby(), 1500);
            this.startRefreshInterval();

            // Broadcast our profile picture to other players in lobby
            setTimeout(() => {
                if (networkManager && networkManager.isOnline) {
                    networkManager.broadcastProfile();
                }
            }, 1000);
        }

        hideLobby() {
            this.stopRefreshInterval();
        }

        async refreshLobby() {
            const players = await networkManager.getPlayersInRoom();
            console.log('DEBUG: refreshLobby - Players received:', players);
            this.updateLobbyUI(players);
        }

        updateLobbyUI(players) {
            console.log('DEBUG: updateLobbyUI - Updating UI with players:', players);
            const slots = document.querySelectorAll('.player-slot');
            const playerCount = document.getElementById('player-count');
            const startBtn = document.getElementById('btn-start-online');

            // Reset all slots
            slots.forEach((slot, index) => {
                const nameEl = slot.querySelector('.slot-name');
                const statusEl = slot.querySelector('.slot-status');
                const hostBadge = slot.querySelector('.host-badge');
                const avatarNumber = slot.querySelector('.slot-number');

                slot.classList.remove('occupied', 'is-you');
                nameEl.textContent = 'Waiting...';
                statusEl.textContent = 'Empty';
                hostBadge.classList.add('hidden');
                // Reset avatar to slot number
                if (avatarNumber) {
                    avatarNumber.textContent = (index + 1).toString();
                }
            });

            // Fill in players
            players.forEach(player => {
                console.log('DEBUG: Processing player for slot', player.slot, ':', player);
                console.log('DEBUG: Player name:', player.name);
                console.log('DEBUG: Player object keys:', Object.keys(player));
                const slot = document.querySelector(`.player-slot[data-slot="${player.slot}"]`);
                if (slot) {
                    const nameEl = slot.querySelector('.slot-name');
                    const statusEl = slot.querySelector('.slot-status');
                    const hostBadge = slot.querySelector('.host-badge');
                    const avatarNumber = slot.querySelector('.slot-number');

                    slot.classList.add('occupied');

                    // Get player name - handle both snake_case and camelCase, and check all possible fields
                    let playerName = player.name || player.playerName || player.player_name ||
                                   (player.slot === 0 ? 'Host' : `Player ${player.slot + 1}`);

                    // Extra validation - if name is somehow an empty string, use default
                    if (!playerName || playerName.trim() === '') {
                        playerName = player.slot === 0 ? 'Host' : `Player ${player.slot + 1}`;
                    }

                    console.log('DEBUG: Final playerName being displayed:', playerName);
                    nameEl.textContent = playerName;
                    statusEl.textContent = 'Ready';

                    // Show player's initial letter in the avatar
                    if (avatarNumber && playerName) {
                        avatarNumber.textContent = playerName.charAt(0).toUpperCase();
                    }

                    // Handle both snake_case and camelCase for is_host
                    if (player.is_host || player.isHost) {
                        hostBadge.classList.remove('hidden');
                    }

                    if (player.slot === networkManager.playerSlot) {
                        slot.classList.add('is-you');
                        statusEl.textContent = 'You';
                    }
                }
            });

            // Update player count
            if (playerCount) {
                playerCount.textContent = players.length;
            }

            // Update start button state
            if (startBtn && networkManager.isHost) {
                startBtn.disabled = players.length < 2;
            }
        }

        startRefreshInterval() {
            this.refreshInterval = setInterval(() => this.refreshLobby(), 3000);
        }

        stopRefreshInterval() {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
        }

        async handleGameStart(roomData) {
            const players = await networkManager.getPlayersInRoom();
            this.startOnlineGame(players);
        }

        startOnlineGame(players) {
            this.stopRefreshInterval();

            // Initialize game state for online play
            gameState.reset();
            gameState.phase = GAME_PHASE.PLAYING;
            gameState.isOnlineGame = true;

            // Setup players from lobby
            const sortedPlayers = players.sort((a, b) => a.slot - b.slot);

            gameState.players = [];
            for (let i = 0; i < 4; i++) {
                const lobbyPlayer = sortedPlayers.find(p => p.slot === i);
                const playerColor = PLAYER_ORDER[i];

                // Player constructor expects (index, config)
                const player = new Player(i, {
                    name: lobbyPlayer ? lobbyPlayer.name : `${playerColor} (AI)`,
                    isAI: !lobbyPlayer
                });

                gameState.players.push(player);
            }

            // Show game screen
            this.uiRenderer.showScreen('game');

            // Load and apply local player's profile to game UI
            this.applyLocalProfileToGame();

            // Re-render board and tokens
            eventBus.emit('online:gameReady', { players: gameState.players });

            // Start the game - use startTurn instead of startGame
            setTimeout(() => {
                eventBus.emit(GameEvents.GAME_START, {
                    players: gameState.players,
                    mode: 'online'
                });

                // Host broadcasts initial turn state to sync all clients
                if (networkManager && networkManager.isOnline && networkManager.isHost) {
                    networkManager.broadcastAction('TURN_SYNC', {
                        currentPlayerIndex: 0,
                        turnPhase: TURN_PHASE.WAITING
                    });
                }

                TurnManager.startTurn();

                // Broadcast our profile to other players after game starts
                if (networkManager && networkManager.isOnline) {
                    networkManager.broadcastProfile();
                }
            }, 500);
        }

        applyLocalProfileToGame() {
            // Apply the local player's saved profile picture to the game UI
            try {
                const profiles = JSON.parse(localStorage.getItem('spaceLudoProfiles') || '{}');
                const mySlot = networkManager ? networkManager.playerSlot : 0;
                const myProfile = profiles[mySlot];

                if (myProfile) {
                    const gameAvatar = document.querySelector(`.player-info[data-player="${mySlot}"] .profile-pic`);
                    if (gameAvatar) {
                        gameAvatar.src = myProfile;
                        gameAvatar.classList.add('loaded');
                        gameAvatar.style.display = 'block';
                    }
                }
            } catch (e) {
                console.error('Failed to apply local profile:', e);
            }
        }
    }

    // ============================================
    // DEBUG LOGGER (COMPLETELY DISABLED - NO-OP STUB)
    // ============================================

    class DebugLogger {
        constructor() {
            // Aggressively remove any debug panel elements
            this.removeDebugElements();
            // Set all properties to null
            this.panel = null;
            this.content = null;
            this.openBtn = null;
            this.logs = [];
            this.maxLogs = 0;
        }

        removeDebugElements() {
            // Remove debug panel and all related elements
            const elementsToRemove = [
                'debug-panel',
                'debug-open',
                'debug-close',
                'debug-toggle',
                'debug-clear'
            ];
            elementsToRemove.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });
            // Also remove by class name
            document.querySelectorAll('.debug-panel, .debug-open').forEach(el => el.remove());
        }

        setupControls() {
            // No-op
        }

        setupDraggable() {
            // No-op
        }

        setupToolButtons() {
            // No-op
        }

        startStatusUpdater() {
            // No-op
        }

        updateStatus() {
            // No-op
        }

        logGameState() {
            // No-op
        }

        logTokens() {
            // No-op
        }

        logPlayers() {
            // No-op
        }

        interceptConsole() {
            // No-op
        }

        setupEventListeners() {
            // No-op
        }

        parseAndLog() {
            // No-op
        }

        log() {
            // No-op
        }

        renderLog() {
            // No-op
        }

        escapeHtml(text) {
            return '';
        }

        clear() {
            // No-op
        }

        toggleMinimize() {
            // No-op
        }

        hide() {
            // No-op
        }

        show() {
            // No-op
        }
    }

    // REMOVED OLD DEBUG LOGGER METHODS BELOW (lines 4865-5270)
    // ============================================
    // INITIALIZATION
    // ============================================

    function init() {
        console.log('Initializing Space Ludo...');

        // Initialize debug logger first
        const debugLogger = new DebugLogger();

        // Initialize renderers
        const boardRenderer = new BoardRenderer('ludo-board');
        boardRenderer.render();

        const tokenRenderer = new TokenRenderer(boardRenderer);
        const diceRenderer = new DiceRenderer();
        const uiRenderer = new UIRenderer();

        // Initialize effects
        const particleSystem = new ParticleSystem('particle-canvas');
        const screenEffects = new ScreenEffects();
        const emojiEffects = new EmojiEffects();

        // Initialize sound
        const soundManager = new SoundManager();
        window.soundManager = soundManager; // Make accessible for volume control

        // Initialize XP system
        const xpManager = new XPManager();

        // Initialize login system
        const loginManager = new LoginManager();

        // Initialize chat system
        const chatSystem = new ChatSystem();

        // Initialize menu controller (pass tokenRenderer for resume)
        const menuController = new MenuController(uiRenderer, tokenRenderer);

        // Initialize online lobby controller
        const onlineLobbyController = new OnlineLobbyController(uiRenderer, menuController);

        // Load saved profile images on startup
        menuController.loadSavedProfileImages();

        // Initialize audio on first interaction
        const initAudio = () => {
            soundManager.init();
            document.removeEventListener('click', initAudio);
        };
        document.addEventListener('click', initAudio);

        // Expose for access
        window.loginManager = loginManager;
        window.SpaceLudo = {
            gameState,
            eventBus,
            TurnManager,
            AIController,
            chatSystem,
            networkManager,
            onlineLobbyController,
            tokenRenderer,
            xpManager,
            loginManager
        };

        console.log('Space Ludo initialized!');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
