<script setup>
import Button from "@/components/Button";
</script>
<template>
  <div class="button-example">
    <div class="button-row">
      <Button   icon="fa-search" >search</Button>
      <Button type="primary"  icon="fa-search-plus"></Button>
      <Button type="success"  icon="fa-angle-double-right"></Button>
      <Button type="info"   icon="fa-shuttle-van"></Button>
      <Button type="warning"  icon="fa-sync-alt"></Button>
      <Button type="danger"  icon="address-card"></Button>
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