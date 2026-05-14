<template>
  <div class="page-container">
    <div class="table-container" style="margin-bottom: 16px; padding: 20px;">
      <div class="fee-title">创建盘点单</div>
      <el-form :inline="true"><el-form-item><el-button type="primary" @click="openMaterialSelect">选择物料</el-button></el-form-item></el-form>
      <el-table :data="selectedMaterials" border size="small">
        <el-table-column prop="name" label="物料名称" />
        <el-table-column prop="spec" label="规格" />
        <el-table-column prop="stock" label="账面库存" />
        <el-table-column label="实际库存" width="150"><template #default="{ row }"><el-input-number v-model="row.actualQuantity" :min="0" size="small" /></template></el-table-column>
        <el-table-column label="备注"><template #default="{ row }"><el-input v-model="row.note" size="small" /></template></el-table-column>
        <el-table-column label="操作" width="60"><template #default="{ $index }"><el-button size="small" type="danger" @click="removeMaterial($index)">删除</el-button></template></el-table-column>
      </el-table>
      <el-button type="primary" @click="submitCheck" style="margin-top: 16px">提交盘点</el-button>
    </div>

    <div class="table-container" style="padding: 20px;">
      <div class="fee-title">待审核盘点单</div>
      <el-table :data="pendingChecks" border size="small">
        <el-table-column prop="checkNo" label="盘点单号" />
        <el-table-column label="明细" min-width="200">
          <template #default="{ row }"><div v-for="item in row.items" :key="item.materialId">{{ getMaterialName(item.materialId) }}: 账面 {{ getMaterialStock(item.materialId) }} → 实际 {{ item.actualQuantity }}</div></template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="approve(row.id)">通过</el-button>
            <el-button size="small" type="danger" @click="reject(row.id)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="materialDialog" title="选择物料" width="80%">
      <el-table :data="allMaterials" @selection-change="handleSelectionChange" row-key="id" size="small">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="物料名称" />
        <el-table-column prop="spec" label="规格" />
        <el-table-column prop="stock" label="当前库存" />
      </el-table>
      <template #footer><el-button @click="materialDialog = false">取消</el-button><el-button type="primary" @click="confirmSelection">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getMaterialList } from '@/api/material';
import { createStockCheck, getPendingStockChecks, approveStockCheck, rejectStockCheck } from '@/api/stock-check';

interface SelectedMaterial {
  id: number;
  name: string;
  spec: string;
  stock: number;
  actualQuantity: number;
  note?: string;
}

const allMaterials = ref<any[]>([]);
const selectedMaterials = ref<SelectedMaterial[]>([]);
const materialDialog = ref(false);
const pendingChecks = ref<any[]>([]);
const tempSelection = ref<SelectedMaterial[]>([]);

const fetchMaterials = async () => {
  const res = await getMaterialList();
  allMaterials.value = res.data;
};

const openMaterialSelect = () => {
  materialDialog.value = true;
};

const handleSelectionChange = (selection: any[]) => {
  tempSelection.value = selection;
};

const confirmSelection = () => {
  const newMaterials = tempSelection.value.map(m => ({
    id: m.id,
    name: m.name,
    spec: m.spec,
    stock: m.stock,
    actualQuantity: m.stock,
    note: '',
  }));
  // 合并去重
  const existingIds = new Set(selectedMaterials.value.map(s => s.id));
  const toAdd = newMaterials.filter(m => !existingIds.has(m.id));
  selectedMaterials.value.push(...toAdd);
  materialDialog.value = false;
};

const removeMaterial = (index: number) => {
  selectedMaterials.value.splice(index, 1);
};

const submitCheck = async () => {
  if (selectedMaterials.value.length === 0) {
    ElMessage.warning('请选择至少一种物料');
    return;
  }
  const items = selectedMaterials.value.map(item => ({
    materialId: item.id,
    actualQuantity: item.actualQuantity,
    note: item.note,
  }));
  await createStockCheck(items);
  ElMessage.success('盘点单已创建，待审核');
  selectedMaterials.value = [];
  fetchPending();
};

const fetchPending = async () => {
  const res = await getPendingStockChecks();
  pendingChecks.value = res.data;
};

const approve = async (id: number) => {
  await approveStockCheck(id);
  ElMessage.success('已通过');
  fetchPending();
};

const reject = (id: number) => {
  ElMessageBox.prompt('请输入驳回原因', '驳回盘点单', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'textarea',
  }).then(async ({ value }) => {
    await rejectStockCheck(id, value);
    ElMessage.success('已驳回');
    fetchPending();
  });
};

const getMaterialName = (id: number) => {
  const m = allMaterials.value.find(m => m.id === id);
  return m ? m.name : '';
};
const getMaterialStock = (id: number) => {
  const m = allMaterials.value.find(m => m.id === id);
  return m ? m.stock : 0;
};

onMounted(() => {
  fetchMaterials();
  fetchPending();
});
</script>

<style scoped lang="scss">
.page-container { background: transparent; }
.table-container { background: #fff; border: 1px solid #f0f2f5; border-radius: 14px; overflow: hidden; }
.fee-title { font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 12px; padding-left: 10px; border-left: 4px solid #0f766e; }
</style>