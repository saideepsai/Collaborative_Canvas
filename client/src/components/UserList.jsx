/**
 * UserList Component - Display active users in the room
 */

import './UserList.css';

export default function UserList({ userCount, isConnected }) {
    return (
        <div className="user-list glass-effect">
            <div className="user-list-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
                <span className="user-count">
                    {userCount} {userCount === 1 ? 'User' : 'Users'} Online
                </span>
            </div>

            {!isConnected && (
                <div className="connection-warning">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>Reconnecting...</span>
                </div>
            )}
        </div>
    );
}
