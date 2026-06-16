/**
 * ============================================================
 * POST /api/analyze
 * ============================================================
 *
 * REQUEST
 *   Content-Type : multipart/form-data
 *   Field name   : "image"
 *   Accepted MIME: image/jpeg, image/png, image/heic, image/heif
 *   Max size     : 10 MB
 *
 * RESPONSE — 200 OK
 *   Content-Type: application/json
 *   Body:
 *   {
 *     "ingredients": [
 *       { "name": "eggs",              "confidence": 0.97 },
 *       { "name": "unknown vegetable", "confidence": 0.62, "flagged": true }
 *     ]
 *   }
 *
 *   - Items with confidence < 0.70 are flagged: { ..., "flagged": true }
 *   - Non-food items are excluded by GPT-4o (instructed in system prompt)
 *   - Image buffer is nulled immediately after the GPT-4o call returns
 *
 * ERROR RESPONSES
 *   400  { "error": "missing_image",    "message": "..." }  — no file attached
 *   400  { "error": "invalid_file_type","message": "..." }  — wrong MIME type
 *   400  { "error": "file_too_large",   "message": "..." }  — > 10 MB
 *   503  { "error": "analysis_unavailable", "message": "Our ingredient scanner is temporarily unavailable." }
 *        — OpenAI unreachable or returned a non-200
 * ============================================================
 */

'use strict';

const express = require('express');
const { upload, handleUploadError } = require('../middleware/upload');
const { validateImage, checkMagicBytes } = require('../utils/imageUtils');
const { analyzeImage } = require('../services/openai');

const router = express.Router();

router.post(
  '/',
  upload.single('image'),
  handleUploadError,
  async (req, res, next) => {
    // Validate the uploaded file
    const validation = validateImage(req.file);
    if (!validation.valid) {
      return res.status(400).json({ error: 'missing_image', message: validation.reason });
    }

    // Magic-byte validation: verify actual file signature, not just MIME header.
    // This prevents Content-Type spoofing where a non-image is labelled image/jpeg etc.
    const magicCheck = checkMagicBytes(req.file.buffer);
    if (!magicCheck.valid) {
      req.file.buffer = null;
      return res.status(400).json({
        error: 'invalid_file_type',
        message: 'File content does not match an accepted image format (JPEG, PNG, HEIC).',
      });
    }

    const mimeType = req.file.mimetype;
    // Capture the buffer reference, then immediately null the multer field so no
    // two named references to the image data coexist. The base64 string is never
    // assigned to a named const — it is passed directly as an inline argument.
    const buffer = req.file.buffer;
    req.file.buffer = null;

    // AC-06: enforce the 15-second end-to-end SLA with an AbortController.
    // The OpenAI SDK timeout (20 s) is a fallback; we cut the connection at 15 s.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    let ingredients;
    try {
      ingredients = await analyzeImage(buffer.toString('base64'), mimeType, controller.signal);
    } catch (err) {
      // Do not leak any internal error detail (could contain key info).
      // Specifically do NOT log err here — it may contain the base64 string
      // in its request payload on some SDK versions.
      const isTimeout = err.name === 'AbortError' || controller.signal.aborted;
      return res.status(503).json({
        error: 'analysis_unavailable',
        message: isTimeout
          ? 'Our ingredient scanner took too long to respond. Please try again.'
          : 'Our ingredient scanner is temporarily unavailable.',
      });
    } finally {
      clearTimeout(timeoutId);
      buffer.fill(0); // always zero raw bytes — on success, timeout, and any error
    }

    return res.json({ ingredients });
  }
);

module.exports = router;
