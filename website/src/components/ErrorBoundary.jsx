import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen page-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/3 border border-red-500/25 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Something went wrong</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            This page encountered an unexpected error. Try refreshing — if the problem persists, the issue will be logged automatically.
          </p>
          {this.state.error?.message && (
            <p className="text-xs text-gray-600 font-mono bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-left break-all">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
            className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/15 text-gray-200 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Reload page
          </button>
        </div>
      </div>
    )
  }
}
