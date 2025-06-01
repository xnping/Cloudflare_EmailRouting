# Cloudflare Email Routing 目标地址管理使用指南

## 🎯 功能概述

我已经成功将Cloudflare Email Routing的目标地址管理功能集成到您的应用程序中。现在您可以：

1. ✅ **创建目标地址** - 添加新的邮件转发目标
2. ✅ **查看地址列表** - 管理所有目标地址
3. ✅ **验证状态跟踪** - 查看地址验证状态
4. ✅ **删除地址** - 移除不需要的目标地址

## 🔧 配置要求

### 1. 环境变量配置

在项目根目录的`.env`文件中添加：

```env
# 现有配置
VITE_CLOUDFLARE_API_TOKEN=你的API令牌
VITE_CLOUDFLARE_ZONE_ID=你的区域ID
VITE_CLOUDFLARE_EMAIL_DOMAIN=你的邮箱域名

# 新增配置 - 目标地址管理必需
VITE_CLOUDFLARE_ACCOUNT_ID=你的Cloudflare账户ID
```

### 2. 获取Account ID

**方法1：通过Cloudflare Dashboard**
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 在右侧边栏可以看到"Account ID"
3. 复制该ID

**方法2：通过API**
```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts" \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json"
```

### 3. API权限要求

确保您的API Token具有以下权限：
- ✅ **Zone:Email Routing Rules:Edit** (现有功能)
- ✅ **Account:Email Routing Addresses:Edit** (新增功能)

## 📋 API 功能详解

### 1. 创建目标地址

```typescript
import { cloudflareApi } from './services/cloudflareApi';

// 创建新的目标地址
try {
    const newAddress = await cloudflareApi.createDestinationAddress('user@example.com');
    console.log('创建成功:', newAddress);
    
    // 返回的数据结构
    // {
    //     id: "address-id",
    //     email: "user@example.com",
    //     created: "2024-01-15T10:30:00Z",
    //     verified: null  // 初始为null，验证后会有时间戳
    // }
} catch (error) {
    console.error('创建失败:', error.message);
}
```

### 2. 获取所有目标地址

```typescript
try {
    const addresses = await cloudflareApi.getDestinationAddresses();
    console.log('地址列表:', addresses);
    
    // 检查验证状态
    addresses.forEach(addr => {
        if (addr.verified) {
            console.log(`✅ ${addr.email} 已验证 (${addr.verified})`);
        } else {
            console.log(`⏳ ${addr.email} 待验证`);
        }
    });
} catch (error) {
    console.error('获取失败:', error.message);
}
```

### 3. 获取特定地址详情

```typescript
try {
    const address = await cloudflareApi.getDestinationAddress('address-id');
    console.log('地址详情:', address);
} catch (error) {
    console.error('获取失败:', error.message);
}
```

### 4. 删除目标地址

```typescript
try {
    const deletedAddress = await cloudflareApi.deleteDestinationAddress('address-id');
    console.log('删除成功:', deletedAddress);
} catch (error) {
    console.error('删除失败:', error.message);
}
```

## 🎨 UI 组件使用

### 1. 导入组件

```typescript
import DestinationAddresses from './components/DestinationAddresses';
```

### 2. 在应用中使用

```tsx
function App() {
    return (
        <div>
            {/* 现有的邮件路由规则管理 */}
            <EmailRouting />
            
            {/* 新增的目标地址管理 */}
            <DestinationAddresses />
        </div>
    );
}
```

### 3. 组件功能

- **地址列表**：显示所有目标地址及其状态
- **验证状态**：清晰显示已验证/待验证状态
- **添加地址**：模态框形式添加新地址
- **删除确认**：安全的删除确认机制
- **错误处理**：友好的错误提示

## 🔄 验证流程

### 重要：地址验证是必需的！

1. **创建地址**
   ```typescript
   await cloudflareApi.createDestinationAddress('user@example.com');
   ```

2. **系统发送验证邮件**
   - Cloudflare自动发送验证邮件到目标地址
   - 邮件包含验证链接

3. **用户点击验证**
   - 用户检查邮箱
   - 点击验证链接

4. **验证完成**
   - `verified`字段更新为验证时间戳
   - 地址可以用于邮件路由规则

5. **在路由规则中使用**
   ```typescript
   // 只有验证过的地址才能用于转发
   await cloudflareApi.createDestination('support', 'user@example.com');
   ```

## 🔗 与现有功能集成

### 智能地址检查

在创建邮件路由规则前，检查目标地址是否已验证：

```typescript
async function createRuleWithValidation(prefix: string, targetEmail: string) {
    try {
        // 1. 获取所有目标地址
        const addresses = await cloudflareApi.getDestinationAddresses();
        
        // 2. 检查目标地址是否存在且已验证
        const targetAddress = addresses.find(addr => addr.email === targetEmail);
        
        if (!targetAddress) {
            // 地址不存在，先创建
            await cloudflareApi.createDestinationAddress(targetEmail);
            throw new Error('目标地址已创建，请先验证邮箱后再创建路由规则');
        }
        
        if (!targetAddress.verified) {
            throw new Error('目标地址未验证，请先验证邮箱');
        }
        
        // 3. 地址已验证，创建路由规则
        await cloudflareApi.createDestination(prefix, targetEmail);
        console.log('路由规则创建成功');
        
    } catch (error) {
        console.error('创建失败:', error.message);
    }
}
```

### 批量地址管理

```typescript
async function batchCreateAddresses(emails: string[]) {
    const results = [];
    
    for (const email of emails) {
        try {
            const address = await cloudflareApi.createDestinationAddress(email);
            results.push({ email, success: true, data: address });
        } catch (error) {
            results.push({ email, success: false, error: error.message });
        }
    }
    
    return results;
}
```

## 🚨 错误处理

### 常见错误及解决方案

1. **Account ID未配置**
   ```
   错误：Account ID is required for destination address management
   解决：配置 VITE_CLOUDFLARE_ACCOUNT_ID 环境变量
   ```

2. **权限不足**
   ```
   错误：API token requires Email Routing Addresses Write permission
   解决：更新API Token权限
   ```

3. **邮箱已存在**
   ```
   错误：Email address already exists as a destination address
   解决：检查现有地址列表，避免重复创建
   ```

4. **地址未验证**
   ```
   错误：Destination address not verified
   解决：提醒用户验证邮箱
   ```

## 📊 最佳实践

### 1. 地址管理策略

- **预先创建**：在需要前提前创建和验证地址
- **定期清理**：删除不再使用的目标地址
- **状态监控**：定期检查地址验证状态

### 2. 用户体验优化

- **验证提醒**：创建地址后提醒用户验证
- **状态显示**：清晰显示验证状态
- **错误友好**：提供有用的错误信息

### 3. 安全考虑

- **权限最小化**：只授予必要的API权限
- **验证必需**：确保只有验证过的地址用于转发
- **访问控制**：保护Account级别的操作

## 🎉 总结

现在您的应用程序具备了完整的Cloudflare Email Routing管理功能：

- ✅ **邮件路由规则管理** (现有功能)
- ✅ **目标地址管理** (新增功能)
- ✅ **验证状态跟踪** (新增功能)
- ✅ **完整的错误处理** (增强功能)

这为您提供了一个完整的邮件路由管理解决方案！🚀
