<template>
  <view class="chat-detail-page">
    <chat-room :orderId="orderId" :otherUserId="otherUserId" :otherRole="otherRole" />
  </view>
</template>

<script setup>
  import {
    ref
  } from 'vue'
  import {
    onLoad
  } from '@dcloudio/uni-app'
  import ChatRoom from '@/components/ChatRoom.vue'

  const orderId = ref(null)
  const otherUserId = ref(null)
  const otherRole = ref(null)

  onLoad((options) => {
    if (options.orderId) orderId.value = parseInt(options.orderId)
    if (options.userId) otherUserId.value = parseInt(options.userId)
    if (options.role) otherRole.value = parseInt(options.role)
  })
</script>

<style scoped>
  .chat-detail-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
</style>