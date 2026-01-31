/**
 * Cursor Component - Display other users' cursor positions
 */

import './Cursor.css';

export default function Cursor({ userId, position, color, isDrawing }) {
    if (!position) return null;

    return (
        <div
            className={`remote-cursor ${isDrawing ? 'drawing' : ''}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                borderColor: color,
            }}
        >
            <div className="cursor-dot" style={{ backgroundColor: color }} />
            <div className="cursor-label" style={{ backgroundColor: color }}>
                User {userId.slice(0, 4)}
            </div>
        </div>
    );
}
