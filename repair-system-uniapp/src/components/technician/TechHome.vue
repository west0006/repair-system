<template>
  <view>
    <!-- 欢迎卡片 -->
    <view class="card hero-tech">
      <view class="row">

        <view class="status-pill" :class="techStatus === 1 ? 'status-run' : 'status-wait'">
          {{ techStatus === 1 ? '空闲' : '忙碌' }}
        </view>
      </view>
      <view class="metrics-grid">
        <view class="metric-card">
          <text class="metric-label">未完成</text>
          <text class="metric-value">{{ stats.current }}</text>
        </view>
        <view class="metric-card">
          <text class="metric-label">待处理</text>
          <text class="metric-value">{{ stats.pending }}</text>
        </view>
        <view class="metric-card">
          <text class="metric-label">已完成</text>
          <text class="metric-value">{{ stats.completed }}</text>
        </view>
        <view class="metric-card">
          <text class="metric-label">平均评分</text>
          <text class="metric-value">{{ stats.avgScore?stats.avgScore+"分":"暂无" }}</text>
        </view>
        <view class="metric-card">
          <text class="metric-label">平均响应</text>
          <text class="metric-value">{{ stats.avgResponse ? stats.avgResponse+"分钟":"暂无"}}</text>
        </view>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="action-grid">
      <view class="action-tile" @click="toPendingOrders">
        <text class="action-title">待接工单</text>
        <text class="action-desc">查看新派单</text>
      </view>
      <view class="action-tile" @click="toMyOrders">
        <text class="action-title">我的工单</text>
        <text class="action-desc">管理进行中工单</text>
      </view>

      <view class="action-tile action-strong" @click="toRepair">
        <text class="action-title">我要报修</text>
        <text class="action-desc">填写故障信息，快速报修</text>
      </view>

    </view>

    <!-- 最近工单 -->
    <view class="card" v-if="recentOrders.length">
      <view class="section-title">最近工单</view>
      <view class="section-stack">
        <view v-for="order in recentOrders" :key="order.id" class="list-item" @click="toOrderDetail(order.id)">
          <view class="row">
            <text class="name">{{ order.orderNo }}</text>
            <text :class="'status-' + order.status" class="pill">{{ statusText[order.status] }}</text>
          </view>
          <view class="meta-row">
            <text>{{ order.faultType }}</text>
            <text>{{ order.userName }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
  import {
    ref,
    onMounted
  } from 'vue'
  import {
    getTechnicianOrders
  } from '@/api/order'
  import {
    getTechnicianStats
  } from '@/api/technician'
  import {
    useUserStore
  } from '@/store/user'
  import {
    http
  } from '@/utils/request'
  import {
    OrderStatus,
    statusText
  } from '@/utils/constants'

  const userStore = useUserStore()
  const techStatus = ref(1)
  const stats = ref({
    current: 0,
    pending: 0,
    completed: 0,
    avgScore: 0,
    avgResponse: 0,
  })
  const recentOrders = ref([])

  const fetchData = async () => {
    try {
      const techInfo = await http.get('/technician/profile')
      techStatus.value = techInfo.status

      const orders = await getTechnicianOrders()
      const current = orders.filter(o => [OrderStatus.DISPATCHED, OrderStatus.ACCEPTED, OrderStatus.ON_WAY,
        OrderStatus.REPAIRING, OrderStatus.WAITING_PARTS
      ].includes(o.status)).length
      const pending = orders.filter(o => o.status === OrderStatus.DISPATCHED).length
      const completed = orders.filter(o => o.status === OrderStatus.COMPLETED).length

      const techStats = await getTechnicianStats()

      stats.value = {
        current,
        pending,
        completed,
        avgScore: techStats.avgScore,
        avgResponse: techStats.avgResponseMinutes || 0,
      }

      stats.value.avgResponse = techStats.avgResponseMinutes
      recentOrders.value = orders.slice(0, 3)
    } catch (err) {
      console.error(err)
    }
  }

  const toPendingOrders = () => uni.navigateTo({
    url: '/pages/technician/tabbar?tab=orders&filter=pending'
  })
  const toRepair = () => uni.navigateTo({
    url: '/pages/user/repairForm'
  })
  const toMyOrders = () => uni.navigateTo({
    url: '/pages/technician/tabbar?tab=orders'
  })
  const toMaterialApply = () => uni.navigateTo({
    url: '/pages/technician/materialApply'
  })
  const toOrderDetail = (id) => uni.navigateTo({
    url: `/pages/technician/orderDetail?id=${id}`
  })

  onMounted(() => {
    fetchData()

    // 新增：请求师傅端订阅消息授权
    uni.requestSubscribeMessage({
      tmplIds: [
        'yq3uejcDX0ASu5XaBU8S2gwUQFcfl9yGr1dSOTQVujY', // 服务派单通知
      ],
      success: (res) => {
        console.log('师傅端订阅结果', res)
      }
    })
  })
</script>

<style scoped>
  .tech-home {
    padding: 30rpx;
    background: transparent;
    min-height: 100vh;
  }

  .welcome-card {
    background: #0f766e;
    border-radius: 24rpx;
    padding: 40rpx;
    margin-bottom: 40rpx;
    color: #fff;
  }

  .greeting {
    font-size: 40rpx;
    font-weight: 700;
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
    background: #ffffff;
    border: 1px solid #f0f2f5;
    border-radius: 24rpx;
    padding: 40rpx 20rpx;
    text-align: center;
    transition: background-color 0.2s;
  }

  .menu-item:active {
    background: #f8fafc;
  }

  .menu-icon {
    font-size: 64rpx;
    display: block;
    margin-bottom: 20rpx;
  }

  .menu-text {
    font-size: 32rpx;
    font-weight: 700;
    color: #1e293b;
    display: block;
    margin-bottom: 8rpx;
  }

  .menu-desc {
    font-size: 24rpx;
    color: #64748b;
  }
</style>