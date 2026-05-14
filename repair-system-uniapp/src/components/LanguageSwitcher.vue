<template>
  <view class="language-switcher">
    <view class="language-item" v-for="lang in languages" :key="lang.code" @click="switchLanguage(lang.code)">
      <text>{{ lang.name }}</text>
      <text v-if="currentLocale === lang.code" class="check">✓</text>
    </view>
  </view>
</template>

<script setup>
  import {
    ref,
    onMounted
  } from 'vue'
  import {
    useI18n
  } from 'vue-i18n'

  const {
    locale
  } = useI18n()
  const currentLocale = ref(locale.value)

  const languages = [{
      code: 'zh',
      name: '中文'
    },
    {
      code: 'en',
      name: 'English'
    },
    {
      code: 'ko',
      name: '한국어'
    }
  ]

  const switchLanguage = (lang) => {
    locale.value = lang
    currentLocale.value = lang
    uni.setStorageSync('language', lang)
    uni.showToast({
      title: languages.find(l => l.code === lang)?.name + ' ' + (lang === 'zh' ? '已切换' : (lang === 'en' ?
        'Switched' : '변경됨')),
      icon: 'none'
    })
  }

  onMounted(() => {
    const savedLang = uni.getStorageSync('language')
    if (savedLang && ['zh', 'en', 'ko'].includes(savedLang)) {
      locale.value = savedLang
      currentLocale.value = savedLang
    }
  })
</script>

<style scoped>
  .language-switcher {
    background: #fff;
    border-radius: 24rpx;
    padding: 20rpx 0;
  }

  .language-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx 40rpx;
    font-size: 32rpx;
    border-bottom: 1rpx solid #f0f0f0;
  }

  .language-item:last-child {
    border-bottom: none;
  }

  .check {
    color: #07c160;
    font-weight: bold;
  }
</style>