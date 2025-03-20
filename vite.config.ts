import { resolve } from 'node:path'
import Vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    Vue(),

    Unocss(),

    dts({
      rollupTypes: true,
      include: ['src/**/*.ts', 'src/**/*.vue'],
    }),
  ],
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        format: 'es',
      },
    },
  },
  build: {
    sourcemap: true,
    lib: {
      formats: ['es'],
      entry: {
        'index': resolve(__dirname, 'src/index.ts'),
        'resolver/index': resolve(__dirname, 'src/resolver.ts'),
      },
      name: '@wiidede/dan-player',
      fileName: (format, entryName) => {
        return `${entryName}.js`
      },
      cssFileName: 'index',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'jsdom',
  },
})
