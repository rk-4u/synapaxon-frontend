// src/pages/TestResult.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function TestResult() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTestResult() {
      try {
        const response = await axios.get(`/api/tests/${id}`);
        setResult(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load test result');
      } finally {
        setLoading(false);
      }
    }
    
    fetchTestResult();
  }, [id]);

  if (loading) {
    return <p>Loading test result...</p>;
  }

  if (error) {
    return (
      <div>
        <p style={{ color: 'red' }}>{error}</p>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Test Result</h2>
      
      <div>
        <h3>Summary</h3>
        <p>Date: {new Date(result.completedAt).toLocaleString()}</p>
        <p>Score: {result.score}/{result.questions.length}</p>
        <p>Percentage: {Math.round((result.score / result.questions.length) * 100)}%</p>
      </div>
      
      <div>
        <h3>Detailed Results</h3>
        
        {result.questions.map((question, index) => (
          <div key={index} style={{ marginBottom: '20px' }}>
            <p><strong>Q{index + 1}:</strong> {question.text}</p>
            
            <div>
              {question.options.map((option, optIndex) => (
                <div key={optIndex} style={{
                  color: optIndex === question.correctAnswer ? 'green' : 
                         optIndex === result.answers[index] && optIndex !== question.correctAnswer ? 'red' : 'black'
                }}>
                  {option} 
                  {optIndex === question.correctAnswer && ' ✓'}
                  {optIndex === result.answers[index] && optIndex !== question.correctAnswer && ' ✗'}
                </div>
              ))}
            </div>
            
            <p><strong>Explanation:</strong> {question.explanation}</p>
          </div>
        ))}
      </div>
      
      <Link to="/history">Back to History</Link>
      <Link to="/dashboard">Back to Dashboard</Link>
    </div>
  );
}

export default TestResult;