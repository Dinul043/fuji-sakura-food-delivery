# 🌸 Fuji Sakura Food Delivery App

A premium Japanese-inspired food delivery application built with Next.js 15, TypeScript, and Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)

## ✨ Features

### 🎨 Premium UI/UX
- **Japanese Sakura Theme**: Cherry blossom-inspired design with pink gradients
- **Glass-morphism Effects**: Modern frosted glass aesthetic throughout
- **Smooth Animations**: Floating elements, gradient shifts, and smooth transitions
- **Desktop Optimized**: Designed for 1920×1080 resolution with responsive elements

### 🔐 Authentication System
- **Multi-mode Login**: Phone or email authentication options
- **Guest Access**: Continue without registration
- **Password Reset**: 4-step recovery flow with OTP verification
- **Form Validation**: Real-time validation with user-friendly error messages

### 🍽️ Restaurant Discovery
- **55+ Restaurants**: Comprehensive dataset across 8+ cuisines
- **Smart Search**: Real-time search with auto-scroll and popular suggestions
- **Category Filters**: 8 visual category capsules with smart hover logic
- **Restaurant Cards**: Professional cards with unique hover gradients

### 🛒 Global Cart System
- **Multi-Restaurant Support**: Add items from different restaurants
- **Persistent Storage**: Cart survives page refreshes via localStorage
- **Real-time Updates**: Cart count updates across all pages
- **Restaurant-Specific Views**: Filter cart items by current restaurant

### 📱 Restaurant Details
- **Dynamic Menu System**: Categorized menu items with detailed descriptions
- **Interactive Cart**: Slide-in cart with quantity controls
- **Veg/Non-Veg Indicators**: Clear dietary preference markers
- **Rating System**: Star ratings for items and restaurants

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/fuji-sakura-food-delivery.git
cd fuji-sakura-food-delivery
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Run development server**
```bash
npm run dev
# or
yarn dev
```

4. **Open in browser**
```
http://localhost:3000
```

## 📁 Project Structure

```
food-delivery-ui/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Splash screen
│   │   ├── login/             # Authentication
│   │   ├── forgot-password/   # Password reset
│   │   ├── home/              # Restaurant discovery
│   │   └── restaurant/[id]/   # Restaurant details
│   ├── contexts/
│   │   └── CartContext.tsx    # Global cart state
│   ├── data/
│   │   └── restaurants.ts     # Restaurant dataset
│   └── components/            # Reusable components
├── public/                    # Static assets
└── docs/                      # Documentation
```

## 🎯 Key Pages

### 🏠 Splash Screen (`/`)
- Animated Japanese-themed landing page
- Auto-redirect to login after 3 seconds
- Floating food emojis with smooth animations

### 🔑 Authentication (`/login`)
- Toggle between login and signup
- Phone/email authentication options
- Guest access for quick browsing

### 🍜 Home Page (`/home`)
- Restaurant grid with search and filters
- 8 category filters with visual feedback
- Popular search suggestions
- Premium footer with contact information

### 🏪 Restaurant Details (`/restaurant/[id]`)
- Dynamic menu with categories
- Add to cart functionality
- Restaurant-specific cart view
- Smooth animations and interactions

## 🛠️ Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Context**: Global state management

### Development Tools
- **ESLint**: Code linting and formatting
- **PostCSS**: CSS processing
- **Git**: Version control

### Design System
- **Japanese Aesthetics**: Sakura-inspired color palette
- **Glass-morphism**: Modern frosted glass effects
- **Smooth Animations**: CSS keyframes and transitions
- **Responsive Design**: Desktop-first approach

## 📊 Data Structure

### Restaurant Model
```typescript
interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  image: string;
  category: string;
  tags: string[];
  reviews: string;
}
```

### Cart Item Model
```typescript
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  restaurantId: number;
  restaurantName: string;
  // ... other properties
}
```

## 🎨 Design Features

### Color Palette
- **Primary**: Pink/Rose gradients (#ff6b6b, #ee5a24)
- **Secondary**: Purple/Blue gradients (#667eea, #764ba2)
- **Accent**: Various gradient combinations for cards
- **Background**: Animated multi-color gradients

### Typography
- **Primary**: Inter (Latin characters)
- **Secondary**: Noto Sans JP (Japanese characters)
- **Weights**: 400, 500, 600, 700

### Animations
- **Gradient Shift**: 6-second infinite background animation
- **Float**: Floating food emojis with staggered timing
- **Hover Effects**: Smooth scale and color transitions
- **Scroll**: Custom cubic-bezier scroll animations

## 🔧 Configuration

### Tailwind Config
Custom configuration includes:
- Extended color palette
- Custom animations
- Font family definitions
- Responsive breakpoints

### Next.js Config
- TypeScript support
- Image optimization
- Route configuration

## 📱 Responsive Design

Currently optimized for:
- **Desktop**: 1920×1080 (primary target)
- **Large Screens**: 1440px and above
- **Future**: Mobile responsive design planned

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
npx vercel
```

### Deploy to Netlify
```bash
npm run build
# Upload dist folder to Netlify
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Design Inspiration**: Japanese aesthetics and cherry blossom themes
- **UI References**: Zomato, Swiggy, and other food delivery platforms
- **Icons**: Emoji-based icons for training phase
- **Fonts**: Google Fonts (Inter, Noto Sans JP)

## 📞 Contact

- **Project**: Fuji Sakura Food Delivery
- **Status**: Training Phase Complete
- **Next Phase**: Checkout flow and order management

---

**Built with ❤️ and 🌸 by the development team**