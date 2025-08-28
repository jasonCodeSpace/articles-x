# Feed Toolbar Component

This directory contains the `FeedToolbar` component.

## `FeedToolbar.tsx`

The `FeedToolbar` component provides a toolbar for an article feed, allowing users to search, sort, and filter articles by category.

### Props

- **`onSearchChange`**: `(search: string) => void` - Callback function triggered when the search input changes.
- **`onSortChange`**: `(sort: SortOption) => void` - Callback function triggered when the sort option changes.
- **`onCategoryChange`**: `(category: string) => void` - Callback function triggered when the category filter changes.
- **`currentSort`**: `SortOption` - The currently active sort option.
- **`currentCategory`**: `string` - The currently selected category.
- **`searchValue`**: `string` - The current search value.
- **`categories`**: `string[]` (optional) - A list of available categories.
- **`isLoading`**: `boolean` (optional) - A flag to disable the toolbar controls while content is loading.

### Features

- **Search Input**: A search bar to filter articles by title. The search is debounced to avoid excessive requests while typing.
- **Category Filter**: A dropdown menu to filter articles by category. It includes an "All Categories" option.
- **Sort Options**: A dropdown menu to sort articles by "Newest First" or "Oldest First".
- **Loading State**: The toolbar controls can be disabled when the `isLoading` prop is true.
- **Responsive Design**: The toolbar adapts to different screen sizes, stacking controls on smaller screens.

### Usage

```tsx
import { FeedToolbar } from './FeedToolbar';
import { SortOption } from '@/lib/articles';

const [search, setSearch] = useState('');
const [sort, setSort] = useState<SortOption>('newest');
const [category, setCategory] = useState('all');
const categories = ['Technology', 'Business', 'Science'];

<FeedToolbar
  onSearchChange={setSearch}
  onSortChange={setSort}
  onCategoryChange={setCategory}
  currentSort={sort}
  currentCategory={category}
  searchValue={search}
  categories={categories}
  isLoading={false}
/>
```