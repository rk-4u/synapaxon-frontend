import axios from "../../api/axiosConfig";
import React, { useState, useEffect } from 'react';
import { Search, Download, RefreshCw } from 'lucide-react';
import ConfirmationDialog from '../components/ConfirmationDialog';

function Subscribers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    plan: 'all'
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/auth/users');
      const sortedUsers = response.data.data
        .map(user => ({
          ...user,
          id: user._id
        }))
        .sort((a, b) => {
          const planRank = { premium: 1, pro: 2, free: 3 };
          return planRank[a.plan] - planRank[b.plan];
        });
      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);
      console.log(sortedUsers)
    } catch (err) {
      const errorMessage =
        err.response?.status === 403
          ? 'Access denied: Admin role required'
          : err.response?.data?.message || 'Failed to load users';
      setError(errorMessage);
      console.error('Error fetching users:', err.response || err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      setLoading(true);
      const user = users.find(u => u.id === userId);
      if (user) {
        setUserDetails(user);
      } else {
        setError('User not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filters]);

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.plan !== 'all') {
      filtered = filtered.filter((user) => user.plan === filters.plan);
    }

    setFilteredUsers(filtered);
  };

  const handleUserAction = async (action, userId) => {
    try {
      setLoading(true);
      switch (action) {
        case 'upgrade':
          await axios.put(`/api/auth/users/${userId}/upgrade`);
          break;
        case 'downgrade':
          await axios.put(`/api/auth/users/${userId}/downgrade`);
          break;
        case 'refund':
          await axios.post(`/api/auth/users/${userId}/refund`);
          break;
        case 'revoke':
          await axios.put(`/api/auth/users/${userId}/revoke`);
          break;
        default:
          break;
      }
      await fetchUserDetails(userId);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to perform action');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = async (user) => {
    setSelectedUser(user);
    setShowProfile(true);
    await fetchUserDetails(user.id);
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Plan', 'Created At'],
      ...filteredUsers.map((user) => [
        user.name || '',
        user.email,
        user.plan,
        user.createdAt,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers.csv';
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
        <div className="flex items-center text-red-700 dark:text-red-200">
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-100 dark:bg-gray-900">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Subscribers</h2>
        <div className="flex space-x-4">
          <button
            onClick={exportUsers}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
          <button
            onClick={fetchUsers}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 h-5 w-5" />
              <input
                type="text"
                placeholder="Search subscribers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={filters.plan}
              onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Plans</option>
              <option value="premium">Premium</option>
              <option value="pro">Pro</option>
              <option value="free">Free</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-full"
                          src={user.avatar || `https://ui-avatars.com/api/?name=${user.name || user.email}`}
                          alt=""
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.plan === 'premium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                          : user.plan === 'pro'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleProfileClick(user)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile View */}
      {showProfile && selectedUser && userDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-[500px] shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">User Profile</h2>
              <button
                onClick={() => {
                  setShowProfile(false);
                  setSelectedUser(null);
                  setUserDetails(null);
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Details */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <img
                  className="h-16 w-16 rounded-full"
                  src={userDetails.avatar || `https://ui-avatars.com/api/?name=${userDetails.name || userDetails.email}`}
                  alt=""
                />
                <div className="ml-4">
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {userDetails.name || 'N/A'}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {userDetails.email}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-gray-900 dark:text-gray-100">
                  <span className="font-medium">Current Plan:</span>{' '}
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    userDetails.plan === 'premium'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                      : userDetails.plan === 'pro'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {userDetails.plan}
                  </span>
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  <span className="font-medium">Member Since:</span>{' '}
                  {new Date(userDetails.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Plan Management */}
            <div className="space-y-3">
              {userDetails.plan === 'free' && (
                <button
                  onClick={() => handleUserAction('upgrade', userDetails.id)}
                  className="w-full bg-indigo-500 dark:bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-600 dark:hover:bg-indigo-700 transition-colors"
                >
                  Upgrade to Pro
                </button>
              )}
              {userDetails.plan === 'pro' && (
                <>
                  <button
                    onClick={() => handleUserAction('upgrade', userDetails.id)}
                    className="w-full bg-indigo-500 dark:bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-600 dark:hover:bg-indigo-700 transition-colors"
                  >
                    Upgrade to Premium
                  </button>
                  <button
                    onClick={() => handleUserAction('downgrade', userDetails.id)}
                    className="w-full bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                  >
                    Downgrade to Free
                  </button>
                </>
              )}
              {userDetails.plan === 'premium' && (
                <button
                  onClick={() => handleUserAction('downgrade', userDetails.id)}
                  className="w-full bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                >
                  Downgrade to Pro
                </button>
              )}
            </div>

            {/* Account Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <button
                onClick={() => handleUserAction('refund', userDetails.id)}
                className="w-full bg-green-500 dark:bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-600 dark:hover:bg-green-700 transition-colors"
              >
                Process Refund
              </button>
              <button
                onClick={() => handleUserAction('revoke', userDetails.id)}
                className="w-full bg-red-500 dark:bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
              >
                Revoke Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subscribers;