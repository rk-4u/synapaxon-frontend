import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AnalyticsDashboard = () => {
  // Sample data - in a real app, this would come from your backend API
  const questionsByCategory = [
    { name: 'Cardiology', value: 423 },
    { name: 'Neurology', value: 387 },
    { name: 'Endocrinology', value: 356 },
    { name: 'Oncology', value: 298 },
    { name: 'Pulmonology', value: 245 },
    { name: 'Other', value: 312 }
  ];

  const userActivity = [
    { name: 'Jan', active: 4000, new: 2400 },
    { name: 'Feb', active: 3000, new: 1398 },
    { name: 'Mar', active: 2000, new: 9800 },
    { name: 'Apr', active: 2780, new: 3908 },
    { name: 'May', active: 1890, new: 4800 },
    { name: 'Jun', active: 2390, new: 3800 },
    { name: 'Jul', active: 3490, new: 4300 }
  ];

  const difficultyPerformance = [
    { name: 'Easy', attempts: 4000, correct: 3000 },
    { name: 'Medium', attempts: 3000, correct: 2000 },
    { name: 'Hard', attempts: 2000, correct: 1000 }
  ];

  const subscriptionDistribution = [
    { name: 'Premium', value: 45 },
    { name: 'Basic', value: 30 },
    { name: 'Trial', value: 15 },
    { name: 'Institutional', value: 10 }
  ];

  const stats = [
    { name: 'Total Users', value: '8,542', change: '+12%', changeType: 'positive' },
    { name: 'Active Users (30d)', value: '3,219', change: '+7.8%', changeType: 'positive' },
    { name: 'Questions in Bank', value: '12,456', change: '+3.2%', changeType: 'positive' },
    { name: 'Avg. Test Score', value: '72.5%', change: '-1.2%', changeType: 'negative' }
  ];

  const topDifficultQuestions = [
    { question: "Which of the following is the most common genetic mutation in pancreatic ductal adenocarcinoma?", correctRate: '23%' },
    { question: "The most sensitive test for diagnosing pheochromocytoma is measurement of:", correctRate: '28%' },
    { question: "Which of the following is the most common cause of nephrotic syndrome in adults?", correctRate: '31%' },
    { question: "The most common side effect of long-term lithium therapy is:", correctRate: '35%' },
    { question: "Which of the following is the most common cause of hypercalcemia in hospitalized patients?", correctRate: '38%' }
  ];

  const recentFeedback = [
    { text: "Great questions, but need more cardiology content", user: "medical_student1", date: "2 days ago" },
    { text: "The explanation for question #2345 is incorrect", user: "future_doctor", date: "4 days ago" },
    { text: "Would love to see more image-based questions", user: "anatomy_learner", date: "1 week ago" }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Platform Analytics</h2>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  stat.changeType === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
        
        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Questions by Category Pie Chart */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Questions by Category</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={questionsByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {questionsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* User Activity Bar Chart */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Activity</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={userActivity}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="active" fill="#8884d8" name="Active Users" />
                  <Bar dataKey="new" fill="#82ca9d" name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Performance by Difficulty Bar Chart */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance by Difficulty</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={difficultyPerformance}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="attempts" fill="#8884d8" name="Attempts" />
                  <Bar dataKey="correct" fill="#82ca9d" name="Correct Answers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Subscription Distribution Pie Chart */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subscriptionDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {subscriptionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Additional Analytics Sections */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Difficult Questions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top 5 Difficult Questions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topDifficultQuestions.map((q, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-normal text-sm text-gray-900 max-w-xs">{q.question}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{q.correctRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Recent User Feedback */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent User Feedback</h3>
            <div className="space-y-4">
              {recentFeedback.map((feedback, index) => (
                <div key={index} className="p-3 bg-white rounded-lg shadow-xs">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">"{feedback.text}"</span>
                    <span className="text-xs text-gray-500">{feedback.date}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">- {feedback.user}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;