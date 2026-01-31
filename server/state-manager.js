/**
 * State Manager - Manages drawing history and undo/redo operations
 * This module maintains the "source of truth" for each room's drawing state
 */

class StateManager {
    constructor() {
        // Store state for each room
        // Structure: { roomId: { history: [], undoStack: [] } }
        this.rooms = new Map();
    }

    /**
     * Initialize a new room's state
     * @param {string} roomId - Unique room identifier
     */
    createRoom(roomId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                history: [],      // Main drawing history (active paths)
                undoStack: [],    // Paths that have been undone
            });
            console.log(`[StateManager] Created room: ${roomId}`);
        }
    }

    /**
     * Add a new drawing path to the room's history
     * @param {string} roomId - Room identifier
     * @param {Object} path - Drawing path data
     * @returns {boolean} Success status
     */
    addPath(roomId, path) {
        const room = this.rooms.get(roomId);
        if (!room) {
            console.error(`[StateManager] Room not found: ${roomId}`);
            return false;
        }

        // Add timestamp if not present
        if (!path.timestamp) {
            path.timestamp = Date.now();
        }

        // Add to history
        room.history.push(path);

        // Clear undo stack when new path is added
        // (standard undo/redo behavior - new action invalidates redo)
        room.undoStack = [];

        console.log(`[StateManager] Added path to room ${roomId}. History size: ${room.history.length}`);
        return true;
    }

    /**
     * Undo the last drawing action (global)
     * @param {string} roomId - Room identifier
     * @returns {Object|null} The undone path, or null if nothing to undo
     */
    undo(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || room.history.length === 0) {
            return null;
        }

        // Global undo: remove the very last path added
        const path = room.history.pop();
        room.undoStack.push(path);

        console.log(`[StateManager] Global undo in room ${roomId}. History: ${room.history.length}, Undo stack: ${room.undoStack.length}`);
        return path;
    }

    /**
     * Redo the last undone action (global)
     * @param {string} roomId - Room identifier
     * @returns {Object|null} The redone path, or null if nothing to redo
     */
    redo(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || room.undoStack.length === 0) {
            return null;
        }

        // Global redo: restore the last path from undo stack
        const path = room.undoStack.pop();
        room.history.push(path);

        console.log(`[StateManager] Global redo in room ${roomId}. History: ${room.history.length}, Undo stack: ${room.undoStack.length}`);
        return path;
    }

    /**
     * Check if undo is possible
     * @param {string} roomId - Room identifier
     * @returns {boolean}
     */
    canUndo(roomId) {
        const room = this.rooms.get(roomId);
        return room ? room.history.length > 0 : false;
    }

    /**
     * Check if redo is possible
     * @param {string} roomId - Room identifier
     * @returns {boolean}
     */
    canRedo(roomId) {
        const room = this.rooms.get(roomId);
        return room ? room.undoStack.length > 0 : false;
    }

    /**
     * Get the complete drawing history for a room
     * @param {string} roomId - Room identifier
     * @returns {Array} Array of drawing paths
     */
    getHistory(roomId) {
        const room = this.rooms.get(roomId);
        return room ? [...room.history] : [];
    }

    /**
     * Clear all drawing history for a room
     * @param {string} roomId - Room identifier
     */
    clearHistory(roomId) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.history = [];
            room.undoStack = [];
            console.log(`[StateManager] Cleared all history for room ${roomId}`);
        }
    }

    /**
     * Clear drawing history for a specific user in a room
     * @param {string} roomId - Room identifier
     * @param {string} userId - User identifier
     */
    clearUserHistory(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (room) {
            // Filter out paths belonging to the user
            const initialHistoryLength = room.history.length;
            room.history = room.history.filter(path => path.userId !== userId);
            room.undoStack = room.undoStack.filter(path => path.userId !== userId);

            console.log(`[StateManager] Cleared history for user ${userId} in room ${roomId}. Removed ${initialHistoryLength - room.history.length} paths.`);
        }
    }

    /**
     * Get the current state summary for a room
     * @param {string} roomId - Room identifier
     * @returns {Object} State summary
     */
    getRoomState(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        return {
            historySize: room.history.length,
            undoStackSize: room.undoStack.length,
            canUndo: room.history.length > 0,
            canRedo: room.undoStack.length > 0,
        };
    }

    /**
     * Delete a room and its state (cleanup)
     * @param {string} roomId - Room identifier
     */
    deleteRoom(roomId) {
        if (this.rooms.has(roomId)) {
            this.rooms.delete(roomId);
            console.log(`[StateManager] Deleted room: ${roomId}`);
        }
    }

    /**
     * Get all active room IDs
     * @returns {Array<string>} Array of room IDs
     */
    getAllRooms() {
        return Array.from(this.rooms.keys());
    }
}

// Export singleton instance
export default new StateManager();
