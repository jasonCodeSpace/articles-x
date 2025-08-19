# Articles X

A modern article platform built with Next.js, Supabase, and TypeScript.

## Features

- 🔐 **Secure Authentication** - Email magic link/OTP authentication via Supabase
- 📚 **Article Management** - Full CRUD operations with RLS security
- 🎨 **Modern UI** - Built with shadcn/ui and Tailwind CSS
- 🛡️ **Row Level Security** - Fine-grained access control
- 📱 **Responsive Design** - Works on all devices
- ⚡ **TypeScript** - Full type safety throughout

## Getting Started

### 1. Environment Setup

Copy the example environment file and add your Supabase credentials:

```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase project details:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. Database Setup

Run the migration in your Supabase SQL Editor:

```bash
# Copy and paste the contents of this file into Supabase SQL Editor:
supabase/migrations/001_create_articles_table.sql
```

### 3. Install Dependencies & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 4. Test Database Connection

Run the seed dry-run script to verify your setup:

```bash
npm run seed:dry-run
```

## Database Schema

### Articles Table

The `public.articles` table includes:

- **Content**: `title`, `slug`, `content`, `excerpt`
- **Metadata**: `author_id`, `author_name`, `status`, `published_at`
- **Engagement**: `likes_count`, `views_count`, `comments_count`
- **SEO**: `meta_title`, `meta_description`, `featured_image_url`
- **Organization**: `tags`, `category`
- **Timestamps**: `created_at`, `updated_at` (auto-updated)

### Row Level Security (RLS)

The articles table implements strict RLS policies:

#### ✅ **Read Access (SELECT)**
- **Anonymous users**: Can read published articles only (`status = 'published'`)
- **Authenticated users**: Can read published articles only (`status = 'published'`)
- **Service role**: Can read all articles (bypasses RLS)

#### ❌ **Write Access (INSERT/UPDATE/DELETE)**
- **Anonymous users**: **Blocked** - No write access
- **Authenticated users**: **Blocked** - No write access
- **Service role**: **Full access** - Can perform all operations

#### Why This Design?

This security model ensures:
- **Public safety**: Only published content is visible to users
- **Write protection**: Prevents unauthorized content creation/modification
- **Admin control**: Only service role (admin functions) can manage content
- **Performance**: Efficient queries with proper indexes

#### Implementation Details

```sql
-- Allow anyone to read published articles
CREATE POLICY "Anyone can read published articles"
ON public.articles FOR SELECT
USING (status = 'published');

-- Block all writes for regular users
CREATE POLICY "Block all writes for regular users"
ON public.articles FOR ALL
TO authenticated, anon
USING (false) WITH CHECK (false);
```

**Note**: The service role automatically bypasses RLS policies, giving it full access to all operations.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed:dry-run` - Test database connection and RLS policies

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript
- **Validation**: Zod

## Project Structure

```
articles-x/
├── app/
│   ├── (protected)/        # Protected routes
│   ├── auth/              # Auth callbacks
│   ├── login/             # Login page
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # shadcn/ui components
│   └── logout-button.tsx  # Custom components
├── lib/
│   └── supabase/          # Supabase clients
├── scripts/
│   └── seed-dry-run.ts    # Database testing script
└── supabase/
    └── migrations/        # SQL migrations
```
