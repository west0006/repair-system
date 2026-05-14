<template>
  <div class="page-container">
    <div class="table-container" style="padding: 20px; margin-bottom: 16px;">
      <div class="fee-title">出库登记</div>
      <el-form :model="form" label-width="100px">
        <el-form-item label="出库类型">
          <el-select v-model="form.outboundType">
            <el-option label="工单消耗" value="order" />
            <el-option label="损耗" value="loss" />
            <el-option label="调拨" value="transfer" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联工单" v-if="form.outboundType === 'order'">
          <el-input v-model="form.repairOrderId" placeholder="请输入工单ID" />
        </el-form-item>
        <el-form-item label="物料">
          <el-select v-model="form.materialId" filterable placeholder="请选择物料">
            <el-option v-for="m in materials" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="form.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="出库原因">
          <el-input v-model="form.reason" type="textarea" />
        </el-form-item>
        <el-form-item><el-button type="primary" @click="submit">确认出库</el-button></el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getMaterialList, outbound } from '@/api/material';
import { useUserStore } from '@/store/user';

const materials = ref<any[]>([]);
const userStore = useUserStore();
const form = ref({ outboundType: 'order', repairOrderId: null as number | null, materialId: null as number | null, quantity: 1, reason: '' });

const fetchMaterials = async () => { const res = await getMaterialList(); materials.value = res.data; };

const submit = async () => {
  if (!form.value.materialId || form.value.quantity <= 0) { ElMessage.warning('请填写完整信息'); return; }
  await outbound({ materialId: form.value.materialId, outboundType: form.value.outboundType, quantity: form.value.quantity, reason: form.value.reason, repairOrderId: form.value.repairOrderId ?? undefined }, userStore.userInfo.id);
  ElMessage.success('出库成功');
  form.value = { outboundType: 'order', repairOrderId: null, materialId: null, quantity: 1, reason: '' };
};

onMounted(fetchMaterials);
</script>

<style scoped lang="scss">
.page-container { background: transparent; }
.table-container { background: #fff; border: 1px solid #f0f2f5; border-radius: 14px; overflow: hidden; }
.fee-title { font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 16px; padding-left: 10px; border-left: 4px solid #0f766e; }
</style>