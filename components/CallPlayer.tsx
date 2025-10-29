import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Call } from '../types';
import { generateCallAudio, decodeAudioData } from '../services/geminiService';
import CommentSection from './CommentSection';
import { PlayIcon, PauseIcon, LoadingSpinner } from './icons';

interface CallPlayerProps {
  call: Call | null;
  onAddComment: (callId: string, text: string) => void;
  updateCallWithAudio: (callId: string, audioData: string) => void;
  isMuted: boolean;
}

const CallPlayer: React.FC<CallPlayerProps> = ({ call, onAddComment, updateCallWithAudio, isMuted }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    // Cleanup on component unmount or when call changes
    return () => {
      stopAudio();
    };
  }, [call, stopAudio]);

  const playAudio = useCallback(async (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    stopAudio(); // Stop any currently playing audio
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => {
      setIsPlaying(false);
      audioSourceRef.current = null;
    };
    source.start();
    audioSourceRef.current = source;
    setIsPlaying(true);
  }, [stopAudio]);

  const handlePlayPause = async () => {
    if (!call) return;

    if (!audioContextRef.current) {
        // @ts-ignore
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Resume audio context if suspended
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      stopAudio();
      return;
    }

    setError(null);

    if (audioBufferRef.current) {
      playAudio(audioBufferRef.current);
    } else {
      setIsGenerating(true);
      try {
        const audioData = call.audioData || await generateCallAudio(call.transcript, call.callerDescription, call.operatorGender);
        if (!call.audioData) {
          updateCallWithAudio(call.id, audioData);
        }
        const buffer = await decodeAudioData(audioData, audioContextRef.current);
        audioBufferRef.current = buffer;
        playAudio(buffer);
      } catch (e) {
        setError("Could not generate or play audio. Please try again.");
        console.error(e);
      } finally {
        setIsGenerating(false);
      }
    }
  };
  
  // Effect to reset audio buffer when call changes
  useEffect(() => {
    audioBufferRef.current = null;
    if (isPlaying) {
      stopAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call]);

  if (!call) {
    return (
      <div className="flex-1 bg-gray-800/50 rounded-lg p-8 flex items-center justify-center border-2 border-dashed border-gray-700">
        <p className="text-gray-400">Select a call from the list to listen</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-800 rounded-lg p-6 md:p-8 flex flex-col">
      <div className="flex-grow">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handlePlayPause}
            disabled={isGenerating}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white p-4 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {isGenerating ? <LoadingSpinner className="w-8 h-8"/> : isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">{call.title}</h2>
            <p className="text-md text-gray-400">{call.description}</p>
          </div>
        </div>

        {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md my-4">{error}</p>}

        <h3 className="text-xl font-bold text-gray-300 mt-6 mb-2">Transcript</h3>
        <div className="bg-black/30 p-4 rounded-lg max-h-64 overflow-y-auto text-gray-300 whitespace-pre-wrap leading-relaxed">
          {call.transcript}
        </div>
        
        <CommentSection comments={call.comments} onAddComment={(text) => onAddComment(call.id, text)} disabled={isMuted} />
      </div>
    </div>
  );
};

export default CallPlayer;
