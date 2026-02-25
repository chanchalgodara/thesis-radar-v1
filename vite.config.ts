import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { apiPlugin } from './lib/vite-api-plugin';

export default defineConfig(({mode}) => {
  // loadEnv with '' prefix loads ALL env vars from .env files
  const env = loadEnv(mode, '.', '');

  // CRITICAL: Also merge real process.env values into env.
  // In v0 sandbox, Supabase sets POSTGRES_URL as a real system env var,
  // but loadEnv only reads .env files. We need both sources.
  const dbUrl =
    env.POSTGRES_URL ||
    env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    "";

  // Inject into process.env so that lib/db.ts can find it at runtime
  // (the Vite config .mjs bundle sometimes loses process.env access)
  if (dbUrl) {
    process.env.POSTGRES_URL = dbUrl;
    process.env.DATABASE_URL = dbUrl;
  }

  console.log("[v0] Vite config: POSTGRES_URL available:", !!dbUrl, "source:", env.POSTGRES_URL ? "loadEnv" : process.env.POSTGRES_URL ? "process.env" : "none");

  return {
    plugins: [react(), tailwindcss(), apiPlugin(dbUrl)],
    build: {
      outDir: 'dist',
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
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
