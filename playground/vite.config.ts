import path from 'node:path'
import Vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Component from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import { DanPlayerResolver } from '../src/resolver'

export default defineConfig(({ mode }) => ({
  plugins: [
    Vue(),
    AutoImport({
      imports: ['vue', '@vueuse/core'],
      resolvers: mode === 'play' ? [ElementPlusResolver()] : [],
    }),
    Component({
      resolvers: mode === 'play' ? [ElementPlusResolver(), DanPlayerResolver()] : [DanPlayerResolver()],
      dirs: mode === 'play' ? ['../src/components'] : [],
    }),
    Unocss(),
    Inspect(),
    {
      name: 'blank',
      load(id) {
        if (mode === 'play' && id.endsWith('@wiidede/dan-player/index.css'))
          return ''
      },
    },
  ],
  resolve: {
    alias: mode === 'play'
      ? [
          { find: /^@wiidede\/dan-player$/, replacement: path.resolve(__dirname, '../src/index.ts') },
          { find: /^src\/lib\/utils$/, replacement: path.resolve(__dirname, '../src/lib/utils') },
        ]
      : [],
  },
}))
