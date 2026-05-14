// 角色枚举，与后端一致
export enum Role {
  User = 0,
  Technician = 1,
  Admin = 2,
  Warehouse = 3,
  Accountant = 4,
}

// 各角色可访问的路由路径
export const roleRoutes: Record<number, string[]> = {
  [Role.Admin]: ['*'], // 所有路由
  [Role.Warehouse]: [
    '/dashboard',
    '/material',
    '/stock-in',
    '/stock-out',
    '/warning',
    '/supplier',
    '/category',
    '/stock-check',
    '/material-applications',
    '/stock-out-approval',
    '/notifications',
  ],
  [Role.Accountant]: [
    '/dashboard',
    '/order',
    '/order/detail/:id',
    '/notifications',
  ],
}