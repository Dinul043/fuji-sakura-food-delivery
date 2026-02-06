'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/constants';

export interface CartItem {
  id: number;
  cart_id?: number; // Database cart entry ID
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
  totalPrice?: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
  removeFromCart: (itemId: number, restaurantId: number) => Promise<void>;
  updateQuantity: (itemId: number, restaurantId: number, newQuantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  clearUserCart: (userKey: string) => void; // Keep for backward compatibility
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getCartItemsByRestaurant: (restaurantId: number) => CartItem[];
  getCurrentUser: () => string | null;
  refreshCart: () => Promise<void>;
  forceRefreshCart: () => Promise<void>;
  clearCartOnLogout: () => void;
  isLoading: boolean;
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
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize cart on mount and listen for storage changes
  useEffect(() => {
    initializeCart();
    
    // Listen for storage changes (when token is added/removed)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'userEmail') {
        console.log('🔄 CartContext: Storage change detected, reinitializing cart');
        initializeCart();
      }
    };
    
    // Listen for custom events (for same-tab token changes)
    const handleTokenChange = () => {
      console.log('🔄 CartContext: Token change event detected, reinitializing cart');
      // Small delay to ensure token is fully stored
      setTimeout(() => {
        initializeCart();
      }, 100);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tokenChanged', handleTokenChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tokenChanged', handleTokenChange);
    };
  }, []);

  // Initialize cart based on authentication status
  const initializeCart = async () => {
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName');
    const currentUserKey = userEmail || userName || 'guest';
    
    console.log('🔄 CartContext: Initializing cart');
    console.log('   Token exists:', !!token);
    console.log('   User:', currentUserKey);
    console.log('   Token source:', localStorage.getItem('token') ? 'localStorage' : sessionStorage.getItem('token') ? 'sessionStorage' : 'none');
    
    setCurrentUser(currentUserKey);
    setIsAuthenticated(!!token);
    setCartItems([]); // Always start empty
    
    if (token) {
      console.log('✅ CartContext: Authenticated - fetching from database');
      await fetchCartFromDatabase();
      console.log('✅ CartContext: Database fetch completed');
    } else {
      console.log('👤 CartContext: Guest - loading from localStorage');
      loadGuestCart(currentUserKey);
    }
  };

  // Fetch cart from database (authenticated users only)
  const fetchCartFromDatabase = async () => {
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.log('❌ CartContext: No token found, cannot fetch from database');
      return;
    }
    
    console.log('🔄 CartContext: Fetching cart from database...');
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ CartContext: Cart loaded from database:', data.length, 'items');
        setCartItems(data);
      } else {
        console.log('❌ CartContext: Failed to fetch cart, status:', response.status);
        if (response.status === 401) {
          // Token might be invalid, clear it and switch to guest mode
          localStorage.removeItem('token');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userName');
          setIsAuthenticated(false);
          setCurrentUser('guest');
          loadGuestCart('guest');
        }
      }
    } catch (error) {
      console.log('❌ CartContext: Network error fetching cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load guest cart from localStorage (guest users only)
  const loadGuestCart = (userKey: string) => {
    const userCartKey = `fujiSakuraCart_${userKey}`;
    const savedCart = localStorage.getItem(userCartKey);
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        setCartItems([]);
      }
    }
  };

  // Save guest cart to localStorage (guest users only)
  const saveGuestCart = (items: CartItem[], userKey: string) => {
    const userCartKey = `fujiSakuraCart_${userKey}`;
    localStorage.setItem(userCartKey, JSON.stringify(items));
  };

  // Add item to cart
  const addToCart = async (item: Omit<CartItem, 'quantity'>) => {
    console.log('🔍 CartContext addToCart called with:', item);
    
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('   Token exists:', !!token);
    console.log('   Token source:', localStorage.getItem('token') ? 'localStorage' : sessionStorage.getItem('token') ? 'sessionStorage' : 'none');
    
    if (token) {
      // Authenticated user - use database
      console.log('✅ CartContext: Sending API request to add item to cart');
      try {
        const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            menu_item_id: item.id,
            quantity: 1,
          }),
        });

        console.log('📡 API Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ API Response data:', data);
          await fetchCartFromDatabase();
        } else if (response.status === 401) {
          console.log('❌ Token invalid, clearing auth and switching to guest mode');
          localStorage.removeItem('token');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userName');
          setIsAuthenticated(false);
          setCurrentUser('guest');
          // Retry as guest
          await addToCart(item);
        } else {
          console.log('❌ API Error:', response.status, response.statusText);
        }
      } catch (error) {
        console.log('❌ Network Error:', error);
      }
    } else {
      console.log('👤 CartContext: No token, using localStorage fallback');
      // Guest user - use localStorage
      setCartItems(prev => {
        const existingItem = prev.find(cartItem => 
          cartItem.id === item.id && cartItem.restaurantId === item.restaurantId
        );
        
        let newCart;
        if (existingItem) {
          newCart = prev.map(cartItem =>
            cartItem.id === item.id && cartItem.restaurantId === item.restaurantId
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          );
        } else {
          newCart = [...prev, { ...item, quantity: 1 }];
        }
        
        if (currentUser) {
          saveGuestCart(newCart, currentUser);
        }
        return newCart;
      });
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId: number, restaurantId: number) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
      // Authenticated user - use database
      const cartItem = cartItems.find(item => 
        item.id === itemId && item.restaurantId === restaurantId
      );
      
      if (cartItem?.cart_id) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/cart/remove/${cartItem.cart_id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (response.ok) {
            await fetchCartFromDatabase();
          } else if (response.status === 401) {
            // Token invalid, clear auth and switch to guest mode
            localStorage.removeItem('token');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            setIsAuthenticated(false);
            setCurrentUser('guest');
          }
        } catch (error) {
          // Silent error handling
        }
      }
    } else {
      // Guest user - use localStorage
      setCartItems(prev => {
        const newCart = prev.filter(item => !(item.id === itemId && item.restaurantId === restaurantId));
        if (currentUser) {
          saveGuestCart(newCart, currentUser);
        }
        return newCart;
      });
    }
  };

  // Update quantity
  const updateQuantity = async (itemId: number, restaurantId: number, newQuantity: number) => {
    if (newQuantity === 0) {
      await removeFromCart(itemId, restaurantId);
      return;
    }

    const token = localStorage.getItem('token');
    
    if (token) {
      // Authenticated user - use database
      const cartItem = cartItems.find(item => 
        item.id === itemId && item.restaurantId === restaurantId
      );
      
      if (cartItem?.cart_id) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/cart/update/${cartItem.cart_id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ quantity: newQuantity }),
          });

          if (response.ok) {
            await fetchCartFromDatabase();
          }
        } catch (error) {
          // Silent error handling
        }
      }
    } else {
      // Guest user - use localStorage
      setCartItems(prev => {
        const newCart = prev.map(item =>
          item.id === itemId && item.restaurantId === restaurantId 
            ? { ...item, quantity: newQuantity } 
            : item
        );
        if (currentUser) {
          saveGuestCart(newCart, currentUser);
        }
        return newCart;
      });
    }
  };

  // Clear cart
  const clearCart = async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Authenticated user - clear database
      try {
        const response = await fetch(`${API_BASE_URL}/api/cart/clear`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          setCartItems([]);
        }
      } catch (error) {
        // Silent error handling
      }
    } else {
      // Guest user - clear localStorage
      setCartItems([]);
      if (currentUser) {
        saveGuestCart([], currentUser);
      }
    }
  };

  // Clear specific user cart (backward compatibility)
  const clearUserCart = (userKey: string) => {
    const userCartKey = `fujiSakuraCart_${userKey}`;
    localStorage.removeItem(userCartKey);
    if (userKey === currentUser) {
      setCartItems([]);
    }
  };

  // Refresh cart from current source
  const refreshCart = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await fetchCartFromDatabase();
    } else if (currentUser) {
      loadGuestCart(currentUser);
    }
  };

  // Force refresh cart (for user switches)
  const forceRefreshCart = async () => {
    console.log('🔄 CartContext: Force refresh requested');
    await initializeCart();
  };

  // Clear cart on logout (frontend state only, preserve database)
  const clearCartOnLogout = () => {
    setCartItems([]);
    setCurrentUser('guest');
    setIsAuthenticated(false);
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

  const getCurrentUser = () => currentUser;

  return (
    <CartContext.Provider value={{
      cart: cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      clearUserCart,
      getTotalItems,
      getTotalPrice,
      getCartItemsByRestaurant,
      getCurrentUser,
      refreshCart,
      forceRefreshCart,
      clearCartOnLogout,
      isLoading
    }}>
      {children}
    </CartContext.Provider>
  );
};