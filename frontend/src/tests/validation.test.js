import { describe, it, expect } from 'vitest';
import {
  validateFile,
  validateTextInput,
  validateSubmission,
  formatFileSize,
  ALLOWED_EXTENSIONS,
  MAX_FILE_BYTES,
  MAX_INPUT_CHARS,
} from '../utils/validation';

// Helper to create a mock File object
function makeFile(name, size = 1024, type = 'text/plain') {
  const content = 'a'.repeat(Math.min(size, 1000));
  const file    = new File([content], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

// ---------------------------------------------------------------------------
// formatFileSize
// ---------------------------------------------------------------------------
describe('formatFileSize', () => {
  it('formats bytes', ()    => expect(formatFileSize(512)).toBe('512 B'));
  it('formats KB',   ()    => expect(formatFileSize(2048)).toBe('2.0 KB'));
  it('formats MB',   ()    => expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB'));
});

// ---------------------------------------------------------------------------
// validateFile
// ---------------------------------------------------------------------------
describe('validateFile', () => {
  it('rejects null', () => {
    const r = validateFile(null);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/no file/i);
  });

  it('accepts .log files', () => {
    expect(validateFile(makeFile('app.log')).valid).toBe(true);
  });

  it('accepts .txt files', () => {
    expect(validateFile(makeFile('output.txt')).valid).toBe(true);
  });

  it('accepts .json files', () => {
    expect(validateFile(makeFile('report.json', 200, 'application/json')).valid).toBe(true);
  });

  it('rejects .csv files', () => {
    const r = validateFile(makeFile('data.csv'));
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/unsupported file type/i);
  });

  it('rejects empty files', () => {
    const r = validateFile(makeFile('empty.log', 0));
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/empty/i);
  });

  it('rejects files exceeding max size', () => {
    const r = validateFile(makeFile('huge.log', MAX_FILE_BYTES + 1));
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/too large/i);
  });

  it('accepts files exactly at the max size', () => {
    expect(validateFile(makeFile('edge.log', MAX_FILE_BYTES)).valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateTextInput
// ---------------------------------------------------------------------------
describe('validateTextInput', () => {
  it('rejects empty string', () => {
    const r = validateTextInput('');
    expect(r.valid).toBe(false);
  });

  it('rejects whitespace-only string', () => {
    const r = validateTextInput('   \n  \t  ');
    expect(r.valid).toBe(false);
  });

  it('accepts valid text', () => {
    expect(validateTextInput('ERROR: Connection refused').valid).toBe(true);
  });

  it('rejects text exceeding MAX_INPUT_CHARS', () => {
    const r = validateTextInput('x'.repeat(MAX_INPUT_CHARS + 1));
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/too large/i);
  });
});

// ---------------------------------------------------------------------------
// validateSubmission
// ---------------------------------------------------------------------------
describe('validateSubmission', () => {
  it('fails with no input at all', () => {
    const r = validateSubmission({ logText: '', fileName: '' });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/please upload/i);
  });

  it('passes with logText only', () => {
    expect(validateSubmission({ logText: 'log content', fileName: '' }).valid).toBe(true);
  });

  it('passes with fileName only', () => {
    // fileName provided means the file content was loaded into logText elsewhere;
    // submission validation only checks that at least one source is present.
    expect(validateSubmission({ logText: '', fileName: 'app.log' }).valid).toBe(true);
  });

  it('fails when logText is empty whitespace and no filename', () => {
    const r = validateSubmission({ logText: '   ', fileName: '' });
    expect(r.valid).toBe(false);
  });
});
