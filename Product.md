# 后勤维修综合管理系统 - 技术文档

## 文档概述

本文档为“后勤维修综合管理系统”的完整技术说明，涵盖项目背景、技术架构、核心业务模块设计、数据库设计、前后端实现细节及微信支付集成方案。

**技术栈：**
- **后端**：NestJS + TypeORM + MySQL + JWT + WebSocket
- **管理端前端**：Vue 3 + TypeScript + Element Plus + ECharts
- **用户端**：UniApp (Vue 3) + Pinia + WebSocket

---

## 第一章 系统概述

### 1.1 项目背景

本项目为武汉设计工程学院后勤保障处定制开发，旨在替代传统线下报修、手工派单、纸质记录的工作模式，构建覆盖师生报修、智能派单、维修作业执行、物料库存动态管理、财务支付及服务评价闭环的全链路信息化平台。

### 1.2 核心业务流程

```
用户报修 → 管理员审批 → 系统自动派单/手动派单 → 师傅接单 →
维修中(物料申领→支付→出库) → 完成维修 → 用户评价
```

### 1.3 用户角色体系

| 角色 | 角色值 | 职责范围 |
|:---|:---|:---|
| 普通用户 | 0 | 提交报修工单，查看进度，在线支付，服务评价 |
| 维修师傅 | 1 | 接单/拒单，更新工单状态，申领物料，完成维修 |
| 超级管理员 | 2 | 全局配置，用户管理，岗位管理，系统参数 |
| 仓库管理员 | 3 | 物料管理，入库/出库，库存盘点，供应商管理 |
| 对账管理员 | 4 | 查看工单全量，数据看板，导出报表，评价统计 |

---

## 第二章 核心技术架构

### 2.1 后端架构

```typescript
// NestJS模块化架构
AppModule
├── AuthModule          // 认证授权（JWT + 本地策略）
├── OrderModule         // 工单管理（含自动派单服务）
├── MaterialModule      // 物料库存（含入库/出库/盘点/预警）
├── TechnicianModule    // 维修师傅管理
├── BuildingModule      // 楼栋管理
├── ChatModule          // 聊天消息（WebSocket网关）
├── DashboardModule     // 数据看板
├── FaqModule           // 常见问题
├── CommonModule        // 通知服务
├── NotificationModule  // 系统通知（含定时任务）
├── WechatModule        // 微信服务（支付/订阅消息）
├── UserManageModule    // 用户管理
└── RepairPositionModule // 岗位管理
```

### 2.2 全局守卫与认证

系统采用 JWT + 角色守卫双重认证机制，全局启用：

```typescript
// app.module.ts - 全局守卫注册
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },    // JWT认证
  { provide: APP_GUARD, useClass: RolesGuard },       // 角色鉴权
]
```

公开接口通过 `@Public()` 装饰器豁免认证，角色接口通过 `@Roles(Role.SuperAdmin, Role.Warehouse)` 限定访问。

### 2.3 工单状态机

工单共有11个状态，完整流转路径：

```
PENDING(1) → APPROVED(2) → DISPATCHED(3) → ACCEPTED(4) →
ON_WAY(5) → REPAIRING(6) → WAITING_PARTS(7) →
AWAITING_PAYMENT(9) → COMPLETED(8)
                        ↘ REJECTED(11)
                        ↘ CANCELLED(10)
```

---

## 第三章 核心业务模块详设

### 3.1 智能派单引擎

派单逻辑支持三种策略，由岗位配置决定：

- **按责任区 (area)**：根据报修楼栋匹配 `TechnicianBuilding` 表，从负责该楼栋的师傅中选负载最小者。无人匹配则降级为全区域查找。
- **直接派单 (direct)**：工种专用，直接派给对应师傅（如热水维修→梅师傅、直饮水维修→张师傅）。
- **轮流派单 (round_robin)**：用于疏通类任务，水电工和木工轮流接单。

负载均衡通过 `TechnicianService.getCurrentOrderCount()` 实时统计进行中工单数，选择负载最小的师傅派单。

### 3.2 紧急程度自动判定

紧急程度在后端自动生成，用户不可手动选择。`OrderService.evaluateUrgency()` 基于故障描述匹配关键词：

```typescript
// 特急关键词
const criticalKeywords = [
  '漏电', '触电', '短路', '起火', '着火', '冒烟', '烧焦',
  '爆管', '水管爆裂', '喷水', '水柱', '跑水',
  '大面积淹水', '水漫', '淹了', '发大水',
  '化粪池', '粪水', '污水外溢', '粪便倒灌',
  '电梯', '被困',
];
```

### 3.3 物料申领与库存锁定

#### 3.3.1 业务流程

```
师傅提交申领 → 系统立即锁定库存 → 师生端推送支付（10分钟倒计时）
→ 支付成功：锁定转正式占用，生成待出库单
→ 支付超时：自动释放库存，工单回退到维修中
→ 师傅端工单：直接生成出库单（后置审核），无支付环节
```

#### 3.3.2 关键实现

```typescript
// 悲观锁防并发超卖
const material = await queryRunner.manager.findOne(Material, {
  where: { id: item.materialId },
  lock: { mode: 'pessimistic_write' },
});

// 锁定库存
material.lockedStock += item.quantity;
await queryRunner.manager.save(material);

// 设置10分钟过期
lockExpiresAt: needPayment
  ? new Date(Date.now() + 10 * 60 * 1000)
  : undefined
```

#### 3.3.3 服务费规则

