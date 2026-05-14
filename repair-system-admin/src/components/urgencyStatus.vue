<template>
  <el-tag :type="statusMap[status]?.type || 'info'">
    {{ statusMap[status]?.text || '未知' }}
  </el-tag>
</template>

<script setup lang="ts">
import { URGENCY_MAP } from '@/constants/orderConstants';

const props = defineProps<{ status: number }>();
const statusMap = URGENCY_MAP;
</script>