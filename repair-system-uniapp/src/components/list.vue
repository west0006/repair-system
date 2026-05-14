<template>
  <view class="list-item" @click="onClick">
    <view class="item-left">
      <slot name="left" />
    </view>
    <view class="item-content">
      <view class="title">{{ title }}</view>
      <view class="desc">{{ desc }}</view>
    </view>
    <view class="item-right">
      <slot name="right" />
    </view>
  </view>
</template>

<style>
.list-item {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
}
.item-content {
  flex: 1;
  margin-left: 20rpx;
}
.title {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 8rpx;
}
.desc {
  font-size: 24rpx;
  color: #999;
}
</style>