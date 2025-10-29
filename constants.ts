import { Genre } from './types';

export const GENRES: Genre[] = [
  Genre.Funny,
  Genre.Scary,
  Genre.Ridiculous,
  Genre.Annoying,
  Genre.Heartwarming,
];

// All available voices categorized by gender.
// These can be used for either the Operator or the Caller to increase variety.
export const MALE_VOICES = ['Puck', 'Charon', 'Fenrir'];
export const FEMALE_VOICES = ['Kore', 'Zephyr'];
