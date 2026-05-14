<template>
  <view class="material-apply">
    <view class="form-card">
      <view class="section-title">申领物料</view>
      <view v-for="(item, idx) in items" :key="idx" class="material-item">
        <picker @change="(e) => onMaterialChange(e, idx)" :range="materials" range-key="name">
          <view class="picker">{{ materials[item.materialIndex]?.name || '请选择物料' }}</view>
        </picker>
        <input v-model="item.quantity" type="number" placeholder="数量" class="quantity-input" />
        <text class="delete-btn" @click="items.splice(idx,1)">删除</text>
      </view>
      <button class="add-btn" @click="addItem">+ 添加物料</button>
      <textarea v-model="reason" placeholder="申领原因（可选）" class="reason-input" />
      <button class="submit-btn" @click="submit">提交申请</button>
    </view>
  </view>
</template>

<script setup>
  import {
    ref,
    onMounted
  } from 'vue';
  import {
    onLoad
  } from '@dcloudio/uni-app';
  import {
    getMaterialList,
    applyMaterial
  } from '@/api/material';
  import {
    updateOrderStatus
  } from '@/api/order'
  import {
    OrderStatus
  } from '@/utils/constants'

  let Id = null;
  const materials = ref([]);
  const items = ref([{
    materialIndex: 0,
    quantity: 1
  }]);
  const reason = ref('');

  onLoad((options) => {
    if (options.orderId) {
      Id = parseInt(options.orderId);
    }
  });

  onMounted(async () => {
    // 获取全量物料（设置较大的limit）
    const res = await getMaterialList({
      limit: 999
    });
    materials.value = res.data || res;
  });

  const onMaterialChange = (e, idx) => {
    items.value[idx].materialIndex = e.detail.value;
  };

  const addItem = () => {
    items.value.push({
      materialIndex: 0,
      quantity: 1
    });
  };

  const submit = async () => {
    const orderId = Id;
    if (!orderId) {
      uni.showToast({
        title: '缺少工单ID',
        icon: 'none'
      });
      return;
    }
    const payload = {
      orderId: parseInt(orderId),
      items: items.value.map(item => ({
        materialId: materials.value[item.materialIndex]?.id,
        quantity: item.quantity
      })).filter(i => i.materialId),
      reason: reason.value
    };
    if (payload.items.length === 0) {
      uni.showToast({
        title: '请选择物料',
        icon: 'none'
      });
      return;
    }
    try {
      await applyMaterial(payload);
      await updateOrderStatus(orderId, OrderStatus.WAITING_PARTS);
      uni.showToast({
        title: '申领已提交，等待审批',
        icon: 'success'
      });
      setTimeout(() => uni.navigateBack(), 1500);
    } catch (err) {
      console.error(err);
      uni.showToast({
        title: '提交失败',
        icon: 'none'
      });
    }
  };
</script>

<style scoped>
  .material-apply {
    padding: 30rpx;
    background: transparent;
    min-height: 100vh;
  }

  .form-card {
    background: #ffffff;
    border: 1px solid #f0f2f5;
    border-radius: 24rpx;
    padding: 30rpx;
  }

  .section-title {
    font-size: 32rpx;
    font-weight: 700;
    margin-bottom: 30rpx;
    color: #1e293b;
  }

  .material-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 20rpx;
  }

  .picker {
    flex: 2;
    border: 1px solid #e2e8f0;
    border-radius: 12rpx;
    padding: 20rpx;
    font-size: 28rpx;
    background: #ffffff;
  }

  .quantity-input {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 12rpx;
    padding: 20rpx;
    font-size: 28rpx;
    background: #ffffff;
  }

  .delete-btn {
    color: #ef4444;
    font-size: 28rpx;
    padding: 10rpx;
  }

  .add-btn {
    background: #f8fafc;
    color: #0f766e;
    border: 1px dashed #0f766e;
    border-radius: 48rpx;
    padding: 20rpx;
    margin: 20rpx 0;
    font-size: 28rpx;
  }

  .reason-input {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 12rpx;
    padding: 20rpx;
    min-height: 150rpx;
    margin: 20rpx 0;
    font-size: 28rpx;
    background: #ffffff;
  }

  .submit-btn {
    background: #0f766e;
    color: #fff;
    border-radius: 48rpx;
    padding: 24rpx;
    font-size: 32rpx;
    border: none;
    width: 100%;
  }
</style>