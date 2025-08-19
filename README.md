# Articles X

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
MAX_PAGES_PER_LIST=10
TWITTER_TIMEOUT_MS=15000

# Security
CRON_SECRET=your-secure-random-string

# Twitter Lists (26 curated lists)
TWITTER_LIST_IDS=1937404509015216229,1935584949018493392,1935589446247735425,1935688464059511209,1935700214515482995,1937337350088220835,1935710460759667054,1935714208374477027,1935859754511089744,1935864265035923899,1935868968587133212,1935872719746130315,1935881324788642255,1936458870697652476,1936460104468983862,1936459239188230225,1938404661792239909,1938405333061283959,1936600603104317498,31814567,1936608745791828054,1936609850009780481,1936615512458301920,1936615987035455901,1936616443543433252,7450
```

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
- `POST /api/ingest` - Automated article harvesting from Twitter lists
  - Requires `x-cron-secret` header
  - Supports `?dryRun=1` for testing
  - Processes all 26 configured Twitter lists

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
npm run test:ingest     # Test ingestion API endpoint

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

### Cron Job Setup

Set up automated ingestion (every 20 minutes):

```bash
# Vercel Cron (vercel.json)
{
  "crons": [{
    "path": "/api/ingest",
    "schedule": "*/20 * * * *"
  }]
}

# Or use external service (cron-job.org, GitHub Actions, etc.)
curl -X POST https://your-domain.com/api/ingest \
  -H "x-cron-secret: your-secret"
```

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
npm run test:ingest      # Test API ingestion
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