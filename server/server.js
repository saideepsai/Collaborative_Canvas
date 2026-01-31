/**
 * Server - Express and Socket.io server for collaborative canvas
 * Handles WebSocket connections and real-time drawing synchronization
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import roomManager from './rooms.js';
import stateManager from './state-manager.js';

const app = express();
const httpServer = createServer(app);

// Configure CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));

// Socket.io setup with CORS
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        rooms: roomManager.getRoomCount(),
        totalUsers: roomManager.getTotalUserCount(),
        timestamp: new Date().toISOString(),
    });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`[Server] User connected: ${socket.id}`);

    // Handle room joining
    socket.on('join-room', (roomId = 'default') => {
        console.log(`[Server] ${socket.id} joining room: ${roomId}`);

        // Join the Socket.io room
        socket.join(roomId);

        // Add user to room manager
        const roomInfo = roomManager.joinRoom(socket.id, roomId);

        // Initialize state for this room if needed
        stateManager.createRoom(roomId);

        // Send complete drawing history to the new user
        const history = stateManager.getHistory(roomId);
        socket.emit('history', history);

        // Notify others in the room
        socket.to(roomId).emit('user-joined', {
            userId: socket.id,
            userCount: roomInfo.userCount,
        });

        // Send current room state to the user
        socket.emit('room-info', {
            roomId,
            userCount: roomInfo.userCount,
            state: stateManager.getRoomState(roomId),
        });

        console.log(`[Server] ${socket.id} joined room ${roomId}. Users: ${roomInfo.userCount}`);
    });

    // Handle drawing events
    socket.on('draw', (data) => {
        const { roomId = 'default', path } = data;

        // Validate that user is in the room
        if (!roomManager.isUserInRoom(socket.id, roomId)) {
            console.error(`[Server] User ${socket.id} not in room ${roomId}`);
            return;
        }

        // Add user ID to the path
        const pathWithUser = {
            ...path,
            userId: socket.id,
            timestamp: Date.now(),
        };

        // Add to state history
        stateManager.addPath(roomId, pathWithUser);

        // Broadcast to all users in the room (including sender for confirmation)
        io.to(roomId).emit('draw', pathWithUser);

        console.log(`[Server] Draw event in room ${roomId} from ${socket.id}`);
    });

    // Handle undo events
    socket.on('undo', (data) => {
        const { roomId = 'default' } = data;

        // Validate that user is in the room
        if (!roomManager.isUserInRoom(socket.id, roomId)) {
            return;
        }

        // Perform undo operation for this specific user
        const undonePath = stateManager.undo(roomId, socket.id);

        if (undonePath) {
            // Broadcast undo to all users in the room
            io.to(roomId).emit('undo', {
                pathId: undonePath.id,
                userId: socket.id,
                canUndo: stateManager.canUserUndo(roomId, socket.id),
                canRedo: stateManager.canUserRedo(roomId, socket.id),
            });

            console.log(`[Server] Undo by ${socket.id} in room ${roomId}`);
        }
    });

    // Handle redo events
    socket.on('redo', (data) => {
        const { roomId = 'default' } = data;

        // Validate that user is in the room
        if (!roomManager.isUserInRoom(socket.id, roomId)) {
            return;
        }

        // Perform redo operation for this specific user
        const redonePath = stateManager.redo(roomId, socket.id);

        if (redonePath) {
            // Broadcast redo to all users in the room
            io.to(roomId).emit('redo', {
                path: redonePath,
                userId: socket.id,
                canUndo: stateManager.canUserUndo(roomId, socket.id),
                canRedo: stateManager.canUserRedo(roomId, socket.id),
            });

            console.log(`[Server] Redo by ${socket.id} in room ${roomId}`);
        }
    });

    // Handle clear canvas events
    socket.on('clear-canvas', (data) => {
        const { roomId = 'default' } = data;

        // Validate that user is in the room
        if (!roomManager.isUserInRoom(socket.id, roomId)) {
            return;
        }

        // Clear the user's history
        stateManager.clearUserHistory(roomId, socket.id);

        // Broadcast clear to all users in the room
        io.to(roomId).emit('clear-canvas', {
            userId: socket.id,
        });

        console.log(`[Server] User ${socket.id} cleared their drawings in room ${roomId}`);
    });

    // Handle cursor movement events (for ghost cursors)
    socket.on('cursor-move', (data) => {
        const { roomId = 'default', position, isDrawing } = data;

        // Validate that user is in the room
        if (!roomManager.isUserInRoom(socket.id, roomId)) {
            return;
        }

        // Broadcast cursor position to other users in the room (not sender)
        socket.to(roomId).emit('cursor-move', {
            userId: socket.id,
            position,
            isDrawing,
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`[Server] User disconnected: ${socket.id}`);

        // Remove user from all rooms
        const rooms = roomManager.leaveAllRooms(socket.id);

        // Notify other users in each room
        rooms.forEach((roomId) => {
            const userCount = roomManager.getRoomUserCount(roomId);

            // Clear the user's history on disconnect/refresh
            stateManager.clearUserHistory(roomId, socket.id);

            // Broadcast clear event to remove drawings from other clients
            socket.to(roomId).emit('clear-canvas', {
                userId: socket.id,
            });

            socket.to(roomId).emit('user-left', {
                userId: socket.id,
                userCount,
            });

            // If room is empty, clean up state
            if (userCount === 0) {
                stateManager.deleteRoom(roomId);
            }
        });
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error(`[Server] Socket error for ${socket.id}:`, error);
    });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║  🎨 Collaborative Canvas Server                       ║
║                                                        ║
║  Server running on: http://localhost:${PORT}            ║
║  Status: Ready to accept connections                  ║
╚════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, shutting down gracefully...');
    httpServer.close(() => {
        console.log('[Server] Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('[Server] SIGINT received, shutting down gracefully...');
    httpServer.close(() => {
        console.log('[Server] Server closed');
        process.exit(0);
    });
});
