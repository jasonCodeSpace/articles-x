# API Security Implementation

本文档描述了项目中实施的API安全措施和使用方法。

## 已实施的安全措施

### 1. 身份验证

#### CRON_SECRET 认证
- **适用端点**: `/api/fetch-tweet-details`, `/api/health` (详细信息), `/api/admin/logs`
- **配置**: 在环境变量中设置 `CRON_SECRET`
- **使用方法**:
  - Authorization Header: `Authorization: Bearer YOUR_CRON_SECRET`
  - Query Parameter: `?secret=YOUR_CRON_SECRET`

### 2. 速率限制

#### 全局速率限制配置
- **公共端点**: 20 请求/分钟
- **认证端点**: 100 请求/分钟
- **重型操作**: 5 请求/分钟

#### 受保护的端点
- `/api/categories` - 公共限制
- `/api/fetch-tweet-details` - 认证限制
- `/api/health` - 公共限制
- `/api/admin/logs` - 公共限制

### 3. 错误处理

#### 统一错误响应
- 标准化错误代码和消息
- 生产环境中隐藏敏感信息
- 开发环境中显示详细错误信息

#### 错误类型
- `UNAUTHORIZED` - 401: 需要身份验证
- `FORBIDDEN` - 403: 访问被拒绝
- `RATE_LIMITED` - 429: 请求过于频繁
- `BAD_REQUEST` - 400: 无效请求
- `NOT_FOUND` - 404: 资源未找到
- `INTERNAL_ERROR` - 500: 内部服务器错误

### 4. API 访问日志和监控

#### 自动日志记录
- 所有API请求自动记录
- 包含时间戳、方法、路径、客户端ID、响应时间等
- 错误请求包含错误信息

#### 监控端点
`GET /api/admin/logs` (需要认证)

**获取日志**:
```
GET /api/admin/logs?action=logs&limit=100
```

**获取统计信息**:
```
GET /api/admin/logs?action=stats&timeWindow=60
```

**健康检查**:
```
GET /api/admin/logs?action=health
```

#### 日志过滤选项
- `method` - HTTP方法过滤
- `path` - 路径过滤
- `statusCode` - 状态码过滤
- `clientId` - 客户端ID过滤
- `since` - 时间过滤

## 环境变量配置

```env
# 必需的安全配置
CRON_SECRET=your_secure_secret_here

# API配置
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=twitter-api45.p.rapidapi.com

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 使用示例

### 认证请求示例

```bash
# 使用Authorization Header
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-domain.com/api/fetch-tweet-details?tweetId=123

# 使用Query Parameter
curl "https://your-domain.com/api/fetch-tweet-details?tweetId=123&secret=YOUR_CRON_SECRET"
```

### 监控API使用示例

```bash
# 获取最近的API日志
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     "https://your-domain.com/api/admin/logs?action=logs&limit=50"

# 获取API统计信息
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     "https://your-domain.com/api/admin/logs?action=stats&timeWindow=60"
```

## 安全最佳实践

1. **保护CRON_SECRET**: 使用强密码，定期轮换
2. **HTTPS**: 生产环境中始终使用HTTPS
3. **监控**: 定期检查API日志和统计信息
4. **速率限制**: 根据实际使用情况调整限制
5. **错误处理**: 不要在错误消息中暴露敏感信息

## 生产环境注意事项

1. **日志存储**: 当前使用内存存储，生产环境建议使用外部日志服务
2. **速率限制**: 当前使用内存存储，生产环境建议使用Redis
3. **监控**: 考虑集成专业的APM工具
4. **备份**: 定期备份重要配置和日志

## 故障排除

### 常见错误

- **401 Unauthorized**: 检查CRON_SECRET配置
- **429 Rate Limited**: 等待速率限制重置或联系管理员
- **500 Internal Error**: 检查服务器日志和环境变量配置

### 调试模式

开发环境中，错误响应会包含详细的调试信息。生产环境中这些信息会被隐藏以保护系统安全。