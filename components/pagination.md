# Pagination Component

This directory contains the `Pagination` component and a related helper function.

## `Pagination.tsx`

The `Pagination.tsx` file exports two main pieces of functionality:

1.  **`Pagination` component**: A UI component for navigating through paginated content.
2.  **`calculatePagination` function**: A helper function to calculate pagination-related values.

### `Pagination` Component

The `Pagination` component displays a set of page numbers and previous/next buttons to allow users to navigate through a list of items.

#### Props

- **`currentPage`**: `number` - The current active page.
- **`totalPages`**: `number` - The total number of pages.
- **`onPageChange`**: `(page: number) => void` - A callback function that is called when the user clicks on a page number or the previous/next buttons.
- **`className`**: `string` (optional) - Additional CSS classes to apply to the component.

#### Features

- **Dynamic Page Numbers**: The component intelligently displays a limited set of page numbers, using ellipses (`...`) to represent gaps in the page range.
- **Previous/Next Buttons**: Includes buttons to go to the previous and next pages, which are disabled when on the first or last page, respectively.
- **Styling**: The component is styled with a modern, dark theme and has distinct styles for the current page.

#### Usage

```tsx
import { Pagination } from './Pagination';

const [currentPage, setCurrentPage] = useState(1);
const totalPages = 10;

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
/>
```

### `calculatePagination` Function

This helper function calculates various values needed for pagination based on the total number of items, items per page, and the current page.

#### Parameters

- **`totalItems`**: `number` - The total number of items to be paginated.
- **`itemsPerPage`**: `number` - The number of items to display on each page.
- **`currentPage`**: `number` - The current active page.

#### Returns

An object with the following properties:

- **`totalPages`**: `number` - The total number of pages.
- **`startIndex`**: `number` - The starting index of the items for the current page.
- **`endIndex`**: `number` - The ending index of the items for the current page.
- **`hasNextPage`**: `boolean` - Whether there is a next page.
- **`hasPreviousPage`**: `boolean` - Whether there is a previous page.

#### Usage

```tsx
import { calculatePagination } from './Pagination';

const totalItems = 100;
const itemsPerPage = 10;
const currentPage = 5;

const paginationInfo = calculatePagination(totalItems, itemsPerPage, currentPage);

console.log(paginationInfo.totalPages); // 10
console.log(paginationInfo.startIndex); // 40
console.log(paginationInfo.endIndex);   // 50
```