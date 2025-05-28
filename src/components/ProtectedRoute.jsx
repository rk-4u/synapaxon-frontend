import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && currentUser?.role !== requiredRole) {
    // Redirect users trying to access unauthorized routes
    return <Navigate to={currentUser?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
}

export default ProtectedRoute;
