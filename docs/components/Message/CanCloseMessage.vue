<template>
  <div class="flex flex-wrap gap-1">
    <vk-button  @click="openSuccess" type="success">Success</vk-button>
    <vk-button  @click="openInfo" type="info">Info</vk-button>
    <vk-button  @click="openWarning" type="warning">Warning</vk-button>
    <vk-button  @click="openDanger" type="danger">Danger</vk-button>
    <vk-button  @click="openNoAutoClose">Won't close automatically</vk-button>
  </div>
</template>
<script lang="ts" setup>
import {createMessage} from "xb-element";

const openSuccess = () => {
  createMessage({message:'This is a message.',type:"success",showClose:true,duration:3000})
}

const openInfo = () => {
  createMessage({message:'This is a message.',type:"info",showClose:true,duration:3000})
}

const openWarning = () => {
  createMessage({message:'This is a message.',type:"warning",showClose:true,duration:3000})
}

const openDanger= () => {
  createMessage({message:'This is a message.',type:"danger",showClose:true,duration:3000})
}

const openNoAutoClose= () => {
  createMessage({message:'Oops, this is a message that does not automatically close.',type:"info",showClose:true,duration:0})
}


</script>
