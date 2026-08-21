import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Where `/api` goes in development. The API's launch profile pins
 * http://localhost:5199 so this needs no per-machine configuration; override it
 * to develop against a deployed or containerised API instead.
 */
const DEV_API_TARGET = process.env.VITE_DEV_API_TARGET ?? 'http://localhost:5199'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,

    /*
      Mirrors the Netlify rewrite in netlify.toml: the client calls a relative
      `/api/...` in both environments, and the proxy adds the API's `/v1`. Same
      URL shape either side of a deploy, and no CORS preflight in between —
      though the API does allow http://localhost:5173 explicitly, so calling it
      directly with VITE_API_BASE_URL works too.
    */
    proxy: {
      '/api': {
        target: DEV_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/v1'),
      },
    },
  },
})
