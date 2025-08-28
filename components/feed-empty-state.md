# Feed Empty State Component

This directory contains the `FeedEmptyState` component.

## `FeedEmptyState.tsx`

The `FeedEmptyState` component is responsible for displaying various empty states within the article feed. It is designed to provide clear feedback to the user when there are no articles to display, when a search returns no results, or when an error occurs.

### Props

- **`type`**: `'no-articles' | 'no-results' | 'error'` - Specifies the type of empty state to display.
- **`searchQuery`**: `string` (optional) - The search query that resulted in no matches. Used when `type` is `'no-results'`.
- **`onRetry`**: `() => void` (optional) - A callback function to be executed when the user clicks the "Try Again" button. Used when `type` is `'error'`.
- **`onClearSearch`**: `() => void` (optional) - A callback function to be executed when the user clicks the "Clear Search" button. Used when `type` is `'no-results'`.

### States

The component renders different content based on the `type` prop:

- **`no-articles`**: Informs the user that no articles are available yet and that they will be imported from Twitter lists.
- **`no-results`**: Informs the user that their search or filter criteria did not match any articles. It can display the search query and provides a button to clear the search.
- **`error`**: Informs the user that an error occurred while loading the articles and provides a button to retry the action.

### Usage

```tsx
import { FeedEmptyState } from './FeedEmptyState';

// Example for "no-articles" state
<FeedEmptyState type="no-articles" />

// Example for "no-results" state
<FeedEmptyState type="no-results" searchQuery="React" onClearSearch={() => console.log('Search cleared')} />

// Example for "error" state
<FeedEmptyState type="error" onRetry={() => console.log('Retrying...')} />
```