import React, { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';
import MediaDisplay from './MediaDisplay';

function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [children]);

  if (hasError) {
    return <p>Error loading media. Please try again.</p>;
  }

  return (
    <React.Fragment>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          onError: () => setHasError(true),
        })
      )}
    </React.Fragment>
  );
}

export default function QuestionsList() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await axios.get('/api/questions');
        if (res.data.success) {
          setQuestions(res.data.data);
        } else {
          setError('Failed to load questions');
        }
      } catch (err) {
        setError(err.message || 'Error fetching questions');
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, []);

  if (loading) return <p>Loading questions...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      {questions.map((q, idx) => (
        <div key={q._id} style={{ marginBottom: 40, borderBottom: '1px solid #ccc', paddingBottom: 20 }}>
          <h3>Q{idx + 1}: {q.questionText}</h3>
          {q.questionMedia && q.questionMedia.length > 0 && (
            <ErrorBoundary>
              <MediaDisplay media={q.questionMedia[0]} label="View Question Media" />
            </ErrorBoundary>
          )}
          <div>
            <h4>Options:</h4>
            <ul>
              {q.options.map((option, i) => (
                <li key={i} style={{ marginBottom: 10 }}>
                  <strong>{option.text}</strong>
                  {option.media && option.media.length > 0 && (
                    <ErrorBoundary>
                      <MediaDisplay media={option.media[0]} label={`View Option ${String.fromCharCode(65 + i)} Media`} />
                    </ErrorBoundary>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Explanation:</h4>
            <p>{q.explanation}</p>
            {q.explanationMedia && q.explanationMedia.length > 0 && (
              <ErrorBoundary>
                <MediaDisplay media={q.explanationMedia[0]} label="View Explanation Media" />
              </ErrorBoundary>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}