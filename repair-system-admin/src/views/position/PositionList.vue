<template>
  <div class="page-container">
    <div class="toolbar">
      <el-button type="primary" @click="openAdd">新增岗位</el-button>
    </div>
    <div class="table-container">
      <el-table :data="tableData" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="岗位名称" />
        <el-table-column prop="dispatchType" label="派单类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ dispatchTypeMap[row.dispatchType] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="visibleToUser" label="用户可见" width="100">
          <template #default="{ row }">{{ row.visibleToUser ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column prop="allowTransfer" label="允许转单" width="100">
          <template #default="{ row }">{{ row.allowTransfer ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="岗位名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="派单类型" prop="dispatchType">
          <el-select v-model="form.dispatchType">
            <el-option label="直接派单" value="direct" />
            <el-option label="按责任区" value="area" />
            <el-option label="轮流派单" value="round_robin" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户可见" prop="visibleToUser">
          <el-switch v-model="form.visibleToUser" />
        </el-form-item>
        <el-form-item label="允许转单" prop="allowTransfer">
          <el-switch v-model="form.allowTransfer" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

const tableData = ref([]);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const form = ref({});
const dispatchTypeMap = { direct: '直接派单', area: '按责任区', round_robin: '轮流派单' };

const rules = {
  name: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  dispatchType: [{ required: true, message: '请选择派单类型', trigger: 'change' }],
};

const fetchData = async () => { const res = await request.get('/repair-position'); tableData.value = res.data; };
const openAdd = () => { dialogTitle.value = '新增岗位'; form.value = { visibleToUser: true, dispatchType: 'direct', allowTransfer: true, status: 1 }; dialogVisible.value = true; };
const openEdit = (row) => { dialogTitle.value = '编辑岗位'; form.value = { ...row }; dialogVisible.value = true; };
const submit = async () => {
  await formRef.value.validate();
  if (form.value.id) { await request.put(`/repair-position/${form.value.id}`, form.value); }
  else { await request.post('/repair-position', form.value); }
  ElMessage.success('保存成功');
  dialogVisible.value = false;
  fetchData();
};
const handleDelete = (id) => {
  ElMessageBox.confirm('确定删除该岗位吗？', '提示', { type: 'warning' }).then(async () => {
    await request.delete(`/repair-position/${id}`);
    ElMessage.success('删除成功');
    fetchData();
  });
};

onMounted(fetchData);
</script>

<style scoped lang="scss">
.page-container { background: transparent; }
.toolbar { margin-bottom: 16px; }
.table-container { background: #fff; border: 1px solid #f0f2f5; border-radius: 14px; overflow: hidden; }
</style>