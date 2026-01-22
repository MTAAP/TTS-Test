import { useEffect, useRef, useState } from 'react';
import type { AudioFormat } from '../types';
import { base64ToBlob } from '../utils/api';
import styles from './AudioPlayer.module.css';

interface Props {
  audioData: string | null;
  format: AudioFormat | null;
}

function getMimeType(format: AudioFormat | null): string {
  const mimeTypes: Record<string, string> = {
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    opus: 'audio/opus',
    flac: 'audio/flac',
  };
  return mimeTypes[format || 'wav'] || 'audio/wav';
}

export function AudioPlayer({ audioData, format }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (audioData && format) {
      const mimeType = getMimeType(format);
      const blob = base64ToBlob(audioData, mimeType);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setAudioUrl(null);
    }
  }, [audioData, format]);

  const handleDownload = () => {
    if (!audioUrl || !format) return;

    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `tts-output-${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!audioData || !audioUrl) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>
          No audio generated yet
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>Generated Audio</span>
        <button onClick={handleDownload} className={styles.downloadButton}>
          Download ({format?.toUpperCase()})
        </button>
      </div>
      <audio
        ref={audioRef}
        src={audioUrl}
        controls
        className={styles.audio}
      />
    </div>
  );
}
