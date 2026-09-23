import SummaryCard       from './SummaryCard';
import ProbableCauses    from './ProbableCauses';
import RecommendedSteps  from './RecommendedSteps';

/**
 * AnalysisResult – top-level results layout.
 * Renders whatever the backend returns; optional fields degrade gracefully.
 */
export default function AnalysisResult({ result, onReset }) {
  const {
    summary,
    probable_causes,
    recommended_steps,
    // Optional metadata – displayed if present
    error_type,
    severity,
    confidence,
    relevant_error,
    processing_time,
  } = result;

  const hasMeta = error_type || severity || confidence || relevant_error || processing_time;

  return (
    <div>
      {/* Result header */}
      <div className="result-header">
        <div className="result-title-group">
          <div className="result-eyebrow">Analysis Complete</div>
          <h2 className="result-heading" id="results-heading">Troubleshooting Report</h2>
        </div>

        <div className="result-actions">
          <button className="btn btn-secondary btn-sm" onClick={onReset} aria-label="Clear and analyze another log">
            ↩ Analyze Another Deployment
          </button>
        </div>
      </div>

      {/* Optional metadata chips */}
      {hasMeta && (
        <div className="metadata-grid" aria-label="Analysis metadata">
          {error_type && (
            <div className="metadata-chip">
              <span className="metadata-chip-label">Error Type</span>
              <span className="metadata-chip-value">{error_type}</span>
            </div>
          )}
          {severity && (
            <div className="metadata-chip">
              <span className="metadata-chip-label">Severity</span>
              <span className={`metadata-chip-value severity-${severity.toLowerCase()}`}>{severity}</span>
            </div>
          )}
          {confidence && (
            <div className="metadata-chip">
              <span className="metadata-chip-label">Confidence</span>
              <span className="metadata-chip-value">{confidence}</span>
            </div>
          )}
          {relevant_error && (
            <div className="metadata-chip">
              <span className="metadata-chip-label">Relevant Error</span>
              <span className="metadata-chip-value">{relevant_error}</span>
            </div>
          )}
          {processing_time && (
            <div className="metadata-chip">
              <span className="metadata-chip-label">Processing Time</span>
              <span className="metadata-chip-value">{processing_time}</span>
            </div>
          )}
        </div>
      )}

      {/* Main result cards */}
      <div className="result-grid" style={{ marginTop: hasMeta ? 24 : 0 }}>
        <SummaryCard      summary={summary} />
        <ProbableCauses   causes={probable_causes} />
        <RecommendedSteps steps={recommended_steps} />
      </div>

      {/* Bottom reset */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
        <button className="btn btn-secondary btn-md" onClick={onReset} aria-label="Start a new analysis">
          ↩ &nbsp;Start New Analysis
        </button>
      </div>
    </div>
  );
}
