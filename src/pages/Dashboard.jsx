import React, { useState, useEffect } from 'react';
import { FiHome, FiPlayCircle, FiClock, FiEdit, FiBookOpen, FiCheckCircle } from 'react-icons/fi';
import { FiTrendingUp, FiLayers, FiActivity, FiFileText } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [activeComponent, setActiveComponent] = useState('welcome');
  const navigate = useNavigate();
  const location = useLocation();
  const localStorageName = localStorage.getItem('username') || currentUser?.name;

  // Update active component based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/dashboard/') {
      setActiveComponent('welcome');
    } else if (path.includes('/starttest')) {
      setActiveComponent('test');
    } else if (path.includes('/history')) {
      setActiveComponent('history');
    } else if (path.includes('/create')) {
      setActiveComponent('create');
    } else if (path.includes('/my-questions')) {
      setActiveComponent('my-questions');
    } else if (path.includes('/attempted-questions')) {
      setActiveComponent('attempted-questions');
    }
  }, [location.pathname]);

  const handleNavClick = (component, path) => {
    setActiveComponent(component);
    navigate(path);
  };

  const renderWelcome = () => (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6">Welcome, {currentUser?.name || localStorageName || 'User'} 👋</h1>
      <p className="text-gray-600 mb-6">Select an option from the navigation bar to begin.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
          onClick={() => handleNavClick('test', '/dashboard/starttest')}
          className="bg-gradient-to-br from-green-200 to-green-400 p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer"
        >
          <FiTrendingUp className="text-3xl text-green-800 mb-2" />
          <h2 className="text-2xl font-bold text-green-900 mb-1">Step 1</h2>
          <p className="text-green-800 text-sm">Start your journey with core fundamentals</p>
        </div>
        <div 
          onClick={() => handleNavClick('test', '/dashboard/starttest')}
          className="bg-gradient-to-br from-blue-200 to-blue-400 p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer"
        >
          <FiLayers className="text-3xl text-blue-800 mb-2" />
          <h2 className="text-2xl font-bold text-blue-900 mb-1">Step 2</h2>
          <p className="text-blue-800 text-sm">Build deeper understanding with systems-based questions</p>
        </div>
        <div 
          onClick={() => handleNavClick('test', '/dashboard/starttest')}
          className="bg-gradient-to-br from-purple-200 to-purple-400 p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer"
        >
          <FiActivity className="text-3xl text-purple-800 mb-2" />
          <h2 className="text-2xl font-bold text-purple-900 mb-1">Step 3</h2>
          <p className="text-purple-800 text-sm">Tackle real-world clinical cases and scenarios</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
          onClick={() => handleNavClick('test', '/dashboard/starttest')}
          className="bg-gradient-to-br from-teal-200 to-teal-400 p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer"
        >
          <FiFileText className="text-3xl text-teal-800 mb-2" />
          <h2 className="text-2xl font-bold text-teal-900 mb-1">Take a Test</h2>
          <p className="text-teal-800 text-sm">Start a custom test with selected questions.</p>
        </div>
        <div 
          onClick={() => handleNavClick('history', '/dashboard/history')}
          className="bg-gradient-to-br from-yellow-200 to-yellow-400 p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer"
        >
          <FiClock className="text-3xl text-yellow-800 mb-2" />
          <h2 className="text-2xl font-bold text-yellow-900 mb-1">Test History</h2>
          <p className="text-yellow-800 text-sm">View your previous test results and performance.</p>
        </div>
        <div 
          onClick={() => handleNavClick('create', '/dashboard/create')}
          className="bg-gradient-to-br from-pink-200 to-pink-400 p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer"
        >
          <FiEdit className="text-3xl text-pink-800 mb-2" />
          <h2 className="text-2xl font-bold text-pink-900 mb-1">Create Question</h2>
          <p className="text-pink-800 text-sm">Contribute by creating new test questions.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div 
          onClick={() => handleNavClick('my-questions', '/dashboard/my-questions')}
          className="bg-gradient-to-br from-indigo-200 to-indigo-400 p-8 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer"
        >
          <FiBookOpen className="text-4xl text-indigo-800 mb-3" />
          <h2 className="text-2xl font-bold text-indigo-900 mb-2">My Created Questions</h2>
          <p className="text-indigo-800 text-sm">View and manage all the questions you've created for the platform.</p>
        </div>
        <div 
          onClick={() => handleNavClick('attempted-questions', '/dashboard/attempted-questions')}
          className="bg-gradient-to-br from-orange-200 to-orange-400 p-8 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition duration-300 cursor-pointer"
        >
          <FiCheckCircle className="text-4xl text-orange-800 mb-3" />
          <h2 className="text-2xl font-bold text-orange-900 mb-2">My Attempted Questions</h2>
          <p className="text-orange-800 text-sm">Review all questions you've attempted with detailed analysis.</p>
        </div>
      </div>
    </div>
  );

  // Show welcome component only when at dashboard root, otherwise show Outlet
  const shouldShowWelcome = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-extrabold tracking-wide">Synapaxon</h1>
            <nav className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => handleNavClick('welcome', '/dashboard')}
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
                onClick={() => handleNavClick('test', '/dashboard/starttest')}
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
                onClick={() => handleNavClick('history', '/dashboard/history')}
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
                onClick={() => handleNavClick('create', '/dashboard/create')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-transform transform hover:scale-105 ${
                  activeComponent === 'create'
                    ? 'bg-white text-blue-900 font-semibold shadow'
                    : 'bg-blue-700 hover:bg-blue-600 text-white'
                }`}
              >
                <FiEdit className="text-lg" />
                Create Question
              </button>
              <button
                onClick={() => handleNavClick('my-questions', '/dashboard/my-questions')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-transform transform hover:scale-105 ${
                  activeComponent === 'my-questions'
                    ? 'bg-white text-blue-900 font-semibold shadow'
                    : 'bg-blue-700 hover:bg-blue-600 text-white'
                }`}
              >
                <FiBookOpen className="text-lg" />
                My Questions
              </button>
              <button
                onClick={() => handleNavClick('attempted-questions', '/dashboard/attempted-questions')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-transform transform hover:scale-105 ${
                  activeComponent === 'attempted-questions'
                    ? 'bg-white text-blue-900 font-semibold shadow'
                    : 'bg-blue-700 hover:bg-blue-600 text-white'
                }`}
              >
                <FiCheckCircle className="text-lg" />
                Attempted
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
      <div className="container mx-auto px-4 py-8">
        {shouldShowWelcome ? renderWelcome() : <Outlet />}
      </div>
    </div>
  );
}

export default Dashboard;