<template>
  <view class="notification-list">
    <view v-for="item in notifications" :key="item.id" class="item" @click="handleClick(item)">
      <view class="title">{{ item.title }}</view>
      <view class="content">{{ item.content }}</view>
      <view class="time">{{ formatDateTime(item.createdAt) }}</view>
      <view v-if="!item.isRead" class="unread">未读</view>
    </view>
    <empty-state v-if="notifications.length === 0 && !loading" text="暂无通知" />
    <view v-if="loading" class="loading">加载中...</view>
    <!-- <view v-if="noMore" class="no-more">没有更多了</view> -->
  </view>
</template>

<script setup>
  import {
    ref,
    onMounted
  } from 'vue';
  import {
    getNotifications,
    markAsRead
  } from '@/api/notification';
  import {
    formatDateTime
  } from '@/utils/format';
  import EmptyState from '@/components/EmptyState.vue';

  const notifications = ref([]);
  const page = ref(1);
  const limit = 20;
  const loading = ref(false);
  const noMore = ref(false);

  const load = async (reset = false) => {
    if (loading.value) return;
    loading.value = true;
    try {
      const res = await getNotifications({
        page: page.value,
        limit
      });
      const newData = res.data || res;
      if (reset) {
        notifications.value = newData;
      } else {
        notifications.value.push(...newData);
      }
      if (newData.length < limit) {
        noMore.value = true;
      } else {
        page.value++;
      }
    } catch (err) {
      console.error('加载通知失败', err);
    } finally {
      loading.value = false;
    }
  };

  const handleClick = async (item) => {
    if (!item.isRead) {
      await markAsRead(item.id);
      item.isRead = true;
    }
    if (item.link) uni.navigateTo({
      url: item.link
    });
  };

  onMounted(() => {
    load(true);
  });
</script>

<style scoped>
  .notification-list {
    padding: 0 24rpx;
  }

  .item {
    background: #ffffff;
    border: 1px solid #f0f2f5;
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 18rpx;
  }

  .title {
    font-size: 30rpx;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 10rpx;
  }

  .content {
    font-size: 26rpx;
    color: #475569;
    margin-bottom: 12rpx;
  }

  .time {
    font-size: 22rpx;
    color: #94a3b8;
  }

  .unread {
    background: #ef4444;
    color: #fff;
    font-size: 20rpx;
    padding: 2rpx 12rpx;
    border-radius: 20rpx;
    margin-left: 12rpx;
  }

  .loading,
  .no-more {
    text-align: center;
    padding: 20rpx;
    font-size: 24rpx;
    color: #94a3b8;
  }
</style>