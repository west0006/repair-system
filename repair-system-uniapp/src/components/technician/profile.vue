<template>
  <view class="profile-container">
    <view class="avatar-section">
      <view class="avatar">👤</view>
      <text class="name">{{ userStore.userInfo?.name }}</text>
      <text class="role">维修师傅</text>
    </view>

    <view class="info-card">
      <view class="info-item" @click="editField('name')">
        <text class="label">姓名</text>
        <text class="value">{{ userStore.userInfo?.name }}</text>
        <text class="edit-icon">✏️</text>
      </view>
      <view class="info-item" @click="editField('phone')">
        <text class="label">手机号</text>
        <text class="value">{{ userStore.userInfo?.phone }}</text>
        <text class="edit-icon">✏️</text>
      </view>
    </view>

    <view class="info-card" v-if="technician">
      <view class="info-item">
        <text class="label">责任区域</text>
        <text class="value">{{ technician.areaId || '未设置' }}</text>
      </view>
      <view class="info-item">
        <text class="label">技能</text>
        <text class="value">{{ technician.skills || '未设置' }}</text>
      </view>
      <view class="info-item">
        <text class="label">最大接单数</text>
        <text class="value">{{ technician.maxOrders }}</text>
      </view>
      <view class="info-item">
        <text class="label">当前工单数</text>
        <text class="value">{{ technician.currentOrders }}</text>
      </view>
      <view class="info-item">
        <text class="label">状态</text>
        <text class="status" :class="technician.status === 1 ? 'status-run' : 'status-wait'">
          {{ technician.status === 1 ? '空闲' : '忙碌' }}
        </text>
      </view>
    </view>

    <button class="logout-btn" @click="logout">退出登录</button>
  </view>
</template>

<script setup>
  import {
    ref,
    onMounted
  } from 'vue'
  import {
    useUserStore
  } from '@/store/user'
  import {
    http
  } from '@/utils/request'

  const userStore = useUserStore()
  const technician = ref(null)

  const fetchTechnician = async () => {
    try {
      technician.value = await http.get('/technician/profile')
    } catch (err) {
      console.error(err)
    }
  }

  const editField = (field) => {
    const title = field === 'name' ? '修改姓名' : '修改手机号'
    const oldValue = userStore.userInfo[field]
    uni.showModal({
      title,
      content: '请输入新' + (field === 'name' ? '姓名' : '手机号'),
      editable: true,
      placeholderText: oldValue,
      success: async (res) => {
        if (res.confirm && res.content) {
          await http.put('/auth/profile', {
            [field]: res.content
          })
          const newUserInfo = {
            ...userStore.userInfo,
            [field]: res.content
          }
          userStore.loginSuccess(userStore.token, newUserInfo)
          uni.showToast({
            title: '修改成功'
          })
        }
      }
    })
  }

  const logout = () => {
    uni.showModal({
      title: '提示',
      content: '确定退出登录吗？',
      success: (res) => {
        if (res.confirm) userStore.logout()
      }
    })
  }

  onMounted(fetchTechnician)
</script>

<style scoped>
  .profile-container {
    padding: 30rpx;
    background: transparent;
    min-height: 100vh;
    padding-bottom: 120rpx;
  }

  .avatar-section {
    text-align: center;
    margin-bottom: 30rpx;
  }

  .avatar {
    font-size: 120rpx;
    background: #e2e8f0;
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20rpx;
  }

  .name {
    font-size: 36rpx;
    font-weight: 700;
    display: block;
    color: #1e293b;
  }

  .role {
    font-size: 24rpx;
    color: #0f766e;
    background: #e8f4f2;
    display: inline-block;
    padding: 6rpx 20rpx;
    border-radius: 30rpx;
    margin-top: 10rpx;
  }

  .info-card {
    background: #ffffff;
    border: 1px solid #f0f2f5;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
  }

  .info-item {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1px solid #f0f2f5;
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .label {
    width: 160rpx;
    font-size: 28rpx;
    color: #64748b;
  }

  .value {
    flex: 1;
    font-size: 28rpx;
    color: #1e293b;
  }

  .edit-icon {
    font-size: 32rpx;
    color: #0f766e;
    padding: 0 10rpx;
  }

  .status {
    display: inline-block;
    padding: 4rpx 12rpx;
    border-radius: 20rpx;
    font-size: 24rpx;
    margin-left: 10rpx;
  }

  .status-run {
    background: #dbeafe;
    color: #1e40af;
  }

  .status-wait {
    background: #fef3c7;
    color: #92400e;
  }

  .logout-btn {
    background: #ef4444;
    color: #fff;
    border-radius: 48rpx;
    font-size: 32rpx;
    padding: 24rpx;
    margin-top: 40rpx;
    border: none;
    width: 100%;
  }
</style>