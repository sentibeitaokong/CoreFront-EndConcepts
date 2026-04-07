<script setup>
</script>
<template>
  <div class="button-example">
    <div class="button-row">
      <vk-button  loading>Loading</vk-button>
      <vk-button  loading type="primary">Loading</vk-button>
      <vk-button  loading type="success">Loading</vk-button>
      <vk-button  loading type="info">Loading</vk-button>
      <vk-button  loading type="warning">Loading</vk-button>
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