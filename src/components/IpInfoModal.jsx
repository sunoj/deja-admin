import React from 'react';

function IpInfoModal({ ipInfo, isOpen, onClose }) {
  if (!isOpen || !ipInfo) return null;

  return (
    <div className="ip-info-modal active" onClick={onClose}>
      <div className="ip-info-modal-content" onClick={e => e.stopPropagation()}>
        <div className="ip-info-modal-header">
          <h3 className="ip-info-modal-title">IP Address Information</h3>
          <button className="ip-info-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="ip-info-modal-body">
          <div className="ip-info-item">
            <div className="ip-info-label">IP Address</div>
            <div className="ip-info-value">{ipInfo.ip || 'Unknown'}</div>
          </div>
          
          {ipInfo.hostname && (
            <div className="ip-info-item">
              <div className="ip-info-label">Hostname</div>
              <div className="ip-info-value">{ipInfo.hostname}</div>
            </div>
          )}
          
          {(ipInfo.city || ipInfo.region) && (
            <div className="ip-info-item">
              <div className="ip-info-label">Location</div>
              <div className="ip-info-value">
                {ipInfo.city || ''} {ipInfo.region ? (ipInfo.city ? ', ' + ipInfo.region : ipInfo.region) : ''}
              </div>
            </div>
          )}
          
          {ipInfo.country && (
            <div className="ip-info-item">
              <div className="ip-info-label">Country</div>
              <div className="ip-info-value">{ipInfo.country}</div>
            </div>
          )}
          
          {ipInfo.postal && (
            <div className="ip-info-item">
              <div className="ip-info-label">Postal Code</div>
              <div className="ip-info-value">{ipInfo.postal}</div>
            </div>
          )}
          
          {ipInfo.loc && (
            <div className="ip-info-item">
              <div className="ip-info-label">Coordinates</div>
              <div className="ip-info-value">{ipInfo.loc}</div>
            </div>
          )}
          
          {ipInfo.org && (
            <div className="ip-info-item">
              <div className="ip-info-label">ISP/Organization</div>
              <div className="ip-info-value">{ipInfo.org}</div>
            </div>
          )}
          
          {ipInfo.timezone && (
            <div className="ip-info-item">
              <div className="ip-info-label">Timezone</div>
              <div className="ip-info-value">{ipInfo.timezone}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IpInfoModal; 