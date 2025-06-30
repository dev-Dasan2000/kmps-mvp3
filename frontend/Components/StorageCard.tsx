import React from 'react';

const StorageCard = ({ usedStorage = 6.5, totalStorage = 10 }) => {
  const percentage = Math.round((usedStorage / totalStorage) * 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm flex items-center gap-4 justify-between">
      <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
        <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 100 100">
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
        <div className="absolute text-sm font-bold text-gray-700">{percentage}%</div>
      </div>
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-sm font-medium text-gray-600 mb-1">Total Storage Used</div>
        <div className="text-3xl font-bold text-gray-900">{percentage}%</div>
        <div className="text-xs text-gray-500">{usedStorage} GB of {totalStorage} GB</div>
      </div>
    </div>
  );
};

export default StorageCard;