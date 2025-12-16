<template>
  <div class="container">
    <h1>🎙️ Purify Voice</h1>
    <p class="subtitle">
      Professional Audio Denoising with RNNoise WebAssembly
    </p>
    <span class="badge">Vue 3 Demo</span>

    <div :class="['status', statusClass]">
      {{ status }}
    </div>

    <div class="controls">
      <button 
        @click="toggleRecording" 
        :class="['record-btn', { recording: isRecording }]"
        :disabled="!isReady || isProcessing"
      >
        {{ isRecording ? '⏹️ Stop Recording' : '🎙️ Start Recording' }}
      </button>
    </div>

    <div v-if="originalBlob && denoisedBlob" class="playback-section">
      <div class="audio-player">
        <h3>📢 Original Audio</h3>
        <div class="waveform">
          <canvas ref="originalCanvas"></canvas>
        </div>
        <audio :src="originalUrl" controls></audio>
      </div>

      <div class="audio-player">
        <h3>✨ Denoised Audio</h3>
        <div class="waveform">
          <canvas ref="denoisedCanvas"></canvas>
        </div>
        <audio :src="denoisedUrl" controls></audio>
      </div>
    </div>

    <div v-if="originalBlob && denoisedBlob" class="download-section">
      <button @click="download(originalBlob, 'original')">
        📥 Download Original
      </button>
      <button @click="download(denoisedBlob, 'denoised')">
        📥 Download Denoised
      </button>
    </div>

    <div class="info">
      <h4>💡 How It Works</h4>
      
      <div class="feature-grid">
        <div class="feature-item">
          <span class="feature-icon">🎯</span>
          <div>
            <strong>Pure WebAssembly</strong>
            <p>Powered by the actual RNNoise C library compiled to WASM for maximum performance</p>
          </div>
        </div>
        
        <div class="feature-item">
          <span class="feature-icon">🎙️</span>
          <div>
            <strong>Real-time Processing</strong>
            <p>Click "Start Recording" to capture audio directly from your microphone</p>
          </div>
        </div>
        
        <div class="feature-item">
          <span class="feature-icon">🔊</span>
          <div>
            <strong>Intelligent Noise Reduction</strong>
            <p>Advanced AI removes background noise while preserving voice clarity</p>
          </div>
        </div>
        
        <div class="feature-item">
          <span class="feature-icon">📊</span>
          <div>
            <strong>Visual Comparison</strong>
            <p>Compare waveforms and listen to original vs. denoised audio side-by-side</p>
          </div>
        </div>
        
        <div class="feature-item">
          <span class="feature-icon">⬇️</span>
          <div>
            <strong>Export & Save</strong>
            <p>Download both versions in high-quality WAV format</p>
          </div>
        </div>
        
        <div class="feature-item">
          <span class="feature-icon">🔒</span>
          <div>
            <strong>100% Private</strong>
            <p>All processing happens locally in your browser - no server uploads required</p>
          </div>
        </div>
      </div>
      
      <div class="tech-note">
        <strong>⚡ Professional Quality:</strong> Industry-grade noise reduction technology 
        optimized for crystal-clear voice enhancement in any environment.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { usePurify } from 'purify-voice/vue';

const { isReady, isProcessing, error, processFile } = usePurify({
  wasmPath: '/rnnoise.wasm'
});

const status = ref('Initializing RNNoise WASM...');
const isRecording = ref(false);
const originalBlob = ref(null);
const denoisedBlob = ref(null);
const originalUrl = ref('');
const denoisedUrl = ref('');
const originalCanvas = ref(null);
const denoisedCanvas = ref(null);

let mediaRecorder = null;
let audioChunks = [];

const statusClass = computed(() => {
  if (isRecording.value) return 'recording';
  if (isProcessing.value) return 'processing';
  if (isReady.value) return 'ready';
  return '';
});

onMounted(() => {
  const checkReady = setInterval(() => {
    if (isReady.value) {
      status.value = '✅ Ready! Click "Start Recording" to begin';
      clearInterval(checkReady);
    } else if (error.value) {
      status.value = `❌ Error: ${error.value.message}`;
      clearInterval(checkReady);
    }
  }, 100);
});

async function toggleRecording() {
  if (isRecording.value) {
    stopRecording();
  } else {
    await startRecording();
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      await processAudio(blob);
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    isRecording.value = true;
    status.value = '🔴 Recording... Speak now!';
  } catch (err) {
    status.value = `❌ Error: ${err.message}`;
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    isRecording.value = false;
    status.value = '⏳ Processing audio...';
  }
}

