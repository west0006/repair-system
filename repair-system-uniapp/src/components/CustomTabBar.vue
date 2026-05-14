<template>
  <view class="custom-tab-bar" :class="{ 'is-iphonex': isIphoneX }">
    <view v-for="(item, index) in finalMenus" :key="item.pagePath" class="tab-item"
      :class="{ active: currentPage === item.pagePath }" @click="switchTab(item.pagePath)">
      <text class="tab-icon">{{ item.iconEmoji }}</text>
      <text class="tab-label">{{ item.text }}</text>
      <view v-if="item.badge && item.badge > 0" class="badge">{{ item.badge > 99 ? '99+' : item.badge }}</view>
    </view>
  </view>
</template>

<script setup>
  import {
    computed,
    ref,
    onMounted
  } from 'vue'
  import {
    useUserStore
  } from '@/store/user'
  import {
    useI18n
  } from 'vue-i18n'

  const props = defineProps({
    currentPage: {
      type: String,
      default: ''
    },
    // 外部可传入菜单，否则根据角色自动生成
    menus: {
      type: Array,
      default: null
    }
  })

  const {
    t
  } = useI18n()
  const userStore = useUserStore()
  const role = computed(() => userStore.userInfo?.role)
  const isIphoneX = ref(false)

  // 默认菜单定义（可根据角色生成）
  const defaultMenus = computed(() => {
    if (role.value === 0) {
      // 普通用户
      return [{
          pagePath: '/pages/user/tabbar?tab=home',
          text: t('tabbar.home'),
          iconEmoji: '🏠',
          badge: 0
        },
        {
          pagePath: '/pages/user/tabbar?tab=orders',
          text: t('tabbar.orders'),
          iconEmoji: '📋',
          badge: 0
        },
        {
          pagePath: '/pages/user/tabbar?tab=messages',
          text: t('tabbar.messages'),
          iconEmoji: '💬',
          badge: 0
        },
        {
          pagePath: '/pages/user/tabbar?tab=notices',
          text: t('tabbar.notices'),
          iconEmoji: '🔔',
          badge: 0
        },
        {
          pagePath: '/pages/user/tabbar?tab=profile',
          text: t('tabbar.profile'),
          iconEmoji: '👤',
          badge: 0
        }
      ]
    } else if (role.value === 1) {
      // 师傅端
      return [{
          pagePath: '/pages/technician/tabbar?tab=home',
          text: t('tabbar.home'),
          iconEmoji: '🏠',
          badge: 0
        },
        {
          pagePath: '/pages/technician/tabbar?tab=orders',
          text: t('tabbar.orders'),
          iconEmoji: '📋',
          badge: 0
        },
        {
          pagePath: '/pages/technician/tabbar?tab=messages',
          text: t('tabbar.messages'),
          iconEmoji: '💬',
          badge: 0
        },
        {
          pagePath: '/pages/technician/tabbar?tab=notices',
          text: t('tabbar.notices'),
          iconEmoji: '🔔',
          badge: 0
        },
        {
          pagePath: '/pages/technician/tabbar?tab=profile',
          text: t('tabbar.profile'),
          iconEmoji: '👤',
          badge: 0
        }
      ]
    }
    return []
  })

  const finalMenus = computed(() => props.menus || defaultMenus.value)

  const switchTab = (url) => {
    if (url === props.currentPage) return
    uni.reLaunch({
      url
    })
  }

  onMounted(() => {
    // 检测是否为 iPhone X 系列（用于底部安全区）
    const systemInfo = uni.getSystemInfoSync()
    const isIOS = systemInfo.platform === 'ios'
    const model = systemInfo.model
    isIphoneX.value = isIOS && (model.includes('iPhone X') || model.includes('iPhone 11') || model.includes(
      'iPhone 12') || model.includes('iPhone 13') || model.includes('iPhone 14') || model.includes('iPhone 15'))
  })
</script>

<style scoped>
  .custom-tab-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100rpx;
    background: #ffffff;
    display: flex;
    justify-content: space-around;
    align-items: center;
    border-top: 1px solid #f0f2f5;
    z-index: 100;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    position: relative;
  }

  .tab-icon {
    font-size: 48rpx;
    margin-bottom: 6rpx;
  }

  .tab-label {
    font-size: 22rpx;
    color: #64748b;
  }

  .tab-item.active .tab-label {
    color: #0f766e;
    font-weight: 600;
  }

  .badge {
    position: absolute;
    top: 12rpx;
    right: 24rpx;
    min-width: 32rpx;
    height: 32rpx;
    background: #ef4444;
    color: #fff;
    font-size: 20rpx;
    border-radius: 32rpx;
    padding: 0 8rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
</style>