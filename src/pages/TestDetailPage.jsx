import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TestDetailPage = () => {
  const { testId } = useParams();
  const [testDetail, setTestDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchTestDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        const response = await fetch(`https://synapaxon-backend.onrender.com/api/tests/${testId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch test details');
        }
        
        const responseData = await response.json();
        
        if (responseData.success) {
          setTestDetail(responseData.data);
        } else {
          throw new Error(responseData.message || 'Failed to fetch test details');
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
  }, [testId]);
  
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
                <span className="text-gray-600 block">Tags:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {testDetail.filters && testDetail.filters.tags ? 
                    testDetail.filters.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tag}
                      </span>
                    )) : 
                    <span className="text-gray-500">None</span>
                  }
                </div>
              </div>
              <div>
                <span className="text-gray-600 block">Difficulty:</span>
                <span className="font-medium capitalize">
                  {testDetail.filters && testDetail.filters.difficulty ? testDetail.filters.difficulty : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 block">Question Count:</span>
                <span className="font-medium">
                  {testDetail.filters && testDetail.filters.count ? testDetail.filters.count : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Questions and Answers Section */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Questions & Answers</h2>
            
            {testDetail.questions && testDetail.questions.map((question, qIndex) => {
              // Find the corresponding answer for this question
              const answer = testDetail.answers ? 
                testDetail.answers.find(a => a.question === question._id) : null;
              
              return (
                <div key={question._id} className="mb-8 bg-gray-50 p-4 rounded-lg">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium">
                      Q{qIndex + 1}: {question.questionText}
                    </h3>
                    
                    {question.media && question.media.type === 'url' && (
                      <div className="mt-2">
                        <a 
                          href={question.media.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          View Media
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {question.options.map((option, oIndex) => (
                      <div 
                        key={oIndex} 
                        className={`p-3 rounded-lg ${
                          answer && answer.selectedAnswer === oIndex && answer.isCorrect ? 'bg-green-100 border border-green-300' :
                          answer && answer.selectedAnswer === oIndex && !answer.isCorrect ? 'bg-red-100 border border-red-300' :
                          oIndex === question.correctAnswer ? 'bg-green-50 border border-green-200' : 
                          'bg-white border border-gray-200'
                        }`}
                      >
                        <div className="flex">
                          <div className="flex-shrink-0">
                            {answer && answer.selectedAnswer === oIndex ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${answer.isCorrect ? 'text-green-500' : 'text-red-500'}`} viewBox="0 0 20 20" fill="currentColor">
                                {answer.isCorrect ? (
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                ) : (
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                )}
                              </svg>
                            ) : oIndex === question.correctAnswer ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <div className="h-5 w-5"></div>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {String.fromCharCode(65 + oIndex)}. {option}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Explanation:</h4>
                    <p className="text-sm text-gray-700">{question.explanation}</p>
                  </div>
                  
                  {question.sourceUrl && (
                    <div className="mt-3">
                      <a 
                        href={question.sourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Source
                      </a>
                    </div>
                  )}
                  
                  <div className="mt-3 text-xs text-gray-500">
                    <span>Category: {question.category}</span>
                    <span className="mx-2">•</span>
                    <span>Subject: {question.subject}</span>
                    <span className="mx-2">•</span>
                    <span>Topic: {question.topic}</span>
                  </div>
                </div>
              );
            })}
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