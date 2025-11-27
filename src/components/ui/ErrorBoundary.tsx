'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';
import { Card, CardBody } from './Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 animate-fade-in">
          <Card className="max-w-2xl w-full shadow-xl">
            <CardBody className="p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  Oops! Something went wrong
                </h1>
                
                <p className="text-gray-600 mb-6 text-lg">
                  We encountered an unexpected error. Don't worry, your data is safe.
                </p>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm font-semibold text-red-900 mb-2">Error Details:</p>
                  <p className="text-sm text-red-700 font-mono break-all">
                    {this.state.error?.message || 'Unknown error'}
                  </p>
                  {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                    <details className="mt-3">
                      <summary className="text-sm text-red-800 cursor-pointer hover:text-red-900">
                        Stack trace (Development only)
                      </summary>
                      <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={this.handleReset}
                    className="flex items-center justify-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => (window.location.href = '/')}
                    className="flex items-center justify-center"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>

                <p className="text-sm text-gray-500 mt-6">
                  If this problem persists, please contact support at{' '}
                  <a href="mailto:support@dkexecutive.com" className="text-brand-navy-600 hover:underline">
                    support@dkexecutive.com
                  </a>
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simplified error boundary for smaller components
export function SimpleErrorBoundary({ children, fallback }: Props) {
  return (
    <ErrorBoundary
      fallback={
        fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error Loading Component</h3>
                <p className="text-sm text-red-700">
                  Something went wrong. Please refresh the page or try again later.
                </p>
              </div>
            </div>
          </div>
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
}
