#!/usr/bin/env bash
# ============================================================
# 江西小炒点餐系统 - 云服务器一键部署脚本
# 适用系统：Ubuntu 18.04+ / Debian 10+ / CentOS 7+
# 用法：把整个项目传到服务器后，执行：
#   chmod +x deploy/deploy.sh && sudo bash deploy/deploy.sh
# ============================================================
set -e

echo ""
echo "=============================================="
echo " 🌶️ 江西小炒点餐系统 - 一键部署"
echo "=============================================="
echo ""

# ---------- 1. 检测系统 ----------
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
else
  OS=$(uname -s)
fi
echo "[1/6] 系统检测: $OS"

# ---------- 2. 安装 Node.js（如果不存在） ----------
if command -v node >/dev/null 2>&1; then
  echo "[2/6] Node.js 已安装: $(node -v)"
else
  echo "[2/6] 安装 Node.js 18 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get install -y nodejs
  elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    yum install -y nodejs
  else
    echo "❌ 无法自动安装 Node.js，请手动安装后重试"
    exit 1
  fi
fi

# ---------- 3. 安装依赖 ----------
echo "[3/6] 安装项目依赖..."
cd "$(dirname "$0")/.."
npm install --omit=dev --no-audit --no-fund
echo "依赖安装完成"

# ---------- 4. 创建数据目录 ----------
echo "[4/6] 准备数据目录..."
mkdir -p data public/uploads
chmod -R 755 data public/uploads

# ---------- 5. 配置 systemd 守护进程（开机自启+崩溃自动重启） ----------
echo "[5/6] 配置开机自启服务..."
APP_DIR=$(pwd)
SERVICE_FILE=/etc/systemd/system/jiangxi-ordering.service

cat > $SERVICE_FILE <<EOF
[Unit]
Description=Jiangxi Ordering System
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
ExecStart=$(command -v node) server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable jiangxi-ordering
systemctl restart jiangxi-ordering

# ---------- 6. 验证 ----------
echo "[6/6] 验证服务状态..."
sleep 2
if systemctl is-active jiangxi-ordering >/dev/null 2>&1; then
  echo ""
  echo "✅ 部署成功！服务已启动并开机自启"
  echo ""
  echo "   顾客端: http://$(curl -s ifconfig.me):3000"
  echo "   管理端: http://$(curl -s ifconfig.me):3000/admin"
  echo "   管理密码: admin888"
  echo ""
  echo "⚠️ 重要：请到云厂商控制台的安全组/防火墙放行 3000 端口！"
  echo "   （阿里云/腾讯云: 控制台 → 安全组 → 添加入方向规则 TCP:3000）"
  echo ""
  echo "   下一步：建议绑定域名 + 配置 HTTPS（见 部署说明.md）"
  echo ""
else
  echo "❌ 服务启动失败，查看日志: journalctl -u jiangxi-ordering -n 50"
  exit 1
fi
