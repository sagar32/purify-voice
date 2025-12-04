/**
 * Purify Voice - Main Class
 * Professional audio denoising using RNNoise
 */

import type { PurifyOptions, PurifyInstance } from './types';
import { RNNoiseWASM } from '../wasm/rnnoise-loader.js';

export class Purify implements PurifyInstance {
  private options: Required<PurifyOptions>;
  private ready: boolean = false;
  private rnnoiseWasm: RNNoiseWASM | null = null;
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

      // Load and initialize RNNoise WASM
      console.log('Loading RNNoise WASM...');
      this.rnnoiseWasm = new RNNoiseWASM();
      await this.rnnoiseWasm.initialize();
      
      this.ready = true;
      console.log('✅ Purify Voice ready with RNNoise WASM!');
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
      let bufferToProcess = audioBuffer;
      
      // Resample to 48kHz if needed (RNNoise requires 48kHz)
      if (audioBuffer.sampleRate !== 48000) {
        console.log(`Resampling from ${audioBuffer.sampleRate}Hz to 48000Hz...`);
        const offlineContext = new OfflineAudioContext(
          1,
          Math.ceil(audioBuffer.duration * 48000),
          48000
        );
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start();
        bufferToProcess = await offlineContext.startRendering();
      }
      
      const channelData = bufferToProcess.getChannelData(0);
      const processedData = await this.processRaw(channelData);

      // Create new audio buffer with processed data at 48kHz
      const processedBuffer = this.audioContext.createBuffer(
        1,
        processedData.length,
        48000
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
    if (!this.ready || !this.rnnoiseWasm) {
      throw new Error('Purify not initialized. Call initialize() first.');
    }

    try {
      // Process audio with RNNoise WASM
      const output = this.rnnoiseWasm.processAudio(pcmData);
      return output;
    } catch (error) {
      console.error('Error processing raw audio:', error);
      throw error;
    }
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
    if (this.rnnoiseWasm) {
      this.rnnoiseWasm.destroy();
      this.rnnoiseWasm = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.ready = false;
  }
}
