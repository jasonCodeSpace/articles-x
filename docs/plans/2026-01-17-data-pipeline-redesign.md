# 数据提取流程重设计

> 状态: 设计完成
> 日期: 2026-01-17

## 背景

当前数据提取流程存在以下问题：
- 零指标（tweet_likes, tweet_replies, tweet_views 全部返回0）
- 内容截断（full_article_content 被截断）
- Slug格式错误（非ASCII字符处理不当）
- 摘要语言错误（summary_english 返回中文）

---

## 设计决策

| 项目 | 决策 |
|------|------|
| 架构 | 方案A - 简化版（无中间tweets表） |
| 查重策略 | 查重但更新变化的字段（avatar, likes, replies, views） |
| 删除字段 | `tweet_bookmarks`, `article_preview_text` |
| 保留指标 | `tweet_likes`, `tweet_replies`, `tweet_views` |
| 内嵌媒体 | 直接使用Twitter原始URL，不下载到本地存储 |
| AI服务 | 全部使用DeepSeek |
| 翻译策略 | 每次调用只输出一种语言，避免混合输出 |
| 英文检测 | 正则检测（零依赖） |

---

## 工作流程

```
Step 1: Fetch Lists
├─ 获取3个List的推文
│  - 1961298657371910342
│  - 1961293346099589584
│  - 1961296267004502233
└─ 输出: TwitterTweet[]

Step 2: Filter & Dedupe（内存中）
├─ 筛选有 article 标签的推文
├─ 提取 tweet_id 列表
├─ 查询数据库: SELECT tweet_id FROM articles WHERE tweet_id IN (...)
└─ 输出: 新文章的 tweet_id[] + 需更新的 tweet_id[]

Step 3: Deep Fetch
├─ 对每个 tweet_id 调用 fetchTweetDetail
├─ 获取完整文章内容 + 媒体链接 + 指标
└─ 输出: FullArticle[]

Step 4: Generate Summaries (DeepSeek)
├─ 检测 title 是否为英文
│  ├─ 是英文 → title_english = title（直接复制）
│  └─ 非英文 → 在调用1中翻译
├─ 调用1 (全英文输出): title_english + summary_english + category
└─ 调用2 (全中文输出): summary_chinese

Step 5: Generate Slug
├─ 检测 title 是否为英文
├─ 英文 → 用 title 生成 slug
└─ 非英文 → 用 title_english 生成 slug

Step 6: Save to Articles Table
├─ 新文章: INSERT (全部字段)
└─ 已存在: UPDATE (avatar, likes, replies, views)
```

---

## 字段映射

| 字段 | 来源 | 处理逻辑 |
|------|------|----------|
| `id` | 自动生成 | UUID |
| `title` | `articleResult.title` | 原样保留 |
| `title_english` | DeepSeek翻译 或 直接复制 | 先检测是否英文 |
| `slug` | `title` 或 `title_english` | 音译+清理 |
| `author_name` | `user.name` | 原样保留 |
| `author_handle` | `user.screen_name` | 原样保留 |
| `author_avatar` | `user.profile_image_url` | **每次更新** |
| `article_published_at` | `article.created_at` | ISO格式 |
| `article_url` | 构造 | `https://x.com/{handle}/article/{article_id}` |
| `category` | DeepSeek生成 | 英文分类 |
| `tweet_id` | `tweet.id_str` | 主键关联 |
| `tweet_text` | `tweet.full_text` | 推文正文 |
| `tweet_published_at` | `tweet.created_at` | ISO格式 |
| `tweet_views` | `tweet.view_count` | **每次更新** |
| `tweet_replies` | `tweet.reply_count` | **每次更新** |
| `tweet_likes` | `tweet.favorite_count` | **每次更新** |
| `full_article_content` | `articleResult.content` | 完整HTML/文本 |
| `summary_chinese` | DeepSeek生成 | 中文摘要 |
| `summary_english` | DeepSeek生成 | 英文摘要 |
| `language` | 检测 | `en`, `zh`, `es` 等 |

---

## Slug 生成规则

```typescript
function generateSlug(title: string): string {
  return title
    .toLowerCase()                          // 1. 转小写
    .normalize('NFD')                        // 2. 分解重音字符
    .replace(/[\u0300-\u036f]/g, '')        // 3. 移除重音符号 (á→a, ñ→n)
    .replace(/[_\s]+/g, '-')                // 4. 空格/下划线 → 连字符
    .replace(/[^a-z0-9-]/g, '')             // 5. 移除非字母数字（保留连字符）
    .replace(/-+/g, '-')                    // 6. 多个连字符合并
    .replace(/^-|-$/g, '')                  // 7. 移除首尾连字符
}
```

