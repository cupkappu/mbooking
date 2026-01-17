# Landing Page Requirements

**Module:** Marketing Landing Page
**References:** [PRD](../PRD.md), [Frontend AGENTS.md](../frontend/AGENTS.md)

---

## Overview

Public marketing landing page at `/` that showcases product value and converts visitors to sign up.

**Key Distinction:**
- `/` = Public landing page → marketing content for all visitors
- `/dashboard` = User dashboard → personal accounting (after login)

---

## 1. Page Location

| Path | File | Description |
|------|------|-------------|
| `/` | `frontend/app/page.tsx` | Public landing page |

**Remove existing redirect:**
```typescript
// BEFORE
export default function Home() {
  redirect('/dashboard');
}

// AFTER
export default function LandingPage() {
  // Landing page content
}
```

---

## 2. Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  Logo        Features    Pricing    About          [Sign In]   │  ← Top Navigation
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   💰 Multi-Currency                      │   │
│  │              Personal Accounting Software                │   │
│  │                                                             │   │
│  │    Beautiful, full-featured accounting with multi-        │   │
│  │    currency support and double-entry bookkeeping.         │   │
│  │                                                             │   │
│  │    [Get Started Free]        [Learn More ↓]               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ✨ Key Features                                          │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │   │
│  │  │ 📊 Double   │ │ 💱 Multi    │ │ 🌳 Hierarch │        │   │
│  │  │ Entry       │ │ Currency    │ │ ical        │        │   │
│  │  │ Bookkeeping │ │ Support     │ │ Accounts    │        │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │   │
│  │  │ 📈 Reports  │ │ 🔌 Plugin   │ │ 🔒 Self     │        │   │
│  │  │ & Budgets   │ │ System      │ │ Hosted      │        │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📸 Product Screenshots / Demo                           │   │
│  │  [Account Tree]  [Journal Entry]  [Balance Sheet]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🏷️ Pricing                                              │   │
│  │  ┌──────────────────┐ ┌──────────────────┐              │   │
│  │  │ Free             │ │ Pro              │              │   │
│  │  │ $0 / month       │ │ $5 / month       │              │   │
│  │  │ All features     │ │ Priority support │              │   │
│  │  │ Self-hosted      │ │ Cloud backup     │              │   │
│  │  │ [Choose]         │ │ [Choose]         │              │   │
│  │  └──────────────────┘ └──────────────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💬 Testimonials / Social Proof                          │   │
│  │  "Best multi-currency accounting tool I've used."        │   │
│  │  — John D., Freelancer                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📞 Contact / Footer                                     │   │
│  │  GitHub  |  Documentation  |  Support                    │   │
│  │  © 2024 Multi-Currency Accounting                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Sections Detail

### 3.1 Header (Top Navigation)

| Element | Content | Action |
|---------|---------|--------|
| **Logo** | "Accounting" or icon | → `/` |
| **Nav Links** | Features, Pricing, About | → `#features`, `#pricing`, `#about` |
| **CTA Button** | "Sign In" (if unauthenticated) | → `/login` |
| **User Menu** | (if authenticated) | → Dropdown to Dashboard / Sign Out |

### 3.2 Hero Section

| Element | Content |
|---------|---------|
| **Headline** | "Multi-Currency Personal Accounting Software" |
| **Subheadline** | "Beautiful, full-featured accounting with multi-currency support and double-entry bookkeeping." |
| **Primary CTA** | "Get Started Free" → `/login?signup=true` |
| **Secondary CTA** | "Learn More" → Scroll to Features |

### 3.3 Features Section

| Icon | Title | Description |
|------|-------|-------------|
| 📊 | Double-Entry Bookkeeping | Full support for five account categories (Assets, Liabilities, Equity, Revenue, Expense) |
| 💱 | Multi-Currency Support | Native support for multiple currencies with exchange rate tracking |
| 🌳 | Hierarchical Accounts | Unlimited nested account structure for organized finances |
| 📈 | Reports & Budgets | Balance sheet, income statement, and budget tracking |
| 🔌 | Plugin System | Extendable rate providers (JS plugins + REST API) |
| 🔒 | Self-Hosted | Your data, your control. Deploy anywhere. |

