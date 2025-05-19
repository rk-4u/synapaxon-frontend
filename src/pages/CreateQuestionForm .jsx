// CreateQuestionForm.jsx
import React, { useState } from 'react';
import { X, PlusCircle, Image, CheckCircle } from 'lucide-react';
import axios from 'axios';

const CreateQuestionForm = ({ onQuestionCreated = () => {} }) => {
  const [formData, setFormData] = useState({
    questionText: '',
    explanation: '',
    options: ['', '', '', ''],
    correctAnswer: null,
    difficulty: 'medium',
    category: 'Basic Sciences',
    subject: '',
    topic: '',
    tags: [],
    media: {
      type: 'none',
      url: ''
    },
    sourceUrl: ''
  });

  const [currentTag, setCurrentTag] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subject options based on category
  const subjectsByCategory = {
    'Basic Sciences': ['Neuroscience', 'Physiology', 'Anatomy', 'Immunology', 'Histology', 'Microbiology'],
    'Organ Systems': ['Respiratory System', 'Renal System'],
    'Clinical Specialties': ['Pharmacology', 'Cardiology']
  };

  // Topic options based on subject
  const topicsBySubject = {
    Neuroscience: ['Autonomic Nervous System', 'Cranial Nerves'],
    Physiology: ['Endocrine System'],
    Anatomy: ['Cerebral Circulation'],
    Immunology: ['Hypersensitivity Reactions'],
    Histology: ['Respiratory Epithelium'],
    Microbiology: ['Antibiotics'],
    'Respiratory System': ['Pulmonary Physiology'],
    'Renal System': ['Nephrotic Syndrome'],
    Pharmacology: ['Cardiovascular Drugs'],
    Cardiology: ['Ischemic Heart Disease']
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...formData.options];
    updatedOptions[index] = value;
    setFormData({ ...formData, options: updatedOptions });
  };

  const handleCorrectAnswerSelect = (index) => {
    setFormData({ ...formData, correctAnswer: index });
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setFormData({ 
      ...formData, 
      category,
      subject: '',  // Reset subject when category changes
      topic: ''     // Reset topic when category changes
    });
  };

  const handleSubjectChange = (e) => {
    const subject = e.target.value;
    setFormData({ 
      ...formData, 
      subject,
      topic: ''  // Reset topic when subject changes
    });
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag.trim()]
      });
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleMediaTypeChange = (e) => {
    const type = e.target.value;
    setFormData({
      ...formData,
      media: {
        ...formData.media,
        type,
        url: type === 'none' ? '' : formData.media.url
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.questionText.trim() === '') {
      setErrorMessage('Question text is required');
      return;
    }
    
    if (formData.options.some(option => option.trim() === '')) {
      setErrorMessage('All options must be filled');
      return;
    }
    
    if (formData.correctAnswer === null) {
      setErrorMessage('Please select the correct answer');
      return;
    }
    
    if (!formData.subject) {
      setErrorMessage('Please select a subject');
      return;
    }
    
    if (!formData.topic) {
      setErrorMessage('Please select a topic');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setErrorMessage('Authentication required. Please log in again.');
        return;
      }
      
      const response = await axios.post(
        'http://localhost:5000/api/questions',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setSuccessMessage('Question created successfully!');
        // Reset form
        setFormData({
          questionText: '',
          explanation: '',
          options: ['', '', '', ''],
          correctAnswer: null,
          difficulty: 'medium',
          category: 'Basic Sciences',
          subject: '',
          topic: '',
          tags: [],
          media: {
            type: 'none',
            url: ''
          },
          sourceUrl: ''
        });
        
        // Trigger callback
        onQuestionCreated(response.data.data);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        setErrorMessage(response.data.message || 'Failed to create question');
      }
    } catch (error) {
      console.error('Error creating question:', error);
      setErrorMessage(error.response?.data?.message || 'An error occurred while creating the question');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-blue-600 mb-6">Create New Question</h2>
      
      {successMessage && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span>{successMessage}</span>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Question Text */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="questionText">
            Question Text*
          </label>
          <textarea
            id="questionText"
            name="questionText"
            value={formData.questionText}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the question text here..."
            required
          />
        </div>
        
        {/* Options and Correct Answer */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Options* (Select the correct answer)
          </label>
          <div className="space-y-3">
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center">
                <div
                  onClick={() => handleCorrectAnswerSelect(index)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full mr-3 flex items-center justify-center cursor-pointer ${
                    formData.correctAnswer === index
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {String.fromCharCode(65 + index)} {/* A, B, C, etc. */}
                </div>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  required
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Explanation */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="explanation">
            Explanation
          </label>
          <textarea
            id="explanation"
            name="explanation"
            value={formData.explanation}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Explain the correct answer..."
          />
        </div>
        
        {/* Category, Subject, Topic Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Category */}
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="category">
              Category*
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleCategoryChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Category</option>
              <option value="Basic Sciences">Basic Sciences</option>
              <option value="Organ Systems">Organ Systems</option>
              <option value="Clinical Specialties">Clinical Specialties</option>
            </select>
          </div>
          
          {/* Subject */}
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="subject">
              Subject*
            </label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleSubjectChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Subject</option>
              {formData.category && subjectsByCategory[formData.category]?.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          
          {/* Topic */}
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="topic">
              Topic*
            </label>
            <select
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Topic</option>
              {formData.subject && topicsBySubject[formData.subject]?.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Difficulty */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Difficulty*</label>
          <div className="flex space-x-4">
            {['easy', 'medium', 'hard'].map((level) => (
              <label key={level} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="difficulty"
                  value={level}
                  checked={formData.difficulty === level}
                  onChange={handleInputChange}
                  className="mr-2 h-4 w-4"
                />
                <span className="capitalize">{level}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Tags */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Tags</label>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full flex items-center"
              >
                {tag}
                <button 
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a tag"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="bg-blue-600 text-white px-4 rounded-r-md hover:bg-blue-700 flex items-center"
            >
              <PlusCircle size={16} className="mr-1" /> Add
            </button>
          </div>
        </div>
        
        {/* Media */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Media</label>
          <div className="flex items-center space-x-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="mediaType"
                value="none"
                checked={formData.media.type === 'none'}
                onChange={handleMediaTypeChange}
                className="mr-2 h-4 w-4"
              />
              <span>None</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="mediaType"
                value="url"
                checked={formData.media.type === 'url'}
                onChange={handleMediaTypeChange}
                className="mr-2 h-4 w-4"
              />
              <span>Image URL</span>
            </label>
          </div>
          
          {formData.media.type === 'url' && (
            <div className="flex">
              <div className="relative flex-grow">
                <Image size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="url"
                  value={formData.media.url}
                  onChange={(e) => setFormData({
                    ...formData,
                    media: { ...formData.media, url: e.target.value }
                  })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter image URL"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Source URL */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="sourceUrl">
            Source URL
          </label>
          <input
            type="url"
            id="sourceUrl"
            name="sourceUrl"
            value={formData.sourceUrl}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://..."
          />
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-md ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white font-medium`}
          >
            {isSubmitting ? 'Creating...' : 'Create Question'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuestionForm;