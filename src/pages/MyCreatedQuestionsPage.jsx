import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Image as ImageIcon, Edit, Trash2, ArrowLeft, X, Plus } from "lucide-react";
import axios from '../api/axiosConfig';
import MediaDisplay from "./MediaDisplay";

const MyCreatedQuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editQuestionData, setEditQuestionData] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Fetch questions without pagination
  useEffect(() => {
    const fetchCreatedQuestions = async () => {
      try {
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await axios.get('/api/questions?createdBy=me', {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to fetch questions");
        }

        setQuestions(response.data.data || []);
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
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Open edit modal with pre-filled data
  const handleEdit = (question) => {
    setEditQuestionData({
      _id: question._id,
      questionText: question.questionText || '',
      explanation: question.explanation || '',
      options: question.options?.map(opt => opt.text || '') || ['', '', '', ''],
      correctAnswer: question.correctAnswer || 0,
      difficulty: question.difficulty || 'easy',
      category: question.category || 'Basic Sciences',
      subjects: question.subjects || [],
      tags: question.tags || [],
      sourceUrl: question.sourceUrl || '',
    });
    setIsEditModalOpen(true);
  };

  // Handle delete confirmation
  const handleDelete = (questionId) => {
    setQuestionToDelete(questionId);
    setIsDeleteModalOpen(true);
  };

  // Confirm and perform deletion
  const confirmDelete = async () => {
    try {
      const response = await axios.delete(`/api/questions/${questionToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete question");
      }

      alert("Question deleted successfully");
      setQuestions(questions.filter(q => q._id !== questionToDelete));
      setIsDeleteModalOpen(false);
      setQuestionToDelete(null);
    } catch (err) {
      console.error("Error deleting question:", err);
      alert(`Failed to delete question: ${err.message}`);
    }
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const submissionData = {
        questionText: editQuestionData.questionText,
        explanation: editQuestionData.explanation,
        options: editQuestionData.options.map(text => ({ text })),
        correctAnswer: editQuestionData.correctAnswer,
        difficulty: editQuestionData.difficulty,
        category: editQuestionData.category,
        subjects: editQuestionData.subjects,
        tags: editQuestionData.tags,
        sourceUrl: editQuestionData.sourceUrl,
      };

      const response = await axios.put(`/api/questions/${editQuestionData._id}`, submissionData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update question");
      }

      alert("Question updated successfully");
      setQuestions(questions.map(q => 
        q._id === editQuestionData._id ? response.data.data : q
      ));
      setIsEditModalOpen(false);
      setEditQuestionData(null);
    } catch (err) {
      console.error("Error updating question:", err);
      alert(`Failed to update question: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 mb-4 mx-auto"></div>
          <div className="text-gray-600 text-lg font-medium">Loading your created questions...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-full mx-auto mt-12 p-8 bg-red-50 border border-red-300 rounded-2xl shadow-lg">
        <div className="flex items-center">
          <svg className="w-8 h-8 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-800 text-lg font-semibold">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-8">
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Confirm Delete</h2>
            <p className="mb-6 text-gray-600">Are you sure you want to delete this question? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {isEditModalOpen && editQuestionData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Question</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Question Text*</label>
                <textarea
                  value={editQuestionData.questionText}
                  onChange={(e) => setEditQuestionData({ ...editQuestionData, questionText: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Options* (Select the correct answer)</label>
                {editQuestionData.options.map((option, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <button
                      type="button"
                      onClick={() => setEditQuestionData({ ...editQuestionData, correctAnswer: index })}
                      className={`flex-shrink-0 w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                        editQuestionData.correctAnswer === index ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
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
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    {editQuestionData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updatedOptions = editQuestionData.options.filter((_, i) => i !== index);
                          let newCorrectAnswer = editQuestionData.correctAnswer;
                          if (editQuestionData.correctAnswer === index) {
                            newCorrectAnswer = 0;
                          } else if (editQuestionData.correctAnswer > index) {
                            newCorrectAnswer -= 1;
                          }
                          setEditQuestionData({
                            ...editQuestionData,
                            options: updatedOptions,
                            correctAnswer: newCorrectAnswer,
                          });
                        }}
                        className="ml-2 p-1 text-gray-500 hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setEditQuestionData({
                    ...editQuestionData,
                    options: [...editQuestionData.options, ''],
                  })}
                  className="mt-2 flex items-center text-indigo-600 hover:text-indigo-800"
                >
                  <Plus size={16} className="mr-1" /> Add Option
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Explanation*</label>
                <textarea
                  value={editQuestionData.explanation}
                  onChange={(e) => setEditQuestionData({ ...editQuestionData, explanation: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Difficulty*</label>
                <div className="flex space-x-4">
                  {['easy', 'medium', 'hard'].map((level) => (
                    <label key={level} className="flex items-center">
                      <input
                        type="radio"
                        name="editDifficulty"
                        value={level}
                        checked={editQuestionData.difficulty === level}
                        onChange={(e) => setEditQuestionData({ ...editQuestionData, difficulty: e.target.value })}
                        className="mr-2"
                      />
                      <span className="capitalize">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Category*</label>
                <select
                  value={editQuestionData.category}
                  onChange={(e) => setEditQuestionData({ ...editQuestionData, category: e.target.value, subjects: [] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {['Basic Sciences', 'Organ Systems', 'Clinical Specialties'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Source URL (Optional)</label>
                <input
                  type="url"
                  value={editQuestionData.sourceUrl}
                  onChange={(e) => setEditQuestionData({ ...editQuestionData, sourceUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter source URL"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">My Created Questions</h1>
          <button onClick={() => navigate("/dashboard")} className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-600 p-8 text-white flex justify-between items-center">
            <h2 className="text-2xl font-bold">My Created Questions</h2>
            <div className="text-base font-semibold">
              Total Questions: <span className="bg-white text-indigo-600 px-3 py-1 rounded-full">{questions.length}</span>
            </div>
          </div>

          <div className="p-8">
            {questions.length === 0 ? (
              <div className="p-16 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
                    <ImageIcon className="w-16 h-16 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">No Questions Created</h3>
                  <p className="text-gray-600 text-lg mb-8 leading-relaxed">Start contributing by creating your first question for the platform.</p>
                  <button
                    onClick={() => navigate("/dashboard/create")}
                    className="w-full px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Create a Question
                  </button>
                </div>
              </div>
            ) : (
              questions.map((question, qIndex) => (
                <div key={question._id} className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
                  <button
                    onClick={() => toggleQuestion(question._id)}
                    className="w-full p-8 flex justify-between items-center text-left hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Q{qIndex + 1}: {question.questionText || "Question not available"}
                      </h3>
                      {question.questionMedia?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {question.questionMedia.map((media, index) => (
                            <MediaDisplay key={index} media={media} label={`Question Media ${index + 1}`} />
                          ))}
                        </div>
                      )}
                    </div>
                    {expandedQuestions[question._id] ? <ChevronUp className="w-6 h-6 text-gray-600" /> : <ChevronDown className="w-6 h-6 text-gray-600" />}
                  </button>
                  {expandedQuestions[question._id] && (
                    <div className="p-8 border-t border-gray-200">
                      <div className="space-y-4 mb-6">
                        {question.options?.map((option, oIndex) => (
                          <div key={oIndex} className={`p-4 rounded-lg flex items-center space-x-4 ${
                            question.correctAnswer === oIndex ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border border-gray-200"
                          }`}>
                            <div className="flex-shrink-0">
                              {question.correctAnswer === oIndex ? (
                                <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <div className="w-6 h-6"></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-base text-gray-700">
                                {String.fromCharCode(65 + oIndex)}. {option.text || "Option not available"}
                              </p>
                              {option.media?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {option.media.map((media, mediaIndex) => (
                                    <MediaDisplay key={mediaIndex} media={media} label={`Option ${String.fromCharCode(65 + oIndex)} Media ${mediaIndex + 1}`} />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6">
                        <h4 className="text-base font-semibold text-gray-900 mb-2">Explanation</h4>
                        <p className="text-base text-gray-700">{question.explanation || "No explanation available"}</p>
                        {question.explanationMedia?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {question.explanationMedia.map((media, index) => (
                              <MediaDisplay key={index} media={media} label={`Explanation Media ${index + 1}`} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-4">
                        <span>Category: {question.category || "N/A"}</span>
                        <span className="mx-2">•</span>
                        <span>Subject: {question.subjects?.map(s => s.name).join(", ") || "N/A"}</span>
                        <span className="mx-2">•</span>
                        <span>Difficulty: {question.difficulty || "N/A"}</span>
                        <span className="mx-2">•</span>
                        <span>Created: {formatDate(question.createdAt)}</span>
                      </div>
                      <div className="mt-6 flex justify-end space-x-4">
                        <button onClick={() => handleEdit(question)} className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
                          <Edit className="w-5 h-5 mr-2" />
                          Edit
                        </button>
                        <button onClick={() => handleDelete(question._id)} className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                          <Trash2 className="w-5 h-5 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCreatedQuestionsPage;