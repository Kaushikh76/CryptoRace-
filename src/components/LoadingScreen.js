import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-cyan-300">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4 animate-pulse">Loading Crypto Race 2077</h2>
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;