<template>
  <text :class="['tag', `tag-${type}`]">{{ text }}</text>
</template>

<style>
.tag {
  display: inline-block;
  padding: 4rpx 12rpx;
  border-radius: 30rpx;
  font-size: 22rpx;
}
.tag-success { background: #e6f7e6; color: #07c160; }
.tag-warning { background: #fff7e6; color: #ffa500; }
.tag-danger { background: #fff1f0; color: #f5222d; }
.tag-info { background: #e6f7ff; color: #1890ff; }
</style>