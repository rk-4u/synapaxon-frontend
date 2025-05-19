// src/pages/TestPrepApp.jsx
import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import QuestionsPage from '../pages/QuestionsPage';

function TestPrepApp() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/dashboard" className="text-blue-600 font-bold text-xl">
                  Synapaxon
                </Link>
              </div>
              <nav className="ml-6 flex space-x-4">
                <Link 
                  to="/prep/questions" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                >
                  Questions
                </Link>
                <Link 
                  to="/prep/history" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                >
                  History
                </Link>
                <Link 
                  to="/prep/analytics" 
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                >
                  Analytics
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Navigate to="/prep/questions" replace />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/history" element={<div className="p-4">Test History Page Coming Soon</div>} />
          <Route path="/analytics" element={<div className="p-4">Analytics Page Coming Soon</div>} />
          <Route path="*" element={<Navigate to="/prep/questions" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default TestPrepApp;