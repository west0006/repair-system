<template>
  <div class="page-container">
    <div class="toolbar">
      <el-button type="primary" @click="openAddDialog">新增供应商</el-button>
    </div>
    <div class="table-container">
      <el-table :data="tableData" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="供应商名称" />
        <el-table-column prop="contactPerson" label="联系人" />
        <el-table-column prop="phone" label="联系电话" />
        <el-table-column prop="address" label="地址" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '合作中' : '暂停合作' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
            <el-button size="small" @click="toggleStatus(row)">
              {{ row.status === 1 ? '暂停' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="form.contactPerson" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getSupplierList, createSupplier, updateSupplier, deleteSupplier, updateSupplierStatus, type Supplier } from '@/api/supplier';

const tableData = ref<Supplier[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const form = ref<Partial<Supplier>>({});
const rules = {
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
};

const fetchData = async () => {
  const res = await getSupplierList();
  tableData.value = res.data;
};

const openAddDialog = () => {
  dialogTitle.value = '新增供应商';
  form.value = {};
  dialogVisible.value = true;
};

const openEditDialog = (row: Supplier) => {
  dialogTitle.value = '编辑供应商';
  form.value = { ...row };
  dialogVisible.value = true;
};

const submitForm = async () => {
  await formRef.value.validate();
  if (form.value.id) {
    await updateSupplier(form.value.id, form.value);
    ElMessage.success('更新成功');
  } else {
    await createSupplier(form.value);
    ElMessage.success('创建成功');
  }
  dialogVisible.value = false;
  fetchData();
};

const handleDelete = (id: number) => {
  ElMessageBox.confirm('确定删除该供应商吗？', '提示', { type: 'warning' }).then(async () => {
    await deleteSupplier(id);
    ElMessage.success('删除成功');
    fetchData();
  });
};

const toggleStatus = async (row: Supplier) => {
  const newStatus = row.status === 1 ? 2 : 1;
  await updateSupplierStatus(row.id, newStatus);
  ElMessage.success('状态更新成功');
  fetchData();
};

onMounted(() => fetchData());
</script>

<style scoped lang="scss">
.page-container {
  background: transparent;
}
.toolbar {
  margin-bottom: 16px;
}
.table-container {
  background: #fff;
  border: 1px solid #f0f2f5;
  border-radius: 14px;
  overflow: hidden;
}
</style>