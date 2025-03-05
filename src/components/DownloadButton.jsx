import React from 'react';

function DownloadButton({ onClick }) {
  return (
    <button 
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      onClick={onClick}
    >
      <svg className="w-4 h-4 mr-2" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 12L3 7H6V1H10V7H13L8 12Z" fill="currentColor"/>
        <path d="M14 14H2V10H4V12H12V10H14V14Z" fill="currentColor"/>
      </svg>
      Download CSV
    </button>
  );
}

export default DownloadButton; 