import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard'; // Student dashboard
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
import Analytics from './admin/pages/Analytics';
import Content from './admin/pages/Content';
import Questions from './admin/pages/Questions';
import Settings from './admin/pages/Settings';
import Users from './admin/pages/Users';
import Preloader from './components/Preloader';

function App() {

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Preloader />;
  }
  
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
          <Route path="starttest" element={<QuestionFilterPage />} />
          <Route path="history" element={<TestHistoryPage />} />
          <Route path="create" element={<EnhancedCreateQuestionForm />} />
          <Route path="my-questions" element={<MyCreatedQuestionsPage />} />
          <Route path="attempted-questions" element={<AttemptedQuestionsPage />} />
        </Route>
        <Route path="/dashboard/test-runner" element={<ProtectedRoute><TestRunnerPage /></ProtectedRoute>} />
        <Route path="/dashboard/test-detail/:testId" element={<ProtectedRoute><TestDetailPage /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/*" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="content" element={<Content />} />
          <Route path="questions" element={<Questions />} />
          <Route path="settings" element={<Settings />} />
          <Route path="users" element={<Users />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<Bird404Scene />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;