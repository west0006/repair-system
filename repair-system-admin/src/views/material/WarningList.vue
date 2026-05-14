<template>
  <div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="库存不足" name="low">
        <el-table :data="lowStock" border stripe>
          <el-table-column prop="name" label="物料名称" />
          <el-table-column prop="spec" label="规格" />
          <el-table-column prop="stock" label="当前库存" />
          <el-table-column prop="minStock" label="最低库存" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="库存积压" name="high">
        <el-table :data="highStock" border stripe>
          <el-table-column prop="name" label="物料名称" />
          <el-table-column prop="spec" label="规格" />
          <el-table-column prop="stock" label="当前库存" />
          <el-table-column prop="maxStock" label="最高库存" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="临期物料" name="expiring">
        <el-table :data="expiring" border stripe>
          <el-table-column prop="name" label="物料名称" />
          <el-table-column prop="spec" label="规格" />
          <el-table-column prop="expiryDate" label="保质期" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getWarningList } from '@/api/material';

const activeTab = ref('low');
const lowStock = ref([]);
const highStock = ref([]);
const expiring = ref([]);

const fetchData = async () => {
  const res = await getWarningList();
  lowStock.value = res.data.lowStock;
  highStock.value = res.data.highStock;
  expiring.value = res.data.expiring;
};

onMounted(() => fetchData());
</script>