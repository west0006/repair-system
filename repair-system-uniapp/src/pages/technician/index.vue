<template>
  <view class="pending-orders">
    <!-- 筛选栏 -->
    <scroll-view scroll-x class="filter-scroll">
      <view class="filter-row">
        <view class="filter-chip" :class="{ active: selectedArea === '' }" @click="setArea('')">全部</view>
        <view class="filter-chip" v-for="b in buildings" :key="b.value" :class="{ active: selectedArea === b.value }"
          @click="setArea(b.value)">{{ b.label }}</view>
      </view>
    </scroll-view>

    <scroll-view scroll-y class="order-list" @scrolltolower="loadMore" refresher-enabled @refresherrefresh="onRefresh"
      :refresher-triggered="refreshing">
      <view v-for="order in orders" :key="order.id" class="order-card" @click="toDetail(order.id)">
        <view class="card-header">
          <text class="no">{{ order.orderNo }}</text>
          <text class="urgency" :class="'urgency-' + order.urgency">{{ urgencyMap[order.urgency] }}</text>
        </view>
        <view class="card-body">
          <text class="type">{{ order.faultType }}</text>
          <text class="location">{{ order.locationBuilding }} {{ order.locationFloor }} {{ order.locationRoom }}</text>
        </view>
        <view class="card-footer">
          <text class="desc">{{ order.faultDesc }}</text>
          <view class="actions">
            <button class="accept" @click.stop="accept(order.id)">接单</button>
            <button class="reject" @click.stop="reject(order.id)">拒单</button>
          </view>
        </view>
      </view>
      <empty-state v-if="orders.length === 0 && !loading" text="暂无待接单工单" />
      <view v-if="loading" class="loading">加载中...</view>
      <view v-if="noMore" class="no-more">没有更多了</view>
    </scroll-view>
  </view>
</template>

<script setup>
  import {
    ref,
    onMounted
  } from 'vue';
  import {
    getPendingOrders,
    acceptOrder,
    rejectOrder
  } from '@/api/order';
  import {
    getBuildingList
  } from '@/api/building';
  import {
    updateTechnicianStatus
  } from '@/api/technician';
  import EmptyState from '@/components/EmptyState.vue';

  const orders = ref([]);
  const buildings = ref([]);
  const selectedArea = ref('');
  const loading = ref(false);
  const refreshing = ref(false);
  const noMore = ref(false);
  const page = ref(1);
  const limit = 10;
  const urgencyMap = {
    1: '一般',
    2: '紧急',
    3: '特急'
  };

  const loadOrders = async (reset = false) => {
    if (loading.value) return;
    loading.value = true;
    try {
      const params = {
        area: selectedArea.value || undefined,
        page: page.value,
        limit
      };
      const res = await getPendingOrders(params);
      const newData = res.data || res;
      if (reset) orders.value = newData;
      else orders.value.push(...newData);
      if (newData.length < limit) noMore.value = true;
      else page.value++;
    } catch (err) {
      console.error(err);
    } finally {
      loading.value = false;
      refreshing.value = false;
    }
  };

  const setArea = (area) => {
    selectedArea.value = area;
    page.value = 1;
    noMore.value = false;
    loadOrders(true);
  };

  const onRefresh = () => {
    refreshing.value = true;
    page.value = 1;
    noMore.value = false;
    loadOrders(true);
  };

  const loadMore = () => {
    if (!noMore.value && !loading.value) loadOrders();
  };

  const accept = async (id) => {
    try {
      await acceptOrder(id);
      await updateTechnicianStatus(2); // 师傅状态变为忙碌
      uni.showToast({
        title: '接单成功'
      });
      // 刷新待接单列表
      page.value = 1;
      noMore.value = false;
      loadOrders(true);
    } catch (err) {
      uni.showToast({
        title: '接单失败',
        icon: 'none'
      });
    }
  };

  const reject = (id) => {
    uni.showModal({
      title: '拒单原因',
      content: '请输入拒单原因',
      editable: true,
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            await rejectOrder(id, res.content);
            uni.showToast({
              title: '已拒单'
            });
            page.value = 1;
            noMore.value = false;
            loadOrders(true);
          } catch (err) {
            uni.showToast({
              title: '操作失败',
              icon: 'none'
            });
          }
        }
      }
    });
  };

  const toDetail = (id) => {
    uni.navigateTo({
      url: `/pages/technician/orderDetail?id=${id}`
    });
  };

  onMounted(async () => {
    const res = await getBuildingList();
    buildings.value = (res.data || res).map(b => ({
      label: b.name,
      value: b.name
    }));
    loadOrders(true);
  });
</script>

<style scoped>
  /* 样式复用之前的 pending-orders 样式 */
  .pending-orders {
    background: #f5f7fb;
    min-height: 100vh;
  }

  .filter-scroll {
    white-space: nowrap;
    background: #fff;
    padding: 20rpx 30rpx;
    border-bottom: 1px solid #eee;
  }

  .filter-row {
    display: inline-flex;
    gap: 20rpx;
  }

  .filter-chip {
    display: inline-block;
    padding: 10rpx 24rpx;
    border-radius: 40rpx;
    background: #f0f0f0;
    font-size: 26rpx;
    color: #666;
  }

  .filter-chip.active {
    background: #07c160;
    color: #fff;
  }

  .order-list {
    padding: 20rpx;
    height: calc(100vh - 100rpx);
  }

  .order-card {
    background: #fff;
    border-radius: 24rpx;
    margin-bottom: 20rpx;
    overflow: hidden;
  }

  .card-header {
    padding: 30rpx 30rpx 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .no {
    font-weight: bold;
    font-size: 28rpx;
  }

  .urgency {
    padding: 4rpx 12rpx;
    border-radius: 20rpx;
    font-size: 22rpx;
  }

  .urgency-1 {
    background: #e6f7ff;
    color: #1890ff;
  }

  .urgency-2 {
    background: #fff7e6;
    color: #ffa500;
  }

  .urgency-3 {
    background: #fff1f0;
    color: #f5222d;
  }

  .card-body {
    padding: 20rpx 30rpx;
    display: flex;
    justify-content: space-between;
  }

  .type {
    font-size: 28rpx;
    color: #333;
  }

  .location {
    font-size: 24rpx;
    color: #999;
  }

  .card-footer {
    background: #fafafa;
    padding: 20rpx 30rpx;
    border-top: 1px solid #f0f0f0;
  }

  .desc {
    font-size: 24rpx;
    color: #666;
    display: block;
    margin-bottom: 20rpx;
  }

  .actions {
    display: flex;
    gap: 20rpx;
  }

  .actions button {
    flex: 1;
    height: 70rpx;
    line-height: 70rpx;
    font-size: 28rpx;
    border-radius: 40rpx;
  }

  .accept {
    background: #07c160;
    color: #fff;
  }

  .reject {
    background: #f0f0f0;
    color: #f5222d;
  }

  .loading,
  .no-more {
    text-align: center;
    padding: 20rpx;
    font-size: 24rpx;
    color: #999;
  }
</style>