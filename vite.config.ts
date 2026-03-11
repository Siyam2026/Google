import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [tailwindcss()],
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
    root: 'public',
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'public/index.html'),
          home: path.resolve(__dirname, 'public/home.html'),
          login: path.resolve(__dirname, 'public/login.html'),
          register: path.resolve(__dirname, 'public/register.html'),
          chat: path.resolve(__dirname, 'public/chat.html'),
          group: path.resolve(__dirname, 'public/group-chat.html'),
        }
      }
    }
  };
});
