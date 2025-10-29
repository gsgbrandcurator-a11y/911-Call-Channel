import React, { useState, useEffect, useCallback } from 'react';
import { Genre, Call, ModerationResult } from './types';
import { GENRES } from './constants';
import { generateCallStories, generateCallAudio } from './services/geminiService';
import { moderateComment } from './services/agentService';
import AgeGate from './components/AgeGate';
import CallPlayer from './components/CallPlayer';
import UserSubmissionModal from './components/UserSubmissionModal';
import CallCard from './components/CallCard';
import { PlusIcon, LoadingSpinner } from './components/icons';

const WARNING_LIMIT = 3;

const App: React.FC = () => {
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [calls, setCalls] = useState<Call[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre>(Genre.Funny);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  
  // AI Agent State: Comment Moderation
  const [warningCount, setWarningCount] = useState<number>(() => {
    const savedWarnings = localStorage.getItem('911-warning-count');
    return savedWarnings ? parseInt(savedWarnings, 10) : 0;
  });
  const [isMuted, setIsMuted] = useState(() => warningCount >= WARNING_LIMIT);

  useEffect(() => {
    localStorage.setItem('911-warning-count', warningCount.toString());
    if (warningCount >= WARNING_LIMIT) {
      setIsMuted(true);
    }
  }, [warningCount]);

  const filteredCalls = calls.filter(c => c.genre === selectedGenre);

  const updateCallWithAudio = useCallback((callId: string, audioData: string) => {
      setCalls(prevCalls =>
          prevCalls.map(call =>
              call.id === callId ? { ...call, audioData } : call
          )
      );
  }, []);

  const fetchCalls = useCallback(async (genre: Genre) => {
    if (genre === Genre.UserSubmitted) {
        setSelectedCall(null);
        return;
    }
    // Only fetch if this genre hasn't been fetched before
    const existingCalls = calls.some(c => c.genre === genre);
    if (existingCalls) {
        return;
    }

    setIsLoading(true);
    setError(null);
    setSelectedCall(null);
    try {
      const newStories = await generateCallStories(genre);
      const newCalls: Call[] = newStories.map(story => ({
        ...story,
        id: `${genre}-${Date.now()}-${Math.random()}`,
        genre: genre,
        comments: [],
      }));
      setCalls(prev => [...prev, ...newCalls]);
    } catch (e) {
      setError(`Failed to load stories for ${genre}. Please try another genre or refresh the page.`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [calls]);

  useEffect(() => {
    if (isAgeVerified) {
      fetchCalls(selectedGenre);
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGenre, isAgeVerified]);

  // AI Agent: Proactively prepares audio for all calls in the selected genre for instant playback
  useEffect(() => {
    const callsToProcess = calls.filter(c => c.genre === selectedGenre && !c.audioData);

    if (callsToProcess.length > 0) {
      callsToProcess.forEach(call => {
        generateCallAudio(call.transcript, call.callerDescription, call.operatorGender)
          .then(audioData => {
            updateCallWithAudio(call.id, audioData);
          })
          .catch(err => {
            console.error(`AI Agent failed to pre-fetch audio for "${call.title}":`, err);
          });
      });
    }
  }, [calls, selectedGenre, updateCallWithAudio]);


  const handleAddComment = async (callId: string, text: string) => {
    if (isMuted) return;

    const moderationResult = await moderateComment(text);

    if (moderationResult === ModerationResult.BLOCK) {
      alert("Your comment was blocked due to inappropriate content. You are now muted.");
      setWarningCount(WARNING_LIMIT);
      return;
    }

    if (moderationResult === ModerationResult.WARN) {
      const newWarningCount = warningCount + 1;
      setWarningCount(newWarningCount);
      alert(`Warning ${newWarningCount}/${WARNING_LIMIT}: Please keep comments respectful.`);
      if (newWarningCount >= WARNING_LIMIT) {
        alert("You have reached the warning limit and are now muted.");
        return;
      }
    }

    const newComment = { id: Date.now().toString(), author: 'Listener', text };
    setCalls(prevCalls =>
      prevCalls.map(call =>
        call.id === callId
          ? { ...call, comments: [...call.comments, newComment] }
          : call
      )
    );
    if (selectedCall && selectedCall.id === callId) {
        setSelectedCall(prev => prev ? ({...prev, comments: [...prev.comments, newComment]}) : null);
    }
  };

  const handleUserSubmit = (title: string, description: string, transcript: string) => {
    const newCall: Call = {
      id: `user-${Date.now()}`,
      title,
      description,
      transcript,
      genre: Genre.UserSubmitted,
      comments: [],
      callerDescription: 'User',
      operatorGender: Math.random() < 0.5 ? 'Male' : 'Female', // Randomize operator gender for user stories
    };
    setCalls(prev => [newCall, ...prev]);
    setSelectedGenre(Genre.UserSubmitted);
    setSelectedCall(newCall);
  };

  if (!isAgeVerified) {
    return <AgeGate onConfirm={() => setIsAgeVerified(true)} />;
  }
  
  const allGenres = [...GENRES, Genre.UserSubmitted];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8 flex flex-col">
       {isSubmissionModalOpen && <UserSubmissionModal onClose={() => setIsSubmissionModalOpen(false)} onSubmit={handleUserSubmit} />}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center text-red-500 tracking-wider">
          911<span className="text-gray-400"> Calls Channel</span>
        </h1>
        <p className="text-center text-gray-500 mt-1">Real emergencies. Adapted for entertainment.</p>
      </header>
      
      <div className="mb-6">
        <div className="flex flex-wrap justify-center gap-2">
          {allGenres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 text-sm font-bold rounded-full transition-colors duration-300 ${
                selectedGenre === genre
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
      
      <main className="flex-grow flex flex-col-reverse md:flex-row gap-8">
        <div className="w-full md:w-1/3 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{selectedGenre} Calls</h2>
                {selectedGenre === Genre.UserSubmitted && (
                    <button onClick={() => setIsSubmissionModalOpen(true)} className="flex items-center gap-2 bg-red-600/20 text-red-400 hover:bg-red-600/40 px-3 py-2 rounded-md text-sm transition-colors">
                        <PlusIcon className="w-4 h-4" />
                        Add Story
                    </button>
                )}
            </div>
          <div className="flex-grow bg-black/20 p-4 rounded-lg overflow-y-auto space-y-3">
            {isLoading ? (
                <div className="flex justify-center items-center h-full">
                    <LoadingSpinner className="w-10 h-10 text-red-500" />
                </div>
            ) : error ? (
                <div className="text-center text-red-400 p-4 bg-red-900/50 rounded-md">{error}</div>
            ) : filteredCalls.length > 0 ? (
                filteredCalls.map(call => (
                    <CallCard 
                      key={call.id} 
                      call={call} 
                      onSelect={setSelectedCall} 
                      isSelected={selectedCall?.id === call.id} 
                      isGeneratingAudio={!call.audioData}
                    />
                ))
            ) : (
                <div className="text-center text-gray-500 pt-10">
                    {selectedGenre === Genre.UserSubmitted ? "You haven't added any stories yet." : `No calls found for ${selectedGenre}.`}
                </div>
            )}
          </div>
        </div>
        
        <div className="w-full md:w-2/3 flex">
            <CallPlayer call={selectedCall} onAddComment={handleAddComment} updateCallWithAudio={updateCallWithAudio} isMuted={isMuted} />
        </div>
      </main>
    </div>
  );
};

export default App;
