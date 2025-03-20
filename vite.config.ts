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
  build: {
    sourcemap: true,
    lib: {
      formats: ['es'],
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@wiidede/dan-player',
      // the proper extensions will be added
      fileName: 'index',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue', 'assjs'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue',
          assjs: 'ASS',
        },
      },
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'jsdom',
    // deps: {
    //   inline: ['@vue'],
    // },
  },
})
