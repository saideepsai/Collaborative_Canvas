# Real-Time Collaborative Drawing Canvas

🎨 A multi-user drawing application where multiple people can draw simultaneously on a shared canvas.

## 🎯 Features

- **Real-time Collaboration**: Multiple users can draw on the same canvas simultaneously
- **WebSocket Communication**: Bidirectional real-time updates using Socket.io
- **Drawing Tools**: Freehand drawing with customizable colors and brush sizes
- **Undo/Redo**: Full history management with conflict resolution
- **Room System**: Isolated drawing sessions for different groups
- **State Synchronization**: New users receive the complete drawing history

## 🔧 Technical Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express + Socket.io
- **Canvas**: Native HTML5 Canvas API (getContext('2d'))
- **Communication**: Socket.io for WebSocket management

## 📦 Installation

### Prerequisites
- Node.js v18 or higher
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   cd collaborative-canvas
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

   Or install manually:
   ```bash
   # Root dependencies
   npm install

   # Client dependencies
   cd client
   npm install

   # Server dependencies
   cd ../server
   npm install
   ```

## 🚀 Running the Application

### Development Mode (Recommended)

Run both client and server concurrently:
```bash
npm run dev
```

This will start:
- **Client**: http://localhost:5173
- **Server**: http://localhost:3001

### Manual Start

**Terminal 1 - Start the server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Start the client:**
```bash
cd client
npm run dev
```

## 🧪 Testing

1. Open http://localhost:5173 in your browser
2. Open the same URL in another browser window or incognito mode
3. Start drawing in one window and observe real-time updates in the other
4. Test different rooms by appending `?room=roomName` to the URL
5. Test undo/redo functionality across multiple clients

## 📁 Project Structure

```
collaborative-canvas/
├── client/                  # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas.jsx          # Core drawing logic
│   │   │   ├── Toolbar.jsx         # Drawing controls
│   │   │   └── UserList.jsx        # Active users display
│   │   ├── hooks/
│   │   │   └── useWebSocket.js     # Socket.io connection hook
│   │   ├── utils/
│   │   │   └── canvas.js           # Canvas utility functions
│   │   ├── App.jsx                 # Main application component
│   │   ├── main.jsx                # Application entry point
│   │   └── index.css               # Global styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                  # Node.js backend
│   ├── server.js                   # Express server initialization
│   ├── rooms.js                    # Room management logic
│   ├── state-manager.js            # Drawing history management
│   └── package.json
├── package.json             # Root package.json
├── README.md
└── ARCHITECTURE.md
```

## 🎨 Usage

### Drawing
- Click and drag on the canvas to draw
- Use the toolbar to change colors and brush sizes

### Collaboration
- Share the URL with others to collaborate in real-time
- Each user gets a unique color indicator

### Rooms
- Add `?room=yourRoomName` to the URL to create/join a specific room
- Users in different rooms have isolated canvases

### Undo/Redo
- Use the undo/redo buttons to navigate through drawing history
- History is synchronized across all users in the room

## 🏗️ Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## 📝 Assignment Requirements

This project fulfills the following requirements:
- ✅ HTML5 Canvas API implementation (no drawing libraries)
- ✅ WebSocket-based real-time communication
- ✅ State synchronization across multiple clients
- ✅ Undo/Redo with conflict resolution
- ✅ Room-based session isolation
- ✅ Clean separation between client and server logic

## 🐛 Troubleshooting

**Port already in use:**
- Change the port in `server/server.js` (default: 3001)
- Change the client port in `client/vite.config.js` (default: 5173)

**WebSocket connection failed:**
- Ensure the server is running
- Check that the Socket.io URL in the client matches the server URL

**Canvas not updating:**
- Check browser console for errors
- Verify WebSocket connection status

## 📄 License

MIT
