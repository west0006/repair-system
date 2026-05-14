<template>
  <el-container class="layout-root">
    <el-aside width="240px" class="aside-fixed"> <Sidebar /> </el-aside>
    <el-container class="main-area">
      <el-header height="56px" class="top-header">
        <div class="header-left">
          <Breadcrumb />
        </div>
        <Header />
      </el-header>
      <el-main class="content">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import Breadcrumb from './Breadcrumb.vue'
</script>

<style scoped lang="scss">
.layout-root {
  height: 100vh;
  background: #f5f6f8;
  overflow: hidden;
}

.aside-fixed {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  height: 100vh;
  overflow-y: auto;
  background: #fff;
  border-right: 1px solid #f0f2f5;
  z-index: 100;
}

.main-area {
  margin-left: 240px;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
}

.top-header {
  background: #fff;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 28px 32px;
  background: transparent;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>