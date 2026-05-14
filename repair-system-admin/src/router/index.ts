import { createRouter, createWebHistory } from 'vue-router';
import Layout from '@/views/layout/Layout.vue';
import Login from '@/views/Login.vue';
import Forbidden from '@/views/Forbidden.vue';
import { roleRoutes, Role } from '@/constants/roles';

const routes = [
  { path: '/login', component: Login },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      // 看板（仓库、对账、超级管理员均可访问）
      {
        path: 'dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据看板', roles: [Role.Admin, Role.Warehouse, Role.Accountant] },
      },
      // 工单管理（超级管理员、对账管理员）
      {
        path: 'order',
        component: () => import('@/views/order/OrderList.vue'),
        meta: { title: '工单管理', roles: [Role.Admin, Role.Accountant] },
      },
      {
        path: 'order/detail/:id',
        component: () => import('@/views/order/OrderDetail.vue'),
        meta: { title: '工单详情', hidden: true, roles: [Role.Admin, Role.Accountant] },
      },
      // 用户管理（仅超级管理员）
      {
        path: 'users',
        component: () => import('@/views/user/UserList.vue'),
        meta: { title: '用户管理', roles: [Role.Admin] },
      },
      // 师傅管理（仅超级管理员）
      {
        path: 'technician',
        component: () => import('@/views/technician/TechnicianList.vue'),
        meta: { title: '维修师傅', roles: [Role.Admin] },
      },
      // 仓库模块（超级管理员、仓库管理员）
      {
        path: 'material',
        component: () => import('@/views/material/MaterialList.vue'),
        meta: { title: '物料管理', roles: [Role.Admin, Role.Warehouse] },
      },
      {
        path: 'stock-in',
        component: () => import('@/views/material/StockIn.vue'),
        meta: { title: '入库管理', roles: [Role.Admin, Role.Warehouse] },
      },
      {
        path: 'stock-out',
        component: () => import('@/views/material/StockOut.vue'),
        meta: { title: '出库管理', roles: [Role.Admin, Role.Warehouse] },
      },
      {
        path: 'warning',
        component: () => import('@/views/material/WarningList.vue'),
        meta: { title: '库存预警', roles: [Role.Admin, Role.Warehouse] },
      },
      {
        path: 'supplier',
        component: () => import('@/views/supplier/SupplierList.vue'),
        meta: { title: '供应商管理', roles: [Role.Admin, Role.Warehouse] },
      },
      {
        path: 'category',
        component: () => import('@/views/category/CategoryList.vue'),
        meta: { title: '物料分类', roles: [Role.Admin, Role.Warehouse] },
      },
      {
        path: 'stock-check',
        component: () => import('@/views/material/StockCheck.vue'),
        meta: { title: '库存盘点', roles: [Role.Admin, Role.Warehouse] },
      },
      {
        path: 'material-applications',
        component: () => import('@/views/material/ApplicationList.vue'),
        meta: { title: '物料申领审批', roles: [Role.Admin, Role.Warehouse] },
      },
      {
        path: 'stock-out-approval',
        component: () => import('@/views/material/StockOutApproval.vue'),
        meta: { title: '出库审核', roles: [Role.Admin, Role.Warehouse] },
      },
      // 岗位管理（仅超级管理员）
      {
        path: 'position',
        component: () => import('@/views/position/PositionList.vue'),
        meta: { title: '岗位管理', roles: [Role.Admin] },
      },
      //维修指南
      {
  path: 'faq-manage',
  component: () => import('@/views/FaqManage.vue'),
  meta: { title: 'FAQ管理', icon: 'QuestionFilled', roles: [Role.Admin] },
},
      // 通知（所有管理员可见）
      {
        path: 'notifications',
        component: () => import('@/views/NotificationList.vue'),
        meta: { title: '系统通知', roles: [Role.Admin, Role.Warehouse, Role.Accountant] },
      },
    ],
  },
  { path: '/403', component: Forbidden },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 全局前置守卫：登录验证 + 角色权限
router.beforeEach((to) => {
  const token = localStorage.getItem('token');
  let userInfo: any = {};
  try {
    userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  } catch {
    userInfo = {};
  }

  if (to.path !== '/login' && !token) {
    return '/login';
  }

  // 检查路由是否需要特定角色
  const requiredRoles = to.meta.roles as number[] | undefined;
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = userInfo.role;
    if (!requiredRoles.includes(userRole)) {
      return '/403';
    }
  }

  return true;
});

export default router;