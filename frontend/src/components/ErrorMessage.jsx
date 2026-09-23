/**
 * ErrorMessage – shown when the API call fails.
 */
export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-card" role="alert" aria-labelledby="error-title">
      <span className="error-icon-large" aria-hidden="true">⚠️</span>
      <div className="error-title" id="error-title">Analysis Failed</div>
      <p className="error-message">{message}</p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-sm" onClick={onRetry} aria-label="Try again from the beginning">
          ↩ Try Again
        </button>
      </div>
    </div>
  );
}
