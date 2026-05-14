<template>
  <div class="page-container">
    <div class="table-container">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="orderNo" label="出库单号" width="180" />
        <el-table-column prop="materialName" label="物料名称" />
        <el-table-column prop="quantity" label="数量" />
        <el-table-column prop="outboundType" label="类型" width="100">
          <template #default="{ row }"><el-tag size="small">{{ outboundTypeMap[row.outboundType] }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="reason" label="出库原因" />
        <el-table-column prop="repairOrderId" label="关联工单" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="statusType[row.status]" size="small">{{ statusText[row.status] }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 1" size="small" type="success" @click="approve(row.id)">通过</el-button>
            <el-button v-if="row.status === 1" size="small" type="danger" @click="reject(row.id)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getPendingStockOuts, approveStockOut, rejectStockOut } from '@/api/stock-out';

const loading = ref(false);
const tableData = ref([]);
const statusText = { 1: '待审核', 2: '已通过', 3: '已驳回' };
const statusType = { 1: 'warning', 2: 'success', 3: 'danger' };
const outboundTypeMap = { order: '工单消耗', loss: '损耗', transfer: '调拨', other: '其他' };

const fetchData = async () => { loading.value = true; const res = await getPendingStockOuts(); tableData.value = res.data; loading.value = false; };
const approve = async (id) => { await approveStockOut(id); ElMessage.success('审核通过'); fetchData(); };
const reject = (id) => { ElMessageBox.prompt('请输入驳回原因', '驳回出库单', { inputType: 'textarea' }).then(async ({ value }) => { await rejectStockOut(id, value); ElMessage.success('已驳回'); fetchData(); }); };
onMounted(fetchData);
</script>

<style scoped lang="scss">
.page-container { background: transparent; }
.table-container { background: #fff; border: 1px solid #f0f2f5; border-radius: 14px; overflow: hidden; }
</style>