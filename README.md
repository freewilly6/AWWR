# American — World Wide Recruitment

Executive search and headhunting website built with Next.js, Tailwind CSS, and Supabase.

## Tech Stack

- **Next.js** (App Router)
- **Tailwind CSS v4**
- **Supabase** (PostgreSQL database for blog/job content)
- **Three.js** (revolving globe)
- **Vercel** (deployment)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor
3. Copy your project URL and anon key

### 3. Configure environment variables

Copy `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** The site works with placeholder data when Supabase is not configured. Once you add your Supabase credentials, it will pull from the database instead.

## Project Structure

```
src/
  app/
    page.tsx                  # Landing page
    blog/
      page.tsx                # Blog archive
      [slug]/page.tsx         # Individual post
    career-opportunities/
      page.tsx                # Job listings with filters
    opportunities/
      [slug]/page.tsx         # Job post (redirects to /blog/[slug])
    contact/
      page.tsx                # Contact page
    admin/
      page.tsx                # Simple post creation form
  components/
    Header.tsx                # Site navigation
    Footer.tsx                # Site footer
    Globe.tsx                 # Three.js revolving globe
    CategoryStrip.tsx         # Gold sector blocks
    JobFilters.tsx            # Career opportunities filter UI
  lib/
    supabase.ts               # Supabase client and types
    posts.ts                  # Data fetching (Supabase or placeholder)
    placeholder-data.ts       # Seed data for development
supabase/
  schema.sql                  # Database schema
```

## Content Management

Posts are managed through one unified table supporting both blog articles and job opportunities.

- **Blog posts**: `post_type = 'blog'`
- **Job listings**: `post_type = 'job'` with `job_category` and `location_region`

Use the admin page at `/admin` to create new posts, or insert directly via the Supabase dashboard.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add your environment variables in the Vercel project settings
4. Deploy

## Routes

| Path | Description |
|---|---|
| `/` | Landing page with globe and category strip |
| `/career-opportunities` | Filtered job listings |
| `/blog` | Blog article archive |
| `/blog/[slug]` | Individual post page |
| `/contact` | Contact information |
| `/admin` | Post creation form |
