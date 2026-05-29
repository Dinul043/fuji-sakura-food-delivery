# Fuji Sakura Food Delivery — Frontend

Next.js frontend for the Fuji Sakura food delivery platform.

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running (see backend repo)

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/Dinul043/fuji-sakura-food-delivery.git
cd fuji-sakura-food-delivery

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your backend URL and Razorpay key

# 4. Run development server
npm run dev
```

App starts at: `http://localhost:3000`

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── home/              # User home (restaurant listing)
│   ├── login/             # Auth (signin/signup/OTP)
│   ├── profile/           # User profile
│   ├── orders/            # Order history
│   ├── checkout/          # Checkout flow
│   ├── cart/              # Shopping cart
│   ├── restaurant/        # Restaurant module
│   │   ├── [id]/          # Restaurant detail + menu
│   │   ├── dashboard/     # Restaurant dashboard
│   │   ├── orders/        # Restaurant order management
│   │   ├── menu/          # Menu management
│   │   └── login/         # Restaurant auth
│   ├── delivery/          # Delivery partner module
│   │   ├── dashboard/     # Partner dashboard
│   │   ├── profile/       # Partner profile
│   │   └── login/         # Partner auth
│   └── admin/             # Admin module
│       ├── dashboard/     # Admin dashboard
│       ├── settings/      # Platform settings
│       └── payouts/       # Payout management
├── components/            # Reusable components
├── contexts/              # React contexts (Cart)
├── config/                # Constants, API config
├── hooks/                 # Custom hooks (WebSocket)
└── utils/                 # Helpers (auth)
```

## Tech Stack

- **Next.js 16** — React framework (App Router)
- **React 19** — UI library
- **TypeScript** — Type safety
- **Tailwind CSS** — Utility classes (configured)
- **Razorpay** — Payment gateway integration

## Modules

| Module | URL | Description |
|--------|-----|-------------|
| User | `/home` | Browse restaurants, order food |
| Restaurant | `/restaurant/dashboard` | Manage menu, orders, earnings |
| Delivery | `/delivery/dashboard` | Accept orders, track deliveries |
| Admin | `/admin/dashboard` | Approve partners, manage settings |
