import React, { useState } from 'react';
import { Comment } from '../types';

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
  disabled?: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({ comments, onAddComment, disabled = false }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && !disabled) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-xl font-bold text-gray-300 mb-4 border-b border-gray-700 pb-2">Listener Comments</h3>
      <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-900 p-3 rounded-lg">
              <p className="text-sm text-gray-400">{comment.text}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={disabled ? "Commenting disabled" : "Add a comment..."}
          disabled={disabled}
          className="flex-grow bg-gray-900 border border-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-white disabled:bg-gray-800 disabled:cursor-not-allowed"
        />
        <button 
          type="submit" 
          disabled={disabled}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
