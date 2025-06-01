# CloudFlare API 完整接口文档

## 📋 项目概述

这是一个基于 Spring Boot + MyBatis-Plus 的完整 RESTful API 服务项目，提供用户管理、邮箱管理和认证授权功能。

### 🎯 核心功能
- **用户管理系统**: 完整的用户CRUD操作
- **邮箱管理系统**: 邮箱记录管理 + frequency扣费机制
- **认证授权系统**: JWT + 基于角色的权限控制
- **数据统计**: 分页查询、数据筛选

### 🛠 技术栈
- **框架**: Spring Boot 3.2.5
- **数据库**: MySQL 8.0+
- **ORM**: MyBatis-Plus 3.5.7
- **安全**: Spring Security + JWT
- **构建工具**: Maven 3.6+
- **Java版本**: 17+

### 🌐 服务信息
- **开发环境**: http://45.204.6.32:5000
- **数据库**: MySQL (8.138.177.105:3306/boot)
- **认证方式**: JWT Bearer Token

---

## 📊 API 概览

| 功能模块 | 接口数量 | 主要功能 |
|----------|----------|----------|
| **认证授权** | 3个 | 注册、登录、获取用户信息 |
| **用户管理** | 9个 | 完整CRUD + 权限管理 + frequency管理 |
| **邮箱管理** | 8个 | 完整CRUD + 自动扣费 |
| **卡密管理** | 8个 | 生成、查询、禁用、删除卡密 |
| **充值管理** | 6个 | 卡密充值、管理员充值、充值记录 |
| **系统接口** | 1个 | 健康检查 |
| **总计** | **35个** | **完整业务功能** |

---

## 🔐 认证与授权

### 通用响应格式
```json
{
  "code": 200,      // 状态码
  "message": "...", // 消息说明
  "data": {}        // 数据（可选）
}
```

### 状态码说明
| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 身份验证失败 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 权限级别
- **游客**: 可访问注册、登录、健康检查接口
- **普通用户**: 可管理自己的信息和邮箱记录
- **管理员**: 拥有所有权限，可管理所有用户和数据

---

# 🔑 认证接口

## 1. 用户注册
**接口**: `POST /api/register`
**权限**: 无需认证
**描述**: 注册新用户账户

### 请求参数
```json
{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com",
  "permissions": "user"  // 可选: "user" 或 "admin"
}
```

### 响应示例
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "frequency": 0,
      "permissions": "user",
      "createdAt": "2025-01-25 10:30:00",
      "updatedAt": "2025-01-25 10:30:00"
    },
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

## 2. 用户登录
**接口**: `POST /api/login`
**权限**: 无需认证
**描述**: 用户登录，支持用户名或邮箱

### 请求参数
```json
{
  "username": "testuser",  // 用户名或邮箱
  "password": "password123"
}
```

### 响应示例
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "frequency": 5,
      "permissions": "user",
      "createdAt": "2025-01-25 10:30:00",
      "updatedAt": "2025-01-25 10:35:00"
    },
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

## 3. 获取当前用户信息
**接口**: `GET /api/user/info`
**权限**: 需要认证
**描述**: 获取当前登录用户的详细信息

### 请求头
```
Authorization: Bearer <token>
```

