# Fuji Sakura — UI Design Guide
> This document defines the complete UI/UX system for the Fuji Sakura food delivery platform.
> All developers working on this project must follow these rules strictly.

---

## 1. Design Principles

| Rule | Detail |
|------|--------|
| No emojis in UI | Use SVG icons only (Heroicons) |
| No inline CSS | Use Tailwind classes only |
| No random colors | Use design tokens only |
| Component-first | Every UI element is a reusable component |
| Accessible | Min 44x44 touch targets, AA contrast, keyboard support |
| Responsive | Mobile-first, tested on 375px, 768px, 1024px, 1280px |

---

## 2. Color System (Design Tokens)

Defined in `tailwind.config.ts` under `theme.extend.colors`:

```js
fuji: {
  charcoal:   '#18181B',   // Primary text, dark backgrounds
  sakura:     '#E85D8E',   // CTA buttons, active states, accents
  'warm-white': '#FAF8F5', // Page background
  'soft-gray':  '#ECECEC', // Card backgrounds, borders, dividers
  success:    '#22C55E',
  warning:    '#F59E0B',
  error:      '#EF4444',
  overlay:    'rgba(24,24,27,0.6)', // Dark overlay for modals/video
}
```

**Never use:**
- The old orange `#FF5722` (that was Swiggy-style)
- Random hex codes not in this list
- Tailwind default colors (gray-500, red-400 etc.) — use fuji tokens

---

## 3. Typography

**Fonts loaded in `layout.tsx`:**
- **Plus Jakarta Sans** → All headings (H1, H2, H3)
- **Inter** → All body text, labels, captions

**Scale:**

| Tag | Size | Weight | Font |
|-----|------|--------|------|
| H1 | 40–48px | 800 | Plus Jakarta Sans |
| H2 | 28–32px | 700 | Plus Jakarta Sans |
| H3 | 20–24px | 600 | Plus Jakarta Sans |
| Body | 16–18px | 400 | Inter |
| Label | 14px | 500 | Inter |
| Caption | 12px | 400 | Inter |
| Numbers | Any | 600 | Inter |

**Rules:**
- Never use more than 2 fonts
- Minimum text contrast: AA (4.5:1 for normal text)
- Never tiny text below 12px

---

## 4. Component Library

All components live in `src/components/ui/`

### Button
```tsx
<Button variant="primary" size="md">Order Now</Button>
// variants: primary | secondary | ghost | danger
// sizes: sm | md | lg
```

### Card
```tsx
<Card className="rounded-3xl shadow-sm hover:shadow-md">
  {children}
</Card>
```

### Input
```tsx
<Input placeholder="Search restaurants..." icon={<SearchIcon />} />
```

### Badge
```tsx
<Badge variant="success">Open</Badge>
<Badge variant="warning">Busy</Badge>
```

### Skeleton
```tsx
<Skeleton className="h-48 w-full rounded-3xl" />
```

### Modal
```tsx
<Modal isOpen={open} onClose={close} title="Confirm Order">
  {children}
</Modal>
```

---

## 5. Page Layouts

### 5.1 User Module — Home Page

```
HEADER
  [Fuji Sakura Logo]  [Location Detector]  ─────  [Search]  [Cart Icon]  [Profile Icon]

HERO SECTION (desktop: split 50/50)
  LEFT:
    "Authentic food,         RIGHT:
    delivered fast"            [6-8 second looping video]
                               ramen being poured / sushi plated
    [Location CTA]             muted, autoplay, lazy-loaded
    [Search Input]             Mobile fallback: high quality food image
    [Find Food →]

OFFER BANNERS (carousel)
  Auto-rotating 3 banners — 4 second interval
  "Free delivery on first order"
  "Weekend special — 20% off"
  "New restaurants near you"

CATEGORIES (horizontal scroll, no scrollbar visible)
  [Japanese]  [Indian]  [Chinese]  [Italian]  [Desserts]  [Beverages]

RESTAURANT CARDS GRID
  Desktop: 4 columns | Tablet: 2 columns | Mobile: 1 column
  Each card:
    ┌─────────────────┐
    │   [IMAGE 16:9]  │
    │  Restaurant Name│
    │  Cuisine type   │
    │  2.3km • ★ 4.2 │
    │  25-30 min      │
    └─────────────────┘
    rounded-3xl, soft shadow, hover: translateY(-4px) shadow-lg
    Skeleton loading state
```

### 5.2 User Module — Pages

| Page | Layout |
|------|--------|
| Login/Signup | Centered card, clean white, no header |
| Restaurant Detail | Full-width image hero, sticky header |
| Cart | Split: items left, summary right (desktop) |
| Checkout | Multi-step with progress indicator |
| Orders | Card list with status timeline |
| Profile | Sidebar layout |

### 5.3 Restaurant Module

