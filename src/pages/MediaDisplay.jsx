import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axiosConfig';
import { X } from 'lucide-react';

const BACKEND_BASE_URL = axios.defaults.baseURL;

export default function MediaDisplay({ media, label }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0 });
  const [error, setError] = useState(null);
  const modalRef = useRef(null);
  const contentRef = useRef(null);

  if (!media || (!media.path && !media.url)) return null;

  const url = media.path ? `${BACKEND_BASE_URL}${media.path}` : media.url;

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setPosition({ x: window.innerWidth / 4, y: window.innerHeight / 4 });
    setSize({ width: 800, height: 600 });
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsDragging(false);
    setIsResizing(false);
    setError(null);
  };

  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      handleCloseModal();
    }
  };

  const handleMouseDown = (e) => {
    if (contentRef.current?.contains(e.target) || e.target.closest('button') || e.target.closest('.resize-handle')) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
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
        setPosition({ x: Math.max(0, Math.min(newX, maxX)), y: Math.max(0, Math.min(newY, maxY)) });
      }
    } else if (isResizing) {
      const newWidth = Math.max(300, resizeStart.width + (e.clientX - dragStart.x));
      const newHeight = Math.max(200, resizeStart.height + (e.clientY - dragStart.y));
      setSize({ width: newWidth, height: newHeight });
      const modal = modalRef.current;
      if (modal) {
        const maxX = window.innerWidth - newWidth;
        const maxY = window.innerHeight - newHeight;
        setPosition({ x: Math.max(0, Math.min(position.x, maxX)), y: Math.max(0, Math.min(position.y, maxY)) });
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

  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen, isDragging, isResizing, dragStart, position, resizeStart]);

  const renderMedia = () => {
    try {
      if (media.mimetype?.startsWith('image/')) {
        return <img src={url} alt={media.originalname || 'Image'} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={() => setError('Failed to load image')} />;
      } else if (media.mimetype?.startsWith('video/')) {
        return <video controls src={url} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={() => setError('Failed to load video')} />;
      } else if (media.mimetype === 'text/url' || media.url) {
        return <iframe src={url} title={media.originalname || 'Web Content'} style={{ width: '100%', height: '100%', border: 'none' }} sandbox="allow-scripts allow-same-origin" onError={() => setError('Failed to load URL')} />;
      } else {
        return <a href={url} download className="text-blue-600 hover:underline">{media.originalname || 'Download Media'}</a>;
      }
    } catch (err) {
      setError('Error rendering media');
      return null;
    }
  };

  return (
    <>
      <button onClick={handleOpenModal} className="text-blue-600 hover:underline text-sm ml-2">
        {label || 'View Media'}
      </button>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
          >
            <div className="w-full p-2 bg-gray-200 flex justify-between items-center">
              <span>{media.originalname || media.url || 'Media'}</span>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700" aria-label="Close media viewer">
                <X size={20} />
              </button>
            </div>
            <div ref={contentRef} className="p-4 flex justify-center items-center" style={{ flex: 1, width: '100%' }} onMouseDown={(e) => e.stopPropagation()}>
              {error ? <p className="text-red-500">{error}</p> : renderMedia()}
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-gray-400 cursor-se-resize resize-handle" onMouseDown={handleResizeMouseDown} aria-label="Resize media viewer" />
          </div>
        </div>
      )}
    </>
  );
}