import React, { useState } from 'react';
import { X, PlusCircle, Upload, Image, File, CheckCircle, Plus, Trash2, Paperclip, Link } from 'lucide-react';
import axios from '../api/axiosConfig';
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
    questionMedia: [],
    explanationMedia: [],
    optionMedia: Array(2).fill([]),
    sourceUrl: ''
  });

  const [currentTag, setCurrentTag] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Media upload states
  const [uploadingFor, setUploadingFor] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [mediaType, setMediaType] = useState('file');
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
      subject: '',
      topic: ''
    });
  };

  const handleSubjectChange = (e) => {
    const subject = e.target.value;
    setFormData({ 
      ...formData, 
      subject,
      topic: ''
    });
  };

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, ''],
      optionMedia: [...formData.optionMedia, []]
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
    
    const updatedOptionMedia = [...formData.optionMedia];
    updatedOptionMedia.splice(index, 1);
    
    let newCorrectAnswer = formData.correctAnswer;
    if (formData.correctAnswer === index) {
      newCorrectAnswer = null;
    } else if (formData.correctAnswer > index) {
      newCorrectAnswer = formData.correctAnswer - 1;
    }
    
    setFormData({
      ...formData,
      options: updatedOptions,
      optionMedia: updatedOptionMedia,
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
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setUploadedFiles(files);
      setUploadSuccess(false);
      setUploadError('');
    }
  };

  const startMediaUpload = (target) => {
    setUploadingFor(target);
    setUploadedFiles([]);
    setUrlInput('');
    setMediaType('file');
    setUploadSuccess(false);
    setUploadError('');
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) {
      setUploadError('Please enter a URL');
      return;
    }
    if (!validateUrl(urlInput.trim())) {
      setUploadError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    const url = urlInput.trim();
    const filename = url.split('/').pop() || `url-${Date.now()}`; // Ensure non-empty filename
    const mediaObject = {
      type: 'url',
      path: url,
      filename: filename,
      originalname: filename,
      mimetype: 'text/url',
      size: 0
    };

    // Update the appropriate media field
    if (uploadingFor === 'question') {
      setFormData({
        ...formData,
        questionMedia: [...formData.questionMedia, mediaObject]
      });
    } else if (uploadingFor === 'explanation') {
      setFormData({
        ...formData,
        explanationMedia: [...formData.explanationMedia, mediaObject]
      });
    } else if (typeof uploadingFor === 'number') {
      const updatedOptionMedia = [...formData.optionMedia];
      updatedOptionMedia[uploadingFor] = [
        ...updatedOptionMedia[uploadingFor],
        mediaObject
      ];
      setFormData({ ...formData, optionMedia: updatedOptionMedia });
    }

    setUploadSuccess(true);
    setUrlInput('');
  };

  const handleUploadMedia = async () => {
    if (!uploadedFiles.length) {
      setUploadError('Please select at least one file to upload');
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
      uploadedFiles.forEach(file => formDataObj.append('media', file));
      
      const response = await axios.post(
        '/api/uploads/multiple',
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
        
        const mediaObjects = response.data.data.map(file => {
          // Ensure all required fields are present
          if (!file.filename || !file.originalname || !file.mimetype || !file.size || !file.path) {
            throw new Error('Invalid media object from server');
          }
          return {
            type: file.mimetype.split('/')[0],
            path: file.path,
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          };
        });
        
        // Update the appropriate media field
        if (uploadingFor === 'question') {
          setFormData({
            ...formData,
            questionMedia: [...formData.questionMedia, ...mediaObjects]
          });
        } else if (uploadingFor === 'explanation') {
          setFormData({
            ...formData,
            explanationMedia: [...formData.explanationMedia, ...mediaObjects]
          });
        } else if (typeof uploadingFor === 'number') {
          const updatedOptionMedia = [...formData.optionMedia];
          updatedOptionMedia[uploadingFor] = [
            ...updatedOptionMedia[uploadingFor],
            ...mediaObjects
          ];
          setFormData({ ...formData, optionMedia: updatedOptionMedia });
        }
      } else {
        setUploadError(response.data.message || 'Failed to upload files');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadError(error.message || 'An error occurred while uploading the files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveUploadedMedia = (target, index) => {
    if (target === 'question') {
      const updatedQuestionMedia = [...formData.questionMedia];
      updatedQuestionMedia.splice(index, 1);
      setFormData({ ...formData, questionMedia: updatedQuestionMedia });
    } else if (target === 'explanation') {
      const updatedExplanationMedia = [...formData.explanationMedia];
      updatedExplanationMedia.splice(index, 1);
      setFormData({ ...formData, explanationMedia: updatedExplanationMedia });
    } else if (typeof target === 'number') {
      const updatedOptionMedia = [...formData.optionMedia];
      updatedOptionMedia[target].splice(index, 1);
      setFormData({ ...formData, optionMedia: updatedOptionMedia });
    }
    
    if (uploadingFor === target) {
      setUploadedFiles([]);
      setUrlInput('');
      setUploadSuccess(false);
      setUploadError('');
    }
  };

  const handleCancelUpload = () => {
    setUploadingFor(null);
    setUploadedFiles([]);
    setUrlInput('');
    setMediaType('file');
    setUploadSuccess(false);
    setUploadError('');
  };

  const validateMediaObject = (media) => {
    return (
      media &&
      typeof media === 'object' &&
      media.filename &&
      media.originalname &&
      media.mimetype &&
      media.path &&
      (media.size !== undefined) // Size can be 0 for URLs
    );
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

    // Validate media objects
    if (formData.questionMedia.some(media => !validateMediaObject(media))) {
      setErrorMessage('All question media objects must include filename, originalname, mimetype, size, and path');
      return;
    }
    if (formData.explanationMedia.some(media => !validateMediaObject(media))) {
      setErrorMessage('All explanation media objects must include filename, originalname, mimetype, size, and path');
      return;
    }
    for (let i = 0; i < formData.optionMedia.length; i++) {
      if (formData.optionMedia[i].some(media => !validateMediaObject(media))) {
        setErrorMessage(`All media objects for option ${String.fromCharCode(65 + i)} must include filename, originalname, mimetype, size, and path`);
        return;
      }
    }
    
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setErrorMessage('Authentication required. Please log in again.');
        return;
      }
      
      // Create submission data structure
      const submissionData = {
        questionText: formData.questionText,
        explanation: formData.explanation,
        options: formData.options.map((text, index) => ({
          text,
          media: formData.optionMedia[index]
        })),
        correctAnswer: formData.correctAnswer,
        difficulty: formData.difficulty,
        category: formData.category,
        subject: formData.subject,
        topic: formData.topic,
        tags: formData.tags,
        questionMedia: formData.questionMedia,
        explanationMedia: formData.explanationMedia,
        sourceUrl: formData.sourceUrl
      };
      
      const response = await axios.post(
        '/api/questions',
        submissionData,
        {
          headers: {
            Authorization: `Bearer ${token}`
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
          questionMedia: [],
          explanationMedia: [],
          optionMedia: Array(2).fill([]),
          sourceUrl: ''
        });
        
        onQuestionCreated(response.data.data);
        
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
  
  // Helper function to render media upload button
  const renderMediaButton = (target, media) => {
    const mediaArray = Array.isArray(media) ? media : [media].filter(Boolean);
    
    return (
      <div className="mt-2">
        {mediaArray.length > 0 && (
          <div className="space-y-2 mb-2">
            {mediaArray.map((mediaItem, index) => (
              <div key={index} className="flex items-center p-2 bg-blue-50 border border-blue-200 rounded-md text-sm">
                <div className="flex items-center flex-1 overflow-hidden">
                  {mediaItem.type === 'image' ? (
                    <Image className="w-4 h-4 mr-2 text-blue-500" />
                  ) : mediaItem.type === 'url' ? (
                    <Link className="w-4 h-4 mr-2 text-blue-500" />
                  ) : (
                    <File className="w-4 h-4 mr-2 text-blue-500" />
                  )}
                  <span className="truncate">{mediaItem.originalname}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveUploadedMedia(target, index)}
                  className="ml-2 p-1 text-gray-500 hover:text-red-500"
                  title="Remove media"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => startMediaUpload(target)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <Paperclip size={14} className="mr-1" />
          Add Media or URL (Optional)
        </button>
      </div>
    );
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
      
      {/* Media Upload Modal */}
      {uploadingFor !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Add Media or URL {
                uploadingFor === 'question' ? 'for Question' :
                uploadingFor === 'explanation' ? 'for Explanation' :
                `for Option ${String.fromCharCode(65 + uploadingFor)}`
              }
            </h3>
            
            {/* Media Type Toggle */}
            <div className="mb-4 flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mediaType"
                  value="file"
                  checked={mediaType === 'file'}
                  onChange={() => setMediaType('file')}
                  className="mr-2"
                />
                Upload File
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mediaType"
                  value="url"
                  checked={mediaType === 'url'}
                  onChange={() => setMediaType('url')}
                  className="mr-2"
                />
                Paste URL
              </label>
            </div>
            
            <div className="mb-4">
              {mediaType === 'file' && !uploadedFiles.length ? (
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
                      multiple
                    />
                  </label>
                </div>
              ) : mediaType === 'file' && uploadedFiles.length > 0 ? (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div className="flex items-center overflow-hidden">
                        {getFileIcon(file)}
                        <span className="truncate max-w-xs">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({Math.round(file.size / 1024)} KB)
                        </span>
                      </div>
                      <div className="flex items-center">
                        {uploadSuccess && (
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
                            setUploadedFiles(updatedFiles);
                          }}
                          className="p-1 text-gray-500 rounded-full hover:bg-gray-100"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Paste URL (e.g., https://example.com/image.jpg)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                  >
                    <Link size={16} className="mr-2" />
                    Add URL
                  </button>
                </div>
              )}
            </div>
            
            {uploadError && (
              <div className="mb-4 text-sm text-red-600">
                {uploadError}
              </div>
            )}
            
            {uploadSuccess && (
              <div className="mb-4 text-sm text-green-600 flex items-center">
                <CheckCircle size={16} className="mr-1" />
                {mediaType === 'file' ? 'File(s) uploaded successfully!' : 'URL added successfully!'}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelUpload}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              
              {mediaType === 'file' && uploadedFiles.length > 0 && !uploadSuccess && (
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
              )}
              
              {uploadSuccess && (
                <button
                  type="button"
                  onClick={() => setUploadingFor(null)}
                  className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white"
                >
                  Done
                </button>
              )}
            </div>
          </div>
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
          {renderMediaButton('question', formData.questionMedia)}
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
              <div key={index} className="flex flex-col">
                <div className="flex items-center">
                  <div
                    onClick={() => handleCorrectAnswerSelect(index)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full mr-3 flex items-center justify-center cursor-pointer ${
                      formData.correctAnswer === index
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
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
                {renderMediaButton(index, formData.optionMedia[index])}
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
          {renderMediaButton('explanation', formData.explanationMedia)}
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
        
        {/* Category Buttons */}
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
          <label className="block text-gray-700 font-medium mb-2">
            Select A Subject for the Related Question then you have options to select topics under those subjects.
          </label>
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
        
        {/* Source URL */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="sourceUrl">
            Source URL (Optional)
          </label>
          <input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            value={formData.sourceUrl}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter source URL (e.g., https://example.com)"
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