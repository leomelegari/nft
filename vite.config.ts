import { resolve } from 'node:path'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    // `?react` imports turn the Figma icon exports into inline components, so
    // they inherit currentColor and participate in hover/focus states.
    svgr({ include: '**/*.svg?react' }),
  ],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
})
