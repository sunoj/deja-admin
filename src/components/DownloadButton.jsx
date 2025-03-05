import React from 'react';

function DownloadButton({ onClick }) {
  return (
    <button className="download-btn" onClick={onClick}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 12L3 7H6V1H10V7H13L8 12Z" fill="currentColor"/>
        <path d="M14 14H2V10H4V12H12V10H14V14Z" fill="currentColor"/>
      </svg>
      Download CSV
    </button>
  );
}

export default DownloadButton; 