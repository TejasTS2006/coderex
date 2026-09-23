import { useState } from 'react';
import FileUpload   from './FileUpload';
import LogTextarea  from './LogTextarea';

/**
 * LogInput orchestrates the two input methods: file upload and pasted text.
 * If both are provided simultaneously, a clear indicator is shown.
 */
export default function LogInput({ logText, fileName, onLogChange, onFileLoad, onFileClear, disabled }) {
  // Mobile tab state
  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'paste'

  const hasBoth = fileName && logText.trim() && !fileName; // always false – kept for clarity

  return (
    <div className="card section-spacer">
      {/* Card title */}
      <div className="card-title">
        <span className="card-title-icon blue" aria-hidden="true">📋</span>
        <span id="log-input-heading">Deployment Log Input</span>
      </div>

      {hasBoth && (
        <div className="validation-error" role="alert">
          <span className="error-icon" aria-hidden="true">⚠</span>
          Both a file and pasted text are present. The file content will be used.
        </div>
      )}

      {/* Mobile tabs */}
      <div className="input-tabs" role="tablist" aria-label="Input method">
        <button
          className={`tab-btn${activeTab === 'file' ? ' active' : ''}`}
          role="tab"
          aria-selected={activeTab === 'file'}
          onClick={() => setActiveTab('file')}
          id="tab-file"
          aria-controls="panel-file"
        >
          📁 Upload File
        </button>
        <button
          className={`tab-btn${activeTab === 'paste' ? ' active' : ''}`}
          role="tab"
          aria-selected={activeTab === 'paste'}
          onClick={() => setActiveTab('paste')}
          id="tab-paste"
          aria-controls="panel-paste"
        >
          📝 Paste Logs
        </button>
      </div>

      {/* Two-column grid (desktop) / tabbed (mobile) */}
      <div className="log-input-grid">
        {/* File Upload panel */}
        <div
          className={`input-panel${activeTab === 'file' ? ' tab-active' : ''}`}
          id="panel-file"
          role="tabpanel"
          aria-labelledby="tab-file"
        >
          <FileUpload
            fileName={fileName}
            onFileLoad={onFileLoad}
            onFileClear={onFileClear}
            disabled={disabled}
          />
        </div>

        {/* Divider (desktop only) */}
        <div className="input-divider" aria-hidden="true">
          <div className="input-divider-line"></div>
          <span>or</span>
          <div className="input-divider-line"></div>
        </div>

        {/* Paste Logs panel */}
        <div
          className={`input-panel${activeTab === 'paste' ? ' tab-active' : ''}`}
          id="panel-paste"
          role="tabpanel"
          aria-labelledby="tab-paste"
        >
          <LogTextarea
            value={logText}
            onChange={onLogChange}
            disabled={disabled || Boolean(fileName)}
            disabledReason={fileName ? 'Clear the uploaded file to paste logs manually.' : ''}
          />
        </div>
      </div>
    </div>
  );
}
