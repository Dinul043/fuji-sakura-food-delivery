import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../contexts/CartContext";
import FetchInterceptor from "../components/FetchInterceptor";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fuji Sakura — Premium Food Delivery",
  description: "Premium Japanese Food Delivery Experience",
  keywords: "food delivery, japanese cuisine, sushi, ramen, bento",
  icons: {
    icon: "/images/logo/Logo.png",
    shortcut: "/images/logo/Logo.png",
    apple: "/images/logo/Logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body className={`${inter.variable} ${plusJakarta.variable} antialiased`}>
        <FetchInterceptor>
          <CartProvider>
            {children}
          </CartProvider>
        </FetchInterceptor>
      </body>
    </html>
  );
}
