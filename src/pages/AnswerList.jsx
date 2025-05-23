import React, { useEffect, useState, useRef } from 'react';
import axios from '../api/axiosConfig';

const BACKEND_BASE_URL = axios.defaults.baseURL;

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
          {q.questionMedia && (
            <MediaDisplay media={q.questionMedia} label="View Question Media" />
          )}
          <div>
            <h4>Options:</h4>
            <ul>
              {q.options.map((option, i) => (
                <li key={i} style={{ marginBottom: 10 }}>
                  <strong>{option.text}</strong>
                  {option.media && <MediaDisplay media={option.media} label={`View Option ${String.fromCharCode(65 + i)} Media`} />}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Explanation:</h4>
            <p>{q.explanation}</p>
            {q.explanationMedia && <MediaDisplay media={q.explanationMedia} label="View Explanation Media" />}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MediaDisplay({ media, label }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0 });
  const modalRef = useRef(null);
  const contentRef = useRef(null);

  if (!media || (!media.path && !media.url)) return null;

  const url = media.path ? BACKEND_BASE_URL + media.path : media.url;

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setPosition({ x: window.innerWidth / 4, y: window.innerHeight / 4 });
    setSize({ width: 800, height: 600 });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      handleCloseModal();
    }
  };

  const handleMouseDown = (e) => {
    // Prevent dragging if clicking on content, close button, or resize handle
    if (
      contentRef.current?.contains(e.target) ||
      e.target.closest('button') ||
      e.target.closest('.resize-handle')
    ) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      const modal = modalRef.current;
      if (modal) {
        const { width, height } = modal.getBoundingClientRect();
        const maxX = window.innerWidth - width;
        const maxY = window.innerHeight - height;
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    } else if (isResizing) {
      const newWidth = Math.max(300, resizeStart.width + (e.clientX - dragStart.x));
      const newHeight = Math.max(200, resizeStart.height + (e.clientY - dragStart.y));
      setSize({ width: newWidth, height: newHeight });
      const modal = modalRef.current;
      if (modal) {
        const maxX = window.innerWidth - newWidth;
        const maxY = window.innerHeight - newHeight;
        setPosition({
          x: Math.max(0, Math.min(position.x, maxX)),
          y: Math.max(0, Math.min(position.y, maxY)),
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setResizeStart({ width: size.width, height: size.height });
  };

  const handleTouchStart = (e) => {
    if (
      contentRef.current?.contains(e.target) ||
      e.target.closest('button') ||
      e.target.closest('.resize-handle')
    ) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    const modal = modalRef.current;
    if (modal) {
      const { width, height } = modal.getBoundingClientRect();
      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - height;
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen, isDragging, isResizing, dragStart, position, resizeStart]);

  const renderMedia = () => {
    if (media.url) {
      return (
        <iframe
          src={url}
          title={media.originalname || 'Web Content'}
          style={{ width: '100%', height: '100%', border: 'none' }}
          sandbox="allow-scripts allow-same-origin"
        />
      );
    }

    if (media.mimetype?.startsWith('image/')) {
      return (
        <img
          src={url}
          alt={media.originalname}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          onLoad={(e) => {
            const img = e.target;
            if (modalRef.current) {
              const { naturalWidth, naturalHeight } = img;
              const newWidth = Math.min(naturalWidth, size.width);
              const newHeight = Math.min(naturalHeight, size.height);
              setSize({ width: newWidth, height: newHeight });
            }
          }}
          onError={() => { /* Handled by ErrorBoundary */ }}
        />
      );
    }

    if (media.mimetype?.startsWith('video/')) {
      return (
        <video
          controls
          src={url}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          onLoadedMetadata={(e) => {
            const video = e.target;
            if (modalRef.current) {
              const { videoWidth, videoHeight } = video;
              const newWidth = Math.min(videoWidth, size.width);
              const newHeight = Math.min(videoHeight, size.height);
              setSize({ width: newWidth, height: newHeight });
            }
          }}
          onError={() => { /* Handled by ErrorBoundary */ }}
        />
      );
    }

    if (media.mimetype?.startsWith('application/pdf')) {
      return (
        <iframe
          src={url}
          title={media.originalname || 'PDF Document'}
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      );
    }

    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {media.originalname || 'Download media'}
      </a>
    );
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="text-blue-600 hover:underline ml-2 text-sm"
      >
        {label || 'View Media'}
      </button>
      {isModalOpen && (
        <ErrorBoundary>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            style={{ display: 'flex' }}
          >
            <div
              ref={modalRef}
              className="bg-white rounded-lg p-4 relative cursor-move"
              style={{
                width: `${size.width}px`,
                height: `${size.height}px`,
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transform: `translate(${position.x}px, ${position.y}px)`,
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              <div className="w-full p-2 bg-gray-200 flex justify-between items-center">
                <span>{media.originalname || media.url || 'Media'}</span>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close media viewer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div
                ref={contentRef}
                className="p-4 flex justify-center"
                style={{ flex: 1, width: '100%' }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                {renderMedia()}
              </div>
              <div
                className="absolute bottom-0 right-0 w-4 h-4 bg-gray-400 cursor-se-resize resize-handle"
                onMouseDown={handleResizeMouseDown}
                onTouchStart={handleResizeMouseDown}
                aria-label="Resize media viewer"
              />
            </div>
          </div>
        </ErrorBoundary>
      )}
    </>
  );
}