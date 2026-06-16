import OfflineBanner from './OfflineBanner.jsx';
import UnitPreference from './UnitPreference.jsx';

/**
 * HomeScreen — landing page with CTA, unit preference, and offline guard.
 */
export default function HomeScreen({ isOnline, unit, onUnitChange, onStart }) {
  return (
    <main className="screen" aria-label="Home">
      <header style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: 'clamp(2rem, 8vw, 3rem)',
            fontWeight: 800,
            color: 'var(--color-primary)',
            lineHeight: 1.1,
          }}
        >
          FridgeSnap
        </h1>
        <p
          style={{
            marginTop: '0.5rem',
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Snap your fridge. Get AI-powered recipe ideas in seconds.
        </p>
      </header>

      {!isOnline && (
        <div style={{ marginBottom: '1.5rem' }}>
          <OfflineBanner />
        </div>
      )}

      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '2rem',
        }}
      >
        <div
          style={{
            background: 'var(--color-primary-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{ fontSize: '4rem', marginBottom: '1rem' }}
            aria-hidden="true"
          >
            📸
          </div>
          <h2
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}
          >
            What's in your fridge?
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
            Take a photo and let AI detect your ingredients, then suggest recipes
            you can cook right now.
          </p>

          <button
            type="button"
            className="btn btn-primary btn-lg btn-full"
            onClick={onStart}
            disabled={!isOnline}
            aria-disabled={!isOnline}
            aria-describedby={!isOnline ? 'offline-cta-hint' : undefined}
          >
            Snap Your Fridge
          </button>

          {!isOnline && (
            <p
              id="offline-cta-hint"
              style={{
                marginTop: '0.75rem',
                fontSize: 'var(--font-size-sm)',
                color: '#3b0764',
              }}
              role="note"
            >
              Camera is unavailable while offline.
            </p>
          )}
        </div>

        <UnitPreference unit={unit} onUnitChange={onUnitChange} />
      </section>

      <footer
        style={{
          marginTop: '2rem',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
        }}
      >
        Images are analysed privately and never stored.
      </footer>
    </main>
  );
}