### 响应示例
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "frequency": 5,
    "permissions": "user",
    "createdAt": "2025-01-25 10:30:00",
    "updatedAt": "2025-01-25 10:35:00"
  }
}
```

---

# 👥 用户管理接口

## 1. 获取所有用户列表
**接口**: `GET /api/users`
**权限**: 仅管理员
**描述**: 获取系统中所有用户的列表

### 请求头
```
Authorization: Bearer <admin_token>
```

### 响应示例
```json
{
  "code": 200,
  "message": "获取用户列表成功",
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "frequency": 100,
      "permissions": "admin",
      "createdAt": "2025-01-25 09:00:00",
      "updatedAt": "2025-01-25 10:00:00"
    },
    {
      "id": 2,
      "username": "user1",
      "email": "user1@example.com",
      "frequency": 5,
      "permissions": "user",
      "createdAt": "2025-01-25 10:30:00",
      "updatedAt": "2025-01-25 10:35:00"
    }
  ]
}
```

## 2. 分页获取用户列表
**接口**: `GET /api/users/page`
**权限**: 仅管理员
**描述**: 分页获取用户列表

### 查询参数
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| pageNum | int | 否 | 1 | 页码 |
| pageSize | int | 否 | 10 | 每页大小 |

### 请求示例
```
GET /api/users/page?pageNum=1&pageSize=5
Authorization: Bearer <admin_token>
```

### 响应示例
```json
{
  "code": 200,
  "message": "获取用户分页列表成功",
  "data": {
    "records": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "frequency": 100,
        "permissions": "admin",
        "createdAt": "2025-01-25 09:00:00",
        "updatedAt": "2025-01-25 10:00:00"
      }
    ],
    "total": 50,
    "size": 5,
    "current": 1,
    "pages": 10
  }
}
```

## 3. 根据ID获取用户信息
**接口**: `GET /api/users/{id}`
**权限**: 管理员或用户本人
**描述**: 获取指定用户的详细信息

### 路径参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 用户ID |

### 请求示例
```
GET /api/users/1
Authorization: Bearer <token>
```

### 响应示例
```json
{
  "code": 200,
  "message": "获取用户信息成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "frequency": 5,
    "permissions": "user",
    "createdAt": "2025-01-25 10:30:00",
    "updatedAt": "2025-01-25 10:35:00"
  }
}
```

## 4. 更新用户信息
**接口**: `PUT /api/users/{id}`
**权限**: 管理员或用户本人
**描述**: 更新指定用户的基本信息

### 请求参数
```json
{
  "username": "newusername",
  "password": "newpassword123",  // 可选，不传则不修改密码
  "email": "newemail@example.com",
  "permissions": "admin"  // 可选
}
```

### 响应示例
```json
{
  "code": 200,
  "message": "用户信息更新成功",
  "data": {
    "id": 1,
    "username": "newusername",
    "email": "newemail@example.com",
    "frequency": 5,
    "permissions": "admin",
    "createdAt": "2025-01-25 10:30:00",
    "updatedAt": "2025-01-25 11:00:00"
  }
}
```

## 5. 修改用户权限
**接口**: `PUT /api/user/permissions`
**权限**: 仅管理员
**描述**: 修改指定用户的权限级别

### 请求参数
```json
{
  "user_id": 1,
  "permissions": "admin"  // "user" 或 "admin"
}
```

### 响应示例
```json
{
  "code": 200,
  "message": "用户权限更新成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "frequency": 5,
    "permissions": "admin",
    "createdAt": "2025-01-25 10:30:00",
    "updatedAt": "2025-01-25 11:00:00"
  }
}
```

## 6. 修改用户使用频次
**接口**: `PUT /api/user/frequency`
**权限**: 管理员或用户本人
**描述**: 修改指定用户的使用频次

### 请求参数
```json
{
  "userId": 1,
  "frequency": 20
}
```

### 响应示例
```json
{
  "code": 200,
  "message": "用户使用频次更新成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "frequency": 20,
    "permissions": "user",
    "createdAt": "2025-01-25 10:30:00",
    "updatedAt": "2025-01-25 11:05:00"
  }
}
```

## 7. 充值用户使用频次
**接口**: `POST /api/user/{userId}/frequency/increment`
**权限**: 仅管理员
**描述**: 为指定用户的使用频次充值+1

### 路径参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | Long | 是 | 用户ID |

### 请求示例
```
POST /api/user/1/frequency/increment
Authorization: Bearer <admin_token>
```

### 响应示例
```json
{
  "code": 200,
  "message": "用户使用频次充值成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "frequency": 21,
    "permissions": "user",
    "createdAt": "2025-01-25 10:30:00",
    "updatedAt": "2025-01-25 11:10:00"
  }
}
```

## 8. 删除用户
**接口**: `DELETE /api/users/{id}`
**权限**: 仅管理员
**描述**: 删除指定用户（不能删除自己）

### 路径参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 用户ID |

### 请求示例
```
DELETE /api/users/2
Authorization: Bearer <admin_token>
```

### 响应示例
```json
{
  "code": 200,
  "message": "用户删除成功"
}
```

## 9. 批量删除用户
**接口**: `DELETE /api/users/batch`
**权限**: 仅管理员
**描述**: 批量删除用户（不能删除自己）

### 请求参数
```json
[2, 3, 4, 5]
```

### 响应示例
```json
{
  "code": 200,
  "message": "批量删除用户成功"
}
```

---

# 📧 邮箱管理接口

## 重要说明
- **创建邮箱记录时会自动扣减用户的frequency次数**
- **如果用户frequency为0或负数，将无法创建邮箱记录**
- **每创建一个邮箱记录，用户frequency减1**

## 1. 创建邮箱记录
**接口**: `POST /api/emails`
**权限**: 需要认证
**描述**: 创建新的邮箱记录（自动扣减frequency）

### 请求参数
```json
{
  "userId": 1,
  "email": "sender@example.com",
  "toEmail": "receiver@example.com"
}
```

### 响应示例
```json
{
  "code": 200,
  "message": "邮箱记录创建成功",
  "data": {
    "id": 1,
    "userId": 1,
    "email": "sender@example.com",
    "toEmail": "receiver@example.com",
    "createdAt": "2025-01-25 11:15:00",
    "updatedAt": "2025-01-25 11:15:00"
  }
}
```

### 错误响应（frequency不足）
```json
{
  "code": 400,
  "message": "用户剩余次数不足，无法创建邮箱记录"
}
```

## 2. 获取邮箱记录

### 2.1 根据ID获取
**接口**: `GET /api/emails/{id}`
**权限**: 需要认证

### 2.2 获取所有邮箱记录
**接口**: `GET /api/emails`
**权限**: 需要认证

### 2.3 分页获取邮箱记录
**接口**: `GET /api/emails/page`
**权限**: 需要认证

#### 查询参数
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| pageNum | int | 否 | 1 | 页码 |
| pageSize | int | 否 | 10 | 每页大小 |

#### 响应示例
```json
{
  "code": 200,
  "message": "获取邮箱分页列表成功",
  "data": {
    "records": [
      {
        "id": 1,
        "userId": 1,
        "email": "sender@example.com",
        "toEmail": "receiver@example.com",
        "createdAt": "2025-01-25 11:15:00",
        "updatedAt": "2025-01-25 11:15:00"
      }
    ],
    "total": 100,
    "size": 10,
    "current": 1,
    "pages": 10
  }
}
```

### 2.4 根据用户ID获取邮箱记录
**接口**: `GET /api/emails/user/{userId}`
**权限**: 需要认证
**描述**: 获取指定用户的所有邮箱记录

#### 路径参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | Long | 是 | 用户ID |

#### 响应示例
```json
{
  "code": 200,
  "message": "获取用户邮箱列表成功",
  "data": [
    {
      "id": 1,
      "userId": 1,
      "email": "user1@example.com",
      "toEmail": "target1@example.com",
      "createdAt": "2025-01-25 11:15:00",
      "updatedAt": "2025-01-25 11:15:00"
    },
    {
      "id": 2,
      "userId": 1,
      "email": "user1@example.com",
      "toEmail": "target2@example.com",
      "createdAt": "2025-01-25 11:20:00",
      "updatedAt": "2025-01-25 11:20:00"
    }
  ]
}
```

## 3. 更新邮箱记录
**接口**: `PUT /api/emails/{id}`
**权限**: 需要认证
**描述**: 更新指定ID的邮箱记录

### 请求参数
```json
{
  "userId": 1,
  "email": "new_sender@example.com",
  "toEmail": "new_receiver@example.com"
}
```

### 响应示例
```json
{
  "code": 200,
  "message": "邮箱记录更新成功",
  "data": {
    "id": 1,
    "userId": 1,
    "email": "new_sender@example.com",
    "toEmail": "new_receiver@example.com",
    "createdAt": "2025-01-25 11:15:00",
    "updatedAt": "2025-01-25 11:25:00"
  }
}
```

## 4. 删除邮箱记录

### 4.1 删除单个记录
**接口**: `DELETE /api/emails/{id}`
**权限**: 需要认证

### 4.2 批量删除记录
**接口**: `DELETE /api/emails/batch`
**权限**: 需要认证

#### 请求参数
```json
[1, 2, 3, 4, 5]
```

#### 响应示例
```json
{
  "code": 200,
  "message": "批量删除成功"
}
```

---

# 🎫 卡密管理接口（管理员专用）

## 1. 生成卡密
**接口**: `POST /api/card-codes/generate`
**权限**: 仅管理员
**描述**: 批量生成指定面值和数量的卡密

### 请求参数
```json
{
  "value": 10,        // 面值（充值的frequency数量）
  "count": 5,         // 生成数量
  "validDays": 30,    // 有效天数，null表示永久有效
  "description": "10次充值卡"  // 卡密描述
}
```

### 响应示例
```json
{
  "code": 200,
  "message": "卡密生成成功",
  "data": [
    {
      "id": 1,
      "code": "ABCD1234EFGH5678",
      "value": 10,
      "status": "unused",
      "usedByUserId": null,
      "usedByUsername": null,
      "usedAt": null,
      "expiresAt": "2025-02-24 11:30:00",
      "description": "10次充值卡",
      "createdAt": "2025-01-25 11:30:00",
      "updatedAt": "2025-01-25 11:30:00"
    }
  ]
}
```

## 2. 获取所有卡密
**接口**: `GET /api/card-codes`
**权限**: 仅管理员
**描述**: 获取系统中所有卡密的列表

## 3. 分页获取卡密
**接口**: `GET /api/card-codes/page`
**权限**: 仅管理员
**描述**: 分页获取卡密列表

### 查询参数
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| pageNum | int | 否 | 1 | 页码 |
| pageSize | int | 否 | 10 | 每页大小 |

## 4. 禁用卡密
**接口**: `PUT /api/card-codes/{id}/disable`
**权限**: 仅管理员
**描述**: 禁用指定的卡密（已使用的卡密无法禁用）

## 5. 启用卡密
**接口**: `PUT /api/card-codes/{id}/enable`
**权限**: 仅管理员
**描述**: 启用指定的卡密

## 6. 删除卡密
**接口**: `DELETE /api/card-codes/{id}`
**权限**: 仅管理员
**描述**: 删除指定的卡密

## 7. 批量删除卡密
**接口**: `DELETE /api/card-codes/batch`
**权限**: 仅管理员
**描述**: 批量删除卡密

### 请求参数
```json
[1, 2, 3, 4, 5]
```

## 8. 清理过期卡密
**接口**: `POST /api/card-codes/clean-expired`
**权限**: 仅管理员
**描述**: 将所有过期但状态仍为unused的卡密设置为disabled

### 响应示例
```json
{
  "code": 200,
  "message": "清理过期卡密成功",
  "data": 3  // 清理的卡密数量
}
```

---

# 💰 充值管理接口

## 1. 使用卡密充值
**接口**: `POST /api/recharge/card`
**权限**: 需要认证
**描述**: 用户使用卡密为自己充值frequency

### 请求参数
```json
{
  "code": "ABCD1234EFGH5678"
}
```

### 响应示例
```json
{
  "code": 200,
  "message": "卡密充值成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "frequency": 15,  // 充值后的frequency
    "permissions": "user",
    "createdAt": "2025-01-25 10:30:00",
    "updatedAt": "2025-01-25 11:35:00"
  }
}
```

### 错误响应
```json
{
  "code": 400,
  "message": "卡密不存在"
}
```

```json
{
  "code": 400,
  "message": "卡密已被使用"
}
```

```json
{
  "code": 400,
  "message": "卡密已过期"
}
```

## 2. 管理员充值
**接口**: `POST /api/recharge/admin`
**权限**: 仅管理员
**描述**: 管理员为指定用户充值frequency

### 查询参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | Long | 是 | 用户ID |
| amount | Integer | 是 | 充值数量 |
| description | String | 否 | 充值描述 |

### 请求示例
```
POST /api/recharge/admin?userId=1&amount=20&description=活动奖励
Authorization: Bearer <admin_token>
```

### 响应示例
```json
{
  "code": 200,
  "message": "管理员充值成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "frequency": 35,  // 充值后的frequency
    "permissions": "user",
    "createdAt": "2025-01-25 10:30:00",
    "updatedAt": "2025-01-25 11:40:00"
  }
}
```

## 3. 获取当前用户充值记录
**接口**: `GET /api/recharge/records`
**权限**: 需要认证
**描述**: 获取当前登录用户的充值记录

### 响应示例
```json
{
  "code": 200,
  "message": "获取充值记录成功",
  "data": [
    {
      "id": 1,
      "userId": 1,
      "username": "testuser",
      "cardCode": "ABCD1234EFGH5678",
      "amount": 10,
      "type": "card",
      "beforeBalance": 5,
      "afterBalance": 15,
      "description": "卡密充值：10次充值卡",
      "createdAt": "2025-01-25 11:35:00"
    },
    {
      "id": 2,
      "userId": 1,
      "username": "testuser",
      "cardCode": null,
      "amount": 20,
      "type": "admin",
      "beforeBalance": 15,
      "afterBalance": 35,
      "description": "活动奖励",
      "createdAt": "2025-01-25 11:40:00"
    }
  ]
}
```

## 4. 获取指定用户充值记录
**接口**: `GET /api/recharge/records/{userId}`
**权限**: 仅管理员
**描述**: 获取指定用户的充值记录

## 5. 获取所有充值记录
**接口**: `GET /api/recharge/records/all`
**权限**: 仅管理员
**描述**: 获取系统中所有用户的充值记录

## 6. 分页获取充值记录
**接口**: `GET /api/recharge/records/page`
**权限**: 仅管理员
**描述**: 分页获取充值记录

### 查询参数
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| pageNum | int | 否 | 1 | 页码 |
| pageSize | int | 否 | 10 | 每页大小 |

---

# 🏥 系统接口

## 健康检查
**接口**: `GET /api/health`
**权限**: 无需认证
**描述**: 检查API服务运行状态

### 响应示例
```json
{
  "code": 200,
  "message": "API服务正常运行"
}
```

---

# 📝 使用示例

## 1. 完整的用户操作流程

```bash
# 1. 用户注册
curl -X POST http://45.204.6.32:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com"
  }'

