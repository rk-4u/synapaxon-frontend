import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Image as ImageIcon, Edit, Trash2, ArrowLeft, X } from "lucide-react";
import axios from '../api/axiosConfig';
import MediaDisplay from './MediaDisplay';

const MyCreatedQuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editQuestionData, setEditQuestionData] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    const handleStorageChange = () => {
      setTheme(localStorage.getItem("theme") || "light");
    };
    window.addEventListener("storage", handleStorageChange);
    document.documentElement.classList.toggle("dark", theme === "dark");
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [theme]);

  useEffect(() => {
    const fetchCreatedQuestions = async () => {
      try {
        if (!token) throw new Error("Authentication token not found");
        const response = await axios.get(`/api/questions?createdBy=me`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!response.data.success) throw new Error(response.data.message || "Failed to fetch questions");
        setQuestions(response.data.data || []);
        setTotalQuestions(response.data.count || 0);
      } catch (err) {
        console.error("Error fetching created questions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCreatedQuestions();
  }, [token]);

  const toggleQuestion = (questionId) => {
    setExpandedQuestions((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleEdit = (question) => {
    setEditQuestionData({
      _id: question._id,
      questionText: question.questionText,
      explanation: question.explanation,
      options: question.options.map(opt => opt.text),
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty,
      category: question.category,
      subjects: question.subjects,
      questionMedia: question.questionMedia || [],
      explanationMedia: question.explanationMedia || [],
      optionMedia: question.options.map(opt => opt.media || []),
      sourceUrl: question.sourceUrl || '',
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (questionId) => {
    setQuestionToDelete(questionId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(`/api/questions/${questionToDelete}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.data.success) throw new Error(response.data.message || "Failed to delete question");
      setQuestions(questions.filter(q => q._id !== questionToDelete));
      setTotalQuestions(prev => prev - 1);
      setIsDeleteModalOpen(false);
      setQuestionToDelete(null);
    } catch (err) {
      console.error("Error deleting question:", err);
      setError(`Failed to delete question: ${err.message}`);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const submissionData = {
        questionText: editQuestionData.questionText,
        explanation: editQuestionData.explanation,
        options: editQuestionData.options.map((text, index) => ({
          text,
          media: editQuestionData.optionMedia[index] || [],
        })),
        correctAnswer: editQuestionData.correctAnswer,
        difficulty: editQuestionData.difficulty,
        category: editQuestionData.category,
        subjects: editQuestionData.subjects,
        questionMedia: editQuestionData.questionMedia,
        explanationMedia: editQuestionData.explanationMedia,
        sourceUrl: editQuestionData.sourceUrl,
      };
      const response = await axios.put(`/api/questions/${editQuestionData._id}`, submissionData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.data.success) throw new Error(response.data.message || "Failed to update question");
      setQuestions(questions.map(q => q._id === editQuestionData._id ? response.data.data : q));
      setIsEditModalOpen(false);
      setEditQuestionData(null);
    } catch (err) {
      console.error("Error updating question:", err);
      setError(`Failed to update question: ${err.message}`);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 dark:border-blue-400 mb-4 mx-auto"></div>
          <div className="text-gray-900 dark:text-gray-300 text-lg font-medium">Loading your created questions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-full mx-auto mt-12 p-8 bg-red-600/30 dark:bg-red-600/20 border border-red-500/40 dark:border-red-500/30 rounded-2xl shadow-lg backdrop-blur-md">
        <div className="flex items-center">
          <svg className="w-8 h-8 text-red-900 dark:text-red-200 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-900 dark:text-red-200 text-lg font-semibold">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-8">
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white/20 dark:bg-black/10 backdrop-blur-lg rounded-lg p-6 max-w-md mx-auto border border-white/40 dark:border-gray-800/20">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-200">Confirm Delete</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">Are you sure you want to delete this question? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-white/40 dark:border-gray-700/30 text-gray-900 dark:text-gray-300 rounded-lg hover:bg-white/40 dark:hover:bg-black/20 backdrop-blur-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600/90 dark:bg-red-600/80 text-white rounded-lg hover:bg-red-700/95 dark:hover:bg-red-500/90 backdrop-blur-sm border border-white/40 dark:border-gray-700/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editQuestionData && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white/20 dark:bg-black/10 backdrop-blur-lg rounded-lg p-6 max-w-2xl w-full mx-4 overflow-y-auto max-h-[90vh] border border-white/40 dark:border-gray-800/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200">Edit Question</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                aria-label="Close edit form"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-gray-900 dark:text-gray-200 font-medium mb-2" htmlFor="editQuestionText">
                  Question Text*
                </label>
                <textarea
                  id="editQuestionText"
                  value={editQuestionData.questionText}
                  onChange={(e) => setEditQuestionData({ ...editQuestionData, questionText: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-white/40 dark:border-gray-700/30 rounded-md bg-white/30 dark:bg-black/10 backdrop-blur-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-900 dark:text-gray-200 font-medium mb-2">Options* (Select the correct answer)</label>
                {editQuestionData.options.map((option, index) => (
                  <div key={index} className="flex flex-col mb-2">
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setEditQuestionData({ ...editQuestionData, correctAnswer: index })}
                        className={`flex-shrink-0 w-6 h-6 rounded-full mr-3 flex items-center justify-center border border-white/40 dark:border-gray-700/30 ${
                          editQuestionData.correctAnswer === index
                            ? 'bg-green-600/90 dark:bg-green-600/80 text-white'
                            : 'bg-white/30 dark:bg-black/10 text-gray-900 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-black/20'
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </button>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const updatedOptions = [...editQuestionData.options];
                          updatedOptions[index] = e.target.value;
                          setEditQuestionData({ ...editQuestionData, options: updatedOptions });
                        }}
                        className="flex-grow px-3 py-2 border border-white/40 dark:border-gray-700/30 rounded-md bg-white/30 dark:bg-black/10 backdrop-blur-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <label className="block text-gray-900 dark:text-gray-200 font-medium mb-2" htmlFor="editExplanation">
                  Explanation*
                </label>
                <textarea
                  id="editExplanation"
                  value={editQuestionData.explanation}
                  onChange={(e) => setEditQuestionData({ ...editQuestionData, explanation: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-white/40 dark:border-gray-700/30 rounded-md bg-white/30 dark:bg-black/10 backdrop-blur-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-white/40 dark:border-gray-700/30 text-gray-900 dark:text-gray-300 rounded-lg hover:bg-white/40 dark:hover:bg-black/20 backdrop-blur-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600/90 dark:bg-blue-600/80 text-white rounded-lg hover:bg-blue-700/95 dark:hover:bg-blue-500/90 backdrop-blur-sm border border-white/40 dark:border-gray-700/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-200">My Created Questions</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center px-4 py-2 bg-white/30 dark:bg-black/10 text-gray-900 dark:text-gray-300 rounded-lg hover:bg-white/40 dark:hover:bg-black/20 transition backdrop-blur-sm border border-white/40 dark:border-gray-700/30"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white/20 dark:bg-black/10 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-white/40 dark:border-gray-800/20">
          <div className="bg-blue-600/90 dark:bg-blue-600/80 p-8 text-white flex justify-between items-center backdrop-blur-sm">
            <h2 className="text-2xl font-bold">My Created Questions</h2>
            <div className="text-base font-semibold">
              Total Questions: <span className="bg-white/30 dark:bg-black/20 text-gray-900 dark:text-gray-300 px-3 py-1 rounded-full">{totalQuestions}</span>
            </div>
          </div>

          <div className="p-8">
            {questions.length === 0 ? (
              <div className="p-16 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-32 h-32 bg-white/30 dark:bg-black/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/40 dark:border-gray-700/30">
                    <ImageIcon className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-4">No Questions Created</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-lg mb-8 leading-relaxed">
                    Start contributing by creating your first question for the platform.
                  </p>
                  <button
                    onClick={() => navigate("/dashboard/create")}
                    className="w-full px-8 py-4 bg-blue-600/90 dark:bg-blue-600/80 text-white rounded-xl hover:bg-blue-700/95 dark:hover:bg-blue-500/90 transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 backdrop-blur-sm border border-white/40 dark:border-gray-700/20"
                  >
                    Create a Question
                  </button>
                </div>
              </div>
            ) : (
              <>
                {questions.map((question, qIndex) => (
                  <div
                    key={question._id}
                    className="mb-6 bg-white/30 dark:bg-black/20 backdrop-blur-sm border border-white/40 dark:border-gray-700/30 rounded-xl shadow-sm hover:shadow-lg transition-all"
                  >
                    <button
                      onClick={() => toggleQuestion(question._id)}
                      className="w-full p-8 flex justify-between items-center text-left hover:bg-white/40 dark:hover:bg-black/30 transition-colors"
                    >
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200">
                          Q{qIndex + 1}: {question.questionText || "Question not available"}
                        </h3>
                        {question.questionMedia?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {question.questionMedia.map((media, index) => (
                              <MediaDisplay
                                key={media._id || index}
                                media={media}
                                label={`Question Media ${index + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      {expandedQuestions[question._id] ? (
                        <ChevronUp className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                      )}
                    </button>
                    {expandedQuestions[question._id] && (
                      <div className="p-8 border-t border-white/40 dark:border-gray-700/30">
                        <div className="space-y-4 mb-6">
                          {question.options?.map((option, oIndex) => (
                            <div
                              key={option._id || oIndex}
                              className={`p-4 rounded-lg flex items-center space-x-4 ${
                                question.correctAnswer === oIndex
                                  ? "bg-blue-600/30 dark:bg-blue-600/20 border border-blue-500/40 dark:border-blue-500/30"
                                  : "bg-white/30 dark:bg-black/20 border border-white/40 dark:border-gray-700/30"
                              } backdrop-blur-sm`}
                            >
                              <div className="flex-shrink-0">
                                {question.correctAnswer === oIndex ? (
                                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <div className="w-6 h-6"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-base text-gray-900 dark:text-gray-300">
                                  {String.fromCharCode(65 + oIndex)}. {option.text || "Option not available"}
                                </p>
                                {option.media?.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {option.media.map((media, mediaIndex) => (
                                      <MediaDisplay
                                        key={media._id || mediaIndex}
                                        media={media}
                                        label={`Option ${String.fromCharCode(65 + oIndex)} Media ${mediaIndex + 1}`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6">
                          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-200 mb-2">Explanation</h4>
                          <p className="text-base text-gray-900 dark:text-gray-300">{question.explanation || "No explanation available"}</p>
                          {question.explanationMedia?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {question.explanationMedia.map((media, index) => (
                                <MediaDisplay
                                  key={media._id || index}
                                  media={media}
                                  label={`Explanation Media ${index + 1}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 mt-4">
                          <span>Category: {question.category || "N/A"}</span>
                          <span className="mx-2">•</span>
                          <span>Subject: {question.subjects?.map(s => s.name).join(", ") || "N/A"}</span>
                          <span className="mx-2">•</span>
                          <span>Difficulty: {question.difficulty || "N/A"}</span>
                          <span className="mx-2">•</span>
                          <span>Created: {formatDate(question.createdAt)}</span>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                          <button
                            onClick={() => handleEdit(question)}
                            className="flex items-center px-4 py-2 bg-yellow-600/90 dark:bg-yellow-600/80 text-white rounded-lg hover:bg-yellow-700/95 dark:hover:bg-yellow-500/90 transition-colors backdrop-blur-sm border border-white/40 dark:border-gray-700/20"
                          >
                            <Edit className="w-5 h-5 mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(question._id)}
                            className="flex items-center px-4 py-2 bg-red-600/90 dark:bg-red-600/80 text-white rounded-lg hover:bg-red-700/95 dark:hover:bg-red-500/90 transition-colors backdrop-blur-sm border border-white/40 dark:border-gray-700/20"
                          >
                            <Trash2 className="w-5 h-5 mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCreatedQuestionsPage;