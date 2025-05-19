// src/pages/TestHistory.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function TestHistory() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTestHistory() {
      try {
        const response = await axios.get('/api/tests/history');
        setTests(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load test history');
      } finally {
        setLoading(false);
      }
    }
    
    fetchTestHistory();
  }, []);

  if (loading) {
    return <p>Loading test history...</p>;
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
      <h2>Test History</h2>
      
      {tests.length === 0 ? (
        <p>You haven't taken any tests yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Tags</th>
              <th>Difficulty</th>
              <th>Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tests.map(test => (
              <tr key={test.id}>
                <td>{new Date(test.completedAt).toLocaleString()}</td>
                <td>{test.tags.join(', ')}</td>
                <td>{test.difficulty}</td>
                <td>{test.score}/{test.total} ({Math.round((test.score / test.total) * 100)}%)</td>
                <td>
                  <Link to={`/test/${test.id}`}>View Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <Link to="/dashboard">Back to Dashboard</Link>
    </div>
  );
}

export default TestHistory;
