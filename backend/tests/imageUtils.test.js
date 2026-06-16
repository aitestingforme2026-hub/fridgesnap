'use strict';

const { checkMagicBytes } = require('../utils/imageUtils');

describe('checkMagicBytes', () => {
  // ── JPEG ──────────────────────────────────────────────────────────────────────
  it('accepts a valid JPEG buffer (FF D8 FF signature)', () => {
    const buf = Buffer.alloc(12);
    buf[0] = 0xff;
    buf[1] = 0xd8;
    buf[2] = 0xff;
    expect(checkMagicBytes(buf).valid).toBe(true);
  });

  // ── PNG ───────────────────────────────────────────────────────────────────────
  it('accepts a valid PNG buffer (89 50 4E 47 0D 0A 1A 0A signature)', () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(checkMagicBytes(buf).valid).toBe(true);
  });

  // ── HEIC/HEIF ─────────────────────────────────────────────────────────────────
  it('accepts a valid HEIC/HEIF buffer (ftyp at offset 4)', () => {
    // First 4 bytes are box size (arbitrary), then "ftyp"
    const buf = Buffer.alloc(12);
    buf[4] = 0x66; // f
    buf[5] = 0x74; // t
    buf[6] = 0x79; // y
    buf[7] = 0x70; // p
    expect(checkMagicBytes(buf).valid).toBe(true);
  });

  // ── Rejection cases ───────────────────────────────────────────────────────────
  it('rejects a plain text file spoofed as image/jpeg', () => {
    const buf = Buffer.from('this is not an image at all');
    expect(checkMagicBytes(buf).valid).toBe(false);
  });

  it('rejects a ZIP file (PK signature)', () => {
    const buf = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(checkMagicBytes(buf).valid).toBe(false);
  });

  it('rejects an EXE/PE file (MZ signature)', () => {
    const buf = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(checkMagicBytes(buf).valid).toBe(false);
  });

  it('rejects a buffer shorter than 12 bytes', () => {
    const buf = Buffer.from([0xff, 0xd8]);
    expect(checkMagicBytes(buf).valid).toBe(false);
  });

  it('rejects null/undefined input', () => {
    expect(checkMagicBytes(null).valid).toBe(false);
    expect(checkMagicBytes(undefined).valid).toBe(false);
  });
});
