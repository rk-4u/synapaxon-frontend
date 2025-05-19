import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TestRunner = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  
  // Get test session data from location state
  const { testSessionId, questions } = location.state || {};
  
  useEffect(() => {
    // If no test data is found, redirect to questions page
    if (!testSessionId || !questions || !questions.length) {
      navigate('/questions');
      return;
    }
    
    // Set initial timer (e.g., 60 seconds per question)
    setTimeLeft(questions.length * 60);
    
    // Initialize empty answers object
    const initialAnswers = {};
    questions.forEach(q => {
      initialAnswers[q._id] = null;
    });
    setSelectedAnswers(initialAnswers);
  }, [testSessionId, questions, navigate]);
  
  // Timer effect
  useEffect(() => {
    if (!timeLeft || testResults) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleSubmitTest(); // Auto-submit when time runs out
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, testResults]);
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle answer selection
  const selectAnswer = (questionId, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };
  
  // Navigate to next question
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };
  
  // Navigate to previous question
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };
  
  // Submit test answers
  const handleSubmitTest = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Format answers for API
      const formattedAnswers = Object.entries(selectedAnswers).map(([questionId, answer]) => ({
        questionId,
        selectedAnswer: answer !== null ? answer : -1 // Send -1 for unanswered questions
      }));
      
      const response = await fetch('http://localhost:5000/api/tests/submit', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN_HERE',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testSessionId,
          answers: formattedAnswers
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit test');
      }
      
      const data = await response.json();
      setTestResults(data);
    } catch (err) {
      console.error('Error submitting test:', err);
      alert('Failed to submit test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If data is loading or missing
  if (!questions || !testSessionId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Get current question
  const currentQuestion = questions[currentQuestionIndex];
  
  // If test is completed, show results
  if (testResults) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 bg-blue-600 text-white">
            <h1 className="text-2xl font-bold">Test Results</h1>
          </div>
          
          <div className="p-6">
            {/* Score summary */}
            <div className="bg-gray-50 p-6 rounded-lg mb-6 text-center">
              <h2 className="text-xl font-bold mb-4">Your Score</h2>
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {testResults.score}/{testResults.totalQuestions}
              </div>
              <div className="text-2xl font-semibold">
                {testResults.scorePercentage}%
              </div>
            </div>
            
            {/* Question review */}
            <h2 className="text-xl font-bold mb-4">Question Review</h2>
            <div className="space-y-8">
              {testResults.answers.map((answer, index) => {
                const question = questions.find(q => q._id === answer.question);
                if (!question) return null;
                
                return (
                  <div 
                    key={answer.question}
                    className={`border rounded-lg p-5 ${
                      answer.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium">Question {index + 1}</h3>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        answer.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {answer.isCorrect ? 'Correct' : 'Incorrect'}
                      </div>
                    </div>
                    
                    <p className="mb-4">{question.text}</p>
                    
                    <div className="space-y-2 mb-4">
                      {question.options.map((option, optIndex) => (
                        <div 
                          key={optIndex}
                          className={`flex items-start p-3 rounded-md ${
                            optIndex === answer.correctAnswer 
                              ? 'bg-green-100 border border-green-300'
                              : optIndex === answer.selectedAnswer && !answer.isCorrect
                                ? 'bg-red-100 border border-red-300'
                                : 'bg-white border border-gray-200'
                          }`}
                        >
                          <div className="w-6 h-6 flex items-center justify-center rounded-full mr-3 flex-shrink-0
                            ${optIndex === answer.correctAnswer 
                              ? 'bg-green-500 text-white'
                              : optIndex === answer.selectedAnswer && !answer.isCorrect
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200'
                            }">
                            {String.fromCharCode(65 + optIndex)}
                          </div>
                          <div>{option}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                      <h4 className="font-medium text-blue-800 mb-1">Explanation:</h4>
                      <p className="text-blue-700">{answer.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Navigation buttons */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => navigate('/questions')}
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
  
  // Show test in progress
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Test header */}
        <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
          <h1 className="text-xl font-bold">Test in Progress</h1>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="bg-gray-50 px-6 py-3 border-b">
          <div className="flex justify-between items-center mb-2">
            <div>Question {currentQuestionIndex + 1} of {questions.length}</div>
            <div className="text-sm text-gray-500">
              {Object.values(selectedAnswers).filter(a => a !== null).length} of {questions.length} answered
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Question content */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-medium mb-4">{currentQuestion.text}</h2>
            
            {/* Answer options */}
            <div className="space-y-3 mt-6">
              {currentQuestion.options.map((option, index) => (
                <div 
                  key={index}
                  onClick={() => selectAnswer(currentQuestion._id, index)}
                  className={`flex items-start p-4 border rounded-md cursor-pointer transition-colors ${
                    selectedAnswers[currentQuestion._id] === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 flex-shrink-0 ${
                    selectedAnswers[currentQuestion._id] === index
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
              onClick={goToPrevQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 font-medium disabled:opacity-50"
            >
              Previous
            </button>
            
            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmitTest}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Test'}
              </button>
            ) : (
              <button
                onClick={goToNextQuestion}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRunner;