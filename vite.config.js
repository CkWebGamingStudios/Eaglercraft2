import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Sitemap from 'vite-plugin-sitemap'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    Sitemap({
      hostname: 'https://eaglercraft2ck.pages.dev',
      // Add all your subpages here so Google knows they exist
      dynamicRoutes: [
        '/editor',
        // '/about', 
        // '/contact'
      ],
    }),
  ],
})
