import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('recharts') || id.includes('d3-')) return 'charts'
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('xlsx') || id.includes('exceljs')) return 'spreadsheet'
          if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf'
          if (id.includes('mathlive')) return 'mathlive'
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('react-router') ||
            id.includes('scheduler')
          ) {
            return 'react-vendor'
          }
        },
      },
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
    },
  },
})
