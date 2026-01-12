# Food Delivery UI - Folder Structure Guide

## 📁 Complete Directory Breakdown

```
food-delivery-ui/
├── 📄 .gitignore                    # Git ignore patterns
├── 📄 .next/                       # Next.js build output (auto-generated)
├── 📄 components.json               # Shadcn/ui configuration
├── 📄 CART_INTEGRATION_TEST.md    # Cart functionality test results
├── 📄 eslint.config.mjs            # ESLint configuration
├── 📄 FOLDER_STRUCTURE.md          # This file - folder documentation
├── 📄 next-env.d.ts               # Next.js TypeScript declarations
├── 📄 next.config.ts              # Next.js configuration
├── 📄 node_modules/               # Dependencies (auto-generated)
├── 📄 package-lock.json           # Dependency lock file
├── 📄 package.json                # Project dependencies & scripts
├── 📄 postcss.config.mjs          # PostCSS configuration
├── 📄 PROJECT_STRUCTURE.md        # Comprehensive project documentation
├── 📄 README.md                   # Basic project information
├── 📄 tailwind.config.ts          # Tailwind CSS configuration
├── 📄 tsconfig.json               # TypeScript configuration
├── 📁 public/                     # Static assets (cleaned - no unused files)
├── 📁 src/                        # Source code
    ├── 📁 app/                    # Next.js App Router
    │   ├── 📄 favicon.ico         # App favicon
    │   ├── 📄 globals.css         # Global styles & theme system
    │   ├── 📄 layout.tsx          # Root layout with CartProvider
    │   ├── 📄 page.tsx            # Landing/splash page
    │   ├── 📁 forgot-password/    # Password reset route
    │   │   └── 📄 page.tsx        # 4-step password reset flow
    │   ├── 📁 home/               # Home page route
    │   │   └── 📄 page.tsx        # Main home page with restaurant grid & global cart
    │   ├── 📁 login/              # Authentication route
    │   │   └── 📄 page.tsx        # Login/signup page with Shadcn buttons
    │   └── 📁 restaurant/         # Restaurant detail routes
    │       └── 📁 [id]/           # Dynamic restaurant ID route
    │           └── 📄 page.tsx    # Restaurant detail page with menu & cart
    ├── 📁 components/             # Reusable React components
    │   ├── 📄 README.md           # Component organization guide
    │   └── 📁 ui/                 # Shadcn UI components
    │       ├── 📄 button.tsx      # Universal Button component
    │       ├── 📄 card.tsx        # Universal Card component
    │       ├── 📄 input.tsx       # Universal Input component
    │       └── 📄 label.tsx       # Universal Label component
    ├── 📁 contexts/               # React Context providers
    │   └── 📄 CartContext.tsx     # Global cart state management
    ├── 📁 data/                   # Mock data & API structures
    │   └── 📄 restaurants.ts      # Restaurant data (55+ entries)
    ├── 📁 hooks/                  # Custom React hooks
    │   └── 📄 README.md           # Hooks organization guide
    ├── 📁 lib/                    # Utility libraries
    │   ├── 📄 README.md           # Lib organization guide
    │   └── 📄 utils.ts            # Shadcn utility functions (cn)
    ├── 📁 types/                  # TypeScript type definitions
    │   └── 📄 README.md           # Types organization guide
    └── 📁 utils/                  # Additional utilities
        └── 📄 README.md           # Utils organization guide
```

## 📋 File Purposes & Responsibilities

### 🏗️ Configuration Files

| File | Purpose | Status |
|------|---------|--------|
| `package.json` | Dependencies, scripts, project metadata | ✅ Active |
| `tsconfig.json` | TypeScript compiler configuration | ✅ Active |
| `tailwind.config.ts` | Tailwind CSS customization | ✅ Active |
| `next.config.ts` | Next.js framework configuration | ✅ Active |
| `eslint.config.mjs` | Code linting rules | ✅ Active |
| `components.json` | Shadcn/ui component configuration | ✅ Active |
| `postcss.config.mjs` | CSS processing configuration | ✅ Active |

### 🎨 Styling & Assets

| File/Folder | Purpose | Status |
|-------------|---------|--------|
| `src/app/globals.css` | Universal theme, animations, CSS variables | ✅ Active |
| `public/` | Static assets (SVGs, images) | ✅ Active |
| `src/app/favicon.ico` | Application icon | ✅ Active |

### 🧩 Components Architecture

| File/Folder | Purpose | Status |
|-------------|---------|--------|
| `src/components/RestaurantCard.tsx` | Restaurant card component using Shadcn/ui | ✅ Active |
| `src/components/ui/card.tsx` | Base Shadcn/ui Card component | ✅ Active |
| `src/components/ui/` | Future Shadcn/ui components | 📋 Ready for expansion |

### 🗂️ Data Management

| File | Purpose | Status |
|------|---------|--------|
| `src/data/restaurants.ts` | 55+ mock restaurants with full details | ✅ Active |
| `src/data/menuItems.ts` | Menu items for all restaurants (API-ready) | ✅ Active |

