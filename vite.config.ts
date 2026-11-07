import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        // Suppress warning/error caused by "use client" directives in packages like framer-motion
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
          (typeof warning.message === 'string' && warning.message.includes('"use client"'))
        ) {
          return;
        }
        defaultHandler(warning);
      },
    },
  },
});
