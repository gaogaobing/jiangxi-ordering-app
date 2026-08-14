# 推送到 GitHub 操作说明

> 本机（WorkBuddy 环境）外网受限，无法直接推送，所以我把仓库建好、代码提交好，
> 你只需要在**电脑上手动运行一个脚本**即可完成推送（走你电脑自己的网络）。

---

## 你要做的 4 步（约 10 分钟）

### 第 1 步：浏览器登录 GitHub
- 打开 https://github.com/login
- 邮箱：`ggbb19971030@gmail.com`（注意是 **gmail**，不是 gamil）
- 登录密码：你自己设置的密码（如果忘记，用「Forgot password」找回）

### 第 2 步：新建仓库
1. 登录后点右上角 **+** → **New repository**
2. **Repository name** 填：`jiangxi-ordering`
3. 可见性选 **Public**（或 Private 都行）
4. ⚠️ **不要勾选**任何初始化选项：README、.gitignore、License 都不要勾
5. 点 **Create repository**

> 创建成功后页面会显示仓库地址，形如：
> `https://github.com/ggbb19971030/jiangxi-ordering.git`

### 第 3 步：双击运行一键推送脚本
- 打开文件夹：`restaurant-ordering-app\`
- **双击 `push-to-github.bat`**
- 脚本会自动：提交代码 → 推送到 GitHub
- 首次推送会**弹出浏览器窗口**让你登录 GitHub 授权 —— 登录你的账号，点「Authorize」授权即可
- 看到 `[成功] 代码已推送到 GitHub` 就完成了

### 第 4 步：验证
- 打开 https://github.com/ggbb19971030/jiangxi-ordering
- 能看到 `server.js`、`public/`、`Dockerfile` 等 20 个文件 = 成功

---

## 常见问题

| 问题 | 解决方法 |
|------|----------|
| 提示 `Repository not found` | GitHub 上仓库还没创建，或名字不一致，回第 2 步 |
| 没弹浏览器登录窗口 | 在脚本窗口按提示操作；或先手动登录 https://github.com/login |
| 提示输入用户名密码 | 用户名填 `ggbb19971030`，密码填 GitHub 登录密码 |
| 推送失败但网络正常 | 把窗口截图发我，我帮你排查 |

---

## 推上去之后呢？

代码到 GitHub 后，**系统还不能直接访问**（GitHub 只托管代码，不运行程序）。
要真正上线，还需要一台云服务器，在服务器上执行：

```bash
git clone https://github.com/ggbb19971030/jiangxi-ordering.git
cd jiangxi-ordering
sudo bash deploy/deploy.sh
```

服务器购买和部署细节，见 `deploy/公网部署手册.md`（约 50~100 元/年）。
