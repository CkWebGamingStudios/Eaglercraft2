import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import Sitemap from 'vite-plugin-sitemap'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ensureDistDirPlugin = {
  name: 'ensure-dist-dir',
  buildStart() {
    mkdirSync(resolve(process.cwd(), 'dist'), { recursive: true })
  },
}

export default defineConfig({
  plugins: [
    react({
      babel: {
        // MUST be an array
        plugins: [['babel-plugin-react-compiler', { target: '18' }]], 
      },
    }),
    ensureDistDirPlugin,
    Sitemap({
      hostname: 'https://eaglercraft2ck.pages.dev',
    }),
  ],
})
