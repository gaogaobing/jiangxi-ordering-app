# 江西小炒 · 顾客点餐系统

## 项目简介
椒江区江西小炒店的扫码点餐 H5 应用，顾客扫桌上二维码即可浏览菜单、下单，老板在后台实时管理订单。

## 功能特性
- 📱 顾客端：扫码点餐、分类浏览、购物车、桌号选择、备注下单
- 🍳 管理端：订单管理（接单/制作中/完成）、菜品管理（增删改/上下架）、数据统计
- 🖼️ 菜品图片：管理后台可上传实物图片，顾客端显示真实照片
- 🪑 桌码点餐：桌码生成器一键生成各桌二维码，顾客扫码自动带出桌号
- 🚀 轻量部署：纯 Node.js + Express，JSON 文件存储，无需数据库

## 快速开始

### 本地运行
```bash
npm install
node server.js
```

### 访问地址
- 顾客点餐：http://localhost:3000
- 管理后台：http://localhost:3000/admin （密码：admin888）
- 桌码生成器：http://localhost:3000/qr-tables.html

### 桌码打印流程
1. 电脑和手机连同一个 WiFi
2. 查看电脑 IP（Windows 用 `ipconfig`）
3. 打开桌码生成器，地址填 `http://你的IP:3000`
4. 设置桌号范围（如 1-10），点击"生成桌码"
5. 点击"打印桌码"，把二维码贴在每张桌上
6. 顾客扫码 → 自动识别桌号 → 直接点餐下单

### Docker 部署
```bash
docker-compose up -d --build
```

### Nginx 反向代理
参考 `nginx.conf` 配置文件

## 技术栈
- 后端：Node.js + Express
- 存储：JSON 文件（轻量，无需数据库）
- 前端：HTML + CSS + JavaScript（无框架，加载快）
- 部署：Docker + Nginx

## 项目结构
```
restaurant-ordering-app/
├── server.js          # 服务端（Express API + 静态文件）
├── database.js        # 数据层（JSON 文件读写）
├── package.json
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── .github/workflows/
│   └── ci-cd.yml      # CI/CD 流水线
├── public/            # 前端文件
│   ├── index.html     # 顾客点餐页面
│   ├── admin.html     # 管理后台页面
│   ├── qr-tables.html # 桌码生成器
│   ├── uploads/       # 菜品图片上传目录
│   ├── css/style.css
│   └── js/app.js      # 顾客端逻辑
└── data/              # 数据存储（自动创建）
    └── db.json
```

## 预置菜品（种子数据）
20道江西小炒菜品：辣椒炒肉、藜蒿炒腊肉、啤酒鸭、小炒黄牛肉、瓦罐肉饼汤、南昌拌粉等

## API 文档
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/dishes | 获取菜品列表 |
| POST | /api/dishes | 新增菜品 |
| PUT | /api/dishes/:id | 编辑菜品 |
| PATCH | /api/dishes/:id/toggle | 上架/下架 |
| POST | /api/orders | 创建订单 |
| GET | /api/orders | 获取订单列表 |
| PATCH | /api/orders/:id | 更新订单状态 |
| GET | /api/stats | 获取统计数据 |
| POST | /api/upload | 上传菜品图片（multipart，字段名 image） |

## 项目结构
```
restaurant-ordering-app/
├── server.js          # 服务端（Express API + 静态文件）
├── database.js        # 数据层（JSON 文件读写）
├── package.json
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── .github/workflows/
│   └── ci-cd.yml      # CI/CD 流水线
├── public/            # 前端文件
│   ├── index.html     # 顾客点餐页面
│   ├── admin.html     # 管理后台页面
│   ├── qr-tables.html # 桌码生成器（扫码点餐）
│   ├── uploads/       # 菜品图片（自动创建）
│   ├── css/style.css
│   └── js/app.js      # 顾客端逻辑
└── data/              # 数据存储（自动创建）
    └── db.json
```
