/**
 * Token - Represents a game piece (UFO)
 */
import {
    HOME_BASES,
    MAIN_TRACK,
    HOME_PATHS,
    TRACK_ENTRY_INDICES,
    HOME_PATH_ENTRY_INDICES,
    TRACK_LENGTH,
    PLAYER_ORDER
} from '../core/Constants.js';

export class Token {
    constructor(playerIndex, tokenIndex) {
        this.id = `${PLAYER_ORDER[playerIndex]}_${tokenIndex}`;
        this.playerIndex = playerIndex;
        this.tokenIndex = tokenIndex;
        this.color = PLAYER_ORDER[playerIndex];

        // State: 'home', 'active', 'finished'
        this.state = 'home';

        // Position tracking
        this.position = null;          // {row, col} or null if at home
        this.trackIndex = -1;          // Index on main track (-1 if not on track)
        this.homePathIndex = -1;       // Index on home path (-1 if not on home path)
        this.homeSlot = tokenIndex;    // Slot in home base (0-3)

        // Progress tracking (for AI evaluation)
        this.totalSteps = 0;           // Total steps taken
    }

    /**
     * Get the home base position for this token
     * @returns {Object} {row, col} of home position
     */
    getHomePosition() {
        return HOME_BASES[this.color][this.homeSlot];
    }

    /**
     * Check if token is at home base
     * @returns {boolean}
     */
    isAtHome() {
        return this.state === 'home';
    }

    /**
     * Check if token is on the board (active)
     * @returns {boolean}
     */
    isActive() {
        return this.state === 'active';
    }

    /**
     * Check if token has finished
     * @returns {boolean}
     */
    isFinished() {
        return this.state === 'finished';
    }

    /**
     * Check if token is on the home path
     * @returns {boolean}
     */
    isOnHomePath() {
        return this.homePathIndex >= 0;
    }

    /**
     * Get the entry point index for this token's color
     * @returns {number}
     */
    getEntryIndex() {
        return TRACK_ENTRY_INDICES[this.color];
    }

    /**
     * Get the home path entry index for this token's color
     * @returns {number}
     */
    getHomePathEntryIndex() {
        return HOME_PATH_ENTRY_INDICES[this.color];
    }

    /**
     * Move token from home to entry point
     */
    enterBoard() {
        this.state = 'active';
        this.trackIndex = this.getEntryIndex();
        this.position = { ...MAIN_TRACK[this.trackIndex] };
        this.totalSteps = 0;
    }

    /**
     * Move token along the track
     * @param {number} steps - Number of steps to move
     * @returns {Object} Result of movement
     */
    move(steps) {
        if (this.state !== 'active') {
            return { success: false, reason: 'Token not active' };
        }

        const result = this.calculateMove(steps);

        if (result.valid) {
            // Update position
            this.trackIndex = result.newTrackIndex;
            this.homePathIndex = result.newHomePathIndex;
            this.position = { ...result.newPosition };
            this.totalSteps += steps;

            // Check if finished
            if (result.finished) {
                this.state = 'finished';
                this.position = null;
            }
        }

        return result;
    }

    /**
     * Calculate where token would end up after moving
     * @param {number} steps - Number of steps to move
     * @returns {Object} Movement calculation result
     */
    calculateMove(steps) {
        if (this.state !== 'active') {
            return { valid: false, reason: 'Token not active' };
        }

        const homePathEntry = this.getHomePathEntryIndex();
        const homePath = HOME_PATHS[this.color];

        // Already on home path
        if (this.homePathIndex >= 0) {
            const newHomeIndex = this.homePathIndex + steps;

            // Check if overshoots home
            if (newHomeIndex > homePath.length - 1) {
                return { valid: false, reason: 'Overshoots home' };
            }

            // Check if reaches exactly home
            if (newHomeIndex === homePath.length - 1) {
                return {
                    valid: true,
                    newTrackIndex: -1,
                    newHomePathIndex: newHomeIndex,
                    newPosition: homePath[newHomeIndex],
                    finished: true,
                    path: this.getPathPositions(steps)
                };
            }

            // Normal home path move
            return {
                valid: true,
                newTrackIndex: -1,
                newHomePathIndex: newHomeIndex,
                newPosition: homePath[newHomeIndex],
                finished: false,
                path: this.getPathPositions(steps)
            };
        }

        // On main track - calculate new position
        let currentIndex = this.trackIndex;
        let stepsRemaining = steps;
        let enteringHomePath = false;
        let homePathSteps = 0;

        // Check if we'll pass or land on home path entry
        const entryIndex = this.getEntryIndex();
        let distanceToHomeEntry;

        // Calculate distance to home path entry
        if (currentIndex <= homePathEntry) {
            distanceToHomeEntry = homePathEntry - currentIndex;
        } else {
            // Need to go around
            distanceToHomeEntry = (TRACK_LENGTH - currentIndex) + homePathEntry;
        }

        // For tokens that just entered, they need to complete a full loop
        // Check if we've gone past entry at least once
        const hasCompletedLoop = this.totalSteps >= (TRACK_LENGTH - 1);

        if (hasCompletedLoop && steps > distanceToHomeEntry) {
            // Will enter home path
            enteringHomePath = true;
            homePathSteps = steps - distanceToHomeEntry - 1;

            // Check if valid home path move
            if (homePathSteps > homePath.length - 1) {
                return { valid: false, reason: 'Overshoots home' };
            }

            if (homePathSteps === homePath.length - 1) {
                return {
                    valid: true,
                    newTrackIndex: -1,
                    newHomePathIndex: homePathSteps,
                    newPosition: homePath[homePathSteps],
                    finished: true,
                    entersHomePath: true,
                    path: this.getPathPositions(steps)
                };
            }

            return {
                valid: true,
                newTrackIndex: -1,
                newHomePathIndex: homePathSteps,
                newPosition: homePath[homePathSteps],
                finished: false,
                entersHomePath: true,
                path: this.getPathPositions(steps)
            };
        }

        // Normal track movement
        const newTrackIndex = (currentIndex + steps) % TRACK_LENGTH;

        return {
            valid: true,
            newTrackIndex: newTrackIndex,
            newHomePathIndex: -1,
            newPosition: MAIN_TRACK[newTrackIndex],
            finished: false,
            path: this.getPathPositions(steps)
        };
    }

