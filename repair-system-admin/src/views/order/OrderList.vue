<template>
  <div class="order-list">
    <!-- 搜索表单 -->
    <SearchForm :fields="searchFields" @search="handleSearch" />
    <div class="toolbar">
      <el-switch v-model="autoDispatch" active-text="自动派单" inactive-text="手动派单" @change="handleDispatchModeChange" />
      <el-button type="primary" @click="exportOrders" :loading="exportLoading">导出 Excel</el-button>
    </div>

    <div class="table-container">
      <el-table :data="tableData" stripe v-loading="loading" :header-cell-style="{ background: '#f7f8fa', fontWeight: 600 }">
        <el-table-column prop="orderNo" label="工单号" width="180" />
        <el-table-column prop="userName" label="报修人" width="120" />
        <el-table-column prop="faultType" label="故障类型" width="150" />
        <el-table-column prop="locationBuilding" label="位置" width="150" />
        <el-table-column prop="urgency" label="紧急程度" width="100">
          <template #default="{ row }">
            <UrgencyStatus :status="row.urgency" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <OrderStatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 1" size="small" type="success" @click="approve(row)">通过</el-button>
            <el-button v-if="row.status === 1" size="small" type="danger" @click="reject(row)">驳回</el-button>
            <el-button v-if="row.status === 2" size="small" type="primary" @click="openDispatch(row)">派单</el-button>
            <el-button size="small" @click="viewDetail(row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination">
      <el-pagination
        v-model:current-page="page.current"
        v-model:page-size="page.size"
        :total="page.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 派单对话框 -->
    <el-dialog v-model="dispatchVisible" title="派单" width="400px">
      <el-select
        v-model="selectedTechnician"
        placeholder="请选择维修师傅"
        style="width: 100%"
        filterable
      >
        <el-option
          v-for="t in technicians"
          :key="t.id"
          :label="t.user?.name || t.name"
          :value="t.id"
        />
      </el-select>
      <template #footer>
        <el-button @click="dispatchVisible = false">取消</el-button>
        <el-button type="primary" @click="doDispatch" :loading="dispatchLoading">
          确认派单
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getOrderList,
  approveOrder,
  rejectOrder,
  dispatchOrder,
  exportOrders as apiExport,
} from '@/api/order';
import { getTechnicianList } from '@/api/technician';
import SearchForm from '@/components/SearchForm.vue';
import OrderStatusTag from '@/components/OrderStatusTag.vue';
import UrgencyStatus from '@/components/urgencyStatus.vue';
import { useOrderConfigStore } from '@/store/orderConfig';
import { ORDER_STATUS } from '@/constants/orderConstants';

const router = useRouter();
const orderConfigStore = useOrderConfigStore();
const autoDispatch = ref(orderConfigStore.autoDispatch);

// ==================== 搜索字段配置 ====================
// 基于 ORDER_STATUS 常量动态生成状态选项
const statusOptions = [
  { label: '全部', value: '' },
  ...Object.entries(ORDER_STATUS).map(([value, { text }]) => ({
    label: text,
    value: Number(value),
  })),
];

const searchFields = [
  { label: '工单号', key: 'orderNo', type: 'input', placeholder: '请输入工单号' },
  { label: '报修人', key: 'userName', type: 'input', placeholder: '请输入报修人姓名' },
  {
    label: '状态',
    key: 'status',
    type: 'select',
    placeholder: '请选择状态',
    options: statusOptions,
  },
  { label: '日期范围', key: 'dateRange', type: 'daterange' },
];

// ==================== 响应式数据 ====================
const loading = ref(false);
const exportLoading = ref(false);
const tableData = ref<any[]>([]);
const page = reactive({
  current: 1,
  size: 10,
  total: 0,
});
const searchParams = ref<Record<string, any>>({});

// 派单相关
const technicians = ref<any[]>([]);
const dispatchVisible = ref(false);
const dispatchLoading = ref(false);
const selectedTechnician = ref<number | null>(null);
const currentOrder = ref<any>(null);

// ==================== 数据获取 ====================
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.current,
      pageSize: page.size,
      ...searchParams.value,
    };
    // 处理日期范围
    if (params.dateRange && params.dateRange.length === 2) {
      params.startDate = params.dateRange[0];
      params.endDate = params.dateRange[1];
      delete params.dateRange;
    }
    const res = await getOrderList(params);
    tableData.value = res.data;
    page.total = res.total || 0;
  } catch (error) {
    console.error('获取工单列表失败', error);
    ElMessage.error('加载工单列表失败');
  } finally {
    loading.value = false;
  }
};

// ==================== 事件处理 ====================
const handleSearch = (params: Record<string, any>) => {
  searchParams.value = params;
  page.current = 1;
  fetchData();
};

const handleSizeChange = (size: number) => {
  page.size = size;
  fetchData();
};

const handleCurrentChange = (current: number) => {
  page.current = current;
  fetchData();
};

const handleDispatchModeChange = (val: boolean) => {
  orderConfigStore.toggleAutoDispatch(val);
  ElMessage.success(`已切换为${val ? '自动' : '手动'}派单模式`);
};

// 通过工单
const approve = async (row: any) => {
  try {
    await approveOrder(row.id, autoDispatch.value);
    ElMessage.success(autoDispatch.value ? '已通过，系统将自动派单' : '已通过，请手动派单');
    fetchData();
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

// 驳回工单
const reject = (row: any) => {
  ElMessageBox.prompt('请输入驳回原因', '驳回工单', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputValidator: (value: string) => {
      if (!value) return '驳回原因不能为空';
      return true;
    },
  })
    .then(async ({ value }) => {
      await rejectOrder(row.id, value);
      ElMessage.success('已驳回');
      fetchData();
    })
    .catch(() => {});
};

// 打开派单对话框
const openDispatch = async (row: any) => {
  currentOrder.value = row;
  try {
    const res = await getTechnicianList();
    technicians.value = res.data;
    dispatchVisible.value = true;
    selectedTechnician.value = null;
  } catch (error) {
    ElMessage.error('获取师傅列表失败');
  }
};

// 执行派单
const doDispatch = async () => {
  if (!selectedTechnician.value) {
    ElMessage.warning('请选择维修师傅');
    return;
  }
  dispatchLoading.value = true;
  try {
    await dispatchOrder(currentOrder.value.id, selectedTechnician.value);
    ElMessage.success('派单成功');
    dispatchVisible.value = false;
    fetchData();
  } catch (error) {
    ElMessage.error('派单失败');
  } finally {
    dispatchLoading.value = false;
  }
};

// 导出 Excel
const exportOrders = async () => {
  exportLoading.value = true;
  try {
    const params = { ...searchParams.value };
    if (params.dateRange && params.dateRange.length === 2) {
      params.startDate = params.dateRange[0];
      params.endDate = params.dateRange[1];
      delete params.dateRange;
    }
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });
    const response = await apiExport(params);
    const blob = response.data;
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `工单列表_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    ElMessage.success('导出成功');
  } catch (error) {
    console.error('导出失败', error);
    ElMessage.error('导出失败');
  } finally {
    exportLoading.value = false;
  }
};

// 查看详情
const viewDetail = (id: number) => {
  router.push(`/order/detail/${id}`);
};

// ==================== 生命周期 ====================
onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.order-list {
  background: transparent;
}
.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
  gap: 12px;
  align-items: center;
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