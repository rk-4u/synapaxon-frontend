import { useState } from 'react';
import { Switch } from '@headlessui/react';

const QuestionManagement = () => {
  // Sample question data
  const initialQuestions = [
    {
      id: 1,
      question: "Which of the following is the most common cause of hypercalcemia in hospitalized patients?",
      options: [
        "Primary hyperparathyroidism",
        "Malignancy",
        "Vitamin D intoxication",
        "Thiazide diuretic use"
      ],
      correctAnswer: 1,
      explanation: "While primary hyperparathyroidism is the most common cause of hypercalcemia in the outpatient setting, malignancy is the most common cause in hospitalized patients.",
      topic: "Endocrinology",
      subtopic: "Calcium Disorders",
      difficulty: "Medium",
      status: "Approved",
      lastUpdated: "2023-05-10",
      hasImage: false
    },
    {
      id: 2,
      question: "The most common site of metastasis for prostate cancer is:",
      options: [
        "Liver",
        "Lung",
        "Bone",
        "Brain"
      ],
      correctAnswer: 2,
      explanation: "Prostate cancer most commonly metastasizes to bone, particularly the axial skeleton (vertebral column, pelvis, ribs).",
      topic: "Oncology",
      subtopic: "Genitourinary Cancers",
      difficulty: "Hard",
      status: "Approved",
      lastUpdated: "2023-05-08",
      hasImage: true
    },
    {
      id: 3,
      question: "Which cranial nerve is responsible for the pupillary light reflex?",
      options: [
        "Optic nerve (CN II)",
        "Oculomotor nerve (CN III)",
        "Trochlear nerve (CN IV)",
        "Abducens nerve (CN VI)"
      ],
      correctAnswer: 1,
      explanation: "The afferent limb of the pupillary light reflex is mediated by the optic nerve (CN II), and the efferent limb is mediated by the oculomotor nerve (CN III).",
      topic: "Neurology",
      subtopic: "Cranial Nerves",
      difficulty: "Easy",
      status: "Pending",
      lastUpdated: "2023-05-05",
      hasImage: false
    }
  ];

  // State management
  const [questions, setQuestions] = useState(initialQuestions);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    topic: 'All',
    difficulty: 'All',
    status: 'All'
  });

  // Available options for filters
  const topics = ['All', 'Endocrinology', 'Neurology', 'Oncology', 'Cardiology', 'Pulmonology'];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];
  const statuses = ['All', 'Approved', 'Pending', 'Rejected'];

  // Filter questions based on search and filters
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.subtopic.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTopic = filters.topic === 'All' || question.topic === filters.topic;
    const matchesDifficulty = filters.difficulty === 'All' || question.difficulty === filters.difficulty;
    const matchesStatus = filters.status === 'All' || question.status === filters.status;
    
    return matchesSearch && matchesTopic && matchesDifficulty && matchesStatus;
  });

  // Handle creating a new question
  const handleCreateNew = () => {
    setEditingQuestion({
      id: questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1,
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
      topic: "",
      subtopic: "",
      difficulty: "Medium",
      status: "Pending",
      lastUpdated: new Date().toISOString().split('T')[0],
      hasImage: false
    });
    setIsCreatingNew(true);
  };

  // Handle editing an existing question
  const handleEditQuestion = (question) => {
    setEditingQuestion({ ...question });
    setIsCreatingNew(false);
  };

  // Handle saving a question (new or existing)
  const handleSaveQuestion = () => {
    if (isCreatingNew) {
      setQuestions([...questions, editingQuestion]);
    } else {
      setQuestions(questions.map(q => q.id === editingQuestion.id ? editingQuestion : q));
    }
    setEditingQuestion(null);
  };

  // Handle deleting a question
  const handleDeleteQuestion = (id) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  // Handle changes to question options
  const handleOptionChange = (index, value) => {
    const newOptions = [...editingQuestion.options];
    newOptions[index] = value;
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  // Add a new option
  const addOption = () => {
    if (editingQuestion.options.length < 6) {
      setEditingQuestion({
        ...editingQuestion,
        options: [...editingQuestion.options, ""]
      });
    }
  };

  // Remove an option
  const removeOption = (index) => {
    if (editingQuestion.options.length > 2) {
      const newOptions = [...editingQuestion.options];
      newOptions.splice(index, 1);
      
      let newCorrectAnswer = editingQuestion.correctAnswer;
      if (index === editingQuestion.correctAnswer) {
        newCorrectAnswer = 0;
      } else if (index < editingQuestion.correctAnswer) {
        newCorrectAnswer = editingQuestion.correctAnswer - 1;
      }
      
      setEditingQuestion({
        ...editingQuestion,
        options: newOptions,
        correctAnswer: newCorrectAnswer
      });
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you would upload to a server and get a URL
      const reader = new FileReader();
      reader.onload = () => {
        setEditingQuestion({
          ...editingQuestion,
          imageUrl: reader.result,
          hasImage: true
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image removal
  const handleRemoveImage = () => {
    setEditingQuestion({
      ...editingQuestion,
      imageUrl: undefined,
      hasImage: false
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and controls */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Question Bank</h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage all questions in the question bank
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add New Question
              </button>
            </div>
          </div>
        </div>

        {/* Filters and search */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
              <input
                type="text"
                id="search"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="topic-filter" className="block text-sm font-medium text-gray-700">Topic</label>
              <select
                id="topic-filter"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={filters.topic}
                onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
              >
                {topics.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="difficulty-filter" className="block text-sm font-medium text-gray-700">Difficulty</label>
              <select
                id="difficulty-filter"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                id="status-filter"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Questions table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Topic
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((question) => (
                  <tr key={question.id}>
                    <td className="px-6 py-4 whitespace-normal max-w-xs">
                      <div className="text-sm font-medium text-gray-900">
                        {question.question.length > 80 
                          ? `${question.question.substring(0, 80)}...` 
                          : question.question}
                      </div>
                      {question.hasImage && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          Has Image
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{question.topic}</div>
                      <div className="text-sm text-gray-500">{question.subtopic}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        question.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        question.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {question.lastUpdated}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No questions found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Question editor modal */}
      {editingQuestion && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setEditingQuestion(null)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {isCreatingNew ? 'Create New Question' : 'Edit Question'}
                  </h3>
                  <div className="mt-6 space-y-6">
                    {/* Question text */}
                    <div>
                      <label htmlFor="question-text" className="block text-sm font-medium text-gray-700">
                        Question Text
                      </label>
                      <textarea
                        id="question-text"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={editingQuestion.question}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                      />
                    </div>

                    {/* Image upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Question Image</label>
                      {editingQuestion.hasImage ? (
                        <div className="mt-2 flex items-center">
                          <img 
                            src={editingQuestion.imageUrl || "https://via.placeholder.com/300x200"} 
                            alt="Question illustration" 
                            className="h-32 object-contain"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Remove Image
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                              >
                                <span>Upload an image</span>
                                <input
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Options</label>
                      <div className="mt-2 space-y-2">
                        {editingQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center">
                            <input
                              type="radio"
                              name="correct-answer"
                              checked={editingQuestion.correctAnswer === index}
                              onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: index })}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              className="ml-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder={`Option ${index + 1}`}
                            />
                            {editingQuestion.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(index)}
                                className="ml-2 text-red-600 hover:text-red-900"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                        {editingQuestion.options.length < 6 && (
                          <button
                            type="button"
                            onClick={addOption}
                            className="mt-2 inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <svg className="-ml-0.5 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Option
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Explanation */}
                    <div>
                      <label htmlFor="explanation" className="block text-sm font-medium text-gray-700">
                        Explanation
                      </label>
                      <textarea
                        id="explanation"
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={editingQuestion.explanation}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                      />
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
                          Topic
                        </label>
                        <select
                          id="topic"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={editingQuestion.topic}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, topic: e.target.value })}
                        >
                          <option value="">Select a topic</option>
                          {topics.filter(t => t !== 'All').map(topic => (
                            <option key={topic} value={topic}>{topic}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="subtopic" className="block text-sm font-medium text-gray-700">
                          Subtopic
                        </label>
                        <input
                          type="text"
                          id="subtopic"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={editingQuestion.subtopic}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, subtopic: e.target.value })}
                        />
                      </div>
                      <div>
                        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                          Difficulty
                        </label>
                        <select
                          id="difficulty"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={editingQuestion.difficulty}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })}
                        >
                          {difficulties.filter(d => d !== 'All').map(difficulty => (
                            <option key={difficulty} value={difficulty}>{difficulty}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {!isCreatingNew && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Status
                          </label>
                          <select
                            id="status"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={editingQuestion.status}
                            onChange={(e) => setEditingQuestion({ ...editingQuestion, status: e.target.value })}
                          >
                            {statuses.filter(s => s !== 'All').map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="lastUpdated" className="block text-sm font-medium text-gray-700">
                            Last Updated
                          </label>
                          <input
                            type="text"
                            id="lastUpdated"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={editingQuestion.lastUpdated}
                            readOnly
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleSaveQuestion}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setEditingQuestion(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;