<template>
  <div class="flex flex-wrap gap-1">
    <Button class="!ml-0"  @click="open">
      Show message
    </Button>
    <Button class="!ml-0" @click="openVn">VNode</Button>
  </div>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import {createMessage} from "@/components/Message/method";
import Button from "@/components/Button";

const open = () => {
  createMessage({message:'This is a message.'})
}

const openVn = () => {
  createMessage({
    message: h('p', { style: 'line-height: 1; font-size: 14px' }, [
      h('span', null, 'Message can be '),
      h('i', { style: 'color: teal' }, 'VNode'),
    ]),
  })
}
</script>
