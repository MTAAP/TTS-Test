import type { TTSRequest, TTSResponse, ConversionStats } from '../types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// PCM16 audio settings from OpenAI
const PCM_SAMPLE_RATE = 24000;
const PCM_CHANNELS = 1;
const PCM_BITS_PER_SAMPLE = 16;

// Pricing per million tokens (approximate, may vary)
const PRICING: Record<string, { input: number; output: number; audio?: number }> = {
  'openai/gpt-audio-mini': { input: 0.15, output: 0.6, audio: 0.1 },
  'openai/gpt-4o-audio-preview': { input: 2.5, output: 10, audio: 0.1 },
};

export interface ConvertResult {
  response: TTSResponse;
  stats: ConversionStats;
}

interface StreamDelta {
  role?: string;
  content?: string;
  audio?: {
    id?: string;
    data?: string;
    transcript?: string;
  };
}

interface StreamChunk {
  id?: string;
  choices?: Array<{
    index: number;
    delta: StreamDelta;
    finish_reason?: string | null;
  }>;
  usage?: TTSResponse['usage'];
}

export async function convertToSpeech(
  apiKey: string,
  request: TTSRequest
): Promise<ConvertResult> {
  const startTime = performance.now();

  // Streaming requires pcm16 format - we'll convert to WAV for playback
  const body = {
    model: request.model,
    modalities: ['text', 'audio'],
    stream: true,
    audio: {
      voice: request.voice,
      format: 'pcm16', // Only pcm16 is supported for streaming
    },
    messages: [
      {
        role: 'user',
        content: request.text,
      },
    ],
  };

  const fetchResponse = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'TTS Test App',
    },
    body: JSON.stringify(body),
  });

  const requestLatency = performance.now() - startTime;

  if (!fetchResponse.ok) {
    const errorText = await fetchResponse.text();
    console.error('API Error Response:', errorText);
    let errorMessage: string;
    try {
      const errorJson = JSON.parse(errorText);
      // Try to extract the actual error message from nested structure
      const rawMetadata = errorJson.error?.metadata?.raw;
      if (rawMetadata) {
        try {
          const rawError = JSON.parse(rawMetadata);
          errorMessage = rawError.error?.message || rawMetadata;
        } catch {
          errorMessage = rawMetadata;
        }
      } else {
        errorMessage = errorJson.error?.message || errorJson.message || JSON.stringify(errorJson, null, 2);
      }
    } catch {
      errorMessage = errorText;
    }
    throw new Error(`API Error (${fetchResponse.status}): ${errorMessage}`);
  }

  // Parse the streaming response
  const { audioData: pcmBase64, audioId, transcript, usage } = await parseStreamingResponse(fetchResponse);

  const totalTime = performance.now() - startTime;

  if (!pcmBase64) {
    throw new Error('No audio data in response. The model may not support audio output.');
  }

  // Convert PCM16 to WAV for browser playback
  const wavBase64 = pcm16ToWav(pcmBase64);

  // Build the response object - store as WAV format since we converted it
  const response: TTSResponse = {
    id: audioId || 'stream',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: null,
        audio: {
          data: wavBase64,
          format: 'wav', // We converted to WAV
          id: audioId || 'stream',
          transcript: transcript || '',
        },
      },
      finish_reason: 'stop',
    }],
    usage,
  };

  // Calculate audio duration from WAV data
  const audioDuration = await calculateAudioDuration(wavBase64, 'wav');

  // Calculate stats
  const stats = calculateStats(request, response, requestLatency, totalTime, audioDuration);

  return { response, stats };
}

async function parseStreamingResponse(response: Response): Promise<{
  audioData: string | null;
  audioId: string | null;
  transcript: string;
  usage?: TTSResponse['usage'];
}> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  const audioDataChunks: string[] = [];
  let audioId: string | null = null;
  let transcript = '';
  let usage: TTSResponse['usage'] | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete lines
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine === 'data: [DONE]') {
        continue;
      }

      if (trimmedLine.startsWith('data: ')) {
        const jsonStr = trimmedLine.slice(6);
        try {
          const chunk: StreamChunk = JSON.parse(jsonStr);

          // Extract audio data from delta
          const delta = chunk.choices?.[0]?.delta;
          if (delta?.audio) {
            if (delta.audio.id) {
              audioId = delta.audio.id;
            }
            if (delta.audio.data) {
              audioDataChunks.push(delta.audio.data);
            }
            if (delta.audio.transcript) {
              transcript += delta.audio.transcript;
            }
          }

          // Capture usage from the final chunk
          if (chunk.usage) {
            usage = chunk.usage;
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }
  }

  return {
    audioData: audioDataChunks.length > 0 ? audioDataChunks.join('') : null,
    audioId,
    transcript,
    usage,
  };
}

