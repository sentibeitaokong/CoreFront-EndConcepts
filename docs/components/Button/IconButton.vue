<script setup>
import {faSearch} from "@fortawesome/free-solid-svg-icons";
import {faSearchPlus} from "@fortawesome/free-solid-svg-icons";
import {faAngleDoubleRight} from "@fortawesome/free-solid-svg-icons";
import {faShuttleVan} from "@fortawesome/free-solid-svg-icons";
import {faSyncAlt} from "@fortawesome/free-solid-svg-icons";
import {faAddressCard} from "@fortawesome/free-solid-svg-icons";
</script>
<template>
  <div class="button-example">
    <div class="button-row">
      <vk-button  circle :icon="faSearch" ></vk-button>
      <vk-button type="primary" circle :icon="faSearchPlus"></vk-button>
      <vk-button type="success" circle :icon="faAngleDoubleRight"></vk-button>
      <vk-button type="info" circle  :icon="faShuttleVan"></vk-button>
      <vk-button type="warning" circle :icon="faSyncAlt"></vk-button>
      <vk-button type="danger" circle :icon="faAddressCard"></vk-button>
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