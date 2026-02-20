import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3457,
    strictPort: false,
    host: true,
  },
  resolve: {
    alias: {
      '@seja/shared': path.resolve(__dirname, '../packages/shared/src'),
    },
  },
})