| Page | Banner | Layout |
|------|--------|--------|
| Dashboard | Earnings insight banner | Stats grid + order feed |
| Orders | — | Kanban-style or list |
| Menu | — | Grid with add/edit |
| Earnings | Payout summary banner | Charts + table |
| Profile | — | Form layout |

### 5.4 Delivery Module

| Page | Banner | Layout |
|------|--------|--------|
| Dashboard | Performance banner (weekly deliveries) | Toggle online, order card |
| Earnings | Weekly summary banner | Stats + history |
| Settle COD | — | Settlement card + progress |
| Profile | — | Form layout |

### 5.5 Admin Module

| Page | Banner | Layout |
|------|--------|--------|
| Dashboard | KPI insight banner | 4-col stats, tables, tabs |
| Settings | Config summary | Form with save buttons |
| Payouts | — | Table with actions |

---

## 6. Motion System (Framer Motion)

**Use motion for:**

| Element | Animation |
|---------|-----------|
| Page transition | fade + slideY (100ms) |
| Cards | hover: scale 1.02, shadow |
| Modals / Drawers | smooth expand from bottom/side |
| Buttons | subtle scale on press |
| Banners carousel | smooth slide |
| Skeleton → content | fade in |

**Never use:**
- Bouncing animations
- Rotation on main UI elements
- Blur transitions
- Animations longer than 300ms for interactions

---

## 7. Icons

**Library:** `@heroicons/react` (MIT license, SVG-based)

```tsx
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'
```

**Rules:**
- Outline icons for navigation, actions
- Solid icons for active states, ratings
- Size: 20px for inline, 24px for buttons, 28px for standalone
- Always `aria-hidden="true"` with visible text label

---

## 8. Responsive Breakpoints

```
sm:  640px   → Large phones, small tablets
md:  768px   → Tablets
lg:  1024px  → Small laptops
xl:  1280px  → Desktops
2xl: 1536px  → Large desktops
```

**Mobile-first rules:**
- Write base styles for mobile
- Add `md:`, `lg:` prefixes for larger screens
- Mobile: bottom navigation bar
- Tablet: 2-column layouts
- Desktop: sidebar + multi-column

---

## 9. Folder Structure

```
src/
├── components/
│   ├── ui/                    ← Design system primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Toast.tsx
│   │   ├── Tabs.tsx
│   │   └── Table.tsx
│   ├── layout/                ← Page structure components
│   │   ├── Header.tsx
│   │   ├── MobileNav.tsx
│   │   ├── Container.tsx
│   │   └── PageWrapper.tsx
│   └── features/              ← Feature-specific components
│       ├── user/
│       │   ├── RestaurantCard.tsx
│       │   ├── OfferBanner.tsx
│       │   ├── CategoryPill.tsx
│       │   └── HeroSection.tsx
│       ├── restaurant/
│       │   ├── OrderCard.tsx
│       │   └── MenuItemCard.tsx
│       ├── delivery/
│       │   └── AvailableOrderCard.tsx
│       └── admin/
│           └── StatCard.tsx
├── styles/
│   └── globals.css            ← Font imports, base styles
├── hooks/
│   └── useWebSocket.ts
├── contexts/
│   └── CartContext.tsx
├── utils/
│   └── authHelper.ts
└── config/
    └── constants.ts
```

---

## 10. Execution Order

Build in this exact order. Do NOT skip steps.

| Step | Task | Status |
|------|------|--------|
| 1 | Install Framer Motion + Heroicons | ☐ |
| 2 | Update tailwind.config.ts with design tokens | ☐ |
| 3 | Add Plus Jakarta Sans + Inter fonts | ☐ |
| 4 | Build: Button, Card, Input, Badge, Skeleton | ☐ |
| 5 | Build: Header component | ☐ |
| 6 | Build: HeroSection component (video + text) | ☐ |
| 7 | Build: OfferBanner carousel | ☐ |
| 8 | Build: CategoryPill horizontal scroll | ☐ |
| 9 | Build: RestaurantCard (new design) | ☐ |
| 10 | Assemble Home page | ☐ |
| 11 | Make Home page responsive | ☐ |
| 12 | Restaurant module pages | ☐ |
| 13 | Delivery module pages | ☐ |
| 14 | Admin module pages | ☐ |
| 15 | Login/Signup pages (last) | ☐ |
| 16 | Final responsive testing | ☐ |
| 17 | Motion polish | ☐ |

---

## 11. What NOT to Do

- No inline `style={{}}` — use Tailwind classes
- No emojis — use Heroicons SVGs
- No `#FF5722` orange — use sakura `#E85D8E`
- No copy-paste from Swiggy/Zomato
- No heavy autoplay video on mobile — use image fallback
- No animation longer than 300ms for user interactions
- No text below 12px
- No button without minimum 44x44 touch target
