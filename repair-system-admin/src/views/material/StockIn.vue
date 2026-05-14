<template>
  <div>
    <el-card>
      <template #header>入库登记</template>
      <el-form :model="form" label-width="100px">
        <el-form-item label="物料">
          <el-select v-model="form.materialId" filterable>
            <el-option v-for="m in materials" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="form.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="单价">
          <el-input-number v-model="form.unitPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="form.supplierId" filterable clearable>
            <el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submit">提交</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { inbound, getMaterialList } from '@/api/material';
import { getSupplierList } from '@/api/supplier';

const materials = ref<any[]>([]);
const suppliers = ref<any[]>([]);
const form = ref({
  materialId: null as number | null,
  quantity: 1,
  unitPrice: 0,
  supplierId: null as number | null,
  remark: '',
});

const fetchMaterials = async () => {
  const res = await getMaterialList();
  materials.value = res.data;
};

const fetchSuppliers = async () => {
  const res = await getSupplierList();
  suppliers.value = res.data;
};

const submit = async () => {
  if (!form.value.materialId || form.value.quantity <= 0) {
    ElMessage.warning('请完整填写信息');
    return;
  }
  await inbound({
    materialId: form.value.materialId,
    quantity: form.value.quantity,
    unitPrice: form.value.unitPrice,
    supplierId: form.value.supplierId ?? undefined,
    remark: form.value.remark,
  });
  ElMessage.success('入库成功');
  form.value = { materialId: null, quantity: 1, unitPrice: 0, supplierId: null, remark: '' };
};

onMounted(() => {
  fetchSuppliers();
  fetchMaterials();
});
</script>