<template>
  <view class="user-home">
    <view class="header">
      <view class="greeting">
        <text>您好，</text>
        <text class="name">{{ userStore.userInfo?.name }}</text>
      </view>
      <uni-icons type="bell" size="22" color="#666" @click="toNotifications" />
    </view>

    <view class="stats-card" v-if="pendingCount > 0" @click="toMyOrders">
      <text>您有 {{ pendingCount }} 个工单进行中</text>
      <uni-icons type="arrowright" size="16" color="#fff" />
    </view>

    <view class="menu-grid">
      <view class="menu-item" v-for="item in menus" :key="item.text" @click="item.route">
        <uni-icons :type="item.icon" size="24" color="#07c160" />
        <text>{{ item.text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { getUserOrders } from '@/api/order'

const userStore = useUserStore()
const pendingCount = ref(0)

const menus = [
  { text: '我要报修', icon: 'compose', route: () => uni.navigateTo({ url: '/pages/user/repairForm' }) },
  { text: '报修记录', icon: 'list', route: () => uni.navigateTo({ url: '/pages/user/orderList' }) },
  { text: '通知', icon: 'bell', route: () => uni.navigateTo({ url: '/pages/notification/list' }) },
  { text: '个人中心', icon: 'person', route: () => uni.navigateTo({ url: '/pages/user/profile' }) },
]

const toNotifications = () => {
  uni.navigateTo({ url: '/pages/notification/list' })
}
const toMyOrders = () => {
  uni.navigateTo({ url: '/pages/user/orderList' })
}

const fetchPendingCount = async () => {
  try {
    const orders = await getUserOrders()
    pendingCount.value = orders.filter(o => [1,2,3,4,5,6].includes(o.status)).length
  } catch (err) {
    console.error('获取工单数失败', err)
  }
}

onMounted(() => {
  fetchPendingCount()
})
</script>

<style scoped>
.user-home {
  padding: 30rpx;
  background: #f5f5f5;
  min-height: 100vh;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}
.greeting {
  font-size: 32rpx;
  color: #333;
}
.name {
  font-weight: bold;
  color: #07c160;
}
.stats-card {
  background: #07c160;
  color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.menu-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30rpx;
}
.menu-item {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx 0;
  text-align: center;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);
  transition: transform 0.2s;
}
.menu-item:active {
  transform: scale(0.96);
}
.menu-item text {
  display: block;
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #333;
}
</style>