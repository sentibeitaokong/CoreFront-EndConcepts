<script setup>
</script>
<template>
  <div class="button-example">
    <div class="button-row">
      <vk-button   icon="fa-search" >search</vk-button>
      <vk-button type="primary"  icon="fa-search-plus"></vk-button>
      <vk-button type="success"  icon="fa-angle-double-right"></vk-button>
      <vk-button type="info"   icon="fa-shuttle-van"></vk-button>
      <vk-button type="warning"  icon="fa-sync-alt"></vk-button>
      <vk-button type="danger"  icon="address-card"></vk-button>
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