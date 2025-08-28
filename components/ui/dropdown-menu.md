# Dropdown Menu Component

This directory contains the `DropdownMenu` component and its related parts, which are built on top of Radix UI's Dropdown Menu primitive.

## `dropdown-menu.tsx`

The `dropdown-menu.tsx` file exports a comprehensive set of components for building highly customizable and accessible dropdown menus.

### Core Components

- **`DropdownMenu`**: The root component that wraps the entire dropdown menu.
- **`DropdownMenuTrigger`**: The element that triggers the opening and closing of the dropdown menu.
- **`DropdownMenuContent`**: The container for the menu items that appears when the trigger is activated.

### Menu Item Components

- **`DropdownMenuItem`**: A standard item within the dropdown menu.
- **`DropdownMenuCheckboxItem`**: A menu item that can be checked or unchecked.
- **`DropdownMenuRadioGroup`**: A container for `DropdownMenuRadioItem` components, allowing for a single selection from a group.
- **`DropdownMenuRadioItem`**: A menu item that represents a single option in a radio group.

### Grouping and Structure

- **`DropdownMenuGroup`**: Used to group related menu items.
- **`DropdownMenuLabel`**: A non-interactive label for a group of items.
- **`DropdownMenuSeparator`**: A visual separator between menu items or groups.

### Submenus

- **`DropdownMenuSub`**: The root component for a submenu.
- **`DropdownMenuSubTrigger`**: The element within a menu that opens a submenu.
- **`DropdownMenuSubContent`**: The container for the submenu items.

### Utility Components

- **`DropdownMenuPortal`**: Renders the dropdown menu content into a React Portal, which is useful for breaking out of layout constraints.
- **`DropdownMenuShortcut`**: A component to display a keyboard shortcut associated with a menu item.

### Usage Example

Here is an example of how to use the various `DropdownMenu` components to create a feature-rich dropdown:

```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

function MyDropdownMenu() {
  const [showStatusBar, setShowStatusBar] = React.useState(true);
  const [position, setPosition] = React.useState("bottom");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={showStatusBar}
          onCheckedChange={setShowStatusBar}
        >
          Status Bar
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
          <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>More Tools</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Save Page As...</DropdownMenuItem>
              <DropdownMenuItem>Create Shortcut...</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```