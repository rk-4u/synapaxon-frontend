import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronDown, ChevronUp, Trash2, X } from "lucide-react";
import axios from '../../api/axiosConfig';
import { categories, subjectsByCategory, topicsBySubject } from '../../data/questionData';

const QuestionBank = () => {
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(false); // Changed initial state to false
  const [error, setError] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [subjectCounts, setSubjectCounts] = useState({});
  const [topicCounts, setTopicCounts] = useState({});
  const [activeSubject, setActiveSubject] = useState(null);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState(new Set());
  const [selectedTopics, setSelectedTopics] = useState(new Map());
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  // Get token once and memoize it
  const token = useMemo(() => localStorage.getItem("token"), []);

  // Memoize fetchQuestions with useCallback to prevent infinite re-renders
  const fetchQuestions = useCallback(async () => {
    if (!selectedCategory || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null); // Clear previous errors
      
      const params = { category: selectedCategory };
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      
      const res = await axios.get('/api/questions', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      
      if (res.data.success) {
        setAllQuestions(res.data.data || []);
      } else {
        throw new Error(res.data.message || "Failed to fetch questions");
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError(err.message);
      setAllQuestions([]); // Clear questions on error
    } finally {
      setLoading(false); // Always set loading to false
    }
  }, [selectedCategory, selectedDifficulty, token]);

  // Fetch category counts with better error handling
  const fetchCategoryCounts = useCallback(async () => {
    if (!token) return;

    try {
      const counts = {};
      const promises = categories.map(async (cat) => {
        try {
          const params = { category: cat.name };
          if (selectedDifficulty) params.difficulty = selectedDifficulty;
          
          const res = await axios.get('/api/questions', {
            headers: { Authorization: `Bearer ${token}` },
            params,
          });
          
          if (res.data.success) {
            counts[cat.name] = res.data.count || 0;
          }
        } catch (err) {
          console.error(`Error fetching count for ${cat.name}:`, err);
          counts[cat.name] = 0; // Default to 0 on error
        }
      });

      await Promise.all(promises);
      setCategoryCounts(counts);
    } catch (err) {
      console.error("Error fetching category counts:", err);
    }
  }, [selectedDifficulty, token]);

  // Fetch category counts based on selected difficulty
  useEffect(() => {
    fetchCategoryCounts();
  }, [fetchCategoryCounts]);

  // Fetch all questions for the selected category and difficulty
  useEffect(() => {
    if (selectedCategory) {
      fetchQuestions();
    } else {
      setAllQuestions([]);
      setLoading(false);
    }
  }, [selectedCategory, fetchQuestions]);

  // Add token validation effect
  useEffect(() => {
    if (!token) {
      setError("No authentication token found. Please log in.");
      setLoading(false);
    }
  }, [token]);

  const computeCounts = (questions) => {
    const subjectCounts = {};
    const topicCounts = {};

    questions.forEach((q) => {
      const questionSubjects = new Set();
      q.subjects.forEach((s) => {
        if (!subjectCounts[s.name]) subjectCounts[s.name] = 0;
        if (!questionSubjects.has(s.name)) {
          subjectCounts[s.name]++;
          questionSubjects.add(s.name);
        }
        s.topics.forEach((t) => {
          const key = `${s.name}||${t}`;
          if (!topicCounts[key]) topicCounts[key] = 0;
          topicCounts[key]++;
        });
      });
    });

    return { subjectCounts, topicCounts };
  };

  // Compute subject and topic counts from allQuestions
  useEffect(() => {
    const { subjectCounts, topicCounts } = computeCounts(allQuestions);
    setSubjectCounts(subjectCounts);
    setTopicCounts(topicCounts);
  }, [allQuestions]);

  // Filter questions client-side based on selected subjects and topics
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      if (selectedSubjects.size === 0) return true;
      return Array.from(selectedSubjects).some((subject) => {
        const questionSubject = q.subjects.find((s) => s.name === subject);
        if (!questionSubject) return false;
        const selectedTopicsForSubject = selectedTopics.get(subject) || [];
        if (selectedTopicsForSubject.length === 0) return true;
        return selectedTopicsForSubject.some((t) => questionSubject.topics.includes(t));
      });
    });
  }, [allQuestions, selectedSubjects, selectedTopics]);

  const toggleQuestion = (questionId) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleDelete = (questionId) => {
    setQuestionToDelete(questionId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!token) {
      alert("No authentication token found");
      return;
    }

    try {
      const response = await axios.delete(`/api/questions/${questionToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete question");
      }

      alert("Question deleted successfully");
      setAllQuestions(allQuestions.filter(q => q._id !== questionToDelete));
      setIsDeleteModalOpen(false);
      setQuestionToDelete(null);
    } catch (err) {
      console.error("Error deleting question:", err);
      alert(`Failed to delete question: ${err.message}`);
    }
  };

  const toggleSubject = (subject) => {
    setSelectedSubjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subject)) {
        newSet.delete(subject);
        setSelectedTopics((prevTopics) => {
          const newMap = new Map(prevTopics);
          newMap.delete(subject);
          return newMap;
        });
      } else {
        newSet.add(subject);
      }
      setActiveSubject(newSet.size > 0 && !newSet.has(activeSubject) ? subject : activeSubject);
      return newSet;
    });
  };

  const toggleTopic = (topic, subject) => {
    setSelectedTopics((prev) => {
      const newMap = new Map(prev);
      const subjectTopics = newMap.get(subject) || [];
      if (subjectTopics.includes(topic)) {
        newMap.set(subject, subjectTopics.filter((t) => t !== topic));
      } else {
        newMap.set(subject, [...subjectTopics, topic]);
      }
      if (newMap.get(subject).length === 0) {
        newMap.delete(subject);
      }
      return newMap;
    });
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(new Date(dateString));
  };

  // Show error if no token
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-8">
        <div className="max-w-full mx-auto">
          <div className="text-red-600 p-4 text-center">
            <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
            <p>Please log in to access the question bank.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error) return <div className="text-red-600 p-4 text-center">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-8">
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Confirm Delete</h2>
            <p className="mb-6 text-gray-600">Are you sure you want to delete this question?</p>
            <div className="flex justify-end space-x-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-full mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Question Bank</h1>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Filter Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubjects(new Set());
                  setSelectedTopics(new Map());
                  setActiveSubject(null);
                }}
                className="w-full p-3 border rounded dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a Category</option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name} (Q{categoryCounts[cat.name] || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full p-3 border rounded dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Subjects Filter */}
            {selectedCategory && (
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">Subjects</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded dark:bg-gray-700">
                  {(subjectsByCategory[selectedCategory] || []).map((subject) => {
                    const count = subjectCounts[subject] || 0;
                    const isSelected = selectedSubjects.has(subject);
                    return (
                      <button
                        key={subject}
                        onClick={() => toggleSubject(subject)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        }`}
                      >
                        {subject} (Q{count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Topics Filter */}
          {selectedSubjects.size > 0 && (
            <div className="mt-6">
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">Topics</label>
              <div className="flex gap-4 mb-4 flex-wrap">
                {Array.from(selectedSubjects).map((subject) => (
                  <button
                    key={subject}
                    onClick={() => setActiveSubject(subject)}
                    className={`px-4 py-2 rounded transition-colors ${
                      activeSubject === subject
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
              {activeSubject && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Topics for {activeSubject}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {(topicsBySubject[activeSubject] || []).map((topic) => {
                      const key = `${activeSubject}||${topic}`;
                      const count = topicCounts[key] || 0;
                      const isSelected = (selectedTopics.get(activeSubject) || []).includes(topic);
                      return (
                        <label
                          key={key}
                          className={`flex items-center px-3 py-1 rounded-full border cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTopic(topic, activeSubject)}
                            className="hidden"
                          />
                          <span className="mr-2">{topic}</span>
                          <span className="text-green-600 font-semibold">Q{count}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Questions List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Questions ({filteredQuestions.length})
          </h2>
          {filteredQuestions.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300 text-center">
              {selectedCategory ? "No questions found for the selected filters." : "Select a category to view questions."}
            </p>
          ) : (
            filteredQuestions.map((question, index) => (
              <div key={question._id} className="mb-4 border-b dark:border-gray-700 pb-4">
                <button
                  onClick={() => toggleQuestion(question._id)}
                  className="w-full flex justify-between items-center text-left"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Q{index + 1}: {question.questionText}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Created by: {question.createdBy.name} • {formatDate(question.createdAt)}
                    </p>
                  </div>
                  {expandedQuestions[question._id] ? (
                    <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  )}
                </button>
                {expandedQuestions[question._id] && (
                  <div className="mt-4">
                    {question.options.map((option, oIndex) => (
                      <p
                        key={oIndex}
                        className={
                          question.correctAnswer === oIndex
                            ? "text-green-600"
                            : "text-gray-700 dark:text-gray-300"
                        }
                      >
                        {String.fromCharCode(65 + oIndex)}. {option.text}
                      </p>
                    ))}
                    <p className="mt-2 text-gray-700 dark:text-gray-300">
                      <strong>Explanation:</strong> {question.explanation}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Category: {question.category} • Difficulty: {question.difficulty} • Subjects:{" "}
                      {question.subjects.map((s) => s.name).join(", ")}
                    </p>
                    <button
                      onClick={() => handleDelete(question._id)}
                      className="mt-4 flex items-center px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionBank;