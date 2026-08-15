# Render 部署故障排查：江西小炒点餐系统

## 现象

访问 `https://jiangxi-ordering-app.onrender.com/qr-tables.html` 返回 `Not Found`。

通过命令行查看响应头，发现关键字段：

```
x-render-routing: no-server
```

这表示：**Render 目前没有为该服务分配运行中的实例**，请求直接被 Render 的网关拦截并返回 404。

## 常见原因

1. **服务类型选错**：在 Render 上创建服务时选择了 **Static Site**，而不是 **Web Service**。Static Site 不会运行 `node server.js`，因此所有动态路由都会 404。
2. **构建/启动失败**：`npm install` 或 `node server.js` 在 Render 构建环境中失败，导致实例无法启动。
3. **服务尚未完成首次部署**：首次部署可能需要 2-5 分钟，期间会出现 404。
4. **服务被手动停止或休眠过久**：Free 套餐实例可能因错误进入停止状态。

## 已完成的代码修复

已更新 `render.yaml`（并推送到 GitHub `main` 分支），新增：

- `region: oregon`
- `rootDir: .`
- `numInstances: 1`
- 保留 `autoDeploy: true`

推送后 Render 应自动重新部署；如果未自动触发，请按下方步骤手动重新部署。

## 操作步骤

### 第一步：确认服务类型

1. 打开 [Render Dashboard](https://dashboard.render.com/)
2. 找到服务 `jiangxi-ordering-app`
3. 查看服务卡片或设置页中的 **Type**
   - 必须是 **Web Service**
   - 如果是 **Static Site**，请删除该服务，重新创建为 **Web Service**

### 第二步：查看构建和运行日志

1. 进入服务详情页
2. 点击顶部 **Logs** 标签
3. 查看最近的日志：
   - **Build Logs**：看 `npm install` 是否成功
   - **Deploy Logs**：看 `node server.js` 是否启动
   - **Runtime Logs**：看启动后是否有报错

常见的失败信息：

```
Error: Cannot find module 'express'
# 说明 npm install 没有成功

Error: listen EACCES 0.0.0.0:80
# 说明应用没有使用 process.env.PORT，但本代码已正确读取 PORT

Server unhealthy
# 说明健康检查 /api/dishes 没有返回 200
```

### 第三步：手动重新部署

1. 在服务详情页点击 **Manual Deploy** → **Clear Cache and Deploy**
2. 等待部署完成（通常 2-5 分钟）
3. 部署完成后，等待 Health Check 通过（绿色圆点）

### 第四步：验证

部署成功后，用浏览器或 curl 访问：

```bash
curl -I https://jiangxi-ordering-app.onrender.com/qr-tables.html
```

应返回：

```
HTTP/2 200
content-type: text/html; charset=UTF-8
```

而不是 `404 Not Found`。

## 备用方案：删除并重新创建服务

如果以上步骤无效，建议删除现有服务后重新创建：

1. 在 Render Dashboard 中删除 `jiangxi-ordering-app`
2. 点击 GitHub 仓库 README 中的 **Deploy to Render** 按钮（如果有）
   - 或访问：[https://render.com/deploy?repo=https://github.com/gaogaobing/jiangxi-ordering-app](https://render.com/deploy?repo=https://github.com/gaogaobing/jiangxi-ordering-app)
3. 创建时确保选择：
   - **Service Type**: Web Service
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
4. 等待部署完成并访问

## 本地验证正常

在本地运行以下命令可验证应用本身无问题：

```bash
npm install
node server.js
```

访问 http://localhost:3000/qr-tables.html 应正常显示桌码生成器。

## 联系支持

如果 Render Dashboard 中显示服务一直无法启动，可以将 **Deploy Logs** 和 **Runtime Logs** 截图发给我，我可以进一步定位问题。
