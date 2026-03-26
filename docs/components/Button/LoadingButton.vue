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