/**
 * Toolbar Component - Drawing controls and settings
 */

import { useState } from 'react';
import { isLightColor } from '../utils/color';
import './Toolbar.css';

export default function Toolbar({
    color,
    onColorChange,
    lineWidth,
    onLineWidthChange,
    onUndo,
    onRedo,
    onClear,
    canUndo,
    canRedo,
    isConnected,
    backgroundColor,
    onBackgroundColorChange,
}) {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showBgColorPicker, setShowBgColorPicker] = useState(false);

    const presetColors = [
        '#ffffff', // White
        '#000000', // Black
        '#6366f1', // Indigo
        '#8b5cf6', // Purple
        '#ec4899', // Pink
        '#f59e0b', // Amber
        '#10b981', // Emerald
        '#06b6d4', // Cyan
        '#f97316', // Orange
        '#14b8a6', // Teal
        '#ef4444', // Red
        '#3b82f6', // Blue
    ];

    const brushSizes = [
        { value: 2, label: 'Thin' },
        { value: 5, label: 'Medium' },
        { value: 10, label: 'Thick' },
        { value: 20, label: 'Extra Thick' },
    ];

    return (
        <div className="toolbar glass-effect">
            {/* Connection Status */}
            <div className="toolbar-section">
                <div className="connection-status">
                    <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
                    <span className="status-text">
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
            </div>

            <div className="toolbar-divider" />

            {/* Color Picker */}
            <div className="toolbar-section">
                <label className="toolbar-label">Color</label>
                <div className="color-picker-container">
                    <button
                        className="color-preview"
                        style={{ backgroundColor: color }}
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        title="Choose color"
                    />

                    {showColorPicker && (
                        <div className="color-palette fade-in">
                            <div className="preset-colors">
                                {presetColors.map((presetColor) => (
                                    <button
                                        key={presetColor}
                                        className={`color-swatch ${color === presetColor ? 'active' : ''}`}
                                        style={{ backgroundColor: presetColor }}
                                        onClick={() => {
                                            onColorChange(presetColor);
                                            setShowColorPicker(false);
                                        }}
                                        title={presetColor}
                                    />
                                ))}
                            </div>
                            <div className="custom-color">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => onColorChange(e.target.value)}
                                    title="Custom color"
                                />
                                <span className="color-hex">{color}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="toolbar-divider" />

            {/* Background Color Picker */}
            <div className="toolbar-section">
                <label className="toolbar-label">Background</label>
                <div className="color-picker-container">
                    <button
                        className="color-preview"
                        style={{ backgroundColor: backgroundColor }}
                        onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                        title="Choose background"
                    />

                    {showBgColorPicker && (
                        <div className="color-palette fade-in">
                            <div className="preset-colors">
                                {presetColors.map((presetColor) => (
                                    <button
                                        key={presetColor}
                                        className={`color-swatch ${backgroundColor === presetColor ? 'active' : ''}`}
                                        style={{ backgroundColor: presetColor }}
                                        onClick={() => {
                                            onBackgroundColorChange(presetColor);
                                            setShowBgColorPicker(false);
                                        }}
                                        title={presetColor}
                                    />
                                ))}
                            </div>
                            <div className="custom-color">
                                <input
                                    type="color"
                                    value={backgroundColor}
                                    onChange={(e) => onBackgroundColorChange(e.target.value)}
                                    title="Custom background color"
                                />
                                <span className="color-hex">{backgroundColor}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="toolbar-divider" />

            {/* Brush Size */}
            <div className="toolbar-section">
                <label className="toolbar-label">
                    Brush Size: <span className="value-display">{lineWidth}px</span>
                </label>
                <input
                    type="range"
                    min="1"
                    max="50"
                    value={lineWidth}
                    onChange={(e) => onLineWidthChange(Number(e.target.value))}
                    className="brush-slider"
                />
                <div className="brush-presets">
                    {brushSizes.map((size) => (
                        <button
                            key={size.value}
                            className={`btn-icon ${lineWidth === size.value ? 'active' : ''}`}
                            onClick={() => onLineWidthChange(size.value)}
                            title={size.label}
                        >
                            <div
                                className="brush-preview"
                                style={{
                                    width: `${Math.min(size.value, 16)}px`,
                                    height: `${Math.min(size.value, 16)}px`,
                                    backgroundColor: 'currentColor',
                                    borderRadius: '50%',
                                }}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div className="toolbar-divider" />

            {/* Actions */}
            <div className="toolbar-section toolbar-actions">
                <button
                    className="btn-icon"
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Undo (Ctrl+Z)"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 7v6h6" />
                        <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
                    </svg>
                </button>

                <button
                    className="btn-icon"
                    onClick={onRedo}
                    disabled={!canRedo}
                    title="Redo (Ctrl+Y)"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 7v6h-6" />
                        <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
                    </svg>
                </button>

                <button
                    className="btn-icon"
                    onClick={onClear}
                    title="Clear canvas"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                        <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
