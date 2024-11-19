<script setup lang="ts">
import { usePreference } from '../composables/preference'
import { commentShadowLabelMap } from '../constants/comment'

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
  50: '半屏',
  75: '3/4',
  100: '全屏',
}
const heightFormatter = (value: number) => heightMap[value as typeof commentHeight.value]
const limitMap = {
  0: '无限',
  100: '100',
  200: '200',
}
const limitFormatter = (value: number) => value === 0 ? '无限' : value

const commentShadowOptions = Object.keys(commentShadowLabelMap).map(key => ({
  label: commentShadowLabelMap[key as keyof typeof commentShadowLabelMap],
  value: key,
}))
</script>

<template>
  <div class="config-container w70">
    <div>不透明度</div>
    <el-slider v-model="commentOpacity" :min="10" :max="100" :format-tooltip="val => `${val}%`" />
    <div>显示区域</div>
    <el-slider v-model="commentHeight" :min="25" :max="100" :step="25" :format-tooltip="heightFormatter" :marks="heightMap" mb-1 />
    <div>弹幕速度</div>
    <el-slider v-model="commentSpeed" :min="0.3" :max="2" :step="0.1" />
    <div>字体大小</div>
    <el-slider v-model="commentSize" :min="10" :max="128" />
    <div>弹幕字重</div>
    <el-slider v-model="commentWeight" :min="100" :max="900" :step="100" />
    <div>同屏数量</div>
    <el-slider v-model="commentLimit" :min="0" :max="200" :step="1" :format-tooltip="limitFormatter" :marks="limitMap" mb-1 />
    <div>弹幕阴影</div>
    <el-segmented v-model="commentShadow" :options="commentShadowOptions" size="small" />
    <div>弹幕偏移</div>
    <el-input-number v-model="commentOffset" :precision="1" :step="1" size="small" />
  </div>
</template>

<style scoped>
.config-container {
  display: grid;
  grid-template-columns: 1fr 3fr;
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
