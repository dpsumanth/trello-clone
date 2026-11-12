import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

/**
 * Guards private routes so only authenticated users can access them.
 */
export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" aria-hidden="true" />
        <span>Checking authentication...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
