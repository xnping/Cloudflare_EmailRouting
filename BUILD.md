# 🚀 GitHub Actions 自动构建

## 📋 功能说明

当你推送代码到 GitHub 时，会自动：
1. 安装项目依赖
2. 构建生产版本
3. 保存构建文件供下载

## 🔧 需要配置的 GitHub Secrets

在 GitHub 仓库的 `Settings` → `Secrets and variables` → `Actions` 中添加：

```
VITE_CLOUDFLARE_API_TOKEN=你的API_Token
VITE_CLOUDFLARE_ZONE_ID=你的Zone_ID  
VITE_CLOUDFLARE_EMAIL_DOMAIN=你的邮件域名
VITE_CLOUDFLARE_ACCOUNT_ID=你的Account_ID
VITE_CLOUDFLARE_API_EMAIL=你的Cloudflare邮箱
VITE_CLOUDFLARE_API_KEY=你的Global_API_Key
```

## 📥 下载构建文件

1. 推送代码到 `main` 或 `master` 分支
2. 在 GitHub 仓库的 `Actions` 页面查看构建状态
3. 构建完成后，点击对应的工作流
4. 在 `Artifacts` 部分下载 `dist-files.zip`
5. 解压后就是可以直接部署的文件

## ✅ 使用方法

```bash
git add .
git commit -m "更新代码"
git push origin main
```

然后在 GitHub Actions 页面下载构建好的文件，手动上传到你的服务器即可！
