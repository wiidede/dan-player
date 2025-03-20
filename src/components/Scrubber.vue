<script setup lang="ts">
import { useEventListener, useMouseInElement, useVModel } from '@vueuse/core'
import { ElTooltip } from 'element-plus'
import { computed, ref, watch } from 'vue'
import 'element-plus/theme-chalk/el-tooltip.css'

const props = withDefaults(defineProps<{
  min?: number
  max?: number
  secondary?: number
  modelValue: number
  tooltipFormatter?: (value: number) => string
}>(), {
  min: 0,
  max: 100,
  secondary: 0,
})

const emit = defineEmits(['update:modelValue'])

const scrubber = ref<HTMLElement>()
const scrubbing = ref(false)
const pendingValue = ref(0)

useEventListener('mouseup', () => scrubbing.value = false)

const value = useVModel(props, 'modelValue', emit)
const { elementX, elementWidth, isOutside } = useMouseInElement(scrubber)

const position = computed(() => {
  if (!scrubber.value)
    return DOMRect.fromRect()
  const scrubberRect = scrubber.value?.getBoundingClientRect()
  scrubberRect.x = scrubberRect.x + elementX.value
  scrubberRect.width = 0
  return scrubberRect
})

const triggerRef = ref({
  getBoundingClientRect() {
    return position.value
  },
})

const tooltipContent = computed(() => {
  const formatter = props.tooltipFormatter || ((value: number) => value.toFixed(2))
  return formatter(pendingValue.value)
})

watch([scrubbing, elementX], () => {
  const progress = Math.max(0, Math.min(1, (elementX.value) / elementWidth.value))
  pendingValue.value = progress * props.max
  if (scrubbing.value)
    value.value = pendingValue.value
})
</script>

<template>
  <div
    ref="scrubber" class="group relative h-4 flex-center cursor-pointer select-none rounded"
    @mousedown="scrubbing = true"
  >
    <div class="relative h-1 w-full overflow-hidden rounded bg-white bg-opacity-10 group-hover:h-2">
      <div
        class="absolute left-0 top-0 h-full w-full rounded bg-[--el-color-primary] opacity-30"
        :style="{ transform: `translateX(${secondary / max * 100 - 100}%)` }"
      />
      <div
        class="relative h-full w-full rounded bg-[--el-color-primary]"
        :style="{ transform: `translateX(${value / max * 100 - 100}%)` }"
      />
    </div>
    <ElTooltip
      :visible="!isOutside"
      :content="tooltipContent"
      placement="top"
      virtual-triggering
      :virtual-ref="triggerRef"
    />
    <div
      class="absolute inset-0 opacity-0 hover:opacity-100"
      :class="{ '!opacity-100': scrubbing }"
    >
      <slot :pending-value="pendingValue" :position="`${Math.max(0, Math.min(elementX, elementWidth))}px`" />
    </div>
  </div>
</template>
