<script setup lang="ts">
import type { I18nLocale, I18nMessages } from '../composables/useI18n'
import { ElButton } from 'element-plus'
import { ref } from 'vue'
import { useI18n } from '../composables/useI18n'
import 'element-plus/theme-chalk/el-button.css'

const { locale } = defineProps<{
  locale?: I18nLocale | I18nMessages
}>()

const emit = defineEmits<{
  (e: 'send', text: string): void
}>()

const text = ref('')
const { t } = useI18n(() => locale ?? 'en')

function handleSend() {
  const trimmed = text.value.trim()
  if (!trimmed)
    return
  emit('send', trimmed)
  text.value = ''
}
</script>

<template>
  <div class="h-7 w-full flex items-center gap-2 overflow-hidden rounded bg-black/60 pl-2">
    <input
      v-model="text"
      type="text"
      :placeholder="t.commentPlaceholder"
      class="min-w-0 min-inline-0 flex-1 border-none bg-transparent text-sm text-white outline-none placeholder:text-white/50"
      @keydown.enter="handleSend"
    >
    <ElButton type="primary" text class="shadow-inner !h-full !b-0 !rd-0" @click="handleSend">
      {{ t.sendComment }}
    </ElButton>
  </div>
</template>
