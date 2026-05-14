<template>
  <view class="empty">
    <image :src="image" mode="aspectFit" v-if="image" />
    <text class="empty-text">{{ text || '暂无数据' }}</text>
    <button v-if="btnText" class="empty-btn" @click="onBtnClick">{{ btnText }}</button>
  </view>
</template>

<script setup>
  const props = defineProps({
    text: String,
    image: {
      type: String,
      default: '/static/empty.png'
    },
    btnText: String,
    onBtnClick: Function
  })
</script>

<style scoped>
  .empty {
    text-align: center;
    padding: 100rpx 0;
    color: #999;
  }

  .empty image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 28rpx;
    display: block;
    margin-bottom: 30rpx;
  }

  .empty-btn {
    width: 300rpx;
    background-color: #07c160;
    color: #fff;
    border-radius: 48rpx;
    font-size: 28rpx;
  }
</style>