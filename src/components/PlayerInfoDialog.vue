<script setup lang="ts">
import type { I18nLocale, I18nMessages } from '../composables/useI18n'
import { version } from '../../package.json'
import { useI18n } from '../composables/useI18n'

const { locale, videoInfo, keyboardShortcuts } = defineProps<{
  locale?: I18nLocale | I18nMessages
  videoInfo: Record<string, string>
  keyboardShortcuts: { key: string, description: string }[]
}>()

const showDialog = defineModel<boolean>('modelValue', { required: true })

const { t } = useI18n(() => locale ?? 'en')
</script>

<template>
  <ElDialog
    v-model="showDialog"
    title="Dan Player"
    class="dan-player-dialog"
    width="fit-content"
  >
    <div class="flex gap-4 text-zinc-300">
      <div class="space-y-2">
        <div class="space-y-2">
          <span class="text-sm text-zinc-200 font-medium">
            {{ t.videoInfo }}
          </span>
          <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <template v-for="(value, key) in videoInfo" :key="key">
              <span class="dan-label">{{ key }}</span>
              <span class="dan-value">{{ value }}</span>
            </template>
          </div>
        </div>
        <div class="space-y-2">
          <span class="text-sm text-zinc-200 font-medium">
            {{ t.playerInfo }}
          </span>
          <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <span class="dan-label">{{ t.version }}</span>
            <span class="dan-value">{{ version }}</span>
            <span class="dan-label">{{ t.author }}</span>
            <span class="dan-value"><a href="https://github.com/wiidede/" target="_blank">wiidede</a></span>
            <span class="dan-label">GitHub</span>
            <span class="dan-value"><a href="https://github.com/wiidede/dan-player" target="_blank"><div class="i-carbon-logo-github" /></a></span>
          </div>
        </div>
      </div>

      <div class="my-2 w-[1px] bg-zinc-700" />

      <div class="space-y-2">
        <span class="text-sm text-zinc-200 font-medium">
          {{ t.keyboardShortcuts }}
        </span>
        <div class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
          <template v-for="shortcut in keyboardShortcuts" :key="shortcut.key">
            <span class="dan-label">{{ shortcut.description }}</span>
            <span class="dan-value w-fit">{{ shortcut.key }}</span>
          </template>
        </div>
      </div>
    </div>
  </ElDialog>
</template>

<style scoped>
.dan-label {
  --at-apply: text-sm text-zinc-400;
}

.dan-value {
  --at-apply: rounded bg-zinc-800/50 px-2 py-0.5 text-sm text-zinc-200 font-mono;
}

.dan-value a {
  color: inherit;
}
</style>
