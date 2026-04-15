import { createStart } from '@tanstack/react-start/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    createStart({
      routeFileGlobs: ['./src/client/**/*.{tsx,ts}'],
    }),
  ],
})