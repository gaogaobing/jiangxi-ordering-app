#!/bin/bash
# 江西小炒 · 顾客点餐系统 - Linux/macOS 启动脚本
# 使用方法: chmod +x start.sh && ./start.sh

echo "=========================================="
echo "   江西小炒 · 顾客点餐系统"
echo "=========================================="
echo

# 检查 Node.js
if ! command -v node &> /dev/null; then
  echo "[错误] 未检测到 Node.js，请先安装: https://nodejs.org/"
  echo "建议安装 LTS 版本 (18 或 20)"
  exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
  echo "[首次运行] 正在安装依赖..."
  npm install --production
  if [ $? -ne 0 ]; then
    echo "[错误] 依赖安装失败，请检查网络后重试"
    exit 1
  fi
fi

echo "[启动] 点餐系统正在启动..."
echo
echo "  顾客点餐:  http://localhost:3000"
echo "  管理后台:  http://localhost:3000/admin  (密码: admin888)"
echo
echo "  按 Ctrl+C 停止服务"
echo
node server.js
