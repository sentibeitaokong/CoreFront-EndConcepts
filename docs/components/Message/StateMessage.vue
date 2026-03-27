<template>
  <div class="flex flex-wrap gap-1">
    <Button  @click="openSuccess">Success</Button>
    <Button  @click="openInfo">Info</Button>
    <Button  @click="openWarning">Warning</Button>
    <Button  @click="openDanger">Danger</Button>
  </div>
</template>
<script lang="ts" setup>
import {createMessage} from "@/components/Message/method";
import Button from "@/components/Button";

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
