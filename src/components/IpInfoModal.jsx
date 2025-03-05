import React from 'react';

function IpInfoModal({ ipInfo, isOpen, onClose }) {
  if (!isOpen || !ipInfo) return null;

  return (
    <div 
      className="modal"
      onClick={onClose}
    >
      <div 
        className="modal-overlay"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">IP Address Information</h3>
            <button 
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-full p-1"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col">
              <div className="text-sm font-medium text-gray-500">IP Address</div>
              <div className="mt-1 text-sm text-gray-900">{ipInfo.ip || 'Unknown'}</div>
            </div>
            
            {ipInfo.hostname && (
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-500">Hostname</div>
                <div className="mt-1 text-sm text-gray-900">{ipInfo.hostname}</div>
              </div>
            )}
            
            {(ipInfo.city || ipInfo.region) && (
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-500">Location</div>
                <div className="mt-1 text-sm text-gray-900">
                  {ipInfo.city || ''} {ipInfo.region ? (ipInfo.city ? ', ' + ipInfo.region : ipInfo.region) : ''}
                </div>
              </div>
            )}
            
            {ipInfo.country && (
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-500">Country</div>
                <div className="mt-1 text-sm text-gray-900">{ipInfo.country}</div>
              </div>
            )}
            
            {ipInfo.postal && (
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-500">Postal Code</div>
                <div className="mt-1 text-sm text-gray-900">{ipInfo.postal}</div>
              </div>
            )}
            
            {ipInfo.loc && (
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-500">Coordinates</div>
                <div className="mt-1 text-sm text-gray-900">{ipInfo.loc}</div>
              </div>
            )}
            
            {ipInfo.org && (
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-500">ISP/Organization</div>
                <div className="mt-1 text-sm text-gray-900">{ipInfo.org}</div>
              </div>
            )}
            
            {ipInfo.timezone && (
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-500">Timezone</div>
                <div className="mt-1 text-sm text-gray-900">{ipInfo.timezone}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default IpInfoModal; 