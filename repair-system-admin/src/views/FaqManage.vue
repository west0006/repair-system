<template>
  <div class="page-container">
    <div class="toolbar">
      <el-button type="primary" @click="openAddDialog">新增FAQ</el-button>
    </div>
    <div class="table-container">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="keyword" label="关键词" width="150" />
        <el-table-column prop="solution" label="解决方案" min-width="300" show-overflow-tooltip />
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
            <el-button size="small" :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row)">{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="pagination">
      <el-pagination v-model:current-page="page.current" v-model:page-size="page.size" :total="page.total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next" @size-change="fetchData" @current-change="fetchData" />
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="关键词" prop="keyword"><el-input v-model="form.keyword" /></el-form-item>
        <el-form-item label="解决方案" prop="solution"><el-input v-model="form.solution" type="textarea" :rows="4" /></el-form-item>
        <el-form-item label="排序" prop="sortOrder"><el-input-number v-model="form.sortOrder" :min="0" /></el-form-item>
        <el-form-item label="状态" prop="status"><el-radio-group v-model="form.status"><el-radio :value="1">启用</el-radio><el-radio :value="2">禁用</el-radio></el-radio-group></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

interface Faq { id: number; keyword: string; solution: string; sortOrder: number; status: number; remark?: string; }
const loading = ref(false);
const tableData = ref<Faq[]>([]);
const page = reactive({ current: 1, size: 20, total: 0 });
const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const submitting = ref(false);
const form = reactive<Partial<Faq>>({ keyword: '', solution: '', sortOrder: 0, status: 1, remark: '' });
const rules = { keyword: [{ required: true, message: '请输入关键词', trigger: 'blur' }], solution: [{ required: true, message: '请输入解决方案', trigger: 'blur' }] };

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await request.get('/faq', { params: { page: Number(page.current), limit: Number(page.size) } });
    tableData.value = res.data; page.total = res.total || 0;
  } catch (err) { ElMessage.error('获取FAQ列表失败'); }
  finally { loading.value = false; }
};
const openAddDialog = () => { dialogTitle.value = '新增FAQ'; form.id = undefined; form.keyword = ''; form.solution = ''; form.sortOrder = 0; form.status = 1; form.remark = ''; dialogVisible.value = true; };
const openEditDialog = (row: Faq) => { dialogTitle.value = '编辑FAQ'; Object.assign(form, row); dialogVisible.value = true; };
const submitForm = async () => {
  await formRef.value.validate();
  submitting.value = true;
  try {
    if (form.id) { await request.put(`/faq/${form.id}`, form); ElMessage.success('更新成功'); }
    else { await request.post('/faq', form); ElMessage.success('创建成功'); }
    dialogVisible.value = false; fetchData();
  } catch (err) { ElMessage.error('操作失败'); }
  finally { submitting.value = false; }
};
const handleDelete = (id: number) => { ElMessageBox.confirm('确定删除该FAQ吗？', '提示', { type: 'warning' }).then(async () => { await request.delete(`/faq/${id}`); ElMessage.success('删除成功'); fetchData(); }); };
const toggleStatus = async (row: Faq) => { const ns = row.status === 1 ? 2 : 1; await request.put(`/faq/${row.id}`, { ...row, status: ns }); ElMessage.success('状态更新成功'); fetchData(); };
onMounted(() => fetchData());
</script>

<style scoped lang="scss">
.page-container { background: transparent; }
.toolbar { margin-bottom: 16px; }
.table-container { background: #fff; border: 1px solid #f0f2f5; border-radius: 14px; overflow: hidden; }
.pagination { margin-top: 14px; display: flex; justify-content: flex-end; }
</style>