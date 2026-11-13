import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Optional: forward /api/* to the Backend so the browser sees a same-origin request (no CORS).
      // The browser still sends `Origin: http://localhost:5173` on POST/PUT/…; Spring would reject it
      // (403 "Invalid CORS request") because only :3000 is allowed, so strip it — server-to-server
      // proxied requests are not cross-origin.
      proxy: proxyTarget
        ? {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              configure: (proxy) => proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin')),
            },
          }
        : undefined,
    },
  }
})
