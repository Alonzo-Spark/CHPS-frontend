import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900">Failed to render dashboard</h3>
          <p className="text-sm text-gray-500 mt-2">An unexpected error occurred while rendering. Try refreshing the page.</p>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
