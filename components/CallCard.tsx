import React from 'react';
import { Call } from '../types';
import { PlayIcon, LoadingSpinner } from './icons';

interface CallCardProps {
    call: Call;
    onSelect: (call: Call) => void;
    isSelected: boolean;
    isGeneratingAudio: boolean;
}

const CallCard: React.FC<CallCardProps> = ({ call, onSelect, isSelected, isGeneratingAudio }) => {
    return (
        <div
            onClick={() => onSelect(call)}
            className={`cursor-pointer bg-gray-800 p-4 rounded-lg border-2 transition-all duration-300 ${
                isSelected ? 'border-red-500 scale-105 shadow-lg shadow-red-500/20' : 'border-gray-700 hover:border-red-500 hover:scale-102'
            }`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-red-400">{call.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{call.description}</p>
                </div>
                <div className="bg-red-500/20 text-red-400 rounded-full p-2 flex items-center justify-center h-9 w-9">
                    {isGeneratingAudio ? <LoadingSpinner className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                </div>
            </div>
        </div>
    );
};

export default CallCard;