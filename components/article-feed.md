# Article Feed Component

This directory contains the `ArticleFeed` component.

## `ArticleFeed.tsx`

The `ArticleFeed` component is a client-side component responsible for displaying a feed of articles. It utilizes the `useArticleFeed` hook to manage article state, including pagination, loading, and error handling.

### Props

- **`initialArticles`**: `Article[]` - An array of `Article` objects to be displayed initially.
- **`initialCategories`**: `string[]` - An array of strings representing the available categories for filtering.

### States

The component handles the following states:

- **Loading**: Displays the `FeedLoading` component while articles are being fetched.
- **No Results**: Displays a `FeedEmptyState` component with a "no-results" message when a search yields no articles.
- **No Articles**: Displays a `FeedEmptyState` component with a "no-articles" message when there are no initial articles to display.
- **Error**: Displays a `FeedEmptyState` component with an "error" message and a retry button when an error occurs during data fetching.
- **Success**: Renders a list of `ArticleCard` components for each article and a `Pagination` component for navigating through pages.

### Usage

```tsx
import { ArticleFeed } from './ArticleFeed';
import { Article } from '@/components/article-card';

const sampleArticles: Article[] = [
  {
    id: '1',
    title: 'Sample Article 1',
    slug: 'sample-article-1',
    author_name: 'John Doe',
    created_at: new Date().toISOString(),
    tags: ['sample', 'tag1'],
  },
  {
    id: '2',
    title: 'Sample Article 2',
    slug: 'sample-article-2',
    author_name: 'Jane Doe',
    created_at: new Date().toISOString(),
    tags: ['sample', 'tag2'],
  },
];

const sampleCategories: string[] = ['Technology', 'Science'];

<ArticleFeed initialArticles={sampleArticles} initialCategories={sampleCategories} />
```