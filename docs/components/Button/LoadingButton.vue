<script setup>
import Button from "@/components/Button";
</script>
<template>
  <div class="button-example">
    <div class="button-row">
      <Button  loading>Loading</Button>
      <Button  loading type="primary">Loading</Button>
      <Button  loading type="success">Loading</Button>
      <Button  loading type="info">Loading</Button>
      <Button  loading type="warning">Loading</Button>
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