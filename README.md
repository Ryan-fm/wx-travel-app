# AI旅行规划

基于微信云开发的 AI 旅行路线规划小程序，支持自然语言输入，AI 生成个性化行程并配图。

## 功能

- **智能分析**：输入旅行想法，AI 自动提取目的地、天数、预算、偏好
- **流式生成**：路线内容实时展示，Markdown 渲染
- **行程配图**：主路线图 + 每个行程项独立生成实景风格图片
- **地图导航**：路线地图支持全屏查看，点击标记可导航
- **历史记录**：查看、分享过往路线
- **调整方案**：在详情页可修改需求重新生成

## 技术栈

- 微信小程序原生 + 云开发
- AI：`wx.cloud.extend.AI`（混元 hunyuan-t1）
- 图片：云开发扩展 `generateImage`
- 云函数：登录、路线存储、路线查询

## 项目结构

```
wx-travel-app/
├── miniprogram/
│   ├── pages/
│   │   ├── index/           # 首页 - 输入与AI分析
│   │   ├── login/           # 登录
│   │   ├── route-generate/  # 路线生成（可选）
│   │   ├── route-detail/    # 路线详情 - AI生成、行程、地图
│   │   └── my-routes/       # 历史路线
│   ├── utils/
│   │   ├── aiRoute.js       # AI路线生成、图片生成、JSON解析
│   │   └── util.js
│   ├── app.js
│   └── ...
├── cloudfunctions/
│   ├── login/               # 用户登录
│   ├── generate-route/      # 路线入库
│   ├── get-routes/          # 路线列表
│   ├── get-route-detail/    # 路线详情
│   ├── update-profile/      # 用户资料
│   └── generateImage-*      # 图片生成（云开发扩展）
└── cloudbaserc.json
```

## 流程说明

1. 首页输入旅行想法（如「北京3天，预算3000，喜欢历史」）
2. AI 分析提取结构化参数
3. 确认后跳转详情页，前端调用混元 AI 流式生成路线
4. 生成主路线图 + 各行程项图片
5. 调用 `generate-route` 云函数保存到云数据库

## 配置

### 云开发

1. 开通微信云开发
2. 在 `cloudbaserc.json` 中配置 `envId`
3. 在 `app.js` 中同步云环境 ID

### 云开发扩展

- 需开通 **AI 扩展** 以使用 `wx.cloud.extend.AI`
- 需开通 **generateImage** 扩展用于图片生成

### 云函数部署

```bash
# 在微信开发者工具中
# 右键 cloudfunctions 目录 -> 上传并部署：云端安装依赖
```

### 数据库

创建 `routes` 集合，用于存储路线数据。

## 页面说明

| 页面 | 说明 |
|------|------|
| index | 输入想法、AI分析、参考示例、历史记录入口 |
| route-detail | 流式路线展示、行程、地图、调整方案、分享 |
| my-routes | 历史路线列表 |
| login | 微信登录 |

## 开发

1. 使用微信开发者工具打开项目
2. 配置 AppID 与云环境
3. 部署云函数
4. 预览或真机调试

## 许可

MIT
