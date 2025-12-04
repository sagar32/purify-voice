/**
 * Core types for Purify Voice
 */

export interface PurifyOptions {
  /**
   * Sample rate for audio processing (default: 48000)
   * RNNoise requires 48kHz
   */
  sampleRate?: number;

  /**
   * Frame size in samples (default: 480)
   * RNNoise processes 10ms frames at 48kHz
   */
  frameSize?: number;

  /**
   * Path to WASM file (optional, will use bundled version if not specified)
   */
  wasmPath?: string;
}

export interface ProcessingResult {
  /**
   * Denoised audio data
   */
  data: Float32Array | AudioBuffer | Blob;

  /**
   * Voice activity detection probability (0-1)
   */
  vadProbability?: number;

  /**
   * Processing time in milliseconds
   */
  processingTime?: number;
}

export interface PurifyInstance {
  /**
   * Initialize the Purify instance
   */
  initialize(): Promise<void>;

  /**
   * Process audio file/blob
   */
  processFile(audioFile: File | Blob): Promise<Blob>;

  /**
   * Process audio buffer
   */
  processBuffer(audioBuffer: AudioBuffer): Promise<AudioBuffer>;

  /**
   * Process real-time audio stream
   */
  processStream(inputStream: MediaStream): Promise<MediaStream>;

  /**
   * Process raw PCM data
   */
  processRaw(pcmData: Float32Array): Promise<Float32Array>;

  /**
   * Check if Purify is ready
   */
  isReady(): boolean;

  /**
   * Cleanup resources
   */
  destroy(): void;
}
