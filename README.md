# Cloudflare Email Routing Manager

一个用于管理 Cloudflare 邮件路由规则的 React 应用程序。

## 功能特性

- 查看所有邮件路由规则
- 创建新的邮件转发规则
- 编辑现有规则
- 删除规则
- 实时状态显示

## 技术栈

- React 18
- TypeScript
- Ant Design
- Vite
- Axios

## 开始使用

1. 克隆仓库：
```bash
git clone https://github.com/xnping/Cloudflare_EmailRouting.git
cd Cloudflare_EmailRouting
```

2. 安装依赖：
```bash
npm install
```

3. 配置环境变量：
创建 `.env` 文件并添加以下内容：
```
VITE_CLOUDFLARE_API_TOKEN=你的API令牌
VITE_CLOUDFLARE_ZONE_ID=你的区域ID
VITE_CLOUDFLARE_EMAIL_DOMAIN=你的邮箱域名
```

4. 启动开发服务器：
```bash
npm run dev
```

## 构建部署

构建生产版本：
```bash
npm run build
```

## 许可证

MIT
