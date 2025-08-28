# Feed Loading Component

This directory contains the `FeedLoading` component.

## `FeedLoading.tsx`

The `FeedLoading` component is responsible for displaying a loading state while articles are being fetched. It uses the `ArticleCardSkeleton` component to create a placeholder grid of article cards.

### Props

- **`count`**: `number` (optional) - The number of skeleton cards to display. Defaults to 6.

### Features

- Displays a responsive grid layout that adapts to different screen sizes:
  - Single column on mobile
  - Two columns on medium screens (md)
  - Three columns on large screens (lg)
- Uses skeleton loading cards to provide a smooth loading experience
- Maintains consistent spacing between skeleton cards

### Usage

```tsx
import { FeedLoading } from './FeedLoading';

// Default usage (6 skeleton cards)
<FeedLoading />

// Custom number of skeleton cards
<FeedLoading count={12} />
```