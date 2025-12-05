import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'purify-voice/react': path.resolve(__dirname, '../../dist/index.js'),
      'purify-voice': path.resolve(__dirname, '../../dist/index.js'),
    },
  },
})
