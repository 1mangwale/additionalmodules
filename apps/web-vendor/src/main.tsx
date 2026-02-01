import React, { Component, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: any }>{
  constructor(props: any) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError(error: any) { return { hasError: true, error } }
  componentDidCatch(error: any, info: any) { console.error('Vendor ErrorBoundary', error, info) }
  render() {
    if (this.state.hasError) {
      return <div style={{fontFamily:'system-ui', padding:16}}>
        <h2>Vendor app crashed</h2>
        <pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.error)}</pre>
      </div>
    }
    return this.props.children as any
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
