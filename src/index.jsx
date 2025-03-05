import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/base.css';

// Make sure we're in a browser environment before trying to render
if (typeof document !== 'undefined') {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} 