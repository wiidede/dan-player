import path, { resolve } from 'node:path'
import Vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    Vue(),

    Unocss(),

    viteStaticCopy({
      targets: [
        {
          src: `${path.resolve(__dirname, 'node_modules')}/libass-wasm/dist/js/subtitles-octopus-worker.wasm`,
          dest: '',
        },
        {
          src: `${path.resolve(__dirname, 'node_modules')}/libass-wasm/dist/js/subtitles-octopus-worker.js`,
          dest: '',
        },
      ],
    }),

    dts({
      rollupTypes: true,
    }),
  ],
  worker: {
    format: 'es',
    rollupOptions: {
      external: ['ebml'],
      output: {
        format: 'es',
      },
    },
  },
  build: {
    sourcemap: true,
    lib: {
      formats: ['es'],
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@wiidede/dan-player',
      fileName: 'index',
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
  optimizeDeps: {
    include: ['ebml'],
    esbuildOptions: {
      target: 'es2020',
      supported: {
        'dynamic-import': true,
      },
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'jsdom',
  },
})
