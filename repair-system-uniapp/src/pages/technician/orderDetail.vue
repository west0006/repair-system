<template>
  <view class="order-detail">
    <!-- 状态条 -->
    <view class="status-bar" :class="'status-bg-' + order.status">
      <text>{{ statusText[order.status] }}</text>
    </view>

    <!-- 步骤条（流式） -->
    <view class="steps" v-if="showSteps">
      <view class="step" :class="{ active: step >= 1, done: step > 1 }">1. 接单</view>
      <view class="step-line"></view>
      <view class="step" :class="{ active: step >= 2, done: step > 2 }">2. 维修中</view>
      <view class="step-line"></view>
      <view class="step" :class="{ active: step >= 3, done: step > 3 }">3. 物料账单</view>
      <view class="step-line" v-if="order.material_bill_status === 1"></view>
      <view class="step" v-if="order.material_bill_status === 1" :class="{ active: step >= 4, done: step > 4 }">
        4. 等待审批
      </view>
      <view class="step-line" v-if="order.material_bill_status !== 0 && order.status !== OrderStatus.COMPLETED"></view>
      <view class="step" v-if="order.material_bill_status !== 0 && order.status !== OrderStatus.COMPLETED"
        :class="{ active: step >= 5, done: step > 5 }">
        5. 完成维修
      </view>
    </view>

    <!-- 基本信息卡片 -->
    <view class="info-card">
      <view class="section-title">基本信息</view>
      <view class="row"><text>工单号：</text><text>{{ order.orderNo }}</text></view>
      <view class="row"><text>故障类型：</text><text>{{ order.faultType }}</text></view>
      <view class="row">
        <text>紧急程度：</text>
        <text :class="'urgency-text-' + order.urgency">{{ urgencyMap[order.urgency] }}</text>
      </view>
      <view class="row"><text>报修人：</text><text>{{ order.userName }} ({{ order.userPhone }})</text></view>
      <view class="row">
        <text>位置：</text>
        <text>{{ order.locationBuilding }}{{ order.locationFloor }}{{ order.locationRoom }}</text>
      </view>
      <view class="row">
        <text>预约时间：</text>
        <text>{{ formatDateTime(order.scheduledTime) || '未指定' }}</text>
      </view>
    </view>

    <!-- 故障描述卡片 -->
    <view class="info-card">
      <view class="section-title">故障描述</view>
      <view class="desc-content">{{ order.faultDesc }}</view>
      <view class="image-list" v-if="order.images?.length">
        <image v-for="img in order.images" :key="img" :src="img" mode="aspectFill" @click="previewImage(img)" />
      </view>
    </view>

    <!-- 物料账单卡片（已出单，只读） -->
    <view class="info-card" v-if="order.material_bill && order.material_bill.length">
      <view class="section-title">物料账单</view>
      <view v-for="item in order.material_bill" :key="item.material_id" class="bill-row">
        <text>{{ item.material_name }}</text>
        <text>{{ item.quantity }} × ¥{{ item.unit_price }}</text>
        <text>折扣: {{ (item.discount * 10).toFixed(1) }}折</text>
        <text class="bill-amount">¥{{ (item.unit_price * item.quantity * item.discount).toFixed(2) }}</text>
      </view>

      <view class="bill-status">
        <text v-if="order.material_bill_status === 2" class="pay-warning">⏳ 等待用户支付</text>
        <text v-else-if="order.material_bill_status === 3" class="pay-success">✅ 已支付，等待完成维修</text>
        <text v-else-if="order.material_bill_status === 4" class="pay-free">🆓 免费维修</text>
      </view>
    </view>

    <!-- 维修方式选择卡片（维修中且未出单时显示） -->
    <view class="info-card" v-if="order.status === OrderStatus.REPAIRING && !order.material_bill_status">
      <view class="section-title">维修方式</view>
      <view class="switch-row">
        <text class="switch-label">需要更换物料</text>
        <switch :checked="needMaterial" @change="onNeedMaterialChange" color="#07c160" />
      </view>
      <text class="subtle" style="margin-top: 12rpx">关闭后仅收取服务费（疏通类）</text>
    </view>

    <!-- 生成物料账单编辑卡片 -->
    <view class="info-card"
      v-if="order.status === OrderStatus.REPAIRING && !order.material_bill_status && needMaterial">
      <view class="section-title">编辑物料明细</view>
      <view v-for="(item, idx) in billItems" :key="idx" class="bill-edit-item">
        <picker @change="(e) => onMaterialSelect(e, idx)" :range="materialList" range-key="name">
          <view class="picker">{{ item.material_name || '选择物料' }}</view>
        </picker>
        <view class="material-meta" v-if="item.material_id">
          <text>库存: {{ item.stock }} {{ getMaterialUnit(item.material_id) }}</text>
          <text>进价: ¥{{ item.cost_price }}</text>
          <text>标准折扣: {{ (item.standard_discount * 10).toFixed(1) }}折</text>
        </view>
        <view class="bill-input-row">
          <input v-model.number="item.quantity" type="number" placeholder="数量" class="quantity-input" />
          <input v-model.number="item.unit_price" type="digit" placeholder="单价" class="price-input" />
          <input v-model.number="item.discount" type="digit" placeholder="折扣" class="discount-input" step="0.01" min="0"
            max="1" />
          <text class="delete-btn" @click="billItems.splice(idx, 1)">删除</text>
        </view>
      </view>
      <button class="add-btn" @click="addBillItem">+ 添加物料</button>
      <view class="bill-summary">
        <text>物料折后合计：¥{{ totalAmount.toFixed(2) }}</text>
        <input v-model.number="discount" type="digit" placeholder="整单折扣 (0-1)" class="discount-input-total" step="0.01"
          min="0" max="1" />
      </view>
    </view>

    <!-- 服务费编辑卡片 -->
    <view class="info-card" v-if="order.status === OrderStatus.REPAIRING && !order.material_bill_status">

      <view class="field" v-if="isDredgeType">
        <text class="field-label">服务费 (元)</text>
        <input v-model.number="serviceFee" type="digit" placeholder="0.00" class="service-input" />
        <text class="subtle">仅疏通类维修收取服务费，可填0</text>
      </view>
      <button class="submit-bill-btn" @click="submitBill">提交物料账单</button>
    </view>

    <!-- 维修记录卡片（如果有） -->
    <view class="info-card" v-if="order.repairRecord">
      <view class="section-title">维修记录</view>
      <view class="row"><text>维修内容：</text><text>{{ order.repairRecord.repairContent }}</text></view>
      <view class="row" v-if="order.repairRecord.materials?.length">
        <text>更换配件：</text>
        <text v-for="m in order.repairRecord.materials" :key="m.name">{{ m.name }}×{{ m.quantity }} </text>
      </view>
      <view class="image-list" v-if="order.afterPhotos?.length">
        <image v-for="img in order.afterPhotos" :key="img" :src="img" mode="aspectFill" @click="previewImage(img)" />
      </view>
    </view>

    <!-- 操作按钮组（流式） -->
    <view class="action-group" v-if="showActions">
      <button v-if="order.status === OrderStatus.DISPATCHED" class="btn-primary" @click="accept">接单</button>
      <button v-if="order.status === OrderStatus.DISPATCHED" class="btn-danger" @click="reject">拒单</button>
      <button v-if="order.status === OrderStatus.ACCEPTED" class="btn-primary"
        @click="updateStatus(OrderStatus.ON_WAY)">
        开始上门
      </button>
      <button v-if="order.status === OrderStatus.ON_WAY" class="btn-primary"
        @click="updateStatus(OrderStatus.REPAIRING)">
        开始维修
      </button>
      <button v-if="canComplete" class="btn-primary" :disabled="!canCompleteNow" @click="completeRepair">
        完成维修
      </button>
    </view>
  </view>
