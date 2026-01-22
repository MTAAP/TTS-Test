# TTS Test

A simple webapp to test text-to-speech via the OpenRouter API.

**Try it out:** [https://mtaap.github.io/TTS-Test/](https://mtaap.github.io/TTS-Test/)

## Features

- Enter text and convert to speech using OpenRouter's audio models
- Select from multiple voices (Alloy, Echo, Shimmer, Coral, Sage, Verse)
- Choose between GPT Audio Mini and GPT-4o Audio Preview models
- Audio playback with download option
- Conversion statistics (latency, tokens, duration, cost estimate)
- Conversion history with replay

## Requirements

- An [OpenRouter API key](https://openrouter.ai/keys)

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## Tech Stack

- React 18 + TypeScript
- Vite
- CSS Modules

## License

MIT
