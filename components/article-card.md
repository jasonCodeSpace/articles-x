# Article Card Component

This directory contains the `ArticleCard` component and its corresponding skeleton loader.

## `ArticleCard.tsx`

### `Article` Interface

This interface defines the shape of an article object used by the `ArticleCard` component.

- **`id`**: `string` - The unique identifier for the article.
- **`title`**: `string` - The title of the article.
- **`slug`**: `string` - The URL-friendly slug for the article.
- **`content`**: `string` (optional) - The full content of the article.
- **`excerpt`**: `string` (optional) - A short summary of the article.
- **`description`**: `string` (optional) - A brief description of the article.
- **`author_name`**: `string` - The name of the article's author.
- **`author_handle`**: `string` (optional) - The author's social media handle.
- **`author_profile_image`**: `string` (optional) - The URL for the author's profile image.
- **`author_avatar`**: `string` (optional) - An alternative URL for the author's avatar.
- **`featured_image_url`**: `string` (optional) - The URL for the article's featured image.
- **`image`**: `string` (optional) - An alternative URL for the article's image.
- **`published_at`**: `string` (optional) - The publication date of the article.
- **`created_at`**: `string` - The creation date of the article.
- **`tags`**: `string[]` - An array of tags associated with the article.
- **`category`**: `string` (optional) - The category of the article.
- **`article_url`**: `string` (optional) - The direct URL to the article.

### `ArticleCard` Component

This component displays a single article in a card format.

**Props**:

- **`article`**: `Article` - The article object to display.
- **`className`**: `string` (optional) - Additional CSS classes to apply to the component.

**Usage**:

```tsx
import { ArticleCard, Article } from './ArticleCard';

const sampleArticle: Article = {
  id: '1',
  title: 'Sample Article',
  slug: 'sample-article',
  author_name: 'John Doe',
  created_at: new Date().toISOString(),
  tags: ['sample', 'tag'],
};

<ArticleCard article={sampleArticle} />
```

### `ArticleCardSkeleton` Component

This component displays a skeleton loader, which is a placeholder that mimics the layout of the `ArticleCard` while the data is being fetched.

**Props**:

- **`className`**: `string` (optional) - Additional CSS classes to apply to the component.

**Usage**:

```tsx
import { ArticleCardSkeleton } from './ArticleCard';

<ArticleCardSkeleton />
```