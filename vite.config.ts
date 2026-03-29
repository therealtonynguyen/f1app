import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Browser → same origin → Vite → OpenF1 (helps when direct cross-origin fetch fails in dev)
      '/api/openf1': {
        target: 'https://api.openf1.org',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api\/openf1/, '/v1'),
      },
    },
  },
})
