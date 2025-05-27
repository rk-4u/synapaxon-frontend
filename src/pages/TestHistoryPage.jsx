import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Award,
  Clock,
  Target,
  BookOpen,
  BarChart3,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Title,
  Tooltip,
  Legend
);

const TestHistoryPage = () => {
  const [testHistory, setTestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalTests: 0,
    completedTests: 0,
    canceledTests: 0,
    inProgressTests: 0,
    averageScore: 0,
    completionRate: 0,
    bestScore: 0,
    totalTimeSpent: 0,
  });
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTestHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await fetch("https://synapaxon-backend.onrender.com/api/tests", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch test history: ${response.statusText}`);
        }

        const responseData = await response.json();

        if (responseData.success) {
          setTestHistory(responseData.data);
          
          const data = responseData.data;
          const completedTests = data.filter(test => test.status === "succeeded");
          const canceledTests = data.filter(test => test.status === "canceled");
          const inProgressTests = data.filter(test => test.status === "in_progress");
          
          const totalScorePercentage = completedTests.reduce(
            (sum, test) => sum + (test.scorePercentage || 0),
            0
          );
          
          const bestScore = completedTests.length > 0 
            ? Math.max(...completedTests.map(test => test.scorePercentage || 0))
            : 0;
            
          const totalTimeSpent = data.reduce((sum, test) => {
            if (test.completedAt && test.startedAt) {
              const duration = new Date(test.completedAt) - new Date(test.startedAt);
              return sum + (duration / 60000); // Convert to minutes
            }
            return sum;
          }, 0);

          setAnalytics({
            totalTests: data.length,
            completedTests: completedTests.length,
            canceledTests: canceledTests.length,
            inProgressTests: inProgressTests.length,
            averageScore: completedTests.length > 0
              ? Math.round(totalScorePercentage / completedTests.length)
              : 0,
            completionRate: data.length > 0
              ? Math.round((completedTests.length / data.length) * 100)
              : 0,
            bestScore: Math.round(bestScore),
            totalTimeSpent: Math.round(totalTimeSpent),
          });
        } else {
          throw new Error(responseData.message || "Failed to fetch test history");
        }
      } catch (err) {
        console.error("Error fetching test history:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTestHistory();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  };

  const formatDuration = (startDate, endDate) => {
    if (!endDate) return "In Progress";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const viewTestDetail = (testId) => {
    navigate(`/dashboard/test-detail/${testId}`);
  };

  // Chart data for performance trend
  const chartData = {
    labels: testHistory.slice(-10).map((test, index) => `Test ${index + 1}`),
    datasets: [
      {
        label: "Score Percentage",
        data: testHistory.slice(-10).map(test => test.scorePercentage || 0),
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Empty state component for analytics
  const EmptyAnalytics = () => (
    <div className="p-6 bg-gray-50 dark:bg-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 p-6 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-700 text-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </div>
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">Average Score</h3>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">--</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 p-6 rounded-xl border-2 border-dashed border-green-200 dark:border-green-700 text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6 text-green-600 dark:text-green-300" />
          </div>
          <h3 className="text-sm font-semibold text-green-900 dark:text-green-200 mb-1">Best Score</h3>
          <div className="text-2xl font-bold text-green-600 dark:text-green-300">--</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/50 dark:to-violet-900/50 p-6 rounded-xl border-2 border-dashed border-purple-200 dark:border-purple-700 text-center">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-300" />
          </div>
          <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-1">Completion Rate</h3>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">--</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 p-6 rounded-xl border-2 border-dashed border-orange-200 dark:border-orange-700 text-center">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-orange-600 dark:text-orange-300" />
          </div>
          <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-200 mb-1">Time Spent</h3>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-300">--</div>
        </div>
      </div>
    </div>
  );

  // Empty state component for test history
  const EmptyTestHistory = () => (
    <div className="p-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-8">
          <BookOpen className="w-16 h-16 text-indigo-600 dark:text-indigo-300" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">No Tests Yet</h3>
        <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 leading-relaxed">
          Ready to test your knowledge? Start your first practice test and track your progress over time.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => navigate("/dashboard/starttest")}
            className="w-full px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Start Your First Test
          </button>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-300">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>Timed Practice</span>
            </div>
            <div className="flex items-center">
              <Target className="w-4 h-4 mr-2" />
              <span>Instant Results</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span>Progress Tracking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 dark:border-indigo-300 mb-4 mx-auto"></div>
          <div className="text-gray-600 dark:text-gray-300 text-lg font-medium">
            Loading your test history...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto mt-12 p-8 bg-red-50 dark:bg-red-900/50 border border-red-300 dark:border-red-600 rounded-2xl shadow-lg">
        <div className="flex items-center">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-300 mr-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-red-800 dark:text-red-200 text-lg font-semibold">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-600 dark:to-indigo-500 p-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
                  Test History
                </h1>
                <p className="text-blue-100 dark:text-blue-200">
                  Track your learning progress and performance
                </p>
              </div>
              <div className="text-right">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">{analytics.totalTests}</div>
                  <div className="text-blue-100 text-sm">Total Tests</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {analytics.completedTests}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {analytics.canceledTests}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Canceled</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {analytics.inProgressTests}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="border-b border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
              className="w-full p-6 flex justify-between items-center text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Performance Analytics
              </h2>
              {isAnalyticsOpen ? (
                <ChevronUp className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            
            {isAnalyticsOpen && (
              testHistory.length === 0 ? (
                <EmptyAnalytics />
              ) : (
                <div className="p-6 bg-gray-50 dark:bg-gray-800">
                  {/* Analytics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">Average Score</span>
                        <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                      </div>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                        {analytics.averageScore}%
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">Best Score</span>
                        <Award className="w-4 h-4 text-green-600 dark:text-green-300" />
                      </div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                        {analytics.bestScore}%
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">Completion Rate</span>
                        <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                      </div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                        {analytics.completionRate}%
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">Time Spent</span>
                        <Clock className="w-4 h-4 text-orange-600 dark:text-orange-300" />
                      </div>
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-300">
                        {analytics.totalTimeSpent}m
                      </div>
                    </div>
                  </div>

                  {/* Performance Chart */}
                  {testHistory.length > 1 && (
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Performance Trend (Last 10 Tests)
                      </h3>
                      <div className="h-64">
                        <Line data={chartData} options={chartOptions} />
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* Test History Table */}
          {testHistory.length === 0 ? (
            <EmptyTestHistory />
          ) : (
            <div className="p-8">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        Test Date
                      </th>
                      <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-8 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {testHistory.map((test) => (
                      <tr
                        key={test._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <td className="px-8 py-5 whitespace-nowrap text-base text-gray-900 dark:text-gray-200">
                          {formatDate(test.startedAt)}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 text-sm font-semibold rounded-full ${
                              test.status === "succeeded"
                                ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300"
                                : test.status === "canceled"
                                ? "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300"
                                : "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300"
                            }`}
                          >
                            {test.status === "succeeded"
                              ? "Completed"
                              : test.status === "canceled"
                              ? "Canceled"
                              : "In Progress"}
                          </span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="text-base font-medium text-gray-900 dark:text-gray-200">
                            {test.correctAnswers || 0}/{test.totalQuestions} (
                            {Math.round(test.scorePercentage || 0)}%)
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                            <div
                              className={`h-2 rounded-full ${
                                test.scorePercentage >= 70
                                  ? "bg-green-500 dark:bg-green-400"
                                  : test.scorePercentage >= 40
                                  ? "bg-yellow-500 dark:bg-yellow-400"
                                  : "bg-red-500 dark:bg-red-400"
                              }`}
                              style={{ width: `${test.scorePercentage || 0}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-base text-gray-900 dark:text-gray-200">
                          {formatDuration(test.startedAt, test.completedAt)}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right text-base font-medium">
                          <button
                            onClick={() => viewTestDetail(test._id)}
                            className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors font-semibold"
                          >
                            View Details
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
      </div>
    </div>
  );
};

export default TestHistoryPage;