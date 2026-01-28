# Fuji Sakura Food Delivery - Frontend Project Structure

## 🏗️ Architecture Overview
Next.js 16 application with TypeScript, Tailwind CSS, and role-based authentication system. Features complete customer authentication and restaurant partnership application flow integrated with FastAPI backend.

## 📁 Clean Project Structure

```
food-delivery-ui/
├── public/
│   └── images/
│       ├── auth/          # Authentication page images
│       └── logo/          # Brand logo assets
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── admin/         # Super Admin Portal
│   │   │   └── page.tsx   # Admin login (role-based)
│   │   ├── cart/          # Shopping cart page
│   │   ├── checkout/      # Checkout flow
│   │   ├── forgot-password/ # Password reset
│   │   ├── home/          # Main dashboard
│   │   ├── login/         # Customer authentication (Sign in/Sign up)
│   │   ├── order-success/ # Order confirmation
│   │   ├── orders/        # Order history & tracking
│   │   ├── restaurant/    # Restaurant system
│   │   │   ├── [id]/      # Restaurant details & menu
│   │   │   └── apply/     # Restaurant partnership application
│   │   │       └── page.tsx # 3-step application form
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
│   │   └── restaurants.ts  # Mock restaurant data (55+ restaurants)
│   └── lib/
│       ├── api.ts         # API utilities
│       ├── auth.ts        # Authentication helpers
│       └── utils.ts       # Utility functions
├── .env.local             # Environment variables
├── .gitignore             # Git ignore rules
├── components.json        # shadcn/ui configuration
├── next.config.ts         # Next.js configuration
├── package.json           # Dependencies & scripts
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
├── PROJECT_STRUCTURE.md   # This documentation
└── README.md              # Project overview
```

## 🔧 Core Features

### ✅ **Multi-Tier Authentication System**
- **Customer Authentication**: Email → OTP → Details → Login
- **Admin Portal**: Role-based admin login with professional UI
- **Restaurant Partnership**: 3-step application system for restaurant owners
- **Backend Integration**: Real API calls to FastAPI server with role management
- **Email Verification**: 4-digit OTP via Mailtrap
- **Form Validation**: Comprehensive client-side and server-side validation
- **Error Handling**: Production-ready error messages
- **Guest Mode**: Continue without account (limited features)

### ✅ **Restaurant Partnership System**
- **Application Flow**: Business Info → Restaurant Details → Documents
- **Form Validation**: Step-by-step validation with error handling
- **Professional UI**: Consistent orange theme with smooth animations
- **User Discovery**: Restaurant partner entry point in customer login
- **Progress Tracking**: Visual progress indicator across 3 steps

### ✅ **Shopping Experience**
- **Restaurant Browsing**: Grid layout with search/filter
- **Menu System**: Categories, items, customization
- **Cart Management**: Add/remove items, quantity control
- **Checkout Flow**: Address, payment, order confirmation
- **Order Tracking**: Status updates and history

### ✅ **UI/UX Design**
- **Consistent Theming**: Unified orange theme across all portals
- **Role-Based Branding**: Appropriate styling for each user type
- **Responsive Design**: Mobile-first approach
- **Modern Components**: shadcn/ui component library
- **Smooth Animations**: Tailwind CSS transitions with hover effects
- **Accessibility**: ARIA labels and keyboard navigation

## � Development

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

### **User Management APIs**
- `POST /api/auth/signup` - User registration
- `POST /api/auth/verify-otp` - Email verification
- `POST /api/auth/login` - User authentication with role-based response
- `PUT /api/auth/update-user-details` - Complete registration
- `POST /api/auth/resend-otp` - Resend verification code
- `POST /api/auth/forgot-password` - Password reset flow

### **Database Schema**
- **Users Table**: Enhanced with role field (`customer`, `restaurant_owner`, `admin`)
- **User Tokens**: Separate table for OTP and reset tokens
- **Role-Based Access**: Proper user role management

## 📱 **Pages & Routes**

| Route | Component | Description | User Type |
|-------|-----------|-------------|-----------|
| `/` | `page.tsx` | Landing page | All |
| `/login` | `login/page.tsx` | Customer sign in/sign up | Customer |
| `/admin` | `admin/page.tsx` | Admin login portal | Admin |
| `/restaurant/apply` | `restaurant/apply/page.tsx` | Restaurant application | Restaurant Owner |
| `/home` | `home/page.tsx` | Restaurant dashboard | Customer |
| `/restaurant/[id]` | `restaurant/[id]/page.tsx` | Menu & ordering | Customer |
| `/cart` | `cart/page.tsx` | Shopping cart | Customer |
| `/checkout` | `checkout/page.tsx` | Order placement | Customer |
| `/orders` | `orders/page.tsx` | Order history | Customer |
| `/orders/[id]` | `orders/[id]/page.tsx` | Order details | Customer |
| `/order-success` | `order-success/page.tsx` | Confirmation | Customer |
| `/forgot-password` | `forgot-password/page.tsx` | Password reset | All |

## 🎨 **Styling & Theming**

### **Unified Color Scheme**
- **Primary**: Orange (#FF5722) - Fuji Sakura brand
- **Secondary**: Orange variants (#FF7043, #FF8A65)
- **Background**: Warm cream (#FFF7EE)
- **Text**: Dark gray (#1a1a1a)
- **Accent**: Light orange variants for hover states

### **Typography**
- **Primary Font**: Anuphan (Google Fonts)
- **Fallback**: System fonts (system-ui, sans-serif)
- **Consistent Weights**: 400, 500, 600, 700

### **Component Design**
- **Cards**: Rounded corners (12px-24px), subtle shadows
- **Buttons**: Gradient backgrounds, consistent hover effects
- **Forms**: Clean inputs with orange focus states
- **Navigation**: Intuitive layout with proper spacing

## 🔄 **Next Development Phase**

### **Pending Implementation**
1. **Admin Dashboard** (`/admin/dashboard`)
   - Restaurant application review interface
   - Approve/reject workflow with email notifications
   - User management and system analytics

2. **Restaurant Portal** (`/restaurant`)
   - Restaurant owner login page
   - Restaurant dashboard for approved owners
   - Menu management system with image uploads

3. **Backend APIs**
   - Restaurant application submission endpoints
   - Admin approval/rejection APIs
   - Menu management and restaurant data APIs

### **Planned Database Extensions**
- `restaurant_applications` - Application submissions with status tracking
- `restaurants` - Approved restaurant data with owner relationships
- `menu_items` - Restaurant menu management with categories

## 🧹 **Clean Structure Benefits**

### **Organized Architecture**
- ✅ **Role-Based Organization**: Clear separation of user types
- ✅ **Consistent Theming**: Unified orange brand across all portals
- ✅ **Scalable Structure**: Easy to add new user types and features
- ✅ **Professional UI**: Enterprise-ready interface design
- ✅ **Type Safety**: Full TypeScript implementation
- ✅ **Production Ready**: Proper error handling and validation

---

**Status**: Multi-tier authentication system with restaurant partnership flow  
**Last Updated**: January 27, 2026  
**Next Phase**: Admin dashboard and restaurant management portal