<template>
  <div class="page-container">
    <div class="search-bar">
      <el-form :inline="true" :model="search" class="search-inline">
        <el-form-item label="物料名称">
          <el-input v-model="search.name" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="search.categoryId" clearable placeholder="全部">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="success" @click="openAddDialog">新增物料</el-button>
          <el-button type="warning" @click="handleCleanData" :loading="cleaning">一键清洗</el-button>
          <el-upload
            :before-upload="beforeUpload"
            :http-request="uploadMaterials"
            accept=".xlsx,.xls"
            :show-file-list="false"
            style="display: inline-block; margin-left: 8px;"
          >
            <el-button type="success">一键导入</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="物料名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="spec" label="规格" width="120" />
        <el-table-column prop="unit" label="单位" width="70" />
        <el-table-column prop="price" label="进价(元)" width="100" />
        <el-table-column prop="standardDiscount" label="标准折扣" width="100">
          <template #default="{ row }">
            {{ formatDiscount(row.standardDiscount) }}
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column prop="minStock" label="最低库存" width="90" />
        <el-table-column prop="maxStock" label="最高库存" width="90" />
        <el-table-column prop="lockedStock" label="锁定库存" width="90" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
<el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="物料名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="规格" prop="spec">
          <el-input v-model="form.spec" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" clearable>
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="进价(元)" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="标准折扣" prop="standardDiscount">
          <el-input-number
            v-model="form.standardDiscount"
            :min="0"
            :max="1"
            :step="0.01"
            :precision="2"
          />
          <span class="form-tip">如 0.80 表示八折，默认 1.00</span>
        </el-form-item>
        <el-form-item label="最低库存" prop="minStock">
          <el-input-number v-model="form.minStock" :min="0" />
        </el-form-item>
        <el-form-item label="最高库存" prop="maxStock">
          <el-input-number v-model="form.maxStock" :min="0" />
        </el-form-item>
        <el-form-item label="供应商" prop="supplierId">
          <el-select v-model="form.supplierId" clearable filterable>
            <el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="保质期" prop="expiryDate">
          <el-date-picker v-model="form.expiryDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="2">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
    <div class="pagination">
      <el-pagination
        v-model:current-page="page.current"
        v-model:page-size="page.size"
        :total="page.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getMaterialList, type Material } from '@/api/material';
import { getCategoryList, type Category } from '@/api/category';
import { getSupplierList, type Supplier } from '@/api/supplier';
import request from '@/utils/request';
import type { UploadRawFile } from 'element-plus';

const loading = ref(false);
const tableData = ref<Material[]>([]);
const categories = ref<Category[]>([]);
const suppliers = ref<Supplier[]>([]);
const search = reactive({ name: '', categoryId: null as number | null });
const page = reactive({ current: 1, size: 20, total: 0 });

const dialogVisible = ref(false);
const dialogTitle = ref('');
const formRef = ref();
const submitting = ref(false);
const cleaning = ref(false)
const form = reactive<Partial<Material & { id?: number }>>({
  name: '',
  spec: '',
  unit: '',
  categoryId: undefined,
  price: 0,
  standardDiscount: 1.0,
  minStock: 0,
  maxStock: 0,
  supplierId: undefined,
  expiryDate: '',
  status: 1,
});

const rules = {
  name: [{ required: true, message: '请输入物料名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入进价', trigger: 'blur' }],
};

const formatDiscount = (val: number | undefined) => {
  if (val === undefined || val === null) return '无';
  return `${(val * 10).toFixed(1)}折`;
};
const beforeUpload = (file: UploadRawFile) => {
  const isExcel = /\.(xlsx?|xls)$/.test(file.name);
  if (!isExcel) {
    ElMessage.error('仅支持 Excel 文件（.xlsx / .xls）');
    return false;
  }
  return true;
};

const handleCleanData = async () => {
  ElMessageBox.confirm(
    '即将执行全量物料数据清洗，包括提取规格、重新分类、修复单位等操作，确定继续？',
    '警告',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  )
    .then(async () => {
      cleaning.value = true
      try {
        const res = await request.post('/material/clean')
        ElMessage.success(res.data?.message || '清洗完成')
        fetchData()
      } catch (err) {
        console.log(err)
        ElMessage.error('清洗失败')
      } finally {
        cleaning.value = false
      }
    })
    .catch(() => {})
}
const uploadMaterials = async (options: any) => {
  const formData = new FormData();
  formData.append('file', options.file);
  try {
    await request.post('/material/import/batch', formData);
    ElMessage.success('导入成功');
    fetchData();
  } catch (err) {
    ElMessage.error('导入失败');
  }
};
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.current,
      limit: page.size,
      name: search.name || undefined,
      categoryId: search.categoryId || undefined,
    };
    const res = await getMaterialList(params);
    tableData.value = res.data;
    page.total = res.total || 0;
  } catch (err) {
    ElMessage.error('获取物料列表失败');
  } finally {
    loading.value = false;
  }
};

const resetSearch = () => {
  search.name = '';
  search.categoryId = null;
  page.current = 1;
  fetchData();
};

const fetchCategories = async () => {
  const res = await getCategoryList();
  categories.value = res.data;
};

const fetchSuppliers = async () => {
  const res = await getSupplierList();
  suppliers.value = res.data;
};

const openAddDialog = () => {
  dialogTitle.value = '新增物料';
  Object.assign(form, {
    id: undefined,
    name: '',
    spec: '',
    unit: '',
    categoryId: undefined,
    price: 0,
    standardDiscount: 1.0,
    minStock: 0,
    maxStock: 0,
    supplierId: undefined,
    expiryDate: '',
    status: 1,
  });
  dialogVisible.value = true;

};

const openEditDialog = (row: Material) => {
  dialogTitle.value = '编辑物料';
  Object.assign(form, { ...row });
  dialogVisible.value = true;
};

const submitForm = async () => {
  await formRef.value.validate();
  submitting.value = true;
  try {
    if (form.id) {
      await request.put(`/material/${form.id}`, form);
      ElMessage.success('更新成功');
    } else {
      await request.post('/material', form);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    fetchData();
  } catch (err) {
    ElMessage.error('操作失败');
  } finally {
    submitting.value = false;
  }
};

const handleDelete = (id: number) => {
  ElMessageBox.confirm('确定删除该物料吗？', '提示', { type: 'warning' }).then(async () => {
    await request.delete(`/material/${id}`);
    ElMessage.success('删除成功');
    fetchData();
  });
};

onMounted(() => {
  fetchCategories();
  fetchSuppliers();
  fetchData();
});
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