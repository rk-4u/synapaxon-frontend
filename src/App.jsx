import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TestRunnerPage from './pages/TestRunnerPage';
import TestDetailPage from './pages/TestDetailPage';
import Bird404Scene from './components/Bird404Scene';

function App() {
  return (
    <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/test-runner" element={
            <ProtectedRoute>
              <TestRunnerPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/test-detail/:testId" element={
            <ProtectedRoute>
              <TestDetailPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Bird404Scene />} />
        </Routes>
    </AuthProvider>
  );
}

export default App;