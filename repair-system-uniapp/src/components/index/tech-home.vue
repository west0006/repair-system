<template>
  <view class="tech-home">
    <view class="welcome-card">
      <text class="greeting">师傅，您好</text>
      <text class="date">{{ currentDate }}</text>
    </view>

    <view class="menu-grid">
      <view class="menu-item" v-for="item in menus" :key="item.text" @click="item.route">
        <text class="menu-icon">{{ item.icon }}</text>
        <text class="menu-text">{{ item.text }}</text>
        <text class="menu-desc">{{ item.desc }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
  import {
    ref
  } from 'vue'

  const currentDate = ref(new Date().toLocaleDateString('zh-CN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }))

  const menus = [{
      text: '待接工单',
      icon: '📋',
      desc: '查看待处理工单',
      route: () => uni.navigateTo({
        url: '/pages/technician/index'
      })
    },
    {
      text: '材料申领',
      icon: '🔧',
      desc: '申请维修材料',
      route: () => uni.navigateTo({
        url: '/pages/technician/materialApply'
      })
    },
    {
      text: '我的工单',
      icon: '📝',
      desc: '查看历史工单',
      route: () => uni.navigateTo({
        url: '/pages/technician/myOrders'
      })
    },
    {
      text: '个人中心',
      icon: '👤',
      desc: '管理个人信息',
      route: () => uni.navigateTo({
        url: '/pages/technician/profile'
      })
    },
  ]
</script>

<style scoped>
  .tech-home {
    padding: 30rpx;
    background: #f5f7fb;
    min-height: 100vh;
  }

  .welcome-card {
    background: linear-gradient(135deg, #07c160 0%, #06a04f 100%);
    border-radius: 32rpx;
    padding: 40rpx;
    margin-bottom: 40rpx;
    color: #fff;
  }

  .greeting {
    font-size: 40rpx;
    font-weight: bold;
    display: block;
    margin-bottom: 16rpx;
  }

  .date {
    font-size: 28rpx;
    opacity: 0.9;
  }

  .menu-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30rpx;
  }

  .menu-item {
    background: #fff;
    border-radius: 32rpx;
    padding: 40rpx 20rpx;
    text-align: center;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
  }

  .menu-item:active {
    transform: scale(0.96);
    background: #f8f8f8;
  }

  .menu-icon {
    font-size: 64rpx;
    display: block;
    margin-bottom: 20rpx;
  }

  .menu-text {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    display: block;
    margin-bottom: 8rpx;
  }

  .menu-desc {
    font-size: 24rpx;
    color: #999;
  }
</style>