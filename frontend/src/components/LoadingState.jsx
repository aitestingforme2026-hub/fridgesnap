/**
 * LoadingState — full-screen spinner shown during API calls.
 */
export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="loading-container" role="status" aria-live="polite" aria-label={message}>
      <div className="spinner" aria-hidden="true" />
      <p className="loading-message">{message}</p>
    </div>
  );
}
