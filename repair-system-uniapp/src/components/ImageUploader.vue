<template>
  <view class="image-uploader">
    <view class="image-list">
      <view v-for="(img, idx) in images" :key="idx" class="image-item">
        <image :src="img" mode="aspectFill" @click="preview(img)" />
        <view class="delete" @click="remove(idx)">×</view>
      </view>
      <view v-if="images.length < max" class="upload-btn" @click="chooseImage">+</view>
    </view>
  </view>
</template>

<script setup>
import { ref  } from 'vue';
import { uploadFile } from '@/api/upload';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  max: { type: Number, default: 6 }
});
const emit = defineEmits(['update:modelValue']);

const images = ref([...props.modelValue]);

const chooseImage = () => {
  uni.chooseImage({
    count: props.max - images.value.length,
    success: async (res) => {
      uni.showLoading({ title: '上传中...' });
      const urls = [];
      for (const file of res.tempFilePaths) {
        try {
          const url = await uploadFile(file);
          urls.push(url);
        } catch (err) {
          console.error('上传失败', err);
        }
      }
      uni.hideLoading();
      images.value.push(...urls);
      emit('update:modelValue', images.value);
    }
  });
};

const remove = (idx) => {
  images.value.splice(idx, 1);
  emit('update:modelValue', images.value);
};

const preview = (url) => {
  uni.previewImage({ urls: images.value, current: url });
};
</script>

<style scoped>
.image-list { display: flex; flex-wrap: wrap; gap: 20rpx; }
.image-item { position: relative; width: 160rpx; height: 160rpx; border-radius: 12rpx; overflow: hidden; }
.image-item image { width: 100%; height: 100%; }
.delete { position: absolute; top: 0; right: 0; width: 40rpx; height: 40rpx; background: rgba(0,0,0,0.5); color: #fff; text-align: center; line-height: 40rpx; font-size: 30rpx; border-radius: 0 0 0 12rpx; }
.upload-btn { width: 160rpx; height: 160rpx; background: #f5f5f5; display: flex; align-items: center; justify-content: center; font-size: 60rpx; color: #999; border-radius: 12rpx; }
</style>