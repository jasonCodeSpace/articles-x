# Card Component

This directory contains the `Card` component and its related parts.

## `card.tsx`

The `card.tsx` file exports a set of components for building card-based UI elements.

### Components

- **`Card`**: The main container for the card.
- **`CardHeader`**: A header section for the card.
- **`CardTitle`**: A title for the card, to be used within `CardHeader`.
- **`CardDescription`**: A description for the card, to be used within `CardHeader`.
- **`CardContent`**: The main content area of the card.
- **`CardFooter`**: A footer section for the card.

### Usage

Here is an example of how to use the `Card` components together:

```tsx
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';

function MyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the main content of the card.</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  );
}
```

### Component Details

- **`Card`**: The root `div` element for the card. It applies base styles like border, background color, and shadow.
- **`CardHeader`**: A `div` that provides padding and flexbox layout for the header content.
- **`CardTitle`**: An `h3` element for the card's title with appropriate font styling.
- **`CardDescription`**: A `p` element for the card's description with muted text styling.
- **`CardContent`**: A `div` for the main content of the card, with padding applied.
- **`CardFooter`**: A `div` for the footer content, with padding and flexbox layout.