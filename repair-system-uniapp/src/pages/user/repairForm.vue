<template>
  <view class="repair-form container">
    <view class="steps">
      <view class="step" :class="{ active: currentStep >= 1, done: currentStep > 1 }">{{ t('repair.step1') }}</view>
      <view class="step-line"></view>
      <view class="step" :class="{ active: currentStep >= 2, done: currentStep > 2 }">{{ t('repair.step2') }}</view>
    </view>

    <view class="form-card">
      <view class="field">
        <text class="field-label">{{ t('repair.fault_type') }} <text class="star">*</text></text>
        <picker @change="onFaultTypeChange" :range="faultTypes" range-key="label" :value="selectedFault">
          <view class="picker" :class="{ error: errors.faultType }">
            {{ faultTypes[selectedFault]?.label || t('repair.building_placeholder') }}
          </view>
        </picker>
      </view>

      <view class="field">
        <text class="field-label">{{ t('repair.fault_desc') }} <text class="star">*</text></text>
        <textarea v-model="desc" :placeholder="t('repair.fault_desc_placeholder')" class="textarea"
          :class="{ error: errors.desc }" />
        <view class="char-count">{{ desc.length }}/200</view>
      </view>

      <view class="field">
        <text class="field-label">{{ t('repair.upload_photo') }} <text class="star">*</text></text>
        <image-uploader v-model="images" :max="6" />
        <text class="subtle">{{ t('repair.photo_hint') }}</text>
      </view>

      <view class="divider"></view>

      <view class="field">
        <text class="field-label">{{t('repair.scheduled_time')}}</text>
        <picker mode="multiSelector" :value="scheduledTimeIndex" :range="scheduledTimeRange"
          @change="onScheduledTimeChange">
          <view class="picker" :class="{ error: errors.scheduledTime }">
            {{ scheduledTimeText || t('repair.scheduled_time_placeholder') }}
          </view>
        </picker>
        <text class="subtle">{{t('repair.scheduled_time_hint')}}</text>
      </view>

      <view class="divider"></view>

      <view class="field">
        <text class="field-label">{{ t('repair.location') }} <text class="star">*</text></text>
        <picker @change="onBuildingChange" :range="buildings" range-key="name" :value="buildingIndex">
          <view class="picker" :class="{ error: errors.building }">
            {{ buildingIndex >= 0 && buildings[buildingIndex] ? buildings[buildingIndex].name : t('repair.building_placeholder') }}
          </view>
        </picker>
      </view>

      <view class="field">
        <text class="field-label">{{t('repair.floor')}} <text class="star">*</text></text>
        <input v-model="floor" :placeholder="t('repair.floor_placeholder')" class="input"
          :class="{ error: errors.floor }" />
      </view>

      <view class="field">
        <text class="field-label">{{t('repair.room')}} <text class="star">*</text></text>
        <input v-model="room" :placeholder="t('repair.room_placeholder')" class="input"
          :class="{ error: errors.room }" />
      </view>

      <button class="submit-btn" @click="submit" :loading="submitting">{{t('repair.submit')}}</button>
    </view>

    <view v-if="smartTip" class="smart-tip">
      <text class="tip-icon">💡</text>
      <text class="tip-text">{{ smartTip }}</text>
    </view>
  </view>
</template>

