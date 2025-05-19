import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// This import is missing in the original file
import axios from '../api/axiosConfig';

const QuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    subject: '',
    topic: '',
    tags: '',
    difficulty: '',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Update filters when URL changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    const newFilters = {
      category: searchParams.get('category') || '',
      subject: searchParams.get('subject') || '',
      topic: searchParams.get('topic') || '',
      tags: searchParams.get('tags') || '',
      difficulty: searchParams.get('difficulty') || '',
      page: parseInt(searchParams.get('page')) || 1,
      limit: parseInt(searchParams.get('limit')) || 10,
    };

    setFilters(newFilters);
    setPagination(prev => ({
      ...prev,
      page: newFilters.page,
      limit: newFilters.limit,
    }));
  }, [location.search]);

  // Fetch questions when filters change
  useEffect(() => {
    // We allow fetching even if category is empty, you can add condition if needed
    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();

        // Append all non-empty filters to query params
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== '' && value !== null && value !== undefined) {
            queryParams.append(key, value);
          }
        });

        // Using axios instead of fetch for consistency with your app's pattern
        const response = await axios.get(`/questions?${queryParams.toString()}`);
        
        // Assuming your API returns data in this structure, adjust if needed
        const data = response.data;

        // Defensive check in case data shape varies
        setQuestions(Array.isArray(data.questions) ? data.questions : (Array.isArray(data) ? data : []));

        if (data.pagination) {
          setPagination({
            page: data.pagination.page || 1,
            limit: data.pagination.limit || 10,
            totalPages: data.pagination.totalPages || 1,
          });
        } else {
          // If no pagination info, assume 1 page
          setPagination(prev => ({
            ...prev,
            totalPages: 1,
          }));
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError(err.message || 'Failed to fetch questions');
        
        // For development - use mock data if API fails
        // This can be removed in production
        setQuestions([
          {
            _id: "mock1",
            text: "What is the primary function of hemoglobin?",
            options: ["Oxygen transport", "Sugar metabolism", "Hormone regulation", "Immune response"],
            explanation: "Hemoglobin is responsible for oxygen transport in red blood cells.",
            tags: ["hematology", "physiology"],
            difficulty: "medium",
            category: "Physiology",
            subject: "Hematology",
            topic: "Blood Components"
          },
          {
            _id: "mock2",
            text: "Which of the following is NOT a symptom of appendicitis?",
            options: ["Fever", "Right lower quadrant pain", "Rebound tenderness", "Jaundice"],
            explanation: "Jaundice is not typically associated with appendicitis.",
            tags: ["emergency", "abdominal"],
            difficulty: "hard",
            category: "Clinical",
            subject: "Surgery",
            topic: "Acute Abdomen"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [filters]);

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };

  const changePage = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;

    const searchParams = new URLSearchParams(location.search);
    searchParams.set('page', newPage);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  if (loading && questions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filter Summary */}
      <div className="bg-gray-100 p-4 mb-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Applied Filters</h2>
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Category: {filters.category}
            </span>
          )}
          {filters.subject && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Subject: {filters.subject}
            </span>
          )}
          {filters.topic && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              Topic: {filters.topic}
            </span>
          )}
          {filters.difficulty && (
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              Difficulty: {filters.difficulty}
            </span>
          )}
          {filters.tags && (
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
              Tags: {filters.tags}
            </span>
          )}
        </div>
      </div>

      {/* Selected Questions Summary */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold">Questions ({questions.length})</h2>
        <div className="flex items-center space-x-4">
          <span>Selected: {selectedQuestions.length}</span>
          <StartTestButton selectedQuestions={selectedQuestions} filters={filters} />
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {questions.length > 0 ? (
          questions.map((question) => (
            <QuestionCard
              key={question._id}
              question={question}
              isSelected={selectedQuestions.includes(question._id)}
              onToggleSelect={() => toggleQuestionSelection(question._id)}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No questions found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="inline-flex rounded-md shadow">
            <button
              onClick={() => changePage(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <div className="px-4 py-2 border-t border-b border-gray-300 bg-white text-sm font-medium text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <button
              onClick={() => changePage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

// Fixed StartTestButton component with proper className using backticks
const StartTestButton = ({ selectedQuestions, filters }) => {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartTest = async () => {
    setIsStarting(true);
    try {
      const requestBody = {
        category: filters.category,
        subject: filters.subject,
        topic: filters.topic ? filters.topic.split(',') : [],
        tags: filters.tags ? filters.tags.split(',') : [],
        difficulty: filters.difficulty,
        count: selectedQuestions.length,
        questions: selectedQuestions,
      };
      
      const response = await axios.post('/start-test', requestBody);

      // Navigate to test page with the test ID and questions
      navigate(`/test/${response.data.testId}`, {
        state: {
          testSessionId: response.data.testId,
          questions: selectedQuestions.map(id => 
            questions.find(q => q._id === id)
          ).filter(Boolean)
        }
      });
    } catch (error) {
      console.error('Error starting test:', error);
      alert(error.response?.data?.message || 'Failed to start test');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <button
      onClick={handleStartTest}
      disabled={selectedQuestions.length === 0 || isStarting}
      className={`px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50`}
    >
      {isStarting ? 'Starting...' : 'Start Test'}
    </button>
  );
};

export default QuestionsPage;