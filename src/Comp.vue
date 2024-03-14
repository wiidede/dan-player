<script setup lang="ts">
defineProps<{
  name: string
}>()
</script>

<template>
  <p class="v-comp-text">
    hello <strong>{{ name }}</strong>
  </p>
</template>

<style scoped>

</style>
