<template>
  <view>
    <!-- 年月筛选器 -->
    <view class="row" style="padding: 20rpx 24rpx;">
      <picker mode="date" fields="month" :value="selectedYearMonth" @change="onMonthChange">
        <view class="filter-chip">{{ selectedYearMonth || '选择年月' }} ▼</view>
      </picker>
    </view>

    <scroll-view scroll-y class="notif-list" @scrolltolower="loadMore" refresher-enabled @refresherrefresh="onRefresh">
      <view v-for="item in filteredNotifs" :key="item.id" class="list-item" @click="handleClick(item)">
        <view class="row">
          <text class="title">{{ item.title }}</text>
          <view v-if="!item.isRead" class="badge">新</view>
        </view>
        <text class="desc">{{ item.content }}</text>
        <view class="meta-row">
          <text class="time">{{ formatDateTime(item.createdAt) }}</text>
        </view>
      </view>
      <empty-state v-if="filteredNotifs.length === 0 && !loading" text="暂无通知" />
      <view v-if="loading" class="loading">加载中...</view>
      <view v-if="noMore" class="no-more">没有更多了</view>
    </scroll-view>
  </view>
</template>

<script setup>
  import {
    ref,
    computed,
    onMounted
  } from 'vue'
  import {
    getNotifications,
    markAsRead
  } from '@/api/notification'
  import {
    formatDateTime
  } from '@/utils/format'
  import {
    useI18n
  } from 'vue-i18n'
  import EmptyState from '@/components/EmptyState.vue'

  const {
    t
  } = useI18n()
  const allNotifs = ref([])
  const loading = ref(false)
  const noMore = ref(false)
  const page = ref(1)
  const limit = 20
  const selectedYearMonth = ref('')

  const loadNotifs = async (reset = false) => {
    if (loading.value) return
    loading.value = true
    try {
      const res = await getNotifications({
        page: page.value,
        limit
      })
      const newData = res.data || res
      if (reset) allNotifs.value = newData
      else allNotifs.value.push(...newData)
      noMore.value = newData.length < limit
      if (!noMore.value) page.value++
    } catch (err) {
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const filteredNotifs = computed(() => {
    if (!selectedYearMonth.value) return allNotifs.value
    return allNotifs.value.filter(n => n.createdAt.startsWith(selectedYearMonth.value))
  })

  const onMonthChange = (e) => {
    selectedYearMonth.value = e.detail.value
  }
  const onRefresh = () => {
    page.value = 1
    loadNotifs(true)
  }
  const loadMore = () => {
    if (!noMore.value && !loading.value) loadNotifs()
  }
  const handleClick = async (item) => {
    if (!item.isRead) {
      await markAsRead(item.id)
      item.isRead = true
    }
    if (item.link) uni.navigateTo({
      url: item.link
    })
  }
  onMounted(() => loadNotifs(true))
</script>

<style scoped>
  .notif-list {
    height: calc(100vh - 160rpx);
    padding: 0 0 20rpx;
  }

  .badge {
    background: #f97316;
    color: #fff;
    border-radius: 32rpx;
    padding: 4rpx 16rpx;
    font-size: 22rpx;
  }
</style>