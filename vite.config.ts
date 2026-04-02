import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Configuração otimizada para DroneTech Portal na Vercel
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Isso ajuda o Vite a encontrar seus arquivos dentro da pasta src
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 3000,
  }
})
