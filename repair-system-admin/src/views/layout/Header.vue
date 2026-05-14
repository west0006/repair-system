<template>
  <div class="header">
    <div class="user-section">
      <el-tag v-if="roleLabel" size="small" effect="plain" class="role-tag">
        {{ roleLabel }}
      </el-tag>
      <el-avatar :size="32" class="avatar"> {{ userName?.charAt(0) }} </el-avatar>
      <span class="user-name">{{ userName }}</span>
      <el-icon class="icon-logout" @click="handleLogout"><SwitchButton /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/store/user'
import { useRouter } from 'vue-router'
import { SwitchButton } from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()
const userName = computed(() => userStore.userInfo?.name || '管理员')
const userRole = computed(() => userStore.userInfo?.role)

const roleLabel = computed(() => {
  const map: Record<number, string> = {
    2: '超级管理员',
    3: '仓库管理员',
    4: '对账管理员',
  }
  return map[userRole.value] || ''
})

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped lang="scss">
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}
.app-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.3px;
}
.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
}
.role-tag {
  background: #e8f4f2;
  color: #0f766e;
  border: 1px solid #c7e5de;
  border-radius: 8px;
  font-size: 12px;
  padding: 2px 10px;
  height: auto;
  line-height: 1.5;
}
.avatar {
  background: #0f766e;
}
.user-name {
  font-size: 14px;
  color: #1e293b;
  font-weight: 600;
}
.icon-logout {
  font-size: 18px;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.2s;
  margin-left: 4px;
}
.icon-logout:hover {
  color: #0f766e;
}
</style>