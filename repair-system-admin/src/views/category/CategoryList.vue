<template>
  <div class="page-container">
    <div class="toolbar">
      <el-button type="primary" @click="openAddDialog">新增分类</el-button>
    </div>
    <div class="table-container">
      <el-table :data="tableData" stripe row-key="id">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="分类名称" />
        <el-table-column prop="parentId" label="父级ID" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
            <el-button size="small" @click="toggleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
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
        <el-form-item label="父级分类" prop="parentId">
          <el-select v-model="form.parentId" clearable placeholder="请选择">
            <el-option label="无" :value="undefined" />
            <el-option v-for="c in tableData" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
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
import { getCategoryList, createCategory, updateCategory, deleteCategory, updateCategoryStatus, type Category } from '@/api/category';

const tableData = ref<Category[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const form = ref<Partial<Category>>({});
const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
};

const fetchData = async () => {
  const res = await getCategoryList();
  tableData.value = res.data;
};

const openAddDialog = () => {
  dialogTitle.value = '新增分类';
  form.value = {};
  dialogVisible.value = true;
};

const openEditDialog = (row: Category) => {
  dialogTitle.value = '编辑分类';
  form.value = { ...row };
  dialogVisible.value = true;
};

const submitForm = async () => {
  await formRef.value.validate();
  if (form.value.id) {
    await updateCategory(form.value.id, form.value);
    ElMessage.success('更新成功');
  } else {
    await createCategory(form.value);
    ElMessage.success('创建成功');
  }
  dialogVisible.value = false;
  fetchData();
};

const handleDelete = (id: number) => {
  ElMessageBox.confirm('确定删除该分类吗？', '提示', { type: 'warning' }).then(async () => {
    await deleteCategory(id);
    ElMessage.success('删除成功');
    fetchData();
  });
};

const toggleStatus = async (row: Category) => {
  const newStatus = row.status === 1 ? 2 : 1;
  await updateCategoryStatus(row.id, newStatus);
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