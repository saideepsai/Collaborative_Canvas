/**
 * Canvas Utility Functions
 * Helper functions for canvas operations and coordinate handling
 */

/**
 * Get canvas coordinates from mouse/touch event
 * Handles coordinate transformation from screen to canvas space
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {MouseEvent|TouchEvent} event - The mouse or touch event
 * @returns {Object} { x, y } coordinates relative to canvas
 */
export function getCanvasCoordinates(canvas, event) {
    const rect = canvas.getBoundingClientRect();

    // We don't need to scale coordinates manually because the canvas context 
    // is already scaled by window.devicePixelRatio in resizeCanvas function.
    // We just need the coordinates relative to the canvas element in CSS pixels.

    let clientX, clientY;

    // Handle touch events
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else if (event.changedTouches && event.changedTouches.length > 0) {
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
    } else {
        // Mouse events
        clientX = event.clientX;
        clientY = event.clientY;
    }

    return {
        x: clientX - rect.left,
        y: clientY - rect.top,
    };
}

/**
 * Draw a line between two points
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} from - Starting point { x, y }
 * @param {Object} to - Ending point { x, y }
 * @param {string} color - Line color
 * @param {number} lineWidth - Line width
 */
export function drawLine(ctx, from, to, color, lineWidth) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
}

/**
 * Draw a complete path (array of points)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} points - Array of { x, y } points
 * @param {string} color - Line color
 * @param {number} lineWidth - Line width
 */
export function drawPath(ctx, points, color, lineWidth) {
    if (!points || points.length === 0) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.stroke();
}

/**
 * Draw a smooth path using quadratic curves
 * Provides smoother lines than simple lineTo
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} points - Array of { x, y } points
 * @param {string} color - Line color
 * @param {number} lineWidth - Line width
 */
export function drawSmoothPath(ctx, points, color, lineWidth) {
    if (!points || points.length === 0) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    if (points.length === 1) {
        // Single point - draw a dot
        ctx.lineTo(points[0].x + 0.1, points[0].y + 0.1);
    } else if (points.length === 2) {
        // Two points - draw a line
        ctx.lineTo(points[1].x, points[1].y);
    } else {
        // Multiple points - draw smooth curves
        for (let i = 1; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        // Draw last segment
        const lastPoint = points[points.length - 1];
        const secondLastPoint = points[points.length - 2];
        ctx.quadraticCurveTo(
            secondLastPoint.x,
            secondLastPoint.y,
            lastPoint.x,
            lastPoint.y
        );
    }

    ctx.stroke();
}

/**
 * Clear the entire canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
export function clearCanvas(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
}

/**
 * Generate a unique ID for paths
 * @returns {string} Unique identifier
 */
export function generatePathId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Throttle function to limit execution rate
 * Useful for limiting draw event frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between executions (ms)
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Get a random color from a predefined palette
 * Useful for assigning colors to users
 * @returns {string} Hex color code
 */
export function getRandomColor() {
    const colors = [
        '#6366f1', // Indigo
        '#8b5cf6', // Purple
        '#ec4899', // Pink
        '#f59e0b', // Amber
        '#10b981', // Emerald
        '#06b6d4', // Cyan
        '#f97316', // Orange
        '#14b8a6', // Teal
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Resize canvas to match display size
 * Maintains proper pixel density for high-DPI displays
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {boolean} True if canvas was resized
 */
export function resizeCanvas(canvas) {
    const { width, height } = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const newWidth = width * dpr;
    const newHeight = height * dpr;

    if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        return true;
    }

    return false;
}

/**
 * Download canvas as image
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {string} filename - Download filename
 */
export function downloadCanvas(canvas, filename = 'canvas-drawing.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
}
