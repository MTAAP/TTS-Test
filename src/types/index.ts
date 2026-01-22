export type Voice = 'alloy' | 'echo' | 'shimmer' | 'coral' | 'sage' | 'verse';

export type AudioFormat = 'wav' | 'mp3' | 'opus' | 'flac';

export type Model = 'openai/gpt-audio-mini' | 'openai/gpt-4o-audio-preview' | string;

export interface TTSRequest {
  model: Model;
  voice: Voice;
  format: AudioFormat;
  text: string;
}

export interface AudioData {
  data: string; // base64-encoded audio
  format: AudioFormat;
  id: string;
  transcript: string;
}

export interface TTSResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | null;
      audio?: AudioData;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details?: {
      cached_tokens?: number;
      audio_tokens?: number;
      text_tokens?: number;
    };
    completion_tokens_details?: {
      reasoning_tokens?: number;
      audio_tokens?: number;
      text_tokens?: number;
    };
  };
}

export interface ConversionStats {
  requestLatency: number; // ms
  totalTime: number; // ms
  inputCharacters: number;
  promptTokens: number | null;
  completionTokens: number | null;
  audioTokens: number | null;
  audioDuration: number | null; // seconds
  charactersPerSecond: number | null;
  costEstimate: number | null; // USD
}

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  inputPreview: string;
  fullText: string;
  model: Model;
  voice: Voice;
  format: AudioFormat;
  latency: number;
  audioDuration: number | null;
  audioData: string; // base64
  stats: ConversionStats;
}

export interface TTSState {
  isLoading: boolean;
  error: string | null;
  audioData: string | null; // base64
  audioFormat: AudioFormat | null;
  stats: ConversionStats | null;
  history: HistoryEntry[];
}