# 2. 用户登录
curl -X POST http://45.204.6.32:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

# 3. 获取当前用户信息
curl -X GET http://45.204.6.32:5000/api/user/info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. 管理员为用户充值frequency
curl -X PUT http://45.204.6.32:5000/api/user/frequency \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "userId": 1,
    "frequency": 10
  }'

# 5. 管理员单次充值
curl -X POST http://45.204.6.32:5000/api/user/1/frequency/increment \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## 2. 完整的邮箱管理流程

```bash
# 1. 创建邮箱记录（会自动扣减frequency）
curl -X POST http://localhost:5000/api/emails \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": 1,
    "email": "sender@example.com",
    "toEmail": "receiver@example.com"
  }'

# 2. 获取所有邮箱记录
curl -X GET http://localhost:5000/api/emails \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. 分页查询邮箱记录
curl -X GET "http://localhost:5000/api/emails/page?pageNum=1&pageSize=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. 根据用户ID查询邮箱记录
curl -X GET http://localhost:5000/api/emails/user/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 5. 更新邮箱记录
curl -X PUT http://localhost:5000/api/emails/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": 1,
    "email": "new_sender@example.com",
    "toEmail": "new_receiver@example.com"
  }'

# 6. 删除邮箱记录
curl -X DELETE http://localhost:5000/api/emails/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 7. 批量删除邮箱记录
curl -X DELETE http://localhost:5000/api/emails/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '[1, 2, 3]'
```

