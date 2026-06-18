import { Component } from "react";

/**
 * Catches JS errors thrown while rendering any descendant component
 * and shows a friendly fallback instead of a blank/broken page.
 * Wrap this around <App /> (or around individual routes) in main.jsx.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Logs to the browser console so you can still see the real stack trace.
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6 text-center">
          <div>
            <h1 className="text-xl font-bold mb-2">Что-то пошло не так</h1>
            <p className="text-ink-500 text-[14px] mb-4">
              Попробуйте вернуться на главную страницу.
            </p>
            <button onClick={this.handleReload} className="btn-primary">
              На главную
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}