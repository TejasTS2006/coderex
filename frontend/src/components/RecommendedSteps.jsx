/**
 * RecommendedSteps – renders the troubleshooting steps returned by the backend.
 */
export default function RecommendedSteps({ steps }) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return (
      <article className="result-card steps" aria-labelledby="steps-title">
        <div className="result-card-header">
          <div className="result-card-icon" aria-hidden="true">🛠️</div>
          <div>
            <div className="result-card-title" id="steps-title">Recommended Next Steps</div>
            <div className="result-card-subtitle">No steps returned</div>
          </div>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          The backend did not return any recommended steps for this log.
        </p>
      </article>
    );
  }

  return (
    <article className="result-card steps" aria-labelledby="steps-title">
      <div className="result-card-header">
        <div className="result-card-icon" aria-hidden="true">🛠️</div>
        <div>
          <div className="result-card-title" id="steps-title">Recommended Next Steps</div>
          <div className="result-card-subtitle">{steps.length} action{steps.length !== 1 ? 's' : ''} to resolve the issue</div>
        </div>
      </div>

      <ol className="result-list" aria-label="Recommended troubleshooting steps">
        {steps.map((step, i) => (
          <li key={i} className="result-list-item">
            <span className="item-number" aria-hidden="true">{i + 1}</span>
            <span className="item-text">{step}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
