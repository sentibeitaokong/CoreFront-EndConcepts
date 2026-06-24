<script setup>
import { ref } from 'vue'
import {faUser} from "@fortawesome/free-solid-svg-icons";

const test = ref('')
</script>
<template>
  <vk-input v-model="test" placeholder="prepend append">
    <template #prepend>Https://</template>
    <template #append>.com</template>
  </vk-input>

  <vk-input v-model="test" placeholder="prefix suffix">
    <template #prefix>
      <vk-icon :icon="faUser" />
    </template>
    <template #suffix>
      <vk-icon :icon="faUser" />
    </template>
  </vk-input>
</template>