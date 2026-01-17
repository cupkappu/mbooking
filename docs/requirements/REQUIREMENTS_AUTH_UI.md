# Authentication UI Requirements

**Module:** Authentication Interface (Sign In/Sign Out/Admin Access)
**References:** [PRD](../PRD.md), [Admin Requirements](../REQUIREMENTS_ADMIN.md), [Frontend AGENTS.md](../frontend/AGENTS.md)

---

## Overview

Authentication UI requirements for **Sign In/Sign Out buttons** and **role-based Admin access**.

**Key Distinction:**
- Landing Page (`/`) = Public marketing page → Sign In button
- Dashboard (`/dashboard`) = User app → User menu with Sign Out
- Admin Panel (`/admin`) = Admin-only → Protected by role

**Requires:** NextAuth.js session with role field extension

---

## 1. Sign In Button (Landing Page)

### 1.1 Location

**Header component:** `frontend/components/home/header.tsx`

### 1.2 Behavior

| State | Button Text | Action |
|-------|-------------|--------|
| Unauthenticated | "Sign In" | → `/login` |
| Authenticated | User avatar + dropdown | → Show menu |

### 1.3 Implementation

```tsx
// frontend/components/home/header.tsx
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Header({ isAuthenticated, userName }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold">
          Accounting
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">
            Features
          </Link>
          <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
        </nav>

        {/* Auth Actions */}
        {isAuthenticated ? (
          <UserMenu userName={userName} />
        ) : (
          <Link href="/login">
            <Button variant="default">Sign In</Button>
          </Link>
        )}
      </div>
    </header>
  );
}

function UserMenu({ userName }: { userName?: string | null }) {
  const { data: session } = useSession();

  const initials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 2. Sign Out Button (Dashboard)

### 2.1 Location

**Dashboard layout:** `frontend/app/(dashboard)/layout.tsx`

### 2.2 Current Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Accounting    [Dashboard] [Accounts] [Journal] [Reports]       │
│                           [Settings]                    [User ▼]│  ← Need: Sign Out
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Updated Layout with Sign Out

```tsx
// frontend/app/(dashboard)/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { QueryProvider } from '@/providers/query-provider';
import { SessionProvider } from '@/providers/session-provider';
import { UserMenu } from '@/components/layout/user-menu';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Accounts', href: '/accounts' },
  { name: 'Journal', href: '/journal' },
  { name: 'Reports', href: '/reports' },
  { name: 'Settings', href: '/settings' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SessionProvider>
      <QueryProvider>
        <div className="min-h-screen flex">
          {/* Sidebar */}
          <aside className="w-64 border-r bg-card">
            <div className="p-6">
 className="text-xl font-bold">              <h1Accounting</h1>
            </div>
            <nav className="px-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'block px-4 py-2 rounded-md text-sm font-medium',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <header className="h-16 border-b flex items-center justify-end px-8">
              <UserMenu />
            </header>
            <main className="flex-1 p-8">{children}</main>
          </div>
        </div>
      </QueryProvider>
    </SessionProvider>
  );
}
```

### 2.4 User Menu with Sign Out

```tsx
// frontend/components/layout/user-menu.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const isAdmin = (session.user as any).role === 'admin';
  const initials = session.user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">{session.user.email}</p>
            {isAdmin && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mt-1 inline-block w-fit">
                Admin
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/admin">Admin Panel</Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 3. Role-Based Admin Access

### 3.1 Admin Link Visibility

| Condition | Visibility | Location |
|-----------|------------|----------|
| `session.user.role === 'admin'` | Show "Admin Panel" link | User dropdown menu |
| `session.user.role !== 'admin'` | Hidden | N/A |

### 3.2 Admin Route Protection

**Frontend guard:** `frontend/middleware.ts`

```typescript
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin route protection
    if (path.startsWith('/admin')) {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/admin/:path*'],
};
```

### 3.3 Admin Redirect Flow

```
1. User navigates to /admin
2. Middleware checks session.role
3. If role === 'admin' → Allow access
4. If role !== 'admin' → Redirect to /dashboard
```

### 3.4 Visual Distinction

Admin users see badge in user menu:

```
┌──────────────────────┐
│  John Doe            │
│  john@example.com    │
│  [Admin]             │  ← Badge
├──────────────────────┤
│  👤 Profile          │
│  ⚙️ Settings         │
│  🔐 Admin Panel      │
├──────────────────────┤
│  🚪 Sign Out         │
└──────────────────────┘
```

---

## 4. Session Role Extension

### 4.1 Backend → Frontend Role Propagation

**Current state:** User entity has `role` field (default: 'user')

**Required:** Pass role to NextAuth session

```typescript
// frontend/lib/auth-options.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    // ... existing providers
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'user';  // ADD THIS
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;  // ADD THIS
      }
      return session;
    },
  },
};
```

### 4.2 Type Definition

```typescript
// frontend/types/next-auth.d.ts
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: 'admin' | 'user' | 'viewer';  // ADD THIS
    };
  }

  interface User {
    role?: 'admin' | 'user' | 'viewer';  // ADD THIS
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'admin' | 'user' | 'viewer';  // ADD THIS
  }
}
```

---

## 5. Component Structure

### 5.1 New Components

```
frontend/components/
├── home/
│   └── header.tsx                  # Landing page header (Sign In button)
│
└── layout/
    └── user-menu.tsx               # Dashboard user dropdown (Sign Out + Admin)
```

### 5.2 Modified Files

| File | Change |
|------|--------|
| `frontend/lib/auth-options.ts` | Add role to session callbacks |
| `frontend/types/next-auth.d.ts` | Add role type definitions |
| `frontend/middleware.ts` | Protect `/admin/*` routes |
| `frontend/app/(dashboard)/layout.tsx` | Add UserMenu to header |
| `frontend/app/(dashboard)/page.tsx` | (Update if needed) |

---

## 6. Implementation Priority

| Priority | Feature | Reason |
|----------|---------|--------|
| **P0** | Session role extension | Required for P1 |
| **P0** | UserMenu component | Core UX |
| **P0** | Sign Out button | User request |
| **P1** | Admin link in dropdown | User request |
| **P1** | Admin route protection | Security |
| **P2** | Admin badge in menu | Visual polish |

---

## 7. Cross-References

```
See also:
- [Admin Requirements - User Management](./REQUIREMENTS_ADMIN.md#user-management)
- [API - Auth endpoints](./REQUIREMENTS_API.md#authentication)
- [Landing Page Requirements](./REQUIREMENTS_LANDING_PAGE.md) - Sign In button on landing page
- [Frontend AGENTS.md - State Management](../frontend/AGENTS.md#state-management)
- [Frontend AGENTS.md - Component Pattern](../frontend/AGENTS.md#component-pattern)
```
