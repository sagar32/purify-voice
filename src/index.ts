/**
 * Purify Voice - Main Entry Point
 * Professional audio denoising for JavaScript
 */

export { Purify } from './core/Purify';
export type { PurifyOptions, ProcessingResult, PurifyInstance } from './core/types';

// Re-export React integration
export { usePurify } from './integrations/react';

// Default export
import { Purify } from './core/Purify';
export default Purify;
