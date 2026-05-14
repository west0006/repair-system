<template>
  <view class="evaluation container">
    <view class="form-card">
      <view class="section-title">{{ t('evaluation.title') }}</view>
      <view class="order-info">
        <text class="label">{{ t('evaluation.order_no') }}</text>
        <text>{{ order.orderNo }}</text>
      </view>
      <view class="order-info">
        <text class="label">{{ t('evaluation.repair_content') }}</text>
        <text>{{ order.faultType }} - {{ order.faultDesc }}</text>
      </view>

      <view class="score-section">
        <text class="score-label">{{ t('evaluation.score') }}</text>
        <view class="stars">
          <text v-for="i in 5" :key="i" @click="score = i" class="star-icon">{{ i <= score ? '★' : '☆' }}</text>
        </view>
      </view>

      <view class="comment-section">
        <textarea v-model="comment" :placeholder="t('evaluation.comment_placeholder')" maxlength="200"
          class="comment-input" />
        <view class="char-count">{{ comment.length }}/200</view>
      </view>

      <button class="submit-btn" @click="submit" :loading="submitting">{{ t('evaluation.submit') }}</button>
    </view>
  </view>
</template>

<script setup>
  import {
    ref,
    onMounted
  } from 'vue'
  import {
    useRoute
  } from 'vue-router'
  import {
    useI18n
  } from 'vue-i18n'
  import {
    getOrderDetail,
    evaluateOrder
  } from '@/api/order'

  const {
    t
  } = useI18n()
  const route = useRoute()
  const order = ref({})
  const score = ref(0)
  const comment = ref('')
  const submitting = ref(false)

  const loadOrder = async () => {
    const id = route.query.id
    if (!id) {
      uni.showToast({
        title: t('common.error'),
        icon: 'none'
      })
      setTimeout(() => uni.navigateBack(), 1500)
      return
    }
    try {
      order.value = await getOrderDetail(id)
      if (order.value.evaluationScore) {
        uni.showToast({
          title: t('order.already_evaluated'),
          icon: 'none'
        })
        setTimeout(() => uni.navigateBack(), 1500)
      }
    } catch (err) {
      uni.showToast({
        title: t('common.error'),
        icon: 'none'
      })
    }
  }

  const submit = async () => {
    if (score.value === 0) {
      uni.showToast({
        title: t('order.select_score'),
        icon: 'none'
      })
      return
    }
    submitting.value = true
    try {
      await evaluateOrder(order.value.id, score.value, comment.value)
      uni.showToast({
        title: t('evaluation.success'),
        icon: 'success'
      })
      setTimeout(() => uni.navigateBack(), 1500)
    } catch (err) {
      uni.showToast({
        title: t('evaluation.failed'),
        icon: 'none'
      })
    } finally {
      submitting.value = false
    }
  }

  onMounted(loadOrder)
</script>

<style scoped>
  .evaluation {
    padding: 30rpx;
    background: transparent;
  }

  .form-card {
    background: #ffffff;
    border: 1px solid #f0f2f5;
    border-radius: 28rpx;
    padding: 28rpx;
  }

  .section-title {
    font-size: 36rpx;
    font-weight: 700;
    margin-bottom: 30rpx;
    text-align: center;
    color: #0f766e;
  }

  .order-info {
    background: #f8fafc;
    border-radius: 20rpx;
    padding: 20rpx;
    margin-bottom: 20rpx;
    font-size: 28rpx;
    line-height: 1.5;
  }

  .label {
    font-weight: 600;
    color: #1e293b;
    margin-right: 16rpx;
  }

  .score-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 30rpx 0 20rpx;
  }

  .score-label {
    font-size: 32rpx;
    font-weight: 600;
  }

  .stars {
    display: flex;
    gap: 20rpx;
  }

  .star-icon {
    font-size: 48rpx;
    color: #f59e0b;
  }

  .comment-section {
    margin: 20rpx 0;
  }

  .comment-input {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 20rpx;
    padding: 20rpx;
    min-height: 180rpx;
    font-size: 28rpx;
    box-sizing: border-box;
    background: #ffffff;
  }

  .char-count {
    text-align: right;
    font-size: 24rpx;
    color: #64748b;
    margin-top: 8rpx;
  }

  .submit-btn {
    background: #0f766e;
    color: #fff;
    border-radius: 48rpx;
    font-size: 32rpx;
    padding: 24rpx;
    margin-top: 30rpx;
    border: none;
    width: 100%;
  }
</style>