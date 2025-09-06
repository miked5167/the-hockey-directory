'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{
    error: Error | null
    resetError: () => void
    errorInfo?: React.ErrorInfo | null
  }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to monitoring service
    this.props.onError?.(error, errorInfo)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
            errorInfo={this.state.errorInfo}
          />
        )
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
        />
      )
    }

    return this.props.children
  }
}

const DefaultErrorFallback = ({
  error,
  resetError,
  errorInfo
}: {
  error: Error | null
  resetError: () => void
  errorInfo?: React.ErrorInfo | null
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-xl text-gray-900">
            Something went wrong
          </CardTitle>
          <p className="text-gray-600">
            We're sorry, but something unexpected happened. Please try again.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={resetError} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go to Homepage
            </Button>

            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
          </div>

          {/* Error Details for Development */}
          {isDevelopment && error && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 flex items-center gap-2 p-2 bg-gray-50 rounded">
                <Bug className="h-4 w-4" />
                Error Details (Development Only)
              </summary>
              <div className="mt-3 p-4 bg-gray-900 rounded text-green-400 text-sm font-mono overflow-auto">
                <div className="mb-4">
                  <strong className="text-red-400">Error:</strong>
                  <div className="mt-1">{error.name}: {error.message}</div>
                </div>
                
                {error.stack && (
                  <div className="mb-4">
                    <strong className="text-red-400">Stack Trace:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-xs">
                      {error.stack}
                    </pre>
                  </div>
                )}

                {errorInfo?.componentStack && (
                  <div>
                    <strong className="text-red-400">Component Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-xs">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* User-friendly tips */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What you can try:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Refresh the page and try your action again</li>
              <li>• Check your internet connection</li>
              <li>• Clear your browser cache and cookies</li>
              <li>• Try using a different browser</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Functional wrapper for easier usage
export function ErrorBoundary({ 
  children, 
  fallback,
  onError
}: ErrorBoundaryProps) {
  return (
    <ErrorBoundaryClass fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundaryClass>
  )
}

// Hook for error reporting
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    // Log to console
    console.error('Application Error:', error)
    if (errorInfo) {
      console.error('Error Info:', errorInfo)
    }

    // Here you could send to error tracking service like Sentry
    // Example: Sentry.captureException(error, { extra: errorInfo })
    
    // Or send to your own error logging endpoint
    // fetch('/api/errors', { 
    //   method: 'POST',
    //   body: JSON.stringify({ error: error.message, stack: error.stack, info: errorInfo })
    // })

  }, [])

  return { handleError }
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}