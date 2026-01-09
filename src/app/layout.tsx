import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../contexts/CartContext";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${notoSansJP.variable} font-sans antialiased`}
      >
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}