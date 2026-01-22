import { useState, useCallback } from 'react';
import type { TTSRequest, TTSState, HistoryEntry, AudioFormat } from '../types';
import { convertToSpeech } from '../utils/api';

export function useTTS() {
  const [state, setState] = useState<TTSState>({
    isLoading: false,
    error: null,
    audioData: null,
    audioFormat: null,
    stats: null,
    history: [],
  });

  const convert = useCallback(async (apiKey: string, request: TTSRequest) => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const { response, stats } = await convertToSpeech(apiKey, request);
      const audioData = response.choices[0].message.audio!;

      const historyEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        inputPreview: request.text.slice(0, 50) + (request.text.length > 50 ? '...' : ''),
        fullText: request.text,
        model: request.model,
        voice: request.voice,
        format: request.format,
        latency: stats.requestLatency,
        audioDuration: stats.audioDuration,
        audioData: audioData.data,
        stats,
      };

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: null,
        audioData: audioData.data,
        audioFormat: request.format,
        stats,
        history: [historyEntry, ...prev.history],
      }));

      return { success: true as const, stats };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        audioData: null,
        audioFormat: null,
        stats: null,
      }));
      return { success: false as const, error: errorMessage };
    }
  }, []);

  const playFromHistory = useCallback((entry: HistoryEntry) => {
    setState((prev) => ({
      ...prev,
      audioData: entry.audioData,
      audioFormat: entry.format,
      stats: entry.stats,
      error: null,
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      history: [],
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  const setAudioData = useCallback((audioData: string | null, format: AudioFormat | null) => {
    setState((prev) => ({
      ...prev,
      audioData,
      audioFormat: format,
    }));
  }, []);

  return {
    ...state,
    convert,
    playFromHistory,
    clearHistory,
    clearError,
    setAudioData,
  };
}
