# Purify Voice - Angular Demo

Angular example demonstrating audio denoising with RNNoise WASM.

## Features

- 🎙️ Real-time audio recording
- ✨ Professional noise reduction using RNNoise
- 📊 Waveform visualization
- ⬇️ Download original and denoised audio
- 🎨 Modern, responsive UI

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Usage

1. Click "Start Recording" to record audio from your microphone
2. Speak for a few seconds (background noise will be captured)
3. Click "Stop Recording" to process the audio
4. Compare the original and denoised audio
5. Download both versions if needed

## Technology Stack

- Angular 17 (Standalone Components)
- RxJS for reactive state management
- Purify Voice package for audio denoising
- RNNoise WASM for noise suppression

## How It Works

The app uses the `PurifyService` from `purify-voice/angular` which provides:
- `isReady$` - Observable for initialization state
- `isProcessing$` - Observable for processing state
- `error$` - Observable for error handling
- `processFile()` - Method to denoise audio files

All audio processing happens in-browser using WebAssembly - no server required!
