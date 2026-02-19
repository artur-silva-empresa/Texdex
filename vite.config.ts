import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Resolução do __dirname para ambientes ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    return {
      // Define a base como o nome do repositório para o GitHub Pages
      base: '/Texdex/', 
      
      // Define a raiz como o diretório atual (onde está o teu index.html)
      root: './',

      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      
      plugins: [react()],
      
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      
      resolve: {
        alias: {
          // Ajusta o alias para a raiz, permitindo imports como '@/components/...'
          '@': path.resolve(__dirname, './'),
        }
      },

      build: {
        // Garante que o build vai para a pasta 'dist' que o GitHub Actions espera
        outDir: 'dist',
        // O ponto de entrada é o index.html na raiz
        rollupOptions: {
          input: path.resolve(__dirname, 'index.html'),
        },
      }
    };
});
