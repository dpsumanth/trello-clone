import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ padding: '40px 20px', maxWidth: 640, margin: '0 auto' }}>
          <div className="alert alert-error" role="alert">
            <strong>Something went wrong:</strong> {this.state.error.message}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
