# Purify Voice - React Demo

Beautiful React application demonstrating the `purify-voice` npm package for audio denoising.

## Features

- 🎙️ **Audio Recording** - Record from microphone
- ✨ **Real-time Denoising** - Process with RNNoise algorithm
- 📊 **Waveform Visualization** - Compare original vs denoised
- 🎵 **Side-by-Side Playback** - Listen to both versions
- ⬇️ **Download Options** - Save processed audio

## Running the Demo

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Usage

1. Click "Start Recording"
2. Allow microphone access
3. Speak for a few seconds (include background noise)
4. Click "Stop Recording"
5. Compare original and denoised audio
6. Download if desired

## Built With

- **React 18** - UI framework
- **Vite** - Build tool
- **purify-voice** - Audio denoising package

## Package Integration

This demo uses the `purify-voice` package:

```jsx
import { usePurify } from 'purify-voice/react';

function App() {
  const { isReady, processFile, isProcessing } = usePurify();
  
  // Use processFile to denoise audio
  const denoised = await processFile(audioBlob);
}
```

## Design

Matches the server demo design with:
- Gradient backgrounds
- Smooth animations
- Responsive layout
- Beautiful waveform visualizations

---

**Live Demo**: http://localhost:5173 (when running)
