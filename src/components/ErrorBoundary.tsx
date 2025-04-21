import React, { Component, ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error);
    console.error('Error info:', errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 text-red-600 rounded-full mx-auto mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
              Oops! Something went wrong.
            </h2>
            
            <p className="text-gray-600 text-center mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>

            <div className="space-y-4">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <RotateCcw className="h-5 w-5" />
                Refresh Page
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full text-gray-600 hover:text-gray-900"
              >
                Return to Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-6 p-4 bg-gray-100 rounded-lg text-xs text-gray-700 overflow-auto">
                {this.state.error.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}