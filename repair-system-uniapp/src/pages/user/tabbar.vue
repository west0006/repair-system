<template>
  <view class="container">
    <!-- 根据URL参数显示对应内容 -->
    <view v-if="currentTab === 'home'">
      <user-home />
    </view>
    <view v-else-if="currentTab === 'orders'">
      <user-order-list />
    </view>
    <view v-else-if="currentTab === 'messages'">
      <chat-contacts :role="0" />
    </view>
    <view v-else-if="currentTab === 'notices'">
      <notification-list />
    </view>
    <view v-else-if="currentTab === 'profile'">
      <user-profile />
    </view>

    <!-- 自定义底部标签栏 -->
    <custom-tab-bar :current-page="'/pages/user/tabbar?tab=' + currentTab.value" />
  </view>
</template>

<script setup>
  import {
    onLoad
  } from '@dcloudio/uni-app'
  import {
    ref
  } from 'vue'
  import CustomTabBar from '@/components/CustomTabBar.vue'
  import UserHome from '@/components/user/UserHome.vue'
  import UserOrderList from '@/components/user/orderList.vue'
  import ChatContacts from '@/components/ChatContacts.vue'
  import NotificationList from '@/components/NotificationList.vue'
  import UserProfile from '@/components/user/profile.vue'

  const currentTab = ref('home')

  onLoad((options) => {
    // console.log(options)
    if (options.tab && ['home', 'orders', 'messages', 'notices', 'profile'].includes(options.tab)) {
      currentTab.value = options.tab
    }
    // console.log(currentTab.value)
  })
</script>

<style scoped>
  .container {
    padding-bottom: 120rpx;
  }
</style>