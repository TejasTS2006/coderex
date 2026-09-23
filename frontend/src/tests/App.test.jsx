import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// ---------------------------------------------------------------------------
// Mock the API service so tests don't hit a real backend
// ---------------------------------------------------------------------------
vi.mock('../services/api', () => ({
  analyzeDeployment: vi.fn(),
}));

import { analyzeDeployment } from '../services/api';

const MOCK_RESULT = {
  summary: 'Test summary from backend.',
  probable_causes: ['Cause A', 'Cause B'],
  recommended_steps: ['Step 1', 'Step 2'],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getAnalyzeBtn() {
  return screen.getByRole('button', { name: /analyze deployment/i });
}

// ---------------------------------------------------------------------------
// 1. Rendering
// ---------------------------------------------------------------------------
describe('App - initial render', () => {
  it('renders the application title in the header', () => {
    render(<App />);
    expect(screen.getByText(/AI Deployment Troubleshooter/i)).toBeInTheDocument();
  });

  it('renders the hero heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders the log input section', () => {
    render(<App />);
    expect(screen.getByRole('region', { name: /deployment log input/i })).toBeInTheDocument();
  });

  it('renders the Analyze button', () => {
    render(<App />);
    expect(getAnalyzeBtn()).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2. Analyze button disabled/enabled
// ---------------------------------------------------------------------------
describe('App - Analyze button state', () => {
  it('is disabled when there is no input', () => {
    render(<App />);
    expect(getAnalyzeBtn()).toBeDisabled();
  });

  it('is enabled after typing in the textarea', async () => {
    render(<App />);
    const user = userEvent.setup();
    const textarea = screen.getByRole('textbox', { name: /deployment log content/i });
    await user.type(textarea, 'ERROR: connection refused');
    expect(getAnalyzeBtn()).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// 3. Empty input validation
// ---------------------------------------------------------------------------
describe('App - empty input validation', () => {
  it('keeps Analyze button disabled when no valid input is present', () => {
    analyzeDeployment.mockResolvedValue(MOCK_RESULT);
    render(<App />);
    // Button should be disabled with no input - API should never be called
    expect(getAnalyzeBtn()).toBeDisabled();
    expect(analyzeDeployment).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 4. Text input
// ---------------------------------------------------------------------------
describe('App - text input', () => {
  it('updates textarea value as user types', async () => {
    render(<App />);
    const user = userEvent.setup();
    const textarea = screen.getByRole('textbox', { name: /deployment log content/i });
    await user.type(textarea, 'DB connect fail');
    expect(textarea.value).toContain('DB connect fail');
  });

  it('clears textarea when Clear button is clicked', async () => {
    render(<App />);
    const user = userEvent.setup();
    const textarea = screen.getByRole('textbox', { name: /deployment log content/i });
    await user.type(textarea, 'some log');
    const clearBtn = screen.getByRole('button', { name: /clear pasted logs/i });
    await user.click(clearBtn);
    expect(textarea.value).toBe('');
  });
});

// ---------------------------------------------------------------------------
// 5. Loading state
// ---------------------------------------------------------------------------
describe('App - loading state', () => {
  it('shows loading UI after Analyze is clicked', async () => {
    analyzeDeployment.mockImplementation(() => new Promise(() => {})); // never resolves
    render(<App />);
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: /deployment log content/i }), 'log data');
    await user.click(getAnalyzeBtn());
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// 6 & 7. Successful API response
// ---------------------------------------------------------------------------
describe('App - successful result', () => {
  beforeEach(() => {
    analyzeDeployment.mockResolvedValue(MOCK_RESULT);
  });

  async function submitAndWait() {
    render(<App />);
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: /deployment log content/i }), 'test log');
    await user.click(getAnalyzeBtn());
    await waitFor(() => screen.getByText('Troubleshooting Report'));
  }

  it('renders the results section heading', async () => {
    await submitAndWait();
    expect(screen.getByText('Troubleshooting Report')).toBeInTheDocument();
  });

  it('renders the summary from the backend', async () => {
    await submitAndWait();
    expect(screen.getByText(MOCK_RESULT.summary)).toBeInTheDocument();
  });

  it('renders all probable causes', async () => {
    await submitAndWait();
    MOCK_RESULT.probable_causes.forEach((cause) => {
      expect(screen.getByText(cause)).toBeInTheDocument();
    });
  });

  it('renders all recommended steps', async () => {
    await submitAndWait();
    MOCK_RESULT.recommended_steps.forEach((step) => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// 8. API error handling
// ---------------------------------------------------------------------------
describe('App - API error', () => {
  it('shows error message when API throws', async () => {
    analyzeDeployment.mockRejectedValue(new Error('Network error'));
    render(<App />);
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: /deployment log content/i }), 'log');
    await user.click(getAnalyzeBtn());
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 9. Reset functionality
// ---------------------------------------------------------------------------
describe('App - reset', () => {
  it('returns to the input view after clicking Analyze Another Deployment', async () => {
    analyzeDeployment.mockResolvedValue(MOCK_RESULT);
    render(<App />);
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: /deployment log content/i }), 'log data');
    await user.click(getAnalyzeBtn());
    await waitFor(() => screen.getByText('Troubleshooting Report'));

    // Click the reset button
    const resetBtn = screen.getByRole('button', { name: /clear and analyze another log/i });
    await user.click(resetBtn);

    // After reset the Analyze button should be back
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /analyze deployment/i })).toBeInTheDocument();
    });
  });
});
