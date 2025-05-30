import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  // Fix: Use 'currentUser' instead of 'user' to match AuthContext
  const { currentUser } = useAuth();

  // Add loading state check
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-900 dark:text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Welcome to Admin Dashboard</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-6">
        <img
          src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}&size=128`}
          alt="Admin Avatar"
          className="w-32 h-32 rounded-full border-4 border-indigo-500"
        />
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{currentUser.name}</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Role: <span className="font-medium capitalize">{currentUser.role}</span>
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-300">Email: {currentUser.email}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Managing the system with {currentUser.role === 'admin' ? 'full privileges' : 'limited access'}
          </p>
        </div>
      </div>
      {/* Add more widgets or summary info here if desired */}
    </div>
  );
};

export default AdminDashboard;