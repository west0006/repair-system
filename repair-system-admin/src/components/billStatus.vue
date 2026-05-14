<template>
  <el-tag :type="statusMap[status]?.type || 'info'">
    {{ statusMap[status]?.text || '未知状态' }}
  </el-tag>
</template>

<script setup lang="ts">
import { BILL_STATUS } from '@/constants/orderConstants';

const props = defineProps<{ status: number }>();
const statusMap = BILL_STATUS;
</script>