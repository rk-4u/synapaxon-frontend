import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider } from '../contexts/AuthContext';

const TestTakingPage = () => {
  const { testSessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthProvider);

  // Test session state
  const [testSession, setTestSession] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Test results
  const [testResults, setTestResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch test session data
  useEffect(() => {
    const fetchTestSession = async () => {
      if (!testSessionId) return;
      
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/tests/${testSessionId}`);
        setTestSession(data);
        
        // Initialize answers object
        const initialAnswers = {};
        data.questions.forEach(q => {
          initialAnswers[q.id] = null;
        });
        setAnswers(initialAnswers);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching test session:', err);
        if (err.response && err.response.status === 401) {
          navigate('/login');
        } else {
          setError('Failed to load test. Please try again.');
          setLoading(false);
        }
      }
    };
    
    fetchTestSession();
  }, [testSessionId, navigate]);

  // Handle answer selection
  const handleAnswerSelect = (questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  // Move to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < testSession.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      window.scrollTo(0, 0);
    }
  };

  // Move to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      window.scrollTo(0, 0);
    }
  };

  // Calculate if all questions have been answered
  const allQuestionsAnswered = testSession?.questions?.every(q => answers[q.id] !== null) || false;

  // Submit test
  const handleSubmitTest = async () => {
    try {
      setSubmitting(true);
      
      // Format answers for API
      const formattedAnswers = Object.keys(answers).map(questionId => ({
        questionId,
        selectedAnswer: answers[questionId]
      }));
      
      const { data } = await axios.post('/api/tests/submit', {
        testSessionId,
        answers: formattedAnswers
      });
      
      setTestResults(data);
      setSubmitting(false);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Error submitting test:', err);
      if (err.response && err.response.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to submit test. Please try again.');
        setSubmitting(false);
      }
    }
  };

  // Handle when user wants to go back to questions
  const handleBackToPrep = () => {
    navigate('/prep/questions');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <button
          onClick={handleBackToPrep}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Back to Question Bank
        </button>
      </div>
    );
  }

  if (!testSession) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Test session not found</h2>
          <button
            onClick={handleBackToPrep}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Back to Question Bank
          </button>
        </div>
      </div>
    );
  }

  // If test results are available, show the results page
  if (testResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Test Results</h1>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Score Summary</h2>
              <span className={`text-2xl font-bold ${
                testResults.percentageScore >= 70 ? 'text-green-600' : 'text-red-600'
              }`}>
                {testResults.scoreText} ({testResults.percentageScore}%)
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-500">Total Questions</p>
                <p className="text-2xl font-bold">{testResults.totalQuestions}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-600">Correct</p>
                <p className="text-2xl font-bold">{testResults.correctAnswers}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-600">Incorrect</p>
                <p className="text-2xl font-bold">{testResults.incorrectAnswers}</p>
              </div>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-4">Detailed Review</h2>
          <div className="space-y-6">
            {testResults.questionReviews.map((review, index) => (
              <div key={review.questionId} className={`border rounded-lg p-4 ${
                review.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex justify-between mb-2">
                  <h3 className="font-medium">Question {index + 1}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    review.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {review.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                
                <p className="mb-3">{review.questionText}</p>
                
                {/* Display media if available */}
                {review.media && (
                  <div className="my-2">
                    <img 
                      src={review.media} 
                      alt="Question media" 
                      className="max-h-40 object-contain"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  {review.options.map((option, idx) => (
                    <div key={idx} className={`pl-4 rounded py-1 ${
                      idx === review.correctAnswer ? 'bg-green-100' :
                      idx === review.selectedAnswer && idx !== review.correctAnswer ? 'bg-red-100' :
                      'bg-gray-50'
                    }`}>
                      {String.fromCharCode(65 + idx)}. {option}
                      {idx === review.correctAnswer && (
                        <span className="ml-2 text-green-600">✓ Correct Answer</span>
                      )}
                      {idx === review.selectedAnswer && idx !== review.correctAnswer && (
                        <span className="ml-2 text-red-600">✗ Your Answer</span>
                      )}
                    </div>
                  ))}
                </div>
                
                {review.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 rounded">
                    <p className="font-medium text-blue-800">Explanation:</p>
                    <p className="text-blue-800">{review.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleBackToPrep}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Back to Question Bank
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If we're here, show the test taking interface
  const currentQuestion = testSession.questions[currentQuestionIndex];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Test Session</h1>
          <span className="text-gray-500">
            Question {currentQuestionIndex + 1} of {testSession.questions.length}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div 
            className="bg-blue-500 h-2.5 rounded-full" 
            style={{ width: `${(currentQuestionIndex + 1) / testSession.questions.length * 100}%` }}
          ></div>
        </div>
        
        {/* Question display */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{currentQuestion.questionText}</h2>
          
          {/* Display media if available */}
          {currentQuestion.media && (
            <div className="my-4">
              <img 
                src={currentQuestion.media} 
                alt="Question media" 
                className="max-h-64 object-contain"
              />
            </div>
          )}
          
          {/* Answer options */}
          <div className="space-y-3 mt-6">
            {currentQuestion.options.map((option, idx) => (
              <div 
                key={idx}
                onClick={() => handleAnswerSelect(currentQuestion.id, idx)}
                className={`p-3 border rounded-lg cursor-pointer ${
                  answers[currentQuestion.id] === idx 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 ${
                    answers[currentQuestion.id] === idx
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span>{option}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            className={`px-4 py-2 rounded-md ${
              currentQuestionIndex === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === testSession.questions.length - 1}
              className={`px-4 py-2 rounded-md ${
                currentQuestionIndex === testSession.questions.length - 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Next
            </button>
            
            <button
              onClick={handleSubmitTest}
              disabled={submitting || !allQuestionsAnswered}
              className={`px-4 py-2 rounded-md ${
                submitting || !allQuestionsAnswered
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        </div>
        
        {/* Answer status */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Question Status</h3>
          <div className="flex flex-wrap gap-2">
            {testSession.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentQuestionIndex === idx
                    ? 'ring-2 ring-blue-500 ring-offset-2 '
                    : ''
                } ${
                  answers[q.id] !== null
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          
          {!allQuestionsAnswered && (
            <p className="text-yellow-600 mt-2 text-sm">
              Please answer all questions before submitting your test.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestTakingPage;