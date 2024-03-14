import path from 'node:path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'
import Inspect from 'vite-plugin-inspect'
import Component from 'unplugin-vue-components/vite'
import { VueCompStarterResolver } from '../src/resolver'

export default defineConfig(({ mode }) => ({
  plugins: [
    Vue(),
    Component({
      resolvers: [VueCompStarterResolver({ name: 'Comp' })],
    }),
    Unocss(),
    Inspect(),
    {
      name: 'blank',
      load(id) {
        if (mode === 'play' && id.endsWith('vue-comp-starter/style.css'))
          return ''
      },
    },
  ],
  resolve: {
    alias: mode === 'play'
      ? [
          { find: /^vue-comp-starter$/, replacement: path.resolve(__dirname, '../src/index.ts') },
        ]
      : [],
  },
}))
