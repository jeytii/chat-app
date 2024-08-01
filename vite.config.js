import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/index.tsx'],
      refresh: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './resources/js'),
    }
  }
})
