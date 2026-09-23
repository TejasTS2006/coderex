import { MAX_INPUT_CHARS } from '../utils/validation';

const WARN_THRESHOLD = MAX_INPUT_CHARS * 0.8;

/**
 * LogTextarea – large monospace textarea for pasting raw log content.
 */
export default function LogTextarea({ value, onChange, disabled, disabledReason }) {
  const len      = value.length;
  const overLimit = len > MAX_INPUT_CHARS;
  const nearLimit = len > WARN_THRESHOLD;

  return (
    <div className="textarea-wrapper">
      <label htmlFor="log-textarea" className="sr-only">
        Paste deployment logs
      </label>

      <textarea
        id="log-textarea"
        className="log-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          disabled && disabledReason
            ? disabledReason
            : 'Paste your deployment logs or error messages here...'
        }
        disabled={disabled}
        aria-label="Deployment log content"
        aria-describedby="char-count"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
      />

      <div className="textarea-footer">
        <span
          id="char-count"
          className={`char-count${nearLimit ? ' warn' : ''}`}
          aria-live="polite"
        >
          {len.toLocaleString()} / {(MAX_INPUT_CHARS / (1024 * 1024)).toFixed(0)} MB
          {overLimit && ' — exceeds limit'}
        </span>

        {value && (
          <button
            className="clear-btn"
            onClick={() => onChange('')}
            disabled={disabled}
            aria-label="Clear pasted logs"
            type="button"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
