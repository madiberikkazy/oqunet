import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { t } from "../utils/i18n.js";

/**
 * Gates a subtree of routes behind authentication.
 *
 * Pass `adminOnly` to additionally require the real DB role to be "admin".
 * The local viewRole toggle (admin-browsing-as-user) is intentionally
 * NOT respected here — the route is locked by the underlying DB role
 * so a switched view can't bypass admin pages, and users can't elevate.
 */
export default function ProtectedRoute({ adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-500">
        {t.loading}
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }
  if (adminOnly && !isAdmin) {
    // Don't reveal a 404 vs. permission diff — just bounce home.
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
