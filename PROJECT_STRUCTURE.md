# Fuji Sakura Food Delivery - Frontend Project Structure

## 🎨 Project Overview

A modern Next.js 14 food delivery platform with Japanese-inspired design, featuring separate portals for customers, restaurant owners, and administrators.

## 📁 Directory Structure

```
food-delivery-ui/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        # Admin dashboard with application management
│   │   │   └── page.tsx            # Admin login portal
│   │   ├── cart/
│   │   │   └── page.tsx            # Shopping cart page
│   │   ├── checkout/
│   │   │   └── page.tsx            # Order checkout process
│   │   ├── home/
│   │   │   └── page.tsx            # Customer home page with restaurants
│   │   ├── login/
│   │   │   └── page.tsx            # Customer authentication (login/signup)
│   │   ├── orders/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx        # Individual order details
│   │   │   └── page.tsx            # Order history
│   │   ├── order-success/
│   │   │   └── page.tsx            # Order confirmation page
│   │   ├── restaurant/
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx        # Restaurant analytics dashboard
│   │   │   ├── apply/
│   │   │   │   └── page.tsx        # Restaurant partnership application
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        # Restaurant owner dashboard
│   │   │   ├── login/
│   │   │   │   └── page.tsx        # Restaurant login portal
│   │   │   ├── menu/
│   │   │   │   └── page.tsx        # Menu management interface
│   │   │   ├── orders/
│   │   │   │   └── page.tsx        # Restaurant order management
│   │   │   ├── profile/
│   │   │   │   └── page.tsx        # Restaurant profile management
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx        # Public restaurant page
│   │   │   └── page.tsx            # Restaurant portal landing
│   │   ├── globals.css             # Global styles and Tailwind imports
│   │   ├── layout.tsx              # Root layout with metadata
│   │   └── page.tsx                # Landing page
│   ├── components/
│   │   └── AuthPopup.tsx           # Authentication modal component
│   ├── contexts/
│   │   └── CartContext.tsx         # Shopping cart state management
│   └── data/
│       └── restaurants.ts          # Mock restaurant data (to be replaced)
├── public/
│   └── images/
│       ├── auth/                   # Authentication page images
│       └── logo/
│           └── Logo.png            # Fuji Sakura brand logo
├── .env.local                      # Environment variables
├── next.config.ts                  # Next.js configuration
├── package.json                    # Dependencies and scripts
├── tailwind.config.ts              # Tailwind CSS configuration
└── tsconfig.json                   # TypeScript configuration
```

## 🔗 Backend Integration Points

### **Customer Authentication**
- **Login/Signup**: Connects to `/api/auth/signup`, `/api/auth/login`
- **OTP Verification**: Real-time OTP validation with Mailtrap emails
- **Password Reset**: Complete forgot password flow with email verification
- **Session Management**: JWT token storage and validation

### **Restaurant Management**
- **Application Process**: 3-step partnership application form
- **Login System**: Single-session authentication with conflict detection
- **Profile Management**: Real-time profile editing with backend sync
- **Dashboard Integration**: Live data from approved restaurant applications

### **Admin Portal**
- **Application Review**: Real-time restaurant application management
- **Admin Management**: Super admin can create/deactivate other admins
- **Session Security**: 10-minute auto-logout with warnings
- **Real-time Updates**: Live application status changes

## 🎨 Design System

