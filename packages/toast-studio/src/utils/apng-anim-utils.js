/**
 * APNG (Animated PNG) Detection Utilities
 *
 * Provides robust detection of animated PNG files by reading file headers
 * and checking for the acTL (animation control) chunk.
 */

const PNG_SIG = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

/**
 * Check if bytes match PNG signature
 * @private
 */
function _eqSig(bytes, off = 0) {
  if (bytes.length < off + 8) return false;
  for (let i = 0; i < 8; i++) if (bytes[off + i] !== PNG_SIG[i]) return false;
  return true;
}

/**
 * Convert chunk type bytes to string
 * @private
 */
function _typeToStr(bytes, off) {
  return String.fromCharCode(bytes[off], bytes[off + 1], bytes[off + 2], bytes[off + 3]);
}

/**
 * Core: tell if a PNG byte array is APNG; optionally return frame count.
 * @param {Uint8Array} bytes - The file contents
 * @returns {{isAPNG: boolean, frames: number}} Detection result with frame count
 */
export function parseAPNG(bytes) {
  if (!_eqSig(bytes, 0)) return { isAPNG: false, frames: 0 };

  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let p = 8; // after signature
  let isAPNG = false;
  let frames = 0;

  while (p + 12 <= bytes.length) {
    const length = dv.getUint32(p, false);      // big-endian
    const typeOff = p + 4;
    const type = _typeToStr(bytes, typeOff);
    const dataOff = p + 8;
    const next = dataOff + length + 4; // skip CRC

    // Safety
    if (next > bytes.length) break;

    if (type === 'acTL') {
      isAPNG = true;
      // num_frames is first 4 bytes of acTL data
      if (length >= 4) frames = dv.getUint32(dataOff, false);
      // We could continue to confirm, but acTL presence is definitive
      return { isAPNG, frames };
    }

    // Optimization: if we hit IDAT before seeing acTL, it's a normal PNG
    if (type === 'IDAT') {
      return { isAPNG: false, frames: 0 };
    }

    if (type === 'IEND') break;
    p = next;
  }

  return { isAPNG: false, frames: 0 };
}

/**
 * Convenience: boolean-only check from bytes
 * @param {Uint8Array} bytes - The file contents
 * @returns {boolean} True if the PNG is animated
 */
export function isAPNG(bytes) {
  return parseAPNG(bytes).isAPNG;
}

/**
 * From a URL that Foundry serves (tiles, tokens, etc.)
 * @param {string} src - The URL to fetch
 * @returns {Promise<boolean>} True if the PNG is animated
 */
export async function isAPNGFromURL(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) {
      console.warn(`Toast | Failed to fetch ${src}: ${res.status}`);
      return false;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    return isAPNG(buf);
  } catch (err) {
    console.warn(`Toast | Error checking APNG for ${src}:`, err);
    return false;
  }
}

/**
 * Get APNG frame count (0 for non-APNG) from URL
 * @param {string} src - The URL to fetch
 * @returns {Promise<number>} Number of animation frames (0 if not animated)
 */
export async function apngFrameCountFromURL(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) {
      console.warn(`Toast | Failed to fetch ${src}: ${res.status}`);
      return 0;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    return parseAPNG(buf).frames;
  } catch (err) {
    console.warn(`Toast | Error checking APNG frame count for ${src}:`, err);
    return 0;
  }
}

/**
 * From a Blob/File (e.g., FilePicker)
 * @param {Blob} blob - The blob/file to check
 * @returns {Promise<boolean>} True if the PNG is animated
 */
export async function isAPNGFromBlob(blob) {
  try {
    const buf = new Uint8Array(await blob.arrayBuffer());
    return isAPNG(buf);
  } catch (err) {
    console.warn(`Toast | Error checking APNG from blob:`, err);
    return false;
  }
}
