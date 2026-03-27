<script setup>
import Button from "@/components/Button";
</script>
<template>
  <div class="button-example">
    <div class="button-row">
      <Button disabled>Default</Button>
      <Button type="primary" disabled>Primary</Button>
      <Button type="success" disabled>Success</Button>
      <Button type="info" disabled>Info</Button>
      <Button type="warning" disabled>Warning</Button>
      <Button type="danger" disabled>Danger</Button>
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