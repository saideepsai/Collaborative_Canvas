# Architecture Documentation

## 🏗️ System Overview

The Real-Time Collaborative Drawing Canvas is built on a client-server architecture with WebSocket-based bidirectional communication. The system enables multiple users to draw simultaneously on a shared canvas with real-time synchronization.

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Browser 1          Browser 2          Browser N            │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐          │
│  │  Canvas  │      │  Canvas  │      │  Canvas  │          │
│  │  React   │      │  React   │      │  React   │          │
│  │  App     │      │  App     │      │  App     │          │
│  └────┬─────┘      └────┬─────┘      └────┬─────┘          │
│       │                 │                 │                 │
│       │  Socket.io      │  Socket.io      │  Socket.io     │
│       └─────────────────┼─────────────────┘                 │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Server Layer                            │
├─────────────────────────────────────────────────────────────┤
│                   Socket.io Server                           │
│                         │                                    │
│         ┌───────────────┼───────────────┐                   │
│         ▼               ▼               ▼                   │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐               │
│   │ Room A  │    │ Room B  │    │ Room N  │               │
│   ├─────────┤    ├─────────┤    ├─────────┤               │
│   │ State   │    │ State   │    │ State   │               │
│   │ Manager │    │ Manager │    │ Manager │               │
│   └─────────┘    └─────────┘    └─────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### 1. Drawing Event Flow

```
User draws on canvas
    ↓
Canvas captures mouse/touch events
    ↓
Generate drawing path data
    ↓
Emit 'draw' event via Socket.io
    ↓
Server receives event
    ↓
Server adds to room history
    ↓
Server broadcasts to all clients in room
    ↓
Other clients receive event
    ↓
Render path on their canvas
```

### 2. New User Join Flow

```
User opens application
    ↓
Connect to Socket.io server
    ↓
Join room (default or specified)
    ↓
Server sends complete drawing history
    ↓
Client renders all historical paths
    ↓
User can now draw and see others' drawings
```

## 🎨 Client Architecture

### Component Hierarchy

```
App
├── Canvas (Main drawing component)
│   ├── Drawing logic
│   ├── Event handlers
│   └── Rendering engine
├── Toolbar
│   ├── Color picker
│   ├── Brush size selector
│   └── Undo/Redo buttons
└── UserList
    └── Active users display
```

### Key Modules

#### 1. **Canvas Component** (`client/src/components/Canvas.jsx`)
- **Responsibility**: Core drawing logic and rendering
- **Key Functions**:
  - `handleMouseDown()`: Start drawing path
  - `handleMouseMove()`: Continue drawing path
  - `handleMouseUp()`: Complete drawing path
  - `drawPath()`: Render a path on canvas
  - `clearCanvas()`: Clear entire canvas
  - `redrawCanvas()`: Redraw from history

#### 2. **WebSocket Hook** (`client/src/hooks/useWebSocket.js`)
- **Responsibility**: Socket.io connection management
- **Events Emitted**:
  - `join-room`: Join a specific room
  - `draw`: Send drawing data
  - `undo`: Request undo operation
  - `redo`: Request redo operation
- **Events Listened**:
  - `draw`: Receive drawing from other users
  - `history`: Receive complete drawing history
  - `undo`: Apply undo from server
  - `redo`: Apply redo from server
  - `user-joined`: New user notification
  - `user-left`: User disconnection notification

#### 3. **Canvas Utilities** (`client/src/utils/canvas.js`)
- **Responsibility**: Helper functions for canvas operations
- **Functions**:
  - `getCanvasCoordinates()`: Convert screen to canvas coordinates
  - `drawLine()`: Draw line between two points
  - `smoothPath()`: Apply path smoothing algorithms

## 🖥️ Server Architecture

### Core Modules

#### 1. **Server** (`server/server.js`)
- **Responsibility**: Express server and Socket.io initialization
- **Key Features**:
  - HTTP server setup
  - Socket.io configuration
  - CORS handling
  - Connection management

