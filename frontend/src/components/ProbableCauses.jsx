/**
 * ProbableCauses – renders the list of probable causes returned by the backend.
 */
export default function ProbableCauses({ causes }) {
  if (!Array.isArray(causes) || causes.length === 0) {
    return (
      <article className="result-card causes" aria-labelledby="causes-title">
        <div className="result-card-header">
          <div className="result-card-icon" aria-hidden="true">🔍</div>
          <div>
            <div className="result-card-title" id="causes-title">Probable Causes</div>
            <div className="result-card-subtitle">No causes were identified</div>
          </div>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          The backend did not return any probable causes for this log.
        </p>
      </article>
    );
  }

  return (
    <article className="result-card causes" aria-labelledby="causes-title">
      <div className="result-card-header">
        <div className="result-card-icon" aria-hidden="true">🔍</div>
        <div>
          <div className="result-card-title" id="causes-title">Probable Causes</div>
          <div className="result-card-subtitle">{causes.length} potential root cause{causes.length !== 1 ? 's' : ''} identified</div>
        </div>
      </div>

      <ol className="result-list" aria-label="Probable causes list">
        {causes.map((cause, i) => (
          <li key={i} className="result-list-item">
            <span className="item-number" aria-hidden="true">{i + 1}</span>
            <span className="item-text">{cause}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
