
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Casting process to any to fix missing type definition for cwd() in the Process interface
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Replaces process.env.API_KEY in client-side code with the value from environment variables at build time
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});
