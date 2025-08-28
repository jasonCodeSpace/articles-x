# Input Component

This directory contains the `Input` component.

## `input.tsx`

The `input.tsx` file exports a styled `Input` component.

### Component

- **`Input`**: A customizable input field that can be used for various types of text-based user input.

### `InputProps`

The `Input` component accepts all standard HTML `input` attributes, allowing for full customization of its behavior and type. The props are inherited from `React.InputHTMLAttributes<HTMLInputElement>`.

### Usage

Here is a basic example of how to use the `Input` component:

```tsx
import { Input } from '@/components/ui/input';

function MyForm() {
  return (
    <div>
      <label htmlFor="email">Email</label>
      <Input type="email" id="email" placeholder="Enter your email" />
    </div>
  );
}
```

### Styling

The `Input` component comes with pre-defined styles for a consistent look and feel across the application. These styles include:

- A standard height, padding, and border.
- Focus states with a visible ring to enhance accessibility.
- Disabled states with reduced opacity and a not-allowed cursor.
- Placeholder text styling.

You can also pass a `className` prop to apply additional custom styles as needed.