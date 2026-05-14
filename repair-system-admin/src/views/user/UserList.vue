<template>
  <div class="page-container">
    <div class="search-bar">
      <el-form :inline="true" :model="search" class="search-inline">
        <el-form-item label="用户名">
          <el-input v-model="search.username" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="search.name" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="search.phone" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="search.role" clearable placeholder="全部">
            <el-option label="普通用户" :value="0" />
            <el-option label="维修师傅" :value="1" />
            <el-option label="超级管理员" :value="2" />
            <el-option label="仓库管理员" :value="3" />
            <el-option label="对账管理员" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-upload
            :before-upload="beforeUpload"
            :http-request="handleImport"
            accept=".xlsx,.xls"
            :show-file-list="false"
            style="display: inline-block; margin-left: 8px;"
          >
            <el-button type="success">批量导入</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            {{ roleNameMap[row.role] || '未知角色' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="180">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination">
      <el-pagination
        v-model:current-page="page.current"
        v-model:page-size="page.size"
        :total="page.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getUserList, updateUser, importUsers, type User } from '@/api/user-manage';
import { formatDate } from '@/utils/format';

const loading = ref(false);
const tableData = ref<User[]>([]);
const search = reactive({ username: '', name: '', phone: '', role: null as number | null });
const page = reactive({ current: 1, size: 20, total: 0 });

const dialogVisible = ref(false);
const formRef = ref();
const submitting = ref(false);
const form = reactive<Partial<User> & { password?: string }>({
  id: undefined,
  name: '',
  phone: '',
  password: '',
  role: 0,
});
const roleNameMap: Record<number, string> = {
  0: '普通用户',
  1: '维修师傅',
  2: '超级管理员',
  3: '仓库管理员',
  4: '对账管理员',
}
const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
};

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.current,
      limit: page.size,
      ...search,
    };
    const res = await getUserList(params);
    tableData.value = res.data;
    page.total = res.total || 0;
  } catch (err) {
    console.log(err)
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.current = 1;
  fetchData();
};

const resetSearch = () => {
  search.username = '';
  search.name = '';
  search.phone = '';
  search.role = null;
  page.current = 1;
  fetchData();
};

const openEdit = (row: User) => {
  form.id = row.id;
  form.name = row.name;
  form.phone = row.phone;
  form.role = row.role;
  form.password = '';
  dialogVisible.value = true;
};

const submitEdit = async () => {
  await formRef.value.validate();
  submitting.value = true;
  try {
    const payload: any = {
      name: form.name,
      phone: form.phone,
      role: form.role,
    };
    if (form.password) {
      payload.password = form.password;
    }
    await updateUser(form.id!, payload);
    ElMessage.success('修改成功');
    dialogVisible.value = false;
    fetchData();
  } catch (err) {
    ElMessage.error('修改失败');
  } finally {
    submitting.value = false;
  }
};

const handleImport = async (options: any) => {
  try {
    const res = await importUsers(options.file);
    ElMessage.success(`导入完成，成功 ${res.data.total} 条`);
    fetchData();
  } catch (err) {
    ElMessage.error('导入失败');
  }
};

const beforeUpload = (file: File) => {
  const isExcel = /\.(xlsx?|xls)$/.test(file.name);
  if (!isExcel) {
    ElMessage.error('仅支持 Excel 文件');
    return false;
  }
  return true;
};

onMounted(fetchData);
</script>

<style scoped lang="scss">
.page-container {
  background: transparent;
}
.search-bar {
  background: #fff;
  border: 1px solid #f0f2f5;
  border-radius: 14px;
  padding: 14px 18px;
  margin-bottom: 16px;
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