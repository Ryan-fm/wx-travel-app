#!/bin/bash

# AI旅游路线规划小程序 - 云函数部署脚本

echo "开始部署云函数..."

# 检查是否在项目根目录
if [ ! -f "cloudbaserc.json" ]; then
    echo "错误：请在项目根目录运行此脚本"
    exit 1
fi

# 检查微信开发者工具CLI是否安装
# if ! command -v cli &> /dev/null; then
#     echo "错误：微信开发者工具CLI未安装"
#     echo "请先安装微信开发者工具：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html"
#     exit 1
# fi

# 部署登录云函数
echo "部署登录云函数..."
cd cloudfunctions/login
npm install --production
cd ../..

# 部署路线生成云函数
echo "部署路线生成云函数..."
cd cloudfunctions/generate-route
npm install --production
cd ../..

# 部署获取路线云函数
echo "部署获取路线云函数..."
cd cloudfunctions/get-routes
npm install --production
cd ../..

# 部署获取路线详情云函数
echo "部署获取路线详情云函数..."
cd cloudfunctions/get-route-detail
npm install --production
cd ../..

# 部署更新资料云函数
echo "部署更新资料云函数..."
cd cloudfunctions/update-profile
npm install --production
cd ../..

echo "云函数依赖安装完成！"

echo ""
echo "下一步操作："
echo "1. 打开微信开发者工具"
echo "2. 导入项目目录：$(pwd)"
echo "3. 在工具中配置AppID"
echo "4. 开通云开发环境"
echo "5. 在云开发控制台配置KIMI_API_KEY环境变量"
echo "6. 右键点击cloudfunctions目录，选择'上传并部署：云端安装依赖'"
echo ""
echo "配置说明："
echo "- 在cloudbaserc.json中更新envId为你的云环境ID"
echo "- 在app.js中更新env为你的云环境ID"
echo "- 在project.config.json中更新appid为你的小程序AppID"
echo ""
echo "Kimi API配置："
echo "1. 访问 https://platform.moonshot.cn/ 注册账号"
echo "2. 获取API密钥"
echo "3. 在云开发控制台 -> 环境 -> 环境配置中添加KIMI_API_KEY"
echo ""
echo "数据库初始化："
echo "1. 在云开发控制台创建集合：users, routes, favorites"
echo "2. 设置集合权限（建议使用安全规则）"
echo ""
echo "部署完成！"