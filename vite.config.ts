import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Safe replacement: Only replace 'process.env' with the JSON object.
      // We do NOT replace the entire 'process' object here anymore, 
      // because that is now handled safely in index.html to avoid syntax errors.
      'process.env': JSON.stringify({
        API_KEY: env.API_KEY,
        NODE_ENV: mode,
        ...env // Include other env vars if needed
      }),
    },
  };
});