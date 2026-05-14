<template>
  <button :class="['btn', `btn-${type}`]" :disabled="disabled">
    <slot />
  </button>
</template>

<style>
.btn {
  display: inline-block;
  padding: 20rpx 0;
  border-radius: 48rpx;
  font-size: 28rpx;
  text-align: center;
  transition: all 0.2s ease;
  width: 100%;
}
.btn-primary {
  background: #07c160;
  color: #fff;
}
.btn-primary:active {
  background: #06a04f;
}
.btn-danger {
  background: #f5222d;
  color: #fff;
}
.btn-outline {
  background: transparent;
  border: 1px solid #07c160;
  color: #07c160;
}
</style>