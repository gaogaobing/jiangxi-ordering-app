@echo off
chcp 65001 >nul
title 江西小炒点餐系统 - 推送到 GitHub
cd /d "%~dp0"

echo ================================================
echo    江西小炒点餐系统 · 推送到 GitHub
echo ================================================
echo.

REM 检查 git
where git >nul 2>nul
if %errorlevel% neq 0 (
  echo [错误] 未检测到 Git，请先安装：https://git-scm.com/
  echo 安装时全部默认选项即可。
  pause
  exit /b 1
)

REM 检查远程仓库是否已配置
git remote get-url origin >nul 2>nul
if %errorlevel% neq 0 goto :configure_remote

REM 已有远程仓库，读取地址
for /f "delims=" %%i in ('git remote get-url origin') do set "REPO=%%i"
goto :ready

:configure_remote
echo 还没配置远程仓库地址。
echo.
set "REPO="
set /p "REPO=请输入你的 GitHub 仓库地址（直接回车用默认）: "
if not defined REPO set "REPO=https://github.com/ggbb19971030/jiangxi-ordering.git"
git remote add origin "%REPO%" 2>nul
if %errorlevel% neq 0 (
  echo [错误] 添加远程仓库失败：%REPO%
  pause
  exit /b 1
)

:ready
echo.
echo 远程仓库: %REPO%
echo.
echo 即将推送到 GitHub...
echo.
echo 【重要】首次推送会弹出浏览器窗口，登录你的 GitHub 账号
echo （如果没有弹窗，Git 会提示你手动登录或生成访问令牌）
echo.
echo 如果提示仓库不存在，请先到 github.com 手动创建同名仓库，
echo 记得：不勾选任何初始化文件（README/.gitignore 都不要选）。
echo.
pause

REM 把最新改动一起提交
git add -A
git commit -m "update: latest changes" >nul 2>nul

REM 推送到 main 分支
echo.
echo 正在推送，请稍候...
git push -u origin main

if %errorlevel% neq 0 (
  echo.
  echo ================================================
  echo  [失败] 推送未成功！请检查以下几点：
  echo ================================================
  echo  1. GitHub 上是否已创建仓库（名字要和上面一致）
  echo  2. 网络能否访问 github.com
  echo  3. 浏览器登录窗口是否授权成功
  echo  4. 如果反复失败，用浏览器打开 %REPO%
  echo     查看仓库是否存在
  echo.
  echo  解决不了就把截图发给我，我帮你排查。
  pause
  exit /b 1
)

echo.
echo ================================================
echo  [成功] 代码已推送到 GitHub！🎉
echo ================================================
echo  仓库地址: %REPO%
echo.
echo  下一步：在云服务器上执行 git clone 即可拉取代码
echo  详见 deploy\公网部署手册.md
echo.
pause