### 中文/日文标题处理
- 用 `title_english` 的翻译结果来生成 slug
- Fallback: `article-{tweet_id前6位}`

---

## 英文检测函数

```typescript
function isEnglish(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g, '')
  const latinChars = letters.replace(/[^a-zA-Z]/g, '').length
  return latinChars / letters.length > 0.5
}
```

---

## DeepSeek 调用策略

核心原则：**每次调用只输出一种语言**

```
步骤0: 检测 title 是否为英文（正则检测）
       ↓
       是英文 → title_english = title（直接复制）
       不是英文 → 在调用1中翻译
       ↓
调用1 (全英文输出): title_english + summary_english + category
       ↓
调用2 (全中文输出): summary_chinese
```

---

## 错误处理与限流

### API 限流策略

| API | 限制 | 处理方式 |
|-----|------|----------|
| Twitter (RapidAPI) | 10 req/s | 请求间隔 100ms |
| DeepSeek | 1000次/天 | 计数器 + 跳过已有摘要的文章 |

### 错误处理

| 场景 | 处理方式 |
|------|----------|
| Twitter API 429 (限流) | 指数退避重试，最多3次 |
| Twitter API 5xx | 指数退避重试，最多3次 |
| Deep Fetch 失败 | 跳过该文章，记录日志 |
| DeepSeek 调用失败 | 保存文章（无摘要），后续补充 |
| Slug 生成为空 | 使用 `article-{tweet_id前6位}` 作为 fallback |
| 数据库写入失败 | 记录日志，继续处理下一条 |

### 重试逻辑

```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === maxRetries - 1) throw err
      await sleep(1000 * Math.pow(2, i)) // 1s, 2s, 4s
    }
  }
}
```

---

## 数据库迁移

```sql
-- 删除不需要的字段
ALTER TABLE articles DROP COLUMN IF EXISTS tweet_bookmarks;
ALTER TABLE articles DROP COLUMN IF EXISTS article_preview_text;

-- 确保必要字段存在
ALTER TABLE articles ADD COLUMN IF NOT EXISTS title_english TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
```

---

## 每日日报生成

### 工作流程

```
Step 1: 查询过去24小时的文章
        └─ SELECT summary_english FROM articles
           WHERE created_at > NOW() - INTERVAL '24 hours'
        ↓
Step 2: 调用1 (英文输出)
        ├─ 输入: 所有 summary_english
        └─ 输出: digest_english
        ↓
Step 3: 调用2 (中文输出)
        ├─ 输入: digest_english
        └─ 输出: digest_chinese (翻译)
        ↓
Step 4: 保存日报
        └─ UPSERT INTO daily_summary
```

### 定时执行

- Cron: `0 12 * * *` (UTC 12:00)
- 对应美东时间 7:00 AM（上班路上）

### 日报格式

#### 英文版

```
DAILY DIGEST | January 17, 2026 | 25 Articles

HIGHLIGHTS

1. Article Title Here
   One sentence summary describing the key insight or news.

2. Article Title Here
   One sentence summary describing the key insight or news.

3. Article Title Here
   One sentence summary describing the key insight or news.


QUICK READS

- Topic description in one line
- Topic description in one line
- Topic description in one line
- Topic description in one line
- Topic description in one line


KEY NUMBERS

- $2.5B: Brief context
- 1.2M: Brief context
- 30%: Brief context
```

#### 中文版

```
每日简报 | 2026年1月17日 | 共25篇

要闻

1. 文章标题
   一句话总结核心观点或新闻。

2. 文章标题
   一句话总结核心观点或新闻。

3. 文章标题
   一句话总结核心观点或新闻。


速读

- 一行描述主题要点
- 一行描述主题要点
- 一行描述主题要点


关键数据

- 25亿美元：简短说明
- 120万：简短说明
```

---

## Twitter List IDs

- 1961298657371910342
- 1961293346099589584
- 1961296267004502233

---

## 最终输出Schema

```
id, title, title_english, slug, author_name, author_handle, author_avatar,
article_published_at, article_url, category, tweet_id, tweet_text,
tweet_published_at, tweet_views, tweet_replies, tweet_likes,
full_article_content, summary_chinese, summary_english, language
```

---

## 媒体处理

- 图片/视频直接使用Twitter原始URL
- 前端渲染时加载Twitter CDN资源
- 不下载到Supabase Storage
- 需测试URL持久性
