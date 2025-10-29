
import React from 'react';

interface AgeGateProps {
  onConfirm: () => void;
}

const AgeGate: React.FC<AgeGateProps> = ({ onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-800 border border-red-500 rounded-lg p-8 max-w-md text-center shadow-2xl shadow-red-500/20">
        <h2 className="text-3xl font-bold text-red-500 mb-4">Warning: Mature Content</h2>
        <p className="text-gray-300 mb-6">
          This channel contains fictional content depicting emergency situations, which may be disturbing or inappropriate for some audiences, including those under 18. Viewer discretion is advised.
        </p>
        <button
          onClick={onConfirm}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          I am 18 or older and wish to proceed
        </button>
      </div>
    </div>
  );
};

export default AgeGate;