### 🛠️ Utilities & Libraries

| File/Folder | Purpose | Status |
|-------------|---------|--------|
| `src/lib/utils.ts` | Helper functions (cn for class merging) | ✅ Active |
| `src/hooks/` | Custom React hooks | 📋 Empty (future use) |
| `src/types/` | TypeScript type definitions | 📋 Empty (future use) |
| `src/utils/` | Additional utility functions | 📋 Empty (future use) |

### 🚀 Application Routes

| Route | File | Purpose | Status |
|-------|------|---------|--------|
| `/` | `src/app/page.tsx` | Landing/splash page | ✅ Active |
| `/login` | `src/app/login/page.tsx` | Authentication (login/signup) | ✅ Active |
| `/forgot-password` | `src/app/forgot-password/page.tsx` | 4-step password reset flow | ✅ Active |
| `/home` | `src/app/home/page.tsx` | Main restaurant grid with global cart | ✅ Active |
| `/restaurant/[id]` | `src/app/restaurant/[id]/page.tsx` | Restaurant detail with menu & cart | ✅ Active |

## 🎯 Folder Organization Principles

### 📁 App Router Structure
- **Route-based**: Each folder in `src/app/` represents a URL route
- **Nested Routes**: Folders can contain subfolders for nested URLs
- **Dynamic Routes**: `[id]` folders create dynamic route parameters
- **Special Files**: `page.tsx`, `layout.tsx`, `loading.tsx` have special meanings

### 🧩 Component Organization
- **Reusable Components**: `src/components/` for shared UI elements
- **UI Library**: `src/components/ui/` for Shadcn/ui base components
- **Feature Components**: Components specific to routes stay in route folders

### 📊 Data Architecture
- **Mock Data**: `src/data/` contains training/development data
- **Global State**: `src/contexts/` for React Context providers
- **API Ready**: Data structures match expected API responses
- **Type Safety**: All data has TypeScript interfaces
- **Persistence**: Cart state persists via localStorage

### 🔧 Utility Organization
- **Core Utils**: `src/lib/` for essential helper functions
- **Custom Hooks**: `src/hooks/` for reusable React logic
- **Type Definitions**: `src/types/` for shared TypeScript types

## 📈 Scalability Considerations

### 🔄 Future Expansion Areas

#### Components (`src/components/`)
```
src/components/
├── ui/                    # Shadcn/ui components
│   ├── card.tsx          ✅ Implemented
│   ├── button.tsx        📋 Future
│   ├── input.tsx         📋 Future
│   └── modal.tsx         📋 Future
├── layout/               📋 Future
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Sidebar.tsx
├── forms/                📋 Future
│   ├── LoginForm.tsx
│   ├── CheckoutForm.tsx
│   └── ReviewForm.tsx
└── features/             📋 Future
    ├── Cart/
    ├── Search/
    └── Filters/
```

#### Data Management (`src/data/`)
```
src/data/
├── restaurants.ts        ✅ Implemented
├── menuItems.ts          ✅ Implemented
├── users.ts              📋 Future
├── orders.ts             📋 Future
└── categories.ts         📋 Future
```

#### API Integration (`src/api/` - Future)
```
src/api/
├── restaurants.ts        📋 Future
├── auth.ts               📋 Future
├── orders.ts             📋 Future
└── payments.ts           📋 Future
```

## 🔍 File Naming Conventions

### 📝 Naming Rules
- **Components**: PascalCase (`RestaurantCard.tsx`)
- **Pages**: lowercase (`page.tsx`)
- **Utilities**: camelCase (`utils.ts`)
- **Data Files**: camelCase (`menuItems.ts`)
- **Folders**: lowercase or kebab-case (`restaurant/`, `[id]/`)

### 📂 Folder Conventions
- **Route Folders**: Match URL structure exactly
- **Component Folders**: Group related components
- **Feature Folders**: Organize by application feature
- **Utility Folders**: Group by function type

## 🚦 Development Guidelines

### ✅ Best Practices
1. **Keep components small** - Single responsibility principle
2. **Use TypeScript** - All files should have proper typing
3. **Follow folder structure** - Don't create files outside the established pattern
4. **Reuse components** - Check existing components before creating new ones
5. **Document changes** - Update this file when adding new folders/files

### ❌ Avoid These Patterns
1. **Deep nesting** - Keep folder depth reasonable (max 4-5 levels)
2. **Mixed concerns** - Don't mix data, components, and utilities in same folder
3. **Duplicate components** - Reuse existing components instead
4. **Inconsistent naming** - Follow established naming conventions
5. **Orphaned files** - Remove unused files regularly

---

## 📞 Maintenance Notes

**Last Updated**: January 9, 2026  
**Version**: 1.8.0  
**Total Files**: 25+ active files  
**Total Folders**: 15+ organized folders  

This structure supports the current training phase with mock data and is ready for production API integration without major restructuring.