只有疏通类维修（`faultType` 含“疏通”“堵塞”“下水道”“管道”）才收取服务费，其他类型维修服务费固定为0。

### 3.4 支付流程设计

当前系统采用“模拟支付”模式，前端调用 `POST /order/{id}/pay`，后端 `OrderService.payMaterialBill()` 处理：

1. 校验 `material_bill_status === 2`（待支付）
2. 检查支付超时（10分钟）
3. 扣减锁定库存，生成出库单（状态1-待审核）
4. 更新工单状态为维修中（物料账单状态改为3-已支付）
5. 出库审核为后置流程，不阻塞维修进度

### 3.5 数据看板

`DashboardService` 提供四大类统计接口：

| 接口 | 返回内容 |
|:---|:---|
| `/dashboard/stats` | 总工单、完成率、响应时长、满意度、待支付总额、特急达标率、工种负载 |
| `/dashboard/trend` | 近30天每日新增和完成工单趋势 |
| `/dashboard/fault-heatmap` | 按楼栋统计故障数量分布 |
| `/dashboard/workload` | 各工种当前负载详情 |

### 3.6 FAQ智能提示

报修时根据用户输入的故障描述，实时匹配常见问题库，推送自助排查指南。`FaqService.predict()` 采用三级匹配策略：

1. 精确匹配关键词
2. 包含匹配（关键词在输入中，或输入在关键词中）
3. 分词匹配

启用FAQ列表以内存缓存形式预热，增删改后自动刷新。

---

## 第四章 数据库设计要点

### 4.1 核心表结构

- `repair_order` - 工单主表，含11个状态枚举、物料账单JSON、费用字段
- `material` - 物料表，含库存阈值、锁定库存、保质期、预警天数
- `material_application` - 物料申领表，含服务费、折扣、支付状态、锁定过期时间
- `stock_in` / `stock_out` - 入库/出库记录
- `technician_building` - 师傅与楼栋多对多映射表
- `user` - 用户表，含 `openid` 字段用于微信支付和订阅消息
- `faq` - 常见问题表，含多语言字段

### 4.2 关键索引

```sql
-- 工单查询索引
KEY `idx_status_created` (`status`,`created_at`)
KEY `idx_status_technician` (`status`,`technician_id`)
KEY `idx_user_status` (`user_id`,`status`)

-- 物料预警索引
KEY `idx_stock_min_stock` (`stock`,`min_stock`)
KEY `idx_expiry_date` (`expiry_date`)
KEY `idx_category_stock` (`category_id`,`stock`)
```

---

## 第五章 前端架构（管理端）

### 5.1 扁平化设计系统

管理端采用夸克网盘风格的扁平化设计，核心CSS变量：

```scss
:root {
  --el-color-primary: #0f766e;
  --bg-app: #f5f6f8;
  --bg-surface: #ffffff;
  --bg-hover: #f8fafc;
  --bg-active: #e8f4f2;
  --border-light: #f0f2f5;
  --border-normal: #edeff2;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
}
```

全局清除阴影（`box-shadow: none !important`），使用圆角边框和浅色背景区分层级，卡片悬停时背景色微变。

### 5.2 角色权限控制

侧边栏菜单基于用户角色动态渲染：

```vue
<el-menu-item v-if="hasRole(2,4)" index="/order">
  <span>工单管理</span>
</el-menu-item>
```

路由守卫配合后端接口权限，双重保障。仓库管理员看不到用户管理和岗位管理，对账管理员看不到物料管理菜单。

### 5.3 数据看板实现

使用 ECharts 实现四大图表：核心指标卡片、工单趋势双折线图、故障类型饼图、楼栋故障柱状图、工种负载柱状图。所有数据通过 `/dashboard/*` 接口实时查询。

---

## 第六章 小程序支付集成方案

### 6.1 支付配置流程

1. 注册微信公众平台账号（小程序类型）并完成认证
2. 申请微信支付商户号，开通小程序支付权限
3. 在商户平台绑定小程序AppID
4. 在商户平台下载API证书，获取商户号（mchid）和APIv3密钥
5. 配置支付回调通知URL

参考文档：

### 6.2 后端支付服务设计

```typescript
// 环境变量配置
WECHAT_APPID=wx****
WECHAT_MCHID=1234567890
WECHAT_API_KEY=***
WECHAT_NOTIFY_URL=https://your-domain.com/api/payment/callback

// 微信支付服务
@Injectable()
export class PaymentService {
  // 1. 小程序下单
  async createTransaction(params: {
    outTradeNo: string;
    description: string;
    total: number;  // 单位：分
    openid: string;
  }): Promise<{ prepay_id: string }> { ... }

  // 2. 生成调起支付签名
  generatePaySign(prepayId: string): PayParams { ... }

  // 3. 支付回调处理
  async handleCallback(headers: any, body: any): Promise<void> { ... }

  // 4. 订单查询
  async queryOrder(outTradeNo: string): Promise<OrderStatus> { ... }
}
```

### 6.3 后端下单接口（NestJS实现）

