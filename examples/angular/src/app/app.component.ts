import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurifyService } from './purify.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  providers: [PurifyService],
  template: `
    <div class="container">
      <h1>🎙️ Purify Voice</h1>
      <p class="subtitle">
        <span class="badge">✨ Angular Demo</span><br />
        Professional audio denoising powered by RNNoise
      </p>

      <div 
        class="status" 
        [class.ready]="isReady"
        [class.recording]="isRecording"
        [class.processing]="isProcessing">
        {{ statusMessage }}
      </div>

      <div class="controls">
        <button 
          class="record-btn"
          [class.recording]="isRecording"
          (click)="toggleRecording()"
          [disabled]="!isReady">
          {{ isRecording ? '⏹️ Stop Recording' : '🔴 Start Recording' }}
        </button>
      </div>

      <div *ngIf="error" class="error">
        Error: {{ error.message }}
      </div>

      <div *ngIf="denoisedBlob" class="playback-section">
        <div class="audio-player original">
          <h3>📢 Original Audio</h3>
          <div class="waveform">
            <canvas #originalCanvas></canvas>
          </div>
          <audio [src]="originalUrl" controls></audio>
        </div>

        <div class="audio-player processed">
          <h3>✨ Denoised Audio</h3>
          <div class="waveform">
            <canvas #denoisedCanvas></canvas>
          </div>
          <audio [src]="denoisedUrl" controls></audio>
        </div>
      </div>

      <div *ngIf="denoisedBlob" class="download-section">
        <button (click)="downloadAudio(originalBlob, 'original')">
          ⬇️ Download Original
        </button>
        <button (click)="downloadAudio(denoisedBlob, 'denoised')">
          ⬇️ Download Denoised
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
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {
  isReady = false;
  isProcessing = false;
  isRecording = false;
  error: Error | null = null;
  statusMessage = 'Initializing...';

  originalBlob: Blob | null = null;
  denoisedBlob: Blob | null = null;
  originalUrl: string | null = null;
  denoisedUrl: string | null = null;

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private subscriptions = new Subscription();

  constructor(
    public purifyService: PurifyService,
    private cdr: ChangeDetectorRef
  ) {
    // Subscribe to service observables
    this.subscriptions.add(
      this.purifyService.isReady$.subscribe(ready => {
        this.isReady = ready;
        if (ready) {
          this.statusMessage = 'Ready to record!';
        }
      })
    );

    this.subscriptions.add(
      this.purifyService.isProcessing$.subscribe(processing => {
        this.isProcessing = processing;
      })
    );

    this.subscriptions.add(
      this.purifyService.error$.subscribe(err => {
        this.error = err;
        if (err) {
          this.statusMessage = `Error: ${err.message}`;
        }
      })
    );
  }

  async toggleRecording() {
    if (!this.isRecording) {
      await this.startRecording();
    } else {
      this.stopRecording();
    }
  }

  async startRecording() {
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

      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.originalBlob = blob;
        await this.processAudio(blob);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.statusMessage = 'Recording... Speak now!';
    } catch (err) {
      console.error('Error accessing microphone:', err);
      this.statusMessage = 'Error: Could not access microphone';
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.isRecording = false;
      this.statusMessage = 'Processing with Purify Voice...';
    }
  }

  async processAudio(blob: Blob) {
    try {
      console.log('🎵 Processing audio blob:', blob);
      const denoised = await this.purifyService.processFile(blob);
      
      console.log('✅ Denoised result:', denoised);
      
      if (denoised) {
        this.denoisedBlob = denoised;
        
        // Create URLs for audio elements
        this.originalUrl = URL.createObjectURL(blob);
        this.denoisedUrl = URL.createObjectURL(denoised);
        
        console.log('🎧 Audio URLs created:', {
          original: this.originalUrl,
          denoised: this.denoisedUrl,
          denoisedBlob: this.denoisedBlob
        });
        
        this.statusMessage = 'Ready! Compare the audio below';
        
        // Manually trigger change detection
        this.cdr.detectChanges();
        
        // Draw waveforms after a short delay to ensure canvases are rendered
        setTimeout(() => this.drawWaveforms(), 100);
      } else {
        console.error('❌ No denoised blob returned');
      }
    } catch (err) {
      console.error('Error processing audio:', err);
      this.statusMessage = `Error: ${(err as Error).message}`;
    }
  }

  async drawWaveforms() {
    const originalCanvas = document.querySelector('canvas') as HTMLCanvasElement;
    const denoisedCanvas = document.querySelectorAll('canvas')[1] as HTMLCanvasElement;
    
    if (this.originalBlob && originalCanvas) {
      await this.drawWaveform(this.originalBlob, originalCanvas);
    }
    if (this.denoisedBlob && denoisedCanvas) {
      await this.drawWaveform(this.denoisedBlob, denoisedCanvas);
    }
  }

  async drawWaveform(blob: Blob, canvas: HTMLCanvasElement) {
    if (!canvas) return;

    const audioContext = new AudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const data = audioBuffer.getChannelData(0);

    const ctx = canvas.getContext('2d')!;
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

  downloadAudio(blob: Blob | null, type: string) {
    if (!blob) return;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    
    // Cleanup URLs
    if (this.originalUrl) URL.revokeObjectURL(this.originalUrl);
    if (this.denoisedUrl) URL.revokeObjectURL(this.denoisedUrl);
  }
}
