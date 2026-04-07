<template>
  <div class="flex flex-wrap gap-1">
    <vk-button  @click="openSuccess" type="success">Success</vk-button>
    <vk-button  @click="openInfo" type="info">Info</vk-button>
    <vk-button  @click="openWarning" type="warning">Warning</vk-button>
    <vk-button  @click="openDanger" type="danger">Danger</vk-button>
  </div>
</template>
<script lang="ts" setup>
import {createMessage} from "xb-element";

const openSuccess = () => {
  createMessage({message:'This is a message.',type:"success"})
}

const openInfo = () => {
  createMessage({message:'This is a message.',type:"info"})
}

const openWarning = () => {
  createMessage({message:'This is a message.',type:"warning"})
}

const openDanger= () => {
  createMessage({message:'This is a message.',type:"danger"})
}


</script>