async function processAudio(blob) {
  try {
    originalBlob.value = blob;
    originalUrl.value = URL.createObjectURL(blob);

    const result = await processFile(blob);
    denoisedBlob.value = result;
    denoisedUrl.value = URL.createObjectURL(result);

    status.value = '✅ Done! Compare the audio below';

    // Draw waveforms
    setTimeout(() => {
      if (originalCanvas.value && denoisedCanvas.value) {
        drawWaveform(originalBlob.value, originalCanvas.value);
        drawWaveform(denoisedBlob.value, denoisedCanvas.value);
      }
    }, 100);
  } catch (err) {
    status.value = `❌ Error: ${err.message}`;
  }
}

async function drawWaveform(blob, canvas) {
  if (!canvas) return;

  const audioContext = new AudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const data = audioBuffer.getChannelData(0);

  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth * 2;
  const height = canvas.height = canvas.offsetHeight * 2;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#667eea';
  ctx.strokeStyle = '#667eea';
  ctx.lineWidth = 2;

  const step = Math.ceil(data.length / width);
  const amp = height / 2;

  ctx.beginPath();
  ctx.moveTo(0, amp);

  for (let i = 0; i < width; i++) {
    let min = 1.0;
    let max = -1.0;

    for (let j = 0; j < step; j++) {
      const datum = data[(i * step) + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }

    ctx.lineTo(i, (1 + min) * amp);
    ctx.lineTo(i, (1 + max) * amp);
  }

  ctx.stroke();
}

function download(blob, type) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${type}_${Date.now()}.wav`;
  a.click();
  URL.revokeObjectURL(url);
}

onUnmounted(() => {
  if (originalUrl.value) URL.revokeObjectURL(originalUrl.value);
  if (denoisedUrl.value) URL.revokeObjectURL(denoisedUrl.value);
});
</script>

<style scoped>
/* Copy styles from React demo for consistency */
.container {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 2.5rem;
  color: #2d3748;
  text-align: center;
  margin-bottom: 10px;
}

.subtitle {
  text-align: center;
  color: #718096;
  font-size: 1.1rem;
  margin-bottom: 10px;
  line-height: 1.6;
}

.badge {
  display: block;
  text-align: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 auto 20px;
  width: fit-content;
}

.status {
  text-align: center;
  padding: 15px 25px;
  border-radius: 12px;
  margin: 20px 0;
  font-weight: 500;
  background: #f7fafc;
  color: #2d3748;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.status.ready {
  background: #f0fff4;
  border-color: #48bb78;
  color: #48bb78;
}

.status.recording {
  background: #fffaf0;
  border-color: #ed8936;
  color: #ed8936;
  animation: pulse 2s infinite;
}

.status.processing {
  background: #ebf8ff;
  border-color: #667eea;
  color: #667eea;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.controls {
  display: flex;
  justify-content: center;
  margin: 30px 0;
}

.record-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 16px 40px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.record-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.record-btn:active:not(:disabled) {
  transform: translateY(0);
}

.record-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.record-btn.recording {
  background: linear-gradient(135deg, #f56565, #e53e3e);
  animation: recordPulse 1.5s infinite;
}

@keyframes recordPulse {
  0%, 100% { box-shadow: 0 4px 15px rgba(245, 101, 101, 0.4); }
  50% { box-shadow: 0 4px 25px rgba(245, 101, 101, 0.8); }
}

.playback-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 30px 0;
}

.audio-player {
  background: #f7fafc;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
}

.audio-player h3 {
  font-size: 1.2rem;
  margin-bottom: 15px;
  color: #2d3748;
}

.waveform {
  background: white;
  border-radius: 8px;
  margin-bottom: 15px;
  height: 100px;
  border: 1px solid #e2e8f0;
}

.waveform canvas {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

audio {
  width: 100%;
  margin-top: 10px;
}

.download-section {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 30px 0;
}

.download-section button {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  padding: 12px 30px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.download-section button:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.info {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 30px;
  border-radius: 12px;
  margin-top: 30px;
  border-left: 4px solid #667eea;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.info h4 {
  color: #1a1a2e;
  margin-bottom: 25px;
  font-size: 1.4em;
  font-weight: 600;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.feature-item {
  display: flex;
  gap: 15px;
  align-items: flex-start;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.feature-icon {
  font-size: 2em;
  flex-shrink: 0;
}

.feature-item strong {
  display: block;
  color: #2c3e50;
  margin-bottom: 5px;
  font-size: 1.05em;
}

.feature-item p {
  color: #666;
  font-size: 0.9em;
  line-height: 1.5;
  margin: 0;
}

.tech-note {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 15px 20px;
  border-radius: 8px;
  color: #856404;
  font-size: 0.95em;
  line-height: 1.6;
}

.tech-note strong {
  color: #533f03;
}

@media (max-width: 768px) {
  .playback-section,
  .download-section {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 2em;
  }

  .container {
    padding: 20px;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
