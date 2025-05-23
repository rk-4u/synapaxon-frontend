import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Image as ImageIcon, Video } from 'lucide-react';

const TestDetailPage = () => {
  const { testId } = useParams();
  const [testDetail, setTestDetail] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({});
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pages: 1, limit: 20 });
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(true);
  const [questionDetails, setQuestionDetails] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTestDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Fetch test session details
        const sessionResponse = await fetch(`http://localhost:8000/api/tests/${testId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!sessionResponse.ok) {
          throw new Error(`Failed to fetch test session: ${sessionResponse.statusText}`);
        }

        const sessionData = await sessionResponse.json();
        if (!sessionData.success) {
          throw new Error(sessionData.message || 'Test session not found');
        }

        // Fetch questions with filter and pagination
        let query = `page=${pagination.current}&limit=${pagination.limit}`;
        if (filter !== 'all') {
          query += `&filter=${filter}`;
        }

        const questionsResponse = await fetch(`http://localhost:8000/api/student-questions/history/${testId}?${query}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!questionsResponse.ok) {
          throw new Error(`Failed to fetch test questions: ${questionsResponse.statusText}`);
        }

        const questionsData = await questionsResponse.json();
        if (!questionsData.success) {
          throw new Error(questionsData.message || 'Failed to fetch test questions');
        }

        setTestDetail({
          _id: sessionData.data._id,
          startedAt: sessionData.data.startedAt,
          completedAt: sessionData.data.completedAt,
          status: sessionData.data.status,
          correctAnswers: sessionData.data.correctAnswers,
          totalQuestions: sessionData.data.totalQuestions,
          scorePercentage: sessionData.data.scorePercentage,
          filters: sessionData.data.filters,
        });

        setQuestions(questionsData.data || []);
        setPagination({
          current: questionsData.pagination?.current || 1,
          pages: questionsData.pagination?.pages || 1,
          limit: questionsData.pagination?.limit || 20,
        });

        // Fetch analytics data
        const allQuestionsResponse = await fetch(`http://localhost:8000/api/student-questions/history/${testId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const allQuestionsData = await allQuestionsResponse.json();
        if (allQuestionsData.success && allQuestionsData.data.length > 0) {
          const categoryStats = allQuestionsData.data.reduce((acc, q) => {
            const category = q.category || 'Unknown';
            if (!acc[category]) {
              acc[category] = { correct: 0, total: 0 };
            }
            acc[category].total += 1;
            if (q.isCorrect) acc[category].correct += 1;
            return acc;
          }, {});

          const subjectStats = allQuestionsData.data.reduce((acc, q) => {
            const subject = q.subject || 'Unknown';
            if (!acc[subject]) {
              acc[subject] = { correct: 0, total: 0 };
            }
            acc[subject].total += 1;
            if (q.isCorrect) acc[subject].correct += 1;
            return acc;
          }, {});

          const questionStats = {
            correct: allQuestionsData.data.filter(q => q.isCorrect).length,
            incorrect: allQuestionsData.data.filter(q => !q.isCorrect && q.selectedAnswer !== -1).length,
            flagged: allQuestionsData.data.filter(q => q.selectedAnswer === -1).length,
            avgTimePerQuestion: sessionData.data.completedAt
              ? (() => {
                  const start = new Date(sessionData.data.startedAt);
                  const end = new Date(sessionData.data.completedAt);
                  const totalSeconds = (end - start) / 1000;
                  return sessionData.data.totalQuestions > 0
                    ? Math.round(totalSeconds / sessionData.data.totalQuestions)
                    : 0;
                })()
              : 'N/A',
          };

          setAnalytics({ categoryStats, subjectStats, questionStats });
        } else {
          setAnalytics({
            categoryStats: {},
            subjectStats: {},
            questionStats: { correct: 0, incorrect: 0, flagged: 0, avgTimePerQuestion: 'N/A' },
          });
        }

        // Fetch additional question details (explanations and media)
        const questionDetailsPromises = questionsData.data.map(async (question) => {
          try {
            const response = await fetch(`http://localhost:8000/api/questions/${question.question?._id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              const questionData = await response.json();
              if (questionData.success) {
                return { [question._id]: questionData.data };
              }
            }
            return { [question._id]: { explanation: 'No explanation available', media: null } };
          } catch (err) {
            console.error(`Error fetching details for question ${question._id}:`, err);
            return { [question._id]: { explanation: 'Error fetching explanation', media: null } };
          }
        });

        const questionDetailsArray = await Promise.all(questionDetailsPromises);
        const mergedQuestionDetails = questionDetailsArray.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        setQuestionDetails(mergedQuestionDetails);
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

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
  };

  const toggleQuestion = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  };

  const formatDuration = (startDate, endDate) => {
    if (!endDate) return 'In Progress';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const renderMedia = (media) => {
    if (!media) return null;
    if (media.type === 'image') {
      return (
        <div className="mt-4">
          <div className="flex items-center mb-2">
            <ImageIcon className="w-5 h-5 text-indigo-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Image</span>
          </div>
          <img
            src={media.url}
            alt="Question media"
            className="max-w-full h-auto rounded-lg border border-gray-200"
            onError={(e) => {
              e.target.alt = 'Failed to load image';
              e.target.className = 'text-red-600';
            }}
          />
        </div>
      );
    } else if (media.type === 'video') {
      return (
        <div className="mt-4">
          <div className="flex items-center mb-2">
            <Video className="w-5 h-5 text-indigo-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Video</span>
          </div>
          <video
            controls
            src={media.url}
            className="max-w-full h-auto rounded-lg border border-gray-200"
            onError={(e) => {
              e.target.nextSibling.textContent = 'Failed to load video';
              e.target.nextSibling.className = 'text-red-600';
            }}
          >
            <p className="text-red-600">Your browser does not support the video tag.</p>
          </video>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto mt-12 p-8 bg-red-50 border border-red-300 rounded-2xl shadow-lg">
        <div className="flex items-center">
          <svg className="w-8 h-8 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-800 text-lg font-semibold">{error}</span>
        </div>
      </div>
    );
  }

  if (!testDetail) {
    return (
      <div className="max-w-7xl mx-auto mt-12 p-8 bg-yellow-50 border border-yellow-300 rounded-2xl shadow-lg">
        <div className="flex items-center">
          <svg className="w-8 h-8 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-yellow-800 text-lg font-semibold">Test not found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors text-lg font-semibold"
          >
            <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-600 p-8 text-white">
            <h1 className="text-3xl font-extrabold tracking-tight">Test Details</h1>
          </div>

          <div className="p-8">
            {/* Test Summary & Performance */}
            <div className="border-b border-gray-200 mb-8">
              <button
                onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                className="w-full p-6 flex justify-between items-center text-left bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <h2 className="text-2xl font-semibold text-gray-900">Test Summary & Performance</h2>
                {isSummaryOpen ? (
                  <ChevronUp className="w-6 h-6 text-gray-600" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-600" />
                )}
              </button>
              {isSummaryOpen && (
                <div className="p-6 bg-gray-50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Summary</h3>
                      <div className="space-y-4 text-base">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date</span>
                          <span className="font-medium text-gray-900">{formatDate(testDetail.startedAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status</span>
                          <span
                            className={`font-medium ${
                              testDetail.status === 'succeeded'
                                ? 'text-green-600'
                                : testDetail.status === 'canceled'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                            }`}
                          >
                            {testDetail.status === 'succeeded' ? 'Completed' : testDetail.status === 'canceled' ? 'Canceled' : 'In Progress'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration</span>
                          <span className="font-medium text-gray-900">{formatDuration(testDetail.startedAt, testDetail.completedAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Questions</span>
                          <span className="font-medium text-gray-900">{testDetail.totalQuestions}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance</h3>
                      <div className="space-y-4 text-base">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Score</span>
                          <span className="font-medium text-gray-900">{testDetail.correctAnswers}/{testDetail.totalQuestions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Percentage</span>
                          <span
                            className={`font-medium ${
                              testDetail.scorePercentage >= 70
                                ? 'text-green-600'
                                : testDetail.scorePercentage >= 40
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {testDetail.scorePercentage}%
                          </span>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <span>Progress</span>
                            <span>{testDetail.scorePercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full ${
                                testDetail.scorePercentage >= 70
                                  ? 'bg-green-500'
                                  : testDetail.scorePercentage >= 40
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${testDetail.scorePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Test Filters */}
            <div className="border-b border-gray-200 mb-8">
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="w-full p-6 flex justify-between items-center text-left bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <h2 className="text-2xl font-semibold text-gray-900">Test Filters</h2>
                {isFiltersOpen ? (
                  <ChevronUp className="w-6 h-6 text-gray-600" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-600" />
                )}
              </button>
              {isFiltersOpen && (
                <div className="p-6 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-base">
                    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <span className="text-gray-600 block mb-2">Difficulty</span>
                      <span className="font-medium text-gray-900 capitalize">{testDetail.filters?.difficulty || 'N/A'}</span>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <span className="text-gray-600 block mb-2">Question Count</span>
                      <span className="font-medium text-gray-900">{testDetail.filters?.count || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Breakdown */}
            <div className="border-b border-gray-200 mb-8">
              <button
                onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
                className="w-full p-6 flex justify-between items-center text-left bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <h2 className="text-2xl font-semibold text-gray-900">Performance Breakdown</h2>
                {isAnalyticsOpen ? (
                  <ChevronUp className="w-6 h-6 text-gray-600" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-600" />
                )}
              </button>
              {isAnalyticsOpen && (
                <div className="p-6 bg-gray-50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-base">
                    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">By Category</h3>
                      {Object.entries(analytics.categoryStats || {}).map(([category, stats]) => (
                        <div key={category} className="flex justify-between mb-3">
                          <span className="text-gray-600">{category}</span>
                          <span className="font-medium text-gray-900">
                            {stats.correct}/{stats.total} ({Math.round((stats.correct / stats.total) * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">By Subject</h3>
                      {Object.entries(analytics.subjectStats || {}).map(([subject, stats]) => (
                        <div key={subject} className="flex justify-between mb-3">
                          <span className="text-gray-600">{subject}</span>
                          <span className="font-medium text-gray-900">
                            {stats.correct}/{stats.total} ({Math.round((stats.correct / stats.total) * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-base">
                      <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <span className="text-gray-600 block mb-2">Correct</span>
                        <span className="font-medium text-gray-900">{analytics.questionStats?.correct || 0}</span>
                      </div>
                      <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <span className="text-gray-600 block mb-2">Incorrect</span>
                        <span className="font-medium text-gray-900">{analytics.questionStats?.incorrect || 0}</span>
                      </div>
                      <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <span className="text-gray-600 block mb-2">Flagged/Skipped</span>
                        <span className="font-medium text-gray-900">{analytics.questionStats?.flagged || 0}</span>
                      </div>
                      <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <span className="text-gray-600 block mb-2">Avg Time per Question</span>
                        <span className="font-medium text-gray-900">
                          {analytics.questionStats?.avgTimePerQuestion === 'N/A'
                            ? 'N/A'
                            : `${analytics.questionStats.avgTimePerQuestion}s`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Questions & Answers */}
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900">Questions & Answers</h2>
                <div className="flex items-center space-x-3">
                  <label htmlFor="filter" className="text-base font-medium text-gray-700">Filter:</label>
                  <select
                    id="filter"
                    value={filter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="border border-gray-300 rounded-lg p-2 text-base bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    <div key={question._id} className="mb-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
                      <button
                        onClick={() => toggleQuestion(question._id)}
                        className="w-full p-6 flex justify-between items-center text-left hover:bg-gray-50 transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-gray-900">
                          Q{qIndex + 1}: {question.question?.questionText || 'Question not available'}
                        </h3>
                        {expandedQuestions[question._id] ? (
                          <ChevronUp className="w-6 h-6 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-gray-600" />
                        )}
                      </button>
                      {expandedQuestions[question._id] && (
                        <div className="p-6 border-t border-gray-200">
                          <div className="space-y-3 mb-4">
                            {question.question?.options?.map((option, oIndex) => (
                              <div
                                key={oIndex}
                                className={`p-4 rounded-lg flex items-center space-x-4 ${
                                  question.selectedAnswer === oIndex && question.isCorrect
                                    ? 'bg-green-50 border border-green-200'
                                    : question.selectedAnswer === oIndex && !question.isCorrect
                                    ? 'bg-red-50 border border-red-200'
                                    : question.correctAnswer === oIndex
                                    ? 'bg-blue-50 border border-blue-200'
                                    : 'bg-gray-50 border border-gray-200'
                                }`}
                              >
                                <div className="flex-shrink-0">
                                  {question.selectedAnswer === oIndex ? (
                                    <svg
                                      className={`w-6 h-6 ${question.isCorrect ? 'text-green-500' : 'text-red-500'}`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      {question.isCorrect ? (
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                          clipRule="evenodd"
                                        />
                                      ) : (
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                          clipRule="evenodd"
                                        />
                                      )}
                                    </svg>
                                  ) : question.correctAnswer === oIndex ? (
                                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  ) : (
                                    <div className="w-6 h-6"></div>
                                  )}
                                </div>
                                <p className="text-base text-gray-700">
                                  {String.fromCharCode(65 + oIndex)}. {option?.text || 'Option not available'}
                                </p>
                              </div>
                            ))}
                          </div>
                          {renderMedia(questionDetails[question._id]?.media)}
                          <div className="mt-4">
                            <h4 className="text-base font-semibold text-gray-900 mb-2">Explanation</h4>
                            <p className="text-sm text-gray-700">{questionDetails[question._id]?.explanation || 'No explanation available'}</p>
                          </div>
                          <div className="text-sm text-gray-500 mt-4">
                            <span>Category: {question.category || 'N/A'}</span>
                            <span className="mx-2">•</span>
                            <span>Subject: {question.subject || 'N/A'}</span>
                            <span className="mx-2">•</span>
                            <span>Topic: {question.topic || 'N/A'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {pagination.pages > 1 && (
                    <div className="flex justify-center mt-8">
                      <nav className="inline-flex rounded-lg shadow-sm">
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-5 py-2 border text-base font-medium ${
                              pagination.current === page
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            } ${page === 1 ? 'rounded-l-lg' : ''} ${page === pagination.pages ? 'rounded-r-lg' : ''}`}
                          >
                            {page}
                          </button>
                        ))}
                      </nav>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-600 py-6 text-lg font-medium">
                  No questions found for this filter.
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-base font-semibold"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-base font-semibold"
              >
                Start a New Test
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDetailPage;