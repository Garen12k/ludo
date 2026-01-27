/**
 * Constants - Board positions, paths, colors, and game configuration
 */

// Board dimensions
export const BOARD_SIZE = 15;

// Player colors with their neon variants
export const PLAYER_COLORS = {
    RED: {
        name: 'red',
        primary: '#ff3366',
        light: '#ff6699',
        dark: '#cc2952',
        glow: 'rgba(255, 51, 102, 0.6)'
    },
    GREEN: {
        name: 'green',
        primary: '#33ff66',
        light: '#66ff99',
        dark: '#29cc52',
        glow: 'rgba(51, 255, 102, 0.6)'
    },
    YELLOW: {
        name: 'yellow',
        primary: '#ffff33',
        light: '#ffff66',
        dark: '#cccc29',
        glow: 'rgba(255, 255, 51, 0.6)'
    },
    BLUE: {
        name: 'blue',
        primary: '#3366ff',
        light: '#6699ff',
        dark: '#2952cc',
        glow: 'rgba(51, 102, 255, 0.6)'
    }
};

// Player order (clockwise starting from red)
export const PLAYER_ORDER = ['RED', 'GREEN', 'YELLOW', 'BLUE'];

// Home base positions (starting positions for tokens)
// Each player has 4 token slots in their home base
export const HOME_BASES = {
    RED: [
        { row: 2, col: 2 },
        { row: 2, col: 4 },
        { row: 4, col: 2 },
        { row: 4, col: 4 }
    ],
    GREEN: [
        { row: 2, col: 10 },
        { row: 2, col: 12 },
        { row: 4, col: 10 },
        { row: 4, col: 12 }
    ],
    YELLOW: [
        { row: 10, col: 10 },
        { row: 10, col: 12 },
        { row: 12, col: 10 },
        { row: 12, col: 12 }
    ],
    BLUE: [
        { row: 10, col: 2 },
        { row: 10, col: 4 },
        { row: 12, col: 2 },
        { row: 12, col: 4 }
    ]
};

// Entry points to the main track for each player
export const ENTRY_POINTS = {
    RED: { row: 6, col: 1 },
    GREEN: { row: 1, col: 8 },
    YELLOW: { row: 8, col: 13 },
    BLUE: { row: 13, col: 6 }
};

// Main track - 52 positions around the board (clockwise from red's entry)
// Index 0 is red's entry, 13 is green's entry, 26 is yellow's entry, 39 is blue's entry
export const MAIN_TRACK = [
    // Red's side (left) - going up
    { row: 6, col: 1 },  // 0 - Red entry
    { row: 6, col: 2 },  // 1
    { row: 6, col: 3 },  // 2 - Safe zone
    { row: 6, col: 4 },  // 3
    { row: 6, col: 5 },  // 4
    { row: 5, col: 6 },  // 5
    { row: 4, col: 6 },  // 6
    { row: 3, col: 6 },  // 7
    { row: 2, col: 6 },  // 8
    { row: 1, col: 6 },  // 9
    // Top row - going right
    { row: 0, col: 6 },  // 10
    { row: 0, col: 7 },  // 11
    { row: 0, col: 8 },  // 12
    { row: 1, col: 8 },  // 13 - Green entry
    { row: 2, col: 8 },  // 14
    { row: 3, col: 8 },  // 15 - Safe zone
    { row: 4, col: 8 },  // 16
    { row: 5, col: 8 },  // 17
    { row: 6, col: 9 },  // 18
    { row: 6, col: 10 }, // 19
    { row: 6, col: 11 }, // 20
    { row: 6, col: 12 }, // 21
    { row: 6, col: 13 }, // 22
    // Right column - going down
    { row: 6, col: 14 }, // 23
    { row: 7, col: 14 }, // 24
    { row: 8, col: 14 }, // 25
    { row: 8, col: 13 }, // 26 - Yellow entry
    { row: 8, col: 12 }, // 27
    { row: 8, col: 11 }, // 28 - Safe zone
    { row: 8, col: 10 }, // 29
    { row: 8, col: 9 },  // 30
    { row: 9, col: 8 },  // 31
    { row: 10, col: 8 }, // 32
    { row: 11, col: 8 }, // 33
    { row: 12, col: 8 }, // 34
    { row: 13, col: 8 }, // 35
    // Bottom row - going left
    { row: 14, col: 8 }, // 36
    { row: 14, col: 7 }, // 37
    { row: 14, col: 6 }, // 38
    { row: 13, col: 6 }, // 39 - Blue entry
    { row: 12, col: 6 }, // 40
    { row: 11, col: 6 }, // 41 - Safe zone
    { row: 10, col: 6 }, // 42
    { row: 9, col: 6 },  // 43
    { row: 8, col: 5 },  // 44
    { row: 8, col: 4 },  // 45
    { row: 8, col: 3 },  // 46
    { row: 8, col: 2 },  // 47
    { row: 8, col: 1 },  // 48
    // Left column - going up (back to start)
    { row: 8, col: 0 },  // 49
    { row: 7, col: 0 },  // 50
    { row: 6, col: 0 }   // 51 - Just before red's entry
];

