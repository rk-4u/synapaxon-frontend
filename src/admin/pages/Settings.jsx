import PlatformSettings from '../components/PlatformSettings';

const Settings = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Platform Settings</h2>
      <p className="text-sm text-gray-500 mb-6">Configure system-wide settings and preferences</p>
      <PlatformSettings />
    </div>
  );
};

export default Settings;