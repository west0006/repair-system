# 后勤维修综合管理系统

## 项目简介

本项目为高校后勤保障处定制开发的后勤维修综合管理平台，覆盖师生报修、智能派单、维修作业执行、物料库存管理、财务支付及服务评价闭环的全链路信息化系统。系统包含三大端：**管理端（Web）**、**用户端（微信小程序）**、**后端服务（NestJS API）**。

---

## 技术栈

| 层级 | 技术 |
|:---|:---|
| **后端框架** | NestJS + TypeORM |
| **数据库** | MySQL 8.0+ |
| **认证鉴权** | JWT + 角色守卫 (RolesGuard) |
| **管理端前端** | Vue 3 + TypeScript + Element Plus + ECharts |
| **用户端小程序** | UniApp (Vue 3) + Pinia + WebSocket |
| **即时通讯** | Socket.IO (WebSocket) |
| **微信集成** | 微信支付V3 + 小程序订阅消息 |
| **文件上传** | Multer |
| **定时任务** | @nestjs/schedule |

---

## 项目结构

```
repair-system/
├── repair-system-backend/          # 后端 NestJS 项目
│   ├── src/
│   │   ├── auth/                   # 认证与授权模块
│   │   ├── order/                  # 工单管理（含自动派单）
│   │   ├── material/               # 物料库存（入库/出库/盘点/预警）
│   │   ├── technician/             # 维修师傅管理
│   │   ├── building/               # 楼栋管理
│   │   ├── chat/                   # 聊天消息（WebSocket网关）
│   │   ├── dashboard/              # 数据看板
│   │   ├── faq/                    # 常见问题
│   │   ├── common/                 # 通知服务、上传
│   │   ├── wechat/                 # 微信服务（支付/订阅消息）
│   │   ├── user-manage/            # 用户管理
│   │   ├── schedule/               # 定时任务模块
│   │   └── app.module.ts           # 根模块
│   └── .env                        # 环境变量配置
│
├── repair-system-admin/            # 管理端 Vue3 前端
│   └── src/
│       ├── views/                  # 页面组件
│       ├── api/                    # 接口封装
│       ├── router/                 # 路由配置
│       ├── store/                  # 状态管理 (Pinia)
│       ├── styles/                 # 全局样式
│       └── constants/              # 常量定义
│
└── repair-system-uniapp/           # 用户端 UniApp 小程序
    └── src/
        ├── pages/                  # 页面目录
        │   ├── user/               # 用户端页面
        │   └── technician/         # 师傅端页面
        ├── components/             # 公共组件
        ├── api/                    # 接口封装
        ├── store/                  # 状态管理 (Pinia)
        ├── utils/                  # 工具函数
        └── locale/                 # 多语言文件
```

---

## 功能特性

### 报修管理
- 结构化报修表单（故障类型、照片上传、楼栋定位）
- 智能预判：输入关键词自动推送FAQ排查指南
- 预约上门时间选择

### 智能派单
- 三种派单策略：按责任区、直接派单、轮流派单
- 责任区精确到楼栋（师傅-楼栋多对多映射）
- 负载均衡：优先分配给当前工单最少的师傅
- 紧急工单自动置顶，15分钟响应超时提醒

### 工单生命周期
```
报修提交 → 审批通过 → 派单 → 接单 → 上门 → 维修 → 
物料申领 → 支付 → 完成 → 评价
```

### 物料库存管理
- 入库/出库/盘点标准操作
- 库存预警（不足/积压/临期）
- 申领锁库存机制（悲观锁 + 10分钟支付超时释放）
- 出库后置审核，不阻塞维修进度

### 支付集成
- 支持微信小程序支付
- 服务费与物料费分离
- 支付成功自动生成出库单

### 数据看板
- 核心运营指标卡片
- 工单趋势图、故障类型分布饼图
- 楼栋故障热力图、工种负载柱状图

### 即时通讯
- WebSocket 实时聊天
- 自动加入关联工单聊天室
- 图片消息支持

### 角色权限
- 超级管理员(2)：全局配置、用户管理、岗位管理
- 仓库管理员(3)：物料管理、入库出库、盘点、供应商
- 对账管理员(4)：工单全量查看、数据看板、报表导出
- 维修师傅(1)：接单、维修、物料申领
- 普通用户(0)：报修、支付、评价

### 微信订阅消息
- 下单成功通知
- 服务派单通知
- 师傅接单通知
- 待支付提醒
- 支付成功通知
- 服务评价提醒
- 师傅拒单通知

---

## 环境要求

| 软件 | 版本要求 |
|:---|:---|
| Node.js | >= 16.20.0 |
| MySQL | >= 8.0 |
| npm | >= 8.0 |

---

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd repair-system
```

### 2. 后端部署

```bash
cd repair-system-backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入数据库、JWT、微信等配置

# 运行数据库迁移（手动导入 SQL 文件）
# 或将 entities synchronize 设为 true 自动同步

# 启动开发服务器
npm run start:dev
```

### 3. 管理端部署

```bash
cd repair-system-admin

# 安装依赖
npm install

# 配置环境变量
# 编辑 .env 文件，设置 VITE_API_BASE_URL

# 启动开发服务器
npm run dev
```

### 4. 用户端部署

```bash
cd repair-system-uniapp

# 安装依赖
npm install

# 使用 HBuilderX 或 CLI 运行
# 微信开发者工具导入 dist/dev/mp-weixin 目录
```

---

## 核心配置

后端 `.env` 文件示例：

```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=repair_system

# JWT
JWT_SECRET=your-super-secret-key

# 微信小程序
WECHAT_APPID=wx**************
WECHAT_SECRET=your_app_secret
WECHAT_MCHID=1234567890
WECHAT_NOTIFY_URL=https://your-domain.com/api/payment/callback
```

---

## 默认账号

| 角色 | 用户名 | 密码 |
|:---|:---|:---|
| 超级管理员 | admin | 123456 |
| 普通用户 | 123 | 123456 |
| 师傅账号 | 参见 technician 表 | 123456 |

> 生产环境务必修改默认密码

---

## API 文档

后端启动后，可访问 Swagger 文档（如已配置）：

```
http://localhost:3000/api-docs
```

主要接口前缀：

| 模块 | 路径前缀 |
|:---|:---|
| 认证 | `/auth` |
| 工单 | `/order` |
| 物料 | `/material` |
| 分类 | `/category` |
| 供应商 | `/supplier` |
| 楼栋 | `/building` |
| 岗位 | `/repair-position` |
| 师傅 | `/technician` |
| 看板 | `/dashboard` |
| FAQ | `/faq` |
| 聊天 | `/chat`, `/message` |
| 通知 | `/notification` |
| 盘点 | `/stock-check` |
| 出库审核 | `/stock-out` |
| 用户管理 | `/admin/users` |

---

## 部署建议

- **生产环境**：使用 `npm run start:prod` 编译构建，配合 PM2 或 Docker 进行进程管理
- **HTTPS**：配置 Nginx 反向代理，使用 Let's Encrypt 免费证书
- **数据库**：定期全量备份，保留最近7天备份文件
- **日志**：使用 PM2 日志或 NestJS 内置日志记录

---

## License

本项目为内部使用，未经授权不得外传。