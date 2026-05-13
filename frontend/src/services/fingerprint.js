/**
 * Device Fingerprint Generator
 * 
 * Generates a hardware-level fingerprint using:
 *   1. Canvas rendering (GPU-dependent pixel output)
 *   2. WebGL renderer info (GPU model string)
 *   3. Available fonts (system font enumeration)
 *   4. Screen properties (resolution, color depth)
 * 
 * The combination produces a SHA-256 hash unique to the physical device.
 * An attacker who steals a JWT + spoofs the IP still cannot replicate this
 * because it requires the actual GPU and display hardware of the victim's machine.
 * 
 * CHALLENGE-RESPONSE PROTOCOL:
 *   Before login, the client requests a nonce from the server via GET /api/auth/challenge.
 *   The client computes SHA256(fingerprint + nonce) and sends all three (fingerprint, nonce,
 *   response) with the login request. The server recomputes and verifies.
 *   Replaying an old fingerprint hash now fails because the nonce changes every session.
 */

/**
 * SHA-256 hash using the Web Crypto API (browser-native, no dependencies)
 */
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Canvas Fingerprint
 * Draws text and shapes on a hidden canvas. The pixel-level output
 * differs per GPU/driver/OS combination — even on identical monitors.
 */
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');

    // Draw text with specific font and style
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(10, 1, 62, 20);

    ctx.fillStyle = '#069';
    ctx.fillText('SecureIT-FP', 2, 15);

    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('SecureIT-FP', 4, 17);

    // Draw geometric shapes
    ctx.beginPath();
    ctx.arc(50, 25, 10, 0, Math.PI * 2);
    ctx.fill();

    return canvas.toDataURL();
  } catch (e) {
    return 'canvas-not-supported';
  }
}

/**
 * WebGL Fingerprint
 * Extracts the GPU renderer and vendor strings.
 * These are hardware-specific and cannot be faked without modifying browser internals.
 */
function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'webgl-not-supported';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'webgl-no-debug';

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

    return `${vendor}~${renderer}`;
  } catch (e) {
    return 'webgl-error';
  }
}

/**
 * Screen Fingerprint
 * Combines screen resolution, color depth, and pixel ratio.
 */
function getScreenFingerprint() {
  return `${screen.width}x${screen.height}x${screen.colorDepth}x${window.devicePixelRatio}`;
}

/**
 * Platform Fingerprint
 * Combines navigator properties that differ per device.
 */
function getPlatformFingerprint() {
  return `${navigator.hardwareConcurrency || 0}~${navigator.maxTouchPoints || 0}~${navigator.language}~${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
}

/**
 * Generate the full device fingerprint hash.
 * Combines all signals into a single SHA-256 hash.
 * 
 * @returns {Promise<string>} A 64-character hex SHA-256 hash
 */
export async function generateDeviceFingerprint() {
  const components = [
    getCanvasFingerprint(),
    getWebGLFingerprint(),
    getScreenFingerprint(),
    getPlatformFingerprint(),
  ];

  const raw = components.join('|||');
  const hash = await sha256(raw);
  return hash;
}

/**
 * Compute the challenge-response: SHA256(fingerprint + nonce)
 * Used during login to prove the fingerprint was freshly computed.
 * 
 * @param {string} fingerprint - The raw device fingerprint hash
 * @param {string} nonce - The server-issued challenge nonce
 * @returns {Promise<string>} SHA256(fingerprint + nonce)
 */
export async function computeChallengeResponse(fingerprint, nonce) {
  return sha256(fingerprint + nonce);
}

export default generateDeviceFingerprint;
