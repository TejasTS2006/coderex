import { useEffect, useState } from 'react';

/** Visual-only stages – purely frontend animation.
 *  We do NOT claim any backend stage is complete unless the backend confirms it.
 */
const STAGES = [
  { id: 'receive',    label: 'Receiving deployment logs' },
  { id: 'process',   label: 'Processing log information' },
  { id: 'analyze',   label: 'Running AI analysis' },
  { id: 'generate',  label: 'Generating recommendations' },
];

export default function LoadingState() {
  const [activeStage, setActiveStage] = useState(0);

  // Cycle through visual stages every 1.8 s
  useEffect(() => {
    if (activeStage >= STAGES.length - 1) return;
    const t = setTimeout(() => setActiveStage((s) => s + 1), 1800);
    return () => clearTimeout(t);
  }, [activeStage]);

  return (
    <div className="loading-wrapper" role="status" aria-live="polite" aria-label="Analyzing deployment logs">
      {/* Orbital spinner */}
      <div className="loading-orbital" aria-hidden="true">
        <div className="orbital-ring"></div>
        <div className="orbital-ring"></div>
        <div className="orbital-core">⚡</div>
        <div className="orbital-dot"></div>
      </div>

      {/* Text */}
      <div className="loading-text-group">
        <div className="loading-title">Analyzing deployment logs…</div>
        <div className="loading-subtitle">The AI engine is processing your log data</div>
      </div>

      {/* Progress bar */}
      <div className="loading-progress-bar" aria-hidden="true">
        <div className="loading-progress-fill"></div>
      </div>

      {/* Stage list (visual only) */}
      <div className="loading-stages" aria-hidden="true">
        {STAGES.map((stage, i) => {
          const isDone   = i < activeStage;
          const isActive = i === activeStage;
          return (
            <div
              key={stage.id}
              className={`stage-item${isDone ? ' done' : isActive ? ' active' : ''}`}
            >
              <div className="stage-icon">
                {isDone   ? '✓' : isActive ? <span className="stage-spinner"></span> : ''}
              </div>
              {stage.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
