import { useState } from 'react';
import './styles/index.css';

import Header     from './components/Header';
import Hero       from './components/Hero';
import LogInput   from './components/LogInput';
import AnalyzeButton from './components/AnalyzeButton';
import LoadingState  from './components/LoadingState';
import AnalysisResult from './components/AnalysisResult';
import ErrorMessage  from './components/ErrorMessage';

import { analyzeDeployment } from './services/api';
import { validateSubmission } from './utils/validation';

/** Top-level application state machine:
 *  idle → loading → success | error
 */
export default function App() {
  // --- input state ---
  const [logText, setLogText] = useState('');
  const [fileName, setFileName] = useState('');

  // --- UI state ---
  const [status, setStatus]         = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [result, setResult]         = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleLogChange(text) {
    setLogText(text);
    setValidationError('');
  }

  function handleFileLoad({ text, name }) {
    setLogText(text);
    setFileName(name);
    setValidationError('');
  }

  function handleFileClear() {
    setLogText('');
    setFileName('');
    setValidationError('');
  }

  async function handleAnalyze() {
    // Validate before sending
    const validation = validateSubmission({ logText, fileName });
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    setValidationError('');
    setStatus('loading');
    setResult(null);
    setErrorMessage('');

    try {
      const data = await analyzeDeployment(logText);
      setResult(data);
      setStatus('success');
    } catch (err) {
      console.error('[App] Analysis failed:', err);
      setErrorMessage(err.message || 'Unable to analyze the deployment logs. Please try again.');
      setStatus('error');
    }
  }

  function handleReset() {
    setLogText('');
    setFileName('');
    setStatus('idle');
    setResult(null);
    setErrorMessage('');
    setValidationError('');
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const isLoading = status === 'loading';
  const hasResult = status === 'success' && result !== null;
  const hasError  = status === 'error';

  return (
    <div className="app-root">
      <Header />

      <main className="main-content" id="main-content">
        {/* Hero is shown when idle (no result yet) */}
        {!hasResult && <Hero />}

        {/* Input section – hidden while loading or showing results */}
        {!hasResult && !isLoading && (
          <section className="section" aria-labelledby="log-input-heading">
            <LogInput
              logText={logText}
              fileName={fileName}
              onLogChange={handleLogChange}
              onFileLoad={handleFileLoad}
              onFileClear={handleFileClear}
              disabled={isLoading}
            />

            {validationError && (
              <div className="validation-error" role="alert" aria-live="polite">
                <span className="error-icon" aria-hidden="true">⚠</span>
                {validationError}
              </div>
            )}

            <div className="analyze-wrapper">
              <AnalyzeButton
                onClick={handleAnalyze}
                isLoading={isLoading}
                disabled={isLoading || (!logText.trim() && !fileName)}
              />
            </div>
          </section>
        )}

        {/* Loading state */}
        {isLoading && <LoadingState />}

        {/* Error state */}
        {hasError && (
          <section className="section">
            <ErrorMessage message={errorMessage} onRetry={handleReset} />
          </section>
        )}

        {/* Results */}
        {hasResult && (
          <section className="section" aria-labelledby="results-heading">
            <AnalysisResult result={result} onReset={handleReset} />
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>AI Deployment Troubleshooter &mdash; TCS Hackathon Project</p>
      </footer>
    </div>
  );
}
