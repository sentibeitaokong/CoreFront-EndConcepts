<template>
  <div class="flex flex-wrap gap-1">
    <Button  @click="openSuccess">Success</Button>
    <Button  @click="openInfo">Info</Button>
    <Button  @click="openWarning">Warning</Button>
    <Button  @click="openDanger">Danger</Button>
    <Button  @click="openNoAutoClose">Won't close automatically</Button>
  </div>
</template>
<script lang="ts" setup>
import {createMessage} from "@/components/Message/method";
import Button from "@/components/Button";

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