// Track entry indices for each player
export const TRACK_ENTRY_INDICES = {
    RED: 0,
    GREEN: 13,
    YELLOW: 26,
    BLUE: 39
};

// Home stretch paths (5 cells leading to center for each player)
export const HOME_PATHS = {
    RED: [
        { row: 7, col: 1 },
        { row: 7, col: 2 },
        { row: 7, col: 3 },
        { row: 7, col: 4 },
        { row: 7, col: 5 },
        { row: 7, col: 6 }  // Final position (center entry)
    ],
    GREEN: [
        { row: 1, col: 7 },
        { row: 2, col: 7 },
        { row: 3, col: 7 },
        { row: 4, col: 7 },
        { row: 5, col: 7 },
        { row: 6, col: 7 }  // Final position (center entry)
    ],
    YELLOW: [
        { row: 7, col: 13 },
        { row: 7, col: 12 },
        { row: 7, col: 11 },
        { row: 7, col: 10 },
        { row: 7, col: 9 },
        { row: 7, col: 8 }  // Final position (center entry)
    ],
    BLUE: [
        { row: 13, col: 7 },
        { row: 12, col: 7 },
        { row: 11, col: 7 },
        { row: 10, col: 7 },
        { row: 9, col: 7 },
        { row: 8, col: 7 }  // Final position (center entry)
    ]
};

// Index where each player enters their home path
// (One position before their entry point, going backwards)
export const HOME_PATH_ENTRY_INDICES = {
    RED: 51,   // After completing full loop
    GREEN: 12, // After index 12
    YELLOW: 25, // After index 25
    BLUE: 38   // After index 38
};

// Safe zone positions (indices in MAIN_TRACK)
export const SAFE_ZONE_INDICES = [2, 15, 28, 41];

// Safe zones by position for quick lookup
export const SAFE_ZONES = SAFE_ZONE_INDICES.map(i => MAIN_TRACK[i]);

// Total track length before entering home path
export const TRACK_LENGTH = 52;

// Number of tokens per player
export const TOKENS_PER_PLAYER = 4;

// Dice configuration
export const DICE_MIN = 1;
export const DICE_MAX = 6;
export const UNLOCK_VALUE = 6;
export const MAX_CONSECUTIVE_SIXES = 3;

// Animation durations (in milliseconds)
export const ANIMATION_DURATIONS = {
    DICE_ROLL: 800,
    TOKEN_MOVE: 300,
    TOKEN_CAPTURE: 600,
    TOKEN_ENTER: 500,
    TOKEN_FINISH: 1000,
    TURN_DELAY: 500,
    AI_THINK: 800,
    MESSAGE_DISPLAY: 2000
};

// AI difficulty settings
export const AI_DIFFICULTY = {
    EASY: {
        name: 'Easy',
        thinkTime: 500,
        randomness: 0.7  // 70% chance of random move
    },
    MEDIUM: {
        name: 'Medium',
        thinkTime: 800,
        randomness: 0.3  // 30% chance of random move
    },
    HARD: {
        name: 'Hard',
        thinkTime: 1000,
        randomness: 0.05  // 5% chance of random move (mostly optimal)
    }
};

// Game phases
export const GAME_PHASE = {
    MENU: 'MENU',
    SETUP: 'SETUP',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
};

// Turn phases
export const TURN_PHASE = {
    WAITING: 'WAITING',
    ROLLING: 'ROLLING',
    SELECTING: 'SELECTING',
    MOVING: 'MOVING',
    COMPLETE: 'COMPLETE'
};

// Sound effect names
export const SOUNDS = {
    DICE_ROLL: 'dice-roll',
    TOKEN_MOVE: 'token-move',
    TOKEN_CAPTURE: 'token-capture',
    TOKEN_UNLOCK: 'token-unlock',
    VICTORY: 'victory',
    TURN_START: 'turn-start'
};

// Helper function to check if a position is a safe zone
export function isSafeZone(row, col) {
    return SAFE_ZONES.some(pos => pos.row === row && pos.col === col);
}

// Helper function to check if a position is an entry point
export function isEntryPoint(row, col) {
    return Object.values(ENTRY_POINTS).some(pos => pos.row === row && pos.col === col);
}

// Helper function to get track index from position
export function getTrackIndex(row, col) {
    return MAIN_TRACK.findIndex(pos => pos.row === row && pos.col === col);
}

// Helper function to get player color by index
export function getPlayerColorByIndex(index) {
    return PLAYER_ORDER[index];
}
