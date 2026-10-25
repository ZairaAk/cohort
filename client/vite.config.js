import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, proxy API and websocket traffic to the Express server so no CORS setup is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/socket.io': { target: 'http://localhost:4000', ws: true },
    },
  },
});
