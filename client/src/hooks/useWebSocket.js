/**
 * WebSocket Hook - Custom React hook for Socket.io connection
 * Manages WebSocket connection and provides event emitters/listeners
 */

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function useWebSocket(roomId = 'default') {
    const [isConnected, setIsConnected] = useState(false);
    const [userCount, setUserCount] = useState(0);
    const socketRef = useRef(null);
    const eventHandlersRef = useRef({});

    useEffect(() => {
        // Initialize Socket.io connection
        console.log('[WebSocket] Connecting to:', SOCKET_URL);
        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        // Connection event handlers
        socket.on('connect', () => {
            console.log('[WebSocket] Connected:', socket.id);
            setIsConnected(true);

            // Join the room
            socket.emit('join-room', roomId);
        });

        socket.on('disconnect', () => {
            console.log('[WebSocket] Disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('[WebSocket] Connection error:', error);
            setIsConnected(false);
        });

        // Room event handlers
        socket.on('room-info', (data) => {
            console.log('[WebSocket] Room info:', data);
            setUserCount(data.userCount);

            if (eventHandlersRef.current.onRoomInfo) {
                eventHandlersRef.current.onRoomInfo(data);
            }
        });

        socket.on('user-joined', (data) => {
            console.log('[WebSocket] User joined:', data);
            setUserCount(data.userCount);

            if (eventHandlersRef.current.onUserJoined) {
                eventHandlersRef.current.onUserJoined(data);
            }
        });

        socket.on('user-left', (data) => {
            console.log('[WebSocket] User left:', data);
            setUserCount(data.userCount);

            if (eventHandlersRef.current.onUserLeft) {
                eventHandlersRef.current.onUserLeft(data);
            }
        });

        // Drawing event handlers
        socket.on('history', (history) => {
            console.log('[WebSocket] Received history:', history.length, 'paths');

            if (eventHandlersRef.current.onHistory) {
                eventHandlersRef.current.onHistory(history);
            }
        });

        socket.on('draw', (path) => {
            if (eventHandlersRef.current.onDraw) {
                eventHandlersRef.current.onDraw(path);
            }
        });

        socket.on('drawing-progress', (path) => {
            if (eventHandlersRef.current.onDrawingProgress) {
                eventHandlersRef.current.onDrawingProgress(path);
            }
        });

        socket.on('undo', (data) => {
            console.log('[WebSocket] Undo event:', data);

            if (eventHandlersRef.current.onUndo) {
                eventHandlersRef.current.onUndo(data);
            }
        });

        socket.on('redo', (data) => {
            console.log('[WebSocket] Redo event:', data);

            if (eventHandlersRef.current.onRedo) {
                eventHandlersRef.current.onRedo(data);
            }
        });

        socket.on('clear-canvas', (data) => {
            console.log('[WebSocket] Clear canvas event:', data);

            if (eventHandlersRef.current.onClear) {
                eventHandlersRef.current.onClear(data);
            }
        });

        // Cursor movement event handler
        socket.on('cursor-move', (data) => {
            if (eventHandlersRef.current.onCursorMove) {
                eventHandlersRef.current.onCursorMove(data);
            }
        });

        // Cleanup on unmount
        return () => {
            console.log('[WebSocket] Cleaning up connection');
            socket.disconnect();
        };
    }, [roomId]);

    // Event emitters
    const emit = {
        draw: (path) => {
            if (socketRef.current?.connected) {
                socketRef.current.emit('draw', { roomId, path });
            }
        },

        undo: () => {
            if (socketRef.current?.connected) {
                socketRef.current.emit('undo', { roomId });
            }
        },

        redo: () => {
            if (socketRef.current?.connected) {
                socketRef.current.emit('redo', { roomId });
            }
        },

        clearCanvas: () => {
            if (socketRef.current?.connected) {
                socketRef.current.emit('clear-canvas', { roomId });
            }
        },

        cursorMove: (position, isDrawing) => {
            if (socketRef.current?.connected) {
                socketRef.current.emit('cursor-move', { roomId, position, isDrawing });
            }
        },

        drawingProgress: (path) => {
            if (socketRef.current?.connected) {
                socketRef.current.emit('drawing-progress', { roomId, path });
            }
        },
    };

    // Event listener registration
    const on = {
        history: (handler) => {
            eventHandlersRef.current.onHistory = handler;
        },

        draw: (handler) => {
            eventHandlersRef.current.onDraw = handler;
        },

        undo: (handler) => {
            eventHandlersRef.current.onUndo = handler;
        },

        redo: (handler) => {
            eventHandlersRef.current.onRedo = handler;
        },

        clear: (handler) => {
            eventHandlersRef.current.onClear = handler;
        },

        roomInfo: (handler) => {
            eventHandlersRef.current.onRoomInfo = handler;
        },

        userJoined: (handler) => {
            eventHandlersRef.current.onUserJoined = handler;
        },

        userLeft: (handler) => {
            eventHandlersRef.current.onUserLeft = handler;
        },

        cursorMove: (handler) => {
            eventHandlersRef.current.onCursorMove = handler;
        },

        drawingProgress: (handler) => {
            eventHandlersRef.current.onDrawingProgress = handler;
        },
    };

    return {
        isConnected,
        userCount,
        emit,
        on,
        socket: socketRef.current,
    };
}
