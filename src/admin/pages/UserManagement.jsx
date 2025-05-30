import { useState, useEffect } from 'react';
import axios from '../../api/axiosConfig';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { Search, Download, RefreshCw } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    plan: 'all',
    role: 'all',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/auth/users');
      const sortedUsers = response.data.data
        .map(user => ({
          ...user,
          id: user._id // Map _id to id
        }))
        .sort((a, b) => {
          const planRank = { premium: 1, pro: 2, free: 3 };
          return planRank[a.plan] - planRank[b.plan];
        });
      setUsers(sortedUsers);
      setFilteredUsers(sortedUsers);
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

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.plan !== 'all') {
      filtered = filtered.filter((user) => user.plan === filters.plan);
    }
    if (filters.role !== 'all') {
      filtered = filtered.filter((user) => user.role === filters.role);
    }

    setFilteredUsers(filtered);
  };

  const handleAction = async (action, user) => {
    try {
      switch (action) {
        case 'delete':
          setUserToDelete(user);
          setIsDeleteDialogOpen(true);
          break;
        case 'update':
          setEditUser({ ...user });
          setIsEditDialogOpen(false);
          break;
        default:
          break;
      }
    } catch (err) {
      alert(`Failed to perform ${action} action: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete?.id) {
      setError('Invalid user ID');
      setIsDeleteDialogOpen(false);
      return;
    }
    try {
      await axios.delete(`/api/auth/users/${userToDelete.id}`);
      setUsers(users.filter((u) => u.id !== userToDelete.id));
      setFilteredUsers(filteredUsers.filter((u) => u.id !== userToDelete.id));
      alert(`User ${userToDelete.name} deleted successfully`);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Failed to delete user';
      setError(errorMessage);
      console.error('Error deleting user:', err.response || err);
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editUser?.id) {
      setError('Invalid user ID');
      setIsEditDialogOpen(false);
      return;
    }
    try {
      await axios.put(`/api/auth/users/${editUser.id}`, {
        plan: editUser.plan,
        role: editUser.role,
      });
      setUsers(
        users.map((u) => (u.id === editUser.id ? { ...u, plan: editUser.plan, role: editUser.role } : u))
      );
      setFilteredUsers(
        filteredUsers.map((u) =>
          u.id === editUser.id ? { ...u, plan: editUser.plan, role: editUser.role } : u
        )
      );
      alert('User updated successfully');
      setEditUser(null);
      setIsEditDialogOpen(false);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Failed to update user';
      setError(errorMessage);
      console.error('Error updating user:', err.response || err);
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Plan', 'Created At'],
      ...filteredUsers.map((user) => [
        user.name,
        user.email,
        user.role,
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
    a.download = 'users.csv';
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
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
                placeholder="Search users..."
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
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="student">Student</option>
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
                  Role
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
                          src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`}
                          alt=""
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                          : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      }`}
                    >
                      {user.role}
                    </span>
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
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAction('update', user)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleAction('delete', user)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal with Warning */}
      {editUser && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Edit User</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  value={editUser.name}
                  disabled
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={editUser.email}
                  disabled
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role
                </label>
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Plan
                </label>
                <select
                  value={editUser.plan}
                  onChange={(e) => setEditUser({ ...editUser, plan: e.target.value })}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                >
                  <option value="premium">Premium</option>
                  <option value="pro">Pro</option>
                  <option value="free">Free</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setEditUser(null);
                  setIsEditDialogOpen(false);
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsEditDialogOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onConfirm={handleSaveEdit}
        message={`Are you sure you want to update ${editUser?.name}'s role to ${editUser?.role} and plan to ${editUser?.plan}?`}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
      />
    </div>
  );
};

export default UserManagement;