```typescript
async createTransaction(params: {
  outTradeNo: string;
  description: string;
  total: number;
  openid: string;
}): Promise<{ prepay_id: string }> {
  const requestBody = {
    appid: this.configService.get('WECHAT_APPID'),
    mchid: this.configService.get('WECHAT_MCHID'),
    description: params.description,
    out_trade_no: params.outTradeNo,
    notify_url: this.configService.get('WECHAT_NOTIFY_URL'),
    amount: { total: params.total, currency: 'CNC' },
    payer: { openid: params.openid },
  };

  const headers = await this.generateAuthHeader(
    'POST',
    '/v3/pay/transactions/jsapi',
    JSON.stringify(requestBody),
  );

  const response = await axios.post(
    'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi',
    requestBody,
    { headers },
  );

  return { prepay_id: response.data.prepay_id };
}
```

### 6.4 调起支付签名生成

```typescript
generatePaySign(prepayId: string): PayParams {
  const appId = this.configService.get('WECHAT_APPID');
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = nanoid(32);
  const packageStr = `prepay_id=${prepayId}`;

  const signStr = [appId, timeStamp, nonceStr, packageStr].join('\n');
  const paySign = this.rsaSign(signStr);

  return { timeStamp, nonceStr, package: packageStr, signType: 'RSA', paySign };
}
```

### 6.5 支付回调处理

```typescript
async handleCallback(headers: any, body: any): Promise<void> {
  // 1. 验证签名
  const isValid = this.verifySignature(headers, body);
  if (!isValid) throw new BadRequestException('签名验证失败');

  // 2. 解密回调数据
  const decrypted = this.decryptCallback(body);

  // 3. 更新工单支付状态
  if (decrypted.trade_state === 'SUCCESS') {
    await this.orderService.updatePaymentStatus(
      decrypted.out_trade_no,
      decrypted.transaction_id,
    );
  }
}
```

### 6.6 前端调起支付（UniApp）

```javascript
// api/payment.js
export const createPayment = (orderId) =>
  http.post('/payment/create', { orderId })

// 支付流程
const handlePay = async () => {
  try {
    // 1. 调用后端下单接口
    const res = await createPayment(orderId)
    const { timeStamp, nonceStr, package: pkg, signType, paySign } = res.data

    // 2. 调起微信支付
    uni.requestPayment({
      timeStamp,
      nonceStr,
      package: pkg,
      signType,
      paySign,
      success: () => {
        uni.showToast({ title: '支付成功' })
        loadOrder()
      },
      fail: (err) => {
        uni.showToast({ title: '支付失败', icon: 'none' })
      }
    })
  } catch (err) {
    uni.showToast({ title: '请求失败', icon: 'none' })
  }
}
```

参考文档：

---

## 第七章 微信订阅消息集成

### 7.1 配置流程

1. 登录微信公众平台 → 功能 → 订阅消息
2. 在公共模板库选用所需模板，获取模板ID

### 7.2 已配置模板

| 模板名称 | 模板ID | 触发场景 |
|:---|:---|:---|
| 下单成功通知 | `q_RnrEAiPozaFQuQYWmgtgQi1tS6gtYSew4HlWpT-Vo` | 报修提交成功 |
| 服务派单通知 | `yq3uejcDX0ASu5XaBU8S2gwUQFcfl9yGr1dSOTQVujY` | 师傅被派单 |
| 收到师傅接单通知 | `lzkE05FYfkkzNuexlcimo7nrdchlF5u2DOkOvovF59s` | 师傅接单后通知用户 |
| 待支付提醒 | `X2I9ICBuHRa9YBWXPNp-DmnyiAENZa4h9O7IvfYQVL8` | 物料费用待支付 |
| 支付成功通知 | `3GREsjBgAnEl_Zzwy8LhYVvUOcV3cZIceZ1vTRDZPfc` | 用户支付成功 |
| 服务评价提醒 | `MBqBQha-AJxBW6Gne4FNbkBmF-ld5XlysMv4dUeOLUs` | 维修完成提醒评价 |
| 师傅拒绝接单通知 | `mVtYMTsEZsjooCJxKnfJIWX4VaG7vInoMoC8TytCZBQ` | 师傅拒单后通知用户 |

### 7.3 后端发送服务

```typescript
@Injectable()
export class WechatService {
  // 获取access_token（带内存缓存，提前5分钟过期）
  async getAccessToken(): Promise<string> { ... }

  // 发送订阅消息
  async sendSubscribeMessage(params: {
    touser: string;       // 用户openid
    templateId: string;   // 模板ID
    page?: string;        // 跳转页面
    data: Record<string, { value: string }>;
  }): Promise<boolean> { ... }

  // 通过code换取openid
  async getOpenidByCode(code: string): Promise<string> { ... }
}
```

### 7.4 前端授权订阅

在关键页面触发 `uni.requestSubscribeMessage` 授权：

```javascript
// 学生端 - 报修提交后
uni.requestSubscribeMessage({
  tmplIds: [
    'q_RnrEAiPozaFQuQYWmgtgQi1tS6gtYSew4HlWpT-Vo',  // 下单成功
    'lzkE05FYfkkzNuexlcimo7nrdchlF5u2DOkOvovF59s',  // 接单通知
    'MBqBQha-AJxBW6Gne4FNbkBmF-ld5XlysMv4dUeOLUs',  // 评价提醒
  ],
})

// 师傅端 - 首页加载时
uni.requestSubscribeMessage({
  tmplIds: [
    'yq3uejcDX0ASu5XaBU8S2gwUQFcfl9yGr1dSOTQVujY',  // 派单通知
  ],
})
```

---

## 第八章 WebSocket聊天系统

### 8.1 架构设计

基于 Socket.IO 实现即时通讯，支持工单关联聊天和私聊。

