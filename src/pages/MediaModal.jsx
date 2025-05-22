import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const MediaModal = ({ isOpen, onClose, media }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setError(null);
    setLoading(true);
    setRetryCount(0);
  }, [isOpen, media]);

  if (!isOpen || !media) return null;

  // Validate media object
  if (!media.path || !media.mimetype) {
    console.error('Invalid media object:', media);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-lg p-4 max-w-4xl w-full max-h-[90vh] overflow-auto relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
          <div className="text-center text-red-600">
            <p>Invalid media data. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  const { mimetype, path, originalname } = media;

  const baseUrl = 'https://synapaxon-backend.onrender.com';
  const mediaUrl = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  console.log(`[${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}] MediaModal - Media Details:`, { mimetype, path, mediaUrl, originalname });

  const handleError = (e) => {
    console.error('Media loading error:', e);
    setError('Failed to load media. The file may be unavailable or corrupted.');
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
  };

  const renderMedia = () => {
    if (loading && !error) {
      return (
        <div className="text-center text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500 mx-auto mb-2"></div>
          <p>Loading media...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={handleRetry}
            className="text-blue-600 underline mt-2 inline-block mr-4"
          >
            Retry ({retryCount}/3)
          </button>
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline mt-2 inline-block"
          >
            Try downloading the file: {originalname || 'media file'}
          </a>
        </div>
      );
    }

    if (mimetype.startsWith('image/')) {
      return (
        <img
          src={`${mediaUrl}?retry=${retryCount}`}
          alt={originalname || 'Media'}
          className="max-w-full max-h-[80vh] object-contain"
          onError={handleError}
          onLoad={handleLoad}
        />
      );
    } else if (mimetype.startsWith('video/')) {
      return (
        <video
          controls
          className="max-w-full max-h-[80vh]"
          onError={handleError}
          onLoadedData={handleLoad}
        >
          <source src={`${mediaUrl}?retry=${retryCount}`} type={mimetype} />
          Your browser does not support the video tag.
        </video>
      );
    } else if (mimetype === 'application/pdf') {
      return (
        <iframe
          src={`${mediaUrl}?retry=${retryCount}`}
          title="PDF Media"
          className="w-full h-[80vh]"
          onError={handleError}
          onLoad={handleLoad}
        />
      );
    } else {
      setLoading(false);
      return (
        <div className="text-center">
          <p className="text-gray-600 mb-2">Media type not supported for direct preview.</p>
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Download {originalname || 'media file'}
          </a>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg p-4 max-w-4xl w-full max-h-[90vh] overflow-auto relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        <div className="flex justify-center">
          {renderMedia()}
        </div>
      </div>
    </div>
  );
};

export default MediaModal;