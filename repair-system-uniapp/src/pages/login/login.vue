<template>
  <view class="login-page">
    <view class="logo">{{ t('login.title') }}</view>
    <view class="form-card">
      <view class="input-group">
        <uni-icons type="person" size="20" color="#999" />
        <input v-model="username" :placeholder="t('login.username')" />
      </view>
      <view class="input-group">
        <uni-icons type="locked" size="20" color="#999" />
        <input type="password" v-model="password" :placeholder="t('login.password')" />
      </view>
      <button class="btn-primary" @click="handleLogin">{{ t('login.login_btn') }}</button>
    </view>
  </view>
</template>

<script setup>
  import {
    ref
  } from 'vue'
  import {
    useI18n
  } from 'vue-i18n'
  import {
    useUserStore
  } from '@/store/user'
  import {
    validateUsername
  } from '@/utils/validator'

  const {
    t
  } = useI18n()
  const userStore = useUserStore()
  const username = ref('')
  const password = ref('')

  const handleLogin = async () => {
    if (!validateUsername(username.value)) {
      uni.showToast({
        title: t('login.username_required'),
        icon: 'none'
      })
      return
    }
    try {
      await userStore.login(username.value, password.value)
      uni.showToast({
        title: t('login.login_success'),
        icon: 'success'
      })
      setTimeout(() => uni.reLaunch({
        url: '/pages/index/index'
      }), 1000)
    } catch (err) {
      uni.showToast({
        title: t('login.login_failed'),
        icon: 'none'
      })
    }
  }
</script>

<style scoped>
  .login-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 30rpx;
  }

  .logo {
    text-align: center;
    font-size: 56rpx;
    font-weight: bold;
    color: #07c160;
    margin-bottom: 80rpx;
  }

  .form-card {
    background: #fff;
    border-radius: 24rpx;
    padding: 40rpx 30rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  }

  .input-group {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #e5e5e5;
    margin-bottom: 40rpx;
    padding: 12rpx 0;
  }

  .input-group input {
    flex: 1;
    margin-left: 20rpx;
    font-size: 28rpx;
  }

  .btn-primary,
  .btn-outline {
    margin-top: 30rpx;
  }
</style>