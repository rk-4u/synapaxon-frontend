import UserManagement from '../components/UserManagement';

const Users = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
      <p className="text-sm text-gray-500 mb-6">Manage user accounts and subscriptions</p>
      <UserManagement />
    </div>
  );
};

export default Users;