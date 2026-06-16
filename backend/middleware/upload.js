/**
 * Multer middleware — in-memory image upload only.
 * No image data is ever written to disk.
 *
 * Accepted MIME types : image/jpeg, image/png, image/heic, image/heif
 * Maximum file size   : 10 MB
 */

const multer = require('multer');

const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (ACCEPTED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error('Invalid file type. Accepted formats: JPEG, PNG, HEIC.'), {
        status: 400,
        code: 'INVALID_MIME_TYPE',
      }),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

/**
 * Express error handler specifically for Multer errors.
 * Must be used after the multer middleware in the route chain.
 */
const handleUploadError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'file_too_large',
        message: 'Image must be 10 MB or smaller.',
      });
    }
    return res.status(400).json({ error: 'upload_error', message: err.message });
  }
  if (err && err.code === 'INVALID_MIME_TYPE') {
    return res.status(400).json({ error: 'invalid_file_type', message: err.message });
  }
  next(err);
};

module.exports = { upload, handleUploadError };
