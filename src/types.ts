export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  category: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
}

export type FocusSound = 'rain' | 'drone' | 'keyboard' | 'none';

export interface FocusPreset {
  id: string;
  name: string;
  duration: number; // in minutes
  description: string;
  soundEffect: FocusSound;
}
