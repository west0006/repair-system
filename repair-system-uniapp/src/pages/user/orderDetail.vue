<template>
  <view class="order-detail">
    <view class="status-bar" :class="'status-bg-' + order.status">
      <text>{{ t('status.' + order.status) }}</text>
    </view>

    <view class="info-card">
      <view class="section-title">{{ t('order.basic_info') }}</view>
      <view class="row"><text>{{ t('order.order_no') }}：</text><text>{{ order.orderNo }}</text></view>
      <view class="row"><text>{{ t('order.fault_type') }}：</text><text>{{ order.faultType }}</text></view>
      <view class="row">
        <text>{{ t('repair.urgency') }}：</text>
        <text :class="'urgency-text-' + order.urgency">{{ urgencyMap[order.urgency] }}</text>
      </view>
      <view class="row">
        <text>{{ t('order.location') }}：</text>
        <text>{{ order.locationBuilding }}{{ order.locationFloor }}{{ order.locationRoom }}</text>
      </view>
      <view class="row">
        <text>{{ t('order.technician') }}：</text>
        <text>{{ order.technician?.user?.name || order.technicianName || t('order.unassigned') }}</text>
      </view>
    </view>

    <!-- 故障描述卡片 -->
    <view class="info-card">
      <view class="section-title">{{ t('order.fault_desc') }}</view>
      <view class="desc-content">{{ order.faultDesc }}</view>
      <view class="image-list" v-if="order.images?.length">
        <image v-for="img in order.images" :key="img" :src="img" mode="aspectFill" @click="previewImage(img)" />
      </view>
    </view>

    <!-- 物料账单卡片 -->
    <view class="info-card" v-if="order.material_bill && order.material_bill.length">
      <view class="section-title">{{ t('order.material_bill') }}</view>
      <view v-for="item in order.material_bill" :key="item.material_id" class="bill-row">
        <text>{{ item.material_name }}</text>
        <text>{{ item.quantity }} × ¥{{ item.unit_price }}</text>
        <text>{{ (item.discount * 10).toFixed(1) }}折</text>
        <text class="bill-amount">¥{{ (item.unit_price * item.quantity * item.discount).toFixed(2) }}</text>
      </view>


      <view v-if="order.material_bill_status === 1" class="bill-status-tip">
        <text class="pay-warning">{{ t('order.bill_reviewing') }}</text>
      </view>

      <button v-if="order.material_bill_status === 2" class="pay-btn" @click="handlePay" :loading="paying">
        {{ t('order.pay_now') }}
      </button>

      <view v-else-if="order.material_bill_status === 3" class="pay-success-tip">{{ t('order.paid_waiting') }}</view>
      <view v-else-if="order.material_bill_status === 4" class="pay-free-tip">{{ t('order.free_repair') }}</view>
    </view>

    <!-- 维修记录卡片 -->
    <view class="info-card" v-if="order.repairRecord">
      <view class="section-title">{{ t('order.repair_record') }}</view>
      <view class="row">
        <text>{{ t('order.repair_content') }}：</text><text>{{ order.repairRecord.repairContent }}</text>
      </view>
      <view class="row" v-if="order.repairRecord.materials?.length">
        <text>{{ t('order.replaced_parts') }}：</text>
        <text v-for="m in order.repairRecord.materials" :key="m.name">{{ m.name }}×{{ m.quantity }} </text>
      </view>
      <view class="image-list" v-if="order.afterPhotos?.length">
        <image v-for="img in order.afterPhotos" :key="img" :src="img" mode="aspectFill" @click="previewImage(img)" />
      </view>
    </view>

    <!-- 评价卡片 -->
    <view class="info-card evaluate-card" v-if="order.status === 8 && !order.evaluationScore">
      <view class="section-title">{{ t('order.evaluate_service') }}</view>
      <view class="stars">
        <text v-for="i in 5" :key="i" @click="score = i" class="star-icon">{{ i <= score ? '★' : '☆' }}</text>
      </view>
      <textarea v-model="comment" :placeholder="t('order.comment_placeholder')" maxlength="200" class="comment-input" />
      <view class="char-count">{{ comment.length }}/200</view>
      <button class="submit-eval" @click="submitEvaluate" :loading="submitting">{{ t('order.submit_eval') }}</button>
    </view>
  </view>
