import React, { useEffect, useState } from 'react';

const Preloader = () => {
  const preloaderStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: '100vw',
    backgroundColor: '#131b2a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    zIndex: 9999,
  };

  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleLoad = () => {
      setLoading(false);
    };

    // Check if already loaded (helps on fast refresh)
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => window.removeEventListener('load', handleLoad);
  }, []);

  return (
    <div id="preloader" style={preloaderStyle}>
      <span className="svg-wrapper" style={{ marginBottom: '10px' }}>
        <svg x="0px" y="0px" height="100" viewBox="0 0 298 53.9">
          <style>
            {`
              path {
                stroke-dasharray: 150, 200;
                stroke-dashoffset: 0;
                animation: lakat 4s infinite linear;
                stroke: #6366f1; /* Updated stroke color */
              }
              @keyframes lakat {
                0% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: 1050; }
              }
            `}
          </style>
          <path strokeWidth="1px" fill="none" className="st0" d="M297.5,41.2h-76.6c-0.5,0-0.9,0.4-1,0.8l-1.6,11.3l-3.1-32c0-0.5-0.4-0.9-0.9-0.9
          c-0.5,0-0.9,0.3-1,0.8l-5.3,25.5l-2.3-10.9c-0.1-0.4-0.4-0.7-0.9-0.8c-0.4,0-0.8,0.2-1,0.6l-2.3,4.8h-107c0,0,0,0,0,0H82
          c-1.6,0-2.2,1.1-2.2,1.6l-1.6,11.3l-3.1-52c0-0.5-0.4-0.9-0.9-0.9c-0.5,0-0.9,0.3-1,0.8l-9.3,45.5l-2.3-10.9
          c-0.1-0.4-0.4-0.7-0.9-0.8c-0.4,0-0.8,0.2-1,0.6l-2.3,4.8H0.5"/>
        </svg>
      </span>
      <i style={{ color: '#ffffff' }}>Loading{dots}</i>
    </div>
  );
};

export default Preloader;
