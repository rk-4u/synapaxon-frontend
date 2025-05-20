// EnhancedCreateQuestionForm.jsx
import React, { useState } from 'react';
import { X, PlusCircle, Upload, Image, File, CheckCircle, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { subjectsByCategory, topicsBySubject } from '../data/questionData';

const EnhancedCreateQuestionForm = ({ onQuestionCreated = () => {} }) => {
  const [formData, setFormData] = useState({
    questionText: '',
    explanation: '',
    options: ['', ''], // Starting with 2 options
    correctAnswer: null,
    difficulty: 'medium',
    category: 'Basic Sciences',
    subject: '',
    topic: '',
    tags: [],
    media: null,
    sourceUrl: ''
  });

  const [currentTag, setCurrentTag] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

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

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, '']
    });
  };

  const handleRemoveOption = (index) => {
    if (formData.options.length <= 2) {
      setErrorMessage('Minimum 2 options required');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    const updatedOptions = [...formData.options];
    updatedOptions.splice(index, 1);
    
    // Update correctAnswer if needed
    let newCorrectAnswer = formData.correctAnswer;
    if (formData.correctAnswer === index) {
      newCorrectAnswer = null;
    } else if (formData.correctAnswer > index) {
      newCorrectAnswer = formData.correctAnswer - 1;
    }
    
    setFormData({
      ...formData,
      options: updatedOptions,
      correctAnswer: newCorrectAnswer
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setUploadSuccess(false);
      setUploadError('');
      // Reset any previously uploaded media
      setFormData({
        ...formData,
        media: null
      });
    }
  };

  const handleUploadMedia = async () => {
    if (!uploadedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setUploadError('Authentication required. Please log in again.');
        setIsUploading(false);
        return;
      }
      
      const formDataObj = new FormData();
      formDataObj.append('media', uploadedFile);
      
      const response = await axios.post(
        'https://synapaxon-backend.onrender.com/api/uploads',
        formDataObj,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        setUploadSuccess(true);
        setFormData({
          ...formData,
          media: {
            type: response.data.data.mimetype.split('/')[0], // Extract type (image, video, etc.)
            path: response.data.data.path,
            filename: response.data.data.filename,
            originalname: response.data.data.originalname,
            mimetype: response.data.data.mimetype
          }
        });
      } else {
        setUploadError(response.data.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error.response?.data?.message || 'An error occurred while uploading the file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveUploadedFile = () => {
    setUploadedFile(null);
    setUploadSuccess(false);
    setUploadError('');
    setFormData({
      ...formData,
      media: null
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
        'https://synapaxon-backend.onrender.com/api/questions',
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
          options: ['', ''],
          correctAnswer: null,
          difficulty: 'medium',
          category: 'Basic Sciences',
          subject: '',
          topic: '',
          tags: [],
          media: null,
          sourceUrl: ''
        });
        setUploadedFile(null);
        setUploadSuccess(false);
        
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

  // Helper function to get file icon based on mimetype
  const getFileIcon = (file) => {
    if (!file) return null;
    
    const type = file.type.split('/')[0];
    
    switch (type) {
      case 'image':
        return <Image className="w-6 h-6 mr-2 text-blue-500" />;
      case 'video':
        return <File className="w-6 h-6 mr-2 text-purple-500" />;
      case 'application':
        return <File className="w-6 h-6 mr-2 text-orange-500" />;
      default:
        return <File className="w-6 h-6 mr-2 text-gray-500" />;
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
        {/* Category Tabs */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Category*</label>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setFormData({...formData, category: 'Basic Sciences', subject: '', topic: ''})}
              className={`flex-1 py-3 text-center font-medium transition-colors rounded ${
                formData.category === 'Basic Sciences' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              Basic Science
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, category: 'Organ Systems', subject: '', topic: ''})}
              className={`flex-1 py-3 text-center font-medium transition-colors rounded ${
                formData.category === 'Organ Systems' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              Organ Systems
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, category: 'Clinical Specialties', subject: '', topic: ''})}
              className={`flex-1 py-3 text-center font-medium transition-colors rounded ${
                formData.category === 'Clinical Specialties' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              Clinical Specialties
            </button>
          </div>
        </div>
        {/* Subject Buttons in Grid */}
            <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2"> Select A Subject for the Related Question then you have options to select topics under those subjects.</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {formData.category && subjectsByCategory[formData.category]?.map((subject) => (
                <button
                    type="button"
                    key={subject}
                    onClick={() => setFormData({ ...formData, subject, topic: '' })}
                    className={`py-2 px-3 rounded text-sm font-medium border transition ${
                    formData.subject === subject
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                >
                    {subject}
                </button>
                ))}
            </div>
            </div>

            {/* Topics Row (Visible only if subject selected) */}
            {formData.subject && (
            <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Select Topic for the Related Question</label>
                <div className="flex flex-wrap gap-2">
                {topicsBySubject[formData.subject]?.map((topic) => (
                    <button
                    type="button"
                    key={topic}
                    onClick={() => setFormData({ ...formData, topic })}
                    className={`py-2 px-4 rounded text-sm font-medium border transition ${
                        formData.topic === topic
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    }`}
                    >
                    {topic}
                    </button>
                ))}
                </div>
            </div>
            )}

        
        {/* Media Upload */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Media Upload (Optional)</h3>
          
          <div className="mb-3">
            {!uploadedFile ? (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      Images, videos, PDFs (MAX. 10MB)
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileChange} 
                    accept="image/*,video/*,application/pdf"
                  />
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div className="flex items-center overflow-hidden">
                  {getFileIcon(uploadedFile)}
                  <span className="truncate max-w-xs">{uploadedFile.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({Math.round(uploadedFile.size / 1024)} KB)
                  </span>
                </div>
                <div className="flex items-center">
                  {uploadSuccess && (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveUploadedFile}
                    className="p-1 text-gray-500 rounded-full hover:bg-gray-100"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {uploadedFile && !uploadSuccess && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleUploadMedia}
                disabled={isUploading}
                className={`px-4 py-2 rounded ${
                  isUploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } flex items-center`}
              >
                <Upload size={16} className="mr-2" />
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          )}
          
          {uploadError && (
            <div className="mt-2 text-sm text-red-600">
              {uploadError}
            </div>
          )}
          
          {uploadSuccess && (
            <div className="mt-2 text-sm text-green-600 flex items-center">
              <CheckCircle size={16} className="mr-1" />
              File uploaded successfully!
            </div>
          )}
        </div>
        
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
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 font-medium">
              Options* (Select the correct answer)
            </label>
            <button
              type="button"
              onClick={handleAddOption}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <Plus size={16} className="mr-1" /> Add Option
            </button>
          </div>
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
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  className="ml-2 p-1 text-gray-500 hover:text-red-500"
                  title="Remove option"
                >
                  <Trash2 size={18} />
                </button>
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
          <label className="block text-gray-700 font-medium mb-2">Tags (Optional)</label>
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
        
        {/* Source URL */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="sourceUrl">
            Source URL (Optional)
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

export default EnhancedCreateQuestionForm;