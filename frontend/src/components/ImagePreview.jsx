import { useEffect, useState } from 'react';

/**
 * ImagePreview — full-screen preview of the selected photo.
 * Provides "Retake" and "Use This Photo" actions.
 */
export default function ImagePreview({ imageFile, onRetake, onConfirm }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  return (
    <main
      className="screen"
      aria-label="Preview your photo"
      style={{ padding: 0, position: 'relative' }}
    >
      {previewUrl && (
        <img
          src={previewUrl}
          alt="Your selected fridge photo — ready for ingredient analysis"
          style={{
            width: '100%',
            flex: 1,
            objectFit: 'cover',
            display: 'block',
            maxHeight: '70dvh',
          }}
        />
      )}

      <div
        style={{
          padding: '1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.875rem',
          background: 'var(--color-surface)',
        }}
      >
        <h1
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          Does this look good?
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          Make sure the fridge contents are clearly visible and well-lit.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={onRetake}
          >
            Retake
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={onConfirm}
          >
            Use This Photo
          </button>
        </div>
      </div>
    </main>
  );
}
