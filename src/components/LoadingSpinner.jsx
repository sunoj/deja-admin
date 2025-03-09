import React from 'react';

const LoadingSpinner = ({ size = 'md', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const spinnerClass = `animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 ${sizeClasses[size]}`;
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className={spinnerClass} />
      </div>
    );
  }

  return <div className={spinnerClass} />;
};

export default LoadingSpinner; 