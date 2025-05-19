// src/pages/Landing.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page">
      <h1>Synapaxon</h1>
      <h2>Medical Quiz Platform</h2>
      <p>Test your medical knowledge with our comprehensive quiz system.</p>
      
      {isAuthenticated ? (
        <div>
          <Link to="/dashboard">Go to Dashboard</Link>
        </div>
      ) : (
        <div>
          <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
        </div>
      )}
    </div>
  );
}

export default Landing;