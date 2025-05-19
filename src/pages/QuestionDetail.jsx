import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../api/axiosConfig';

function QuestionDetail() {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await axios.get(`/questions/${id}`);
        if (res.data.success) {
          setQuestion(res.data.data);
        } 
      } catch (error) {
        console.error('Error fetching question detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!question) return <div className="p-6 text-center text-red-500">Question not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">{question.text}</h2>

        <div className="mb-4">
          <p className="text-gray-700 font-semibold">Options:</p>
          <ul className="list-disc list-inside text-gray-600 mt-2">
            {question.options.map((opt, index) => (
              <li key={index} className={index === question.correctAnswer ? 'font-bold text-green-600' : ''}>
                {opt}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 font-semibold">Explanation:</p>
          <p className="text-gray-600 mt-1">{question.explanation}</p>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 font-semibold">Tags:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {question.tags.map((tag, idx) => (
              <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-0.5 text-xs rounded">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <p className="text-gray-700 mb-2">
          <strong>Difficulty:</strong> {question.difficulty}
        </p>
        <p className="text-gray-700 mb-6">
          <strong>Author:</strong> {question.createdBy?.name || 'Unknown'}
        </p>

        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default QuestionDetail;
