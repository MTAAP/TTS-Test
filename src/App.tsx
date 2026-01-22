import { useState } from 'react';
import type { Model, Voice } from './types';
import { useTTS } from './hooks/useTTS';
import { ApiKeyInput } from './components/ApiKeyInput';
import { TextInput } from './components/TextInput';
import { ModelSelector } from './components/ModelSelector';
import { AudioPlayer } from './components/AudioPlayer';
import { Statistics } from './components/Statistics';
import { History } from './components/History';
import styles from './App.module.css';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [text, setText] = useState('');
  const [model, setModel] = useState<Model>('openai/gpt-audio-mini');
  const [voice, setVoice] = useState<Voice>('alloy');

  const {
    isLoading,
    error,
    audioData,
    audioFormat,
    stats,
    history,
    convert,
    playFromHistory,
    clearHistory,
    clearError,
  } = useTTS();

  const handleConvert = async () => {
    if (!apiKey.trim()) {
      return;
    }
    if (!text.trim()) {
      return;
    }

    await convert(apiKey, {
      model,
      voice,
      format: 'wav', // Always WAV - streaming only supports PCM16 which we convert to WAV
      text,
    });
  };

  const canConvert = apiKey.trim() && text.trim() && !isLoading;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>TTS Test</h1>
        <p className={styles.subtitle}>Test text-to-speech via OpenRouter API</p>
      </header>

      <main className={styles.main}>
        <div className={styles.inputSection}>
          <ApiKeyInput value={apiKey} onChange={setApiKey} />

          <TextInput value={text} onChange={setText} disabled={isLoading} />

          <ModelSelector
            model={model}
            voice={voice}
            onModelChange={setModel}
            onVoiceChange={setVoice}
            disabled={isLoading}
          />

          <button
            onClick={handleConvert}
            disabled={!canConvert}
            className={styles.convertButton}
          >
            {isLoading ? 'Converting...' : 'Convert to Speech'}
          </button>

          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button onClick={clearError} className={styles.dismissButton}>
                Dismiss
              </button>
            </div>
          )}
        </div>

        <div className={styles.outputSection}>
          <AudioPlayer audioData={audioData} format={audioFormat} />
          <Statistics stats={stats} />
        </div>

        <div className={styles.historySection}>
          <History
            entries={history}
            onPlay={playFromHistory}
            onClear={clearHistory}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
