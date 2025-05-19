import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function TestSession() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Test session state
  const [questions, setQuestions] = useState([]);
  const [testSessionId, setTestSessionId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timer, setTimer] = useState(90); // 90 seconds per question
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Results state
  const [testResults, setTestResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Fetch questions from sessionStorage and start the test
  useEffect(() => {
    const initializeTest = async () => {
      try {
        setLoading(true);
        
        // Get questions from sessionStorage
        const storedQuestions = JSON.parse(sessionStorage.getItem('questions') || '[]');
        
        if (!storedQuestions.length) {
          throw new Error('No questions found. Please go back and select filters.');
        }
        
        setQuestions(storedQuestions);
        
        // Initialize empty answers array
        const initialAnswers = storedQuestions.map(q => ({
          questionId: q._id,
          selectedAnswer: null
        }));
        
        setAnswers(initialAnswers);
        
        // Start the test via API
        await startTest(storedQuestions);
        
        setLoading(false);
      } catch (err) {
        console.error('Error initializing test:', err);
        setError(err.message || 'Failed to start test. Please try again.');
        setLoading(false);
      }
    };
    
    initializeTest();
  }, []);

  // Start the test via API
  const startTest = async (questions) => {
    try {
      // Get test configuration from the first question
      // Assuming all questions have the same category, subject, etc.
      if (!questions.length) return;
      
      const firstQuestion = questions[0];
      
      const payload = {
        category: firstQuestion.category || 'Basic Sciences',
        subject: firstQuestion.subject || 'Neuroscience',
        topic: firstQuestion.topic || 'Autonomic Nervous System',
        tags: firstQuestion.tags || ["neurotransmitter", "ANS"],
        difficulty: firstQuestion.difficulty || 'medium',
        count: questions.length
      };
      
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:5000/api/tests/start',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setTestSessionId(response.data.testSessionId);
      } else {
        throw new Error(response.data.message || 'Failed to start test');
      }
    } catch (err) {
      console.error('Error starting test:', err);
      throw new Error('Failed to communicate with server. Please try again.');
    }
  };

  // Handle timer for current question
  useEffect(() => {
    if (loading || showResults) return;
    
    // Reset timer when changing questions
    setTimer(90);
    
    const timerInterval = setInterval(() => {
      setTimer(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timerInterval);
          // Auto-move to the next question when time runs out
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
          } else {
            // If this is the last question, submit the test
            handleSubmitTest();
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [currentQuestionIndex, loading, questions.length, showResults]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer selection
  const handleSelectAnswer = (answerIndex) => {
    setAnswers(prev => {
      const updated = [...prev];
      updated[currentQuestionIndex] = {
        ...updated[currentQuestionIndex],
        selectedAnswer: answerIndex
      };
      return updated;
    });
  };

  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Navigate to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Submit test answers
  const handleSubmitTest = useCallback(async () => {
    if (isSubmitting || !testSessionId) return;
    
    try {
      setIsSubmitting(true);
      
      // Format answers for submission - filter out null answers
      const formattedAnswers = answers
        .filter(a => a.selectedAnswer !== null)
        .map(({ questionId, selectedAnswer }) => ({
          questionId,
          selectedAnswer
        }));
      
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
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
      
      if (response.data.success) {
        // Fetch test results
        await fetchTestResults();
      } else {
        throw new Error(response.data.message || 'Failed to submit test');
      }
    } catch (err) {
      console.error('Error submitting test:', err);
      setError('Failed to submit test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, testSessionId]);

  // Fetch test results
  const fetchTestResults = async () => {
    try {
      if (!testSessionId) return;
      
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `http://localhost:5000/api/tests/${testSessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setTestResults(response.data);
      setShowResults(true);
    } catch (err) {
      console.error('Error fetching test results:', err);
      setError('Failed to fetch test results. Please try again.');
    }
  };

  // Go back to question filter page
  const handleBackToQuestions = () => {
    navigate('/question-filter');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-lg font-medium text-gray-700">Loading test session...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 max-w-md w-full">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="font-bold">Error</p>
          </div>
          <p>{error}</p>
        </div>
        <button
          onClick={handleBackToQuestions}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Questions
        </button>
      </div>
    );
  }

  // Show test results
  if (showResults && testResults) {
    const scorePercentage = Math.round((testResults.score / testResults.totalQuestions) * 100);
    
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 bg-blue-600 text-white">
            <h1 className="text-2xl font-bold">Test Results</h1>
          </div>
          
          {/* Score summary */}
          <div className="p-6">
            <div className="bg-gray-50 p-6 rounded-lg mb-6 text-center">
              <h2 className="text-xl font-bold mb-4">Your Score</h2>
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {testResults.score}/{testResults.totalQuestions}
              </div>
              <div className="text-2xl font-semibold">
                {scorePercentage}%
              </div>
            </div>
            
            {/* Question review */}
            <h2 className="text-xl font-bold mb-4">Question Review</h2>
            <div className="space-y-8">
              {testResults.questionReviews?.map((review, index) => {
                const question = questions.find(q => q._id === review.questionId);
                if (!question) return null;
                
                return (
                  <div 
                    key={review.questionId}
                    className={`border rounded-lg p-5 ${
                      review.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium">Question {index + 1}</h3>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        review.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {review.isCorrect ? 'Correct' : 'Incorrect'}
                      </div>
                    </div>
                    
                    <p className="mb-4">{question.questionText}</p>
                    
                    <div className="space-y-2 mb-4">
                      {question.options.map((option, optIndex) => (
                        <div 
                          key={optIndex}
                          className={`flex items-start p-3 rounded-md ${
                            optIndex === review.correctAnswer 
                              ? 'bg-green-100 border border-green-300'
                              : optIndex === review.selectedAnswer && !review.isCorrect
                                ? 'bg-red-100 border border-red-300'
                                : 'bg-white border border-gray-200'
                          }`}
                        >
                          <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 flex-shrink-0 ${
                            optIndex === review.correctAnswer 
                              ? 'bg-green-500 text-white'
                              : optIndex === review.selectedAnswer && !review.isCorrect
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200'
                            }`}>
                            {String.fromCharCode(65 + optIndex)}
                          </div>
                          <div>{option}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                      <h4 className="font-medium text-blue-800 mb-1">Explanation:</h4>
                      <p className="text-blue-700">{review.explanation || "No explanation available."}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Navigation buttons */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={handleBackToQuestions}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 font-medium"
              >
                Back to Questions
              </button>
              
              <button
                onClick={() => navigate('/test-history')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
              >
                View Test History
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Current question
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return null;

  // Calculate progress
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = answers.filter(a => a.selectedAnswer !== null).length;

  // Show test in progress
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Test header */}
        <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
          <h1 className="text-xl font-bold">Test in Progress</h1>
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-1" />
            <span className="font-mono">{formatTime(timer)}</span>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="bg-gray-50 px-6 py-3 border-b">
          <div className="flex justify-between items-center mb-2">
            <div>Question {currentQuestionIndex + 1} of {questions.length}</div>
            <div className="text-sm text-gray-500">
              {answeredCount} of {questions.length} answered
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        {/* Question content */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-medium mb-4">{currentQuestion.questionText}</h2>
            
            {/* Answer options */}
            <div className="space-y-3 mt-6">
              {currentQuestion.options?.map((option, index) => (
                <div 
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  className={`flex items-start p-4 border rounded-md cursor-pointer transition-colors ${
                    answers[currentQuestionIndex]?.selectedAnswer === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 flex-shrink-0 ${
                    answers[currentQuestionIndex]?.selectedAnswer === index
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div>{option}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              className={`px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 font-medium disabled:opacity-50 flex items-center`}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Previous
            </button>
            
            <div className="flex space-x-3">
              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmitTest}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" /> Submit Test
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium flex items-center"
                >
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Question navigation */}
        <div className="bg-gray-50 px-6 py-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Jump to Question</h3>
          <div className="flex flex-wrap gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                  ${currentQuestionIndex === index ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                  ${answers[index]?.selectedAnswer !== null
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          <div className="mt-4 text-right">
            <button
              onClick={handleSubmitTest}
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium disabled:opacity-50 text-sm"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test Early'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}