</template>

<script setup>
  import {
    ref,
    computed,
    onMounted
  } from 'vue'
  import {
    onLoad,
    onShow
  } from '@dcloudio/uni-app'
  import {
    getOrderDetail,
    acceptOrder,
    rejectOrder,
    updateOrderStatus,
    completeOrder
  } from '@/api/order'
  import {
    updateTechnicianStatus
  } from '@/api/technician'
  import {
    getMaterialList,
    applyMaterial
  } from '@/api/material'
  import {
    OrderStatus,
    statusText
  } from '@/utils/constants'
  import {
    formatDateTime
  } from '@/utils/format'

  const order = ref({})
  let orderId = null
  const urgencyMap = {
    1: '一般',
    2: '紧急',
    3: '特急'
  }

  const materialList = ref([])
  const needMaterial = ref(true)
  const serviceFee = ref(0)
  const billItems = ref([{
    material_id: null,
    material_name: '',
    spec: '',
    stock: 0,
    cost_price: 0,
    standard_discount: 1.0,
    quantity: 1,
    unit_price: 0,
    discount: 1.0,
  }])
  const discount = ref(1.0)

  const isDredgeType = computed(() => {
    const type = order.value.faultType || ''
    return type.includes('疏通') || type.includes('堵塞') || type.includes('下水道') || type.includes('管道')
  })

  const totalAmount = computed(() =>
    billItems.value.reduce((sum, i) => sum + i.unit_price * i.quantity * i.discount, 0)
  )

  const step = computed(() => {
    if (order.value.status === OrderStatus.DISPATCHED) return 1
    if ([OrderStatus.ACCEPTED, OrderStatus.ON_WAY, OrderStatus.REPAIRING].includes(order.value.status) && order
      .value.material_bill_status === 0) return 2
    if (order.value.material_bill_status === 1) return 4
    if (order.value.material_bill_status !== 0 && order.value.status !== OrderStatus.COMPLETED) return 5
    if (order.value.status === OrderStatus.COMPLETED) return 6
    return 1
  })

  const showSteps = computed(() => [OrderStatus.DISPATCHED, OrderStatus.ACCEPTED, OrderStatus.ON_WAY, OrderStatus
    .REPAIRING, OrderStatus.WAITING_PARTS
  ].includes(order.value.status))
  const showActions = computed(() => [OrderStatus.DISPATCHED, OrderStatus.ACCEPTED, OrderStatus.ON_WAY, OrderStatus
    .REPAIRING
  ].includes(order.value.status))

  const canComplete = computed(() => {
    if (order.value.status === OrderStatus.COMPLETED) return false
    const billStatus = order.value.material_bill_status
    return billStatus !== 2
  })

  const canCompleteNow = computed(() => {
    return order.value.material_bill_status !== 2
  })

  const loadOrder = async () => {
    order.value = await getOrderDetail(orderId)
  }

  const fetchMaterials = async () => {
    const res = await getMaterialList({
      limit: 999
    })
    materialList.value = res.data || res
  }

  const getMaterialUnit = (id) => {
    const m = materialList.value.find((m) => m.id === id)
    return m ? m.unit : ''
  }

  const onMaterialSelect = (e, idx) => {
    const selected = materialList.value[e.detail.value]
    if (!selected) return
    billItems.value[idx].material_id = selected.id
    billItems.value[idx].material_name = selected.name
    billItems.value[idx].spec = selected.spec
    billItems.value[idx].stock = selected.stock
    billItems.value[idx].cost_price = selected.price || 0
    billItems.value[idx].standard_discount = selected.standardDiscount || 1.0
    billItems.value[idx].unit_price = selected.price || 0
    billItems.value[idx].discount = selected.standardDiscount || 1.0
  }

  const addBillItem = () => {
    billItems.value.push({
      material_id: null,
      material_name: '',
      spec: '',
      stock: 0,
      cost_price: 0,
      standard_discount: 1.0,
      quantity: 1,
      unit_price: 0,
      discount: 1.0,
    })
  }

  const submitBill = async () => {
    if (needMaterial.value && billItems.value.some((i) => !i.material_id || i.quantity <= 0)) {
      uni.showToast({
        title: '请完整填写物料信息',
        icon: 'none'
      })
      return
    }
    const items = needMaterial.value ?
      billItems.value
      .filter((i) => i.material_id && i.quantity > 0)
      .map((i) => {
        // 确保 unitPrice 是有效数字，否则使用物料的参考价
        let unitPrice = Number(i.unit_price);
        if (isNaN(unitPrice) || unitPrice <= 0) {
          const material = materialList.value.find(m => m.id === i.material_id);
          unitPrice = material?.price || 0;
        }
        return {
          materialId: i.material_id,
          quantity: i.quantity,
          unitPrice: unitPrice || undefined, // 允许 undefined，后端会填充默认值
          discount: typeof i.discount === 'number' && !isNaN(i.discount) && i.discount >= 0 && i.discount <= 1 ? i
            .discount : 1.0,
        };
      }) : []

    const finalServiceFee = isDredgeType.value ? serviceFee.value : 0
    const finalTotalDiscount = discount.value

    const payload = {
      orderId,
      items,
      reason: `工单 ${order.value.orderNo} 物料申领`,
      serviceFee: finalServiceFee,
      totalDiscount: finalTotalDiscount,
    }

    try {
      await applyMaterial(payload)
      uni.showToast({
        title: '物料账单已提交，等待用户支付',
        icon: 'success'
      })
      billItems.value = [{
        material_id: null,
        material_name: '',
        stock: 0,
        cost_price: 0,
        standard_discount: 1.0,
        quantity: 1,
        unit_price: 0,
        discount: 1.0
      }]
      discount.value = 1.0
      serviceFee.value = 0
      needMaterial.value = true
      loadOrder()
    } catch (err) {
      console.log(err)
      uni.showToast({
        title: '提交失败',
        icon: 'none'
      })
    }
  }

  const accept = async () => {
    try {
      await acceptOrder(orderId)
      await updateTechnicianStatus(2)
      uni.showToast({
        title: '接单成功'
      })
      loadOrder()
    } catch (err) {
      uni.showToast({
        title: '接单失败',
        icon: 'none'
      })
    }
  }

  const reject = () => {
    uni.showModal({
      title: '拒单原因',
      content: '请输入拒单原因',
      editable: true,
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            await rejectOrder(orderId, res.content)
            uni.showToast({
              title: '已拒单',
              icon: 'success'
            })
            setTimeout(() => uni.navigateBack(), 1000)
          } catch (err) {
            uni.showToast({
              title: '操作失败',
              icon: 'none'
            })
          }
        }
      }
    })
  }

  const updateStatus = async (status) => {
    await updateOrderStatus(orderId, status)
    uni.showToast({
      title: '状态更新成功'
    })
    loadOrder()
  }
  const onNeedMaterialChange = (e) => {
    needMaterial.value = e.detail.value
  }
  const completeRepair = () => {
    if (!canCompleteNow.value) {
      uni.showToast({
        title: '用户未支付，无法完成维修',
        icon: 'none'
      })
      return
    }
    uni.navigateTo({
      url: `/pages/technician/repairRecord?orderId=${orderId}`
    })
  }

  const previewImage = (url) => {
    uni.previewImage({
      urls: [url]
    })
  }

  onLoad((options) => {
    if (options.id) {
      orderId = parseInt(options.id)
      fetchMaterials()
      loadOrder()
    }
  })

  onShow(() => {
    if (orderId) loadOrder()
  })
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

  .action-group {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #ffffff;
    border-top: 1px solid #f0f2f5;
    padding: 20rpx 30rpx;
    display: flex;
    gap: 20rpx;
    z-index: 10;
  }

  .action-group button {
    flex: 1;
    height: 80rpx;
    line-height: 80rpx;
    border-radius: 48rpx;
    font-size: 28rpx;
  }
</style>