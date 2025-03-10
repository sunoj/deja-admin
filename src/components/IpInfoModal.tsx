import React, { useEffect, useState } from 'react';
import { IpInfoModalProps } from '../types/components';

interface IpDetails {
  country: string;
  city: string;
  region: string;
  timezone: string;
  isp: string;
}

const IpInfoModal: React.FC<IpInfoModalProps> = ({ ipInfo, isOpen, onClose }) => {
  const [ipDetails, setIpDetails] = useState<IpDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIpDetails = async () => {
      if (!ipInfo?.ip) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://ipapi.co/${ipInfo.ip}/json/`);
        if (!response.ok) {
          throw new Error('Failed to fetch IP details');
        }
        const data = await response.json();
        setIpDetails({
          country: data.country_name,
          city: data.city,
          region: data.region,
          timezone: data.timezone,
          isp: data.org
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch IP details');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && ipInfo?.ip) {
      fetchIpDetails();
    }
  }, [isOpen, ipInfo?.ip]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">IP Information</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">IP Address</h3>
            <p className="mt-1 text-sm text-gray-900">{ipInfo?.ip}</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-sm">{error}</div>
          ) : ipDetails ? (
            <>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {ipDetails.city}, {ipDetails.region}, {ipDetails.country}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Timezone</h3>
                <p className="mt-1 text-sm text-gray-900">{ipDetails.timezone}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">ISP</h3>
                <p className="mt-1 text-sm text-gray-900">{ipDetails.isp}</p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default IpInfoModal; 