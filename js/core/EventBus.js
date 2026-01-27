/**
 * EventBus - Pub/Sub system for decoupled communication
 * Allows different parts of the game to communicate without direct dependencies
 */
export class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Function to call when event is emitted
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event once (auto-unsubscribes after first call)
     * @param {string} event - Event name
     * @param {Function} callback - Function to call when event is emitted
     */
    once(event, callback) {
        const wrapper = (data) => {
            this.off(event, wrapper);
            callback(data);
        };
        this.on(event, wrapper);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Function to remove
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    /**
     * Emit an event to all subscribers
     * @param {string} event - Event name
     * @param {*} data - Data to pass to subscribers
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for "${event}":`, error);
                }
            });
        }
    }

    /**
     * Remove all listeners for an event (or all events if no event specified)
     * @param {string} [event] - Event name (optional)
     */
    clear(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}

// Game Events Constants
export const GameEvents = {
    // Game flow
    GAME_START: 'game:start',
    GAME_END: 'game:end',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',
    GAME_RESTART: 'game:restart',

    // Turn events
    TURN_START: 'turn:start',
    TURN_END: 'turn:end',
    TURN_SKIP: 'turn:skip',

    // Dice events
    DICE_ROLL_START: 'dice:rollStart',
    DICE_ROLLED: 'dice:rolled',
    DICE_ROLL_COMPLETE: 'dice:rollComplete',

    // Token events
    TOKEN_SELECT: 'token:select',
    TOKEN_DESELECT: 'token:deselect',
    TOKEN_MOVE_START: 'token:moveStart',
    TOKEN_MOVE: 'token:move',
    TOKEN_MOVE_COMPLETE: 'token:moveComplete',
    TOKEN_UNLOCK: 'token:unlock',
    TOKEN_CAPTURE: 'token:capture',
    TOKEN_CAPTURED: 'token:captured',
    TOKEN_FINISH: 'token:finish',
    TOKEN_SAFE: 'token:safe',

    // Player events
    PLAYER_WIN: 'player:win',
    PLAYER_READY: 'player:ready',

    // UI events
    UI_UPDATE: 'ui:update',
    SHOW_MESSAGE: 'ui:showMessage',
    HIDE_MESSAGE: 'ui:hideMessage',
    VALID_MOVES_UPDATE: 'ui:validMovesUpdate',

    // Sound events
    PLAY_SOUND: 'sound:play',
    STOP_SOUND: 'sound:stop',
    TOGGLE_SOUND: 'sound:toggle',

    // Effect events
    EFFECT_CAPTURE: 'effect:capture',
    EFFECT_VICTORY: 'effect:victory',
    EFFECT_SHAKE: 'effect:shake',
    EFFECT_FLASH: 'effect:flash'
};

// Create a global event bus instance
export const eventBus = new EventBus();
