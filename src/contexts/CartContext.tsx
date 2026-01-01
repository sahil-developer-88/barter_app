import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  merchant_id: string;        // NEW: Track which merchant
  merchant_name: string;      // NEW: Display merchant name
  image_url?: string;         // NEW: Product image
  stock_quantity?: number;    // NEW: Available stock
  barcode?: string;
  sku?: string;
  category_name?: string;
  is_barter_eligible: boolean;
  restriction_reason?: string;
  // POS integration fields for transaction sync
  pos_integration_id?: string;
  external_product_id?: string;
  external_variant_id?: string;
}

export interface MerchantInfo {
  id: string;
  business_name: string;
  location: string;
  barter_percentage: number;
}

interface CartContextType {
  cart: CartItem[];
  merchantInfo: MerchantInfo | null;  // NEW: Current merchant
  addToCart: (product: Omit<CartItem, 'quantity'>, merchantInfo: MerchantInfo) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  switchMerchant: (merchantId: string) => void;  // NEW: Clear cart for new merchant
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'barter_app_cart';
const MERCHANT_STORAGE_KEY = 'barter_app_merchant';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Load cart from localStorage on mount
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });

  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(() => {
    // Load merchant info from localStorage
    try {
      const savedMerchant = localStorage.getItem(MERCHANT_STORAGE_KEY);
      return savedMerchant ? JSON.parse(savedMerchant) : null;
    } catch (error) {
      console.error('Error loading merchant from localStorage:', error);
      return null;
    }
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart]);

  // Save merchant info to localStorage whenever it changes
  useEffect(() => {
    try {
      if (merchantInfo) {
        localStorage.setItem(MERCHANT_STORAGE_KEY, JSON.stringify(merchantInfo));
      } else {
        localStorage.removeItem(MERCHANT_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving merchant to localStorage:', error);
    }
  }, [merchantInfo]);

  const addToCart = (product: Omit<CartItem, 'quantity'>, newMerchantInfo: MerchantInfo) => {
    // Check if adding from a different merchant
    if (merchantInfo && merchantInfo.id !== newMerchantInfo.id) {
      // Different merchant - this should be handled by UI with confirmation
      console.warn('Cannot add products from different merchants to cart');
      return;
    }

    // Check stock availability
    if (product.stock_quantity !== undefined && product.stock_quantity <= 0) {
      console.warn('Product out of stock');
      return;
    }

    // Set merchant info if this is the first item
    if (!merchantInfo) {
      setMerchantInfo(newMerchantInfo);
    }

    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);

      if (existingItem) {
        // Check if we have enough stock
        if (product.stock_quantity !== undefined &&
            existingItem.quantity + 1 > product.stock_quantity) {
          console.warn('Not enough stock available');
          return currentCart;
        }
        // Item exists, increase quantity
        return currentCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // New item, add with quantity 1
        return [...currentCart, { ...product, quantity: 1 }];
      }
    });
  };

  const switchMerchant = (merchantId: string) => {
    // Clear cart when switching to a different merchant
    setCart([]);
    setMerchantInfo(null);
  };

  const removeFromCart = (productId: string) => {
    setCart(currentCart => currentCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(productId);
    } else {
      setCart(currentCart =>
        currentCart.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
    setMerchantInfo(null);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        merchantInfo,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        switchMerchant,
        cartCount,
        cartTotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
