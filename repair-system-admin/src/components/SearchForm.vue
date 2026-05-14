<template>
  <el-form :inline="true" :model="formData" class="search-form">
    <el-form-item v-for="field in fields" :key="field.key" :label="field.label">
      <el-input v-if="field.type === 'input'" v-model="formData[field.key]" :placeholder="field.placeholder" />
      <el-select v-else-if="field.type === 'select'" v-model="formData[field.key]" :placeholder="field.placeholder">
        <el-option v-for="opt in field.options" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-date-picker
        v-else-if="field.type === 'daterange'"
        v-model="formData[field.key]"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
      />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, watchEffect } from 'vue';

interface Field {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  options?: { label: string; value: any }[];
}

const props = defineProps<{ fields: Field[] }>();
const emit = defineEmits<{ (e: 'search', params: Record<string, any>): void }>();

// 初始化表单数据为各字段默认值（空字符串）
const initFormData = () => {
  const obj: Record<string, any> = {};
  props.fields.forEach(f => {
    obj[f.key] = '';
  });
  return obj;
};
const formData = reactive(initFormData());

// 监听 fields 变化重置（可选，一般不会变）
watchEffect(() => {
  Object.assign(formData, initFormData());
});

const handleSearch = () => {
  const params: Record<string, any> = {};
  for (const key in formData) {
    if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
      params[key] = formData[key];
    }
  }
  emit('search', params);
};

const reset = () => {
  Object.assign(formData, initFormData());
  handleSearch();
};
</script>

<style scoped>
.search-form {
  margin-bottom: 20px;
}
</style>