<script setup>
  import {
    ref,
    onMounted,
    watch,
    computed
  } from 'vue'
  import {
    submitOrder
  } from '@/api/order'
  import {
    getBuildingList
  } from '@/api/building'
  import {
    predictFaq
  } from '@/api/faq'
  import {
    useI18n
  } from 'vue-i18n'
  import ImageUploader from '@/components/ImageUploader.vue'

  const {
    t
  } = useI18n()
  const selectedFault = ref(0)

  const faultTypes = computed(() => [{
      value: '水电维修',
      label: t('fault_types.water_electric')
    },
    {
      value: '木工维修',
      label: t('fault_types.carpenter')
    },
    {
      value: '热水维修',
      label: t('fault_types.hot_water')
    },
    {
      value: '直饮水维修',
      label: t('fault_types.drinking_water')
    },
    {
      value: '门禁维修',
      label: t('fault_types.access_control')
    },
    {
      value: '绿化',
      label: t('fault_types.greening')
    },
    {
      value: '消防维修',
      label: t('fault_types.fire_fighting')
    },
    {
      value: '疏通',
      label: t('fault_types.dredge')
    }
  ])

  const desc = ref('')
  const images = ref([])
  const buildings = ref([])
  const buildingIndex = ref(-1)
  const floor = ref('')
  const room = ref('')

  const scheduledTimeIndex = ref([0, 0])
  const scheduledTimeRange = ref([
    [],
    []
  ])
  const scheduledTimeText = ref('')

  const submitting = ref(false)
  const currentStep = ref(1)
  const errors = ref({
    faultType: false,
    desc: false,
    building: false,
    floor: false,
    room: false
  })
  const smartTip = ref('')
  let debounceTimer = null

  const fetchBuildings = async () => {
    try {
      const res = await getBuildingList()
      buildings.value = res.data || res
    } catch (err) {
      console.error('获取楼栋失败', err)
    }
  }

  const generateDateOptions = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      dates.push(`${month}月${day}日 ${weekdays[date.getDay()]}`)
    }
    return dates
  }

  const timeSlots = ['09:00-12:00', '14:00-17:00', '18:00-20:00']

  const initScheduledTime = () => {
    scheduledTimeRange.value = [generateDateOptions(), timeSlots]
    scheduledTimeIndex.value = [0, 0]
    updateScheduledTimeText()
  }

  const updateScheduledTimeText = () => {
    const [dateIdx, slotIdx] = scheduledTimeIndex.value
    const date = scheduledTimeRange.value[0]?.[dateIdx] || ''
    const slot = timeSlots[slotIdx] || ''
    scheduledTimeText.value = `${date} ${slot}`
  }

  const onScheduledTimeChange = (e) => {
    scheduledTimeIndex.value = e.detail.value
    updateScheduledTimeText()
    errors.value.scheduledTime = false
  }

  const getScheduledTimeISO = () => {
    const [dateIdx, slotIdx] = scheduledTimeIndex.value
    const today = new Date()
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + dateIdx)
    const slot = timeSlots[slotIdx]
    const startHour = parseInt(slot.split(':')[0])
    targetDate.setHours(startHour, 0, 0, 0)
    return targetDate.toISOString()
  }

  watch(desc, (newVal) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      if (newVal.length > 3) {
        try {
          const res = await predictFaq(newVal)
          smartTip.value = res?.solution || ''
        } catch (err) {
          smartTip.value = ''
        }
      } else {
        smartTip.value = ''
      }
    }, 500)
  })

  const validate = () => {
    let isValid = true
    const newErrors = {}
    if (selectedFault.value === null || selectedFault.value === undefined) {
      newErrors.faultType = true;
      isValid = false
    }
    if (!desc.value.trim()) {
      newErrors.desc = true;
      isValid = false
    }
    if (buildingIndex.value === -1 || !buildings.value[buildingIndex.value]) {
      newErrors.building = true;
      isValid = false
    }
    if (!floor.value.trim()) {
      newErrors.floor = true;
      isValid = false
    }
    if (!room.value.trim()) {
      newErrors.room = true;
      isValid = false
    }
    errors.value = newErrors
    return isValid
  }

  const submit = async () => {
    if (submitting.value) return
    if (!validate()) {
      uni.showToast({
        title: t('repair.form_incomplete'),
        icon: 'none'
      })
      return
    }
    if (images.value.length === 0) {
      uni.showToast({
        title: t('repair.photo_required'),
        icon: 'none'
      })
      return
    }
    submitting.value = true
    const selectedBuilding = buildings.value[buildingIndex.value]
    let scheduledTimeISO = null;
    try {
      scheduledTimeISO = getScheduledTimeISO();
    } catch {}
    try {
      await submitOrder({
        faultType: faultTypes.value[selectedFault.value]?.value,
        desc: desc.value,
        images: images.value,
        locationBuilding: selectedBuilding.name,
        locationFloor: floor.value.trim(),
        locationRoom: room.value.trim(),
        urgency: 1,
        scheduledTime: scheduledTimeISO,
      })
      uni.showToast({
        title: t('repair.submit_success'),
        icon: 'success'
      })
      // 请求订阅消息授权
      uni.requestSubscribeMessage({
        tmplIds: [
          'q_RnrEAiPozaFQuQYWmgtgQi1tS6gtYSew4HlWpT-Vo', // 下单成功通知
          'lzkE05FYfkkzNuexlcimo7nrdchlF5u2DOkOvovF59s', // 师傅接单通知
          'MBqBQha-AJxBW6Gne4FNbkBmF-ld5XlysMv4dUeOLUs', // 服务评价提醒
          'X2I9ICBuHRa9YBWXPNp-DmnyiAENZa4h9O7IvfYQVL8', // 待支付提醒
          '3GREsjBgAnEl_Zzwy8LhYVvUOcV3cZIceZ1vTRDZPfc', // 支付成功通知
          'mVtYMTsEZsjooCJxKnfJIWX4VaG7vInoMoC8TytCZBQ', // 师傅拒绝接单通知
        ],
        success: (res) => {
          console.log('订阅消息授权结果', res)
        }
      })

      setTimeout(() => uni.navigateBack(), 1500)
    } catch (err) {
      uni.showToast({
        title: t('repair.submit_failed'),
        icon: 'none'
      })
    } finally {
      submitting.value = false
    }
  }

  const onFaultTypeChange = (e) => {
    selectedFault.value = e.detail.value
    errors.value.faultType = false
  }

  const onBuildingChange = (e) => {
    buildingIndex.value = e.detail.value
    errors.value.building = false
  }


  onMounted(() => {
    fetchBuildings()
    initScheduledTime()
  })
