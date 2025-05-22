import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TestDetailPage = () => {
  const { testId } = useParams();
  const [testDetail, setTestDetail] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({});
  const [filter, setFilter] = useState('all'); // Filter state for questions
  const [pagination, setPagination] = useState({ current: 1, pages: 1, limit: 20 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTestDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Fetch test session details from /api/tests/history
        const sessionResponse = await fetch(`https://synapaxon-backend.onrender.com/api/tests/history?page=1`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!sessionResponse.ok) {
          throw new Error('Failed to fetch test session details');
        }

        const sessionData = await sessionResponse.json();
        const testSession = sessionData.data.find(test => test._id === testId);
        if (!testSession) {
          throw new Error('Test session not found');
        }

        // Fetch questions using the new endpoint with filter and pagination
        let query = `page=${pagination.current}&limit=${pagination.limit}`;
        if (filter !== 'all') {
          query += `&filter=${filter}`;
        }

        const response = await fetch(`https://synapaxon-backend.onrender.com/api/student-questions/history/${testId}?${query}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch test questions');
        }

        const responseData = await response.json();

        if (responseData.success) {
          // Combine test session data with questions
          const testDetailData = {
            _id: testSession._id,
            startedAt: testSession.startedAt,
            completedAt: testSession.completedAt,
            completed: testSession.completed,
            score: testSession.score,
            totalQuestions: testSession.totalQuestions,
            scorePercentage: testSession.scorePercentage,
            filters: {
              difficulty: testSession.filters.difficulty,
              count: testSession.filters.count
            }
          };

          setTestDetail(testDetailData);
          setQuestions(responseData.data || []);
          setPagination({
            current: responseData.pagination?.current || 1,
            pages: responseData.pagination?.pages || 1,
            limit: responseData.pagination?.limit || 20
          });

          // Fetch all questions (without filter) to calculate analytics
          const allQuestionsResponse = await fetch(`https://synapaxon-backend.onrender.com/api/student-questions/history/${testId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const allQuestionsData = await allQuestionsResponse.json();
          if (allQuestionsData.success && allQuestionsData.data.length > 0) {
            // Calculate analytics: Performance by category, subject, and question stats
            const categoryStats = allQuestionsData.data.reduce((acc, q) => {
              if (!acc[q.category]) {
                acc[q.category] = { correct: 0, total: 0 };
              }
              acc[q.category].total += 1;
              if (q.isCorrect) acc[q.category].correct += 1;
              return acc;
            }, {});

            const subjectStats = allQuestionsData.data.reduce((acc, q) => {
              if (!acc[q.subject]) {
                acc[q.subject] = { correct: 0, total: 0 };
              }
              acc[q.subject].total += 1;
              if (q.isCorrect) acc[q.subject].correct += 1;
              return acc;
            }, {});

            const questionStats = {
              correct: allQuestionsData.data.filter(q => q.isCorrect).length,
              incorrect: allQuestionsData.data.filter(q => !q.isCorrect && q.selectedAnswer !== -1).length,
              flagged: allQuestionsData.data.filter(q => q.selectedAnswer === -1).length,
              avgTimePerQuestion: testSession.completedAt
                ? (() => {
                    const start = new Date(testSession.startedAt);
                    const end = new Date(testSession.completedAt);
                    const totalSeconds = (end - start) / 1000;
                    return testSession.totalQuestions > 0
                      ? Math.round(totalSeconds / testSession.totalQuestions)
                      : 0;
                  })()
                : 'N/A'
            };

            setAnalytics({ categoryStats, subjectStats, questionStats });
          } else {
            setAnalytics({
              categoryStats: {},
              subjectStats: {},
              questionStats: { correct: 0, incorrect: 0, flagged: 0, avgTimePerQuestion: 'N/A' }
            });
          }
        } else {
          throw new Error(responseData.message || 'Failed to fetch test questions');
        }
      } catch (err) {
        console.error('Error fetching test details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      fetchTestDetail();
    }
  }, [testId, filter, pagination.current]);

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page on filter change
  };

  // Handle page change
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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

  if (!testDetail) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Test not found!</strong>
        <span className="block sm:inline"> The requested test could not be found.</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Test History
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 bg-blue-600 text-white">
          <h1 className="text-2xl font-bold">Test Details</h1>
        </div>

        <div className="p-6">
          {/* Test Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Test Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{formatDate(testDetail.startedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${testDetail.completed ? 'text-green-600' : 'text-yellow-600'}`}>
                    {testDetail.completed ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{formatDuration(testDetail.startedAt, testDetail.completedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Questions:</span>
                  <span className="font-medium">{testDetail.totalQuestions}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Performance</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Score:</span>
                  <span className="font-medium">{testDetail.score}/{testDetail.totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Percentage:</span>
                  <span className={`font-medium ${
                    testDetail.scorePercentage >= 70 ? 'text-green-600' : 
                    testDetail.scorePercentage >= 40 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {testDetail.scorePercentage}%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-200 text-blue-800">
                          Progress
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-blue-800">
                          {testDetail.scorePercentage}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                      <div 
                        style={{ width: `${testDetail.scorePercentage}%` }} 
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                          testDetail.scorePercentage >= 70 ? 'bg-green-500' : 
                          testDetail.scorePercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Filter Section */}
          <div className="bg-gray-50 p-4 rounded-lg mb-8">
            <h2 className="text-lg font-semibold mb-4">Test Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-gray-600 block">Difficulty:</span>
                <span className="font-medium capitalize">
                  {testDetail.filters.difficulty}
                </span>
              </div>
              <div>
                <span className="text-gray-600 block">Question Count:</span>
                <span className="font-medium">
                  {testDetail.filters.count}
                </span>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="bg-gray-50 p-4 rounded-lg mb-8">
            <h2 className="text-lg font-semibold mb-4">Performance Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">By Category</h3>
                {Object.entries(analytics.categoryStats || {}).map(([category, stats]) => (
                  <div key={category} className="flex justify-between text-sm mb-1">
                    <span>{category}:</span>
                    <span>{stats.correct}/{stats.total} ({Math.round((stats.correct / stats.total) * 100)}%)</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">By Subject</h3>
                {Object.entries(analytics.subjectStats || {}).map(([subject, stats]) => (
                  <div key={subject} className="flex justify-between text-sm mb-1">
                    <span>{subject}:</span>
                    <span>{stats.correct}/{stats.total} ({Math.round((stats.correct / stats.total) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Question Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-gray-600 block">Correct:</span>
                  <span className="font-medium">{analytics.questionStats?.correct || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600 block">Incorrect:</span>
                  <span className="font-medium">{analytics.questionStats?.incorrect || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600 block">Flagged/Skipped:</span>
                  <span className="font-medium">{analytics.questionStats?.flagged || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600 block">Avg Time per Question:</span>
                  <span className="font-medium">
                    {analytics.questionStats?.avgTimePerQuestion === 'N/A'
                      ? 'N/A'
                      : `${analytics.questionStats.avgTimePerQuestion}s`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Questions and Answers Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Questions & Answers</h2>
              <div>
                <label htmlFor="filter" className="mr-2 text-sm font-medium">Filter:</label>
                <select
                  id="filter"
                  value={filter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="border rounded-md p-1 text-sm"
                >
                  <option value="all">All</option>
                  <option value="correct">Correct</option>
                  <option value="incorrect">Incorrect</option>
                  <option value="flagged">Flagged/Skipped</option>
                </select>
              </div>
            </div>

            {questions.length > 0 ? (
              <>
                {questions.map((question, qIndex) => (
                  <div key={question._id} className="mb-8 bg-gray-50 p-4 rounded-lg">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium">
                        Q{qIndex + 1}: {question.question.questionText}
                      </h3>
                    </div>

                    <div className="space-y-2 mb-4">
                      {question.question.options.map((option, oIndex) => (
                        <div 
                          key={oIndex} 
                          className={`p-3 rounded-lg ${
                            question.selectedAnswer === oIndex && question.isCorrect ? 'bg-green-100 border border-green-300' :
                            question.selectedAnswer === oIndex && !question.isCorrect ? 'bg-red-100 border border-red-300' :
                            'bg-white border border-gray-200'
                          }`}
                        >
                          <div className="flex">
                            <div className="flex-shrink-0">
                              {question.selectedAnswer === oIndex ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${question.isCorrect ? 'text-green-500' : 'text-red-500'}`} viewBox="0 0 20 20" fill="currentColor">
                                  {question.isCorrect ? (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  ) : (
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  )}
                                </svg>
                              ) : (
                                <div className="h-5 w-5"></div>
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {String.fromCharCode(65 + oIndex)}. {option.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      <span>Category: {question.category}</span>
                      <span className="mx-2">•</span>
                      <span>Subject: {question.subject}</span>
                      <span className="mx-2">•</span>
                      <span>Topic: {question.topic}</span>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
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
              </>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No questions found for this filter.
              </div>
            )}
          </div>

          <div className="mt-8 text-right">
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-medium mr-3"
            >
              Back to History
            </button>

            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
            >
              Start a New Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDetailPage;