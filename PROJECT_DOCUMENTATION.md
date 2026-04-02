# Fuji Sakura Food Delivery — Frontend Documentation

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Inline styles + globals.css (Tailwind installed but not used for components)
- **State:** React useState/useEffect (no Redux)
- **Real-time:** WebSocket (custom useWebSocket hook)
- **Payment:** Razorpay JS SDK

## Setup & Run
```bash
cd food-delivery-ui
npm install
# Configure .env.local (see below)
npm run dev
```
App runs at: `http://localhost:3000`

## Environment Variables (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
```

---

## Folder Structure
```
food-delivery-ui/
├── public/
│   └── icons/                     # SVG icons (actions, navigation, delivery, food, etc.)
└── src/
    ├── app/
    │   ├── page.tsx               # Splash screen (auto-redirects to /login)
    │   ├── globals.css            # Global styles, animations, CSS variables
    │   ├── layout.tsx             # Root layout
    │   │
    │   ├── login/page.tsx         # User login + signup + OTP + forgot password
    │   ├── home/page.tsx          # User home (restaurants list, search, filter, sort)
    │   ├── profile/page.tsx       # User profile (name, phone, address, photo, password)
    │   ├── cart/page.tsx          # Shopping cart
    │   ├── checkout/page.tsx      # Checkout (address, payment method)
    │   ├── order-success/page.tsx # Order placed success screen
    │   ├── orders/page.tsx        # User order history list
    │   ├── orders/[id]/page.tsx   # Order detail + tracking + review form
    │   │
    │   ├── restaurant/
    │   │   ├── page.tsx           # Restaurant landing (apply / login links)
    │   │   ├── [id]/page.tsx      # Public restaurant detail + menu + reviews
    │   │   ├── apply/page.tsx     # Restaurant application form
    │   │   ├── login/page.tsx     # Restaurant login
    │   │   ├── dashboard/page.tsx # Restaurant dashboard (stats, quick actions)
    │   │   ├── orders/page.tsx    # Restaurant orders management
    │   │   ├── menu/page.tsx      # Menu management (add/edit/delete items)
    │   │   ├── profile/page.tsx   # Restaurant profile management
    │   │   ├── reviews/page.tsx   # Customer reviews (real-time via WebSocket)
    │   │   └── analytics/page.tsx # Analytics (placeholder)
    │   │
    │   └── admin/
    │       ├── page.tsx           # Admin login
    │       └── dashboard/page.tsx # Admin dashboard (approve restaurants, manage admins)
    │
    ├── components/
    │   ├── AuthPopup.tsx          # Guest user auth prompt
    │   └── Icon.tsx               # SVG icon component
    │
    ├── contexts/
    │   └── CartContext.tsx        # Global cart state (add/remove/update/clear)
    │
    ├── hooks/
    │   └── useWebSocket.ts        # WebSocket hook (auto-reconnect, stable callback ref)
    │
    └── config/
        └── constants.ts           # API_BASE_URL, getFullImageUrl helper
```

---

## Key Pages & What They Do

### User Side
| Page | Route | Description |
|------|-------|-------------|
| Splash | / | 3s animation then redirect to /login |
| Login/Signup | /login | Full auth flow: signup → OTP → register name → login → forgot password |
| Home | /home | Restaurant cards, search, category filter, sort, location pill |
| Profile | /profile | Edit name, phone, address, upload photo, change password |
| Restaurant Detail | /restaurant/[id] | Menu by category, add to cart, customer reviews |
| Cart | /cart | View cart, update quantities, checkout |
| Checkout | /checkout | Delivery address (auto-filled from profile), COD or Razorpay |
| Order Success | /order-success | Confirmation screen after order placed |
| Orders List | /orders | All orders with status filter, reorder, review button |
| Order Detail | /orders/[id] | Tracking steps, order summary, review form (delivered orders) |

### Restaurant Side
| Page | Route | Description |
|------|-------|-------------|
| Landing | /restaurant | Links to apply and login |
| Apply | /restaurant/apply | Application form (name, cuisine, documents) |
| Login | /restaurant/login | Restaurant login (sessionStorage token) |
| Dashboard | /restaurant/dashboard | Stats (real data), quick actions, new order notifications |
| Orders | /restaurant/orders | Manage orders, update status, see special instructions |
| Menu | /restaurant/menu | Add/edit/delete menu items, toggle availability |
| Profile | /restaurant/profile | Update restaurant details, upload banner image |
| Reviews | /restaurant/reviews | All customer reviews with rating breakdown |

### Admin Side
| Page | Route | Description |
|------|-------|-------------|
| Login | /admin | Admin login |
| Dashboard | /admin/dashboard | Approve/reject restaurants, manage admin accounts |

---

## Important Patterns

### Token Storage
- **User:** `localStorage` — `token`, `userName`, `userProfileImage`
- **Restaurant:** `sessionStorage` — `restaurantToken`, `restaurantInfo` (tab-isolated, allows multiple sessions)
- **Admin:** `localStorage` — `adminToken`

### WebSocket Usage
- `useWebSocket(url, onMessage)` hook — stable callback via ref, auto-reconnects every 3s
- Restaurant orders page: `ws/restaurant-dashboard/{id}` — new order notifications
- Restaurant detail page: `ws/restaurant/{id}` — menu updates, online status
- Order tracking page: `ws/orders/{id}` — order status updates

### Cart Context
- Global cart state via `CartContext`
- Cart stored in DB (not localStorage) — synced on login
- `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`, `getTotalItems`, `getTotalPrice`

### Image URLs
- All uploaded images served from `http://localhost:8000/uploads/...`
- Use `getFullImageUrl(path)` from `config/constants.ts` to build full URL

---

## Completed Features
- [x] Full user auth flow (signup → OTP → login → forgot password)
- [x] User profile with photo upload
- [x] Home page (restaurants, search, category filter, sort, location from profile)
- [x] Restaurant detail page with menu and public reviews
- [x] Cart management (add, remove, update, clear)
- [x] Checkout with address auto-fill from profile
- [x] COD and Razorpay online payment
- [x] Order tracking with real-time WebSocket updates
- [x] Order history with status filter
- [x] Review system (submit on delivered orders, shown publicly)
- [x] Restaurant dashboard with real stats
- [x] Restaurant orders management with special instructions
- [x] Restaurant menu management
- [x] Restaurant reviews page (real-time)
- [x] Admin panel (restaurant approval, admin management)
- [x] Multiple restaurant sessions (sessionStorage)

---

## Next Steps (Pending)
1. **Delivery Partner module**
   - New pages: `/delivery/apply`, `/delivery/login`, `/delivery/dashboard`
   - Entry point on login page (alongside restaurant partner button)
   - Dashboard: available orders, accept order, mark delivered, earnings
2. **Mobile responsive UI**
   - Add media queries to globals.css
   - Use `max-width: 1400px` containers on all pages
   - Mobile breakpoints: 768px (tablet), 480px (mobile)
3. **Analytics page** (restaurant side — charts, revenue trends)
4. **Order cancellation** improvements (user side time window)
