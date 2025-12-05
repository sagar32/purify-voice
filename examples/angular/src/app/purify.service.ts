/**
 * Purify Service for Angular Demo
 * Full RNNoise integration with WASM
 */

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Purify } from 'purify-voice';

@Injectable({
  providedIn: 'root'
})
export class PurifyService implements OnDestroy {
  private purify: Purify | null = null;
  private _isReady = new BehaviorSubject<boolean>(false);
  private _isProcessing = new BehaviorSubject<boolean>(false);
  private _error = new BehaviorSubject<Error | null>(null);

  public readonly isReady$: Observable<boolean> = this._isReady.asObservable();
  public readonly isProcessing$: Observable<boolean> = this._isProcessing.asObservable();
  public readonly error$: Observable<Error | null> = this._error.asObservable();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Purify with RNNoise WASM...');
      this.purify = new Purify({
        wasmPath: '/rnnoise.wasm' // Load from public directory
      });
      await this.purify.initialize();
      this._isReady.next(true);
      console.log('✅ Purify initialized successfully!');
    } catch (err) {
      console.error('❌ Failed to initialize Purify:', err);
      this._error.next(err as Error);
    }
  }

  public async processFile(file: File | Blob): Promise<Blob | null> {
    if (!this.purify || !this._isReady.value) {
      this._error.next(new Error('Purify not ready'));
      return null;
    }

    this._isProcessing.next(true);
    this._error.next(null);

    try {
      console.log('🎵 Processing audio with RNNoise...');
      const result = await this.purify.processFile(file);
      console.log('✅ Audio processing complete!');
      return result;
    } catch (err) {
      console.error('❌ Processing error:', err);
      this._error.next(err as Error);
      return null;
    } finally {
      this._isProcessing.next(false);
    }
  }

  public get isReady(): boolean {
    return this._isReady.value;
  }

  public get isProcessing(): boolean {
    return this._isProcessing.value;
  }

  public get error(): Error | null {
    return this._error.value;
  }

  ngOnDestroy(): void {
    if (this.purify) {
      this.purify.destroy();
    }
    this._isReady.complete();
    this._isProcessing.complete();
    this._error.complete();
  }
}