### **Theme & Branding**
- **Primary Color**: Orange (#FF5722) - Fuji Sakura brand color
- **Typography**: Anuphan font family for Japanese aesthetic
- **Design Language**: Clean, modern interface with subtle Japanese influences
- **Responsive**: Desktop-first approach with mobile optimization

### **UI Components**
- **Custom Notifications**: Beautiful sliding notifications replace alert() messages
- **Modal System**: Professional modals with background scroll prevention
- **Form Validation**: Real-time validation with user-friendly error messages
- **Loading States**: Consistent loading animations across all pages

### **Color Palette**
```css
Primary: #FF5722 (Orange)
Secondary: #FF7043 (Light Orange)
Success: #4CAF50 (Green)
Error: #F44336 (Red)
Warning: #FF9800 (Amber)
Background: Linear gradients for visual appeal
```

## 🔐 Security Features

### **Authentication Flow**
- **JWT Token Management**: Secure token storage in localStorage
- **Session Validation**: Real-time session checks with backend
- **Role-Based Routing**: Automatic redirects based on user type
- **Session Conflicts**: Handles "already logged in elsewhere" scenarios

### **Data Protection**
- **Input Sanitization**: All form inputs validated and sanitized
- **XSS Prevention**: Proper data encoding and validation
- **CSRF Protection**: Token-based request validation
- **Secure Headers**: Next.js security headers configured

## 📱 User Experience Features

### **Customer Portal**
- **Seamless Authentication**: OTP-based signup with email verification
- **Restaurant Discovery**: Browse approved restaurants with real data
- **Shopping Cart**: Persistent cart state with context management
- **Order Tracking**: Real-time order status updates

### **Restaurant Portal**
- **Application Process**: Intuitive 3-step partnership application
- **Dashboard Analytics**: Visual stats and performance metrics
- **Menu Management**: Full CRUD operations for menu items
- **Profile Control**: Edit business information and settings

### **Admin Portal**
- **Application Review**: Streamlined approval/rejection workflow
- **Admin Management**: Create and manage admin accounts
- **Security Monitoring**: Session tracking and automatic logout
- **Notification System**: Beautiful notifications for all actions

## 🚀 Performance Optimizations

### **Next.js Features**
- **App Router**: Latest Next.js 14 app directory structure
- **Image Optimization**: Next.js Image component for optimized loading
- **Code Splitting**: Automatic code splitting for faster page loads
- **Static Generation**: Optimized build process for production

### **State Management**
- **React Context**: Efficient state management for cart and auth
- **Local Storage**: Persistent user sessions and preferences
- **Real-time Updates**: Live data synchronization with backend

### **Bundle Optimization**
- **Tree Shaking**: Unused code elimination
- **Lazy Loading**: Components loaded on demand
- **Asset Optimization**: Compressed images and optimized fonts

## 🔄 Data Flow Architecture

### **Authentication Flow**
```
User Input → Form Validation → API Call → JWT Token → Local Storage → Route Protection
```

### **Restaurant Application Flow**
```
Application Form → Validation → Backend API → Admin Review → Email Notification → Login Access
```

### **Order Management Flow**
```
Menu Selection → Cart Context → Checkout Process → Payment → Order Tracking → Completion
```

## 📈 Development Roadmap

### **Phase 1: Core Authentication** ✅ Complete
- Customer login/signup with OTP verification
- Restaurant application and login system
- Admin portal with application management
- Session management and security

### **Phase 2: Restaurant Integration** ✅ Complete
- Restaurant profile management
- Real data integration for dashboards
- Single-session authentication
- Admin management system

### **Phase 3: Menu Management** 🔄 In Progress
- Restaurant menu CRUD operations
- Image upload for food items
- Menu categories and pricing
- Customer menu browsing

### **Phase 4: Order System** 📋 Planned
- Customer order placement
- Restaurant order processing
- Real-time order tracking
- Payment integration

### **Phase 5: Advanced Features** 🔮 Future
- Rating and review system
- Delivery tracking
- Push notifications
- Analytics dashboard

## 🛠️ Development Guidelines

### **Code Standards**
- **TypeScript**: Strict type checking enabled
- **Component Structure**: Functional components with hooks
- **Styling**: Tailwind CSS with custom design system
- **Error Handling**: Comprehensive error boundaries and validation

### **Performance Best Practices**
- **Image Optimization**: Use Next.js Image component
- **Bundle Analysis**: Regular bundle size monitoring
- **Lazy Loading**: Implement for non-critical components
- **Caching**: Proper cache headers and strategies

### **Security Checklist**
- ✅ Input validation on all forms
- ✅ XSS prevention measures
- ✅ Secure token storage
- ✅ HTTPS enforcement
- ✅ Content Security Policy headers

## 🌐 Deployment Configuration

### **Environment Variables**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000  # Backend API URL
```

### **Production Optimizations**
- **Static Export**: Optimized build for deployment
- **CDN Integration**: Asset delivery optimization
- **Error Monitoring**: Production error tracking
- **Performance Monitoring**: Real user metrics

### **Deployment Targets**
- **Vercel**: Recommended for Next.js applications
- **Netlify**: Alternative deployment platform
- **Docker**: Containerized deployment option
- **Traditional Hosting**: Static file deployment