/**
 * Convert PCM16 base64 audio to WAV base64
 * PCM16 is raw 16-bit signed integer samples at 24kHz mono
 */
function pcm16ToWav(pcmBase64: string): string {
  // Decode base64 to bytes
  const pcmBytes = Uint8Array.from(atob(pcmBase64), c => c.charCodeAt(0));

  // Create WAV header
  const wavHeader = createWavHeader(pcmBytes.length);

  // Combine header and PCM data
  const wavBytes = new Uint8Array(wavHeader.length + pcmBytes.length);
  wavBytes.set(wavHeader, 0);
  wavBytes.set(pcmBytes, wavHeader.length);

  // Convert back to base64
  let binary = '';
  for (let i = 0; i < wavBytes.length; i++) {
    binary += String.fromCharCode(wavBytes[i]);
  }
  return btoa(binary);
}

/**
 * Create a WAV file header for PCM16 audio
 */
function createWavHeader(dataLength: number): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const byteRate = PCM_SAMPLE_RATE * PCM_CHANNELS * (PCM_BITS_PER_SAMPLE / 8);
  const blockAlign = PCM_CHANNELS * (PCM_BITS_PER_SAMPLE / 8);

  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true); // File size - 8
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Sub-chunk size (16 for PCM)
  view.setUint16(20, 1, true); // Audio format (1 = PCM)
  view.setUint16(22, PCM_CHANNELS, true); // Number of channels
  view.setUint32(24, PCM_SAMPLE_RATE, true); // Sample rate
  view.setUint32(28, byteRate, true); // Byte rate
  view.setUint16(32, blockAlign, true); // Block align
  view.setUint16(34, PCM_BITS_PER_SAMPLE, true); // Bits per sample

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true); // Data size

  return new Uint8Array(header);
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

async function calculateAudioDuration(base64Data: string, format: string): Promise<number | null> {
  try {
    const mimeType = getMimeType(format);
    const audioBlob = base64ToBlob(base64Data, mimeType);
    const audioUrl = URL.createObjectURL(audioBlob);

    return new Promise((resolve) => {
      const audio = new Audio();
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(audioUrl);
        resolve(audio.duration);
      });
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(audioUrl);
        resolve(null);
      });
      audio.src = audioUrl;
    });
  } catch {
    return null;
  }
}

function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    opus: 'audio/opus',
    flac: 'audio/flac',
  };
  return mimeTypes[format] || 'audio/wav';
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

function calculateStats(
  request: TTSRequest,
  response: TTSResponse,
  requestLatency: number,
  totalTime: number,
  audioDuration: number | null
): ConversionStats {
  const inputCharacters = request.text.length;
  const promptTokens = response.usage?.prompt_tokens ?? null;
  const completionTokens = response.usage?.completion_tokens ?? null;
  const audioTokens = response.usage?.completion_tokens_details?.audio_tokens ?? null;

  const charactersPerSecond = audioDuration
    ? inputCharacters / audioDuration
    : null;

  const costEstimate = calculateCost(request.model, response.usage);

  return {
    requestLatency: Math.round(requestLatency),
    totalTime: Math.round(totalTime),
    inputCharacters,
    promptTokens,
    completionTokens,
    audioTokens,
    audioDuration,
    charactersPerSecond,
    costEstimate,
  };
}

function calculateCost(
  model: string,
  usage?: TTSResponse['usage']
): number | null {
  if (!usage) return null;

  const pricing = PRICING[model];
  if (!pricing) return null;

  const inputCost = (usage.prompt_tokens / 1_000_000) * pricing.input;
  const outputCost = (usage.completion_tokens / 1_000_000) * pricing.output;
  const audioCost = pricing.audio && usage.completion_tokens_details?.audio_tokens
    ? (usage.completion_tokens_details.audio_tokens / 1_000_000) * pricing.audio
    : 0;

  return inputCost + outputCost + audioCost;
}
