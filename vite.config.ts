import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Cast process to any to resolve TS error "Property 'cwd' does not exist on type 'Process'"
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // CRITICAL FIX: We must JSON.stringify the object.
      // Vite 'define' inserts values as raw code. 
      // If we don't stringify, the API Key string becomes a variable identifier (e.g. AIzaSy...),
      // which causes a "SyntaxError: Unexpected identifier" and a white screen at runtime.
      'process.env': JSON.stringify({
        API_KEY: env.API_KEY,
        NODE_ENV: mode,
      }),
    },
  };
});