import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { newsManifestPlugin } from './vite-plugins/newsManifestPlugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    newsManifestPlugin(),
  ],
  publicDir: 'public',
})
