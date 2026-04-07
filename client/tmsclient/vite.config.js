import { defineConfig, transformWithEsbuild } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    setupFiles: ['./src/setupTests.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'cobertura', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}', 'src/setupTests.js', 'src/test-utils/**'],
    },
  },
  plugins: [
    // Pre-process: treat .js files in src/ as JSX before the react plugin sees them
    {
      name: 'js-as-jsx',
      enforce: 'pre',
      async transform(code, id) {
        if (!id.match(/\/src\/.*\.js$/)) return null
        return transformWithEsbuild(code, id, { loader: 'jsx' })
      },
    },
    react({ jsxRuntime: 'automatic' }),
  ],
  // This tells the initial dependency scanner to allow JSX inside .js files
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5011',
    },
  },
})