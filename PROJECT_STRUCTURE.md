# Fuji Sakura Food Delivery - Frontend Project Structure

## 🏗️ Architecture Overview
Next.js 16 application with TypeScript, Tailwind CSS, and shadcn/ui components. Features complete authentication flow integrated with FastAPI backend.

## 📁 Clean Project Structure

```
food-delivery-ui/
├── public/
│   └── images/
│       ├── auth/          # Authentication page images
│       └── logo/          # Brand logo assets
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── cart/          # Shopping cart page
│   │   ├── checkout/      # Checkout flow
│   │   ├── forgot-password/ # Password reset
│   │   ├── home/          # Main dashboard
│   │   ├── login/         # Authentication (Sign in/Sign up)
│   │   ├── order-success/ # Order confirmation
│   │   ├── orders/        # Order history & tracking
│   │   ├── restaurant/    # Restaurant details & menu
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Landing page
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── label.tsx
│   │   └── AuthPopup.tsx  # Guest user authentication prompt
│   ├── contexts/
│   │   └── CartContext.tsx # Shopping cart state management
│   ├── data/
│   │   └── restaurants.ts  # Mock restaurant data
│   └── lib/
│       ├── api.ts         # API utilities
│       └── utils.ts       # Utility functions
├── .gitignore             # Git ignore rules (includes IDE settings)
├── components.json        # shadcn/ui configuration
├── next.config.ts         # Next.js configuration
├── package.json           # Dependencies & scripts
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
├── PROJECT_STRUCTURE.md   # This documentation
├── README.md              # Project overview
└── UI_REPLACEMENT_GUIDE.md # UI customization guide
```

## 🔧 Core Features

### ✅ **Authentication System**
- **Complete signup flow**: Email → OTP → Details → Login
- **Backend integration**: Real API calls to FastAPI server
- **Email verification**: 4-digit OTP via Mailtrap
- **Form validation**: Client-side and server-side validation
- **Error handling**: User-friendly error messages
- **Guest mode**: Continue without account (limited features)

### ✅ **Shopping Experience**
- **Restaurant browsing**: Grid layout with search/filter
- **Menu system**: Categories, items, customization
- **Cart management**: Add/remove items, quantity control
- **Checkout flow**: Address, payment, order confirmation
- **Order tracking**: Status updates and history

### ✅ **UI/UX Design**
- **Japanese theme**: Fuji Sakura branding
- **Responsive design**: Mobile-first approach
- **Modern components**: shadcn/ui component library
- **Smooth animations**: Tailwind CSS transitions
- **Accessibility**: ARIA labels and keyboard navigation

## 🚀 Development

### **Scripts**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### **Key Dependencies**
- **Next.js 16**: React framework with App Router
- **TypeScript**: Type safety and better DX
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern component library
- **React Context**: State management for cart

## 🔗 **Backend Integration**

### **API Endpoints Used**
- `POST /api/auth/signup` - User registration
- `POST /api/auth/verify-otp` - Email verification
- `PUT /api/auth/update-user-details` - Complete registration
- `POST /api/auth/resend-otp` - Resend verification code

### **Authentication Flow**
1. **Email Entry** → Creates user + sends OTP
2. **OTP Verification** → Activates account
3. **Details Completion** → Updates user info
4. **Login Success** → Redirects to dashboard

## 📱 **Pages & Routes**

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `page.tsx` | Landing page |
| `/login` | `login/page.tsx` | Sign in/Sign up |
| `/home` | `home/page.tsx` | Restaurant dashboard |
| `/restaurant/[id]` | `restaurant/[id]/page.tsx` | Menu & ordering |
| `/cart` | `cart/page.tsx` | Shopping cart |
| `/checkout` | `checkout/page.tsx` | Order placement |
| `/orders` | `orders/page.tsx` | Order history |
| `/orders/[id]` | `orders/[id]/page.tsx` | Order details |
| `/order-success` | `order-success/page.tsx` | Confirmation |
| `/forgot-password` | `forgot-password/page.tsx` | Password reset |

## 🎨 **Styling & Theming**

### **Color Scheme**
- **Primary**: Orange (#F15D31) - Fuji Sakura brand
- **Background**: Warm cream (#FFF7EE)
- **Text**: Dark gray (#1a1a1a)
- **Accent**: Light orange variants

### **Typography**
- **Primary Font**: Anuphan (Google Fonts)
- **Fallback**: System fonts (system-ui, sans-serif)

### **Components**
- **Cards**: Rounded corners, subtle shadows
- **Buttons**: Consistent sizing, hover effects
- **Forms**: Clean inputs with validation states
- **Navigation**: Intuitive layout with breadcrumbs

## 🧹 **Cleaned Structure**

### **Removed Files**
- ❌ `NEW_LOGIN_SUMMARY.md` - Development documentation
- ❌ `GITHUB_SETUP.md` - Setup guide
- ❌ `IMAGE_REPLACEMENT_INSTRUCTIONS.md` - Development guide
- ❌ `.vscode/` - IDE-specific settings

### **Benefits**
- **Cleaner repository**: Only essential files
- **Better maintainability**: Clear structure
- **Team-friendly**: No IDE-specific configurations
- **Production-ready**: Optimized for deployment

---

**Status**: Production-ready frontend with complete authentication integration  
**Last Updated**: January 21, 2026  
**Next Phase**: Restaurant management features