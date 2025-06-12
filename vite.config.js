import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { dirname, resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
      rollupOptions: {
        input: {
            main: resolve(__dirname, 'index.html'),
            demo: resolve(__dirname, 'demo.html')
        }
      }
  }
})
