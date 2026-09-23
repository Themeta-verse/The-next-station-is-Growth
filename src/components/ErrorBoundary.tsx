import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      const isDev = Boolean(
        typeof process !== 'undefined' &&
        (process.env?.NODE_ENV === 'development' || process.env?.NODE_ENV === 'test')
      );

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-background animate-fade-in">
          <div className="max-w-md w-full bg-card rounded-2xl border border-border p-6 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground">
                {this.props.fallbackTitle || 'Something went wrong'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {this.props.fallbackDescription ||
                  'Growth Station encountered an unexpected issue while displaying this page. Your progress has been preserved.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                Return to Dashboard
              </button>
            </div>

            {(isDev || this.state.error) && (
              <div className="pt-2 border-t border-border/50 text-left">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
                >
                  <span>Technical details</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="mt-2 p-3 rounded-lg bg-muted text-[10px] font-mono text-destructive overflow-x-auto max-h-40">
                    <p className="font-bold">{this.state.error?.toString()}</p>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="mt-1 text-muted-foreground whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
