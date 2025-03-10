import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/base.css';

// Make sure we're in a browser environment before trying to render
if (typeof document !== 'undefined') {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Failed to find the root element');
  }
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} 