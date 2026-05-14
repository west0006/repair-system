<template>
  <view class="container">
    <view v-if="currentTab === 'home'">
      <tech-home />
    </view>
    <view v-else-if="currentTab === 'orders'">
      <tech-order-list />
    </view>
    <view v-else-if="currentTab === 'messages'">
      <chat-contacts :role="1" />
    </view>
    <view v-else-if="currentTab === 'notices'">
      <notification-list />
    </view>
    <view v-else-if="currentTab === 'profile'">
      <tech-profile />
    </view>

    <custom-tab-bar :current-page="'/pages/technician/tabbar?tab=' + currentTab" />
  </view>
</template>

<script setup>
  import {
    ref
  } from 'vue'
  import {
    onLoad
  } from '@dcloudio/uni-app'
  import CustomTabBar from '@/components/CustomTabBar.vue'
  import TechHome from '@/components/technician/TechHome.vue'
  import TechOrderList from '@/components/technician/myOrders.vue'
  import ChatContacts from '@/components/ChatContacts.vue'
  import NotificationList from '@/components/NotificationList.vue'
  import TechProfile from '@/components/technician/profile.vue'

  const currentTab = ref('home')

  onLoad((options) => {
    if (options.tab && ['home', 'orders', 'messages', 'notices', 'profile'].includes(options.tab)) {
      currentTab.value = options.tab
    }
  })
</script>

<style scoped>
  .container {
    padding-bottom: 120rpx;
  }
</style>