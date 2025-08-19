# Supabase 认证问题修复指南

## 问题诊断

根据日志分析，出现以下错误：
- "One-time token not found"
- "Email link is invalid or has expired"
- "No authentication code provided"

## 根本原因

您的项目使用 PKCE 流程（通过 `exchangeCodeForSession` 确认），但 Supabase 邮件模板可能仍在使用旧的隐式流程格式。

## 修复步骤

### 1. 登录 Supabase 控制台
访问：https://supabase.com/dashboard/project/pskhqphqikghdyqmgsud

### 2. 配置邮件模板（关键步骤）

问题的根本原因是Supabase的Magic Link邮件模板使用了错误的token格式。对于PKCE流程，需要使用`TokenHash`而不是`Token`。

**步骤：**
1. 导航到 **Authentication** > **Email Templates**
2. 选择 **Magic Link** 模板
3. 将模板内容完全替换为以下格式：

```html
<h2>Magic Link</h2>

<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Log In</a></p>

<p>If the above link doesn't work, copy and paste this URL into your browser:</p>
<p>{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email</p>

<p>This link will expire in 1 hour for security reasons.</p>
```

**关键要点：**
- 必须使用 `{{ .TokenHash }}` 而不是 `{{ .Token }}`
- 重定向URL必须指向 `/auth/callback`
- 必须包含 `type=email` 参数
- 保存后立即生效

### 3. 验证 URL 配置

确保在 **Authentication** > **URL Configuration** 中：
- **Site URL**: `http://localhost:3000`
- **Redirect URLs** 包含：
  - `http://localhost:3000/**`
  - `http://localhost:3000/auth/callback`

### 4. 更新回调处理（如需要）

如果仍有问题，可能需要在回调路由中添加 token_hash 处理：

```typescript
// 在 app/auth/callback/route.ts 中添加
const tokenHash = searchParams.get('token_hash')
const type = searchParams.get('type')

if (tokenHash && type === 'email') {
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'email',
  })
  
  if (error) {
    console.error('Error verifying token hash:', error)
    // 处理错误
  }
  
  if (data.user) {
    // 用户认证成功
  }
}
```

### 5. 测试流程

1. 保存邮件模板更改
2. 清除浏览器缓存
3. 重新测试注册/登录流程
4. 检查邮件中的链接格式是否正确

## 关键差异

**旧格式（隐式流程）**：
```
{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=email
```

**新格式（PKCE流程）**：
```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email
```

## 验证成功

修复后，您应该看到：
- 邮件中的链接指向 `/auth/callback` 而不是 `/auth/confirm`
- URL 参数使用 `token_hash` 而不是 `token`
- 认证日志中不再出现 "One-time token not found" 错误

## 生产环境注意事项

部署到生产环境时，记得：
1. 更新 Site URL 为生产域名
2. 添加生产域名到 Redirect URLs
3. 保留 localhost URLs 用于本地开发