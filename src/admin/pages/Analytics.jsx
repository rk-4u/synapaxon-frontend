import AnalyticsDashboard from '../components/AnalyticsDashboard';

const Analytics = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
      <p className="text-sm text-gray-500 mb-6">Platform usage statistics and insights</p>
      <AnalyticsDashboard />
    </div>
  );
};

export default Analytics;