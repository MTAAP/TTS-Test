import type { ConversionStats } from '../types';
import styles from './Statistics.module.css';

interface Props {
  stats: ConversionStats | null;
}

function formatNumber(value: number | null, decimals = 0): string {
  if (value === null) return 'N/A';
  return value.toFixed(decimals);
}

function formatCurrency(value: number | null): string {
  if (value === null) return 'N/A';
  if (value < 0.01) return '<$0.01';
  return `$${value.toFixed(4)}`;
}

export function Statistics({ stats }: Props) {
  if (!stats) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>
          Statistics will appear after conversion
        </div>
      </div>
    );
  }

  const items = [
    { label: 'Request Latency', value: `${formatNumber(stats.requestLatency)}ms` },
    { label: 'Total Time', value: `${formatNumber(stats.totalTime)}ms` },
    { label: 'Input Characters', value: formatNumber(stats.inputCharacters) },
    { label: 'Prompt Tokens', value: formatNumber(stats.promptTokens) },
    { label: 'Completion Tokens', value: formatNumber(stats.completionTokens) },
    { label: 'Audio Tokens', value: formatNumber(stats.audioTokens) },
    { label: 'Audio Duration', value: stats.audioDuration ? `${formatNumber(stats.audioDuration, 2)}s` : 'N/A' },
    { label: 'Characters/Second', value: formatNumber(stats.charactersPerSecond, 1) },
    { label: 'Cost Estimate', value: formatCurrency(stats.costEstimate) },
  ];

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Conversion Statistics</h3>
      <div className={styles.grid}>
        {items.map((item) => (
          <div key={item.label} className={styles.item}>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.value}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
