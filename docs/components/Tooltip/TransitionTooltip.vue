<template>
  <Tooltip content="I am an tooltip" transition="slide-fade">
    <Button>trigger me</Button>
  </Tooltip>
</template>

<script lang="ts" setup>
import Tooltip from '@/components/Tooltip/Tooltip.vue'
import Button from "@/components/Button";
</script>

<style>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(120px);
  opacity: 0;
}
</style>