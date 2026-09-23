import { useRef, useState } from 'react';
import { validateFile, formatFileSize } from '../utils/validation';

/**
 * FileUpload – handles drag-and-drop + browse-button file selection.
 * Reads the file text and bubbles it up via onFileLoad({ text, name }).
 */
export default function FileUpload({ fileName, onFileLoad, onFileClear, disabled }) {
  const inputRef   = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState('');
  const [fileSize, setFileSize]     = useState('');

  function processFile(file) {
    setLocalError('');
    const { valid, error } = validateFile(file);
    if (!valid) { setLocalError(error); return; }

    setFileSize(formatFileSize(file.size));

    const reader = new FileReader();
    reader.onload = (e) => onFileLoad({ text: e.target.result, name: file.name });
    reader.onerror = () => setLocalError('Failed to read the file. Please try again.');
    reader.readAsText(file);
  }

  // Drag events
  const onDragOver  = (e) => { e.preventDefault(); if (!disabled) setDragOver(true); };
  const onDragLeave = ()  => setDragOver(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  // Click browse
  const onInputChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const openPicker = () => !disabled && !fileName && inputRef.current?.click();

  const zoneClass = [
    'file-upload-zone',
    dragOver   ? 'drag-over' : '',
    fileName   ? 'has-file'  : '',
    disabled   ? 'disabled'  : '',
  ].filter(Boolean).join(' ');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        id="file-input"
        type="file"
        accept=".log,.txt,.json"
        className="file-input-hidden"
        onChange={onInputChange}
        aria-label="Upload deployment log file"
        disabled={disabled}
        tabIndex={-1}
      />

      <div
        className={zoneClass}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={openPicker}
        role="button"
        tabIndex={disabled || fileName ? -1 : 0}
        aria-label={fileName ? `File loaded: ${fileName}` : 'Drop a log file here or click to browse'}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openPicker(); }}
      >
        {fileName ? (
          /* File loaded state */
          <>
            <div className="upload-icon-wrapper" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }}>
              ✅
            </div>
            <div className="upload-title" style={{ color: 'var(--color-success)' }}>File loaded</div>
            <div className="file-info">
              <span className="file-info-icon">📄</span>
              <div className="file-info-details">
                <div className="file-info-name" title={fileName}>{fileName}</div>
                <div className="file-info-size">{fileSize}</div>
              </div>
              <button
                className="file-remove-btn"
                onClick={(e) => { e.stopPropagation(); onFileClear(); setLocalError(''); }}
                aria-label={`Remove file ${fileName}`}
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          /* Default / drag state */
          <>
            <div className="upload-icon-wrapper">
              {dragOver ? '📂' : '📁'}
            </div>
            <div className="upload-title">
              {dragOver ? 'Drop to upload' : 'Drag & drop your log file here'}
            </div>
            <div className="upload-subtitle">or</div>
            <button
              className="upload-browse-btn"
              onClick={(e) => { e.stopPropagation(); openPicker(); }}
              aria-label="Browse files to upload"
              type="button"
            >
              Browse Files
            </button>
            <div className="upload-formats">Supports .log · .txt · .json — max 10 MB</div>
          </>
        )}
      </div>

      {localError && (
        <div className="validation-error" role="alert" style={{ marginTop: 12 }}>
          <span className="error-icon" aria-hidden="true">⚠</span>
          {localError}
        </div>
      )}
    </div>
  );
}
