# Articles X - Modern Article Curation Platform

## Overview

Articles X is a modern, production-ready article platform that curates and displays high-quality content from Twitter with beautiful UI, secure authentication, and intelligent categorization.

## ✨ Key Features

- 🔐 **Secure Authentication** - Email magic link/OTP via Supabase
- 🐦 **Smart Content Curation** - Automated article discovery and processing
- 🎨 **Modern UI** - Professional design with shadcn/ui and Tailwind CSS
- 📱 **Responsive Design** - Mobile-first, accessible interface
- 🔍 **Advanced Search** - Real-time filtering and sorting
- 🤖 **AI-Powered** - Intelligent summaries and categorization
- 🌐 **Multi-language** - Support for multiple languages
- 🛡️ **Row Level Security** - Fine-grained database access control
- ⚡ **TypeScript** - Full type safety throughout
- 🚀 **Production Ready** - Comprehensive error handling and monitoring

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **AI**: OpenAI GPT for content processing
- **Deployment**: Vercel
- **Performance**: Lighthouse CI monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Twitter API access (Bearer Token)
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd articles-x

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Twitter API
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Application
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 2. Database Setup

Run these SQL migrations in your Supabase SQL Editor:

```sql
-- 1. Copy and run: supabase/migrations/001_create_articles_table.sql
-- 2. Copy and run: supabase/migrations/002_add_author_fields.sql
-- 3. Copy and run: supabase/migrations/003_enable_rls.sql
```

Or use the Supabase CLI:

```bash
# Link your Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply database migrations
npx supabase db push
```

### 3. Add Sample Data (Optional)

```bash
npm run add-sample-data
```

### 4. Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
articles-x/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes
│   ├── article/           # Article pages
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/                  # Utility functions
│   ├── supabase/         # Database utilities
│   ├── utils.ts          # Helper functions
│   └── validations.ts    # Form validations
├── types/                # TypeScript type definitions
├── supabase/            # Database migrations
└── public/              # Static assets
```

## 🔄 API Endpoints

### Authentication
- `GET /login` - Login page with magic link form
- `GET /auth/callback` - Handle magic link authentication
- `GET /auth/auth-code-error` - Authentication error page

### Data Ingestion
- `POST /api/fetch-timeline` - Fetch tweets from Twitter lists
- `POST /api/process-articles` - Process article tweets with AI
- `GET /api/cleanup-tweets` - Clean up old non-article tweets

### Manual Operations
- `GET /api/regenerate-summaries` - Regenerate article summaries
- `GET /api/fix-missing-slugs` - Fix articles with missing slugs

## 🗄️ Database Schema

### Core Tables

#### `articles`
```sql
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  
  -- Author Information
  author_name TEXT NOT NULL,
  author_handle TEXT,
  author_profile_image TEXT,
  
  -- Twitter Integration
  tweet_id BIGINT,
  tweet_text TEXT,
  tweet_published_at TIMESTAMPTZ,
  
  -- Metadata
  article_url TEXT,
  featured_image_url TEXT,
  status TEXT DEFAULT 'published',
  published_at TIMESTAMPTZ,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Organization
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  language TEXT DEFAULT 'en',
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `tweets`
```sql
CREATE TABLE public.tweets (
  id BIGSERIAL PRIMARY KEY,
  tweet_id BIGINT UNIQUE NOT NULL,
  author_handle TEXT NOT NULL,
  has_article BOOLEAN DEFAULT FALSE,
  list_id TEXT,
  processed BOOLEAN DEFAULT FALSE,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security

- **Read Access**: Anyone can read published articles
- **Write Access**: Blocked for all users (service role only)
- **Admin Access**: Service role has full access

---

# Previous Documentation

A modern, production-ready article platform that curates and displays content from Twitter lists with beautiful UI and secure authentication.

## ✨ Features

- 🔐 **Secure Authentication** - Email magic link/OTP via Supabase
- 🐦 **Twitter Integration** - Automated ingestion from 26 curated lists
- 🎨 **Modern UI** - Professional design with shadcn/ui and Tailwind CSS
- 📱 **Responsive Design** - Mobile-first, accessible interface
- 🔍 **Advanced Search** - Real-time filtering and sorting
- 🛡️ **Row Level Security** - Fine-grained database access control
- ⚡ **TypeScript** - Full type safety throughout
- 🚀 **Production Ready** - Comprehensive error handling and monitoring

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (Magic Links)
- **Validation**: Zod schemas
- **Date Handling**: date-fns

### Key Components
- **ArticleCard**: Enhanced display with author profiles and metadata
- **FeedToolbar**: Search, filter, and sort functionality  
- **AuthSystem**: Magic link authentication with error handling
- **TwitterClient**: API integration with rate limiting and pagination
- **IngestSystem**: Automated article harvesting and processing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- RapidAPI account for Twitter access

### 1. Environment Setup

```bash
git clone <your-repo-url>
cd articles-x
npm install
cp .env.example .env.local
```

Update `.env.local` with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Twitter API Configuration  
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=twitter241.p.rapidapi.com
TWITTER_TIMEOUT_MS=15000

# Security
CRON_SECRET=your-secure-random-string

# Twitter Lists (3 curated lists)


### 2. Database Setup

Run these SQL migrations in your Supabase SQL Editor:

```sql
-- 1. Copy and run: supabase/migrations/001_create_articles_table.sql
-- 2. Copy and run: supabase/migrations/002_add_author_fields.sql
```

### 3. Add Sample Data (Optional)

```bash
npm run add-sample-data
```

### 4. Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📊 Database Schema

### Articles Table

```sql
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  
  -- Author Information
  author_name TEXT NOT NULL,
  author_handle TEXT,
  author_profile_image TEXT,
  
  -- Metadata
  article_url TEXT,
  featured_image_url TEXT,
  status TEXT DEFAULT 'published',
  published_at TIMESTAMPTZ,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Organization
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security

