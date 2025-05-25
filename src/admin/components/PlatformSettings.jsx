import { useState } from 'react';
import { Switch } from '@headlessui/react';

const PlatformSettings = () => {
  // General settings state
  const [settings, setSettings] = useState({
    siteName: "Synapaxon",
    siteDescription: "Medical Question Bank and Learning Platform",
    difficultyWeights: {
      easy: 1,
      medium: 2,
      hard: 3
    },
    maintenanceMode: false,
    userRegistration: true
  });

  // Email notification settings
  const [emailNotifications, setEmailNotifications] = useState({
    newQuestion: true,
    questionApproved: true,
    subscriptionExpiry: true,
    platformUpdates: false
  });

  // Email templates
  const [emailTemplates, setEmailTemplates] = useState({
    welcome: {
      subject: "Welcome to Synapaxon!",
      body: "Dear {{user}},\n\nThank you for joining Synapaxon. We're excited to have you as part of our medical learning community!\n\nStart exploring our question bank and take your first practice test today.\n\nBest regards,\nThe Synapaxon Team"
    },
    questionApproved: {
      subject: "Your question has been approved",
      body: "Dear {{user}},\n\nYour question about {{topic}} has been approved and is now available in our question bank.\n\nThank you for contributing to our community!\n\nBest regards,\nThe Synapaxon Team"
    },
    subscriptionReminder: {
      subject: "Your subscription is expiring soon",
      body: "Dear {{user}},\n\nYour {{subscription}} subscription will expire in {{days}} days. Renew now to continue uninterrupted access to our question bank.\n\nBest regards,\nThe Synapaxon Team"
    }
  });

  // UI state
  const [activeTab, setActiveTab] = useState('general');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Handle setting changes
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleDifficultyWeightChange = (level, value) => {
    setSettings(prev => ({
      ...prev,
      difficultyWeights: {
        ...prev.difficultyWeights,
        [level]: parseInt(value) || 0
      }
    }));
  };

  // Handle email notification toggles
  const toggleEmailNotification = (key) => {
    setEmailNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handle template editing
  const handleTemplateEdit = (templateKey, field, value) => {
    setEmailTemplates(prev => ({
      ...prev,
      [templateKey]: {
        ...prev[templateKey],
        [field]: value
      }
    }));
  };

  // Save all settings
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // In a real app, you would make API calls here
      console.log('Saving settings:', {
        general: settings,
        emailNotifications,
        emailTemplates
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Platform Settings</h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure system-wide settings and preferences
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('general')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Email Templates
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
                    Site Name
                  </label>
                  <input
                    type="text"
                    id="siteName"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={settings.siteName}
                    onChange={(e) => handleSettingChange('siteName', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700">
                    Site Description
                  </label>
                  <input
                    type="text"
                    id="siteDescription"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={settings.siteDescription}
                    onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Difficulty Weights</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Adjust the weighting for different difficulty levels in test scoring
                </p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['easy', 'medium', 'hard'].map((level) => (
                    <div key={level} className="space-y-2">
                      <label htmlFor={`weight-${level}`} className="block text-sm font-medium text-gray-700 capitalize">
                        {level} Questions
                      </label>
                      <input
                        type="number"
                        id={`weight-${level}`}
                        min="1"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={settings.difficultyWeights[level]}
                        onChange={(e) => handleDifficultyWeightChange(level, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
                <div className="mt-4 space-y-4">
                  <Switch.Group as="div" className="flex items-center justify-between">
                    <span className="flex flex-grow flex-col">
                      <Switch.Label as="span" className="text-sm font-medium text-gray-900" passive>
                        Allow New User Registrations
                      </Switch.Label>
                      <Switch.Description as="span" className="text-sm text-gray-500">
                        Toggle whether new users can sign up for accounts
                      </Switch.Description>
                    </span>
                    <Switch
                      checked={settings.userRegistration}
                      onChange={(value) => handleSettingChange('userRegistration', value)}
                      className={`${
                        settings.userRegistration ? 'bg-indigo-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                    >
                      <span
                        aria-hidden="true"
                        className={`${
                          settings.userRegistration ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                      />
                    </Switch>
                  </Switch.Group>

                  <Switch.Group as="div" className="flex items-center justify-between">
                    <span className="flex flex-grow flex-col">
                      <Switch.Label as="span" className="text-sm font-medium text-gray-900" passive>
                        Maintenance Mode
                      </Switch.Label>
                      <Switch.Description as="span" className="text-sm text-gray-500">
                        When enabled, only administrators can access the platform
                      </Switch.Description>
                    </span>
                    <Switch
                      checked={settings.maintenanceMode}
                      onChange={(value) => handleSettingChange('maintenanceMode', value)}
                      className={`${
                        settings.maintenanceMode ? 'bg-indigo-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                    >
                      <span
                        aria-hidden="true"
                        className={`${
                          settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                      />
                    </Switch>
                  </Switch.Group>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-500">
                Configure which email notifications are sent to users
              </p>
              
              <div className="border-t border-gray-200 pt-6 space-y-6">
                {Object.entries({
                  newQuestion: 'New Question Submission',
                  questionApproved: 'Question Approved',
                  subscriptionExpiry: 'Subscription Expiry Reminder',
                  platformUpdates: 'Platform Updates'
                }).map(([key, label]) => (
                  <Switch.Group as="div" key={key} className="flex items-center justify-between">
                    <span className="flex flex-grow flex-col">
                      <Switch.Label as="span" className="text-sm font-medium text-gray-900" passive>
                        {label}
                      </Switch.Label>
                      <Switch.Description as="span" className="text-sm text-gray-500">
                        {key === 'newQuestion' && 'Notify users when their question is submitted for review'}
                        {key === 'questionApproved' && 'Notify users when their question is approved'}
                        {key === 'subscriptionExpiry' && 'Notify users when their subscription is about to expire'}
                        {key === 'platformUpdates' && 'Notify users about platform updates and new features'}
                      </Switch.Description>
                    </span>
                    <Switch
                      checked={emailNotifications[key]}
                      onChange={() => toggleEmailNotification(key)}
                      className={`${
                        emailNotifications[key] ? 'bg-indigo-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                    >
                      <span
                        aria-hidden="true"
                        className={`${
                          emailNotifications[key] ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                      />
                    </Switch>
                  </Switch.Group>
                ))}
              </div>
            </div>
          )}

          {/* Email Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Email Templates</h3>
                  <p className="text-sm text-gray-500">
                    Customize the content of automated emails sent to users
                  </p>
                </div>
                {editingTemplate && (
                  <button
                    onClick={() => setEditingTemplate(null)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back to Templates
                  </button>
                )}
              </div>

              {editingTemplate ? (
                <div className="border-t border-gray-200 pt-6 space-y-4">
                  <div>
                    <label htmlFor="template-subject" className="block text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="template-subject"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={emailTemplates[editingTemplate].subject}
                      onChange={(e) => handleTemplateEdit(editingTemplate, 'subject', e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="template-body" className="block text-sm font-medium text-gray-700">
                      Body
                    </label>
                    <textarea
                      id="template-body"
                      rows={10}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={emailTemplates[editingTemplate].body}
                      onChange={(e) => handleTemplateEdit(editingTemplate, 'body', e.target.value)}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Available variables: <span className="font-mono bg-gray-100 px-1">{"{{user}}"}</span>,{' '}
                      <span className="font-mono bg-gray-100 px-1">{"{{topic}}"}</span>,{' '}
                      <span className="font-mono bg-gray-100 px-1">{"{{subscription}}"}</span>,{' '}
                      <span className="font-mono bg-gray-100 px-1">{"{{days}}"}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Template
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(emailTemplates).map(([key, template]) => (
                          <tr key={key}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                              {key.replace(/([A-Z])/g, ' $1')}
                            </td>
                            <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs">
                              {template.subject}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => setEditingTemplate(key)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with save button */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={saveSettings}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlatformSettings;