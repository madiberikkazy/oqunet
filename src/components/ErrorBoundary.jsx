import { Component } from "react";
import { logger } from "../utils/logger.js";
import { t } from "../utils/i18n.js";

/**
 * Catches React render errors anywhere below it and shows a friendly
 * fallback instead of a blank page. Logs the full stack to the central
 * logger so it survives even after the user reloads.
 *
 * Strategy:
 * - First fallback offers a "Try again" button that resets the boundary
 *   in place (cheaper than a full reload, often enough for transient bugs).
 * - If the SAME error fires twice in a row, escalate to a hard reload
 *   so we don't trap the user in a render loop.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    logger.error("react.boundary", error?.message || "Render error", {
      stack: error?.stack,
      componentStack: info?.componentStack,
    });
  }

  handleRetry = () => {
    this.setState((s) => ({
      hasError: false,
      error: null,
      retryCount: s.retryCount + 1,
    }));
  };

  handleHardReload = () => {
    try { window.location.assign("/"); }
    catch { /* if assign fails there is literally nothing to recover */ }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    // After two consecutive crashes, only offer the hard reset — the in-place
    // retry has clearly failed and looping it just frustrates the user.
    const escalate = this.state.retryCount >= 2;

    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center bg-surface text-ink-700">
        <div className="max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-badSoft flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4m0 4h.01M4.93 19h14.14a2 2 0 0 0 1.74-3l-7.07-12a2 2 0 0 0-3.48 0L3.2 16a2 2 0 0 0 1.73 3Z"
                stroke="#dc2626" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">{t.somethingWentWrong}</h1>
          {this.state.error?.message ? (
            <p className="text-ink-500 text-[13px] mb-4 break-words">
              {String(this.state.error.message).slice(0, 200)}
            </p>
          ) : null}
          <div className="space-y-2">
            {!escalate && (
              <button onClick={this.handleRetry} className="btn-primary">
                {t.tryAgain}
              </button>
            )}
            <button
              onClick={this.handleHardReload}
              className={escalate ? "btn-primary" : "w-full py-3 rounded-2xl text-[14px] font-semibold text-ink-700 bg-ink-100"}
            >
              {t.goHome}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