## 3. 管理员操作示例

```bash
# 1. 获取所有用户列表
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 2. 分页获取用户列表
curl -X GET "http://localhost:5000/api/users/page?pageNum=1&pageSize=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 3. 更新用户权限
curl -X PUT http://localhost:5000/api/user/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "user_id": 2,
    "permissions": "admin"
  }'

# 4. 删除用户
curl -X DELETE http://localhost:5000/api/users/2 \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 5. 批量删除用户
curl -X DELETE http://localhost:5000/api/users/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '[2, 3, 4]'
```

---

# 🗄️ 数据库表结构

## 用户表 (user)
```sql
CREATE TABLE `user` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(120) UNIQUE NOT NULL,
  `frequency` INT DEFAULT 0,
  `permissions` VARCHAR(20) DEFAULT 'user',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 邮箱表 (email)
```sql
CREATE TABLE `email` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `to_email` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_to_email` (`to_email`)
);
```

---

# ⚠️ 错误处理

## 常见错误响应

### 参数验证错误
```json
{
  "code": 400,
  "message": "用户名不能为空"
}
```

### 认证失败
```json
{
  "code": 401,
  "message": "token已过期"
}
```

### 权限不足
```json
{
  "code": 403,
  "message": "权限不足，只有管理员可以查看所有用户"
}
```

