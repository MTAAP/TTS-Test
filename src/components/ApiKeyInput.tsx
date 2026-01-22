import { useState } from 'react';
import styles from './ApiKeyInput.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function ApiKeyInput({ value, onChange }: Props) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        OpenRouter API Key
        {value && <span className={styles.indicator}>Set</span>}
      </label>
      <div className={styles.inputWrapper}>
        <input
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="sk-or-..."
          className={styles.input}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className={styles.toggleButton}
          aria-label={showKey ? 'Hide API key' : 'Show API key'}
        >
          {showKey ? 'Hide' : 'Show'}
        </button>
      </div>
      <p className={styles.hint}>
        Your API key is stored in memory only and will be cleared when you close this tab.
      </p>
    </div>
  );
}
