import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path";
import { IgnorePublicPlugin } from 'vite-plugin-ignore-public'
import { libInjectCss } from 'vite-plugin-lib-inject-css';

export default defineConfig(({mode}) => ({
  plugins: [mode === 'development' ? react() : undefined, IgnorePublicPlugin(), libInjectCss()],
  build: {
    outDir: 'dist/react',
    lib: {
      entry: path.resolve(__dirname, 'src/build/react.tsx'),
      name: 'indexeddb-debug-bar-react',
      fileName: (format) => `indexeddb-debug-bar-react.${format}.js`,
      formats: ['es', 'umd', 'cjs']
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'dexie', 'dexie-cloud-addon', 'dexie-export-import', 'dexie-react-hooks'],
    },
    sourcemap: true,
    minify: true
  }
}))
