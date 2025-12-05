/**
 * Angular Service for Purify Voice
 */

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Purify } from '../../core/Purify.js';
import type { PurifyOptions } from '../../core/types.js';

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

  private async initialize(options?: PurifyOptions): Promise<void> {
    try {
      this.purify = new Purify(options);
      await this.purify.initialize();
      this._isReady.next(true);
    } catch (err) {
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
      const result = await this.purify.processFile(file);
      return result;
    } catch (err) {
      this._error.next(err as Error);
      return null;
    } finally {
      this._isProcessing.next(false);
    }
  }

  public async processBuffer(buffer: AudioBuffer): Promise<AudioBuffer | null> {
    if (!this.purify || !this._isReady.value) {
      this._error.next(new Error('Purify not ready'));
      return null;
    }

    this._isProcessing.next(true);
    this._error.next(null);

    try {
      const result = await this.purify.processBuffer(buffer);
      return result;
    } catch (err) {
      this._error.next(err as Error);
      return null;
    } finally {
      this._isProcessing.next(false);
    }
  }

  public async processStream(stream: MediaStream): Promise<MediaStream | null> {
    if (!this.purify || !this._isReady.value) {
      this._error.next(new Error('Purify not ready'));
      return null;
    }

    this._isProcessing.next(true);
    this._error.next(null);

    try {
      const result = await this.purify.processStream(stream);
      return result;
    } catch (err) {
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
