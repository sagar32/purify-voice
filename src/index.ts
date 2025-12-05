/**
 * Purify Voice - Main Entry Point
 * Professional audio denoising for JavaScript
 */

export { Purify } from './core/Purify';
export type { PurifyOptions, ProcessingResult, PurifyInstance } from './core/types';

// Re-export React integration
export { usePurify } from './integrations/react';

// Re-export Angular integration
export { PurifyService } from './integrations/angular';

// Default export
import { Purify } from './core/Purify';
export default Purify;
