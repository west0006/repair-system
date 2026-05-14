<template>
  <div class="page-container">
    <div class="toolbar">
      <el-button type="primary" @click="openAdd">新增师傅</el-button>
    </div>
    <div class="table-container">
      <el-table :data="tableData" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="user.name" label="姓名" width="120" />
        <el-table-column prop="user.phone" label="电话" width="150" />
        <el-table-column prop="areaId" label="责任区" width="100" />
        <el-table-column prop="skills" label="工种" min-width="150" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '空闲' : '忙碌' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" title="新增师傅" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="工种" prop="skills">
          <el-select v-model="form.skills" multiple filterable placeholder="请选择工种">
            <el-option v-for="p in positions" :key="p.id" :label="p.name" :value="p.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="责任楼栋" prop="buildingIds">
          <el-select v-model="form.buildingIds" multiple filterable placeholder="请选择责任楼栋">
            <el-option v-for="b in buildings" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getTechnicianList, createTechnician } from '@/api/technician';
import request from '@/utils/request';

interface Position { id: number; name: string }
interface Building { id: number; name: string }

const positions = ref<Position[]>([]);
const buildings = ref<Building[]>([]);
const tableData = ref<any[]>([]);
const dialogVisible = ref(false);
const form = ref({ username: '', password: '', name: '', phone: '', skills: [] as string[], buildingIds: [] as number[] });
const formRef = ref();

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入电话', trigger: 'blur' }],
};

const fetchData = async () => {
  const res = await getTechnicianList();
  tableData.value = res.data;
};

const fetchPositions = async () => {
  const res = await request.get('/repair-position/visible');
  positions.value = res.data;
};

const fetchBuildings = async () => {
  const res = await request.get('/building/list');
  buildings.value = res.data;
};

const openAdd = () => {
  form.value = { username: '', password: '', name: '', phone: '', skills: [], buildingIds: [] };
  dialogVisible.value = true;
};

const submit = async () => {
  await formRef.value.validate();
  await createTechnician({ ...form.value, skills: form.value.skills.join(',') });
  ElMessage.success('添加成功');
  dialogVisible.value = false;
  fetchData();
};

onMounted(() => { fetchPositions(); fetchBuildings(); fetchData(); });
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