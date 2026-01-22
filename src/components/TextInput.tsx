import styles from './TextInput.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TextInput({ value, onChange, disabled }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <label className={styles.label}>Text to Convert</label>
        <span className={styles.charCount}>{value.length} characters</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter text to convert to speech..."
        className={styles.textarea}
        disabled={disabled}
        rows={6}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className={styles.clearButton}
          disabled={disabled}
        >
          Clear
        </button>
      )}
    </div>
  );
}
