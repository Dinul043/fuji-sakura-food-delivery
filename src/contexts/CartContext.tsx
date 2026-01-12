'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVeg: boolean;
  rating: number;
  quantity: number;
  restaurantId: number;
  restaurantName: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (itemId: number, restaurantId: number) => void;
  updateQuantity: (itemId: number, restaurantId: number, newQuantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getCartItemsByRestaurant: (restaurantId: number) => CartItem[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('fujiSakuraCart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('fujiSakuraCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCartItems(prev => {
      const existingItem = prev.find(cartItem => 
        cartItem.id === item.id && cartItem.restaurantId === item.restaurantId
      );
      
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id && cartItem.restaurantId === item.restaurantId
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (itemId: number, restaurantId: number) => {
    setCartItems(prev => prev.filter(item => !(item.id === itemId && item.restaurantId === restaurantId)));
  };

  const updateQuantity = (itemId: number, restaurantId: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(itemId, restaurantId);
    } else {
      setCartItems(prev =>
        prev.map(item =>
          item.id === itemId && item.restaurantId === restaurantId 
            ? { ...item, quantity: newQuantity } 
            : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsByRestaurant = (restaurantId: number) => {
    return cartItems.filter(item => item.restaurantId === restaurantId);
  };

  return (
    <CartContext.Provider value={{
      cart: cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      getCartItemsByRestaurant
    }}>
      {children}
    </CartContext.Provider>
  );
};