<template>
  <div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="待支付" name="0" />
      <el-tab-pane label="已支付" name="1" />
      <el-tab-pane label="已超时" name="2" />
    </el-tabs>
    <el-table :data="tableData" border stripe>
      <el-table-column prop="id" label="申请ID" width="80" />
      <el-table-column label="工单号" width="180">
        <template #default="{ row }">
          {{ getOrderNo(row.orderId) }}
        </template>
      </el-table-column>
      <el-table-column prop="applicantId" label="申领人ID" width="100" />
      <el-table-column label="物料明细">
        <template #default="{ row }">
          <div v-for="item in row.items" :key="item.materialId">
            {{ getMaterialName(item.materialId) }} × {{ item.quantity }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="reason" label="申领原因" />
      <el-table-column prop="serviceFee" label="服务费" width="100" />
      <el-table-column prop="totalDiscount" label="整单折扣" width="100">
        <template #default="{ row }">{{ (row.totalDiscount * 10).toFixed(1) }}折</template>
      </el-table-column>
      <el-table-column prop="payAmount" label="应付总额" width="120" />
      <el-table-column prop="paymentStatus" label="支付状态" width="100">
        <template #default="{ row }">
          <el-tag :type="paymentStatusType[row.paymentStatus] || 'info'">
            {{ paymentStatusText[row.paymentStatus] || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lockExpiresAt" label="锁定过期时间" width="180">
        <template #default="{ row }">{{ formatDate(row.lockExpiresAt) }}</template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getMaterialApplications, approveApplication, rejectApplication } from '@/api/application';
import { getMaterialList } from '@/api/material';
import { getOrderList } from '@/api/order';
import { formatDate } from '@/utils/format';

const activeTab = ref('0');
const tableData = ref<any[]>([]);
const materials = ref<any[]>([]);
const orders = ref<any[]>([]);

const paymentStatusType: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'info' };
const paymentStatusText: Record<number, string> = { 0: '待支付', 1: '已支付', 2: '已超时' };

const fetchData = async () => {
  const res = await getMaterialApplications({ paymentStatus: parseInt(activeTab.value) });
  tableData.value = res.data;
};

const getMaterialName = (id: number) => {
  const m = materials.value.find((m: any) => m.id === id);
  return m ? m.name : '';
};

const getOrderNo = (orderId: number) => {
  const order = orders.value.find((o: any) => o.id === orderId);
  return order ? order.orderNo : '';
};

onMounted(async () => {
  const materialRes = await getMaterialList();
  materials.value = materialRes.data;
  const orderRes = await getOrderList({ page: 1, pageSize: 1000 });
  orders.value = orderRes.data;
  fetchData();
});

watch(activeTab, () => fetchData());
</script>
<style scoped lang="scss">
.page-container {
  background: transparent;
}
.search-bar {
  background: #fff;
  border: 1px solid #f0f2f5;
  border-radius: 14px;
  padding: 14px 18px;
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.table-container {
  background: #fff;
  border: 1px solid #f0f2f5;
  border-radius: 14px;
  overflow: hidden;
}
.pagination {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}
</style>