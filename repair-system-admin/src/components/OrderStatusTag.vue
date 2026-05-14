<template>
  <el-tag :type="statusMap[status]?.type || 'info'">
    {{ statusMap[status]?.text || '未知状态' }}
  </el-tag>
</template>

<script setup lang="ts">
import { ORDER_STATUS } from '@/constants/orderConstants';

const props = defineProps<{ status: number }>();
const statusMap = ORDER_STATUS;
</script>