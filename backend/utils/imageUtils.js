/**
 * imageUtils.js
 *
 * Helpers for image validation and safe in-memory buffer disposal.
 * Images are NEVER written to disk at any point.
 */

const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validate that an uploaded file object (from Multer memoryStorage) is a
 * non-empty, acceptable image within the size limit.
 *
 * @param {Express.Multer.File | undefined} file
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateImage(file) {
  if (!file) {
    return { valid: false, reason: 'No image file was provided.' };
  }
  if (!ACCEPTED_MIME_TYPES.has(file.mimetype)) {
    return {
      valid: false,
      reason: 'Invalid file type. Accepted formats: JPEG, PNG, HEIC.',
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, reason: 'Image must be 10 MB or smaller.' };
  }
  if (!file.buffer || file.buffer.length === 0) {
    return { valid: false, reason: 'Image file appears to be empty.' };
  }
  return { valid: true };
}

/**
 * Verify the actual file content using magic bytes (file signature).
 * This guards against Content-Type spoofing where a non-image multipart
 * part declares an image MIME type but contains arbitrary binary data.
 *
 * Supported signatures:
 *   JPEG  — FF D8 FF                   (bytes 0–2)
 *   PNG   — 89 50 4E 47 0D 0A 1A 0A   (bytes 0–7)
 *   HEIC/HEIF — "ftyp" at offset 4    (bytes 4–7 === 66 74 79 70)
 *
 * @param {Buffer} buffer
 * @returns {{ valid: boolean }}
 */
function checkMagicBytes(buffer) {
  if (!buffer || buffer.length < 12) {
    return { valid: false };
  }

  // JPEG: starts with FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true };
  }

  // PNG: starts with 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true };
  }

  // HEIC/HEIF: bytes 4–7 spell "ftyp" (66 74 79 70)
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    return { valid: true };
  }

  return { valid: false };
}

module.exports = { validateImage, checkMagicBytes };

