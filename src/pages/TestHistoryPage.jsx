import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TestHistoryPage = () => {
  const [testHistory, setTestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pages: 1 });
  const [totalTests, setTotalTests] = useState(0);
  const [analytics, setAnalytics] = useState({ averageScore: 0, completionRate: 0 });
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchTestHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        const response = await fetch(`https://synapaxon-backend.onrender.com/api/tests/history?page=${pagination.current}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch test history');
        }
        
        const responseData = await response.json();
        
        if (responseData.success) {
          setTestHistory(responseData.data);
          setPagination(responseData.pagination || { current: 1, pages: 1 });
          setTotalTests(responseData.total || 0);

          // Calculate analytics
          const completedTests = responseData.data.filter(test => test.completed).length;
          const totalScorePercentage = responseData.data.reduce((sum, test) => sum + test.scorePercentage, 0);
          setAnalytics({
            averageScore: responseData.data.length > 0 ? Math.round(totalScorePercentage / responseData.data.length) : 0,
            completionRate: responseData.data.length > 0 ? Math.round((completedTests / responseData.data.length) * 100) : 0
          });
        } else {
          throw new Error(responseData.message || 'Failed to fetch test history');
        }
      } catch (err) {
        console.error('Error fetching test history:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTestHistory();
  }, [pagination.current]);

  // Handle page change
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  // Format duration
  const formatDuration = (startDate, endDate) => {
    if (!endDate) return 'In Progress';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };
  
  // Navigate to test detail
  const viewTestDetail = (testId) => {
    navigate(`/dashboard/test-detail/${testId}`);
  };
  
  // Generate a simple text-based score trend representation
  const renderScoreTrend = () => {
    const scores = testHistory.map(test => test.scorePercentage);
    const maxScore = Math.max(...scores, 100);
    const barHeight = 5; // Number of lines for the trend representation
    let trendLines = [];

    for (let i = barHeight; i >= 0; i--) {
      const threshold = (i / barHeight) * maxScore;
      let line = scores.map(score => (score >= threshold ? '█' : ' ').padStart(2, ' ')).join('');
      trendLines.push(`${String(Math.round(threshold)).padStart(3, ' ')}% |${line}|`);
    }

    return trendLines.join('\n');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
          <h1 className="text-2xl font-bold">Test History</h1>
          <div className="text-sm">
            Total Tests: <span className="font-semibold">{totalTests}</span>
          </div>
        </div>
        
        {/* Analytics Section */}
        <div className="p-6 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold mb-4">Performance Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-gray-600 block">Average Score:</span>
              <span className="font-medium">{analytics.averageScore}%</span>
            </div>
            <div>
              <span className="text-gray-600 block">Completion Rate:</span>
              <span className="font-medium">{analytics.completionRate}%</span>
            </div>
            <div>
              <span className="text-gray-600 block">Score Trend:</span>
              <pre className="text-xs font-mono bg-white p-2 rounded">{renderScoreTrend()}</pre>
            </div>
          </div>
        </div>
        
        {testHistory.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">You haven't taken any tests yet.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testHistory.map((test) => (
                    <tr key={test._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(test.startedAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          test.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {test.completed ? 'Completed' : 'In Progress'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">{test.filters.difficulty}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {test.score}/{test.totalQuestions} ({test.scorePercentage}%)
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className={`h-1.5 rounded-full ${
                              test.scorePercentage >= 70 ? 'bg-green-500' : 
                              test.scorePercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} 
                            style={{ width: `${test.scorePercentage}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDuration(test.startedAt, test.completedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => viewTestDetail(test._id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="inline-flex rounded-md shadow">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 border ${
                        pagination.current === page
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestHistoryPage;