import React from 'react';
import { ErrorMessageProps } from '../types/components';

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative shadow-sm" role="alert">
      <span className="block sm:inline">{message}</span>
    </div>
  );
};

export default ErrorMessage; 