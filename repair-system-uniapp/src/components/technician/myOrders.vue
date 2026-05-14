<template>
  <view>
    <view class="segment-bar">
      <view v-for="(opt, idx) in filterOptions" :key="opt.value" class="segment-item"
        :class="{ 'segment-item-active': currentFilter === opt.value }" @click="currentFilter = opt.value">
        {{ opt.label }}
      </view>
    </view>

    <scroll-view scroll-y class="order-list" @scrolltolower="loadMore" refresher-enabled @refresherrefresh="onRefresh"
      :refresher-triggered="refreshing">
      <view v-for="order in orders" :key="order.id" class="list-item" @click="toDetail(order.id)">
        <view class="row">
          <text class="name">{{ order.orderNo }}</text>
          <text :class="'status-' + order.status" class="pill">{{ statusText[order.status] }}</text>
        </view>
        <view class="meta-row">
          <text>{{ order.faultType }}</text>
          <text>{{ order.userName }}</text>
        </view>
        <view class="meta-row">
          <text class="subtle">{{ order.locationBuilding }} {{ order.locationFloor }} {{ order.locationRoom }}</text>
          <text :class="'urgency-' + order.urgency" class="pill">{{ urgencyMap[order.urgency] }}</text>
        </view>
      </view>
      <empty-state v-if="orders.length === 0 && !loading" text="暂无工单" />
      <view v-if="loading" class="loading">加载中...</view>
      <view v-if="noMore" class="no-more">没有更多了</view>
    </scroll-view>
  </view>
</template>

<script setup>
  import {
    ref,
    watch,
    onMounted
  } from 'vue'
  import {
    getTechnicianOrders
  } from '@/api/order'
  import EmptyState from '@/components/EmptyState.vue'
  import {
    OrderStatus,
    statusText
  } from '@/utils/constants'

  const orders = ref([])
  const allOrders = ref([])
  const loading = ref(false)
  const refreshing = ref(false)
  const noMore = ref(false)
  const page = ref(1)
  const limit = 10
  const currentFilter = ref('all')

  const filterOptions = [{
      label: '全部',
      value: 'all'
    },
    {
      label: '待处理',
      value: 'pending'
    }, // 状态=3
    {
      label: '待维修',
      value: 'repairing'
    }, // 状态=4,5,6,7
    {
      label: '已完成',
      value: 'completed'
    } // 状态=8
  ]

  const urgencyMap = {
    1: '一般',
    2: '紧急',
    3: '特急'
  }

  const loadAllOrders = async () => {
    loading.value = true
    try {
      const res = await getTechnicianOrders()
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
    if (currentFilter.value === 'pending') filtered = allOrders.value.filter(o => o.status === OrderStatus.DISPATCHED)
    else if (currentFilter.value === 'repairing') filtered = allOrders.value.filter(o => [OrderStatus.ACCEPTED,
      OrderStatus.ON_WAY, OrderStatus.REPAIRING, OrderStatus.WAITING_PARTS
    ].includes(o.status))
    else if (currentFilter.value === 'completed') filtered = allOrders.value.filter(o => o.status === OrderStatus
      .COMPLETED)

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
    loadAllOrders()
  }
  const toDetail = (id) => uni.navigateTo({
    url: `/pages/technician/orderDetail?id=${id}`
  })

  watch(currentFilter, () => {
    page.value = 1
    filterAndPaginate(true)
  })
  onMounted(loadAllOrders)
</script>

<style scoped>
  .order-list {
    height: calc(100vh - 140rpx);
    padding: 0 0 20rpx;
  }

  .segment-bar {
    margin: 20rpx 24rpx;
  }
</style>