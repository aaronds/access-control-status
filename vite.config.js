import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { dirname, resolve } from 'node:path'

let isLib = process.env.ACS_LIB == "true";

let viteConfig = {
  plugins: [react()],
  build: {
      rollupOptions: {
        input: {
            main: resolve(__dirname, 'index.html'),
            demo: resolve(__dirname, 'demo.html')
        }
      }
  }
};

if (isLib) {
    viteConfig = {
      plugins: [react()],
      build: {
          lib: {
            entry : resolve(__dirname, 'src/lib.jsx'),
            name : "accessControlStatus",
            fileName : "access-control-status-lib",
            formats: ['es']
          },
          rollupOptions: {
          }
      },
      define: {
        'process.env' : {}
      }
    }
}

// https://vite.dev/config/
export default defineConfig(viteConfig)
