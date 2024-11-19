<script setup lang="ts">
import type { I18nLocale, I18nMessages } from '../composables/useI18n'
import { usePreference } from '../composables/preference'
import { useI18n } from '../composables/useI18n'
import { commentShadowMap } from '../constants/comment'

const {
  locale,
} = defineProps<{
  locale?: I18nLocale | I18nMessages
}>()

const { t } = useI18n(() => locale ?? 'en')

const {
  commentOpacity,
  commentHeight,
  commentWeight,
  commentShadow,
  commentSize,
  commentSpeed,
  commentOffset,
  commentLimit,
} = usePreference()

const heightMap = {
  25: '1/4',
  50: '1/2',
  75: '3/4',
  100: '100%',
}
const heightFormatter = (value: number) => heightMap[value as typeof commentHeight.value]
const limitMap = {
  0: '∞',
  100: '100',
  200: '200',
}
const limitFormatter = (value: number) => value === 0 ? '∞' : value

const commentShadowOptions = computed(() => Object.keys(commentShadowMap).map(key => ({
  label: t.value[key as keyof typeof commentShadowMap],
  value: key,
})))

watchEffect(() => {
  const { commentOpacity, commentSize, commentWeight, commentShadow } = usePreference()
  if (commentOpacity.value) {
    document.body.style.setProperty('--comment-opacity', String(commentOpacity.value / 100))
    document.body.style.setProperty('--comment-size', `${commentSize.value}px`)
    document.body.style.setProperty('--comment-weight', String(commentWeight.value))
    document.body.style.setProperty('--comment-shadow', commentShadowMap[commentShadow.value])
  }
})
</script>

<template>
  <div class="config-container w70">
    <div>{{ t.notTransparent }}</div>
    <el-slider v-model="commentOpacity" :min="10" :max="100" :format-tooltip="val => `${val}%`" />
    <div>{{ t.displayArea }}</div>
    <el-slider v-model="commentHeight" :min="25" :max="100" :step="25" :format-tooltip="heightFormatter" :marks="heightMap" mb-1 />
    <div>{{ t.barrageSpeed }}</div>
    <el-slider v-model="commentSpeed" :min="0.3" :max="2" :step="0.1" />
    <div>{{ t.fontSize }}</div>
    <el-slider v-model="commentSize" :min="10" :max="128" />
    <div>{{ t.barrageWeight }}</div>
    <el-slider v-model="commentWeight" :min="100" :max="900" :step="100" />
    <div>{{ t.sameScreenNumber }}</div>
    <el-slider v-model="commentLimit" :min="0" :max="200" :step="1" :format-tooltip="limitFormatter" :marks="limitMap" mb-1 />
    <div>{{ t.barrageShadow }}</div>
    <el-segmented v-model="commentShadow" :options="commentShadowOptions" size="small" />
    <div>{{ t.barrageOffset }}</div>
    <el-input-number v-model="commentOffset" :precision="1" :step="1" size="small" />
  </div>
</template>

<style scoped>
.config-container {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  grid-gap: 10px 16px;
  width: max-content;
}

:deep(.el-segmented-item) {
  --el-text-color-regular: #cfd3dc;
  --el-fill-color-blank: transparent;
  --el-border-color: #4c4d4f;

  &.is-active {
    --el-text-color-primary: white;
    --el-fill-color: #4c4d4f;
  }
}

:deep(.el-radio-button) {
  .el-radio-button__inner {
    --el-text-color-regular: #cfd3dc;
    --el-fill-color-blank: transparent;
  }
}

:deep(.el-input) {
  --el-input-text-color: #cfd3dc;
  --el-input-bg-color: transparent;
}

:deep(.el-input-number) {
  --el-text-color-regular: #cfd3dc;
  --el-fill-color-light: transparent;
}
</style>
