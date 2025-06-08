"use client";

import React from "react";
import { RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-white mb-2">
              Что-то пошло не так
            </h1>
            <p className="text-gray-400 mb-4">
              Произошла ошибка при загрузке приложения
            </p>

            {this.state.error && (
              <details className="text-left mb-4">
                <summary className="text-emerald-400 cursor-pointer mb-2">
                  Подробности ошибки
                </summary>
                <div className="text-xs text-red-400 bg-gray-900 p-2 rounded overflow-auto max-h-32">
                  <div className="font-bold mb-1">{this.state.error.name}:</div>
                  <div className="mb-2">{this.state.error.message}</div>
                  {this.state.error.stack && (
                    <pre className="whitespace-pre-wrap text-xs">
                      {this.state.error.stack.slice(0, 500)}...
                    </pre>
                  )}
                </div>
              </details>
            )}

            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
