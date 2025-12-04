/**
 * Vue Composable for Purify Voice
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { Purify } from '../../core/Purify.js';
import type { PurifyOptions } from '../../core/types.js';

export function usePurify(options?: PurifyOptions) {
  const isReady = ref(false);
  const isProcessing = ref(false);
  const error = ref<Error | null>(null);
  let purifyInstance: Purify | null = null;

  onMounted(async () => {
    try {
      purifyInstance = new Purify(options);
      await purifyInstance.initialize();
      isReady.value = true;
    } catch (err) {
      error.value = err as Error;
    }
  });

  onUnmounted(() => {
    if (purifyInstance) {
      purifyInstance.destroy();
    }
  });

  const processFile = async (file: File | Blob): Promise<Blob | null> => {
    if (!purifyInstance || !isReady.value) {
      error.value = new Error('Purify not ready');
      return null;
    }

    isProcessing.value = true;
    error.value = null;

    try {
      const result = await purifyInstance.processFile(file);
      return result;
    } catch (err) {
      error.value = err as Error;
      return null;
    } finally {
      isProcessing.value = false;
    }
  };

  const processBuffer = async (buffer: AudioBuffer): Promise<AudioBuffer | null> => {
    if (!purifyInstance || !isReady.value) {
      error.value = new Error('Purify not ready');
      return null;
    }

    isProcessing.value = true;
    error.value = null;

    try {
      const result = await purifyInstance.processBuffer(buffer);
      return result;
    } catch (err) {
      error.value = err as Error;
      return null;
    } finally {
      isProcessing.value = false;
    }
  };

  const processStream = async (stream: MediaStream): Promise<MediaStream | null> => {
    if (!purifyInstance || !isReady.value) {
      error.value = new Error('Purify not ready');
      return null;
    }

    isProcessing.value = true;
    error.value = null;

    try {
      const result = await purifyInstance.processStream(stream);
      return result;
    } catch (err) {
      error.value = err as Error;
      return null;
    } finally {
      isProcessing.value = false;
    }
  };

  return {
    isReady,
    isProcessing,
    error,
    processFile,
    processBuffer,
    processStream,
  };
}
