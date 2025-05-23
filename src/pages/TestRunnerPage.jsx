import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../api/axiosConfig';
import { Menu, Clock, Flag, Check, ChevronLeft, ChevronRight, X, PlayCircle, PauseCircle } from 'lucide-react';

const TestRunnerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  // State variables
  const [questions, setQuestions] = useState([]);
  const [testSessionId, setTestSessionId] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(90);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [timerPaused, setTimerPaused] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [submittedQuestions, setSubmittedQuestions] = useState([]);
  const [showUnansweredModal, setShowUnansweredModal] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  // Retrieve test data from sessionStorage if location.state is unavailable
  const testData = location.state || JSON.parse(sessionStorage.getItem('testData')) || {};

  const usePerQuestionTimer = testData.testDuration && parseInt(testData.testDuration) === 90;

  // Check for token
  useEffect(() => {
    if (!token) {
      alert('Authentication token is missing. Please log in again.');
      navigate('/login');
    }
  }, [token, navigate]);

  // Initialize test
  useEffect(() => {
    const initializeTest = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { testSessionId, questions, selectedFilters } = testData;
        if (!testSessionId || !questions || questions.length === 0) {
          throw new Error('Missing test data. Please start a new test from the filter page.');
        }

        if (!questions.every(q => q._id)) {
          throw new Error('Invalid question data: Each question must have an _id.');
        }

        // Log testSessionId for debugging
        console.log("Initializing test with testSessionId:", testSessionId);

        setTestSessionId(testSessionId);
        setQuestions(questions);
        setSelectedFilters(selectedFilters || {});
        setUserAnswers(questions.map(q => ({ questionId: q._id, selectedAnswer: null })));
        setQuestionStartTime(Date.now());
        if (usePerQuestionTimer) {
          setTimeLeft(90);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error initializing test:', err);
        setError('Failed to load test session. Please start a new test.');
        setLoading(false);
      }
    };

    initializeTest();
  }, [testData, token]);

  // Timer effect
  useEffect(() => {
    if (!usePerQuestionTimer || timerPaused || !timeLeft || loading || error || testCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, error, testCompleted, timerPaused, currentQuestionIndex, usePerQuestionTimer]);

  // Reset timer on question change
  useEffect(() => {
    if (usePerQuestionTimer && !testCompleted) {
      setTimeLeft(90);
      setTimerPaused(false);
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, usePerQuestionTimer]);

  // Auto-submit on timer expiry
  const handleAutoSubmit = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    await handleSubmitQuestion(-1);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleEndTest();
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle timer pause
  const toggleTimerPause = () => {
    setTimerPaused(prev => !prev);
  };

  // Handle answer selection
  const handleAnswerSelect = (answerIndex) => {
    setUserAnswers(prev => {
      const updated = [...prev];
      const questionIndex = updated.findIndex(a => a.questionId === questions[currentQuestionIndex]._id);
      updated[questionIndex].selectedAnswer = answerIndex;
      return updated;
    });
  };

  // Navigate questions
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };

  // Flag question
  const toggleFlagQuestion = (questionId) => {
    setFlaggedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });

    setUserAnswers(prev => {
      const updated = [...prev];
      const questionIndex = updated.findIndex(a => a.questionId === questionId);
      if (questionIndex !== -1) {
        updated[questionIndex].selectedAnswer = prev.includes(questionId) ? null : -1;
      }
      return updated;
    });
  };

  // Calculate time taken
  const calculateTimeTaken = () => {
    return Math.floor((Date.now() - questionStartTime) / 1000);
  };

  // Submit question
  const handleSubmitQuestion = async (autoSelectedAnswer = null) => {
    const currentQuestion = questions[currentQuestionIndex];
    const questionId = currentQuestion._id;
    if (!testSessionId || !questionId) {
      alert('Error: Test session or question ID is missing.');
      return;
    }

    const userAnswer = userAnswers.find(a => a.questionId === questionId);
    const selectedAnswer = autoSelectedAnswer !== null ? autoSelectedAnswer : (userAnswer?.selectedAnswer ?? -1);
    const timeTaken = calculateTimeTaken();

    const payload = {
      testSessionId,
      questionId,
      selectedAnswer,
      timeTaken,
    };

    setSubmitting(true);
    try {
      const response = await axios.post('/api/student-questions/submit', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        setSubmittedQuestions(prev => {
          if (!prev.includes(questionId)) {
            return [...prev, questionId];
          }
          return prev;
        });
      } else {
        throw new Error(response.data.message || 'Submission failed.');
      }
    } catch (err) {
      console.error('Error submitting question:', err);
      if (err.response?.status === 401) {
        alert('Session expired. Please log in again.');
        navigate('/login');
      } else {
        alert(`Submission failed: ${err.response?.data?.message || err.message || 'Please try again.'}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Submit unanswered questions
  const submitUnansweredQuestions = async () => {
    const unsubmittedQuestions = questions.filter(q => !submittedQuestions.includes(q._id));
    if (unsubmittedQuestions.length === 0) {
      await finalizeTest();
      return;
    }

    setSubmitting(true);
    try {
      const submissionPromises = unsubmittedQuestions.map(async (question) => {
        const payload = {
          testSessionId,
          questionId: question._id,
          selectedAnswer: -1,
          timeTaken: 0,
        };

        const response = await axios.post('/api/student-questions/submit', payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.data.success) {
          setSubmittedQuestions(prev => [...prev, question._id]);
        } else {
          throw new Error(`Failed to submit question ${question._id}: ${response.data.message}`);
        }
      });

      await Promise.all(submissionPromises);
      await finalizeTest();
    } catch (err) {
      console.error('Error submitting unanswered questions:', err);
      if (err.response?.status === 401) {
        alert('Session expired. Please log in again.');
        navigate('/login');
      } else {
        setError(`Failed to submit some answers: ${err.message || 'Please try again.'}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Finalize test
  const finalizeTest = async () => {
    try {
      setLoading(true);

      // Log testSessionId for debugging
      console.log("Finalizing test with testSessionId:", testSessionId);

      // Validate test session
      let testSession;
      try {
        const sessionResponse = await axios.get(`/api/tests/${testSessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        testSession = sessionResponse.data.data;
      } catch (err) {
        if (err.response?.status === 404) {
          console.error(`Test session ${testSessionId} not found in database.`);
          setError('Test session not found. Please start a new test.');
          setTestCompleted(true);
          sessionStorage.removeItem('testData');
          return;
        }
        throw err;
      }

      if (['succeeded', 'canceled'].includes(testSession.status)) {
        setError('This test has already been completed or canceled.');
        setTestCompleted(true);
        setTestResults(testSession);
        sessionStorage.removeItem('testData');
        return;
      }

      // Update test session status to 'succeeded'
      await axios.put(
        `/api/tests/${testSessionId}`,
        { status: 'succeeded' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Fetch student questions for results
      const resultsResponse = await axios.get(`/api/student-questions/test/${testSessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const studentQuestions = resultsResponse.data.data || [];

      // Update test results with answers
      const resultsData = {
        score: studentQuestions.filter(q => q.isCorrect).length,
        totalQuestions: questions.length,
        answers: studentQuestions.map(q => ({
          question: q.question._id || q.question,
          selectedAnswer: q.selectedAnswer,
          isCorrect: q.isCorrect,
          correctAnswer: q.correctAnswer,
          timeTaken: q.timeTaken || 0,
        })),
      };

      // Refresh question details
      const updatedQuestions = await Promise.all(
        questions.map(async (question) => {
          try {
            const questionResponse = await axios.get(`/api/questions/${question._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            return questionResponse.data.data;
          } catch (err) {
            console.error(`Error fetching question ${question._id}:`, err);
            return question;
          }
        })
      );

      setQuestions(updatedQuestions);
      setTestResults(resultsData);
      setTestCompleted(true);
      sessionStorage.removeItem('testData');
    } catch (err) {
      console.error('Error finalizing test:', err);
      if (err.response?.status === 401) {
        alert('Session expired. Please log in again.');
        navigate('/login');
      } else {
        setError(`Failed to finalize test: ${err.response?.data?.message || err.message || 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // End test
  const handleEndTest = () => {
    const unansweredExists = userAnswers.some(a => a.selectedAnswer === null && !submittedQuestions.includes(a.questionId));
    if (unansweredExists) {
      setShowUnansweredModal(true);
    } else {
      submitUnansweredQuestions();
    }
  };

  // Direct submit
  const handleDirectSubmit = async () => {
    setShowUnansweredModal(false);
    await finalizeTest();
  };

  // Submit with defaults
  const handleSubmitWithDefaults = async () => {
    setShowUnansweredModal(false);
    await submitUnansweredQuestions();
  };

  // Back to dashboard
  const handleBackToDashboard = () => {
    if (confirm('Are you sure you want to leave?')) {
      sessionStorage.removeItem('testData');
      navigate('/dashboard');
    }
  };

  // Loading state
  if (loading && !testCompleted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 max-w-md mx-auto">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading your test...</h2>
          <p className="text-gray-500 mt-2">Please wait while we prepare your questions.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 max-w-md mx-auto bg-white rounded-lg shadow">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Error</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={handleBackToDashboard} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = userAnswers.filter(a => a.selectedAnswer !== null && a.selectedAnswer !== -1).length;
  const isQuestionSubmitted = submittedQuestions.includes(currentQuestion?._id);
  const isQuestionFlagged = flaggedQuestions.includes(currentQuestion?._id);

  // Test results
  if (testCompleted && testResults) {
    const score = testResults.score ?? 0;
    const totalQuestions = testResults.totalQuestions ?? questions.length;
    const scorePercentage = Math.round(totalQuestions > 0 ? (score / totalQuestions) * 100 : 0);
    const answers = testResults.answers ?? [];

    const categoryStats = questions.reduce((acc, question) => {
      const answerData = answers.find(a => a && a.question === question._id);
      const category = question.category || 'Unknown';
      if (!acc[category]) {
        acc[category] = { correct: 0, total: 0 };
      }
      acc[category].total += 1;
      if (answerData?.isCorrect) acc[category].correct += 1;
      return acc;
    }, {});

    const subjectStats = questions.reduce((acc, question) => {
      const answerData = answers.find(a => a && a.question === question._id);
      const subject = question.subject || 'Unknown';
      if (!acc[subject]) {
        acc[subject] = { correct: 0, total: 0 };
      }
      acc[subject].total += 1;
      if (answerData?.isCorrect) acc[subject].correct += 1;
      return acc;
    }, {});

    const questionStats = {
      correct: answers.filter(a => a && a.isCorrect).length,
      incorrect: answers.filter(a => a && !a.isCorrect && a.selectedAnswer !== -1).length,
      flagged: answers.filter(a => a && a.selectedAnswer === -1).length,
      skipped: userAnswers.filter(a => a.selectedAnswer === null).length,
      avgTimePerQuestion: answers.length > 0
        ? Math.round(answers.reduce((sum, a) => sum + (a.timeTaken ?? 0), 0) / answers.length)
        : 0,
    };

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 p-4 text-white">
              <h1 className="text-xl font-bold">Test Completed</h1>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Your Results</h2>
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded shadow text-center">
                    <h3 className="text-lg font-medium text-gray-500">Score</h3>
                    <p className="text-3xl font-bold text-blue-600">{score}</p>
                  </div>
                  <div className="p-4 bg-white rounded shadow text-center">
                    <h3 className="text-lg font-medium text-gray-500">Total Questions</h3>
                    <p className="text-3xl font-bold text-blue-600">{totalQuestions}</p>
                  </div>
                  <div className="p-4 bg-white rounded shadow text-center">
                    <h3 className="text-lg font-medium text-gray-500">Percentage</h3>
                    <p className="text-3xl font-bold text-blue-600">{scorePercentage}%</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4">Performance Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">By Category</h4>
                      {Object.entries(categoryStats).map(([category, stats]) => (
                        <div key={category} className="flex justify-between text-sm mb-1">
                          <span>{category}:</span>
                          <span>{stats.correct}/{stats.total} ({Math.round((stats.correct / stats.total) * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">By Subject</h4>
                      {Object.entries(subjectStats).map(([subject, stats]) => (
                        <div key={subject} className="flex justify-between text-sm mb-1">
                          <span>{subject}:</span>
                          <span>{stats.correct}/{stats.total} ({Math.round((stats.correct / stats.total) * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Question Statistics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-gray-600 block">Correct:</span>
                        <span className="font-medium">{questionStats.correct}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block">Incorrect:</span>
                        <span className="font-medium">{questionStats.incorrect}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block">Flagged:</span>
                        <span className="font-medium">{questionStats.flagged}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block">Skipped:</span>
                        <span className="font-medium">{questionStats.skipped}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-4">Question Review</h3>
                <ul className="space-y-6">
                  {questions.map((question, index) => {
                    const answerData = answers.find(a => a && a.question === question._id) || {};
                    const selectedAnswer = Number(answerData.selectedAnswer) >= 0 ? Number(answerData.selectedAnswer) : -1;
                    const correctAnswer = Number(answerData.correctAnswer) >= 0 ? Number(answerData.correctAnswer) : -1;
                    const isCorrect = answerData.isCorrect;
                    const timeTaken = answerData.timeTaken ?? 0;
                    const isFlagged = flaggedQuestions.includes(question._id);
                    const explanation = question.explanation || 'No explanation available.';

                    return (
                      <li key={question._id} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">
                            Q{index + 1}: {typeof question.questionText === 'object' ? question.questionText.text : question.questionText}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {isFlagged && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">Flagged</span>
                            )}
                          </div>
                        </div>
                        <ul className="space-y-2 mb-2">
                          {(question.options || []).map((opt, idx) => {
                            const isUserSelected = idx === selectedAnswer;
                            const isRight = idx === correctAnswer;
                            let bg = 'bg-white';
                            let icon = null;
                            if (isUserSelected) {
                              bg = isCorrect ? 'bg-green-200 border border-green-400' : 'bg-red-200 border border-red-400';
                              icon = isCorrect ? (
                                <span className="ml-2 text-green-600 font-bold">✓</span>
                              ) : (
                                <span className="ml-2 text-red-600 font-bold">✗</span>
                              );
                            } else if (isRight) {
                              bg = 'bg-green-100 border border-green-300';
                              icon = <span className="ml-2 text-green-600 italic">(Correct answer)</span>;
                            }

                            return (
                              <li key={idx} className={`p-2 rounded ${bg} flex justify-between items-center`}>
                                <div>
                                  <strong>{String.fromCharCode(65 + idx)}.</strong> {typeof opt === 'object' ? opt.text : opt}
                                  {icon}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                        <div className="text-sm text-gray-600 mb-2">
                          <span>Time Taken: {timeTaken}s</span>
                          <span className="mx-2">•</span>
                          <span>Category: {question.category || 'N/A'}</span>
                          <span className="mx-2">•</span>
                          <span>Subject: {question.subject || 'N/A'}</span>
                        </div>
                        <p className={`text-sm font-medium px-2 py-1 rounded inline-block ${
                          isCorrect ? 'bg-green-100 text-green-700' : selectedAnswer === -1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          Your answer was {isCorrect ? 'correct ✅' : selectedAnswer === -1 ? 'flagged 🚩' : 'incorrect ❌'}
                        </p>
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            <strong>Explanation:</strong> {explanation}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="flex justify-between">
                <button
                  onClick={handleBackToDashboard}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => navigate(`/dashboard/test-detail/${testSessionId}`)}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  View Detailed Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main test interface
  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} z-20`}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-bold">Question Navigator</h2>
          <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, index) => {
              const isAnswered = userAnswers.find(a => a.questionId === q._id)?.selectedAnswer !== null;
              const isSubmitted = submittedQuestions.includes(q._id);
              const isFlagged = flaggedQuestions.includes(q._id);
              const isCurrent = index === currentQuestionIndex;
              let bgColor = 'bg-gray-200';
              if (isCurrent) bgColor = 'bg-blue-500 text-white';
              else if (isSubmitted) bgColor = 'bg-green-500 text-white';
              else if (isAnswered) bgColor = 'bg-blue-200';
              else if (isFlagged) bgColor = 'bg-yellow-200';

              return (
                <button
                  key={q._id}
                  onClick={() => {
                    setCurrentQuestionIndex(index);
                    toggleSidebar();
                  }}
                  className={`w-full h-10 flex items-center justify-center rounded ${bgColor} relative`}
                >
                  {index + 1}
                  {isFlagged && (
                    <span className="absolute top-0 right-0 h-3 w-3 bg-yellow-400 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-6">
            <div className="flex items-center mb-2">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span>Current Question</span>
            </div>
            <div className="flex items-center mb-2">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span>Submitted</span>
            </div>
            <div className="flex items-center mb-2">
              <div className="w-4 h-4 bg-blue-200 rounded mr-2"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center mb-2">
              <div className="w-4 h-4 bg-yellow-200 rounded mr-2"></div>
              <span>Flagged</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
              <span>Not Answered</span>
            </div>
          </div>
        </div>
      </div>

      {showUnansweredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">You have unanswered questions</h2>
            <p className="mb-6">Some questions are not yet answered. What would you like to do?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowUnansweredModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Go Back to Test
              </button>
              <button
                onClick={handleDirectSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit As Is
              </button>
              <button
                onClick={handleSubmitWithDefaults}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Submit All Unanswered
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 max-w-4xl py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="mr-4 hover:bg-blue-700 p-1 rounded-full"
                aria-label="Open question navigator"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-xl font-bold">Test Session</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => toggleFlagQuestion(currentQuestion?._id)}
                className={`hover:bg-blue-700 p-1 rounded-full ${isQuestionFlagged ? 'text-yellow-300' : 'text-white'}`}
                aria-label="Flag question"
              >
                <Flag size={20} />
              </button>
              {usePerQuestionTimer && (
                <div className="flex items-center">
                  <button
                    onClick={toggleTimerPause}
                    className="hover:bg-blue-700 p-1 rounded-full mr-2"
                    aria-label={timerPaused ? 'Resume timer' : 'Pause timer'}
                  >
                    {timerPaused ? <PlayCircle size={20} /> : <PauseCircle size={20} />}
                  </button>
                  <div className="flex items-center space-x-1">
                    <Clock size={16} />
                    <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-3 border-b">
            <div className="flex justify-between mb-2">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{answeredCount} of {questions.length} answered</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-8">
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {typeof currentQuestion?.questionText === 'object' ? currentQuestion?.questionText.text : currentQuestion?.questionText}
                </h2>
                {isQuestionSubmitted && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">Submitted</span>
                )}
              </div>

              <div className="space-y-4">
                {(currentQuestion?.options || []).map((option, index) => {
                  const isSelected = userAnswers.find(a => a.questionId === currentQuestion._id)?.selectedAnswer === index;
                  return (
                    <div
                      key={index}
                      onClick={() => !isQuestionSubmitted && handleAnswerSelect(index)}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                      } ${isQuestionSubmitted ? 'cursor-not-allowed' : ''}`}
                    >
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span>{typeof option === 'object' ? option.text : option}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <div className="flex space-x-4">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`px-4 py-2 rounded flex items-center ${
                    currentQuestionIndex === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft size={16} className="mr-1" /> Previous
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className={`px-4 py-2 rounded flex items-center ${
                    currentQuestionIndex === questions.length - 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Next <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleSubmitQuestion()}
                  disabled={isQuestionSubmitted || submitting}
                  className={`px-6 py-2 rounded flex items-center ${
                    isQuestionSubmitted || submitting ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Check size={16} className="mr-2" />
                  {submitting ? 'Submitting...' : isQuestionSubmitted ? 'Submitted' : 'Submit Question'}
                </button>
              </div>
            </div>

            <div className="mt-12 pt-6 border-t flex justify-between">
              <button
                onClick={handleBackToDashboard}
                className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
              >
                Cancel Test
              </button>
              <button
                onClick={handleEndTest}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                End Test
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRunnerPage;