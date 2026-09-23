export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      {/* Badge */}
      <div className="hero-badge" aria-hidden="true">
        <span className="hero-badge-dot"></span>
        AI-Powered DevOps Analysis
      </div>

      {/* Heading */}
      <h1 id="hero-heading">
        AI-Powered{' '}
        <span className="gradient-text">Deployment Troubleshooting</span>
      </h1>

      <p className="hero-description">
        Upload or paste your deployment logs to identify probable causes and receive
        actionable troubleshooting steps — powered by AI.
      </p>

      {/* Animated flow diagram */}
      <div className="hero-visual" aria-hidden="true">
        <div className="hero-diagram">
          <div className="diagram-node">
            <div className="diagram-icon log-icon">📄</div>
            <span className="diagram-label">Log File</span>
          </div>

          <div className="diagram-arrow">
            <div className="arrow-line"></div>
            <span className="arrow-head">▶</span>
          </div>

          <div className="diagram-node">
            <div className="diagram-icon ai-icon">⚡</div>
            <span className="diagram-label">AI Engine</span>
          </div>

          <div className="diagram-arrow">
            <div className="arrow-line"></div>
            <span className="arrow-head">▶</span>
          </div>

          <div className="diagram-node">
            <div className="diagram-icon result-icon">✅</div>
            <span className="diagram-label">Insights</span>
          </div>
        </div>
      </div>

      {/* Quick-reference stats (factual, not fake data) */}
      <div className="hero-stats" aria-label="Supported capabilities">
        <div className="hero-stat">
          <div className="hero-stat-value">3</div>
          <div className="hero-stat-label">File formats</div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-value">AI</div>
          <div className="hero-stat-label">Powered analysis</div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-value">RAG</div>
          <div className="hero-stat-label">Knowledge retrieval</div>
        </div>
      </div>
    </section>
  );
}
