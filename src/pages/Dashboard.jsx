// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import QuestionFilterPage from './QuestionFilterPage';
import TestHistoryPage from './TestHistoryPage';
import CreateQuestionForm from './CreateQuestionForm ';

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [activeComponent, setActiveComponent] = useState('welcome');

  const handleNavClick = (component) => {
    setActiveComponent(component);
  };

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'test':
        return <QuestionFilterPage />;
      case 'history':
        return <TestHistoryPage />;
      case 'create':
        return <CreateQuestionForm />;
      default:
        return (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6">Welcome, {currentUser?.name || 'User'} 👋</h1>
            <p className="text-gray-600 mb-6">Select an option from the navigation bar above to begin.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div 
                onClick={() => handleNavClick('test')}
                className="bg-green-100 p-6 rounded-xl shadow hover:shadow-lg transition duration-200 cursor-pointer"
              >
                <h2 className="text-xl font-semibold mb-2">Take a Test</h2>
                <p className="text-gray-600">Start a custom test with selected questions.</p>
              </div>
              
              <div 
                onClick={() => handleNavClick('history')}
                className="bg-blue-100 p-6 rounded-xl shadow hover:shadow-lg transition duration-200 cursor-pointer"
              >
                <h2 className="text-xl font-semibold mb-2">Test History</h2>
                <p className="text-gray-600">View your previous test results and performance.</p>
              </div>
              
              <div 
                onClick={() => handleNavClick('create')}
                className="bg-purple-100 p-6 rounded-xl shadow hover:shadow-lg transition duration-200 cursor-pointer"
              >
                <h2 className="text-xl font-semibold mb-2">Create Question</h2>
                <p className="text-gray-600">Contribute by creating new test questions.</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <header className="bg-blue-800 text-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold mb-4 md:mb-0">Synapaxon</h1>
            
            <nav className="flex flex-wrap gap-2 mb-4 md:mb-0">
              <button
                onClick={() => handleNavClick('welcome')}
                className={`px-4 py-2 rounded-md transition ${
                  activeComponent === 'welcome' 
                    ? 'bg-blue-100 text-blue-800 font-medium' 
                    : 'bg-blue-700 hover:bg-blue-600 text-white'
                }`}
              >
                Dashboard
              </button>
              
              <button
                onClick={() => handleNavClick('test')}
                className={`px-4 py-2 rounded-md transition ${
                  activeComponent === 'test' 
                    ? 'bg-blue-100 text-blue-800 font-medium' 
                    : 'bg-blue-700 hover:bg-blue-600 text-white'
                }`}
              >
                Start Test
              </button>
              
              <button
                onClick={() => handleNavClick('history')}
                className={`px-4 py-2 rounded-md transition ${
                  activeComponent === 'history' 
                    ? 'bg-blue-100 text-blue-800 font-medium' 
                    : 'bg-blue-700 hover:bg-blue-600 text-white'
                }`}
              >
                Test History
              </button>
              
              <button
                onClick={() => handleNavClick('create')}
                className={`px-4 py-2 rounded-md transition ${
                  activeComponent === 'create' 
                    ? 'bg-blue-100 text-blue-800 font-medium' 
                    : 'bg-blue-700 hover:bg-blue-600 text-white'
                }`}
              >
                Create Question
              </button>
            </nav>
            
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="container mx-auto px-4 py-8">
        {renderActiveComponent()}
      </div>
    </div>
  );
}

export default Dashboard;