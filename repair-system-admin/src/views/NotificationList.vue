<template>
  <div>
    <el-table :data="tableData" border stripe>
      <el-table-column prop="title" label="标题" width="200" />
      <el-table-column prop="content" label="内容" />
      <el-table-column prop="createdAt" label="时间" width="180" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isRead ? 'info' : 'warning'">{{ row.isRead ? '已读' : '未读' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button size="small" v-if="!row.isRead" @click="markRead(row.id)">标记已读</el-button>
          <el-button size="small" @click="viewLink(row.link)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getNotifications, markAsRead } from '@/api/notification';

const router = useRouter();
const tableData = ref<any[]>([]);

const fetchData = async () => {
  const res = await getNotifications();
  tableData.value = res.data;
};

const markRead = async (id: number) => {
  await markAsRead(id);
  ElMessage.success('已标记已读');
  fetchData();
};

const viewLink = (link: string) => {
  if (link) router.push(link);
};

onMounted(() => fetchData());
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
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
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