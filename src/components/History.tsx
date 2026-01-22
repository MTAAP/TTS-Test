import type { HistoryEntry } from '../types';
import styles from './History.module.css';

interface Props {
  entries: HistoryEntry[];
  onPlay: (entry: HistoryEntry) => void;
  onClear: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return 'N/A';
  return `${seconds.toFixed(2)}s`;
}

export function History({ entries, onPlay, onClear }: Props) {
  if (entries.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Conversion History</h3>
        </div>
        <div className={styles.placeholder}>
          No conversions yet
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Conversion History ({entries.length})</h3>
        <button onClick={onClear} className={styles.clearButton}>
          Clear History
        </button>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Input Preview</th>
              <th>Model</th>
              <th>Voice</th>
              <th>Latency</th>
              <th>Duration</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className={styles.time}>{formatTime(entry.timestamp)}</td>
                <td className={styles.preview} title={entry.fullText}>
                  {entry.inputPreview}
                </td>
                <td className={styles.model}>{entry.model.split('/').pop()}</td>
                <td>{entry.voice}</td>
                <td className={styles.numeric}>{entry.latency}ms</td>
                <td className={styles.numeric}>{formatDuration(entry.audioDuration)}</td>
                <td>
                  <button
                    onClick={() => onPlay(entry)}
                    className={styles.playButton}
                  >
                    Play
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
