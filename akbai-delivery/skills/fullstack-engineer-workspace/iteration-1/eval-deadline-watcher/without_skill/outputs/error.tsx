'use client';

import { AlertCircle } from 'lucide-react';
import { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 px-4 py-12">
          <div className="mx-auto max-w-md rounded-lg border-2 border-red-200 bg-red-50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h1 className="text-lg font-bold text-red-900">Something went wrong</h1>
            </div>

            <p className="mb-4 text-sm text-red-800">
              An unexpected error occurred while loading your deadlines.
            </p>

            {this.state.error && (
              <div className="mb-4 rounded bg-red-100 p-2">
                <p className="text-xs font-mono text-red-700 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Error page component for 404 and other errors
 */
export function ErrorPage({
  code = '500',
  message = 'Something went wrong',
  description = 'An unexpected error occurred.',
}: {
  code?: string;
  message?: string;
  description?: string;
}) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>

        <h1 className="mb-2 text-4xl font-bold text-gray-900">{code}</h1>
        <h2 className="mb-2 text-lg font-semibold text-gray-700">{message}</h2>
        <p className="mb-6 text-sm text-gray-600">{description}</p>

        <a
          href="/app/deadlines"
          className="inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Back to Deadlines
        </a>
      </div>
    </div>
  );
}

export default ErrorPage;
