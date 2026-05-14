<template>
  <view class="index-container">
  </view>
</template>

<script setup lang="ts">
  import { onLoad } from '@dcloudio/uni-app'
  import { computed } from 'vue'
  import { useUserStore } from '@/store/user'
  // 导入角色专属组件
  import UserHome from '@/components/index/user-home.vue'
  import TechHome from '@/components/index/tech-home.vue'

  import CustomTabBar from '@/components/CustomTabBar.vue'

  const userStore = useUserStore()

  // 响应式获取全局状态
  const token = computed(() => userStore.token)
  const role = computed(() => userStore.userInfo.role)

  // 页面加载初始化
  onLoad(() => {
    userStore.initUserInfo()
    if (role.value === 0) {
      uni.reLaunch({ url: '/pages/user/tabbar?tab=home' })
    } else if (role.value === 1) {
      uni.reLaunch({ url: '/pages/technician/tabbar?tab=home' })
    }
  })

  // 跳转登录
  const toLogin = () => {
    uni.navigateTo({
      url: '/pages/login/login'
    })
  }
</script>

<style scoped lang="scss">
  .index-container {
    padding: 20rpx 20rpx 120rpx 20rpx;
    min-height: 100vh;
    background-color: #f5f5f5;
  }

  .empty-tip {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60vh;
    color: #666;
    font-size: 32rpx;
  }

  .login-btn {
    margin-top: 30rpx;
    width: 300rpx;
  }
</style>