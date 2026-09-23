/**
 * API Service – the single integration point between the React frontend and the backend.
 *
 * The backend is expected to expose:
 *   POST /api/analyze
 *   Body : { "log": "<raw log text>" }
 *   Response: {
 *     "summary": "...",
 *     "probable_causes": ["...", "..."],
 *     "recommended_steps": ["...", "..."]
 *   }
 *
 * Optional fields (displayed if present, ignored otherwise):
 *   error_type, severity, confidence, relevant_error, processing_time
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';

// ---------------------------------------------------------------------------
// MOCK RESPONSE – development only. Never used in production.
// ---------------------------------------------------------------------------
const MOCK_RESPONSE = {
  summary:
    'The deployment failed during application startup because the application could not establish a connection with the configured database.',
  probable_causes: [
    'Database service may be unavailable or not running',
    'Incorrect database host or port configured in environment variables',
    'Network connectivity issue between the application and the database server',
    'Firewall or security-group rule blocking the database port',
  ],
  recommended_steps: [
    'Verify the database service is running: systemctl status postgresql (or your DB service)',
    'Check the DB_HOST and DB_PORT environment variables match the actual database server',
    'Test network connectivity: telnet <DB_HOST> <DB_PORT> or nc -zv <DB_HOST> <DB_PORT>',
    'Review firewall/security-group rules to ensure the database port is reachable from the app host',
    'Check application logs for the exact error code returned by the database driver',
  ],
  // Optional metadata fields – backend may or may not return these
  error_type: 'DatabaseConnectionError',
  severity: 'Critical',
  processing_time: '1.24s',
};

/**
 * Simulates a network delay for realistic mock behaviour.
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends a deployment log to the backend for analysis.
 *
 * @param {string} log  – Raw text content of the deployment log.
 * @returns {Promise<object>}  – Resolved with the analysis result object.
 * @throws {Error}             – On network failure, non-2xx HTTP status, or invalid JSON.
 */
export async function analyzeDeployment(log) {
  if (USE_MOCK) {
    // -----------------------------------------------------------------------
    // MOCK PATH – only active when VITE_USE_MOCK_API=true
    // -----------------------------------------------------------------------
    console.info('[api.js] Mock API enabled – returning sample response.');
    await delay(2500); // Simulate backend processing time
    return MOCK_RESPONSE;
  }

  // -------------------------------------------------------------------------
  // REAL API PATH
  // -------------------------------------------------------------------------
  const endpoint = `${BASE_URL}/api/analyze`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log }),
    });
  } catch (networkError) {
    // Covers: server unreachable, DNS failure, CORS preflight failure, etc.
    console.error('[api.js] Network error:', networkError);
    throw new Error(
      'Unable to reach the analysis server. Please check your network connection and ensure the backend is running.'
    );
  }

  if (!response.ok) {
    let detail = '';
    try {
      const errBody = await response.json();
      detail = errBody.detail || errBody.message || JSON.stringify(errBody);
    } catch {
      detail = await response.text().catch(() => '');
    }

    console.error(`[api.js] HTTP ${response.status}:`, detail);

    if (response.status === 400) {
      throw new Error('The server rejected the request (400). Please verify the log format and try again.');
    }
    if (response.status === 422) {
      throw new Error('The server could not process the provided log data (422). Check that the log is not empty.');
    }
    if (response.status >= 500) {
      throw new Error('The analysis server encountered an internal error (500). Please try again later.');
    }
    throw new Error(`Unexpected error from the server (${response.status}). Please try again.`);
  }

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    console.error('[api.js] Failed to parse response JSON:', parseError);
    throw new Error('Received an invalid response from the server. Please try again.');
  }

  // Basic shape validation so broken responses fail early with a clear message
  if (!data.summary || !Array.isArray(data.probable_causes) || !Array.isArray(data.recommended_steps)) {
    console.error('[api.js] Unexpected response shape:', data);
    throw new Error('The server response was missing required fields. Please contact the backend team.');
  }

  return data;
}
