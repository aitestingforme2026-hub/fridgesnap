'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const analyzeRouter = require('./routes/analyze');
const recipesRouter = require('./routes/recipes');

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ─────────────────────────────────────────────────────────────────────
// Allow requests from the Vercel frontend (set FRONTEND_URL env var on Render)
// Falls back to permissive wildcard if not set, so local dev still works.
const allowedOrigin = process.env.FRONTEND_URL || '*';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// ── Global middleware ────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/analyze', analyzeRouter);
app.use('/api/recipes', recipesRouter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'not_found', message: 'Endpoint not found.' });
});

// ── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // Never leak the OpenAI API key or internal stack traces
  console.error('[FridgeSnap] Unhandled error:', err.message);
  res.status(500).json({ error: 'internal_error', message: 'An unexpected error occurred.' });
});

// ── Start server (only when run directly, not during tests) ──────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[FridgeSnap] Server running on port ${PORT}`);
  });
}

module.exports = app;
