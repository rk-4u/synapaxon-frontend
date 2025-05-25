import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import QuestionFilterPage from './pages/QuestionFilterPage';
import TestHistoryPage from './pages/TestHistoryPage';
import EnhancedCreateQuestionForm from './pages/EnhancedCreateQuestionForm';
import MyCreatedQuestionsPage from './pages/MyCreatedQuestionsPage';
import AttemptedQuestionsPage from './pages/AttemptedQuestionsPage';
import TestRunnerPage from './pages/TestRunnerPage';
import TestDetailPage from './pages/TestDetailPage';
import Bird404Scene from './components/Bird404Scene';
import AdminLayout from './admin/components/AdminLayout';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
          <Route path="starttest" element={<QuestionFilterPage />} />
          <Route path="history" element={<TestHistoryPage />} />
          <Route path="create" element={<EnhancedCreateQuestionForm />} />
          <Route path="my-questions" element={<MyCreatedQuestionsPage />} />
          <Route path="attempted-questions" element={<AttemptedQuestionsPage />} />
        </Route>

        {/* Test related routes */}
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

        {/* Admin routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        } />

        {/* 404 route */}
        <Route path="*" element={<Bird404Scene />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;