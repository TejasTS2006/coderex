/**
 * AnalyzeButton – the primary CTA.
 * Shows a spinner during loading and prevents duplicate submissions.
 */
export default function AnalyzeButton({ onClick, isLoading, disabled }) {
  return (
    <button
      className={`btn-analyze${isLoading ? ' loading' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={isLoading ? 'Analysis in progress, please wait' : 'Analyze deployment logs'}
      aria-busy={isLoading}
      type="button"
    >
      {isLoading ? (
        <>
          <span className="btn-spinner" aria-hidden="true"></span>
          Analyzing Deployment…
        </>
      ) : (
        <>
          <span className="btn-icon" aria-hidden="true">⚡</span>
          Analyze Deployment
        </>
      )}
    </button>
  );
}
