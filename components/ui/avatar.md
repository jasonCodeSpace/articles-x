# Avatar Component

This directory contains the `Avatar` component and its related parts.

## `avatar.tsx`

The `avatar.tsx` file exports three components for displaying avatars:

1.  **`Avatar`**: The main container for the avatar.
2.  **`AvatarImage`**: The image to be displayed within the avatar.
3.  **`AvatarFallback`**: A fallback to be displayed if the image is not available or is still loading.

These components are built on top of Radix UI's `react-avatar` and are styled using Tailwind CSS.

### `Avatar`

This is the root component that should wrap `AvatarImage` and `AvatarFallback`.

#### Props

It accepts all props that the Radix UI `Avatar.Root` component accepts.

### `AvatarImage`

This component is used to display the avatar's image.

#### Props

It accepts all props that the Radix UI `Avatar.Image` component accepts, such as `src` for the image URL.

### `AvatarFallback`

This component is displayed as a fallback when the `AvatarImage` is loading or has failed to load. It's common to display the user's initials inside this component.

#### Props

It accepts all props that the Radix UI `Avatar.Fallback` component accepts.

### Usage

Here is an example of how to use the `Avatar` components:

```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

function UserProfile() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  );
}
```

In this example:

- The `Avatar` component acts as a container.
- The `AvatarImage` component attempts to load the image from the provided `src`.
- If the image fails to load, the `AvatarFallback` component will be displayed with the text "CN".