import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path";
import { IgnorePublicPlugin } from 'vite-plugin-ignore-public'
import {libInjectCss} from "vite-plugin-lib-inject-css";
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [react(), IgnorePublicPlugin(), libInjectCss(), nodePolyfills()],
  build: {
    outDir: 'dist/browser',
    lib: {
      entry: path.resolve(__dirname, 'src/build/core.ts'),
      name: 'IndexedDBDebugBar',
      fileName: (format) => `indexeddb-debug-bar-browser.${format}.js`,
      formats: ['umd'],
    },
    rollupOptions: {
    },
    sourcemap: true,
    minify: true,
  }
})
