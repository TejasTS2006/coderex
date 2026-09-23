/**
 * SummaryCard – displays the LLM-generated analysis summary.
 * Text comes from the backend; nothing is generated on the frontend.
 */
export default function SummaryCard({ summary }) {
  return (
    <article className="result-card summary" aria-labelledby="summary-title">
      <div className="result-card-header">
        <div className="result-card-icon" aria-hidden="true">📊</div>
        <div>
          <div className="result-card-title" id="summary-title">Analysis Summary</div>
          <div className="result-card-subtitle">AI-generated overview of the deployment issue</div>
        </div>
      </div>

      <p className="summary-text">{summary}</p>
    </article>
  );
}
