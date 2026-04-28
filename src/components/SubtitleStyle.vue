<script setup lang="ts">
import type { I18nLocale, I18nMessages } from '../composables/useI18n'
import { ElSegmented, ElSlider } from 'element-plus'
import { computed, watchEffect } from 'vue'
import { usePreference } from '../composables/preference'
import { useI18n } from '../composables/useI18n'
import { commentShadowMap } from '../constants/comment'
import 'element-plus/theme-chalk/el-segmented.css'
import 'element-plus/theme-chalk/el-slider.css'
import 'element-plus/theme-chalk/el-tooltip.css'
import 'element-plus/theme-chalk/el-popper.css'

const {
  locale,
} = defineProps<{
  locale?: I18nLocale | I18nMessages
}>()

const { t } = useI18n(() => locale ?? 'en')

const {
  subtitleSize,
  subtitleColor,
  subtitleOpacity,
  subtitleStyle,
  subtitleBgOpacity,
} = usePreference()

const subtitleColorOptions = computed(() => [
  { label: t.value.primary, value: 'primary' },
  { label: t.value.white, value: 'white' },
])

const subtitleStyleOptions = computed(() => [
  { label: t.value.border, value: 'border' },
  { label: t.value.shadow, value: 'shadow' },
  { label: t.value.none, value: 'none' },
])

watchEffect(() => {
  const body = document.body
  body.style.setProperty('--subtitle-size', `${subtitleSize.value}px`)
  const colorValue = subtitleColor.value === 'primary' ? 'var(--el-color-primary, #409eff)' : '#ffffff'
  body.style.setProperty('--subtitle-color', `color-mix(in srgb, ${colorValue} ${subtitleOpacity.value}%, transparent)`)
  body.style.setProperty('--subtitle-shadow', commentShadowMap[subtitleStyle.value])
  body.style.setProperty('--subtitle-bg', `rgba(0, 0, 0, ${subtitleBgOpacity.value / 100})`)
})
</script>

<template>
  <div class="config-container">
    <div>{{ t.fontSize }}</div>
    <ElSlider v-model="subtitleSize" :min="12" :max="128" />
    <div>{{ t.fontColor }}</div>
    <ElSegmented v-model="subtitleColor" :options="subtitleColorOptions" size="small" />
    <div>{{ t.notTransparent }}</div>
    <ElSlider v-model="subtitleOpacity" :min="10" :max="100" :format-tooltip="val => `${val}%`" />
    <div>{{ t.barrageShadow }}</div>
    <ElSegmented v-model="subtitleStyle" :options="subtitleStyleOptions" size="small" />
    <div>{{ t.bgOpacity }}</div>
    <ElSlider v-model="subtitleBgOpacity" :min="0" :max="100" :format-tooltip="val => `${val}%`" />
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
</style>