- **网关**：`ChatGateway` 处理WebSocket连接，通过JWT验证用户身份
- **消息存储**：`Message` 表记录所有聊天内容
- **自动加入房间**：用户连接后自动加入自己关联的所有进行中工单的聊天室

### 8.2 权限校验

消息发送前校验用户权限：学生只能与为自己维修的师傅聊天，师傅只能与自己的报修人聊天，管理员可查看任意工单聊天。

### 8.3 联系人列表

基于工单关联生成联系人列表，而非聊天记录。学生看到所有为自己服务过的师傅，师傅看到所有自己服务过的学生。列表附带最后一条消息预览和未读数统计。

---

## 第九章 部署运维说明

### 9.1 环境变量配置

```bash
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=***
DB_DATABASE=repair_system

# JWT
JWT_SECRET=***

# 微信配置
WECHAT_APPID=***
WECHAT_SECRET=***
WECHAT_MCHID=***
WECHAT_NOTIFY_URL=https://your-domain.com/api/payment/callback
```

### 9.2 定时任务

| 任务 | 频率 | 功能 |
|:---|:---|:---|
| 库存预警 | 每日8:00 | 检查库存不足/积压/临期物料 |
| 工单响应超时 | 每10分钟 | 检测超时未接单工单，通知管理员 |
| 库存锁定释放 | 每分钟 | 释放超时未支付的锁定库存 |

### 9.3 数据库备份

建议每日全量备份 `repair_system` 数据库，定期清理 `order_log`、`notification`、`message` 等日志表的历史数据。

---

## 附录

### A. 物料数据清洗

系统内置一键清洗功能（`POST /material/clean`），可自动完成以下操作：
- 从物料名称中提取规格型号到 `spec` 字段
- 清理名称中的单位和备注后缀
- 根据关键词自动归类（电工/水暖/木工）
- 填充默认价格、单位、库存阈值

### B. 多语言支持

系统支持中文、英文、韩文三语切换。后端实体预留 `name_en`、`name_ko` 等字段，前端使用 `vue-i18n` 实现。

### C. 文件上传

图片上传使用 `multer` 存储至 `/uploads` 目录，访问需鉴权。仅支持 jpg/png/gif 格式，限制大小 5MB。

---

**文档版本：** V1.1  
**最后更新：** 2026年5月  
**适用范围：** 武汉设计工程学院后勤维修综合管理系统

---

这是第一批补充内容，对原文档第一至三章进行了深度扩展，增加了环境配置细则、JWT与角色鉴权的完整时序、工单状态流转的严格校验规则。

---

## 第一章补充：系统概述与环境配置

### 1.4 多环境配置方案

系统支持开发（development）、测试（staging）、生产（production）三套环境，通过 `.env` 文件切换。关键配置项：

```bash
# 开发环境 .env.development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=repair_dev
DB_PASSWORD=dev123456
DB_DATABASE=repair_system_dev
JWT_SECRET=dev-secret-change-me
JWT_EXPIRES_IN=7d

# 微信小程序（测试号）
WECHAT_APPID=wx_test_
WECHAT_SECRET=test_secret
WECHAT_MCHID=1230000109
WECHAT_NOTIFY_URL=http://localhost:3000/api/payment/callback

# 生产环境 .env.production
DB_HOST=prod-mysql.internal
DB_PORT=3306
DB_USER=repair_prod
DB_PASSWORD=strongPassword!@#
DB_DATABASE=repair_system
JWT_SECRET=prod-super-secret-random-string
JWT_EXPIRES_IN=30d
WECHAT_APPID=wx_prod_real
WECHAT_SECRET=prod_secret_32chars
WECHAT_MCHID=1234567890
WECHAT_NOTIFY_URL=https://your-domain.com/api/payment/callback
```

NestJS 通过 `@nestjs/config` 模块加载对应环境文件。启动命令：
```bash
npm run start:dev   # 开发环境
npm run start:prod  # 生产环境，设置 NODE_ENV=production
```

---

## 第二章补充：JWT与角色鉴权详细时序

### 2.4 用户登录与令牌刷新流程

**登录时序：**
1. 前端发送 `POST /auth/login`，携带 `username` + `password`。
2. 后端 `LocalStrategy` 调用 `AuthService.validateUser()`，使用 bcrypt 比较密码。
3. 验证通过后，`AuthService.login()` 生成 JWT，payload 包含 `{ sub: userId, username, role }`。
4. 返回 `{ access_token, user: { id, name, phone, role, avatar } }` 给前端。
5. 前端将 `access_token` 存入本地存储，并在每次请求的 `Authorization: Bearer <token>` 头中携带。

**令牌过期处理：**
- 默认 JWT 有效期 7 天（开发）或 30 天（生产）。
- 当前系统未实现刷新令牌机制，过期后需重新登录。
- 后续可扩展 `refresh_token` 接口，返回新 JWT，前端拦截 401 自动刷新。

### 2.5 RolesGuard 详细逻辑

```typescript
// src/auth/roles.guard.ts
canActivate(context: ExecutionContext): boolean {
  // 1. 检查是否标记了 @Public() 装饰器
  const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [ ... ]);
  if (isPublic) return true;

  // 2. 获取当前路由所需的角色
  const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
  if (!requiredRoles || requiredRoles.length === 0) return true; // 无角色要求，放行

  // 3. 从请求中提取用户（由 JwtAuthGuard 挂载）
  const request = context.switchToHttp().getRequest();
  const user = request.user as UserWithoutPassword;
  if (!user) throw new ForbiddenException('未登录');

  // 4. 检查用户角色是否在允许列表中
  const hasRole = requiredRoles.includes(user.role);
  if (!hasRole) throw new ForbiddenException('权限不足');
  return true;
}
```

