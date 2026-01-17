# Xarticle 部署指南

## 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                         用户访问                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Vercel (前端)                                               │
│  - Next.js App                                              │
│  - 静态资源 + API Routes                                     │
│  - https://your-domain.vercel.app                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase (数据库 + 认证)                                    │
│  - PostgreSQL 数据库                                         │
│  - Row Level Security (RLS)                                 │
│  - Auth 服务                                                 │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────────┐
│  Racknerd 服务器 (定时任务)                                  │
│  - Article Pipeline (每2小时)                                │
│  - Daily Report (每天7:00 AM UTC)                           │
│  - Twitter API 调用                                          │
│  - DeepSeek AI 摘要生成                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 第一步：配置 Supabase

### 1.1 创建项目

1. 访问 [supabase.com](https://supabase.com)
2. 创建新项目
3. 记录以下信息：
   - **Project URL**
   - **service_role key** (注意保密！)

### 1.2 运行数据库迁移

在 Supabase Dashboard 的 SQL Editor 中依次运行以下迁移文件：

```bash
# 按顺序执行这些迁移
supabase/migrations/034_cleanup_authors_table.sql
supabase/migrations/035_remove_category_from_articles.sql
supabase/migrations/036_rebuild_daily_summary_table.sql
supabase/migrations/037_drop_tweets_table.sql
supabase/migrations/038_remove_tag_from_articles.sql
```

### 1.3 配置环境变量

在本地创建 `.env.local` 文件：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# DeepSeek API
DEEPSEEK_API_KEY=your_deepseek_api_key

# RapidAPI (Twitter)
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=twitter241.p.rapidapi.com

# Cron Secret (用于保护定时任务 API)
CRON_SECRET=$(openssl rand -hex 32)
```

---

## 第二步：部署到 Vercel

### 2.1 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2.2 登录并部署

```bash
# 登录 Vercel
vercel login

# 部署项目
vercel

# 添加环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add DEEPSEEK_API_KEY
vercel env add RAPIDAPI_KEY
vercel env add CRON_SECRET
```

### 2.3 或通过 Vercel Dashboard 部署

1. 访问 [vercel.com](https://vercel.com)
2. 连接你的 GitHub 仓库
3. 导入项目并配置环境变量
4. 点击 Deploy

---

## 第三步：配置 Racknerd 服务器

### 3.1 SSH 连接到服务器

```bash
ssh root@your-server-ip
```

### 3.2 安装 Node.js

```bash
# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 验证安装
node -v
npm -v
```

### 3.3 上传服务器文件

将 `server/` 目录上传到服务器：

```bash
# 在本地执行
scp -r server/ root@your-server-ip:/tmp/xarticle-server
```

### 3.4 在服务器上运行部署脚本

```bash
# SSH 到服务器
ssh root@your-server-ip

# 进入目录
cd /tmp/xarticle-server

# 创建 .env 文件
cp .env.example .env
nano .env  # 填入你的环境变量

# 运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

### 3.5 配置环境变量

编辑 `/root/xarticle-server/.env`：

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# DeepSeek API
DEEPSEEK_API_KEY=sk-xxxxxxxx

# RapidAPI
RAPIDAPI_KEY=xxxxxxxxxxxxxxxx
```

### 3.6 验证定时任务

```bash
# 查看已安装的 crontab
crontab -l

# 查看日志
tail -f /root/xarticle-server/logs/pipeline.log

# 手动运行测试
cd /root/xarticle-server
npm run pipeline
```

---

## 第四步：初始化 Twitter Lists

在 Vercel 部署的网站上访问以下 API 来初始化 Twitter Lists：

```bash
# 初始化 Twitter Lists (只需运行一次)
curl -X POST https://your-domain.vercel.app/api/init-twitter-lists \
  -H "Content-Type: application/json"
```

---

## 监控与维护

### 查看日志

```bash
# Racknerd 服务器日志
tail -f /root/xarticle-server/logs/pipeline.log
tail -f /root/xarticle-server/logs/daily-report.log

# Vercel 部署日志
vercel logs
```

### 更新服务器代码

```bash
# 本地
cd server
scp -r * root@your-server-ip:/root/xarticle-server/

# 服务器
ssh root@your-server-ip
cd /root/xarticle-server
npm install
```

### 定时任务时间表

| 任务 | 频率 | 说明 |
|------|------|------|
| Article Pipeline | 每2小时 | 获取推文、提取文章、生成摘要 |
| Daily Report | 每天 7:00 AM UTC | 生成过去24小时的日报 |

---

## 故障排查

### Supabase 连接问题

```bash
# 测试连接
psql "postgresql://postgres:password@db.project.supabase.co:5432/postgres?sslmode=require"
```

### 定时任务未运行

```bash
# 检查 cron 服务
systemctl status cron

# 查看 cron 日志
grep CRON /var/log/syslog
```

### API 限流

如果遇到 Twitter API 限流，调整 `server/crontab` 中的执行频率。

---

## 安全检查清单

- [ ] CRON_SECRET 已设置且足够复杂
- [ ] SUPABASE_SERVICE_ROLE_KEY 仅在服务器端使用
- [ ] .env 文件已添加到 .gitignore
- [ ] Supabase RLS 策略已正确配置
- [ ] 服务器防火墙已配置
- [ ] 定期更新依赖包
