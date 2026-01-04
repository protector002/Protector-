export enum Screen {
  LOCK = 'LOCK',
  HOME = 'HOME',
  CHAT = 'CHAT',
  TEXT_CHAT = 'TEXT_CHAT',
  VIDEO_CHAT = 'VIDEO_CHAT'
}

export interface AudioContextState {
  inputCtx?: AudioContext;
  outputCtx?: AudioContext;
}

export interface LiveConnectionState {
  isConnected: boolean;
  isSpeaking: boolean; // Model is speaking
  isListening: boolean; // Mic is active
  error: string | null;
}