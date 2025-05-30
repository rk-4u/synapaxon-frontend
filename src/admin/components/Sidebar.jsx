import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/admin', 
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' 
    },
    { 
      name: 'Analytics', 
      path: '/admin/analytics', 
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2M9 19' 
    },
    { 
      name: 'User Management', 
      path: '/admin/users', 
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' 
    },
    { 
      name: 'Question Bank', 
      path: '/admin/questions', 
      icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <div className="flex items-center h-16 px-4 bg-indigo-600 dark:bg-indigo-900">
        <h1 className="text-white text-lg font-bold">Synapaxon Admin</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 bg-white dark:bg-gray-800">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <svg
                  className={`mr-3 h-5 w-5 ${
                    isActive
                      ? 'text-indigo-500 dark:text-indigo-300'
                      : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;