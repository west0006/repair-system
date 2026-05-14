<template>
  <view class="repair-record">
    <!-- 维修内容卡片 -->
    <view class="form-card">
      <view class="card-title">维修内容 <text class="star">*</text></view>
      <textarea v-model="repairContent" placeholder="请详细填写维修内容（如更换零件、检修步骤等）" class="repair-textarea"
        :class="{ 'error': errors.repairContent }" maxlength="500" />
      <view v-if="errors.repairContent" class="error-tip">请填写维修内容</view>
      <view class="char-count">{{ repairContent.length }}/500</view>
    </view>

    <!-- 更换配件卡片 -->
    <view class="form-card">
      <view class="card-title">更换配件</view>
      <view v-for="(item, idx) in materials" :key="idx" class="material-item">
        <picker @change="(e) => onMaterialChange(e, idx)" :range="materialList" range-key="name"
          :value="item.materialIndex">
          <view class="material-picker" :class="{ 'error': item.quantity <= 0 && item.materialIndex !== undefined }">
            {{ materialList[item.materialIndex]?.name || '请选择配件' }}
          </view>
        </picker>
        <input v-model.number="item.quantity" type="number" placeholder="数量" class="material-quantity"
          :class="{ 'error': item.quantity <= 0 && item.materialIndex !== undefined }" />
        <text class="delete-btn" @click="removeMaterial(idx)">删除</text>
      </view>
      <button class="add-btn" @click="addMaterial">+ 添加配件</button>
      <view v-if="materialsError" class="error-tip">请完善配件信息（名称和有效数量）</view>
    </view>

    <!-- 维修后照片卡片 -->
    <view class="form-card">
      <view class="card-title">维修后照片 <text class="star">*</text></view>
      <image-uploader v-model="afterPhotos" :max="6" />
      <view v-if="errors.afterPhotos" class="error-tip">请至少上传一张维修后照片</view>
      <view class="subtle">支持jpg/png格式，最多6张</view>
    </view>

    <!-- 提交按钮 -->
    <button class="submit-btn" @click="submit" :loading="submitting">完成维修</button>
  </view>
</template>

<script setup>
  import {
    ref,
    onMounted,
    computed
  } from 'vue';
  import {
    onLoad
  } from '@dcloudio/uni-app';
  import {
    completeOrder
  } from '@/api/order';
  import {
    updateTechnicianStatus
  } from '@/api/technician';
  import {
    getMaterialList
  } from '@/api/material';
  import ImageUploader from '@/components/ImageUploader.vue';

  // 数据
  const repairContent = ref('');
  const materials = ref([{
    materialIndex: 0,
    quantity: 1
  }]);
  const afterPhotos = ref([]);
  const orderId = ref(null);
  const submitting = ref(false);
  const errors = ref({
    repairContent: false,
    afterPhotos: false
  });
  const materialList = ref([]);

  // 配件错误提示
  const materialsError = computed(() => {
    return materials.value.some(item => {
      return item.materialIndex !== undefined && materialList.value[item.materialIndex] && (!item.quantity ||
        item.quantity <= 0);
    });
  });

  // 获取物料列表
  const fetchMaterials = async () => {
    try {
      const res = await getMaterialList({
        limit: 999
      });
      materialList.value = res.data || res;
    } catch (err) {
      console.error('获取物料列表失败', err);
      uni.showToast({
        title: '加载物料失败',
        icon: 'none'
      });
    }
  };

  // 获取工单ID
  onLoad((options) => {
    if (options.orderId) {
      orderId.value = parseInt(options.orderId);
    } else {
      uni.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => uni.navigateBack(), 1500);
    }
  });

  onMounted(() => {
    fetchMaterials();
  });

  // 添加配件
  const addMaterial = () => {
    materials.value.push({
      materialIndex: 0,
      quantity: 1
    });
  };

  // 删除配件
  const removeMaterial = (idx) => {
    materials.value.splice(idx, 1);
  };

  // 物料选择变化
  const onMaterialChange = (e, idx) => {
    materials.value[idx].materialIndex = e.detail.value;
    // 清除对应错误样式
    if (materials.value[idx].quantity <= 0) {
      materials.value[idx].quantity = 1;
    }
  };

  // 表单验证
  const validate = () => {
    let isValid = true;

    // 1. 维修内容验证
    if (!repairContent.value.trim()) {
      errors.value.repairContent = true;
      isValid = false;
    } else {
      errors.value.repairContent = false;
    }

    // 2. 维修后照片验证（至少一张）
    if (afterPhotos.value.length === 0) {
      errors.value.afterPhotos = true;
      isValid = false;
    } else {
      errors.value.afterPhotos = false;
    }

    // 3. 配件验证：如果选择了物料但数量无效，提示
    if (materialsError.value) {
      isValid = false;
    }

    return isValid;
  };

  // 提交维修记录
  const submit = async () => {
    if (submitting.value) return;

    if (!validate()) {
      let msg = '';
      if (errors.value.repairContent) msg = '请填写维修内容';
      else if (errors.value.afterPhotos) msg = '请至少上传一张维修后照片';
      else if (materialsError.value) msg = '请完善配件信息（数量和名称）';
      uni.showToast({
        title: msg || '请完整填写表单',
        icon: 'none'
      });
      return;
    }

    if (!orderId.value) {
      uni.showToast({
        title: '工单ID无效',
        icon: 'none'
      });
      return;
    }

    submitting.value = true;

    // 构造提交数据：提取物料名称和数量（仅选取了物料且数量>0的）
    const materialsData = materials.value
      .filter(item => item.materialIndex !== undefined && materialList.value[item.materialIndex] && item.quantity >
        0)
      .map(item => ({
        name: materialList.value[item.materialIndex].name,
        quantity: item.quantity
      }));

    const data = {
      repairContent: repairContent.value.trim(),
      materials: materialsData,
      afterPhotos: afterPhotos.value
    };

    try {
      await completeOrder(orderId.value, data);
      await updateTechnicianStatus(1); // 空闲
      uni.showToast({
        title: '维修完成',
        icon: 'success'
      });
      setTimeout(() => uni.navigateBack(), 1500);
    } catch (err) {
      console.error(err);
      uni.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      });
    } finally {
      submitting.value = false;
    }
  };
