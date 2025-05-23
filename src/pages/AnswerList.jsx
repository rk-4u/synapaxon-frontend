import React, { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';

const BACKEND_BASE_URL = axios.defaults.baseURL; // your backend base URL for media files

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
  if (error) return <p style={{color: 'red'}}>Error: {error}</p>;

  return (
    <div>
      {questions.map((q, idx) => (
        <div key={q._id} style={{ marginBottom: 40, borderBottom: '1px solid #ccc', paddingBottom: 20 }}>
          <h3>Q{idx + 1}: {q.questionText}</h3>

          {/* Question-level media */}
          {q.questionMedia && (
            <MediaDisplay media={q.questionMedia} />
          )}

          <div>
            <h4>Options:</h4>
            <ul>
              {q.options.map((option, i) => (
                <li key={i} style={{ marginBottom: 10 }}>
                  <strong>{option.text}</strong>
                  {option.media && <MediaDisplay media={option.media} />}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Explanation:</h4>
            <p>{q.explanation}</p>
            {q.explanationMedia && <MediaDisplay media={q.explanationMedia} />}
          </div>
        </div>
      ))}
    </div>
  );
}

// Component to display media based on mimetype (image/video)
function MediaDisplay({ media }) {
  if (!media || !media.path) return null;

  const url = BACKEND_BASE_URL + media.path;

  if (media.mimetype.startsWith('image/')) {
    return <img src={url} alt={media.originalname} style={{ maxWidth: '300px', display: 'block', marginTop: 10 }} />;
  }

  if (media.mimetype.startsWith('video/')) {
    return (
      <video
        controls
        src={url}
        style={{ maxWidth: '400px', display: 'block', marginTop: 10 }}
      />
    );
  }

  // fallback for other media types (audio, pdf, etc.)
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {media.originalname || 'Download media'}
    </a>
  );
}
