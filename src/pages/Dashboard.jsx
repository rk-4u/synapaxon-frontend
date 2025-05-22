// src/pages/Dashboard.jsx
import { FiTrendingUp, FiLayers, FiActivity } from 'react-icons/fi';
import { FiEdit, FiClock, FiFileText } from 'react-icons/fi';
import { FiHome, FiPlayCircle} from 'react-icons/fi';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import QuestionFilterPage from './QuestionFilterPage';
import TestHistoryPage from './TestHistoryPage';
import EnhancedCreateQuestionForm from './EnhancedCreateQuestionForm';

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
      
      case 'enhanced-create':
        return <EnhancedCreateQuestionForm />;
      default:
        return (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6">Welcome, {currentUser?.name || 'User'} 👋</h1>
            <p className="text-gray-600 mb-6">Select an option from the navigation bar above to begin.</p>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div 
                onClick={() => handleNavClick('test')}
                className="bg-gradient-to-br from-green-200 to-green-400 p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer"
              >
                <FiTrendingUp className="text-3xl text-green-800 mb-2" />
                <h2 className="text-2xl font-bold text-green-900 mb-1">Step I</h2>
                <p className="text-green-800 text-sm">Start your journey with core fundamentals</p>
              </div>

              <div 
                onClick={() => handleNavClick('test')}
                className="bg-gradient-to-br from-blue-200 to-blue-400 p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer"
              >
                <FiLayers className="text-3xl text-blue-800 mb-2" />
                <h2 className="text-2xl font-bold text-blue-900 mb-1">Step II</h2>
                <p className="text-blue-800 text-sm">Build deeper understanding with systems-based questions</p>
              </div>

              <div 
                onClick={() => handleNavClick('test')}
                className="bg-gradient-to-br from-purple-200 to-purple-400 p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer"
              >
                <FiActivity className="text-3xl text-purple-800 mb-2" />
                <h2 className="text-2xl font-bold text-purple-900 mb-1">Step III</h2>
                <p className="text-purple-800 text-sm">Tackle real-world clinical cases and scenarios</p>
              </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div 
                onClick={() => handleNavClick('test')}
                className="bg-gradient-to-br from-teal-200 to-teal-400 p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer"
              >
                <FiFileText className="text-3xl text-teal-800 mb-2" />
                <h2 className="text-2xl font-bold text-teal-900 mb-1">Take a Test</h2>
                <p className="text-teal-800 text-sm">Start a custom test with selected questions.</p>
              </div>

              <div 
                onClick={() => handleNavClick('history')}
                className="bg-gradient-to-br from-yellow-200 to-yellow-400 p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer"
              >
                <FiClock className="text-3xl text-yellow-800 mb-2" />
                <h2 className="text-2xl font-bold text-yellow-900 mb-1">Test History</h2>
                <p className="text-yellow-800 text-sm">View your previous test results and performance.</p>
              </div>

              <div 
                onClick={() => handleNavClick('enhanced-create')}
                className="bg-gradient-to-br from-pink-200 to-pink-400 p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer"
              >
                <FiEdit className="text-3xl text-pink-800 mb-2" />
                <h2 className="text-2xl font-bold text-pink-900 mb-1">Create Question</h2>
                <p className="text-pink-800 text-sm">Contribute by creating new test questions.</p>
              </div>
            </div>

          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
        <header className="bg-blue-900 text-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h1 className="text-3xl font-extrabold tracking-wide">Synapaxon</h1>

              <nav className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => handleNavClick('welcome')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-transform transform hover:scale-105 ${
                    activeComponent === 'welcome'
                      ? 'bg-white text-blue-900 font-semibold shadow'
                      : 'bg-blue-700 hover:bg-blue-600 text-white'
                  }`}
                >
                  <FiHome className="text-lg" />
                  Dashboard
                </button>

                <button
                  onClick={() => handleNavClick('test')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-transform transform hover:scale-105 ${
                    activeComponent === 'test'
                      ? 'bg-white text-blue-900 font-semibold shadow'
                      : 'bg-blue-700 hover:bg-blue-600 text-white'
                  }`}
                >
                  <FiPlayCircle className="text-lg" />
                  Start Test
                </button>

                <button
                  onClick={() => handleNavClick('history')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-transform transform hover:scale-105 ${
                    activeComponent === 'history'
                      ? 'bg-white text-blue-900 font-semibold shadow'
                      : 'bg-blue-700 hover:bg-blue-600 text-white'
                  }`}
                >
                  <FiClock className="text-lg" />
                  Test History
                </button>

                <button
                  onClick={() => handleNavClick('enhanced-create')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-transform transform hover:scale-105 ${
                    activeComponent === 'enhanced-create'
                      ? 'bg-white text-blue-900 font-semibold shadow'
                      : 'bg-blue-700 hover:bg-blue-600 text-white'
                  }`}
                >
                  <FiEdit className="text-lg" />
                  Create Question
                </button>
              </nav>

              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow"
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