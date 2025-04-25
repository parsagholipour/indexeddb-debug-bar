import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({mode}) => ({
  ...(mode !== 'development' && {
    base: '/indexeddb-debug-bar-demo/',
  }), // for github demo page
  plugins: [react()],
}))
