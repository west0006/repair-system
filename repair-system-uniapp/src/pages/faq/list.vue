<template>
  <view class="faq-list-container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input v-model="keyword" :placeholder="t('common.search_placeholder')" class="search-input" />
      <button class="search-btn" @click="search">{{ t('common.search') }}</button>
    </view>

    <!-- FAQ 列表 -->
    <scroll-view scroll-y class="faq-scroll">
      <view v-for="item in filteredList" :key="item.id" class="faq-item" @click="toggleExpand(item.id)">
        <view class="faq-header">
          <text class="faq-keyword">{{ item.keyword }}</text>
          <text class="expand-icon">{{ expandedId === item.id ? '▼' : '▶' }}</text>
        </view>
        <view v-if="expandedId === item.id" class="faq-solution">
          {{ item.solution }}
        </view>
      </view>
      <empty-state v-if="filteredList.length === 0 && !loading" :text="t('faq.no_result')" />
      <view v-if="loading" class="loading">{{ t('common.loading') }}</view>
    </scroll-view>
  </view>
</template>

<script setup>
  import {
    ref,
    computed,
    onMounted
  } from 'vue'
  import {
    useI18n
  } from 'vue-i18n'
  import {
    getFaqList
  } from '@/api/faq'
  import EmptyState from '@/components/EmptyState.vue'

  const {
    t
  } = useI18n()
  const allFaqs = ref([])
  const keyword = ref('')
  const expandedId = ref(null)
  const loading = ref(false)

  // 过滤：支持按关键词搜索（匹配 keyword 或 solution）
  const filteredList = computed(() => {
    if (!keyword.value) return allFaqs.value
    const kw = keyword.value.toLowerCase()
    return allFaqs.value.filter(
      item =>
      item.keyword.toLowerCase().includes(kw) ||
      item.solution.toLowerCase().includes(kw)
    )
  })

  const fetchFaqs = async () => {
    loading.value = true
    try {
      const res = await getFaqList()
      allFaqs.value = res.data || res
    } catch (err) {
      console.error('加载 FAQ 失败', err)
    } finally {
      loading.value = false
    }
  }

  const search = () => {
    // 触发过滤计算，无需额外操作
  }

  const toggleExpand = (id) => {
    expandedId.value = expandedId.value === id ? null : id
  }

  onMounted(() => {
    fetchFaqs()
  })
</script>

<style scoped>
  .faq-list-container {
    padding: 30rpx;
    background: transparent;
    min-height: 100vh;
  }

  .search-bar {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
  }

  .search-input {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 48rpx;
    padding: 16rpx 24rpx;
    font-size: 28rpx;
    background: #ffffff;
    margin-right: 20rpx;
  }

  .search-btn {
    background: #0f766e;
    color: #fff;
    border-radius: 48rpx;
    padding: 16rpx 40rpx;
    font-size: 28rpx;
    border: none;
  }

  .faq-item {
    background: #ffffff;
    border: 1px solid #f0f2f5;
    border-radius: 24rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
  }

  .faq-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .faq-keyword {
    font-size: 30rpx;
    font-weight: 600;
    color: #1e293b;
  }

  .expand-icon {
    font-size: 24rpx;
    color: #64748b;
  }

  .faq-solution {
    margin-top: 20rpx;
    font-size: 26rpx;
    color: #475569;
    line-height: 1.6;
  }

  .loading,
  .empty {
    text-align: center;
    padding: 30rpx;
    color: #94a3b8;
  }
</style>