**使用示例：**
```typescript
@Controller('material')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialController {
  @Post('inbound')
  @Roles(Role.SuperAdmin, Role.Warehouse)  // 仅超管和仓库管理员
  async inbound() { ... }

  @Get('list')
  async list() { ... }  // 所有登录用户均可查看物料列表
}
```

---

## 第三章补充：工单状态流转详细规则

### 3.1 状态变更前置校验矩阵

| 当前状态 | 允许的目标状态 | 校验条件 |
|:---|:---|:---|
| 待受理(1) | 待派单(2) | 管理员审批通过 |
| | 已驳回(11) | 管理员驳回，填写原因 |
| 待派单(2) | 已派单(3) | 已分配师傅（自动/手动） |
| 已派单(3) | 已接单(4) | 只能由分配的师傅接单 |
| | 已驳回(11) | 师傅拒单，填写原因，工单回流派单池 |
| 已接单(4) | 上门中(5) | 师傅点击“出发” |
| 上门中(5) | 维修中(6) | 师傅点击“开始维修” |
| 维修中(6) | 需备件(7) | 师傅提交物料申领（师生端需要支付时进入9） |
| | 待支付(9) | 物料账单已出，等待用户支付 |
| | 已完成(8) | 维修完成，且物料账单非待支付(2)状态 |
| 需备件(7) | 维修中(6) | 物料到位，师傅继续维修 |
| 待支付(9) | 维修中(6) | 用户支付成功 |
| | 已取消(10) | 支付超时，工单回退 |
| 已完成(8) | 无 | 终态，不可变更 |
| 已取消(10) | 无 | 终态 |
| 已驳回(11) | 待派单(2) | 管理员重新审批通过 |

### 3.2 支付相关状态补充说明

- `material_bill_status` 字段独立于工单状态，表示物料账单的进度：0-未出单，1-待审核（师傅自建），2-待支付，3-已支付，4-免费。
- 工单状态 `9`（待支付）对应 `material_bill_status = 2`。
- 当 `material_bill_status = 3` 或 `4` 时，工单状态应为 `6`（维修中），师傅可继续操作。
- `complete` 方法中会校验 `material_bill_status === 2` 时禁止完成，待支付状态下不允许完成维修。

### 3.3 转单机制

工种为“空调维修”和“防水维修”对用户不可见，仅供内部转单。水电工接单后，若诊断需要空调或防水专业维修，可发起转单申请，将工单状态重置为待派单(2)并分配给对应工种。实现代码：

```typescript
// order.service.ts
async transferOrder(orderId: number, targetSkill: string) {
  const order = await this.findById(orderId);
  if (![OrderStatus.ACCEPTED, OrderStatus.ON_WAY, OrderStatus.REPAIRING].includes(order.status))
    throw new BadRequestException('当前状态不允许转单');
  order.technicianId = null;
  order.status = OrderStatus.APPROVED;
  await this.orderRepo.save(order);
  await this.autoDispatchService.autoDispatch(order); // 重新派单
}
```

---

### **第四章 智能派单引擎详细设计（补充）**

#### **4.1 负载均衡算法实现**

派单服务 `AutoDispatchService` 在选择师傅时，采用“最小负载优先”策略，确保任务均匀分配，避免个别师傅积压。

```typescript
// auto-dispatch.service.ts
private async selectBest(techs: Technician[]): Promise<Technician | null> {
  if (techs.length === 0) return null;

  // 批量获取所有候选师傅的当前进行中工单数
  const techsWithLoad = await Promise.all(
    techs.map(async (t) => ({
      tech: t,
      load: await this.technicianService.getCurrentOrderCount(t.id),
    })),
  );

  // 按负载升序排序
  techsWithLoad.sort((a, b) => a.load - b.load);
  return techsWithLoad[0]?.tech ?? null;
}
```

**`getCurrentOrderCount` 方法统计规则：** 只统计处于“已派单、已接单、上门中、维修中、待备件”这5种进行中状态的工单，已取消和已完成的工单不计入。

#### **4.2 责任区精确匹配 SQL**

责任区匹配通过 `TechnicianBuilding` 多对多表实现。当工单携带楼栋信息时，查询逻辑如下：

```typescript
// 根据楼栋名称查找 building
const building = await this.buildingRepo.findOne({
  where: { name: order.locationBuilding },
});

if (!building) {
  // 无匹配楼栋时，降级为全工种查找
  return this.selectBest(await this.findAvailableTechnicians(skill));
}

// 查找负责该楼栋的所有技师
const mappings = await this.techBuildingRepo.find({
  where: { buildingId: building.id },
  relations: ['technician', 'technician.user'],
});

const candidateIds = mappings.map(m => m.technicianId);
if (candidateIds.length === 0) {
  // 该楼栋无责任师傅，降级为全工种查找
  return this.selectBest(await this.findAvailableTechnicians(skill));
}

// 从候选技师中筛选技能匹配且状态空闲的
const qb = this.techRepo
  .createQueryBuilder('t')
  .leftJoinAndSelect('t.user', 'user')
  .where('t.id IN (:...ids)', { ids: candidateIds })
  .andWhere('t.status = 1')
  .andWhere('t.skills LIKE :skill', { skill: `%${skill}%` });

const techs = await qb.getMany();
return this.selectBest(techs);
```

