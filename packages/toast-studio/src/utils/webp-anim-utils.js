/**
 * WebP Animation Detection Utilities
 *
 * Provides robust detection of animated WebP files by reading file headers
 * rather than relying on file extension alone.
 */

/**
 * Convert bytes to ASCII string
 * @private
 */
function _str(bytes, off, len) {
  // Avoid allocating TextDecoder repeatedly; tiny enough for convenience:
  return new TextDecoder("ascii").decode(bytes.subarray(off, off + len));
}

/**
 * Core check from a Uint8Array of the file contents
 * @param {Uint8Array} bytes - The file contents
 * @returns {boolean} True if the WebP is animated
 */
export function isWebPAnimated(bytes) {
  if (bytes.length < 12) return false;
  if (_str(bytes, 0, 4) !== "RIFF" || _str(bytes, 8, 4) !== "WEBP") return false;

  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let i = 12;
  while (i + 8 <= bytes.length) {
    const fourcc = _str(bytes, i, 4);
    const size = dv.getUint32(i + 4, true);
    const start = i + 8;

    // VP8X feature flags (byte 0 of payload). Bit 1 (0x02) = animation.
    if (fourcc === "VP8X" && size >= 1) {
      const features = bytes[start];
      if (features & 0x02) return true;
    }
    // ANIM chunk definitively indicates an animated WebP
    if (fourcc === "ANIM") return true;

    // chunks are padded to even sizes
    i = start + size + (size & 1);
  }
  return false;
}

/**
 * Optional: count frames (ANMF chunk occurrences)
 * @param {Uint8Array} bytes - The file contents
 * @returns {number} Number of animation frames
 */
export function countWebPFrames(bytes) {
  if (_str(bytes, 0, 4) !== "RIFF" || _str(bytes, 8, 4) !== "WEBP") return 0;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let i = 12, frames = 0;
  while (i + 8 <= bytes.length) {
    const fourcc = _str(bytes, i, 4);
    const size = dv.getUint32(i + 4, true);
    if (fourcc === "ANMF") frames += 1;
    i = i + 8 + size + (size & 1);
  }
  return frames;
}

/**
 * From a URL that Foundry serves (e.g., token/tiles artwork)
 * @param {string} src - The URL to fetch
 * @returns {Promise<boolean>} True if the WebP is animated
 */
export async function isWebPAnimatedFromURL(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) {
      console.warn(`Toast | Failed to fetch ${src}: ${res.status}`);
      return false;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    return isWebPAnimated(buf);
  } catch (err) {
    console.warn(`Toast | Error checking WebP animation for ${src}:`, err);
    return false;
  }
}

/**
 * From a Blob/File (e.g., from FilePicker onChange)
 * @param {Blob} blob - The blob/file to check
 * @returns {Promise<boolean>} True if the WebP is animated
 */
export async function isWebPAnimatedFromBlob(blob) {
  try {
    const buf = new Uint8Array(await blob.arrayBuffer());
    return isWebPAnimated(buf);
  } catch (err) {
    console.warn(`Toast | Error checking WebP animation from blob:`, err);
    return false;
  }
}