</template>

<script setup>
  import {
    ref,
    computed
  } from 'vue'
  import {
    onLoad
  } from '@dcloudio/uni-app'
  import {
    useI18n
  } from 'vue-i18n'
  import {
    getOrderDetail,
    evaluateOrder,
    payMaterialBill
  } from '@/api/order'
  import {
    OrderStatus
  } from '@/utils/constants'

  const {
    t
  } = useI18n()

  const order = ref({})
  let orderId = null
  const score = ref(0)
  const comment = ref('')
  const paying = ref(false)
  const submitting = ref(false)

  const urgencyMap = {
    1: t('order.urgency_general'),
    2: t('order.urgency_urgent'),
    3: t('order.urgency_critical')
  }

  // 计算当前步骤（用于步骤条高亮）
  const step = computed(() => {
    if (!order.value.id) return 1
    if (order.value.status === OrderStatus.PENDING || order.value.status === OrderStatus.APPROVED) return 1
    if ([OrderStatus.DISPATCHED, OrderStatus.ACCEPTED].includes(order.value.status)) return 2
    if ([OrderStatus.ON_WAY, OrderStatus.REPAIRING, OrderStatus.WAITING_PARTS, OrderStatus.AWAITING_PAYMENT]
      .includes(order.value.status)) return 3
    if (order.value.material_bill_status !== undefined && order.value.material_bill_status !== 0) return 4
    if (order.value.material_bill_status === 2) return 5
    if (order.value.status === OrderStatus.COMPLETED && !order.value.evaluationScore) return 6
    if (order.value.status === OrderStatus.COMPLETED && order.value.evaluationScore) return 7
    return 1
  })

  const loadOrder = async () => {
    order.value = await getOrderDetail(orderId);
  };

  const handlePay = async () => {
    paying.value = true
    try {
      await payMaterialBill(orderId)
      uni.showToast({
        title: t('order.pay_success'),
        icon: 'success'
      })
      //支付成功后再次请求授权，确保后续通知能收到
      uni.requestSubscribeMessage({
        tmplIds: [
          '3GREsjBgAnEl_Zzwy8LhYVvUOcV3cZIceZ1vTRDZPfc', // 支付成功通知
          'MBqBQha-AJxBW6Gne4FNbkBmF-ld5XlysMv4dUeOLUs', // 服务评价提醒
          'mVtYMTsEZsjooCJxKnfJIWX4VaG7vInoMoC8TytCZBQ', // 拒单通知
        ],
        success: (res) => {
          console.log('支付后订阅结果', res)
        }
      })

      loadOrder()
    } catch (err) {
      uni.showToast({
        title: t('order.pay_failed'),
        icon: 'none'
      })
    } finally {
      paying.value = false
    }
  }

  const submitEvaluate = async () => {
    if (score.value === 0) {
      uni.showToast({
        title: t('order.select_score'),
        icon: 'none'
      })
      return
    }
    submitting.value = true
    try {
      await evaluateOrder(orderId, score.value, comment.value)
      uni.showToast({
        title: t('order.eval_success'),
        icon: 'success'
      })
      loadOrder()
    } catch (err) {
      uni.showToast({
        title: t('order.eval_failed'),
        icon: 'none'
      })
    } finally {
      submitting.value = false
    }
  }

  const previewImage = (url) => {
    uni.previewImage({
      urls: [url]
    });
  };

  onLoad((options) => {
    if (options.id) {
      orderId = parseInt(options.id);
      loadOrder();
    }
  });
</script>