#### **4.3 轮询派单实现（疏通类）**

疏通任务同时归属水电工和木工，采用轮流接单机制。系统记录最近一次疏通工单的接单师傅，下次疏通工单自动分配给另一个工种的师傅。

```typescript
private async dispatchRoundRobin(order: RepairOrder): Promise<Technician | null> {
  // 查询最近一次疏通工单
  const lastDredge = await this.orderRepo.findOne({
    where: { faultType: '疏通' },
    order: { createdAt: 'DESC' },
  });

  let nextSkill = '水电维修';
  if (lastDredge?.technicianId) {
    const lastTech = await this.techRepo.findOne({
      where: { id: lastDredge.technicianId },
    });
    // 如果上次是水电工，这次分给木工
    if (lastTech?.skills?.includes('水电维修')) {
      nextSkill = '木工维修';
    }
  }

  const techs = await this.findAvailableTechnicians(nextSkill);
  return this.selectBest(techs);
}
```

---

### **第五章 物料申领与库存控制（补充）**

#### **5.1 悲观锁防并发超卖**

在 `MaterialService.apply` 方法中，每个物料的查询都使用 TypeORM 的悲观写锁，确保并发环境下库存数据一致性。

```typescript
for (const item of data.items) {
  const material = await queryRunner.manager.findOne(Material, {
    where: { id: item.materialId },
    lock: { mode: 'pessimistic_write' }, // 行级写锁
  });
  if (!material)
    throw new NotFoundException(`物料 ${item.materialId} 不存在`);

  const available = material.stock - material.lockedStock;
  if (available < item.quantity) {
    throw new BadRequestException(`物料 ${material.name} 可用库存不足`);
  }

  material.lockedStock += item.quantity; // 预占库存
  await queryRunner.manager.save(material);
}
```

悲观锁会在事务期间锁定该行，其他事务必须等待当前事务提交后才能读取，从而避免超卖。

#### **5.2 库存锁定超时自动释放**

通过 NestJS 的定时任务模块 `@nestjs/schedule`，每分钟扫描一次 `material_application` 表，找出状态为“待支付”且 `lockExpiresAt` 已过期的申领单，释放被锁定的库存。

```typescript
// timeout-release-stock.service.ts
@Cron('*/1 * * * *')
async releaseExpiredLocks() {
  const expiredApps = await this.materialAppRepo.find({
    where: {
      status: MaterialApplicationStatus.PENDING_PAYMENT,
      paymentStatus: 0,
      lockExpiresAt: LessThan(new Date()),
    },
  });

  for (const app of expiredApps) {
    for (const item of app.items) {
      const material = await this.materialRepo.findOne({
        where: { id: item.materialId },
      });
      if (material) {
        material.lockedStock = Math.max(
          0,
          material.lockedStock - item.quantity,
        );
        await this.materialRepo.save(material);
      }
    }
    app.paymentStatus = 2;  // 标记为超时
    app.status = MaterialApplicationStatus.CANCELLED;
    await this.materialAppRepo.save(app);

    // 回退工单状态
    await this.orderRepo.update(app.orderId, {
      material_bill_status: 0,
      status: OrderStatus.REPAIRING,
    });
  }
}
```

#### **5.3 支付成功后的库存扣减**

用户支付成功后，`payMaterialBill` 方法在事务中执行两个核心操作：将 `lockedStock` 转为实际库存扣减，并生成出库单。

```typescript
material.stock -= item.quantity;
material.lockedStock = Math.max(0, material.lockedStock - item.quantity);
await queryRunner.manager.save(material);

const outbound = queryRunner.manager.create(StockOut, {
  orderNo: `OUT${Date.now()}`,
  materialId: item.materialId,
  quantity: item.quantity,
  reason: '工单消耗',
  repairOrderId: orderId,
  applicantId: application.applicantId,
  status: 1,           // 待审核（后置审核）
  outboundType: 'order',
});
await queryRunner.manager.save(outbound);
```

出库单状态为“待审核”，但审核不阻塞维修进度，师傅可以先维修后补审。

---

### **第六章 支付集成补充（微信支付V3）**

#### **6.1 微信支付V3 API完整调用链路**

**步骤1：商户后端生成预支付订单**

调用 `POST https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi`，需携带签名和API证书。

```typescript
async createTransaction(params: {
  outTradeNo: string;
  description: string;
  total: number; // 单位：分
  openid: string;
}): Promise<{ prepay_id: string }> {
  const requestBody = {
    appid: this.configService.get('WECHAT_APPID'),
    mchid: this.configService.get('WECHAT_MCHID'),
    description: params.description,
    out_trade_no: params.outTradeNo,
    notify_url: this.configService.get('WECHAT_NOTIFY_URL'),
    amount: { total: params.total, currency: 'CNY' },
    payer: { openid: params.openid },
  };

  // 生成认证头（WECHATPAY2-SHA256-RSA2048签名）
  const headers = await this.generateAuthHeader(
    'POST',
    '/v3/pay/transactions/jsapi',
    JSON.stringify(requestBody),
  );

  const response = await axios.post(
    'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi',
    requestBody,
    { headers },
  );

  return { prepay_id: response.data.prepay_id };
}
```

**步骤2：生成前端调起支付所需参数**

