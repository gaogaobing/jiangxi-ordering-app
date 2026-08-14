@echo off
chcp 65001 >nul
title 江西小炒点餐系统
echo ==========================================
echo    江西小炒 · 顾客点餐系统
echo ==========================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [错误] 未检测到 Node.js，请先安装：https://nodejs.org/
  echo 建议下载 LTS 版本（18 或 20）
  pause
  exit /b 1
)

REM 检查依赖
if not exist node_modules (
  echo [首次运行] 正在安装依赖...
  call npm install --production
  if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败，请检查网络后重试
    pause
    exit /b 1
  )
)

echo [启动] 点餐系统正在启动...
echo.
echo   顾客点餐:  http://localhost:3000
echo   管理后台:  http://localhost:3000/admin  (密码: admin888)
echo.
echo   按 Ctrl+C 停止服务
echo.
node server.js
pause
