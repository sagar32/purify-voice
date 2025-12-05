import { useState, useRef } from 'react';
import { usePurify } from 'purify-voice/react';
import './App.css';

function App() {
  const { isReady, processFile, isProcessing, error } = usePurify();
  const [isRecording, setIsRecording] = useState(false);
  const [originalBlob, setOriginalBlob] = useState(null);
  const [denoisedBlob, setDenoisedBlob] = useState(null);
  const [status, setStatus] = useState('Initializing...');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const originalCanvasRef = useRef(null);
  const denoisedCanvasRef = useRef(null);

  // Update status when ready
  useState(() => {
    if (isReady) {
      setStatus('Ready to record!');
    }
  }, [isReady]);

  const toggleRecording = async () => {
    if (!isRecording) {
      await startRecording();
    } else {
      stopRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setOriginalBlob(blob);
        await processAudio(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatus('Recording... Speak now!');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setStatus('Error: Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setStatus('Processing with Purify Voice...');
    }
  };

  const processAudio = async (blob) => {
    try {
      // Use purify-voice package with actual RNNoise WASM
      const denoised = await processFile(blob);
      setDenoisedBlob(denoised);
      
      // Draw waveforms
      await drawWaveform(blob, originalCanvasRef.current);
      await drawWaveform(denoised, denoisedCanvasRef.current);
      
      setStatus('Ready! Compare the audio below');
    } catch (err) {
      console.error('Error processing audio:', err);
      setStatus(`Error: ${err.message}`);
    }
  };

  const drawWaveform = async (blob, canvas) => {
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
  };

  const downloadAudio = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <h1>🎙️ Purify Voice</h1>
      <p className="subtitle">
        <span className="badge">✨ React Demo</span><br />
        Professional audio denoising powered by RNNoise
      </p>

      <div className={`status ${isReady ? 'ready' : ''} ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}>
        {status}
      </div>

      <div className="controls">
        <button 
          className={`record-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          disabled={!isReady}
        >
          {isRecording ? '⏹️ Stop Recording' : '🔴 Start Recording'}
        </button>
      </div>

      {error && (
        <div className="error">
          Error: {error.message}
        </div>
      )}

      {denoisedBlob && (
        <>
          <div className="playback-section">
            <div className="audio-player original">
              <h3>📢 Original Audio</h3>
              <div className="waveform">
                <canvas ref={originalCanvasRef}></canvas>
              </div>
              <audio src={URL.createObjectURL(originalBlob)} controls />
            </div>

            <div className="audio-player processed">
              <h3>✨ Denoised Audio</h3>
              <div className="waveform">
                <canvas ref={denoisedCanvasRef}></canvas>
              </div>
              <audio src={URL.createObjectURL(denoisedBlob)} controls />
            </div>
          </div>

          <div className="download-section">
            <button onClick={() => downloadAudio(originalBlob, `original_${Date.now()}.wav`)}>
              ⬇️ Download Original
            </button>
            <button onClick={() => downloadAudio(denoisedBlob, `denoised_${Date.now()}.wav`)}>
              ⬇️ Download Denoised
            </button>
          </div>
        </>
      )}

      <div className="info">
        <h4>💡 How It Works</h4>
        
        <div className="feature-grid">
          <div className="feature-item">
            <span className="feature-icon">🎯</span>
            <div>
              <strong>Pure WebAssembly</strong>
              <p>Powered by the actual RNNoise C library compiled to WASM for maximum performance</p>
            </div>
          </div>
          
          <div className="feature-item">
            <span className="feature-icon">🎙️</span>
            <div>
              <strong>Real-time Processing</strong>
              <p>Click "Start Recording" to capture audio directly from your microphone</p>
            </div>
          </div>
          
          <div className="feature-item">
            <span className="feature-icon">🔊</span>
            <div>
              <strong>Intelligent Noise Reduction</strong>
              <p>Advanced AI removes background noise while preserving voice clarity</p>
            </div>
          </div>
          
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <div>
              <strong>Visual Comparison</strong>
              <p>Compare waveforms and listen to original vs. denoised audio side-by-side</p>
            </div>
          </div>
          
          <div className="feature-item">
            <span className="feature-icon">⬇️</span>
            <div>
              <strong>Export & Save</strong>
              <p>Download both versions in high-quality WAV format</p>
            </div>
          </div>
          
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <div>
              <strong>100% Private</strong>
              <p>All processing happens locally in your browser - no server uploads required</p>
            </div>
          </div>
        </div>
        
        <div className="tech-note">
          <strong>⚡ Professional Quality:</strong> Industry-grade noise reduction technology 
          optimized for crystal-clear voice enhancement in any environment.
        </div>
      </div>
    </div>
  );
}

export default App;
