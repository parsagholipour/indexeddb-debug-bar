import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path";
import {IgnorePublicPlugin} from 'vite-plugin-ignore-public'
import {libInjectCss} from "vite-plugin-lib-inject-css";

export default defineConfig(({mode}) => ({
  plugins: [mode === 'development' ? react() : undefined, IgnorePublicPlugin(), libInjectCss()],
  build: {
    outDir: 'dist/core',
    lib: {
      entry: path.resolve(__dirname, 'src/build/core.ts'),
      name: 'indexeddb-debug-bar-core',
      fileName: (format) => `indexeddb-debug-bar-core.${format}.js`,
      formats: ['es', 'umd', 'cjs'],
    },
    rollupOptions: {
      external: [
        /^react(\/.*)?$/,
        /^react-dom(\/.*)?$/,
        'react-modal'
        , 'dexie', 'dexie-cloud-addon', 'dexie-export-import', 'dexie-react-hooks'],
    },
    minify: true,
  }
}))
