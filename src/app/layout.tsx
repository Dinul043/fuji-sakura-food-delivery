import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../contexts/CartContext";
import FetchInterceptor from "../components/FetchInterceptor";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "Fuji Sakura Food App - 富士桜フードアプリ",
  description: "Premium Japanese Food Delivery Experience",
  keywords: "food delivery, japanese cuisine, sushi, ramen, bento",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
  icons: {
    icon: "/images/logo/Logo.png",
    shortcut: "/images/logo/Logo.png",
    apple: "/images/logo/Logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Razorpay Checkout Script */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body
        className={`${inter.variable} ${notoSansJP.variable} font-sans antialiased`}
      >
        <FetchInterceptor>
          <CartProvider>
            {children}
          </CartProvider>
        </FetchInterceptor>
      </body>
    </html>
  );
}