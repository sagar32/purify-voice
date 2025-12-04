/**
 * React Hook for Purify Voice
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Purify } from '../../core/Purify.js';
import type { PurifyOptions } from '../../core/types.js';

export function usePurify(options?: PurifyOptions) {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const purifyRef = useRef<Purify | null>(null);

  useEffect(() => {
    const initPurify = async () => {
      try {
        purifyRef.current = new Purify(options);
        await purifyRef.current.initialize();
        setIsReady(true);
      } catch (err) {
        setError(err as Error);
      }
    };

    initPurify();

    return () => {
      if (purifyRef.current) {
        purifyRef.current.destroy();
      }
    };
  }, []);

  const processFile = useCallback(async (file: File | Blob): Promise<Blob | null> => {
    if (!purifyRef.current || !isReady) {
      setError(new Error('Purify not ready'));
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await purifyRef.current.processFile(file);
      return result;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isReady]);

  const processBuffer = useCallback(async (buffer: AudioBuffer): Promise<AudioBuffer | null> => {
    if (!purifyRef.current || !isReady) {
      setError(new Error('Purify not ready'));
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await purifyRef.current.processBuffer(buffer);
      return result;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isReady]);

  const processStream = useCallback(async (stream: MediaStream): Promise<MediaStream | null> => {
    if (!purifyRef.current || !isReady) {
      setError(new Error('Purify not ready'));
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await purifyRef.current.processStream(stream);
      return result;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isReady]);

  return {
    isReady,
    isProcessing,
    error,
    processFile,
    processBuffer,
    processStream,
  };
}
