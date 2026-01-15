
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-red-900/50 p-6 rounded-lg max-w-lg w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-red-400">
                <AlertTriangle className="w-8 h-8" />
                <h1 className="text-xl font-bold">Something went wrong</h1>
            </div>
            <p className="text-slate-300 mb-4 text-sm">
              The application encountered a critical error and could not render.
            </p>
            <div className="bg-slate-950 p-4 rounded border border-slate-700 font-mono text-xs text-red-300 overflow-auto max-h-48 mb-6">
                <div className="font-bold mb-2">{this.state.error?.name || 'Error'}</div>
                {this.state.error?.message || 'Unknown Error'}
            </div>
            <button 
                onClick={() => window.location.reload()}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded flex items-center justify-center gap-2 transition-colors font-medium text-sm"
            >
                <RefreshCw className="w-4 h-4" />
                Reload Application
            </button>
            <div className="mt-4 text-center">
                 <p className="text-[10px] text-slate-500">
                    If this persists, check your Browser Console (F12) for detailed logs.
                 </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