</script>

<style scoped>
  .repair-record {
    padding: 30rpx;
    background: transparent;
    min-height: 100vh;
  }

  .form-card {
    background: #ffffff;
    border: 1px solid #f0f2f5;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
  }

  .card-title {
    font-size: 32rpx;
    font-weight: 700;
    margin-bottom: 20rpx;
    border-left: 8rpx solid #0f766e;
    padding-left: 20rpx;
    color: #1e293b;
  }

  .repair-textarea {
    width: 100%;
    min-height: 200rpx;
    border: 1px solid #e2e8f0;
    border-radius: 16rpx;
    padding: 24rpx;
    font-size: 28rpx;
    box-sizing: border-box;
    background: #ffffff;
  }

  .repair-textarea.error {
    border-color: #ef4444;
  }

  .error-tip {
    font-size: 24rpx;
    color: #ef4444;
    margin-top: 10rpx;
  }

  .material-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 20rpx;
  }

  .material-picker {
    flex: 2;
    border: 1px solid #e2e8f0;
    border-radius: 12rpx;
    padding: 20rpx;
    font-size: 28rpx;
    background: #ffffff;
  }

  .material-quantity {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 12rpx;
    padding: 20rpx;
    font-size: 28rpx;
    background: #ffffff;
  }

  .add-btn {
    background: #f8fafc;
    border: 1px dashed #0f766e;
    border-radius: 48rpx;
    color: #0f766e;
    font-size: 28rpx;
    padding: 20rpx;
    margin-top: 10rpx;
  }

  .submit-btn {
    background: #0f766e;
    color: #fff;
    border-radius: 48rpx;
    font-size: 32rpx;
    padding: 28rpx;
    margin-top: 20rpx;
    margin-bottom: 60rpx;
    border: none;
    width: 100%;
  }

  .star {
    color: #ef4444;
    margin-left: 8rpx;
  }

  .char-count {
    text-align: right;
    font-size: 24rpx;
    color: #94a3b8;
    margin-top: 8rpx;
  }

  .subtle {
    font-size: 24rpx;
    color: #64748b;
    margin-top: 12rpx;
  }
</style>