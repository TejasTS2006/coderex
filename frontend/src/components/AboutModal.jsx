export default function AboutModal({ onClose }) {
  // Close on Escape key
  const handleKey = (e) => { if (e.key === 'Escape') onClose(); };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleKey}
    >
      <div className="modal">
        <button className="modal-close" onClick={onClose} aria-label="Close About dialog">✕</button>

        <p className="modal-subtitle">About this tool</p>
        <h2 id="about-title">AI Deployment Troubleshooter</h2>

        <p>
          AI Deployment Troubleshooter is designed to assist DevOps and IT maintenance teams by
          analyzing deployment logs and presenting a human-readable summary, probable causes, and
          recommended troubleshooting steps.
        </p>

        <hr className="modal-divider" />

        <ul className="modal-features" aria-label="Key features">
          <li>
            <span className="feat-icon">📋</span>
            Upload <code>.log</code>, <code>.txt</code>, or <code>.json</code> deployment files — or paste logs directly.
          </li>
          <li>
            <span className="feat-icon">🤖</span>
            Logs are analyzed by a backend AI agent backed by a RAG knowledge base.
          </li>
          <li>
            <span className="feat-icon">📊</span>
            Results include an analysis summary, probable causes, and recommended next steps.
          </li>
          <li>
            <span className="feat-icon">🔌</span>
            The frontend communicates only with <code>POST /api/analyze</code> — all AI/RAG/LLM logic is handled by the backend.
          </li>
        </ul>

        <hr className="modal-divider" />

        <p className="modal-footer-note">
          Built for TCS Hackathon — Frontend by React + Vite. AI, RAG, and log-processing modules
          are built and maintained by separate team members.
        </p>

        <button className="btn btn-secondary btn-sm btn-full modal-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
