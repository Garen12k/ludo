/**
 * Space Ludo - Bundled Game (No Server Required)
 * All game code in one file for local file:// access
 */

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

    // Safe zone positions (star spots - cannot be captured here)
    const SAFE_ZONES = [
        { row: 6, col: 2 },   // Red side - row 6
        { row: 2, col: 6 },   // Top side - col 6
        { row: 2, col: 8 },   // Top side - col 8 (Green entry)
        { row: 6, col: 12 },  // Right side - row 6
        { row: 8, col: 12 },  // Right side - row 8 (Yellow entry)
        { row: 12, col: 8 },  // Bottom side - col 8
        { row: 12, col: 6 },  // Bottom side - col 6 (Blue entry)
        { row: 8, col: 2 }    // Left side - row 8
    ];

    function isSafeZone(row, col) {
        return SAFE_ZONES.some(sz => sz.row === row && sz.col === col);
    }

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
        EFFECT_VICTORY: 'effect:victory'
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

            // Calculate steps to home entry
            let stepsToHomeEntry;
            if (token.trackIndex <= homeEntryPoint) {
                stepsToHomeEntry = homeEntryPoint - token.trackIndex;
            } else {
                stepsToHomeEntry = (TRACK_LENGTH - token.trackIndex) + homeEntryPoint;
            }

            // Check if we should enter home path
            if (steps > stepsToHomeEntry && stepsToHomeEntry >= 0) {
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
                // Staying on track
                while (currentIndex !== endTrackIndex && loopGuard < TRACK_LENGTH + 10) {
                    currentIndex = (currentIndex + 1) % TRACK_LENGTH;
                    if (MAIN_TRACK[currentIndex]) path.push(MAIN_TRACK[currentIndex]);
                    loopGuard++;
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

        async waitWhilePaused() {
            while (gameState.isPaused) {
                await this.delay(100);
            }
        },

        async startTurn() {
            await this.waitWhilePaused();

            const player = gameState.getCurrentPlayer();
            gameState.turnPhase = TURN_PHASE.WAITING;

            eventBus.emit(GameEvents.TURN_START, { player });

            await this.delay(ANIMATION_DURATIONS.TURN_DELAY);

            await this.waitWhilePaused();

            // Only handle AI if we're supposed to (non-online OR host in online)
            if (player.isAI && (!gameState.isOnlineGame || (networkManager.isOnline && networkManager.isHost))) {
                await this.handleAITurn();
            }
        },

        async rollDice() {
            await this.waitWhilePaused();
            if (gameState.turnPhase !== TURN_PHASE.WAITING) return null;

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

            if (gameState.getCurrentPlayer().isAI) {
                const move = await AIController.selectMove(validMoves, gameState);
                await this.executeMove(move);
            }

            return value;
        },

        async selectToken(tokenId) {
            if (gameState.turnPhase !== TURN_PHASE.SELECTING) return;

            // In online mode, only local player can select tokens on their turn
            if (gameState.isOnlineGame && networkManager.isOnline && !networkManager.isLocalPlayerTurn()) {
                return;
            }

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

                if (gameState.getCurrentPlayer().isAI) {
                    await this.delay(ANIMATION_DURATIONS.AI_THINK);
                    await this.rollDice();
                }
            } else {
                this.endTurn();
            }
        },

        async endTurn() {
            await this.waitWhilePaused();

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
            await this.waitWhilePaused();
            await this.delay(ANIMATION_DURATIONS.AI_THINK);
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
                if (gameState.turnPhase === TURN_PHASE.WAITING && !gameState.getCurrentPlayer().isAI) {
                    TurnManager.rollDice();
                }
            });

            // Spacebar to roll
            document.addEventListener('keydown', (e) => {
                if (e.code === 'Space' && gameState.turnPhase === TURN_PHASE.WAITING && !gameState.getCurrentPlayer().isAI) {
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
            const rotations = {
                1: { x: 0, y: 0 },
                2: { x: -90, y: 0 },
                3: { x: 0, y: 90 },
                4: { x: 0, y: -90 },
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
            this.mainMenu.classList.remove('active');
            this.setupScreen.classList.remove('active');
            this.gameScreen.classList.remove('active');
            if (this.onlineMenu) this.onlineMenu.classList.remove('active');
            if (this.roomLobby) this.roomLobby.classList.remove('active');

            switch (screenId) {
                case 'menu':
                    this.mainMenu.classList.add('active');
                    break;
                case 'setup':
                    this.setupScreen.classList.add('active');
                    break;
                case 'game':
                    this.gameScreen.classList.add('active');
                    break;
                case 'online-menu':
                    if (this.onlineMenu) this.onlineMenu.classList.add('active');
                    break;
                case 'room-lobby':
                    if (this.roomLobby) this.roomLobby.classList.add('active');
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
            eventBus.on(GameEvents.TOKEN_CAPTURE, (data) => {
                this.captureEffect(data.captured);
            });

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
            // Token capture - explosion of emojis
            eventBus.on(GameEvents.TOKEN_CAPTURE, (data) => {
                this.showEmojiBurst(['💥', '💢', '⚡', '🔥', '😈'], 'center', 12);
            });

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

                        // Show the emote
                        this.showPlayerEmote(emoji);

                        // Play a sound if enabled
                        if (gameState.soundEnabled) {
                            this.playEmoteSound();
                        }
                    });
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
    // AUTO-PLAY TIMER
    // ============================================

    class AutoPlayTimer {
        constructor() {
            this.timerElement = document.getElementById('auto-play-timer');
            this.timerText = document.getElementById('timer-text');
            this.timerProgress = document.getElementById('timer-progress');
            this.cancelButton = document.getElementById('cancel-auto-play');

            this.countdown = 10;
            this.maxTime = 10;
            this.intervalId = null;
            this.isActive = false;
            this.isCancelled = false;

            this.setupEventListeners();
        }

        setupEventListeners() {
            // Cancel button click
            if (this.cancelButton) {
                this.cancelButton.addEventListener('click', () => {
                    this.cancel();
                });
            }

            // Start timer when it's human player's turn and they need to act
            eventBus.on(GameEvents.TURN_START, (data) => {
                console.log('Turn start:', data.player.color, 'isAI:', data.player.isAI, 'phase:', gameState.phase);
                // Reset cancelled state for new turn
                this.isCancelled = false;
                this.stop(); // Stop any existing timer
                if (!data.player.isAI && gameState.phase === GAME_PHASE.PLAYING) {
                    // Small delay to ensure UI is ready
                    setTimeout(() => this.start(), 300);
                }
            });

            // Stop timer when dice is rolled, but prepare for token selection
            eventBus.on(GameEvents.DICE_ROLLED, () => {
                this.stop();
                // Don't reset isCancelled here - only on new turn
            });

            // Start timer when player needs to select a token (multiple valid moves)
            eventBus.on(GameEvents.VALID_MOVES_UPDATE, (data) => {
                const player = gameState.getCurrentPlayer();
                if (data.moves && data.moves.length > 0 && player && !player.isAI && !this.isCancelled) {
                    // Small delay to let UI update
                    setTimeout(() => {
                        if (gameState.turnPhase === TURN_PHASE.SELECTING && !this.isActive) {
                            this.start();
                        }
                    }, 300);
                }
            });

            // Stop timer when move is made, then check for extra turn
            eventBus.on(GameEvents.TOKEN_MOVE_COMPLETE, () => {
                this.stop();
                // Check if player gets extra turn (rolled 6)
                const player = gameState.getCurrentPlayer();
                console.log('TOKEN_MOVE_COMPLETE - player:', player?.color, 'isAI:', player?.isAI, 'turnPhase:', gameState.turnPhase, 'canRollAgain:', gameState.canRollAgain());
                if (player && !player.isAI && gameState.phase === GAME_PHASE.PLAYING) {
                    // Reset cancelled for extra turn opportunity
                    this.isCancelled = false;
                    // Delay to let turnPhase update properly
                    setTimeout(() => {
                        console.log('Checking auto-play restart - turnPhase:', gameState.turnPhase, 'canRollAgain:', gameState.canRollAgain());
                        if (gameState.turnPhase === TURN_PHASE.WAITING) {
                            this.start();
                        }
                    }, 600);
                }
            });

            // Stop timer when move starts
            eventBus.on(GameEvents.TOKEN_MOVE_START, () => {
                this.stop();
            });

            // Stop timer on game end
            eventBus.on(GameEvents.PLAYER_WIN, () => {
                this.stop();
                this.isCancelled = true; // Prevent restart
            });

            // Stop when going back to menu
            eventBus.on(GameEvents.GAME_END, () => {
                this.stop();
                this.isCancelled = true; // Prevent restart
            });
        }

        start() {
            if (this.isActive || this.isCancelled) return;

            // Re-get elements in case DOM wasn't ready
            if (!this.timerElement) {
                this.timerElement = document.getElementById('auto-play-timer');
                this.timerText = document.getElementById('timer-text');
                this.timerProgress = document.getElementById('timer-progress');
                this.cancelButton = document.getElementById('cancel-auto-play');
            }

            if (!this.timerElement) {
                console.warn('Auto-play timer elements not found');
                return;
            }

            console.log('Starting auto-play timer');
            this.isActive = true;
            this.countdown = this.maxTime;

            this.updateDisplay();
            this.show();

            this.intervalId = setInterval(() => {
                this.countdown--;
                this.updateDisplay();

                if (this.countdown <= 0) {
                    this.triggerAutoPlay();
                }
            }, 1000);
        }

        stop() {
            this.isActive = false;
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            this.hide();
        }

        reset() {
            if (!this.isActive || this.isCancelled) return;
            this.countdown = this.maxTime;
            this.updateDisplay();
        }

        cancel() {
            console.log('Auto-play cancelled - turnPhase:', gameState.turnPhase);
            this.stop();
            this.isCancelled = true;  // Set after stop so it stays cancelled for this turn
            console.log('Auto-play cancelled - timer hidden, isCancelled:', this.isCancelled);

            // Show cancelled message
            const emoji = document.createElement('div');
            emoji.textContent = '✓ Cancelled';
            emoji.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 24px;
                color: #33ff66;
                background: rgba(0,0,0,0.7);
                padding: 10px 20px;
                border-radius: 10px;
                text-shadow: 0 0 20px rgba(51, 255, 102, 0.8);
                animation: fadeOut 1.5s ease-out forwards;
                z-index: 201;
            `;
            document.body.appendChild(emoji);
            setTimeout(() => emoji.remove(), 1500);
        }

        // Reset cancelled state on new turn
        resetCancelState() {
            this.isCancelled = false;
        }

        updateDisplay() {
            if (this.timerText) {
                this.timerText.textContent = this.countdown;
            }

            if (this.timerProgress) {
                // Calculate progress (283 is circumference of circle with r=45)
                const progress = ((this.maxTime - this.countdown) / this.maxTime) * 283;
                this.timerProgress.style.strokeDashoffset = progress;

                // Change color when low
                if (this.countdown <= 3) {
                    this.timerProgress.style.stroke = '#ff3366';
                    this.timerText.style.color = '#ff3366';
                } else {
                    this.timerProgress.style.stroke = '#ffcc00';
                    this.timerText.style.color = '#ffcc00';
                }
            }
        }

        show() {
            if (this.timerElement) {
                this.timerElement.classList.add('active');
                this.timerElement.style.pointerEvents = 'auto';
            }
        }

        hide() {
            if (this.timerElement) {
                this.timerElement.classList.remove('active');
                this.timerElement.style.pointerEvents = 'none';
            }
        }

        async triggerAutoPlay() {
            this.stop();

            const player = gameState.getCurrentPlayer();
            if (!player || player.isAI) return;

            // Show auto-play message
            eventBus.emit(GameEvents.SHOW_MESSAGE, {
                message: '🤖 Auto-playing...',
                type: 'info'
            });

            // If waiting for dice roll, roll it
            if (gameState.turnPhase === TURN_PHASE.WAITING) {
                await TurnManager.rollDice();
                // After rolling, check if we need to auto-select a token
                // The VALID_MOVES_UPDATE event will handle restarting the timer
            }
            // If waiting for token selection, let AI choose
            else if (gameState.turnPhase === TURN_PHASE.SELECTING) {
                const validMoves = gameState.validMoves;
                if (validMoves && validMoves.length > 0) {
                    // Use AI to select best move
                    const move = await AIController.selectMove(validMoves, gameState);
                    await TurnManager.executeMove(move);
                    // TOKEN_MOVE_COMPLETE event will handle extra turns
                }
            }
        }
    }

    // ============================================
    // SOUND MANAGER
    // ============================================

    class SoundManager {
        constructor() {
            this.context = null;
            this.enabled = true;
            this.initialized = false;

            this.setupEventListeners();
        }

        setupEventListeners() {
            eventBus.on(GameEvents.TOGGLE_SOUND, (data) => {
                this.enabled = data.enabled;
            });

            eventBus.on(GameEvents.DICE_ROLL_START, () => this.playDiceRoll());
            eventBus.on(GameEvents.TOKEN_MOVE, () => this.playMove());
            eventBus.on(GameEvents.TOKEN_CAPTURE, () => this.playCapture());
            eventBus.on(GameEvents.PLAYER_WIN, () => this.playVictory());
        }

        init() {
            if (this.initialized) return;
            try {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
                this.initialized = true;
            } catch (e) {
                console.warn('Audio not supported');
            }
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

            document.getElementById('btn-menu')?.addEventListener('click', () => {
                gameState.phase = GAME_PHASE.MENU;
                this.uiRenderer.showScreen('menu');
            });

            document.getElementById('btn-restart')?.addEventListener('click', () => {
                this.startGame();
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
                // Sync toggle with current state
                const soundToggle = document.getElementById('sound-toggle');
                if (soundToggle) soundToggle.checked = gameState.soundEnabled;
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

                // In online game, only show the local player's profile
                if (gameState.isOnlineGame && networkManager && networkManager.isOnline) {
                    const mySlot = networkManager.playerSlot;
                    const profileItems = modal.querySelectorAll('.profile-item');

                    profileItems.forEach((item, index) => {
                        const playerIndex = parseInt(item.dataset.player);
                        if (playerIndex === mySlot) {
                            item.style.display = 'block';
                        } else {
                            item.style.display = 'none';
                        }
                    });

                    // Hide reset all button in online mode
                    const resetAllBtn = document.getElementById('btn-reset-all-profiles');
                    if (resetAllBtn) resetAllBtn.style.display = 'none';

                    // Update title
                    const title = modal.querySelector('.profile-title');
                    if (title) title.textContent = 'Your Profile Picture';

                    const subtitle = modal.querySelector('.profile-subtitle');
                    if (subtitle) subtitle.textContent = 'Click to set your picture';
                } else {
                    // Show all players in offline mode
                    const profileItems = modal.querySelectorAll('.profile-item');
                    profileItems.forEach(item => {
                        item.style.display = 'block';
                    });

                    // Show reset all button
                    const resetAllBtn = document.getElementById('btn-reset-all-profiles');
                    if (resetAllBtn) resetAllBtn.style.display = 'block';

                    // Reset title
                    const title = modal.querySelector('.profile-title');
                    if (title) title.textContent = 'Player Pictures';

                    const subtitle = modal.querySelector('.profile-subtitle');
                    if (subtitle) subtitle.textContent = 'Click on a player to set their picture';
                }
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

        startGame() {
            const config = this.uiRenderer.getPlayerConfig();
            config.mode = this.gameMode;

            AIController.setDifficulty(config.aiDifficulty);

            gameState.initGame(config);
            TurnManager.startTurn();
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
                    SUPABASE_CONFIG.anonKey
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
                const { error: playerError } = await this.supabase
                    .from('players')
                    .insert({
                        room_id: this.roomId,
                        name: this.playerName,
                        color: PLAYER_ORDER[0],
                        slot: 0,
                        is_host: true,
                        is_connected: true
                    });

                if (playerError) throw playerError;

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
                const { error: joinError } = await this.supabase
                    .from('players')
                    .insert({
                        room_id: this.roomId,
                        name: this.playerName,
                        color: PLAYER_ORDER[this.playerSlot],
                        slot: this.playerSlot,
                        is_host: false,
                        is_connected: true
                    });

                if (joinError) throw joinError;

                // Subscribe to room updates
                await this.subscribeToRoom();

                this.isOnline = true;
                this.updateConnectionStatus('connected');
                this.startHeartbeat();

                console.log('Joined room:', roomCode);
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
                    .select('*')
                    .eq('room_id', this.roomId)
                    .order('slot');

                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Failed to get players:', error);
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
            });

            // Back button from online menu
            document.getElementById('btn-back-online')?.addEventListener('click', () => {
                this.uiRenderer.showScreen('menu');
            });

            // Create Room button
            document.getElementById('btn-create-room')?.addEventListener('click', async () => {
                const nameInput = document.getElementById('online-player-name');
                const playerName = nameInput?.value.trim() || 'Player';

                if (!playerName) {
                    networkManager.showToast('Please enter your name');
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
                const nameInput = document.getElementById('online-player-name');
                const roomCode = codeInput?.value.trim();
                const playerName = nameInput?.value.trim() || 'Player';

                if (!roomCode || roomCode.length < 6) {
                    networkManager.showToast('Please enter a valid room code');
                    return;
                }

                if (!playerName) {
                    networkManager.showToast('Please enter your name');
                    return;
                }

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

            this.refreshLobby();
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
            this.updateLobbyUI(players);
        }

        updateLobbyUI(players) {
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
                const slot = document.querySelector(`.player-slot[data-slot="${player.slot}"]`);
                if (slot) {
                    const nameEl = slot.querySelector('.slot-name');
                    const statusEl = slot.querySelector('.slot-status');
                    const hostBadge = slot.querySelector('.host-badge');
                    const avatarNumber = slot.querySelector('.slot-number');

                    slot.classList.add('occupied');
                    nameEl.textContent = player.name;
                    statusEl.textContent = 'Ready';

                    // Show player's initial letter in the avatar
                    if (avatarNumber && player.name) {
                        avatarNumber.textContent = player.name.charAt(0).toUpperCase();
                    }

                    if (player.is_host) {
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
    // DEBUG LOGGER
    // ============================================

    class DebugLogger {
        constructor() {
            this.panel = document.getElementById('debug-panel');
            this.content = document.getElementById('debug-content');
            this.openBtn = document.getElementById('debug-open');
            this.toggleBtn = document.getElementById('debug-toggle');
            this.clearBtn = document.getElementById('debug-clear');
            this.closeBtn = document.getElementById('debug-close');

            // New tool buttons
            this.pauseBtn = document.getElementById('debug-pause');
            this.stateBtn = document.getElementById('debug-state');
            this.tokensBtn = document.getElementById('debug-tokens');
            this.playersBtn = document.getElementById('debug-players');
            this.stepBtn = document.getElementById('debug-step');

            // Status elements
            this.phaseEl = document.getElementById('debug-phase');
            this.turnEl = document.getElementById('debug-turn');
            this.diceEl = document.getElementById('debug-dice');
            this.pausedEl = document.getElementById('debug-paused');

            this.maxLogs = 200;
            this.logs = [];
            this.stepMode = false;

            this.setupControls();
            this.setupToolButtons();
            this.setupDraggable();
            this.interceptConsole();
            this.setupEventListeners();
            this.startStatusUpdater();

            this.log('Debug Logger initialized', 'info');
        }

        setupControls() {
            if (this.toggleBtn) {
                this.toggleBtn.addEventListener('click', () => this.toggleMinimize());
            }
            if (this.clearBtn) {
                this.clearBtn.addEventListener('click', () => this.clear());
            }
            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.hide());
            }
            if (this.openBtn) {
                this.openBtn.addEventListener('click', () => this.show());
            }
        }

        setupDraggable() {
            const header = this.panel?.querySelector('.debug-header');
            if (!header || !this.panel) return;

            let isDragging = false;
            let startX, startY, startLeft, startTop;

            header.addEventListener('mousedown', (e) => {
                // Don't drag if clicking on buttons
                if (e.target.closest('.debug-btn') || e.target.closest('.debug-controls')) return;

                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;

                const rect = this.panel.getBoundingClientRect();
                startLeft = rect.left;
                startTop = rect.top;

                // Switch from bottom/right to top/left positioning
                this.panel.style.bottom = 'auto';
                this.panel.style.right = 'auto';
                this.panel.style.left = startLeft + 'px';
                this.panel.style.top = startTop + 'px';

                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;

                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                let newLeft = startLeft + dx;
                let newTop = startTop + dy;

                // Keep within viewport
                const maxX = window.innerWidth - this.panel.offsetWidth;
                const maxY = window.innerHeight - this.panel.offsetHeight;

                newLeft = Math.max(0, Math.min(newLeft, maxX));
                newTop = Math.max(0, Math.min(newTop, maxY));

                this.panel.style.left = newLeft + 'px';
                this.panel.style.top = newTop + 'px';
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });

            // Touch support for mobile
            header.addEventListener('touchstart', (e) => {
                if (e.target.closest('.debug-btn') || e.target.closest('.debug-controls')) return;

                isDragging = true;
                const touch = e.touches[0];
                startX = touch.clientX;
                startY = touch.clientY;

                const rect = this.panel.getBoundingClientRect();
                startLeft = rect.left;
                startTop = rect.top;

                this.panel.style.bottom = 'auto';
                this.panel.style.right = 'auto';
                this.panel.style.left = startLeft + 'px';
                this.panel.style.top = startTop + 'px';
            }, { passive: true });

            document.addEventListener('touchmove', (e) => {
                if (!isDragging) return;

                const touch = e.touches[0];
                const dx = touch.clientX - startX;
                const dy = touch.clientY - startY;

                let newLeft = startLeft + dx;
                let newTop = startTop + dy;

                const maxX = window.innerWidth - this.panel.offsetWidth;
                const maxY = window.innerHeight - this.panel.offsetHeight;

                newLeft = Math.max(0, Math.min(newLeft, maxX));
                newTop = Math.max(0, Math.min(newTop, maxY));

                this.panel.style.left = newLeft + 'px';
                this.panel.style.top = newTop + 'px';
            }, { passive: true });

            document.addEventListener('touchend', () => {
                isDragging = false;
            });
        }

        setupToolButtons() {
            // Pause button
            if (this.pauseBtn) {
                this.pauseBtn.addEventListener('click', () => {
                    if (gameState.isOnlineGame) {
                        this.log('Cannot pause online games', 'warn');
                        return;
                    }
                    const isPaused = gameState.togglePause();
                    this.pauseBtn.textContent = isPaused ? '▶ Resume' : '⏸ Pause';
                    this.pauseBtn.classList.toggle('active', isPaused);
                    this.updateStatus();
                });
            }

            // State button
            if (this.stateBtn) {
                this.stateBtn.addEventListener('click', () => {
                    this.logGameState();
                });
            }

            // Tokens button
            if (this.tokensBtn) {
                this.tokensBtn.addEventListener('click', () => {
                    this.logTokens();
                });
            }

            // Players button
            if (this.playersBtn) {
                this.playersBtn.addEventListener('click', () => {
                    this.logPlayers();
                });
            }

            // Step button (single turn)
            if (this.stepBtn) {
                this.stepBtn.addEventListener('click', () => {
                    if (gameState.isPaused) {
                        this.stepMode = true;
                        gameState.isPaused = false;
                        this.log('Step mode: executing one turn...', 'info');
                        // Will re-pause after turn in event listener
                    } else {
                        this.log('Pause the game first to use Step', 'warn');
                    }
                });
            }
        }

        startStatusUpdater() {
            setInterval(() => this.updateStatus(), 500);
        }

        updateStatus() {
            if (this.phaseEl) {
                this.phaseEl.textContent = `Phase: ${gameState.phase || '--'}`;
            }
            if (this.turnEl) {
                const player = gameState.getCurrentPlayer?.();
                this.turnEl.textContent = `Turn: ${player?.color || '--'} ${player?.isAI ? '(AI)' : ''}`;
            }
            if (this.diceEl) {
                this.diceEl.textContent = `Dice: ${gameState.diceValue || '--'}`;
            }
            if (this.pausedEl) {
                this.pausedEl.textContent = gameState.isPaused ? 'PAUSED' : 'RUNNING';
                this.pausedEl.classList.toggle('paused', gameState.isPaused);
            }
        }

        logGameState() {
            this.log('=== GAME STATE ===', 'info');
            this.log(`Phase: ${gameState.phase}`, 'info');
            this.log(`Turn Phase: ${gameState.turnPhase}`, 'info');
            this.log(`Current Player: ${gameState.currentPlayerIndex}`, 'info');
            this.log(`Dice Value: ${gameState.diceValue}`, 'info');
            this.log(`Consecutive 6s: ${gameState.consecutiveSixes}`, 'info');
            this.log(`Valid Moves: ${gameState.validMoves?.length || 0}`, 'info');
            this.log(`Is Online: ${gameState.isOnlineGame}`, 'info');
            this.log(`Is Paused: ${gameState.isPaused}`, 'info');
            this.log('==================', 'info');
        }

        logTokens() {
            this.log('=== ALL TOKENS ===', 'info');
            gameState.players?.forEach((player, pi) => {
                player.tokens?.forEach((token, ti) => {
                    this.log(
                        `${player.color}[${ti}]: ${token.state} | pos:(${token.position?.row},${token.position?.col}) | track:${token.trackIndex} | home:${token.homePathIndex}`,
                        'move'
                    );
                });
            });
            this.log('==================', 'info');
        }

        logPlayers() {
            this.log('=== PLAYERS ===', 'info');
            gameState.players?.forEach((player, i) => {
                const activeTokens = player.getActiveTokens?.()?.length || 0;
                const finishedTokens = player.finishedTokens || 0;
                this.log(
                    `[${i}] ${player.color} ${player.isAI ? '(AI)' : '(Human)'} | Active: ${activeTokens} | Finished: ${finishedTokens}`,
                    'turn'
                );
            });
            this.log('===============', 'info');
        }

        interceptConsole() {
            const originalLog = console.log;
            const originalWarn = console.warn;
            const originalError = console.error;
            const self = this;

            console.log = function(...args) {
                originalLog.apply(console, args);
                self.parseAndLog(args, 'info');
            };

            console.warn = function(...args) {
                originalWarn.apply(console, args);
                self.parseAndLog(args, 'warn');
            };

            console.error = function(...args) {
                originalError.apply(console, args);
                self.parseAndLog(args, 'error');
            };
        }

        setupEventListeners() {
            const self = this;

            // Listen to game events for better logging
            eventBus.on(GameEvents.TURN_START, (data) => {
                this.log(`Turn Start: ${data.player?.color || 'Unknown'} (AI: ${data.player?.isAI})`, 'turn');
                this.updateStatus();
            });

            eventBus.on(GameEvents.TURN_END, () => {
                // Handle step mode - re-pause after one turn
                if (this.stepMode) {
                    this.stepMode = false;
                    setTimeout(() => {
                        gameState.isPaused = true;
                        this.log('Step complete - paused', 'info');
                        this.updateStatus();
                        if (this.pauseBtn) {
                            this.pauseBtn.textContent = '▶ Resume';
                            this.pauseBtn.classList.add('active');
                        }
                    }, 100);
                }
            });

            eventBus.on(GameEvents.DICE_ROLLED, (data) => {
                this.log(`Dice: ${data.value}`, 'dice');
                this.updateStatus();
            });

            eventBus.on(GameEvents.TOKEN_MOVE_START, (data) => {
                const move = data.move || data;
                this.log(`Token Move: ${move.tokenId || 'unknown'} -> (${move.toPosition?.row ?? '?'},${move.toPosition?.col ?? '?'}) type: ${move.type || '?'}`, 'move');
            });

            eventBus.on(GameEvents.TOKEN_CAPTURE, (data) => {
                this.log(`Capture! ${data.capturedToken?.id} by ${data.capturingToken?.id}`, 'event');
            });

            eventBus.on(GameEvents.TOKEN_FINISH, (data) => {
                this.log(`Token Finished: ${data.token?.id}`, 'event');
            });

            eventBus.on(GameEvents.PLAYER_WIN, (data) => {
                this.log(`WINNER: ${data.player?.color}!`, 'event');
            });

            eventBus.on(GameEvents.GAME_PAUSE, () => {
                this.log('Game PAUSED', 'warn');
                this.updateStatus();
            });

            eventBus.on(GameEvents.GAME_RESUME, () => {
                this.log('Game RESUMED', 'info');
                this.updateStatus();
            });

            eventBus.on(GameEvents.VALID_MOVES_UPDATE, (data) => {
                this.log(`Valid moves: ${data.moves?.length || 0}`, 'info');
            });
        }

        parseAndLog(args, type) {
            const message = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 0).substring(0, 100);
                    } catch {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' ');

            // Categorize by content
            if (message.includes('Turn start') || message.includes('Turn Start')) type = 'turn';
            else if (message.includes('Dice') || message.includes('dice')) type = 'dice';
            else if (message.includes('move') || message.includes('Move')) type = 'move';
            else if (message.includes('network') || message.includes('Network') || message.includes('broadcast')) type = 'network';
            else if (message.includes('Error') || message.includes('error') || message.includes('Invalid')) type = 'error';

            this.log(message, type);
        }

        log(message, type = 'info') {
            const time = new Date().toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                fractionalSecondDigits: 2
            });

            this.logs.push({ time, message, type });

            // Limit logs
            if (this.logs.length > this.maxLogs) {
                this.logs.shift();
            }

            this.renderLog({ time, message, type });
        }

        renderLog(log) {
            if (!this.content) return;

            const div = document.createElement('div');
            div.className = `debug-log ${log.type}`;
            div.innerHTML = `<span class="time">${log.time}</span>${this.escapeHtml(log.message)}`;

            this.content.appendChild(div);

            // Auto scroll to bottom
            this.content.scrollTop = this.content.scrollHeight;

            // Remove old entries from DOM
            while (this.content.children.length > this.maxLogs) {
                this.content.removeChild(this.content.firstChild);
            }
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        clear() {
            this.logs = [];
            if (this.content) {
                this.content.innerHTML = '';
            }
            this.log('Logs cleared', 'info');
        }

        toggleMinimize() {
            if (this.panel) {
                this.panel.classList.toggle('minimized');
                if (this.toggleBtn) {
                    this.toggleBtn.textContent = this.panel.classList.contains('minimized') ? '+' : '_';
                }
            }
        }

        hide() {
            if (this.panel) {
                this.panel.classList.add('hidden');
            }
            if (this.openBtn) {
                this.openBtn.classList.add('visible');
            }
        }

        show() {
            if (this.panel) {
                this.panel.classList.remove('hidden');
            }
            if (this.openBtn) {
                this.openBtn.classList.remove('visible');
            }
        }
    }

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
        const autoPlayTimer = new AutoPlayTimer();

        // Initialize sound
        const soundManager = new SoundManager();

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

        // Expose for debugging
        window.SpaceLudo = {
            gameState,
            eventBus,
            TurnManager,
            AIController,
            chatSystem,
            networkManager,
            onlineLobbyController,
            tokenRenderer,
            debugLogger
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
