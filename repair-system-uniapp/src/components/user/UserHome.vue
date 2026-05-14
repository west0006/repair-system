<template>
  <view>
    <view class="card broadcast-card">
      <view class="broadcast-header">
        <text class="eyebrow">{{ t('home.daily_tips_title') }}</text>
        <text class="subtle" @click="toFaqList">{{ t('home.view_all') }}</text>
      </view>
      <swiper class="broadcast-swiper" autoplay circular interval="4000" vertical>
        <swiper-item v-for="(faq, idx) in faqList" :key="idx" @click="toFaqList">
          <text class="desc">{{ faq.solution }}</text>
        </swiper-item>
      </swiper>
      <view v-if="faqList.length === 0" class="empty">{{ t('home.no_tips') }}</view>
    </view>

    <view class="metrics-grid">
      <view class="metric-card" v-for="stat in stats" :key="stat.key">
        <text class="metric-label">{{ stat.label }}</text>
        <text class="metric-value">{{ stat.value }}</text>
      </view>
    </view>

    <view class="action-grid">
      <view class="action-tile action-strong" @click="toRepair">
        <text class="action-title">{{ t('home.quick_repair') }}</text>
        <text class="action-desc">{{ t('home.quick_repair_desc') }}</text>
      </view>
    </view>

    <view class="card" v-if="recentOrders.length">
      <view class="section-title">{{ t('home.recent_orders') }}</view>
      <view class="section-stack">
        <view v-for="order in recentOrders" :key="order.id" class="list-item" @click="toOrderDetail(order.id)">
          <view class="row">
            <text class="name">{{ order.orderNo }}</text>
            <text :class="'status-' + order.status" class="pill">{{ t('status.' + order.status) }}</text>
          </view>
          <view class="meta-row">
            <text>{{ translateFaultType(order.faultType) }}</text>

            <text>{{ order.locationBuilding }} {{ order.locationFloor }} {{ order.locationRoom }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
  import {
    ref,
    onMounted,
    computed
  } from 'vue'
  import {
    useI18n
  } from 'vue-i18n'
  import {
    getUserOrders
  } from '@/api/order'
  import {
    OrderStatus,
    faultTypeI18nMap
  } from '@/utils/constants'

  const {
    tm,
    t
  } = useI18n()

  const faqList = ref([])

  // 加载 FAQ 列表（随机取5条，或全部）
  const fetchFaqTips = async () => {
    try {
      const res = await getFaqList()
      const allFaqs = res.data || res
      // 随机打乱并取前5条展示
      const shuffled = allFaqs.sort(() => 0.5 - Math.random())
      faqList.value = shuffled.slice(0, 5)
    } catch (err) {
      console.error('获取 FAQ 失败', err)
    }
  }

  const toFaqList = () => {
    uni.navigateTo({
      url: '/pages/faq/list'
    })
  }
  const stats = ref([{
      key: 'total',
      label: t('home.total_orders'),
      value: 0
    },
    {
      key: 'pending',
      label: t('home.in_progress'),
      value: 0
    },
    {
      key: 'waiting',
      label: t('home.waiting_accept'),
      value: 0
    }
  ])

  const recentOrders = ref([])


  const translateFaultType = (type) => {
    const key = faultTypeI18nMap[type]
    const translated = key ? t(key) : type
    return translated
  }

  const fetchStats = async () => {
    try {
      const orders = await getUserOrders()
      const total = orders.length
      const pending = orders.filter(o => [OrderStatus.PENDING, OrderStatus.APPROVED, OrderStatus.DISPATCHED,
        OrderStatus.ACCEPTED, OrderStatus.ON_WAY, OrderStatus.REPAIRING, OrderStatus.WAITING_PARTS, OrderStatus
        .AWAITING_PAYMENT
      ].includes(o.status)).length
      const waiting = orders.filter(o => o.status === OrderStatus.DISPATCHED).length
      stats.value = [{
          key: 'total',
          label: t('home.total_orders'),
          value: total
        },
        {
          key: 'pending',
          label: t('home.in_progress'),
          value: pending
        },
        {
          key: 'waiting',
          label: t('home.waiting_accept'),
          value: waiting
        }
      ]
      recentOrders.value = orders.slice(0, 3)
    } catch (err) {
      console.error(err)
    }
  }

  const toRepair = () => uni.navigateTo({
    url: '/pages/user/repairForm'
  })
  const toOrderDetail = (id) => uni.navigateTo({
    url: `/pages/user/orderDetail?id=${id}`
  })

  onMounted(() => {
    fetchFaqTips()
    fetchStats()
  })
</script>

<style scoped>
  .user-home {
    padding: 30rpx;
    background: transparent;
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
    color: #1e293b;
  }

  .name {
    font-weight: 700;
    color: #0f766e;
  }

  .stats-card {
    background: #0f766e;
    color: #fff;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 40rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .menu-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30rpx;
  }

  .menu-item {
    background: #ffffff;
    border: 1px solid #eef0f3;
    border-radius: 24rpx;
    padding: 40rpx 0;
    text-align: center;
    transition: background-color 0.2s;
  }

  .menu-item:active {
    background: #f8fafc;
  }

  .menu-item text {
    display: block;
    margin-top: 20rpx;
    font-size: 28rpx;
    color: #1e293b;
  }
</style>