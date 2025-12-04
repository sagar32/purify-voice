/**
 * Purify Voice - Main Entry Point
 * Professional audio denoising for JavaScript
 */

export { Purify } from './core/Purify';
export type { PurifyOptions, ProcessingResult, PurifyInstance } from './core/types';

// Re-export framework integrations
export { usePurify } from './integrations/react';
export { usePurify as useVuePurify } from './integrations/vue';

// Default export
import { Purify } from './core/Purify';
export default Purify;
