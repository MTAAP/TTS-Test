import { useState } from 'react';
import type { Model, Voice } from '../types';
import styles from './ModelSelector.module.css';

const MODELS: Array<{ value: Model; label: string }> = [
  { value: 'openai/gpt-audio-mini', label: 'GPT Audio Mini' },
  { value: 'openai/gpt-4o-audio-preview', label: 'GPT-4o Audio Preview' },
];

const VOICES: Array<{ value: Voice; label: string }> = [
  { value: 'alloy', label: 'Alloy' },
  { value: 'echo', label: 'Echo' },
  { value: 'shimmer', label: 'Shimmer' },
  { value: 'coral', label: 'Coral' },
  { value: 'sage', label: 'Sage' },
  { value: 'verse', label: 'Verse' },
];

interface Props {
  model: Model;
  voice: Voice;
  onModelChange: (model: Model) => void;
  onVoiceChange: (voice: Voice) => void;
  disabled?: boolean;
}

export function ModelSelector({
  model,
  voice,
  onModelChange,
  onVoiceChange,
  disabled,
}: Props) {
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [customModel, setCustomModel] = useState('');

  const handleModelChange = (value: string) => {
    if (value === 'custom') {
      setUseCustomModel(true);
      if (customModel) {
        onModelChange(customModel);
      }
    } else {
      setUseCustomModel(false);
      onModelChange(value as Model);
    }
  };

  const handleCustomModelChange = (value: string) => {
    setCustomModel(value);
    onModelChange(value);
  };

  return (
    <div className={styles.container}>
      <div className={styles.field}>
        <label className={styles.label}>Model</label>
        <select
          value={useCustomModel ? 'custom' : model}
          onChange={(e) => handleModelChange(e.target.value)}
          className={styles.select}
          disabled={disabled}
        >
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
          <option value="custom">Custom Model</option>
        </select>
        {useCustomModel && (
          <input
            type="text"
            value={customModel}
            onChange={(e) => handleCustomModelChange(e.target.value)}
            placeholder="e.g., openai/tts-1"
            className={styles.customInput}
            disabled={disabled}
          />
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Voice</label>
        <select
          value={voice}
          onChange={(e) => onVoiceChange(e.target.value as Voice)}
          className={styles.select}
          disabled={disabled}
        >
          {VOICES.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Output Format</label>
        <div className={styles.formatNote}>WAV (streaming only supports PCM16)</div>
      </div>
    </div>
  );
}
