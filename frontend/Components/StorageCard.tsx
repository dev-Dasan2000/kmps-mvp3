import React, { useState, useEffect } from 'react';
import { X, HardDrive, FileType, File, FilePlus2 } from 'lucide-react';

interface StorageData {
  dcmSize: string;
  pdfSize: string;
  docxSize: string;
  othersSize: string;
  totalgb: string;
  freegb: string;
  usedgb: string;
}

const StorageCard = () => {
  const [storageData, setStorageData] = useState<StorageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  
  const fetchStorageData = async () => {
    setIsLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(`${backendUrl}/files/storage`);
      if (!response.ok) {
        throw new Error('Failed to fetch storage data');
      }
      const data = await response.json();
      setStorageData(data);
      setError('');
    } catch (err) {
      console.error('Error fetching storage data:', err);
      setError('Failed to load storage data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, []);

  // Calculate percentage if data is available
  const usedStorage = storageData ? parseFloat(storageData.usedgb) : 0;
  const totalStorage = storageData ? parseFloat(storageData.totalgb) : 1; // Avoid division by zero
  const percentage = Math.round((usedStorage / totalStorage) * 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <>
      <div 
        className="bg-white rounded-lg p-6 shadow-sm flex items-center gap-4 justify-between cursor-pointer hover:shadow-md transition-shadow duration-200" 
        onClick={() => setShowOverlay(true)}
      >
        {isLoading ? (
          <div className="w-full flex flex-col items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-sm text-gray-500">Loading storage data...</p>
          </div>
        ) : error ? (
          <div className="w-full text-center text-red-500 py-4">
            <p>{error}</p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                fetchStorageData();
              }}
              className="mt-2 text-sm text-blue-500 hover:text-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 relative">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-gray-700">{percentage}%</div>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Total Storage Used</div>
              <div className="text-3xl font-bold text-gray-900">{percentage}%</div>
              <div className="text-xs text-gray-500">{usedStorage} GB of {totalStorage} GB</div>
            </div>
          </>
        )}
      </div>

      {/* Overlay */}
      {showOverlay && storageData && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <HardDrive className="w-5 h-5 mr-2" /> Storage Statistics
              </h2>
              <button 
                onClick={() => setShowOverlay(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Disk Usage</span>
                  <span className="text-sm font-bold text-gray-800">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Used: {storageData.usedgb} GB</span>
                  <span>Free: {storageData.freegb} GB</span>
                  <span>Total: {storageData.totalgb} GB</span>
                </div>
              </div>
              
              <h3 className="text-md font-medium text-gray-700 mb-4">File Type Breakdown</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <FileType className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">DICOM Files</p>
                      <p className="text-xs text-gray-500">.dcm</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{storageData.dcmSize} MB</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                      <File className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">PDF Documents</p>
                      <p className="text-xs text-gray-500">.pdf</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{storageData.pdfSize} MB</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <FilePlus2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Word Documents</p>
                      <p className="text-xs text-gray-500">.docx</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{storageData.docxSize} MB</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                      <File className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Other Files</p>
                      <p className="text-xs text-gray-500">Various formats</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{storageData.othersSize} MB</span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <button 
                  onClick={() => {
                    fetchStorageData();
                    setShowOverlay(false);
                  }}
                  className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StorageCard;