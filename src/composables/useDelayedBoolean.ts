import type { MaybeRefOrGetter, Ref } from 'vue'
import { getCurrentScope, onScopeDispose, ref, toRef, watch } from 'vue'

export interface UseDelayedBooleanOptions {
  delayOnTrue?: number
  delayOnFalse?: number
}

export function useDelayedBoolean(
  source: MaybeRefOrGetter<boolean>,
  options: UseDelayedBooleanOptions = {},
): Ref<boolean> {
  const { delayOnTrue = 0, delayOnFalse = 0 } = options
  const sourceRef = toRef(source)
  const delayed = ref(sourceRef.value)

  let timer: ReturnType<typeof setTimeout> | null = null

  const cleanup = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  watch(sourceRef, (value) => {
    cleanup()
    const delay = value ? delayOnTrue : delayOnFalse
    if (delay > 0)
      timer = setTimeout(() => delayed.value = value, delay)
    else
      delayed.value = value
  })

  if (getCurrentScope())
    onScopeDispose(cleanup)

  return delayed
}