#### 2. **Room Manager** (`server/rooms.js`)
- **Responsibility**: Manage isolated drawing sessions
- **Data Structure**:
```javascript
{
  roomId: {
    users: Set<socketId>,
    history: Array<DrawingPath>,
    undoStack: Array<DrawingPath>
  }
}
```
- **Key Functions**:
  - `createRoom(roomId)`: Initialize new room
  - `joinRoom(socketId, roomId)`: Add user to room
  - `leaveRoom(socketId, roomId)`: Remove user from room
  - `getRoomUsers(roomId)`: Get active users in room

#### 3. **State Manager** (`server/state-manager.js`)
- **Responsibility**: Drawing history and undo/redo logic
- **Key Functions**:
  - `addPath(roomId, path)`: Add drawing to history
  - `undo(roomId)`: Move last path to undo stack
  - `redo(roomId)`: Restore path from undo stack
  - `getHistory(roomId)`: Get complete drawing history
  - `clearHistory(roomId)`: Reset room state

## 🔐 State Synchronization

### Drawing Path Data Structure

```javascript
{
  id: "unique-path-id",
  userId: "socket-id",
  points: [
    { x: 100, y: 150 },
    { x: 101, y: 151 },
    // ... more points
  ],
  color: "#FF5733",
  lineWidth: 3,
  timestamp: 1234567890
}
```

### Conflict Resolution Strategy

1. **Timestamp-based ordering**: All events include timestamps
2. **Server as source of truth**: Server maintains canonical history
3. **Optimistic updates**: Client renders immediately, server confirms
4. **Undo/Redo coordination**: Server manages global undo/redo stack

### Synchronization Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Network latency | Optimistic rendering + server reconciliation |
| Out-of-order messages | Timestamp-based reordering |
| Simultaneous undo operations | Server-side queue processing |
| New user sync | Send complete history on join |
| Large history size | Implement history compression/chunking |

## 🚀 Performance Optimizations

### Client-Side

1. **Throttling**: Limit draw event emission rate (e.g., 60fps)
2. **Path Batching**: Combine multiple points into single event
3. **Canvas Layering**: Separate static and dynamic content
4. **RequestAnimationFrame**: Smooth rendering loop

### Server-Side

1. **Room Isolation**: Broadcast only to relevant clients
2. **Event Batching**: Combine multiple events before broadcast
3. **History Pruning**: Limit maximum history size
4. **Compression**: Use binary protocols for large data

## 🔒 Security Considerations

1. **Input Validation**: Validate all drawing data on server
2. **Rate Limiting**: Prevent spam/DoS attacks
3. **Room Access Control**: Optional password protection
4. **Data Sanitization**: Prevent XSS through canvas data
5. **Connection Limits**: Max users per room

## 📈 Scalability

### Current Limitations
- In-memory state (lost on server restart)
- Single server instance

### Future Improvements
1. **Persistent Storage**: Save history to database
2. **Redis Adapter**: Multi-server Socket.io scaling
3. **Load Balancing**: Distribute rooms across servers
4. **CDN Integration**: Serve static assets efficiently

## 🧪 Testing Strategy

### Unit Tests
- Canvas utility functions
- State manager logic
- Room management operations

### Integration Tests
- Socket.io event flow
- Multi-client synchronization
- Undo/redo across clients

### E2E Tests
- Complete user journey
- Multi-browser collaboration
- Network failure recovery

## 📊 Monitoring & Debugging

### Key Metrics
- Active connections per room
- Message throughput
- Average latency
- History size per room

### Debug Tools
- Socket.io admin UI
- Client-side event logging
- Server-side request tracing

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Client
VITE_SOCKET_URL=http://localhost:3001
```

## 📚 Technology Decisions

| Decision | Rationale |
|----------|-----------|
| Socket.io over native WebSockets | Automatic reconnection, fallback support |
| React for frontend | Component reusability, state management |
| Vite for bundling | Fast HMR, modern build tool |
| In-memory state | Simplicity for assignment scope |
| Native Canvas API | Assignment requirement, learning objective |

## 🎓 Learning Outcomes

By building this application, you will understand:

1. **Canvas API**: Low-level drawing operations, coordinate systems
2. **WebSockets**: Real-time bidirectional communication patterns
3. **State Management**: Distributed state synchronization
4. **Event-Driven Architecture**: Asynchronous event handling
5. **Conflict Resolution**: Managing concurrent operations
6. **Client-Server Design**: Separation of concerns, API design
