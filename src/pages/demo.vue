<script lang="ts" setup>
import { onMounted } from 'vue'
import { init } from '~/composables/live2dInit'
import { draw } from '~/composables/tip'

onMounted(() => {
  nextTick(() => {
    init()
    draw()
  })
})
</script>

<template>
  <div>
    <canvas id="canvas_view" />
  </div>
</template>

<style scoped>

</style>
