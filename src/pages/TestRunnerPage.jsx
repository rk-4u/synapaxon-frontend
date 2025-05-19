
// TestRunnerPage.jsx - UPDATED
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const TestRunnerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get test data from location state instead of sessionStorage
  const testData = location.state || {};
  
  // State variables
  const [questions, setQuestions] = useState([]);
  const [testSessionId, setTestSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResults, setTestResults] = useState(null);
  
  // Get auth token from localStorage
  const token = localStorage.getItem('authToken');
  
  // Initialize test from location state
  useEffect(() => {
    const initializeTest = async () => {
      setLoading(true);
      try {
        const { testSessionId, questions, testDuration } = testData;
        
        if (!testSessionId || !questions || questions.length === 0) {
          throw new Error('Missing test data. Please start a new test.');
        }

        // Set initial state with data from location state
        setTestSessionId(testSessionId);
        setQuestions(questions);
        setTimeLeft(parseInt(testDuration || '60'));
        
        // Initialize user answers array with questionIds
        const initialAnswers = questions.map(q => ({
          questionId: q._id,
          selectedAnswer: null
        }));
        setUserAnswers(initialAnswers);
        
        setLoading(false);
      } catch (err) {
        console.error('Error initializing test:', err);
        setError('Failed to load test session. Please try again.');
        setLoading(false);
      }
    };

    initializeTest();
  }, [testData]);
  
  // Timer effect
  useEffect(() => {
    if (!timeLeft || loading || error || testCompleted) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          // Auto-advance to next question when time runs out
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
            return parseInt(testData.testDuration || '60'); // Reset timer for next question
          } else {
            // If this is the last question, submit the test
            handleSubmitTest();
            return 0;
          }
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, loading, error, currentQuestionIndex, questions.length, testCompleted, testData.testDuration]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle answer selection
  const handleAnswerSelect = (answerIndex) => {
    setUserAnswers(prev => {
      const updated = [...prev];
      const questionIndex = updated.findIndex(a => a.questionId === questions[currentQuestionIndex]._id);
      
      if (questionIndex !== -1) {
        updated[questionIndex].selectedAnswer = answerIndex;
      } else {
        // If not found, add a new answer entry
        updated.push({
          questionId: questions[currentQuestionIndex]._id,
          selectedAnswer: answerIndex
        });
      }
      
      return updated;
    });
  };
  
  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setTimeLeft(parseInt(testData.testDuration || '60')); // Reset timer for next question
    } else {
      handleSubmitTest();
    }
  };
  
  // Submit test answers
  const handleSubmitTest = async () => {
    try {
      setLoading(true);
      
      // Format answers for API
      const formattedAnswers = userAnswers.map(answer => ({
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer !== null ? answer.selectedAnswer : 4 
      }));
      
      // Submit answers
      await axios.post(
        'http://localhost:5000/api/tests/submit',
        {
          testSessionId,
          answers: formattedAnswers
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
 const resultsResponse = await axios.get(
  `http://localhost:5000/api/tests/${testSessionId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

      // Set test as completed and show results
      setTestCompleted(true);
      setTestResults(resultsResponse.data.data || resultsResponse.data);
      
    } catch (err) {
      console.error('Error submitting test:', err);
      setError('Failed to submit test. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle redirection to dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };
  
  // Show loading state
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
  
  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 max-w-md mx-auto bg-white rounded-lg shadow">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Error</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button 
            onClick={handleBackToDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  // Get current question
  const currentQuestion = questions[currentQuestionIndex];
  
  // Calculate progress
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = userAnswers.filter(a => a.selectedAnswer !== null).length;

  // Show test completed with results
  if (testCompleted && testResults) {
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
                <p className="text-lg"><strong>Score:</strong> {testResults.score || 'N/A'}</p>
                <h3 className="text-xl font-bold mb-4">Question Review</h3>
<ul className="space-y-6">
  {testResults.questions.map((question, index) => {
    const answerData = testResults.answers.find(
      a => a.question === question._id
    );
    const selectedAnswer = answerData?.selectedAnswer;
    const isCorrect = answerData?.isCorrect;

    return (
      <li key={question._id} className="border rounded p-4 bg-white">
        <h4 className="font-semibold mb-2 text-gray-800">
          Q{index + 1}: {question.questionText}
        </h4>

        <ul className="space-y-2 mb-2">
          {question.options.map((opt, idx) => {
            const isRight = idx === question.correctAnswer;
            const isUserSelected = idx === selectedAnswer;

            let bg = 'bg-white';
            if (isUserSelected && isRight) bg = 'bg-green-100';
            else if (isUserSelected && !isRight) bg = 'bg-red-100';
            else if (!isUserSelected && isRight) bg = 'bg-green-50';

            return (
              <li key={idx} className={`p-2 rounded ${bg}`}>
                <strong>{String.fromCharCode(65 + idx)}.</strong> {opt}
              </li>
            );
          })}
        </ul>

        <p className={`text-sm font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
          Your answer was {isCorrect ? 'correct ✅' : 'incorrect ❌'}
        </p>
        {question.explanation && (
          <p className="text-sm text-gray-600 mt-2"><strong>Explanation:</strong> {question.explanation}</p>
        )}
      </li>
    );
  })}
</ul>

              </div>
              <button
                onClick={handleBackToDashboard}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Main test interface
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
            <h1 className="text-xl font-bold">Test Session</h1>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
          </div>
          
          {/* Progress */}
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
          
          {/* Question */}
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-6">{currentQuestion?.questionText || currentQuestion?.text}</h2>
              
              {/* Options */}
              <div className="space-y-4">
                {(currentQuestion?.options || []).map((option, index) => {
                  const isSelected = userAnswers.find(
                    a => a.questionId === currentQuestion._id
                  )?.selectedAnswer === index;
                  
                  return (
                    <div 
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                        isSelected 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {String.fromCharCode(65 + index)} {/* A, B, C, etc. */}
                      </div>
                      <span>{option}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handleBackToDashboard}
                className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
              >
                Cancel Test
              </button>
              
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={handleSubmitTest}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Submit Test
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRunnerPage;