import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, File, Image, Bot, User, CheckCircle, Loader, Download, Plus, X, Paperclip, Link } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from '../api/axiosConfig'; // Assuming this path is correct
import { subjectsByCategory, topicsBySubject } from '../data/questionData'; // Assuming this path is correct
import { generateQuestionsFromDocumentAI, generateQuestionsFromTextAI, explainAnswerChoiceAI } from '../api/aiapi'; // Assuming this path is correct

const AIQuestionAssistant = () => {
  // State Variables
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      type: 'bot', 
      content: 'Hi! Upload your document (PDF, image, or text), add any instructions in the text box below, and then click the Send button. I\'ll help you generate questions from it.' 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]); // Files staged for main chat/AI processing
  const [isGenerating, setIsGenerating] = useState(false); // For AI document processing
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [formData, setFormData] = useState({
    questionText: '',
    explanation: '',
    options: ['', ''],
    correctAnswer: null,
    difficulty: 'medium',
    category: 'Basic Sciences',
    subjects: [],
    tags: [],
    questionMedia: [],
    explanationMedia: [],
    optionMedia: Array(2).fill([]),
    sourceUrl: ''
  });
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // For media uploads within the form/modal & form submission
  const [uploadingFor, setUploadingFor] = useState(null); // Tracks which part of form media is being added to
  const [currentTag, setCurrentTag] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [mediaType, setMediaType] = useState('file'); // For modal: 'file' or 'url'
  const [urlInput, setUrlInput] = useState(''); // For modal URL input
  const [modalTempFiles, setModalTempFiles] = useState([]); // Files for the media modal's input
  const [uploadSuccess, setUploadSuccess] = useState(false); // For modal media upload success
  const [uploadError, setUploadError] = useState(''); // For modal media upload error

  // Refs
  const fileInputRef = useRef(null); // For main chat file input
  const messagesEndRef = useRef(null);

  const [currentAIMode, setCurrentAIMode] = useState('generate'); // 'generate' or 'explain'
  const [activeQuestionForExplanation, setActiveQuestionForExplanation] = useState(null); // Store the question object being discussed

  // Effects
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles(prevStagedFiles => [...prevStagedFiles, ...files]);
    
    files.forEach(file => {
      const message = {
        id: Date.now() + Math.random(),
        type: 'user',
        content: `File staged for sending: ${file.name}`,
        file: file 
      };
      setMessages(prev => [...prev, message]);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear file input
    }
  };

  const generateQuestionsFromFiles = async (filesToProcess, instructionsForAI) => {
    if (!filesToProcess || filesToProcess.length === 0) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        content: 'No files were selected/provided to send for question generation.'
      }]);
      return;
    }

    setIsGenerating(true);
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      type: 'bot',
      content: `Sending ${filesToProcess.length} file(s) ${instructionsForAI ? 'with your instructions' : ''} to the AI for analysis...`
    }]);

    const effectiveInstructions = instructionsForAI ? instructionsForAI.trim() : undefined;

    try {
      const response = await generateQuestionsFromDocumentAI(filesToProcess, effectiveInstructions);

      if (response.success && response.data && response.data.length > 0) {
        const aiGeneratedQuestions = response.data.map(q => ({
          id: q.id, 
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        }));
        const botMessage = {
          id: Date.now(),
          type: 'bot',
          content: "I've analyzed your document(s) and generated some questions. Click on any question to customize and add it to your question bank.",
          questions: aiGeneratedQuestions,
        };
        setMessages(prev => [...prev, botMessage]);
      } else if (response.success && (!response.data || response.data.length === 0)) {
        const botMessage = {
          id: Date.now(),
          type: 'bot',
          content: response.message || "The AI couldn't generate any questions from the provided document(s). Please try a different document or be more specific with instructions.",
        };
        setMessages(prev => [...prev, botMessage]);
      } else { 
        const botMessage = {
          id: Date.now(),
          type: 'bot',
          content: `Error: ${response.message || 'Failed to generate questions from the AI service.'}`,
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) { 
      console.error("Error in generateQuestionsFromFiles component:", error);
      const botMessage = {
        id: Date.now(),
        type: 'bot',
        content: 'An unexpected error occurred while trying to generate questions. Please try again.',
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to find a question in messages by its ID
  const findQuestionByIdInMessages = (questionId) => {
    for (const message of messages) {
      if (message.questions) {
        const found = message.questions.find(q => q.id === questionId);
        if (found) return found;
      }
    }
    return null;
  };

  // When a user clicks on a question in the chat (not the customize button, but the question itself)
  // This is a new handler. You'll need to make the question text clickable in your render.
  const handleChatQuestionClick = (questionId) => {
    const question = findQuestionByIdInMessages(questionId);
    if (question) {
      setActiveQuestionForExplanation(question);
      // setCurrentAIMode('explain'); // User should already be in 'explain' mode or switch via toggle
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        content: `Now discussing: "${question.questionText.substring(0, 50)}...". What would you like to know? (e.g., "why is option B wrong?", "explain more about the correct answer")`
      }]);
      // Optionally, scroll to input or focus it
      // inputRef.current?.focus();
    } else {
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'bot',
            content: "Sorry, I couldn't find that specific question in our current chat history to discuss."
        }]);
    }
  };

  // MODIFIED handleSendMessage
  const handleSendMessage = async () => {
    if (isGenerating) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        content: "I'm still working on your previous request. Please wait a moment."
      }]);
      return;
    }

    const currentInputText = inputText.trim();

    if (!currentInputText) { // No text typed
      if (currentAIMode === 'generate' && uploadedFiles.length > 0) {
        // Files are uploaded, but no specific instructions typed. Proceed with document generation.
        setMessages(prev => [...prev, {
          id: Date.now(), type: 'user', content: "(Sending uploaded documents for processing without additional instructions)"
        }]);
        // `currentInputText` is empty, so `undefined` will be passed as instructions
      } else {
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'bot',
          content: "Please type a message or instructions."
        }]);
        return;
      }
    } else {
      // Text is typed, add it as a user message
      const userMessage = { id: Date.now(), type: 'user', content: currentInputText };
      setMessages(prev => [...prev, userMessage]);
    }
    
    setInputText(''); // Clear input field after capturing text

    setIsGenerating(true); // Set loading state for AI interaction

    // --- GENERATE MODE ---
    if (currentAIMode === 'generate') {
      if (uploadedFiles.length > 0) {
        // Scenario 1A: Generate from uploaded documents
        // `currentInputText` (captured before clearing) contains instructions for the documents
        await generateQuestionsFromFiles([...uploadedFiles], currentInputText || undefined);
        setUploadedFiles([]); // Clear staged files after sending for document processing
      } else if (currentInputText) {
        // Scenario 1B: Generate from pasted text (no files uploaded, but text was in input)
        setMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          type: 'bot',
          content: `Analyzing your pasted text for concepts and generating questions...`
        }]);
        try {
          const response = await generateQuestionsFromTextAI(currentInputText /*, optional_instructions */);
          if (response.success && response.data && response.data.length > 0) {
            const aiGeneratedQuestions = response.data.map(q => ({ ...q }));
            const botMessage = {
              id: Date.now(), type: 'bot',
              content: "I've generated questions from your pasted text. Click a question to customize, or switch to 'Explain Mode' to discuss them.",
              questions: aiGeneratedQuestions
            };
            setMessages(prev => [...prev, botMessage]);
          } else {
            const botMessage = {
              id: Date.now(), type: 'bot',
              content: response.message || "The AI couldn't generate questions from your pasted text. Please ensure each concept is clearly stated."
            };
            setMessages(prev => [...prev, botMessage]);
          }
        } catch (error) {
          console.error("Error in handleSendMessage (text-based generation):", error);
          const botMessage = {
            id: Date.now(), type: 'bot',
            content: 'An unexpected error occurred while generating questions from your text.'
          };
          setMessages(prev => [...prev, botMessage]);
        }
      } else {
        // This case should be caught by the initial `!currentInputText && uploadedFiles.length === 0`
        // but as a fallback:
        setMessages(prev => [...prev, {
            id: Date.now(), type: 'bot',
            content: "In 'Generate Mode', please either upload documents or paste text/concepts to generate questions."
        }]);
      }
    }
    // --- EXPLAIN MODE ---
    else if (currentAIMode === 'explain') {
      if (!activeQuestionForExplanation) {
        setMessages(prev => [...prev, {
          id: Date.now(), type: 'bot',
          content: "You're in 'Explain Mode'. Please click on a previously generated question in the chat to select it for discussion, then type your query."
        }]);
        setIsGenerating(false); // Not an AI processing error, just user guidance
        return;
      }

      if (!currentInputText) { // User clicked send without typing a query for the active question
         setMessages(prev => [...prev, {
          id: Date.now(), type: 'bot',
          content: `You've selected question: "${activeQuestionForExplanation.questionText.substring(0,50)}...". What would you like to ask about it?`
        }]);
        setIsGenerating(false);
        return;
      }

      // User has typed a query for the activeQuestionForExplanation
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(), type: 'bot',
        content: `Thinking about your query regarding: "${activeQuestionForExplanation.questionText.substring(0, 30)}..."`
      }]);

      let targetOptionText;
      const optionMatch = currentInputText.match(/(option|choice)\s*([A-Da-d1-9])/i); // Allow up to 9 options
      if (optionMatch && activeQuestionForExplanation.options) {
        const letterOrNum = optionMatch[2].toUpperCase();
        let optIndex = -1;
        if (letterOrNum >= 'A' && letterOrNum <= 'I') { // A-I for 9 options
          optIndex = letterOrNum.charCodeAt(0) - 'A'.charCodeAt(0);
        } else if (!isNaN(parseInt(letterOrNum, 10))) {
          const num = parseInt(letterOrNum, 10);
          if (num >= 1 && num <= activeQuestionForExplanation.options.length) {
            optIndex = num - 1;
          }
        }
        if (optIndex >= 0 && optIndex < activeQuestionForExplanation.options.length) {
          targetOptionText = activeQuestionForExplanation.options[optIndex];
        }
      }

      try {
        const payload = {
          questionText: activeQuestionForExplanation.questionText,
          options: activeQuestionForExplanation.options,
          correctAnswerIndex: activeQuestionForExplanation.correctAnswer,
          originalExplanation: activeQuestionForExplanation.explanation,
          userQuery: currentInputText, // The query user typed
          targetOptionText: targetOptionText,
        };
        const response = await explainAnswerChoiceAI(payload);
        if (response.success && response.explanation) {
          setMessages(prev => [...prev, { id: Date.now(), type: 'bot', content: response.explanation }]);
        } else {
          setMessages(prev => [...prev, {
            id: Date.now(), type: 'bot',
            content: response.message || "Sorry, I couldn't provide an explanation for that query."
          }]);
        }
      } catch (error) {
        console.error("Error getting explanation:", error);
        setMessages(prev => [...prev, {
          id: Date.now(), type: 'bot',
          content: "An error occurred while fetching the explanation."
        }]);
      }
    }
    setIsGenerating(false); // Reset loading state
  };

  

  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
    setFormData({
      ...formData,
      questionText: question.questionText,
      explanation: question.explanation,
      options: question.options,
      correctAnswer: question.correctAnswer,
      optionMedia: Array(question.options.length).fill([])
    });
    setShowQuestionForm(true);
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

  const handleCategoryChange = (category) => {
    setFormData({ ...formData, category, subjects: [] });
  };

  const handleSubjectToggle = (subject) => {
    let updatedSubjects;
    if (formData.subjects.some(s => s.name === subject)) {
      updatedSubjects = formData.subjects.filter(s => s.name !== subject);
    } else {
      updatedSubjects = [...formData.subjects, { name: subject, topics: [] }];
    }
    setFormData({ ...formData, subjects: updatedSubjects });
  };

  const handleTopicToggle = (topic, subjectName) => {
    const updatedSubjects = formData.subjects.map(subject => {
      if (subject.name === subjectName) {
        const updatedTopics = subject.topics.includes(topic)
          ? subject.topics.filter(t => t !== topic)
          : [...subject.topics, topic];
        return { ...subject, topics: updatedTopics };
      }
      return subject;
    });
    setFormData({ ...formData, subjects: updatedSubjects });
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
      setFormData({ ...formData, tags: [...formData.tags, currentTag.trim()] });
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleKeyPress = (e) => { // General key press handler
    if (e.key === 'Enter') {
      e.preventDefault();
      // Check if the active element is the main chat input
      if (e.target.classList.contains('main-chat-input')) {
        handleSendMessage();
      } 
      // Check if the active element is the tag input in the modal
      else if (e.target.closest('.tag-input-container')) { 
        handleAddTag();
      }
    }
  };

  const handleModalFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setModalTempFiles(files);
      setUploadSuccess(false);
      setUploadError('');
    }
  };

  const startMediaUpload = (target) => {
    setUploadingFor(target);
    setModalTempFiles([]);
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
    const filename = url.split('/').pop() || `url-${Date.now()}`;
    const mediaObject = { 
      type: 'url', 
      path: url, 
      filename, 
      originalname: filename, 
      mimetype: 'text/url', 
      size: 0 
    };

    if (uploadingFor === 'question') {
      setFormData(prev => ({ ...prev, questionMedia: [...prev.questionMedia, mediaObject] }));
    } else if (uploadingFor === 'explanation') {
      setFormData(prev => ({ ...prev, explanationMedia: [...prev.explanationMedia, mediaObject] }));
    } else if (typeof uploadingFor === 'number') {
      setFormData(prev => {
        const updatedOptionMedia = [...prev.optionMedia];
        updatedOptionMedia[uploadingFor] = [...updatedOptionMedia[uploadingFor], mediaObject];
        return { ...prev, optionMedia: updatedOptionMedia };
      });
    }
    setUploadSuccess(true); 
    setUrlInput('');
  };

  const handleUploadMedia = async () => { // For modal media
    if (!modalTempFiles.length) { 
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
      modalTempFiles.forEach(file => formDataObj.append('media', file));

      const response = await axios.post('/api/uploads/multiple', formDataObj, { 
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'multipart/form-data' 
        } 
      });

      if (response.data.success) {
        setUploadSuccess(true);
        const mediaObjects = response.data.data.map(file => {
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

        if (uploadingFor === 'question') {
          setFormData(prev => ({ ...prev, questionMedia: [...prev.questionMedia, ...mediaObjects] }));
        } else if (uploadingFor === 'explanation') {
          setFormData(prev => ({ ...prev, explanationMedia: [...prev.explanationMedia, ...mediaObjects] }));
        } else if (typeof uploadingFor === 'number') {
          setFormData(prev => {
            const updatedOptionMedia = [...prev.optionMedia];
            updatedOptionMedia[uploadingFor] = [...updatedOptionMedia[uploadingFor], ...mediaObjects];
            return { ...prev, optionMedia: updatedOptionMedia };
          });
        }
        setModalTempFiles([]);
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
      setFormData(prev => ({ 
        ...prev, 
        questionMedia: prev.questionMedia.filter((_, i) => i !== index) 
      }));
    } else if (target === 'explanation') {
      setFormData(prev => ({ 
        ...prev, 
        explanationMedia: prev.explanationMedia.filter((_, i) => i !== index) 
      }));
    } else if (typeof target === 'number') {
      setFormData(prev => {
        const updatedOptionMedia = [...prev.optionMedia];
        updatedOptionMedia[target] = updatedOptionMedia[target].filter((_, i) => i !== index);
        return { ...prev, optionMedia: updatedOptionMedia };
      });
    }

    if (uploadingFor === target) { 
      setModalTempFiles([]); 
      setUrlInput(''); 
      setUploadSuccess(false); 
      setUploadError(''); 
    }
  };

  const validateMediaObject = (media) => 
    media && 
    typeof media === 'object' && 
    media.filename && 
    media.originalname && 
    media.mimetype && 
    media.path && 
    (media.size !== undefined);

  const handleSubmitQuestion = async () => {
    if (!selectedQuestion) return;

    // Validations
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
    if (formData.subjects.length === 0) { 
      setErrorMessage('At least one subject is required'); 
      return; 
    }
    if (!formData.explanation.trim()) { 
      setErrorMessage('Explanation is required'); 
      return; 
    }
    
    // Media Validations
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
      setIsUploading(true); 
      setErrorMessage('');
      const token = localStorage.getItem('token');
      if (!token) { 
        setErrorMessage('Authentication required. Please log in again.'); 
        setIsUploading(false); 
        return; 
      }
      
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
        subjects: formData.subjects, 
        tags: formData.tags, 
        questionMedia: formData.questionMedia,
        explanationMedia: formData.explanationMedia, 
        sourceUrl: formData.sourceUrl
      };

      const response = await axios.post('/api/questions', submissionData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (response.data.success) {
        setSuccessMessage('Question added successfully!');
        const successMessageObj = { 
          id: Date.now(), 
          type: 'bot', 
          content: `✅ Question successfully added! Category: ${formData.category}, Subjects: ${formData.subjects.map(s => s.name).join(', ')}, Difficulty: ${formData.difficulty}` 
        };
        setMessages(prev => [...prev, successMessageObj]);
        setFormData({ 
          questionText: '', 
          explanation: '', 
          options: ['', ''], 
          correctAnswer: null, 
          difficulty: 'medium', 
          category: 'Basic Sciences', 
          subjects: [], 
          tags: [], 
          questionMedia: [], 
          explanationMedia: [], 
          optionMedia: Array(2).fill([]), 
          sourceUrl: '' 
        });
        setShowQuestionForm(false); 
        setSelectedQuestion(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else { 
        setErrorMessage(response.data.message || 'Failed to add question'); 
      }
    } catch (error) {
      console.error('Error creating question:', error);
      setErrorMessage(error.response?.data?.message || 'An error occurred while adding the question');
    } finally { 
      setIsUploading(false); 
    }
  };

  const removeFile = (index) => { // For main chat staged files
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const renderMediaButton = (target, media) => {
    const mediaArray = Array.isArray(media) ? media : [media].filter(Boolean);
    return (
      <div className="mt-2">
        {mediaArray.length > 0 && (
          <div className="space-y-2 mb-2">
            {mediaArray.map((mediaItem, index) => (
              <div 
                key={index} 
                className="flex items-center p-2 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-md text-sm"
              >
                <div className="flex items-center flex-1 overflow-hidden">
                  {mediaItem.type === 'image' ? (
                    <Image className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-300" /> 
                  ) : mediaItem.type === 'url' ? (
                    <Link className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-300" /> 
                  ) : (
                    <File className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-300" />
                  )}
                  <span className="truncate text-gray-800 dark:text-gray-200">
                    {mediaItem.originalname}
                  </span>
                </div>
                <button 
                  type="button" 
                  onClick={() => handleRemoveUploadedMedia(target, index)} 
                  className="ml-2 p-1 text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400" 
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
          className="flex items-center text-sm text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200"
        > 
          <Paperclip size={14} className="mr-1" /> Add Media or URL (Optional) 
        </button>
      </div>
    );
  };

  const getFileIcon = (file) => {
    if (!file || !file.type) {
      return <File className="w-6 h-6 mr-2 text-gray-500 dark:text-gray-300" />;
    }
    
    const type = file.type.split('/')[0];
    switch (type) {
      case 'image': 
        return <Image className="w-6 h-6 mr-2 text-blue-500 dark:text-blue-300" />;
      case 'video': 
        return <File className="w-6 h-6 mr-2 text-purple-500 dark:text-purple-300" />;
      case 'application': 
        if (file.type === 'application/pdf') {
          return <File className="w-6 h-6 mr-2 text-red-500 dark:text-red-300" />;
        }
        return <File className="w-6 h-6 mr-2 text-orange-500 dark:text-orange-300" />;
      default: 
        return <File className="w-6 h-6 mr-2 text-gray-500 dark:text-gray-300" />;
    }
  };

  // UI for the mode toggle
  const renderModeToggle = () => {
    return (
      <div className="p-2 bg-gray-100 dark:bg-gray-700 flex justify-center space-x-2">
        <button
          onClick={() => {
            setCurrentAIMode('generate');
            setActiveQuestionForExplanation(null); // Clear active question
            setMessages(prev => [...prev, {id: Date.now(), type: 'bot', content: "Switched to 'Generate Mode'. Upload documents or paste text to create new questions."}])
          }}
          className={`px-3 py-1 text-xs rounded ${currentAIMode === 'generate' ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          Generate Questions
        </button>
        <button
          onClick={() => {
            setCurrentAIMode('explain');
            // Don't clear activeQuestionForExplanation here, user might switch back and forth
             setMessages(prev => [...prev, {id: Date.now(), type: 'bot', content: "Switched to 'Explain Mode'. Click on a previously generated question in the chat to discuss it, then type your query."}])
          }}
          className={`px-3 py-1 text-xs rounded ${currentAIMode === 'explain' ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          Explain Answers
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-500 text-white p-4">
        <h2 className="text-xl font-bold flex items-center">
          <Bot className="mr-2" />
          AI Question Assistant
        </h2>
        <p className="text-blue-100 dark:text-blue-200 text-sm">
          {currentAIMode === 'generate'
            ? 'Upload documents or paste text to generate questions.'
            : 'Click a question below to discuss, then type your query.'}
        </p>
      </div>

      {/* AI Mode Toggle - Placed before chat messages for visibility */}
      {renderModeToggle()} 

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-700 border dark:border-gray-600 shadow-sm'
              }`}
            >
              <div className="flex items-start">
                {message.type === 'bot' && <Bot className="w-4 h-4 mr-2 mt-1 text-blue-600 dark:text-blue-300" />}
                {message.type === 'user' && <User className="w-4 h-4 mr-2 mt-1" />}
                <div className="flex-1">
                  {message.type === 'bot' ? (
          // Wrap ReactMarkdown in a div and apply classes to the div
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
            <ReactMarkdown
              // No className prop here directly
              children={message.content}
              remarkPlugins={[[remarkGfm]]} // Optional
              // components={{ ... }} // Custom components still work here
            />
          </div>
        ) : (
          <p className="text-sm text-gray-800 dark:text-gray-200 break-words">{message.content}</p>
        )}
                  {message.file && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/50 rounded flex items-center">
                      <File className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-300" />
                      <span className="text-xs text-gray-700 dark:text-gray-200">
                        {message.file.name}
                      </span>
                    </div>
                  )}
                  {message.questions && (
                    <div className="mt-3 space-y-2">
                      {message.questions.map((question) => (
                        <div
                          key={question.id}
                          className={`p-3 bg-gray-50 dark:bg-gray-800 rounded border dark:border-gray-600 
                                      ${currentAIMode === 'explain' ? 'cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-800/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                                      ${activeQuestionForExplanation?.id === question.id && currentAIMode === 'explain' ? 'ring-2 ring-yellow-500 dark:ring-yellow-400' : ''}`}
                          onClick={() => {
                            // In 'explain' mode, clicking the question selects it for discussion.
                            // In 'generate' mode, clicking the question (or its customize button) opens the form.
                            if (currentAIMode === 'explain') {
                              handleChatQuestionClick(question.id);
                            } else {
                              // If you want the whole block to be clickable to customize in generate mode:
                              // handleQuestionSelect(question);
                              // Or, rely solely on the "Click to customize" button below.
                              // For clarity, let's make it so only the button triggers customization in generate mode.
                              // If you want the whole block, uncomment the line above and potentially remove the button's specific onClick.
                            }
                          }}
                        >
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {question.questionText}
                          </p>
                          <div className="mt-2 space-y-1">
                            {question.options.map((option, idx) => (
                              <p
                                key={idx}
                                className={`text-xs ${
                                  idx === question.correctAnswer
                                    ? 'text-green-600 dark:text-green-400 font-medium'
                                    : 'text-gray-600 dark:text-gray-300'
                                }`}
                              >
                                {String.fromCharCode(65 + idx)}. {option}
                              </p>
                            ))}
                          </div>

                          {/* "Customize" button only shown in generate mode, or if you always want it */}
                          {/* For clarity, let's show it always but its action might be just opening the form */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the parent div's onClick if it also calls handleQuestionSelect
                              handleQuestionSelect(question);
                            }}
                            className="mt-2 text-xs text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200"
                          >
                            Customize & Add →
                          </button>

                          {currentAIMode === 'explain' && activeQuestionForExplanation?.id === question.id && (
                            <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400 font-semibold">(Selected for explanation)</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start mb-4">
            <div className="bg-white dark:bg-gray-700 border dark:border-gray-600 shadow-sm rounded-lg px-4 py-2">
              <div className="flex items-center">
                <Bot className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-300" />
                <Loader className="w-4 h-4 animate-spin mr-2 text-gray-600 dark:text-gray-300" />
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  {currentAIMode === 'generate' ? 'AI is generating questions...' : 'AI is preparing explanation...'}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Staged Files Display Area */}
      {uploadedFiles.length > 0 && currentAIMode === 'generate' && ( // Only show if in generate mode
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/50 border-t dark:border-gray-700">
          <p className="text-xs text-blue-800 dark:text-blue-300 mb-2">
            Files staged for sending:
          </p>
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center bg-white dark:bg-gray-700 px-2 py-1 rounded text-xs"
              >
                {getFileIcon(file)}
                <span className="max-w-20 truncate text-gray-700 dark:text-gray-200">
                  {file.name}
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-1 text-red-500 dark:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress} // Assuming handleKeyPress calls handleSendMessage on Enter
            placeholder={
              currentAIMode === 'generate'
                ? (uploadedFiles.length > 0 ? "Type instructions for uploaded files..." : "Paste concepts or type instructions...")
                : (activeQuestionForExplanation ? `Ask about "${activeQuestionForExplanation.questionText.substring(0,20)}..."` : "Select a question above to discuss...")
            }
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 main-chat-input"
            disabled={currentAIMode === 'explain' && !activeQuestionForExplanation && !isGenerating} // Disable if in explain mode but no question selected
          />
          <input
            type="file"
            ref={fileInputRef} // CRUCIAL
            onChange={handleFileUpload}
            multiple
            accept=".pdf,.doc,.docx,.txt,image/*"
            className="hidden"    // CRUCIAL - it should be hidden, not absent
          />
          {currentAIMode === 'generate' && ( // Only show upload button in generate mode
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-600 border border-gray-300 dark:border-gray-400 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-600"
              title="Upload documents"
            >
              <Upload className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleSendMessage}
            disabled={
              isGenerating ||
              (!inputText.trim() && (currentAIMode === 'generate' && uploadedFiles.length === 0)) ||
              (currentAIMode === 'explain' && (!activeQuestionForExplanation || !inputText.trim()))
            }
            className={`p-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg ${
              (isGenerating ||
              (!inputText.trim() && (currentAIMode === 'generate' && uploadedFiles.length === 0)) ||
              (currentAIMode === 'explain' && (!activeQuestionForExplanation || !inputText.trim())))
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-700 dark:hover:bg-blue-700'
            }`}
            title={currentAIMode === 'generate' ? "Send message and/or uploaded files" : "Ask for explanation"}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Question Customization Modal */}
      {showQuestionForm && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-white dark:bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-200">
              Customize and Add Question
            </h3>
            
            {successMessage && (
              <div className="mb-4 bg-green-100 dark:bg-green-900/50 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="mb-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                {errorMessage}
              </div>
            )}
            
            {/* Media Upload Sub-Modal */}
            {uploadingFor !== null && (
              <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-[60]">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    Add Media or URL {uploadingFor === 'question' ? 'for Question' : uploadingFor === 'explanation' ? 'for Explanation' : `for Option ${String.fromCharCode(65 + uploadingFor)}`}
                  </h3>
                  <div className="mb-4 flex space-x-4">
                    <label className="flex items-center text-gray-700 dark:text-gray-300">
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
                    <label className="flex items-center text-gray-700 dark:text-gray-300">
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
                    {mediaType === 'file' && !modalTempFiles.length ? (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
                        <Upload className="w-8 h-8 mb-3 text-gray-400 dark:text-gray-300" />
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-300">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-300">
                          Images, videos, PDFs (MAX. 10MB)
                        </p>
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={handleModalFileChange} 
                          accept="image/*,video/*,application/pdf" 
                          multiple 
                        />
                      </label>
                    ) : mediaType === 'file' && modalTempFiles.length > 0 ? (
                      <div className="space-y-2">
                        {modalTempFiles.map((file, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                          >
                            <div className="flex items-center overflow-hidden">
                              {getFileIcon(file)}
                              <span className="truncate max-w-xs text-gray-800 dark:text-gray-200">{file.name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-300 ml-2">
                                ({Math.round(file.size / 1024)} KB)
                              </span>
                            </div>
                            <div className="flex items-center">
                              {uploadSuccess && modalTempFiles.length === 0 && (
                                <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-300 mr-2" />
                              )} 
                              <button 
                                type="button" 
                                onClick={() => setModalTempFiles(prev => prev.filter((_, i) => i !== index))} 
                                className="p-1 text-gray-500 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : mediaType === 'url' ? (
                      <div className="flex flex-col space-y-2">
                        <input 
                          type="text" 
                          value={urlInput} 
                          onChange={(e) => setUrlInput(e.target.value)} 
                          placeholder="Paste URL (e.g., https://example.com/image.jpg)" 
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300" 
                        />
                        <button 
                          type="button" 
                          onClick={handleAddUrl} 
                          className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-400 flex items-center"
                        >
                          <Link size={16} className="mr-2" />
                          Add URL
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {uploadError && (
                    <div className="mb-4 text-sm text-red-600 dark:text-red-300">
                      {uploadError}
                    </div>
                  )}
                  {uploadSuccess && (
                    <div className="mb-4 text-sm text-green-600 dark:text-green-300 flex items-center">
                      <CheckCircle size={16} className="mr-1" />
                      {mediaType === 'file' && modalTempFiles.length === 0 
                        ? 'File(s) uploaded and added!' 
                        : mediaType === 'url' 
                        ? 'URL added successfully!' 
                        : 'Success!'}
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button 
                      type="button" 
                      onClick={() => { 
                        setUploadingFor(null); 
                        setModalTempFiles([]); 
                        setUrlInput(''); 
                        setMediaType('file'); 
                        setUploadSuccess(false); 
                        setUploadError(''); 
                      }} 
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    {mediaType === 'file' && modalTempFiles.length > 0 && ( 
                      <button 
                        type="button" 
                        onClick={handleUploadMedia} 
                        disabled={isUploading} 
                        className={`px-4 py-2 rounded flex items-center ${
                          isUploading 
                            ? 'bg-gray-400 dark:bg-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 text-white'
                        }`}
                      >
                        <Upload size={16} className="mr-2" />
                        {isUploading ? 'Uploading...' : 'Upload & Add'}
                      </button> 
                    )}
                    {(uploadSuccess || (mediaType === 'file' && modalTempFiles.length === 0 && !uploadError)) && !isUploading && (
                      <button 
                        type="button" 
                        onClick={() => setUploadingFor(null)} 
                        className="px-4 py-2 rounded bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-400 text-white"
                      >
                        Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <label 
                className="block text-gray-700 dark:text-gray-300 font-medium mb-2" 
                htmlFor="questionText"
              >
                Question Text*
              </label>
              <textarea 
                id="questionText" 
                name="questionText" 
                value={formData.questionText} 
                onChange={handleInputChange} 
                rows="3" 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300" 
                placeholder="Enter the question text here..." 
                required 
              />
              {renderMediaButton('question', formData.questionMedia)}
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 dark:text-gray-300 font-medium">
                  Options* (Select correct answer)
                </label>
                <button 
                  type="button" 
                  onClick={handleAddOption} 
                  className="flex items-center text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200"
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
                            ? 'bg-green-500 dark:bg-green-400 text-white' 
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>
                      <input 
                        type="text" 
                        value={option} 
                        onChange={(e) => handleOptionChange(index, e.target.value)} 
                        className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300" 
                        placeholder={`Option ${String.fromCharCode(65 + index)}`} 
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveOption(index)} 
                        className="ml-2 p-1 text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400" 
                        title="Remove option"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    {renderMediaButton(index, formData.optionMedia[index])}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label 
                className="block text-gray-700 dark:text-gray-300 font-medium mb-2" 
                htmlFor="explanation"
              >
                Explanation*
              </label>
              <textarea 
                id="explanation" 
                name="explanation" 
                value={formData.explanation} 
                onChange={handleInputChange} 
                rows="3" 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300" 
                placeholder="Explain the correct answer..." 
                required 
              />
              {renderMediaButton('explanation', formData.explanationMedia)}
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                Difficulty*
              </label>
              <div className="flex space-x-4">
                {['easy', 'medium', 'hard'].map((level) => (
                  <label 
                    key={level} 
                    className="flex items-center cursor-pointer text-gray-700 dark:text-gray-300"
                  >
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

            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                Category*
              </label>
              <div className="flex gap-2 flex-wrap">
                {Object.keys(subjectsByCategory).map(cat => (
                  <button 
                    key={cat} 
                    type="button" 
                    onClick={() => handleCategoryChange(cat)} 
                    className={`px-3 py-1 text-xs rounded ${
                      formData.category === cat 
                        ? 'bg-blue-500 dark:bg-blue-400 text-white' 
                        : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                Select Subjects*
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(subjectsByCategory[formData.category] || []).map((subject) => (
                  <button 
                    key={subject} 
                    type="button" 
                    onClick={() => handleSubjectToggle(subject)} 
                    className={`px-3 py-1 text-xs rounded ${
                      formData.subjects.some(s => s.name === subject) 
                        ? 'bg-green-500 dark:bg-green-400 text-white' 
                        : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            {formData.subjects.length > 0 && (
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Select Topics
                </label>
                {formData.subjects.map(subject => (
                  <div key={subject.name} className="mb-4">
                    <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {subject.name}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(topicsBySubject[subject.name] || []).map((topic) => (
                        <button 
                          type="button" 
                          key={topic} 
                          onClick={() => handleTopicToggle(topic, subject.name)} 
                          className={`py-2 px-4 rounded text-sm font-medium border ${
                            subject.topics.includes(topic) 
                              ? 'bg-green-500 dark:bg-green-400 text-white border-green-500 dark:border-green-400' 
                              : 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-800'
                          }`}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-6 tag-input-container">
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                Tags (Optional)
              </label>
              <div className="flex items-center mb-2">
                <input 
                  type="text" 
                  value={currentTag} 
                  onChange={(e) => setCurrentTag(e.target.value)} 
                  onKeyPress={handleKeyPress} 
                  className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300" 
                  placeholder="Add a tag and press Enter..." 
                />
                <button 
                  type="button" 
                  onClick={handleAddTag} 
                  className="ml-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-400"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <div 
                    key={index} 
                    className="flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                  >
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTag(tag)} 
                      className="ml-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label 
                className="block text-gray-700 dark:text-gray-300 font-medium mb-2" 
                htmlFor="sourceUrl"
              >
                Source URL (Optional)
              </label>
              <input 
                id="sourceUrl" 
                name="sourceUrl" 
                type="url" 
                value={formData.sourceUrl} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300" 
                placeholder="Enter source URL (e.g., https://example.com)" 
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => { 
                  setShowQuestionForm(false); 
                  setSelectedQuestion(null); 
                  setFormData({ 
                    questionText: '', 
                    explanation: '', 
                    options: ['', ''], 
                    correctAnswer: null, 
                    difficulty: 'medium', 
                    category: 'Basic Sciences', 
                    subjects: [], 
                    tags: [], 
                    questionMedia: [], 
                    explanationMedia: [], 
                    optionMedia: Array(2).fill([]), 
                    sourceUrl: '' 
                  }); 
                }} 
                className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSubmitQuestion} 
                disabled={isUploading} 
                className={`px-4 py-2 rounded text-white ${
                  isUploading 
                    ? 'bg-gray-400 dark:bg-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400'
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center">
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Adding...
                  </div>
                ) : (
                  'Add Question'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIQuestionAssistant;