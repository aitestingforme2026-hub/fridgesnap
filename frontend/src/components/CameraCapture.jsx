import { useRef, useState } from 'react';

/**
 * Detect whether this browser can decode a HEIC file via an Image element.
 * Resolves to true if decodable, false if not.
 */
function canBrowserDecodeHeic(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(true); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
    img.src = url;
  });
}

/**
 * Compress an image File to under targetBytes using canvas.
 * HEIC files on browsers that cannot decode them (e.g. Android Chrome) are
 * returned raw without compression.
 * Returns a new File (image/jpeg) or the original File for raw-passthrough cases.
 */
async function compressImage(file, targetBytes = 3 * 1024 * 1024) {
  // HEIC passthrough: if the browser can't decode HEIC, skip canvas compression
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif');

  if (isHeic) {
    const canDecode = await canBrowserDecodeHeic(file);
    if (!canDecode) {
      // Return raw — backend/OpenAI will handle it or the upload will fail gracefully
      return file;
    }
  }

  if (file.size <= targetBytes) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Scale down dimensions proportionally until likely under target
      const scaleFactor = Math.sqrt(targetBytes / file.size) * 0.9;
      width = Math.round(width * scaleFactor);
      height = Math.round(height * scaleFactor);

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas compression failed'));
            return;
          }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.82,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = url;
  });
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];

/**
 * CameraCapture — mobile camera or file-upload picker.
 * Calls onImageSelected(File) when the user picks a valid image.
 */
export default function CameraCapture({ onImageSelected, onBack }) {
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const [error, setError] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [cameraDenied, setCameraDenied] = useState(false);
  const [heicNote, setHeicNote] = useState(false);

  const handleFileChange = async (file) => {
    if (!file) return;

    setError(null);

    const isHeicFile =
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif');

    if (!ACCEPTED_TYPES.includes(file.type) && !isHeicFile) {
      setError('Unsupported file type. Please use a JPEG, PNG, or HEIC photo.');
      return;
    }

    if (isHeicFile) {
      setHeicNote(true);
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError('This photo is too large (max 10 MB). Please choose a smaller image.');
      return;
    }

    try {
      setIsCompressing(true);
      const compressed = await compressImage(file);
      onImageSelected(compressed);
    } catch {
      setError('We had trouble preparing that image. Please try again.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleCameraChange = async (e) => {
    try {
      await handleFileChange(e.target.files?.[0]);
    } catch (err) {
      if (err && (err.name === 'NotAllowedError' || err.message === 'NotAllowedError')) {
        setCameraDenied(true);
        setError(
          'Camera access was denied. You can still upload a photo using the button below.',
        );
      }
    }
  };

  const handleUploadChange = (e) => handleFileChange(e.target.files?.[0]);

  return (
    <main className="screen" aria-label="Capture or upload a fridge photo">
      <button
        type="button"
        className="btn btn-ghost"
        onClick={onBack}
        style={{ alignSelf: 'flex-start', marginBottom: '1rem' }}
        aria-label="Go back to home screen"
      >
        ← Back
      </button>

      <h1
        style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 700,
          marginBottom: '0.5rem',
        }}
      >
        Take a Photo
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
        Open your camera or choose an existing photo from your device.
      </p>

      {error && (
        <div className="error-box" role="alert" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {heicNote && !error && (
        <div role="status" aria-live="polite" style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Note: HEIC files may take longer to upload.
        </div>
      )}

      {isCompressing && (
        <div role="status" aria-live="polite" style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
          Preparing your photo…
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Camera input — mobile native camera */}
        <div>
          <label htmlFor="camera-input" className="visually-hidden">
            Open camera to take a photo
          </label>
          <input
            id="camera-input"
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="visually-hidden"
            onChange={handleCameraChange}
            aria-label="Open camera to take a photo"
          />
          <button
            type="button"
            className="btn btn-primary btn-full btn-lg"
            onClick={() => {
              try {
                cameraInputRef.current?.click();
              } catch (err) {
                if (err && err.name === 'NotAllowedError') {
                  setCameraDenied(true);
                  setError(
                    'Camera access was denied. You can still upload a photo using the button below.',
                  );
                }
              }
            }}
            disabled={isCompressing}
          >
            <span aria-hidden="true">📷</span> Open Camera
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--color-text-muted)',
          }}
          aria-hidden="true"
        >
          <hr style={{ flex: 1, borderColor: 'var(--color-border)' }} />
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>or</span>
          <hr style={{ flex: 1, borderColor: 'var(--color-border)' }} />
        </div>

        {/* Upload input — file picker, always visible */}
        <div>
          <label htmlFor="upload-input" className="visually-hidden">
            Choose a photo from your device
          </label>
          <input
            id="upload-input"
            ref={uploadInputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/heif"
            className="visually-hidden"
            onChange={handleUploadChange}
            aria-label="Choose a photo from your device"
          />
          <button
            type="button"
            className={`btn btn-full btn-lg ${cameraDenied ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => uploadInputRef.current?.click()}
            disabled={isCompressing}
            aria-label={cameraDenied ? 'Upload a photo (recommended — camera access denied)' : undefined}
          >
            <span aria-hidden="true">📁</span> Upload a Photo
          </button>
        </div>
      </div>

      <p
        style={{
          marginTop: '2rem',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
        }}
      >
        Accepted formats: JPEG, PNG, HEIC — max 10 MB.
        <br />
        If camera access is blocked, use the "Upload a Photo" button above.
      </p>
    </main>
  );
}
