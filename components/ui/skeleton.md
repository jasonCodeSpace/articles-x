# Skeleton Component

This directory contains the `Skeleton` component.

## `skeleton.tsx`

The `skeleton.tsx` file exports a `Skeleton` component that can be used to create placeholder loading animations.

### Component

- **`Skeleton`**: A simple, animated placeholder component that indicates a loading state.

### `SkeletonProps`

The `Skeleton` component accepts all standard HTML `div` attributes, allowing for full customization of its style and layout. The props are inherited from `React.HTMLAttributes<HTMLDivElement>`.

### Usage

Here is an example of how to use the `Skeleton` component to build a loading state for a card:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

function LoadingCard() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] w-[250px] rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}
```

### Styling

The `Skeleton` component has a default pulsing animation and a muted background color. You can customize its appearance by passing a `className` prop to adjust its size, shape, and other visual properties.