import { defineConfig } from 'vite'
import path from "path";
import { IgnorePublicPlugin } from 'vite-plugin-ignore-public'
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import vue from "@vitejs/plugin-vue";

export default defineConfig(({mode}) => ({
  plugins: [vue(), IgnorePublicPlugin(), libInjectCss()],
  build: {
    outDir: 'dist/vue',
    lib: {
      entry: path.resolve(__dirname, 'src/build/vue/Component.vue'),
      name: 'indexeddb-debug-bar-vue',
      fileName: (format) => `indexeddb-debug-bar-vue.${format}.js`,
      formats: ['es', 'umd', 'cjs']
    },
    rollupOptions: {
      external: ['vue', 'react', 'react-dom', 'dexie', 'dexie-cloud-addon', 'dexie-export-import', 'dexie-react-hooks'],
    },
    sourcemap: true,
    minify: true
  }
}))
