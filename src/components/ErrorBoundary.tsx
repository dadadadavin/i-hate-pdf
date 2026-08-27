import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in I HATE PDF UI:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6 font-mono select-none">
          <div className="max-w-md w-full border-2 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center space-y-4 animate-fade-in">
            <div className="w-12 h-12 border-2 border-black bg-black text-white flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <h2 className="text-base font-black uppercase tracking-tight">
              SOMETHING WENT WRONG
            </h2>

            <p className="text-xs text-neutral-600 leading-relaxed">
              An unexpected render error occurred in the workspace. Your files remain safe on your device.
            </p>

            {this.state.error && (
              <div className="p-3 bg-neutral-100 border border-neutral-300 text-[10px] text-left text-neutral-800 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-2.5 bg-black text-white hover:bg-neutral-800 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors"
            >
              <RotateCcw size={14} />
              <span>RELOAD WORKSPACE</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
