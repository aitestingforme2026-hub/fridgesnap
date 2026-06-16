import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HomeScreen from '../src/components/HomeScreen.jsx';

const defaultProps = {
  isOnline: true,
  unit: 'metric',
  onUnitChange: vi.fn(),
  onStart: vi.fn(),
};

describe('HomeScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Snap Your Fridge CTA button', () => {
    render(<HomeScreen {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: /snap your fridge/i }),
    ).toBeInTheDocument();
  });

  it('CTA button is enabled when online', () => {
    render(<HomeScreen {...defaultProps} isOnline={true} />);
    const cta = screen.getByRole('button', { name: /snap your fridge/i });
    expect(cta).not.toBeDisabled();
  });

  it('shows OfflineBanner when offline', () => {
    render(<HomeScreen {...defaultProps} isOnline={false} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/you are offline/i)).toBeInTheDocument();
  });

  it('disables the CTA button when offline', () => {
    render(<HomeScreen {...defaultProps} isOnline={false} />);
    const cta = screen.getByRole('button', { name: /snap your fridge/i });
    expect(cta).toBeDisabled();
  });

  it('does not show OfflineBanner when online', () => {
    render(<HomeScreen {...defaultProps} isOnline={true} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders unit preference controls', () => {
    render(<HomeScreen {...defaultProps} />);
    expect(screen.getByText(/unit preference/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /metric/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /imperial/i })).toBeInTheDocument();
  });
});
