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
     * Undo the last drawing action by a specific user
     * @param {string} roomId - Room identifier
     * @param {string} userId - User identifier
     * @returns {Object|null} The undone path, or null if nothing to undo
     */
    undo(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (!room || room.history.length === 0) {
            return null;
        }

        // Find the last path drawn by this user (search from end)
        let pathIndex = -1;
        for (let i = room.history.length - 1; i >= 0; i--) {
            if (room.history[i].userId === userId) {
                pathIndex = i;
                break;
            }
        }

        // No paths found for this user
        if (pathIndex === -1) {
            console.log(`[StateManager] No paths to undo for user ${userId} in room ${roomId}`);
            return null;
        }

        // Remove the path and add to undo stack
        const path = room.history.splice(pathIndex, 1)[0];
        room.undoStack.push(path);

        console.log(`[StateManager] Undo by ${userId} in room ${roomId}. History: ${room.history.length}, Undo stack: ${room.undoStack.length}`);
        return path;
    }

    /**
     * Redo the last undone action by a specific user
     * @param {string} roomId - Room identifier
     * @param {string} userId - User identifier
     * @returns {Object|null} The redone path, or null if nothing to redo
     */
    redo(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (!room || room.undoStack.length === 0) {
            return null;
        }

        // Find the last undone path by this user (search from end)
        let pathIndex = -1;
        for (let i = room.undoStack.length - 1; i >= 0; i--) {
            if (room.undoStack[i].userId === userId) {
                pathIndex = i;
                break;
            }
        }

        // No undone paths found for this user
        if (pathIndex === -1) {
            console.log(`[StateManager] No paths to redo for user ${userId} in room ${roomId}`);
            return null;
        }

        // Remove from undo stack and add back to history
        const path = room.undoStack.splice(pathIndex, 1)[0];
        room.history.push(path);

        console.log(`[StateManager] Redo by ${userId} in room ${roomId}. History: ${room.history.length}, Undo stack: ${room.undoStack.length}`);
        return path;
    }

    /**
     * Check if a user can undo (has paths in history)
     * @param {string} roomId - Room identifier
     * @param {string} userId - User identifier
     * @returns {boolean}
     */
    canUserUndo(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (!room) return false;

        return room.history.some(path => path.userId === userId);
    }

    /**
     * Check if a user can redo (has paths in undo stack)
     * @param {string} roomId - Room identifier
     * @param {string} userId - User identifier
     * @returns {boolean}
     */
    canUserRedo(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (!room) return false;

        return room.undoStack.some(path => path.userId === userId);
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
