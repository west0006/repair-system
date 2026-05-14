<template>
  <div class="sidebar">
    <div class="logo">
      <span class="logo-text">后勤维修</span>
    </div>
    <el-menu :default-active="$route.path" class="menu-list" router>
      <el-menu-item v-if="hasRole(2,3,4)" index="/dashboard">
        <el-icon><DataAnalysis /></el-icon><span>数据看板</span>
      </el-menu-item>
      <el-menu-item v-if="hasRole(2,4)" index="/order">
        <el-icon><List /></el-icon><span>工单管理</span>
      </el-menu-item>
      <el-menu-item v-if="hasRole(2)" index="/users">
        <el-icon><User /></el-icon><span>用户管理</span>
      </el-menu-item>
      <el-menu-item v-if="hasRole(2)" index="/technician">
        <el-icon><Avatar /></el-icon><span>维修师傅</span>
      </el-menu-item>
      <el-sub-menu v-if="hasRole(2,3)" index="material">
        <template #title><el-icon><Goods /></el-icon><span>物料管理</span></template>
        <el-menu-item index="/material">物料列表</el-menu-item>
        <el-menu-item index="/stock-in">入库管理</el-menu-item>
        <el-menu-item index="/stock-out">出库管理</el-menu-item>
        <el-menu-item index="/warning">库存预警</el-menu-item>
        <el-menu-item index="/stock-check">库存盘点</el-menu-item>
        <el-menu-item index="/material-applications">申领审批</el-menu-item>
        <el-menu-item index="/stock-out-approval">出库审核</el-menu-item>
      </el-sub-menu>
      <el-menu-item v-if="hasRole(2,3)" index="/supplier">
        <el-icon><OfficeBuilding /></el-icon><span>供应商</span>
      </el-menu-item>
      <el-menu-item v-if="hasRole(2,3)" index="/category">
        <el-icon><Collection /></el-icon><span>物料分类</span>
      </el-menu-item>
      <el-menu-item v-if="hasRole(2)" index="/position">
        <el-icon><Briefcase /></el-icon><span>岗位管理</span>
      </el-menu-item>
      <el-menu-item v-if="hasRole(2)" index="/faq-manage">
        <el-icon><EditPen /></el-icon><span>FAQ管理</span>
      </el-menu-item>
      <el-menu-item index="/notifications">
        <el-icon><Bell /></el-icon><span>系统通知</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'
import {
  DataAnalysis, List, User, Avatar, Goods, OfficeBuilding,
  Collection, Briefcase, EditPen, Bell
} from '@element-plus/icons-vue'

const userStore = useUserStore()
const hasRole = (...roles: number[]) => roles.includes(userStore.userInfo?.role)
</script>

<style scoped lang="scss">
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.logo {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #f0f2f5;
  flex-shrink: 0;
}
.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #0f766e;
  letter-spacing: 0.5px;
}
.menu-list {
  flex: 1;
  overflow-y: auto;
  border-right: none !important;
  background: transparent;
  padding: 8px 10px;
}
:deep(.el-menu-item) {
  margin: 2px 0;
  border-radius: 12px;
  height: 44px;
  line-height: 44px;
  font-size: 14px;
  color: #4b5563;
  transition: all 0.2s;
}
:deep(.el-menu-item:hover) {
  background: #f2f3f5;
  color: #0f766e;
}
:deep(.el-menu-item.is-active) {
  background: #e8f4f2;
  color: #0f766e;
  font-weight: 600;
}
:deep(.el-sub-menu .el-sub-menu__title) {
  margin: 2px 0;
  border-radius: 12px;
  height: 44px;
  line-height: 44px;
  font-size: 14px;
  color: #4b5563;
}
:deep(.el-sub-menu .el-sub-menu__title:hover) {
  background: #f2f3f5;
}
:deep(.el-sub-menu.is-active .el-sub-menu__title) {
  color: #0f766e;
  font-weight: 600;
}
:deep(.el-menu .el-menu--inline) {
  background: transparent;
}
:deep(.el-menu--inline .el-menu-item) {
  padding-left: 52px !important;
  height: 40px;
  line-height: 40px;
  font-size: 13px;
}
</style>