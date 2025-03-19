import { defu } from 'defu'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import rootConfig from '../unocss.config'

export default defineConfig(defu({
  shortcuts: [
    ['tag', 'inline-block bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-0.8em px-2 leading-normal rd h-fit w-fit'],
    ['type-title', 'text-2xl inline font-normal font-mono text-zinc-800 dark:text-zinc-200'],
    ['label', 'text-zinc-900 dark:text-zinc-200 after:content-[":"] mr1 ws-nowrap'],
    ['value', 'text-sm inline-block m0 p0 ws-pre-wrap text-zinc-700 dark:text-zinc-400 b b-solid b-zinc-300 bg-zinc-50 dark:bg-zinc-900 dark:b-zinc-700 rd'],
    ['link', 'underline decoration-zinc-400/50 after:content-["↗"] after:text-0.8em after:op67'],
    ['btn', 'b-0 cursor-pointer rd px-4 py-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors'],
  ],
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
    presetTypography(),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  rules: [
  ],
}, rootConfig))
