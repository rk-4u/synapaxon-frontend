import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './components/Sidebar';
import { Sun, Moon } from 'lucide-react';

const AdminLayout = () => {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-30 w-64 shadow-md transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex-shrink-0`}
      >
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center">
              <button
                className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              </button>
              <h1 className="ml-3 text-xl font-semibold text-gray-900 dark:text-white">
                Synapaxon Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {theme === 'light' ? (
                  <Moon className="h-6 w-6" />
                ) : (
                  <Sun className="h-6 w-6" />
                )}
                <span className="sr-only">Toggle theme</span>
              </button>
              
              
              <div className="relative">
                <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <span className="sr-only">User menu</span>
                  <img
                    className="h-8 w-8 rounded-full"
                    src="https://t3.ftcdn.net/jpg/00/07/32/48/360_F_7324855_mx4CEBWTr81XLOrlQccCROtP2uNR7xbk.jpg"
                    alt="Admin"
                  />
                </button>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;