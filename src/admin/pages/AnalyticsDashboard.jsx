import React, { useState, useEffect } from 'react';
import axios from '../../api/axiosConfig';
import { Users, FileQuestion, CheckCircle } from 'lucide-react';

const AnalyticsDashboard = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersByPlan, setUsersByPlan] = useState({});
  const [totalQuestionsCreated, setTotalQuestionsCreated] = useState(0);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch total users
        const usersRes = await axios.get('/api/auth/users/count', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setTotalUsers(usersRes.data.count || 0);

        // Fetch users by plan
        const plansRes = await axios.get('/api/auth/users/plans', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setUsersByPlan(plansRes.data.data || {});

        // Fetch total questions created
        const questionsRes = await axios.get('/api/questions/total', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setTotalQuestionsCreated(questionsRes.data.data?.totalQuestions || 0);

        // Fetch total questions answered
        const answeredRes = await axios.get('/api/student-questions/total', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setTotalQuestionsAnswered(answeredRes.data.data?.totalQuestionsAnswered || 0);

        setLoading(false);
      } catch (err) {
        setError('Failed to load analytics data');
        setLoading(false);
        console.error('Error fetching analytics data:', err);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-900 dark:text-white">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4">
          <Users className="w-12 h-12 text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalUsers}</p>
          </div>
        </div>

        {/* Users by Plan */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Users by Plan</h3>
          <div className="space-y-2">
            {Object.entries(usersByPlan).map(([plan, count]) => (
              <div key={plan} className="flex justify-between text-gray-600 dark:text-gray-300">
                <span className="capitalize">{plan}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Questions Created */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4">
          <FileQuestion className="w-12 h-12 text-green-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Questions Created</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalQuestionsCreated}</p>
          </div>
        </div>

        {/* Questions Answered */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4">
          <CheckCircle className="w-12 h-12 text-purple-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Questions Answered</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalQuestionsAnswered}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;