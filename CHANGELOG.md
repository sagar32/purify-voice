# Purify Voice - Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-04

### Added
- Initial release of Purify Voice
- Core `Purify` class with audio processing methods
- React hook (`usePurify`)
- Vue composable (`usePurify`)
- TypeScript support with full type definitions
- WebAssembly-based RNNoise integration (placeholder)
- Support for file, buffer, stream, and raw PCM processing
- Comprehensive documentation and examples
- MIT License

### Features
- Process audio files (File/Blob)
- Process AudioBuffer
- Process MediaStream (real-time)
- Process raw PCM data (Float32Array)
- Framework integrations for React and Vue
- TypeScript definitions
- Multiple output formats (CommonJS, ESM)

### Documentation
- Complete README with examples
- API reference
- Quick start guides for all frameworks
- Vanilla JavaScript example

## [Unreleased]

### Planned
- Actual RNNoise WASM compilation
- Angular service integration
- Node.js native bindings
- Performance optimizations
- Additional examples
- Unit and integration tests
