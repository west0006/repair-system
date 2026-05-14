<template>
  <view>
    <view class="avatar-section">
      <view class="avatar">👤</view>
      <text class="name">{{ userStore.userInfo?.name }}</text>
      <text class="role">{{ t('profile.role_user') }}</text>
    </view>

    <view class="info-card">
      <view class="info-item" @click="editField('name')">
        <text class="label">{{ t('profile.name') }}</text>
        <text class="value">{{ userStore.userInfo?.name }}</text>
        <text class="edit-icon">✏️</text>
      </view>
      <view class="info-item" @click="editField('phone')">
        <text class="label">{{ t('profile.phone') }}</text>
        <text class="value">{{ userStore.userInfo?.phone }}</text>
        <text class="edit-icon">✏️</text>
      </view>
      <view class="info-item" @click="openLanguage">
        <text class="label">{{ t('language.switch') }}</text>
        <text class="value">{{ currentLanguageName }}</text>
        <text class="edit-icon">🌐</text>
      </view>
    </view>

    <button class="logout-btn" @click="logout">{{ t('profile.logout') }}</button>

    <!-- 语言选择弹窗 -->
    <uni-popup ref="langPopup" type="bottom">
      <language-switcher @close="closeLangPopup" />
    </uni-popup>
  </view>
</template>

<script setup>
  import {
    ref,
    computed
  } from 'vue'
  import {
    useUserStore
  } from '@/store/user'
  import {
    http
  } from '@/utils/request'
  import {
    useI18n
  } from 'vue-i18n'
  import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

  const {
    t,
    locale
  } = useI18n()
  const userStore = useUserStore()
  const langPopup = ref(null)

  const currentLanguageName = computed(() => {
    const map = {
      zh: '中文',
      en: 'English',
      ko: '한국어'
    }
    return map[locale.value] || '中文'
  })

  const editField = (field) => {
    const title = field === 'name' ? t('profile.edit_name') : t('profile.edit_phone')
    const oldValue = userStore.userInfo[field]
    uni.showModal({
      title,
      content: field === 'name' ? t('profile.enter_new_name') : t('profile.enter_new_phone'),
      editable: true,
      placeholderText: oldValue,
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            await http.put('/auth/profile', {
              [field]: res.content
            })
            const newUserInfo = {
              ...userStore.userInfo,
              [field]: res.content
            }
            userStore.loginSuccess(userStore.token, newUserInfo)
            uni.showToast({
              title: t('profile.update_success'),
              icon: 'success'
            })
          } catch (err) {
            uni.showToast({
              title: t('profile.update_failed'),
              icon: 'none'
            })
          }
        }
      }
    })
  }

  const logout = () => {
    uni.showModal({
      title: t('common.confirm'),
      content: t('profile.logout_confirm'),
      success: (res) => {
        if (res.confirm) userStore.logout()
      }
    })
  }

  const openLanguage = () => {
    langPopup.value.open()
  }

  const closeLangPopup = () => {
    langPopup.value.close()
  }
</script>

<style scoped>
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
  }

  .logout-btn {
    background: #ef4444;
    color: #fff;
    border-radius: 48rpx;
    margin-top: 40rpx;
    font-size: 32rpx;
    padding: 24rpx;
    border: none;
    width: 100%;
  }
</style>