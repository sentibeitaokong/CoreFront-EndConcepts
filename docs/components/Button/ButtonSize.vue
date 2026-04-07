<script setup>
</script>
<template>
  <div class="button-example">
    <div class="button-row">
      <vk-button type="primary" size="small">small</vk-button>
      <vk-button >Default</vk-button>
      <vk-button type="success" size="large">large</vk-button>
    </div>
  </div>
</template>

<style scoped>
.button-example {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.button-row > * {
  margin: 0;
}
</style>