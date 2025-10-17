import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path";
import { IgnorePublicPlugin } from 'vite-plugin-ignore-public'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  plugins: [react(), IgnorePublicPlugin(), cssInjectedByJsPlugin(), nodePolyfills()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/build/core-init.ts'),
      name: 'IndexedDBDebugBar',
      fileName: () => `idb.js`,
      formats: ['es'],
    },
    rollupOptions: {
    },
    minify: true,
  }
})
