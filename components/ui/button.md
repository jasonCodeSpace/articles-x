# Button Component

This directory contains the `Button` component.

## `button.tsx`

The `button.tsx` file exports a reusable `Button` component and `buttonVariants` for use in building a consistent UI.

### `Button` Component

The `Button` component is a customizable button element that can be styled with different variants and sizes.

#### Props

The `Button` component accepts the following props:

- **`variant`**: `string` (optional) - The visual style of the button. Defaults to `"default"`.
  - `"default"`: The default primary button style.
  - `"destructive"`: A button style for destructive actions.
  - `"outline"`: A button with an outline.
  - `"secondary"`: A secondary button style.
  - `"ghost"`: A button with no background or border.
  - `"link"`: A button that looks like a link.
- **`size`**: `string` (optional) - The size of the button. Defaults to `"default"`.
  - `"default"`: The default size.
  - `"sm"`: A small button.
  - `"lg"`: A large button.
  - `"icon"`: A button with a fixed size for an icon.
- **`asChild`**: `boolean` (optional) - If `true`, the component will render its child and pass the button props to it. This is useful for wrapping other components, such as a Next.js `<Link>`, with the button styles. Defaults to `false`.

It also accepts all standard `React.ButtonHTMLAttributes<HTMLButtonElement>`.

#### Usage

Here are some examples of how to use the `Button` component:

```tsx
import { Button } from '@/components/ui/button';

// Default button
<Button>Click me</Button>

// Destructive button
<Button variant="destructive">Delete</Button>

// Outline button, small size
<Button variant="outline" size="sm">Cancel</Button>

// As a child to a Link component
import Link from 'next/link';

<Button asChild>
  <Link href="/login">Login</Link>
</Button>
```

### `buttonVariants`

The `buttonVariants` object is also exported from this file. It is created using `class-variance-authority` and contains the definitions for all the button style variants. You can use this to apply the button styles to other components if needed.

#### Usage

```tsx
import { buttonVariants } from '@/components/ui/button';

const MyCustomButton = ({ className, ...props }) => (
  <button className={buttonVariants({ variant: 'secondary', size: 'lg', className })} {...props} />
);
```