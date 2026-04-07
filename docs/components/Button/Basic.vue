<script setup>

</script>
<template>
  <div class="button-example">
    <div class="button-row">
      <vk-button>Default</vk-button>
      <vk-button type="primary">Primary</vk-button>
      <vk-button type="success">Success</vk-button>
      <vk-button type="info">Info</vk-button>
      <vk-button type="warning">Warning</vk-button>
      <vk-button type="danger">Danger</vk-button>
    </div>
    <div class="button-row">
      <vk-button  plain>Plain</vk-button>
      <vk-button type="primary" plain>Primary</vk-button>
      <vk-button type="success" plain>Success</vk-button>
      <vk-button type="info" plain>Info</vk-button>
      <vk-button type="warning" plain>Warning</vk-button>
      <vk-button type="danger" plain>Danger</vk-button>
    </div>
    <div class="button-row">
      <vk-button  round>round</vk-button>
      <vk-button type="primary" round>Primary</vk-button>
      <vk-button type="success" round>Success</vk-button>
      <vk-button type="info" round>Info</vk-button>
      <vk-button type="warning" round>Warning</vk-button>
      <vk-button type="danger" round>Danger</vk-button>
    </div>
    <div class="button-row">
      <vk-button  circle icon="fa-search" ></vk-button>
      <vk-button type="primary" circle icon="fa fa-search-plus"></vk-button>
      <vk-button type="success" circle icon="fa fa-angle-double-right"></vk-button>
      <vk-button type="info" circle  icon="fa-shuttle-van"></vk-button>
      <vk-button type="warning" circle icon="fa-sync-alt"></vk-button>
      <vk-button type="danger" circle icon="address-card"></vk-button>
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