- **Read Access**: Anyone can read published articles
- **Write Access**: Blocked for all users (service role only)
- **Admin Access**: Service role has full access

## 🔄 API Endpoints

### Authentication
- `GET /login` - Login page with magic link form
- `GET /auth/callback` - Handle magic link authentication
- `GET /auth/auth-code-error` - Authentication error page

### Data Ingestion
- Automated article harvesting from Twitter lists via scheduled processes

### Article Display
- `GET /` - Protected main feed with search/filter capabilities

## 🛠️ Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Testing & Data
npm run test            # Run Jest tests
npm run seed:dry-run    # Test database connection
npm run add-sample-data # Add sample articles for testing


# Code Quality
npm run lint            # ESLint
npm run type-check      # TypeScript validation
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   npm i -g vercel
   vercel --prod
   ```

2. **Environment Variables**
   Add all `.env.local` variables to Vercel dashboard

3. **Database Setup**
   - Run migrations in Supabase SQL Editor
   - Configure authentication URLs in Supabase Auth settings

### Automated Processing

Automated ingestion runs every 20 minutes via scheduled processes.

## 🔐 Security Features

- **Row Level Security**: Database-level access control
- **CSRF Protection**: Built-in Next.js protection
- **Secure Headers**: Implemented via middleware
- **Rate Limiting**: API endpoints protected
- **Input Validation**: Zod schemas throughout
- **Auth Tokens**: HTTP-only cookies via Supabase

## 📱 UI Components

### ArticleCard Features
- ✅ Author profile images with fallback avatars
- ✅ Author names and social handles (@username)
- ✅ Article titles with proper typography
- ✅ Preview text with line clamping
- ✅ Multiple article access points
- ✅ Tags and metadata display
- ✅ Responsive card layout

### Authentication Pages
- ✅ Beautiful gradient login page
- ✅ Comprehensive error handling
- ✅ Success confirmation pages
- ✅ Mobile-responsive design

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific functionality

npm run seed:dry-run     # Test database connection
```

## 📈 Monitoring

The application includes comprehensive logging:

- Authentication events
- Article ingestion statistics  
- API error tracking
- Database operation logs

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Database and auth by [Supabase](https://supabase.com/)
- Icons by [Lucide](https://lucide.dev/)

---

**Articles X** - Discover curated articles from Twitter with a beautiful, secure interface.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>