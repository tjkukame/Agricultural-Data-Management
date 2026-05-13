import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase from 500kb to 1000kb (1MB)
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large dependencies into separate chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers'],
          'export-vendor': ['react-csv', 'jspdf', 'jspdf-autotable'],
        }
      }
    }
  }
})