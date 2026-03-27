<template>
  <Tooltip content="I am an tooltip" :open-delay="1000" :close-delay="200" placement="right">
    <Button>delay trigger</Button>
  </Tooltip>
</template>

<script lang="ts" setup>
import Tooltip from '@/components/Tooltip/Tooltip.vue'
import Button from "@/components/Button";

</script>

<style>

</style>