    /**
     * Get all positions the token will pass through
     * @param {number} steps - Number of steps
     * @returns {Array} Array of {row, col} positions
     */
    getPathPositions(steps) {
        const positions = [];

        if (this.homePathIndex >= 0) {
            // On home path
            const homePath = HOME_PATHS[this.color];
            for (let i = 1; i <= steps; i++) {
                const idx = this.homePathIndex + i;
                if (idx < homePath.length) {
                    positions.push(homePath[idx]);
                }
            }
        } else {
            // On main track
            const homePathEntry = this.getHomePathEntryIndex();
            const homePath = HOME_PATHS[this.color];
            const hasCompletedLoop = this.totalSteps >= (TRACK_LENGTH - 1);

            let currentIndex = this.trackIndex;

            for (let i = 1; i <= steps; i++) {
                currentIndex = (this.trackIndex + i) % TRACK_LENGTH;

                // Check if entering home path
                if (hasCompletedLoop && this.trackIndex !== homePathEntry) {
                    // Calculate if we've reached home path entry
                    let stepsToEntry;
                    if (this.trackIndex <= homePathEntry) {
                        stepsToEntry = homePathEntry - this.trackIndex;
                    } else {
                        stepsToEntry = (TRACK_LENGTH - this.trackIndex) + homePathEntry;
                    }

                    if (i > stepsToEntry) {
                        // We're on home path now
                        const homeIdx = i - stepsToEntry - 1;
                        if (homeIdx < homePath.length) {
                            positions.push(homePath[homeIdx]);
                        }
                        continue;
                    }
                }

                positions.push(MAIN_TRACK[currentIndex]);
            }
        }

        return positions;
    }

    /**
     * Send token back to home (when captured)
     */
    sendHome() {
        this.state = 'home';
        this.position = null;
        this.trackIndex = -1;
        this.homePathIndex = -1;
        this.totalSteps = 0;
    }

    /**
     * Get the progress percentage (for AI evaluation)
     * @returns {number} Progress from 0 to 1
     */
    getProgress() {
        if (this.state === 'finished') return 1;
        if (this.state === 'home') return 0;

        const totalDistance = TRACK_LENGTH + HOME_PATHS[this.color].length;
        let progress = this.totalSteps;

        if (this.homePathIndex >= 0) {
            progress = TRACK_LENGTH + this.homePathIndex;
        }

        return Math.min(progress / totalDistance, 0.99);
    }

    /**
     * Clone the token for simulation
     * @returns {Token}
     */
    clone() {
        const cloned = new Token(this.playerIndex, this.tokenIndex);
        cloned.state = this.state;
        cloned.position = this.position ? { ...this.position } : null;
        cloned.trackIndex = this.trackIndex;
        cloned.homePathIndex = this.homePathIndex;
        cloned.totalSteps = this.totalSteps;
        return cloned;
    }

    /**
     * Get a plain object representation
     * @returns {Object}
     */
    toObject() {
        return {
            id: this.id,
            playerIndex: this.playerIndex,
            tokenIndex: this.tokenIndex,
            color: this.color,
            state: this.state,
            position: this.position,
            trackIndex: this.trackIndex,
            homePathIndex: this.homePathIndex,
            homeSlot: this.homeSlot,
            totalSteps: this.totalSteps
        };
    }
}