### 3.4 Screenshots Section

| Screenshot | Description |
|------------|-------------|
| Account Tree | Hierarchical account view with balance summary |
| Journal Entry | Double-entry transaction form |
| Balance Sheet | Financial statement generation |

**Note:** Use placeholder images initially, replace with actual screenshots.

### 3.5 Pricing Section

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0/month | All features, Self-hosted, Community support |
| **Pro** | $5/month | Priority support, Cloud backup, Auto-sync |

### 3.6 Testimonials Section

| Content | Author |
|---------|--------|
| "Best multi-currency accounting tool I've used." | John D., Freelancer |
| "Finally, a beautiful accounting app that handles my USD/HKD accounts." | Sarah L., Consultant |

### 3.7 Footer

| Link | Target |
|------|--------|
| GitHub | → GitHub repository URL |
| Documentation | → `/docs` or external docs |
| Support | → Contact email or issues URL |

---

## 4. Authenticated View

If user is logged in, show welcome message with quick actions:

```
┌─────────────────────────────────────────────────────────────┐
│  Logo        Features    Pricing    About    [Dashboard]   │  ← Authenticated user
│                                          [User ▼] [Sign Out]│
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  👋 Welcome back, {name}!                           │   │
│  │                                                     │   │
│  │  [Go to Dashboard]                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ... (rest of landing page unchanged)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation

### 5.1 Page Component

```tsx
// frontend/app/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { Header } from '@/components/home/header';
import { HeroSection } from '@/components/home/hero-section';
import { FeaturesSection } from '@/components/home/features-section';
import { ScreenshotsSection } from '@/components/home/screenshots-section';
import { PricingSection } from '@/components/home/pricing-section';
import { TestimonialsSection } from '@/components/home/testimonials-section';
import { Footer } from '@/components/home/footer';

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={!!session} userName={session?.user?.name} />
      <main>
        <HeroSection isAuthenticated={!!session} />
        <FeaturesSection />
        <ScreenshotsSection />
        <PricingSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
}
```

### 5.2 Component Structure

```
frontend/components/home/
├── header.tsx                  # Top navigation with auth state
├── hero-section.tsx            # Hero banner with CTAs
├── features-section.tsx        # 6 feature cards
├── screenshots-section.tsx     # Product screenshots
├── pricing-section.tsx         # Pricing tiers
├── testimonials-section.tsx    # User testimonials
└── footer.tsx                  # Footer with links
```

### 5.3 Props Interface

```typescript
// Header props
interface HeaderProps {
  isAuthenticated: boolean;
  userName?: string | null;
}

// Hero props
interface HeroProps {
  isAuthenticated: boolean;
}
```

---

## 6. Design Guidelines

### 6.1 Color Scheme

- **Primary:** Use theme's primary color (shadcn/ui)
- **Background:** `bg-background` (light/dark adaptive)
- **Accent:** `text-primary` for emphasis

### 6.2 Typography

- **Headline:** `text-4xl md:text-5xl font-bold`
- **Subheadline:** `text-lg text-muted-foreground`
- **Body:** `text-base`

### 6.3 Spacing

- **Section padding:** `py-16 md:py-24`
- **Container:** `max-w-7xl mx-auto px-4`

### 6.4 Responsive

- **Mobile:** Stack vertically, hamburger menu for nav
- **Tablet:** 2-column feature cards
- **Desktop:** Full layout as shown above

---

## 7. Implementation Priority

| Priority | Section | Reason |
|----------|---------|--------|
| **P0** | Header + Hero | First impression |
| **P0** | Features section | Core value proposition |
| **P1** | Footer + Links | Basic navigation |
| **P1** | Screenshots | Visual proof |
| **P2** | Pricing | Future monetization |
| **P2** | Testimonials | Social proof |
| **P2** | Authenticated view | Logged-in UX |

---

## 8. Cross-References

```
See also:
- [PRD - Product Vision](../PRD.md#11-product-vision)
- [Frontend AGENTS.md - Page Structure](../frontend/AGENTS.md#page-structure)
- [Auth UI Requirements](./REQUIREMENTS_AUTH_UI.md) - Sign In/Sign Out buttons
```
