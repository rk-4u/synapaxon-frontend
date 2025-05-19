// src/pages/Dashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Welcome, {currentUser?.name || 'User'} 👋</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        <Link to="/question-filter" className="bg-green-100 p-6 rounded-xl shadow hover:shadow-lg transition duration-200">
          <h2 className="text-xl font-semibold mb-2">Take a Test</h2>
          <p className="text-gray-600">Start a custom test with selected questions.</p>
        </Link>
      </div>

      <button
        onClick={logout}
        className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
      >
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
