/**
 * Validation utilities for the log input.
 * Kept separate from UI components so the rules are easy to unit-test.
 */

/** Supported file extensions (lower-cased) */
export const ALLOWED_EXTENSIONS = ['.log', '.txt', '.json'];

/** Maximum input size – 5 MB expressed in characters (UTF-16 code units) */
export const MAX_INPUT_CHARS = 5 * 1024 * 1024;

/** Maximum file size in bytes – 10 MB */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/**
 * Returns a human-readable file size string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validates the file chosen by the user.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file type "${ext}". Please upload a .log, .txt, or .json file.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'The selected file is empty. Please choose a file that contains log data.' };
  }

  if (file.size > MAX_FILE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${formatFileSize(file.size)}). Maximum allowed size is ${formatFileSize(MAX_FILE_BYTES)}.`,
    };
  }

  return { valid: true };
}

/**
 * Validates the pasted log text.
 * @param {string} text
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateTextInput(text) {
  const trimmed = (text || '').trim();

  if (!trimmed) {
    return { valid: false, error: 'Please paste log content before submitting.' };
  }

  if (trimmed.length > MAX_INPUT_CHARS) {
    return {
      valid: false,
      error: `Input is too large (${(trimmed.length / (1024 * 1024)).toFixed(1)} MB). Maximum is 5 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Top-level submission validation.
 * Checks that at least one source of log data is present.
 *
 * @param {{ logText: string, fileName: string }} input
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateSubmission({ logText, fileName }) {
  const hasText = (logText || '').trim().length > 0;
  const hasFile = Boolean(fileName);

  if (!hasText && !hasFile) {
    return {
      valid: false,
      error: 'Please upload a log file or paste deployment logs before analyzing.',
    };
  }

  if (hasText) {
    return validateTextInput(logText);
  }

  // File content is already extracted into logText when a file is loaded,
  // so reaching here means the file has been selected but text not yet read.
  return { valid: true };
}
