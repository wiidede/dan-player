import path, { resolve } from 'node:path'
import Vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    Vue(),

    AutoImport({
      imports: ['vue', '@vueuse/core'],
      dts: 'src/auto-imports.d.ts',
      resolvers: [ElementPlusResolver()],
    }),

    Components({
      dts: 'src/components.d.ts',
      resolvers: [ElementPlusResolver()],
    }),

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
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@wiidede/dan-player',
      // the proper extensions will be added
      fileName: 'index',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue',
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
