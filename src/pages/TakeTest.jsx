// src/pages/TakeTest.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function TakeTest() {
  // Test setup states
  const [tags, setTags] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Test taking states
  const [testStarted, setTestStarted] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  const navigate = useNavigate();

  const startTest = async () => {
    setError('');
    setLoading(true);
    
    try {
      const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
      
      const response = await axios.post('/api/tests/start', {
        tags: tagsArray,
        difficulty: difficulty || undefined,
        count: parseInt(count)
      });
      
      setCurrentTest(response.data);
      setQuestions(response.data.questions);
      setAnswers(new Array(response.data.questions.length).fill(-1));
      setCurrentQuestionIndex(0);
      setTestStarted(true);
      setTestCompleted(false);
      setTestResult(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start test');
    } finally {
      setLoading(false);
    }
  };

  const answerQuestion = (optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitTest = async () => {
    if (answers.includes(-1)) {
      if (!window.confirm('Some questions are unanswered. Submit anyway?')) {
        return;
      }
    }
    
    setLoading(true);
    try {
      const response = await axios.post('/api/tests/submit', {
        testId: currentTest.id,
        answers
      });
      
      setTestCompleted(true);
      setTestResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit test');
    } finally {
      setLoading(false);
    }
  };

  const viewResult = () => {
    navigate(`/test/${testResult.id}`);
  };

  // Test setup screen
  if (!testStarted) {
    return (
      <div>
        <h2>Take a Test</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        <form onSubmit={(e) => { e.preventDefault(); startTest(); }}>
          <div>
            <label>Tags (comma separated, optional)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. cardiology, anatomy"
            />
          </div>
          
          <div>
            <label>Difficulty (optional)</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="">Any</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          
          <div>
            <label>Number of Questions</label>
            <input
              type="number"
              min="1"
              max="50"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Start Test'}
          </button>
        </form>
        
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  // Test results screen
  if (testCompleted) {
    return (
      <div>
        <h2>Test Completed!</h2>
        <p>Score: {testResult.score}/{testResult.total}</p>
        <button onClick={viewResult}>View Detailed Results</button>
        <button onClick={() => setTestStarted(false)}>Take Another Test</button>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  // Test taking screen
  const currentQuestion = questions[currentQuestionIndex];
  return (
    <div>
      <h2>Question {currentQuestionIndex + 1} of {questions.length}</h2>
      
      <div>
        <p>{currentQuestion.text}</p>
        
        <div>
          {currentQuestion.options.map((option, index) => (
            <div key={index}>
              <input
                type="radio"
                name={`question_${currentQuestionIndex}`}
                checked={answers[currentQuestionIndex] === index}
                onChange={() => answerQuestion(index)}
              />
              <label>{option}</label>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <button onClick={prevQuestion} disabled={currentQuestionIndex === 0}>
          Previous
        </button>
        
        <button 
          onClick={nextQuestion} 
          disabled={currentQuestionIndex === questions.length - 1}
        >
          Next
        </button>
        
        <button onClick={submitTest} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Test'}
        </button>
      </div>
      
      <div>
        Progress: {answers.filter(a => a !== -1).length}/{questions.length} answered
      </div>
    </div>
  );
}

export default TakeTest;