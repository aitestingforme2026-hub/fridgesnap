/**
 * App-level tests focused on mid-session offline handling (AC-11).
 *
 * Note: jsdom cannot trigger native file inputs (<input type="file">), so we
 * cannot drive the full CAPTURE → PREVIEW → ANALYZING → INGREDIENTS flow in
 * unit tests.  The offline guard on handleFindRecipes (INGREDIENTS → RECIPES)
 * is therefore exercised at the IngredientReview component level where isOnline
 * is passed as a prop.  Here we cover what IS reachable at the App level:
 *   – Offline on HOME: banner visible, CTA disabled, no navigation.
 *   – The App correctly forwards isOnline to its children so they can render
 *     OfflineBanner when appropriate.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/hooks/useOnlineStatus.js', () => ({
  useOnlineStatus: vi.fn(() => true),
}));

vi.mock('../src/hooks/useUnitPreference.js', () => ({
  useUnitPreference: vi.fn(() => ['metric', vi.fn()]),
}));

vi.mock('../src/api/client.js', () => ({
  analyzeImage: vi.fn(),
  fetchRecipes: vi.fn(),
}));

import App from '../src/App.jsx';
import { useOnlineStatus } from '../src/hooks/useOnlineStatus.js';

describe('App — mid-session offline (AC-11)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows OfflineBanner on HOME screen and does not navigate away when offline', () => {
    useOnlineStatus.mockReturnValue(false);
    render(<App />);

    // OfflineBanner must be inline on the current screen
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/you are offline/i)).toBeInTheDocument();

    // User remains on HOME — the CaptureScreen heading ("Open Camera") is NOT shown
    expect(screen.queryByRole('button', { name: /open camera/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /snap your fridge/i })).toBeInTheDocument();
  });

  it('CTA is disabled when offline — clicking it does not navigate', () => {
    useOnlineStatus.mockReturnValue(false);
    render(<App />);

    const cta = screen.getByRole('button', { name: /snap your fridge/i });
    expect(cta).toBeDisabled();

    fireEvent.click(cta);

    // Still on HOME — CaptureScreen has an "Open Camera" button, not present here
    expect(screen.getByRole('button', { name: /snap your fridge/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /open camera/i })).not.toBeInTheDocument();
  });

  it('going online restores the CTA and removes the OfflineBanner', () => {
    useOnlineStatus.mockReturnValue(false);
    const { rerender } = render(<App />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    useOnlineStatus.mockReturnValue(true);
    rerender(<App />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /snap your fridge/i })).not.toBeDisabled();
  });
});
