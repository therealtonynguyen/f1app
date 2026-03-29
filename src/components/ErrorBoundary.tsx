import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Catches any unhandled React render or lifecycle error
 * so the whole app never goes blank — a friendly recovery screen is shown instead.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        className="flex h-screen w-screen items-center justify-center p-6"
        style={{ background: 'var(--ios-bg, #000)' }}
      >
        <div
          className="max-w-sm w-full rounded-[20px] p-6 text-center space-y-4"
          style={{ background: 'var(--ios-grouped, #1c1c1e)' }}
        >
          <div className="text-4xl select-none" aria-hidden>⚠️</div>
          <h2 className="text-[18px] font-semibold text-white">Something went wrong</h2>
          <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(235,235,245,0.6)' }}>
            An unexpected error occurred. Your data hasn&apos;t been lost — tap below to recover.
          </p>
          <details className="text-left">
            <summary
              className="text-[12px] cursor-pointer select-none"
              style={{ color: 'rgba(235,235,245,0.35)' }}
            >
              Error details
            </summary>
            <pre
              className="mt-2 text-[11px] overflow-auto rounded-lg p-3 max-h-40"
              style={{
                background: 'rgba(0,0,0,0.4)',
                color: 'rgba(235,235,245,0.5)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {this.state.error.message}
            </pre>
          </details>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-full text-[15px] font-semibold transition-opacity active:opacity-70"
              style={{ background: 'var(--ios-blue, #0a84ff)', color: '#fff' }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-full text-[15px] font-semibold transition-opacity active:opacity-70"
              style={{ background: 'rgba(120,120,128,0.2)', color: 'rgba(235,235,245,0.7)' }}
            >
              Reload app
            </button>
          </div>
        </div>
      </div>
    );
  }
}
