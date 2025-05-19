// src/pages/CreateQuestion.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function CreateQuestion() {
  const [text, setText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [tags, setTags] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validate inputs
    if (options.some(option => option.trim() === '')) {
      setError('All options must be filled out');
      setLoading(false);
      return;
    }
    
    try {
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      await axios.post('/api/questions', {
        text,
        options,
        correctAnswer: parseInt(correctAnswer),
        explanation,
        tags: tagsArray,
        difficulty
      });
      
      alert('Question created successfully!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create New Question</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Question Text</label>
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label>Options</label>
          {options.map((option, index) => (
            <div key={index}>
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                required
              />
              <input
                type="radio"
                name="correctAnswer"
                value={index}
                checked={correctAnswer === index}
                onChange={() => setCorrectAnswer(index)}
              /> Correct
            </div>
          ))}
        </div>
        
        <div>
          <label>Explanation</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label>Tags (comma separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. cardiology, anatomy, diagnosis"
            required
          />
        </div>
        
        <div>
          <label>Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            required
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Question'}
        </button>
      </form>
      
      <Link to="/dashboard">Back to Dashboard</Link>
    </div>
  );
}

export default CreateQuestion;
