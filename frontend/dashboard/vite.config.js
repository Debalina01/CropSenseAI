import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const dashboardDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tailwindcss()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    outDir: resolve(dashboardDirectory, '../dashboard-build'),
    emptyOutDir: true,
    lib: {
      entry: resolve(dashboardDirectory, 'src/main.jsx'),
      name: 'CropSenseDiagnosticDashboard',
      formats: ['iife'],
      fileName: () => 'diagnostic-dashboard.js',
      cssFileName: 'diagnostic-dashboard'
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
