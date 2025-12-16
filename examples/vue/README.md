# Purify Voice - Vue.js Demo

A complete Vue 3 application demonstrating professional audio denoising with RNNoise WebAssembly.

## Features

- 🎙️ **Audio Recording** - Record directly from your microphone
- 🔊 **Real-time Denoising** - Process audio with RNNoise WASM
- 📊 **Waveform Visualization** - Visual comparison of original vs. denoised
- 💾 **Download Support** - Save both versions in WAV format
- 🎨 **Professional UI** - Modern, responsive design
- ⚡ **100% Client-Side** - No server uploads required

## Installation

```bash
cd examples/vue
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

## How to Use

1. **Click "Start Recording"** - Allow microphone access
2. **Speak for a few seconds** - Background noise will be captured too
3. **Click "Stop Recording"** - Audio will be processed automatically
4. **Listen & Compare** - Play original and denoised audio side-by-side
5. **Download** - Save either version if needed

## Tech Stack

- **Vue 3** - Composition API with `<script setup>`
- **Vite** - Fast build tool and dev server
- **purify-voice** - RNNoise WASM audio denoising
- **Web Audio API** - Audio processing and visualization

## Project Structure

```
vue/
├── public/
│   └── rnnoise.wasm       # RNNoise WebAssembly module
├── src/
│   ├── App.vue            # Main application component
│   ├── main.js            # Application entry point
│   └── style.css          # Global styles
├── package.json
├── vite.config.js
└── README.md
```

## How It Works

1. **Initialize** - Loads RNNoise WASM module using Vue composable
2. **Record** - Captures audio from microphone using MediaRecorder API
3. **Process** - Applies RNNoise denoising frame-by-frame (480 samples @ 48kHz)
4. **Visualize** - Draws waveforms using Canvas API
5. **Compare** - Displays both original and denoised audio for comparison

## License

MIT
