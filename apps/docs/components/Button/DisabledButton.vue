<script setup>
</script>
<template>
  <div class="button-example">
    <div class="button-row">
      <vk-button disabled>Default</vk-button>
      <vk-button type="primary" disabled>Primary</vk-button>
      <vk-button type="success" disabled>Success</vk-button>
      <vk-button type="info" disabled>Info</vk-button>
      <vk-button type="warning" disabled>Warning</vk-button>
      <vk-button type="danger" disabled>Danger</vk-button>
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