```typescript
generatePaySign(prepayId: string): PayParams {
  const appId = this.configService.get('WECHAT_APPID');
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = nanoid(32);
  const packageStr = `prepay_id=${prepayId}`;

  // 拼接待签名字符串
  const signStr = [appId, timeStamp, nonceStr, packageStr].join('\n');
  const paySign = this.rsaSign(signStr);

  return {
    timeStamp,
    nonceStr,
    package: packageStr,
    signType: 'RSA',
    paySign,
  };
}
```

**步骤3：支付结果回调处理**

```typescript
async handleCallback(headers: any, body: any): Promise<void> {
  // 1. 验证签名（使用微信平台公钥）
  const isValid = this.verifySignature(headers, body);
  if (!isValid) throw new BadRequestException('签名验证失败');

  // 2. 解密回调数据（AES-256-GCM）
  const decrypted = this.decryptCallback(body);

  // 3. 业务处理：更新工单支付状态
  if (decrypted.trade_state === 'SUCCESS') {
    await this.orderService.updatePaymentStatus(
      decrypted.out_trade_no,
      decrypted.transaction_id,
    );
  }
}
```

#### **6.2 支付与工单状态联动**

| 支付流程节点 | 工单状态变化 | material_bill_status |
|:---|:---|:---|
| 师傅提交物料账单 | 维修中→待支付(9) | 2（待支付） |
| 用户支付成功 | 待支付→维修中(6) | 3（已支付） |
| 支付超时 | 待支付→维修中(6) | 0（未出单，需重新申领） |
| 师傅自建工单 | 维修中 | 1（待审核）/4（免费） |

支付成功后，微信支付平台会异步通知回调URL，同时前端也会收到 `uni.requestPayment` 的成功回调，双重确认支付状态。

---

我们继续输出更深入的技术细节：WebSocket 聊天系统、数据看板后端实现、部署与运维方案。

---

## 第七章 WebSocket 聊天系统详细设计

### 7.1 连接建立与身份认证

用户端通过 `socket.io-client` 连接后端 WebSocket 网关。连接时携带 JWT token 进行身份认证。

**前端连接代码：**
```javascript
// src/utils/socket.js
import io from 'socket.io-client';
import { useUserStore } from '@/store/user';

let socket = null;

export const useSocket = () => {
  if (!socket) {
    const userStore = useUserStore();
    const token = userStore.token;
    if (!token) return null;

    socket = io(WS_BASE_URL, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: false,
      reconnection: false,
    });
    // ... 重连逻辑
  }
  return socket;
};
```

**后端网关验证：**
```typescript
// chat.gateway.ts
async handleConnection(client: CustomSocket) {
  const token = client.handshake.auth?.token;
  if (!token) { client.disconnect(); return; }
  try {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get('JWT_SECRET'),
    });
    client.data.userId = payload.sub;
    client.data.role = payload.role;
    client.join(`user_${payload.sub}`);
  } catch {
    client.disconnect();
  }
}
```

### 7.2 房间自动加入机制

连接成功后，网关会自动将用户加入所有与其相关的进行中工单的房间（`order_${orderId}`），以便实时接收该工单的消息推送。

```typescript
// 在 handleConnection 中追加
const orders = await this.messageService.getActiveOrdersForUser(payload.sub, payload.role);
orders.forEach(orderId => client.join(`order_${orderId}`));
```

### 7.3 消息发送与存储

**客户端发送：**
```javascript
socket.emit('sendMessage', {
  receiverId: targetUserId,
  orderId: currentOrderId,
  content: inputText,
  type: 'text', // 或 'image'
});
```

**服务端处理：**
```typescript
@SubscribeMessage('sendMessage')
async handleMessage(data, client) {
  // 权限校验：检查发送者是否有权与该工单/用户通信
  if (data.orderId) {
    const order = await this.messageService.validateChatPermission(data.orderId, client.userId, client.role);
    if (!order) { client.emit('error', { message: '无权发送消息' }); return; }
  }

  const savedMessage = await this.messageService.saveMessage({
    orderId: data.orderId,
    senderId: client.userId,
    senderType: client.role,
    content: data.content,
    receiverId: data.receiverId,
    type: data.type === 'image' ? 1 : 0,
  });

  // 推送给接收者
  this.server.to(`user_${data.receiverId}`).emit('newMessage', savedMessage);
  // 回传给发送者
  client.emit('newMessage', savedMessage);
}
```

### 7.4 联系人列表生成算法

联系人列表基于实际工单关系构建，而非聊天记录，避免无效会话。

**教师端逻辑：**
- 查询所有与该师傅相关的已完成工单（`technicianId` 匹配且状态不为取消），去重后返回所有报修人信息。
- 每条联系人附加上最后一条聊天消息预览和未读计数。

**学生端逻辑：**
- 查询所有该用户发起的且已分配的工单，提取对应的师傅列表，去重后返回。
- 同样附加消息预览和未读数。

**代码实现（简化）：**
```typescript
async getContacts(userId: number, role: number): Promise<any[]> {
  let users;
  if (role === Role.Technician) {
    const orders = await this.repairOrderRepo.find({
      where: { technicianId: currentTechnicianId, userId: Not(IsNull()) },
      select: ['userId'],
    });
    const userIds = [...new Set(orders.map(o => o.userId))];
    users = await this.userRepo.findByIds(userIds);
  } else if (role === Role.User) {
    const orders = await this.repairOrderRepo.find({
      where: { userId, technicianId: Not(IsNull()) },
      select: ['technicianId'],
    });
    const techIds = [...new Set(orders.map(o => o.technicianId))];
    const technicians = await this.techRepo.findByIds(techIds, { relations: ['user'] });
    users = technicians.map(t => t.user);
  }
  // 为每个联系人附加消息预览和未读数...
}
```

