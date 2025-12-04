/**
 * Purify Voice - Main Class
 * Professional audio denoising using RNNoise
 */

import type { PurifyOptions, PurifyInstance } from './types';

export class Purify implements PurifyInstance {
  private options: Required<PurifyOptions>;
  private ready: boolean = false;
  private wasmModule: any = null;
  private rnnoiseState: any = null;
  private audioContext: AudioContext | null = null;

  constructor(options: PurifyOptions = {}) {
    this.options = {
      sampleRate: options.sampleRate || 48000,
      frameSize: options.frameSize || 480,
      wasmPath: options.wasmPath || '',
    };
  }

  async initialize(): Promise<void> {
    if (this.ready) return;

    try {
      // Initialize AudioContext
      if (typeof window !== 'undefined' && window.AudioContext) {
        this.audioContext = new AudioContext({ sampleRate: this.options.sampleRate });
      }

      // TODO: Load WASM module
      // For now, we'll use a placeholder
      console.log('Purify Voice initializing...');
      
      this.ready = true;
      console.log('Purify Voice ready!');
    } catch (error) {
      console.error('Failed to initialize Purify:', error);
      throw error;
    }
  }

  async processFile(audioFile: File | Blob): Promise<Blob> {
    if (!this.ready) {
      throw new Error('Purify not initialized. Call initialize() first.');
    }

    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    try {
      // Read file as array buffer
      const arrayBuffer = await audioFile.arrayBuffer();
      
      // Decode audio
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Process audio buffer
      const processedBuffer = await this.processBuffer(audioBuffer);
      
      // Convert back to WAV blob
      return this.audioBufferToWav(processedBuffer);
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  }

  async processBuffer(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    if (!this.ready) {
      throw new Error('Purify not initialized. Call initialize() first.');
    }

    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    try {
      const channelData = audioBuffer.getChannelData(0);
      const processedData = await this.processRaw(channelData);

      // Create new audio buffer with processed data
      const processedBuffer = this.audioContext.createBuffer(
        1,
        processedData.length,
        this.options.sampleRate
      );
      // Create a new Float32Array with proper ArrayBuffer type
      const outputData = new Float32Array(processedData);
      processedBuffer.copyToChannel(outputData, 0);

      return processedBuffer;
    } catch (error) {
      console.error('Error processing buffer:', error);
      throw error;
    }
  }

  async processStream(inputStream: MediaStream): Promise<MediaStream> {
    if (!this.ready) {
      throw new Error('Purify not initialized. Call initialize() first.');
    }

    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    try {
      // Create audio nodes
      const source = this.audioContext.createMediaStreamSource(inputStream);
      const destination = this.audioContext.createMediaStreamDestination();

      // TODO: Add AudioWorklet processor for real-time processing
      // For now, just pass through
      source.connect(destination);

      return destination.stream;
    } catch (error) {
      console.error('Error processing stream:', error);
      throw error;
    }
  }

  async processRaw(pcmData: Float32Array): Promise<Float32Array> {
    if (!this.ready) {
      throw new Error('Purify not initialized. Call initialize() first.');
    }

    // Process in frames
    const frameSize = this.options.frameSize;
    const numFrames = Math.floor(pcmData.length / frameSize);
    const output = new Float32Array(pcmData.length);

    for (let i = 0; i < numFrames; i++) {
      const start = i * frameSize;
      const end = start + frameSize;
      const frame = pcmData.slice(start, end);

      // TODO: Process frame with RNNoise WASM
      // For now, apply simple noise gate
      const processedFrame = this.processFrame(frame);
      output.set(processedFrame, start);
    }

    // Handle remaining samples
    const remaining = pcmData.length % frameSize;
    if (remaining > 0) {
      const lastFrame = new Float32Array(frameSize);
      lastFrame.set(pcmData.slice(-remaining));
      const processedFrame = this.processFrame(lastFrame);
      output.set(processedFrame.slice(0, remaining), pcmData.length - remaining);
    }

    return output;
  }

  private processFrame(frame: Float32Array): Float32Array {
    // Simple noise gate as placeholder
    // This will be replaced with actual RNNoise WASM processing
    const threshold = 0.02;
    const output = new Float32Array(frame.length);

    for (let i = 0; i < frame.length; i++) {
      if (Math.abs(frame[i]) > threshold) {
        output[i] = frame[i];
      } else {
        output[i] = frame[i] * 0.1;
      }
    }

    return output;
  }

  private audioBufferToWav(audioBuffer: AudioBuffer): Blob {
    const numberOfChannels = 1;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const channelData = audioBuffer.getChannelData(0);
    const length = channelData.length * numberOfChannels * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);

    // Write WAV header
    let pos = 0;
    const writeString = (str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(pos++, str.charCodeAt(i));
      }
    };
    const writeUint32 = (val: number) => {
      view.setUint32(pos, val, true);
      pos += 4;
    };
    const writeUint16 = (val: number) => {
      view.setUint16(pos, val, true);
      pos += 2;
    };

    writeString('RIFF');
    writeUint32(36 + length);
    writeString('WAVE');
    writeString('fmt ');
    writeUint32(16);
    writeUint16(format);
    writeUint16(numberOfChannels);
    writeUint32(sampleRate);
    writeUint32(sampleRate * numberOfChannels * bitDepth / 8);
    writeUint16(numberOfChannels * bitDepth / 8);
    writeUint16(bitDepth);
    writeString('data');
    writeUint32(length);

    // Write audio data
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(pos, intSample, true);
      pos += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  isReady(): boolean {
    return this.ready;
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.ready = false;
  }
}
