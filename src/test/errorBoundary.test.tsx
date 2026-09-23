import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const BombComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test explosion in child component');
  }
  return <div>Normal Content Rendered</div>;
};

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders child components when there is no error', () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal Content Rendered')).toBeInTheDocument();
  });

  it('catches render errors and displays fallback recovery UI', () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/Growth Station encountered an unexpected issue/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /return to dashboard/i })).toBeInTheDocument();
  });

  it('calls onReset when Try Again button is clicked', () => {
    const handleReset = vi.fn();
    render(
      <ErrorBoundary onReset={handleReset}>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const tryAgainBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainBtn);

    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
