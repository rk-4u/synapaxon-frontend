import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../api/axiosConfig';
import { Menu, Clock, Flag, Check, ChevronLeft, ChevronRight, X, PlayCircle, PauseCircle } from 'lucide-react';
import MediaDisplay from './MediaDisplay';
import Calculator from './Calculator';

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [children]);

  if (hasError) {
    return <p className="text-red-500">Error loading media. Please try again.</p>;
  }

  return (
    <React.Fragment>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          onError: () => setHasError(true),
        })
      )}
    </React.Fragment>
  );
};

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
  const [timerPaused, setTimerPaused] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [submittedQuestions, setSubmittedQuestions] = useState([]);
  const [submissionResults, setSubmissionResults] = useState({});
  const [showUnansweredModal, setShowUnansweredModal] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [struckOptions, setStruckOptions] = useState({});
  const [highlights, setHighlights] = useState({});
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [highlightPosition, setHighlightPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [activeFeature, setActiveFeature] = useState('none'); // Track active feature: none, calculator, lab, chatgpt
  const highlightMenuRef = useRef(null);

  // Retrieve test data
  const testData = location.state || JSON.parse(sessionStorage.getItem('testData')) || {};
  const usePerQuestionTimer = testData.testDuration && parseInt(testData.testDuration) === 90;

  // Load struck options and highlights from sessionStorage
  useEffect(() => {
    const savedStruck = JSON.parse(sessionStorage.getItem(`struckOptions_${testSessionId}`)) || {};
    setStruckOptions(savedStruck);
    const savedHighlights = JSON.parse(sessionStorage.getItem(`highlights_${testSessionId}`)) || {};
    setHighlights(savedHighlights);
  }, [testSessionId]);

  // Save struck options and highlights to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(`struckOptions_${testSessionId}`, JSON.stringify(struckOptions));
    sessionStorage.setItem(`highlights_${testSessionId}`, JSON.stringify(highlights));
  }, [struckOptions, highlights, testSessionId]);

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

  // Handle click outside highlight menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (highlightMenuRef.current && !highlightMenuRef.current.contains(e.target)) {
        setShowHighlightMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Transform subjects and topics to match StudentQuestion schema
  const subjects = currentQuestion.subjects?.map(s => s.name) || [];
  const topics = currentQuestion.subjects?.flatMap(s => s.topics || []) || [];

  const payload = {
    testSessionId,
    questionId,
    selectedAnswer,
    subjects: subjects.length > 0 ? subjects : ['Unknown'], // Default if missing
    topics: topics.length > 0 ? topics : [], // Empty array if no topics
    timeTaken,
  };

  setSubmitting(true);
  try {
    // Submit answer
    const submitResponse = await axios.post('/api/student-questions/submit', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (submitResponse.data.success) {
      setSubmittedQuestions(prev => {
        if (!prev.includes(questionId)) {
          return [...prev, questionId];
        }
        return prev;
      });

      // Fetch question details to get explanation, media, and correctAnswer
      const questionResponse = await axios.get(`/api/questions/${questionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (questionResponse.data.success) {
        const questionData = questionResponse.data.data;
        // Update questions with fetched data
        setQuestions(prev => {
          const updated = [...prev];
          updated[currentQuestionIndex] = {
            ...currentQuestion,
            explanation: questionData.explanation || 'No explanation available.',
            explanationMedia: questionData.explanationMedia || [],
            questionMedia: questionData.questionMedia || [],
            options: questionData.options || currentQuestion.options,
            correctAnswer: questionData.correctAnswer ?? currentQuestion.correctAnswer,
            subjects: questionData.subjects || currentQuestion.subjects, // Preserve subjects
          };
          return updated;
        });

        // Store submission result for feedback
        setSubmissionResults(prev => ({
          ...prev,
          [questionId]: {
            isCorrect: submitResponse.data.data.isCorrect,
            selectedAnswer,
            correctAnswer: questionData.correctAnswer ?? currentQuestion.correctAnswer,
            options: questionData.options || currentQuestion.options,
          },
        }));
      } else {
        throw new Error(questionResponse.data.message || 'Failed to fetch question details.');
      }
    } else {
      throw new Error(submitResponse.data.message || 'Submission failed.');
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

        const submitResponse = await axios.post('/api/student-questions/submit', payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (submitResponse.data.success) {
          setSubmittedQuestions(prev => [...prev, question._id]);

          // Fetch question details
          const questionResponse = await axios.get(`/api/questions/${question._id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (questionResponse.data.success) {
            const questionData = questionResponse.data.data;
            setQuestions(prev => {
              const index = prev.findIndex(q => q._id === question._id);
              if (index !== -1) {
                prev[index] = {
                  ...prev[index],
                  explanation: questionData.explanation || 'No explanation available.',
                  explanationMedia: questionData.explanationMedia || [],
                  questionMedia: questionData.questionMedia || [],
                  options: questionData.options || prev[index].options,
                  correctAnswer: questionData.correctAnswer ?? prev[index].correctAnswer,
                };
              }
              return [...prev];
            });

            setSubmissionResults(prev => ({
              ...prev,
              [question._id]: {
                isCorrect: submitResponse.data.data.isCorrect,
                selectedAnswer: -1,
                correctAnswer: questionData.correctAnswer ?? question.correctAnswer,
                options: questionData.options || question.options,
              },
            }));
          } else {
            throw new Error(questionResponse.data.message || 'Failed to fetch question details.');
          }
        } else {
          throw new Error(`Failed to submit question ${question._id}: ${submitResponse.data.message}`);
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

  // Final annunciatoize test
  const finalizeTest = async () => {
    try {
      setLoading(true);

      // Validate test session
      let testSession;
      try {
        const sessionResponse = await axios.get(`/api/tests/${testSessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        testSession = sessionResponse.data.data;
      } catch (err) {
        if (err.response?.status === 401) {
          alert('Session expired. Please log in again.');
          navigate('/login');
          return;
        }
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
        sessionStorage.removeItem('testData');
        navigate(`/dashboard/test-detail/${testSessionId}`);
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

      // Prepare results data
      const resultsData = {
        score: studentQuestions.filter(q => q.isCorrect).length,
        totalQuestions: questions.length,
        answers: studentQuestions.map(q => ({
          question: q.question._id || q.question,
          selectedAnswer: q.selectedAnswer,
          isCorrect: q.isCorrect,
          correctAnswer: q.correctAnswer,
          timeTaken: q.timeTaken || 0,
          explanation: q.explanation,
          explanationMedia: q.explanationMedia,
          options: q.options,
        })),
        questions,
        flaggedQuestions,
      };

      setTestCompleted(true);
      sessionStorage.removeItem('testData');
      navigate(`/dashboard/test-detail/${testSessionId}`, { state: resultsData });
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

  // Toggle strike-through on option
  const toggleStrikeThrough = (questionId, optionIndex) => {
    setStruckOptions(prev => {
      const key = `${questionId}_${optionIndex}`;
      const updated = { ...prev, [key]: !prev[key] };
      return updated;
    });
  };

  // Handle text selection and show highlight menu
  const handleTextSelection = (e) => {
    const selection = window.getSelection();
    if (selection.toString().trim() !== '') {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(selection.toString());
      setHighlightPosition({ x: rect.left, y: rect.bottom + window.scrollY });
      setShowHighlightMenu(true);
    } else {
      setShowHighlightMenu(false);
    }
  };

  // Apply highlight
  const applyHighlight = (color) => {
    const questionId = currentQuestion._id;
    const key = `${questionId}_${Date.now()}`;
    setHighlights(prev => ({
      ...prev,
      [key]: { text: selectedText, color, questionId },
    }));
    setShowHighlightMenu(false);
    window.getSelection().removeAllRanges();
  };

  // Remove highlight
  const removeHighlight = (highlightKey) => {
    setHighlights(prev => {
      const updated = { ...prev };
      delete updated[highlightKey];
      return updated;
    });
  };

  // Render explanation with bullet points
  const renderExplanation = (explanation, questionId) => {
    if (!explanation || explanation === 'No explanation available.') {
      return <p className="text-gray-700 text-base">{explanation}</p>;
    }

    // Split by periods, trim, and filter out empty segments
    const segments = explanation
      .split('.')
      .map(segment => segment.trim())
      .filter(segment => segment.length > 0);

    if (segments.length <= 1) {
      return <p className="text-gray-700 text-base">{renderHighlightedText(explanation, questionId)}</p>;
    }

    return (
      <ul className="list-disc pl-5 space-y-2">
        {segments.map((segment, index) => (
          <li key={index} className="text-gray-700 text-base">
            {renderHighlightedText(segment, questionId)}
          </li>
        ))}
      </ul>
    );
  };

  // Render highlighted text
  const renderHighlightedText = (text, questionId) => {
    let result = text || '';
    Object.entries(highlights).forEach(([key, { text: highlightText, color, questionId: highlightQuestionId }]) => {
      if (highlightQuestionId === questionId && result.includes(highlightText)) {
        result = result.replace(
          highlightText,
          `<span class="highlight" data-key="${key}" style="background-color: ${color}">${highlightText}</span>`
        );
      }
    });
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
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
  const submissionResult = submissionResults[currentQuestion?._id];

  // Main test interface
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-[7.5%] bg-white shadow-lg transform transition-transform ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } z-20 overflow-y-auto`}
      >
        <div className="flex justify-between items-center p-2 border-b">
          <h2 className="text-sm font-bold">Questions</h2>
          <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700">
            <X size={16} />
          </button>
        </div>
        <div className="p-2">
          {questions.map((q, index) => {
            const isAnswered = userAnswers.find(a => a.questionId === q._id)?.selectedAnswer !== null;
            const isSubmitted = submittedQuestions.includes(q._id);
            const isFlagged = flaggedQuestions.includes(q._id);
            const isCurrent = index === currentQuestionIndex;
            const result = submissionResults[q._id];
            let bgColor = 'bg-gray-200';
            let statusText = 'Not Answered';
            if (isCurrent) {
              bgColor = 'bg-blue-500 text-white';
              statusText = 'Current';
            } else if (isSubmitted && result) {
              if (result.isCorrect) {
                bgColor = 'bg-green-500 text-white';
                statusText = 'Correct';
              } else if (result.selectedAnswer === -1) {
                bgColor = 'bg-yellow-200';
                statusText = 'Flagged';
              } else {
                bgColor = 'bg-red-500 text-white';
                statusText = 'Incorrect';
              }
            } else if (isFlagged) {
              bgColor = 'bg-yellow-200';
              statusText = 'Flagged';
            } else if (isAnswered) {
              bgColor = 'bg-blue-200';
              statusText = 'Answered';
            }

            return (
              <div key={q._id} className="mb-2">
                <button
                  onClick={() => {
                    setCurrentQuestionIndex(index);
                    toggleSidebar();
                  }}
                  className={`w-full py-1 text-sm rounded ${bgColor} flex items-center justify-between px-2 relative`}
                  title={statusText}
                >
                  <span>{index + 1}</span>
                  {isFlagged && <Flag size={12} className="text-yellow-500" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unanswered Modal */}
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

      {/* Highlight Menu */}
      {showHighlightMenu && (
        <div
          ref={highlightMenuRef}
          className="fixed bg-white border rounded shadow-lg p-2 z-40"
          style={{ top: highlightPosition.y, left: highlightPosition.x }}
        >
          <div className="flex space-x-2">
            <button
              onClick={() => applyHighlight('yellow')}
              className="w-6 h-6 bg-yellow-200 rounded"
              title="Highlight Yellow"
            />
            <button
              onClick={() => applyHighlight('green')}
              className="w-6 h-6 bg-green-200 rounded"
              title="Highlight Green"
            />
            <button
              onClick={() => applyHighlight('pink')}
              className="w-6 h-6 bg-pink-200 rounded"
              title="Highlight Pink"
            />
            <button
              onClick={() => applyHighlight('blue')}
              className="w-6 h-6 bg-blue-200 rounded"
              title="Highlight Blue"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-grow flex">
        {/* Question Area (55% width) */}
        <div className="w-[55%] mx-auto py-8">
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
                  className={`hover:bg-blue-700 p-1 rounded-full ${isQuestionFlagged ? 'text-yellow-400' : 'text-white'}`}
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

            <div className="p-6" onMouseUp={handleTextSelection}>
              <div className="mb-8">
                <div className="flex justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {currentQuestion?.questionText
                      ? renderHighlightedText(
                          typeof currentQuestion.questionText === 'object'
                            ? currentQuestion.questionText.text
                            : currentQuestion.questionText,
                          currentQuestion._id
                        )
                      : 'No question text'}
                  </h2>
                </div>
                {/* Question Media */}
                {isQuestionSubmitted && currentQuestion?.questionMedia?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentQuestion.questionMedia.map((media, index) => (
                      <ErrorBoundary key={index}>
                        <MediaDisplay media={media} label={`Question Media ${index + 1}`} />
                      </ErrorBoundary>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  {(currentQuestion?.options || []).map((option, index) => {
                    const isSelected = userAnswers.find(a => a.questionId === currentQuestion._id)?.selectedAnswer === index;
                    const isStruck = struckOptions[`${currentQuestion._id}_${index}`];
                    return (
                      <div key={index} className="flex items-center p-4 border rounded-lg">
                        <button
                          onClick={() => !isQuestionSubmitted && handleAnswerSelect(index)}
                          className={`flex-shrink-0 w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                            isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                          } ${isQuestionSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          disabled={isQuestionSubmitted}
                          aria-label={`Select option ${String.fromCharCode(65 + index)}`}
                        >
                          {String.fromCharCode(65 + index)}
                        </button>
                        <div className="flex flex-col">
                          <span
                            style={{ textDecoration: isStruck ? 'line-through' : 'none' }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              toggleStrikeThrough(currentQuestion._id, index);
                            }}
                            onClick={(e) => {
                              if (e.button === 0) {
                                toggleStrikeThrough(currentQuestion._id, index);
                              }
                            }}
                          >
                            {option?.text
                              ? renderHighlightedText(
                                  typeof option === 'object' ? option.text : option,
                                  currentQuestion._id
                                )
                              : 'No option text'}
                          </span>
                          {/* Option Media */}
                          {isQuestionSubmitted && option?.media?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {option.media.map((media, mediaIndex) => (
                                <ErrorBoundary key={mediaIndex}>
                                  <MediaDisplay media={media} label={`Option ${String.fromCharCode(65 + index)} Media ${mediaIndex + 1}`} />
                                </ErrorBoundary>
                              ))}
                            </div>
                          )}
                        </div>
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
                      currentQuestionIndex === 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronLeft size={16} className="mr-1" /> Previous
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className={`px-4 py-2 rounded flex items-center ${
                      currentQuestionIndex === questions.length - 1
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
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
                      isQuestionSubmitted || submitting
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
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

        {/* Sidebar for Features (37.5% width) */}
        <div className="w-[37.5%] py-8 pl-4">
          {isQuestionSubmitted ? (
            <div className="bg-white rounded-lg shadow-lg p-6" onMouseUp={handleTextSelection}>
              <h3 className="text-lg font-semibold mb-4">Feedback and Explanation</h3>
              {submissionResult && (
                <p className={`mb-4 text-sm font-medium ${submissionResult.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  Your answer is {submissionResult.isCorrect ? 'correct' : 'incorrect'}.
                  {submissionResult.selectedAnswer !== -1 && (
                    <>
                      {' You selected: '}
                      {submissionResult.options[submissionResult.selectedAnswer]?.text || 'None'}
                      {'. Correct answer: '}
                      {submissionResult.options[submissionResult.correctAnswer]?.text || 'Unknown'}
                    </>
                  )}
                </p>
              )}
              <div className="mb-4">
                <h4 className="text-md font-medium mb-2">Explanation</h4>
                {renderExplanation(currentQuestion?.explanation, currentQuestion?._id)}
              </div>
              {/* Explanation Media */}
              {isQuestionSubmitted && currentQuestion?.explanationMedia?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentQuestion.explanationMedia.map((media, index) => (
                    <ErrorBoundary key={index}>
                      <MediaDisplay media={media} label={`Explanation Media ${index + 1}`} />
                    </ErrorBoundary>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Navigation Bar */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setActiveFeature(activeFeature === 'lab' ? 'none' : 'lab')}
                  className={`flex-1 px-3 py-2 rounded text-sm ${
                    activeFeature === 'lab' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Open Lab
                </button>
                <button
                  onClick={() => setActiveFeature(activeFeature === 'calculator' ? 'none' : 'calculator')}
                  className={`flex-1 px-3 py-2 rounded text-sm ${
                    activeFeature === 'calculator' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Calculator
                </button>
                <button
                  onClick={() => setActiveFeature(activeFeature === 'chatgpt' ? 'none' : 'chatgpt')}
                  className={`flex-1 px-3 py-2 rounded text-sm ${
                    activeFeature === 'chatgpt' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Chat GPT
                </button>
              </div>

              {/* Feature Content */}
              {activeFeature === 'calculator' ? (
                <Calculator onClose={() => setActiveFeature('none')} />
              ) : activeFeature === 'lab' ? (
                <div className="text-center p-4">
                  <p className="text-gray-700">Open Lab feature coming soon!</p>
                </div>
              ) : activeFeature === 'chatgpt' ? (
                <div className="text-center p-4">
                  <p className="text-gray-700">Chat GPT feature coming soon!</p>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  <button
                    onClick={() => setActiveFeature('lab')}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Open Lab
                  </button>
                  <button
                    onClick={() => setActiveFeature('calculator')}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Calculator
                  </button>
                  <button
                    onClick={() => setActiveFeature('chatgpt')}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Chat GPT
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestRunnerPage;