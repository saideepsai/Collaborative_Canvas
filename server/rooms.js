/**
 * Room Manager - Manages room-based user sessions
 * Handles user joining/leaving rooms and room lifecycle
 */

class RoomManager {
    constructor() {
        // Store room data
        // Structure: { roomId: { users: Set<socketId>, metadata: {} } }
        this.rooms = new Map();
    }

    /**
     * Create a new room
     * @param {string} roomId - Unique room identifier
     */
    createRoom(roomId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                users: new Set(),
                createdAt: Date.now(),
                metadata: {
                    name: roomId,
                },
            });
            console.log(`[RoomManager] Created room: ${roomId}`);
        }
    }

    /**
     * Add a user to a room
     * @param {string} socketId - User's socket ID
     * @param {string} roomId - Room identifier
     * @param {Object} userInfo - Additional user information
     */
    joinRoom(socketId, roomId, userInfo = {}) {
        // Create room if it doesn't exist
        this.createRoom(roomId);

        const room = this.rooms.get(roomId);
        room.users.add(socketId);

        console.log(`[RoomManager] User ${socketId} joined room ${roomId}. Total users: ${room.users.size}`);

        return {
            roomId,
            userCount: room.users.size,
            users: Array.from(room.users),
        };
    }

    /**
     * Remove a user from a room
     * @param {string} socketId - User's socket ID
     * @param {string} roomId - Room identifier
     * @returns {Object} Updated room info
     */
    leaveRoom(socketId, roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        room.users.delete(socketId);
        console.log(`[RoomManager] User ${socketId} left room ${roomId}. Remaining users: ${room.users.size}`);

        // Clean up empty rooms
        if (room.users.size === 0) {
            this.deleteRoom(roomId);
            return { roomId, deleted: true, userCount: 0 };
        }

        return {
            roomId,
            userCount: room.users.size,
            users: Array.from(room.users),
        };
    }

    /**
     * Remove a user from all rooms they're in
     * @param {string} socketId - User's socket ID
     * @returns {Array<string>} List of rooms the user was removed from
     */
    leaveAllRooms(socketId) {
        const roomsLeft = [];

        for (const [roomId, room] of this.rooms.entries()) {
            if (room.users.has(socketId)) {
                this.leaveRoom(socketId, roomId);
                roomsLeft.push(roomId);
            }
        }

        return roomsLeft;
    }

    /**
     * Get all users in a room
     * @param {string} roomId - Room identifier
     * @returns {Array<string>} Array of socket IDs
     */
    getRoomUsers(roomId) {
        const room = this.rooms.get(roomId);
        return room ? Array.from(room.users) : [];
    }

    /**
     * Get the number of users in a room
     * @param {string} roomId - Room identifier
     * @returns {number} User count
     */
    getRoomUserCount(roomId) {
        const room = this.rooms.get(roomId);
        return room ? room.users.size : 0;
    }

    /**
     * Check if a user is in a specific room
     * @param {string} socketId - User's socket ID
     * @param {string} roomId - Room identifier
     * @returns {boolean}
     */
    isUserInRoom(socketId, roomId) {
        const room = this.rooms.get(roomId);
        return room ? room.users.has(socketId) : false;
    }

    /**
     * Get all rooms a user is in
     * @param {string} socketId - User's socket ID
     * @returns {Array<string>} Array of room IDs
     */
    getUserRooms(socketId) {
        const userRooms = [];

        for (const [roomId, room] of this.rooms.entries()) {
            if (room.users.has(socketId)) {
                userRooms.push(roomId);
            }
        }

        return userRooms;
    }

    /**
     * Get room information
     * @param {string} roomId - Room identifier
     * @returns {Object|null} Room information
     */
    getRoomInfo(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        return {
            roomId,
            userCount: room.users.size,
            users: Array.from(room.users),
            createdAt: room.createdAt,
            metadata: room.metadata,
        };
    }

    /**
     * Delete a room
     * @param {string} roomId - Room identifier
     */
    deleteRoom(roomId) {
        if (this.rooms.has(roomId)) {
            this.rooms.delete(roomId);
            console.log(`[RoomManager] Deleted room: ${roomId}`);
        }
    }

    /**
     * Get all active rooms
     * @returns {Array<Object>} Array of room information
     */
    getAllRooms() {
        const rooms = [];

        for (const [roomId, room] of this.rooms.entries()) {
            rooms.push({
                roomId,
                userCount: room.users.size,
                createdAt: room.createdAt,
            });
        }

        return rooms;
    }

    /**
     * Get total number of active rooms
     * @returns {number}
     */
    getRoomCount() {
        return this.rooms.size;
    }

    /**
     * Get total number of connected users across all rooms
     * @returns {number}
     */
    getTotalUserCount() {
        let total = 0;
        for (const room of this.rooms.values()) {
            total += room.users.size;
        }
        return total;
    }
}

// Export singleton instance
export default new RoomManager();