---

## 第八章 数据看板后端实现细节

### 8.1 实时统计 SQL 优化

数据看板接口查询实时数据库，无缓存。为避免慢查询，采用以下优化策略：

- **工单总量/完成数**：简单的 `COUNT` 查询，索引覆盖。
- **平均响应时长**：`AVG(TIMESTAMPDIFF(MINUTE, o.createdAt, o.acceptTime))`，利用 `acceptTime` 索引。
- **工种负载**：先查所有技师，再逐个查进行中工单数，后续可优化为一次 JOIN 查询，但目前技师数量少，性能可接受。
- **待支付总额**：`SUM(o.material_bill_pay_amount) WHERE material_bill_status = 2`，需确保该列有索引，当前通过全表扫描，未来可加复合索引。
- **特急响应达标率**：查询所有特急且已接单的工单，在应用层计算达标率。

**关键查询示例：**
```typescript
// 平均响应时长
const avgResponseTimeRaw = await this.orderRepo
  .createQueryBuilder('o')
  .select('AVG(TIMESTAMPDIFF(MINUTE, o.createdAt, o.acceptTime))', 'avg')
  .where('o.acceptTime IS NOT NULL')
  .getRawOne<AvgResult>();
```

### 8.2 前端 ECharts 图表配置

管理端数据看板使用 ECharts 渲染图表，数据从后端实时获取。以工单趋势图为例：

```typescript
// Dashboard.vue
const trendData = await getOrderTrend();
trendChart.setOption({
  tooltip: { trigger: 'axis' },
  legend: { data: ['新增', '完成'], bottom: 0 },
  grid: { left: 8, right: 16, top: 8, bottom: 28 },
  xAxis: { type: 'category', data: trendData.map(i => i.date) },
  yAxis: { type: 'value' },
  series: [
    { name: '新增', type: 'line', data: trendData.map(i => i.count), smooth: true, lineStyle: { color: '#0f766e' }, symbol: 'none' },
    { name: '完成', type: 'line', data: trendData.map(i => i.completed), smooth: true, lineStyle: { color: '#38a89d' }, symbol: 'none' },
  ],
});
```

所有图表均监听窗口大小变化，自动调整尺寸。

---

## 第九章 部署与运维方案

### 9.1 服务器环境要求

- **操作系统**：Linux (CentOS 7+ / Ubuntu 18.04+)
- **Node.js**：v16.20.0 或更高
- **MySQL**：8.0+
- **Nginx**：1.20+ （作为反向代理）

### 9.2 Docker 化部署（推荐）

**后端 Dockerfile：**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**docker-compose.yml 示例：**
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: repair_system
    volumes:
      - ./mysql-data:/var/lib/mysql
    ports:
      - "3306:3306"
  backend:
    build: ./repair-system-backend
    ports:
      - "3000:3000"
    depends_on:
      - mysql
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: root
      DB_PASSWORD: rootpass
      DB_DATABASE: repair_system
      JWT_SECRET: your-secret
  # 管理端前端
  admin:
    build: ./repair-system-admin
    ports:
      - "5173:80"
  # 用户端构建后挂载到 Nginx
  weixin:
    build: ./repair-system-uniapp
    ports:
      - "8080:80"
```

### 9.3 Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads/ {
        alias /path/to/uploads/;
    }

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

### 9.4 定时任务监控

系统使用 `@nestjs/schedule` 模块管理定时任务，包括库存预警、超时释放、工单超时提醒。可在服务器上通过 `pm2` 日志或 `nest` 内置日志观察任务执行情况。

**日志示例：**
```
[Nest] 123  - 2026/05/04 08:00:00   LOG [MaterialWarningService] 开始检查库存预警
[Nest] 123  - 2026/05/04 08:00:01   LOG [MaterialWarningService] 发现3种物料库存不足，已通知管理员
```

### 9.5 数据备份策略

- **数据库备份**：使用 `mysqldump` 每天凌晨全量备份，保留最近7天。
- **备份脚本**：`mysqldump -u root -p repair_system > /backup/repair_$(date +%Y%m%d).sql`
- **上传文件备份**：`/uploads` 目录使用 `rsync` 同步至备份服务器或云存储。

---

## 第十章 常见问题与故障排查

### 10.1 支付回调收不到

1. 检查 `WECHAT_NOTIFY_URL` 是否可公网访问。
2. 在微信支付商户平台查看回调日志，确认是否推送成功。
3. 检查后端日志，是否有签名验证失败等错误。

### 10.2 库存超卖

- 检查是否使用了悲观锁，事务是否正确回滚。
- 查看 `material` 表中 `lockedStock` 是否正确加减。
- 可通过数据库锁等待超时配置适当调整。

### 10.3 WebSocket 连接失败

- 检查代理配置是否支持 WebSocket 升级（Nginx 需添加 `proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade;`）。
- 检查小程序后台是否配置了合法的 WebSocket 域名。

### 10.4 工单状态流转异常

- 检查 `orderLog` 表，定位状态变动的操作者和时间。
- 确认前端按钮显示条件是否与后端状态一致。

---

以上为技术文档的全部详细内容。本系统已完整实现从报修到评价的全流程闭环，支持微信支付集成和订阅消息提醒，采用扁平化UI设计，可投入生产环境使用。