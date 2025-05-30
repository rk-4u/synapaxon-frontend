import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import GoogleAuthCallback from './pages/GoogleAuthCallback';
import Dashboard from './pages/Dashboard';
import QuestionFilterPage from './pages/QuestionFilterPage';
import TestHistoryPage from './pages/TestHistoryPage';
import EnhancedCreateQuestionForm from './pages/EnhancedCreateQuestionForm';
import MyCreatedQuestionsPage from './pages/MyCreatedQuestionsPage';
import AttemptedQuestionsPage from './pages/AttemptedQuestionsPage';
import TestRunnerPage from './pages/TestRunnerPage';
import TestDetailPage from './pages/TestDetailPage';
import Bird404Scene from './components/Bird404Scene';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/pages/AdminDashboard';
import AnalyticsDashboard from './admin/pages/AnalyticsDashboard';
import UserManagement from './admin/pages/UserManagement';
import QuestionBank from './admin/pages/QuestionBank';
import AIQuestionAssistant from './pages/AIQuestionAssistant';
import Subscribers from './admin/pages/Subscribers';


function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<GoogleAuthCallback />} />

        {/* Student Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute requiredRole="student"><Dashboard /></ProtectedRoute>}>
          <Route path="starttest" element={<QuestionFilterPage />} />
          <Route path="history" element={<TestHistoryPage />} />
          <Route path="create" element={<EnhancedCreateQuestionForm />} />
          <Route path="my-questions" element={<MyCreatedQuestionsPage />} />
          <Route path="attempted-questions" element={<AttemptedQuestionsPage />} />
          <Route path="test-detail/:testId" element={<ProtectedRoute requiredRole="student"><TestDetailPage /></ProtectedRoute>} />
          <Route path="create/AIQuestionAssistant" element={<ProtectedRoute requiredRole="student"><AIQuestionAssistant /></ProtectedRoute>} />
        </Route>
        <Route path="/dashboard/test-runner" element={<ProtectedRoute requiredRole="student"><TestRunnerPage /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/*" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="questions" element={<QuestionBank />} /> {/* Add this line */}
          <Route path="subscribers" element={<Subscribers />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<Bird404Scene />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;