<template>
  <view>
    <scroll-view scroll-x class="tab-strip-nowrap">
      <view v-for="opt in statusOptions" :key="opt.value" class="tab-chip tab-chip-wide"
        :class="{ 'tab-chip-active': currentFilter === opt.value }" @click="currentFilter = opt.value">
        {{ opt.label }}
      </view>
    </scroll-view>

    <scroll-view ref="orderScrollRef" :scroll-top="scrollTop" scroll-y class="order-list" @scrolltolower="loadMore"
      refresher-enabled @refresherrefresh="onRefresh" :refresher-triggered="refreshing">
      <view v-for="order in orders" :key="order.id" class="list-item" @click="toDetail(order.id)">
        <view class="row">
          <text class="name">{{ order.orderNo }}</text>
          <text :class="'status-' + order.status" class="pill">{{ t('status.' + order.status) }}</text>
        </view>
        <view class="meta-row">
          <text>{{ order.faultType }}</text>
          <text>{{ order.locationBuilding }} {{ order.locationFloor }} {{ order.locationRoom }}</text>
        </view>
        <view class="meta-row">
          <text class="subtle">{{ t('order.report_time') }}：{{ formatDateTime(order.createdAt) }}</text>
          <text :class="'urgency-' + order.urgency" class="pill">{{ urgencyMap[order.urgency] }}</text>
        </view>
      </view>
      <empty-state v-if="orders.length === 0 && !loading" :text="t('order.no_orders')" :btnText="t('order.go_repair')"
        :onBtnClick="toRepair" />
      <view v-if="loading" class="loading">{{ t('common.loading') }}</view>
      <view v-if="noMore" class="no-more">{{ t('common.no_more') }}</view>
    </scroll-view>
  </view>
</template>

<script setup>
  import {
    ref,
    watch,
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
    formatDateTime
  } from '@/utils/format'
  import EmptyState from '@/components/EmptyState.vue'
  import {
    OrderStatus
  } from '@/utils/constants'

  const {
    t
  } = useI18n()

  const orders = ref([])
  const allOrders = ref([])
  const loading = ref(false)
  const refreshing = ref(false)
  const noMore = ref(false)
  const page = ref(1)
  const limit = 10
  const currentFilter = ref(0)
  const orderScrollRef = ref(null)
  const scrollTop = ref(0)

  const statusOptions = computed(() => [{
      label: t('order.all'),
      value: 0
    },
    {
      label: t('order.in_progress'),
      value: 1
    },
    {
      label: t('order.completed'),
      value: OrderStatus.COMPLETED
    },
    {
      label: t('order.cancelled'),
      value: OrderStatus.CANCELLED
    }
  ])

  const urgencyMap = {
    1: t('order.urgency_general'),
    2: t('order.urgency_urgent'),
    3: t('order.urgency_critical')
  }

  const loadAllOrders = async () => {
    loading.value = true
    try {
      const res = await getUserOrders()
      allOrders.value = res.data || res
      filterAndPaginate(true)
    } catch (err) {
      console.error(err)
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  const filterAndPaginate = (reset = false) => {
    let filtered = allOrders.value
    if (currentFilter.value === 1) filtered = allOrders.value.filter(o => [OrderStatus.PENDING, OrderStatus.APPROVED,
      OrderStatus.DISPATCHED, OrderStatus.ACCEPTED, OrderStatus.ON_WAY, OrderStatus.REPAIRING, OrderStatus
      .WAITING_PARTS, OrderStatus.AWAITING_PAYMENT
    ].includes(o.status))
    else if (currentFilter.value === OrderStatus.COMPLETED) filtered = allOrders.value.filter(o => o.status ===
      OrderStatus.COMPLETED)
    else if (currentFilter.value === OrderStatus.CANCELLED) filtered = allOrders.value.filter(o => o.status ===
      OrderStatus.CANCELLED)

    const start = (page.value - 1) * limit
    const end = start + limit
    const paged = filtered.slice(start, end)
    if (reset) orders.value = paged
    else orders.value.push(...paged)
    noMore.value = paged.length < limit || end >= filtered.length
  }

  const loadMore = () => {
    if (!noMore.value && !loading.value) {
      page.value++
      filterAndPaginate()
    }
  }
  const onRefresh = () => {
    refreshing.value = true
    page.value = 1
    scrollTop.value = 0 // 滚动到顶部
    loadAllOrders().finally(() => {
      refreshing.value = false
    })
  }
  const toDetail = (id) => uni.navigateTo({
    url: `/pages/user/orderDetail?id=${id}`
  })
  const toRepair = () => uni.navigateTo({
    url: '/pages/user/repairForm'
  })

  watch(currentFilter, () => {
    page.value = 1
    filterAndPaginate(true)
  })
  onMounted(loadAllOrders)
</script>

<style scoped>
  .order-list {
    height: calc(100vh - 200rpx);
    padding: 0 0 20rpx;
  }

  .tab-strip-nowrap {
    white-space: nowrap;
    padding: 16rpx 24rpx;
    background: #fff;
    border-bottom: 1rpx solid #e2e8f0;
  }

  .loading,
  .no-more {
    text-align: center;
    padding: 20rpx;
    font-size: 24rpx;
    color: #64748b;
  }
</style>