import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Sitemap from 'vite-plugin-sitemap'

export default defineConfig({
  plugins: [
    react({
      babel: {
        // MUST be an array
        plugins: [['babel-plugin-react-compiler', { target: '18' }]], 
      },
    }),
    Sitemap({
      hostname: 'https://eaglercraft2ck.pages.dev',
    }),
  ],
})