<style scoped>
  /* 原有样式全部替换为以下扁平版本 */
  .order-detail {
    padding: 30rpx;
    background: transparent;
    min-height: 100vh;
    padding-bottom: 120rpx;
  }

  .status-bar {
    background: #ffffff;
    border: 1px solid #f0f2f5;
    padding: 20rpx;
    text-align: center;
    border-radius: 16rpx;
    margin-bottom: 20rpx;
    font-weight: 600;
  }

  /* 状态背景色单独保留 */
  .status-bg-1 {
    background: #fef3c7;
    color: #92400e;
  }

  .status-bg-2 {
    background: #dbeafe;
    color: #1e40af;
  }

  .status-bg-3 {
    background: #dbeafe;
    color: #1e40af;
  }

  .status-bg-4 {
    background: #d1fae5;
    color: #065f46;
  }

  .status-bg-5 {
    background: #fef3c7;
    color: #92400e;
  }

  .status-bg-6 {
    background: #fee2e2;
    color: #991b1b;
  }

  .status-bg-7 {
    background: #dbeafe;
    color: #1e40af;
  }

  .status-bg-8 {
    background: #d1fae5;
    color: #065f46;
  }

  .status-bg-9 {
    background: #fee2e2;
    color: #991b1b;
  }

  .steps {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    border: 1px solid #f0f2f5;
    border-radius: 48rpx;
    padding: 20rpx 30rpx;
    margin-bottom: 20rpx;
    flex-wrap: wrap;
  }

  .step {
    font-size: 26rpx;
    color: #94a3b8;
  }

  .step.active {
    color: #0f766e;
    font-weight: 600;
  }

  .step.done {
    color: #0f766e;
  }

  .step-line {
    width: 60rpx;
    height: 2rpx;
    background: #e2e8f0;
    margin: 0 20rpx;
  }

  .info-card {
    background: #ffffff;
    border: 1px solid #f0f2f5;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
  }

  .section-title {
    font-size: 32rpx;
    font-weight: 700;
    margin-bottom: 20rpx;
    border-left: 8rpx solid #0f766e;
    padding-left: 20rpx;
    color: #1e293b;
  }

  .row {
    margin-bottom: 20rpx;
    font-size: 28rpx;
    display: flex;
    flex-wrap: wrap;
  }

  .row text:first-child {
    width: 160rpx;
    color: #64748b;
  }

  .urgency-text-1 {
    color: #2563eb;
  }

  .urgency-text-2 {
    color: #d97706;
  }

  .urgency-text-3 {
    color: #dc2626;
  }

  .desc-content {
    font-size: 28rpx;
    color: #334155;
    line-height: 1.5;
  }

  .image-list {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
    margin-top: 20rpx;
  }

  .image-list image {
    width: 200rpx;
    height: 200rpx;
    border-radius: 12rpx;
  }

  /* 物料账单行 */
  .bill-row {
    display: flex;
    justify-content: space-between;
    padding: 12rpx 0;
    border-bottom: 1px solid #f0f2f5;
    font-size: 28rpx;
  }

  .bill-amount {
    font-weight: 600;
    color: #0f766e;
  }

  .bill-total {
    margin-top: 20rpx;
    text-align: right;
    font-size: 28rpx;
    color: #1e293b;
  }

  .pay-amount {
    font-size: 32rpx;
    font-weight: 700;
    color: #0f766e;
    margin-top: 10rpx;
    display: block;
  }

  .bill-status-tip {
    margin-top: 20rpx;
    text-align: center;
  }

  .pay-warning {
    color: #d97706;
    font-size: 28rpx;
  }

  .pay-btn {
    background: #0f766e;
    color: #fff;
    border-radius: 48rpx;
    margin-top: 30rpx;
    font-size: 32rpx;
    padding: 24rpx;
    border: none;
    width: 100%;
  }

  .pay-success-tip {
    text-align: center;
    margin-top: 20rpx;
    font-size: 28rpx;
    color: #065f46;
  }

  .pay-free-tip {
    text-align: center;
    margin-top: 20rpx;
    font-size: 28rpx;
    color: #64748b;
  }

  /* 评价卡片 */
  .evaluate-card {
    margin-top: 20rpx;
  }

  .stars {
    display: flex;
    gap: 20rpx;
    margin-bottom: 20rpx;
  }

  .star-icon {
    font-size: 48rpx;
    color: #f59e0b;
  }

  .comment-input {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 16rpx;
    padding: 20rpx;
    min-height: 150rpx;
    font-size: 28rpx;
    box-sizing: border-box;
  }

  .char-count {
    text-align: right;
    font-size: 24rpx;
    color: #64748b;
    margin: 8rpx 0 20rpx;
  }

  .submit-eval {
    background: #0f766e;
    color: #fff;
    border-radius: 48rpx;
    font-size: 32rpx;
    padding: 24rpx;
    border: none;
    width: 100%;
  }
</style>