</script>

<style scoped>
  .repair-form {
    padding: 30rpx;
    background: transparent;
  }

  .form-card {
    background: #ffffff;
    border: 1px solid #f0f2f5;
    border-radius: 28rpx;
    padding: 28rpx;
    margin-bottom: 24rpx;
  }

  .steps {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    border: 1px solid #f0f2f5;
    border-radius: 48rpx;
    padding: 20rpx 30rpx;
    margin-bottom: 30rpx;
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

  .field {
    margin-bottom: 24rpx;
  }

  .field-label {
    font-size: 28rpx;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 12rpx;
    display: block;
  }

  .star {
    color: #ef4444;
    margin-left: 4rpx;
  }

  .picker,
  .input,
  .textarea {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 16rpx;
    padding: 24rpx;
    font-size: 28rpx;
    background: #ffffff;
    box-sizing: border-box;
  }

  .picker.error,
  .input.error,
  .textarea.error {
    border-color: #ef4444;
  }

  .textarea {
    min-height: 180rpx;
  }

  .char-count {
    text-align: right;
    font-size: 24rpx;
    color: #64748b;
    margin-top: 8rpx;
  }

  .urgency-group {
    display: flex;
    gap: 40rpx;
    margin-top: 12rpx;
  }

  .urgency-option {
    display: flex;
    align-items: center;
    gap: 12rpx;
    font-size: 28rpx;
  }

  .divider {
    height: 1px;
    background: #e2e8f0;
    margin: 30rpx 0 20rpx;
  }

  .submit-btn {
    background: #0f766e;
    color: #fff;
    border-radius: 48rpx;
    font-size: 32rpx;
    padding: 24rpx;
    margin-top: 30rpx;
    border: none;
  }

  .smart-tip {
    margin-top: 20rpx;
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 16rpx;
    padding: 20rpx;
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .tip-icon {
    font-size: 40rpx;
  }

  .tip-text {
    font-size: 28rpx;
    color: #92400e;
  }
</style>