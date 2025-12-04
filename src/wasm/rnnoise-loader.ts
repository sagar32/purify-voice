/**
 * RNNoise WebAssembly Loader
 * Loads and initializes the RNNoise WASM module
 */

// @ts-ignore - WASM module doesn't have TypeScript definitions
let wasmModule: any = null;
let wasmReady = false;

export async function loadRNNoiseWASM(): Promise<any> {
  if (wasmReady) return wasmModule;

  try {
    // Import the Emscripten module
    const rnnoiseModule = await import('./rnnoise.js');
    
    // Emscripten exports the factory function as default
    const createModule = rnnoiseModule.default || rnnoiseModule;
    
    if (typeof createModule !== 'function') {
      throw new Error('Invalid WASM module: expected a function');
    }
    
    wasmModule = await createModule({
      locateFile: (path: string) => {
        // Return the path to the WASM file
        // Use absolute path from public folder
        if (path.endsWith('.wasm')) {
          return '/rnnoise.wasm';
        }
        return path;
      }
    });

    wasmReady = true;
    console.log('✅ RNNoise WASM loaded successfully');
    return wasmModule;
  } catch (error) {
    console.error('Failed to load RNNoise WASM:', error);
    throw error;
  }
}

export class RNNoiseWASM {
  private module: any = null;
  private state: any = null;

  async initialize(): Promise<void> {
    this.module = await loadRNNoiseWASM();
    
    // Create RNNoise state
    this.state = this.module._rnnoise_create(0);
    
    if (!this.state) {
      throw new Error('Failed to create RNNoise state');
    }
    
    console.log('✅ RNNoise initialized');
  }

  processFrame(inputFrame: Float32Array): { output: Float32Array; vadProb: number } {
    if (!this.module || !this.state) {
      throw new Error('RNNoise not initialized');
    }

    // Allocate memory for input and output
    const frameSize = 480;
    const inputPtr = this.module._malloc(frameSize * 4); // float32 = 4 bytes
    const outputPtr = this.module._malloc(frameSize * 4);

    try {
      // Copy input data to WASM memory using setValue
      // CRITICAL: Scale by 32768 to match int16 range that RNNoise expects
      for (let i = 0; i < frameSize; i++) {
        const scaledValue = inputFrame[i] * 32768.0;
        this.module.setValue(inputPtr + i * 4, scaledValue, 'float');
      }

      // Process the frame
      const vadProb = this.module._rnnoise_process_frame(
        this.state,
        outputPtr,
        inputPtr
      );

      // Copy output data from WASM memory using getValue
      // Scale back down from int16 range to normalized float
      const output = new Float32Array(frameSize);
      for (let i = 0; i < frameSize; i++) {
        const scaledOutput = this.module.getValue(outputPtr + i * 4, 'float');
        output[i] = scaledOutput / 32768.0;
      }

      return { output, vadProb };
    } finally {
      // Free allocated memory
      this.module._free(inputPtr);
      this.module._free(outputPtr);
    }
  }

  processAudio(audioData: Float32Array): Float32Array {
    const frameSize = 480;
    const numFrames = Math.floor(audioData.length / frameSize);
    const output = new Float32Array(audioData.length);

    for (let i = 0; i < numFrames; i++) {
      const start = i * frameSize;
      const end = start + frameSize;
      const frame = audioData.slice(start, end);

      const { output: processedFrame } = this.processFrame(frame);
      output.set(processedFrame, start);
    }

    // Handle remaining samples
    const remaining = audioData.length % frameSize;
    if (remaining > 0) {
      const lastFrame = new Float32Array(frameSize);
      lastFrame.set(audioData.slice(-remaining));
      const { output: processedFrame } = this.processFrame(lastFrame);
      output.set(processedFrame.slice(0, remaining), audioData.length - remaining);
    }

    return output;
  }

  destroy(): void {
    if (this.module && this.state) {
      this.module._rnnoise_destroy(this.state);
      this.state = null;
    }
  }
}
