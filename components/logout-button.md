# Logout Button Component

This directory contains the `LogoutButton` component.

## `LogoutButton.tsx`

The `LogoutButton` component provides a simple button to log out a user. When clicked, it signs the user out using Supabase authentication and redirects them to the login page.

### Features

- **User Logout**: Integrates with Supabase to sign the user out.
- **Redirect**: After a successful logout, it redirects the user to the `/login` page.
- **UI**: Uses the `Button` component for a consistent look and feel, and includes a `LogOut` icon.

### How It Works

1.  The user clicks the `LogoutButton`.
2.  The `handleLogout` function is called, which signs the user out using `supabase.auth.signOut()`.
3.  The user is then redirected to the `/login` page using Next.js's `useRouter`.
4.  `router.refresh()` is called to ensure the page is refreshed and the user's session is cleared.

### Usage

```tsx
import { LogoutButton } from './LogoutButton';

// Place this button in a part of the UI where a logged-in user can access it, such as a user profile dropdown or a navigation bar.
<LogoutButton />
```