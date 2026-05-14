<template>
  <view class="input-wrapper">
    <view class="icon" v-if="icon"><uni-icons v-if="icon" :type="icon" size="16" color="#999" /></view>
    <input :value="value" :placeholder="placeholder" @input="onInput" />
  </view>
</template>

<style>
.input-wrapper {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e5e5e5;
  padding: 12rpx 0;
}
.input-wrapper input {
  flex: 1;
  margin-left: 12rpx;
  font-size: 28rpx;
}
</style>