/**
 * Calculates the relative luminance of a hex color
 * @param {string} hex - The hex color string (e.g., "#ffffff" or "#fff")
 * @returns {number} The relative luminance (0 to 1)
 */
function getLuminance(hex) {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const [rs, gs, bs] = [r, g, b].map(c => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Determines if a color is light or dark based on its luminance
 * @param {string} hex - The hex color string
 * @returns {boolean} True if the color is light, false if it is dark
 */
export function isLightColor(hex) {
    return getLuminance(hex) > 0.5; // Threshold can be adjusted
}