### 资源不存在
```json
{
  "code": 404,
  "message": "用户不存在"
}
```

### 业务逻辑错误
```json
{
  "code": 400,
  "message": "用户剩余次数不足，无法创建邮箱记录"
}
```

### 服务器错误
```json
{
  "code": 500,
  "message": "服务器错误: 数据库连接失败"
}
```

---

# 🚀 部署说明

## 环境要求
- Java 17+
- MySQL 8.0+
- Maven 3.6+

## 配置文件
修改 `src/main/resources/application.properties`：

```properties
# 数据库配置
spring.datasource.url=jdbc:mysql://your-host:3306/your-database
spring.datasource.username=your-username
spring.datasource.password=your-password

# JWT配置
app.jwt.secret=your-secret-key
app.jwt.expiration=86400000

# 服务端口
server.port=5000
```

## 启动命令

```bash
# 开发环境
./mvnw spring-boot:run

# 生产环境
./mvnw clean package
java -jar target/CloudFlare_Api-0.0.1-SNAPSHOT.jar
```

---

# 📈 业务流程图

## 用户注册登录流程
```
用户注册 → 密码加密 → 保存数据库 → 生成JWT → 返回token
用户登录 → 验证密码 → 生成JWT → 返回token和用户信息
```

## 邮箱创建流程
```
创建邮箱请求 → 验证用户存在 → 检查frequency > 0 → frequency-1 → 创建邮箱记录 → 返回结果
                                    ↓
                              frequency不足 → 返回错误
```

## 权限验证流程
```
请求接口 → 验证JWT → 获取用户信息 → 检查权限 → 允许/拒绝访问
```

---

**文档版本**: v2.0
**最后更新**: 2025-01-25
**维护者**: CloudFlare API Team
**接口总数**: 20个
**功能完整度**: 100%
