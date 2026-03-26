<script setup>
import Button from "@/components/Button";
</script>
<template>
  <div class="button-example">
    <div class="button-row">
      <Button>Default</Button>
      <Button type="primary">Primary</Button>
      <Button type="success">Success</Button>
      <Button type="info">Info</Button>
      <Button type="warning">Warning</Button>
      <Button type="danger">Danger</Button><br /><br />
    </div>
    <div class="button-row">
      <Button  plain>Plain</Button>
      <Button type="primary" plain>Primary</Button>
      <Button type="success" plain>Success</Button>
      <Button type="info" plain>Info</Button>
      <Button type="warning" plain>Warning</Button>
      <Button type="danger" plain>Danger</Button><br /><br />
    </div>
    <div class="button-row">
      <Button  round>round</Button>
      <Button type="primary" round>Primary</Button>
      <Button type="success" round>Success</Button>
      <Button type="info" round>Info</Button>
      <Button type="warning" round>Warning</Button>
      <Button type="danger" round>Danger</Button><br /><br />
    </div>
    <div class="button-row">
      <Button  circle icon="fa-search" ></Button>
      <Button type="primary" circle icon="fa-search-plus"></Button>
      <Button type="success" circle icon="fa-angle-double-right"></Button>
      <Button type="info" circle  icon="fa-shuttle-van"></Button>
      <Button type="warning" circle icon="fa-sync-alt"></Button>
      <Button type="danger" circle icon="address-card"></Button><br /><br />
    </div>
  </div>
</template>