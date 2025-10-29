export enum Genre {
  Funny = 'Funny',
  Scary = 'Scary',
  Ridiculous = 'Ridiculous',
  Annoying = 'Annoying',
  Heartwarming = 'Heartwarming',
  UserSubmitted = 'My Stories',
}

export enum ModerationResult {
  CLEAN = 'CLEAN',
  WARN = 'WARN',
  BLOCK = 'BLOCK',
}

export interface Call {
  id: string;
  title: string;
  description: string;
  transcript: string;
  genre: Genre;
  callerDescription: string; // e.g., "Young Male", "Panicked Female"
  operatorGender: 'Male' | 'Female';
  comments: Comment[];
  audioData?: string; // base64 encoded audio
}

export interface Comment {
  id: string;
  author: string;
  text: string;
}
