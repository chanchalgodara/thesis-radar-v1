import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, '.', '');
  const p = process.env;

  const supabaseUrl =
    fileEnv.VITE_SUPABASE_URL || fileEnv.NEXT_PUBLIC_SUPABASE_URL || fileEnv.SUPABASE_URL ||
    p.VITE_SUPABASE_URL || p.NEXT_PUBLIC_SUPABASE_URL || p.SUPABASE_URL || '';
  const supabaseAnonKey =
    fileEnv.VITE_SUPABASE_ANON_KEY || fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || fileEnv.SUPABASE_ANON_KEY ||
    p.VITE_SUPABASE_ANON_KEY || p.NEXT_PUBLIC_SUPABASE_ANON_KEY || p.SUPABASE_ANON_KEY || '';

  return {
    plugins: [react(), tailwindcss()],
    build: {
      outDir: 'dist',
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(fileEnv.GEMINI_API_KEY || p.GEMINI_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
