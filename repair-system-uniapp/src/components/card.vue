<template>
  <view class="card" :class="{ 'no-padding': noPadding }">
    <slot />
  </view>
</template>

<style>
.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);
}
.no-padding { padding: 0; }
</style>