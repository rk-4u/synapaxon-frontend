// src/pages/Dashboard.jsx
import { FiTrendingUp, FiLayers, FiActivity } from 'react-icons/fi';
import { FiEdit, FiClock, FiFileText } from 'react-icons/fi';
import { FiHome, FiPlayCircle} from 'react-icons/fi';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import QuestionFilterPage from './QuestionFilterPage';
import TestHistoryPage from './TestHistoryPage';
import EnhancedCreateQuestionForm from './EnhancedCreateQuestionForm';
import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [activeComponent, setActiveComponent] = useState('welcome');
  const localStorageName = localStorage.getItem('username') || currentUser?.name;
  
  const synapaxonRef = useRef(null);

  useEffect(() => {
    const glowAnim = gsap.to(synapaxonRef.current, {
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut",
      textShadow: "0px 0px 20px rgba(255, 255, 255, 0.9)",
      color: "#ffffff", // glow to full white
    });

    return () => {
      glowAnim.kill();
    };
  }, []);


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
          <div className="bg-white p-8 rounded-lg shadow-md border-2 border-indigo-500 dark:border-indigo-300 shadow-sm divide-y divide-gray-200 dark:divide-gray-700 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm">
            <h1 className="text-3xl font-bold mb-6 text-white">Welcome, {currentUser?.name || localStorageName || 'User'} 👋</h1>
            <p className="text-gray-400 mb-6">Select an option from the navigation bar to begin.</p>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-3">
            <div
              onClick={() => handleNavClick('test')}
              className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 w-full max-w-sm transition-transform hover:scale-105 hover:shadow-lg cursor-pointer mt-3"
            >
              <FiTrendingUp className="text-3xl text-green-400 mb-4 mx-auto" />
              <h2 className="text-2xl font-bold text-white mb-2 text-center">
                Step 1
              </h2>
              <p className="text-sm text-slate-300 text-center">
                Start your journey with core fundamentals
              </p>
            </div>
             {/* Step 2 */}
              <div
                onClick={() => handleNavClick('test')}
                className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 w-full max-w-sm transition-transform hover:scale-105 hover:shadow-lg cursor-pointer mt-3"
              >
                <FiLayers className="text-3xl text-blue-400 mb-4 mx-auto" />

                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                  Step 2
                </h2>

                <p className="text-sm text-slate-300 text-center">
                  Build deeper understanding with systems-based questions
                </p>
              </div>

              {/* Step 3 */}
              <div
                onClick={() => handleNavClick('test')}
                className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 w-full max-w-sm transition-transform hover:scale-105 hover:shadow-lg cursor-pointer mt-3"
              >
                <FiActivity className="text-3xl text-purple-400 mb-4 mx-auto" />

                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                  Step 3
                </h2>

                <p className="text-sm text-slate-300 text-center">
                  Tackle real-world clinical cases and scenarios
                </p>
              </div>

            </div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div
                onClick={() => handleNavClick('test')}
                className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 w-full max-w-sm transition-transform hover:scale-105 hover:shadow-lg cursor-pointer mt-3"
              >
                <FiActivity className="text-3xl text-purple-400 mb-4 mx-auto" />
                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                  Step 3
                </h2>
                <p className="text-sm text-slate-300 text-center">
                  Tackle real-world clinical cases and scenarios
                </p>
              </div>


              <div
                onClick={() => handleNavClick('history')}
                className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 w-full max-w-sm transition-transform hover:scale-105 hover:shadow-lg cursor-pointer mt-3"
              >
                <FiClock className="text-3xl text-yellow-400 mb-4 mx-auto" />
                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                  Test History
                </h2>
                <p className="text-sm text-slate-300 text-center">
                  View your previous test results and performance.
                </p>
              </div>

              <div
                onClick={() => handleNavClick('enhanced-create')}
                className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 w-full max-w-sm transition-transform hover:scale-105 hover:shadow-lg cursor-pointer mt-3"
              >
                <FiEdit className="text-3xl text-pink-400 mb-4 mx-auto" />
                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                  Create Question
                </h2>
                <p className="text-sm text-slate-300 text-center">
                  Contribute by creating new test questions.
                </p>
              </div>

            </div>

          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Bar */}
        <header className="bg-blue-900 text-white shadow-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* <h1 className="text-3xl font-extrabold tracking-wide">Synapaxon</h1> */}

              <button
                ref={synapaxonRef}
                onClick={() => handleNavClick('welcome')}
                className={`text-3xl font-extrabold tracking-wide hover:drop-shadow-[0_0_12px_#fff] transition-all transition-transform transform hover:scale-110 hover:text-white ${
                  activeComponent === 'welcome'
                    ? 'text-white'
                    : 'text-blue-200'
                }`}
              >
                Synapaxon
              </button>
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