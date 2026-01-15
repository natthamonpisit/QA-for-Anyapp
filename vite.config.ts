import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Fix: Cast process to any to resolve TS error "Property 'cwd' does not exist on type 'Process'"
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Properly polyfill process.env to avoid "ReferenceError: process is not defined"
      // while injecting specific environment variables securely.
      'process.env': {
        API_KEY: env.API_KEY,
        NODE_ENV: mode,
      },
    },
  };
});