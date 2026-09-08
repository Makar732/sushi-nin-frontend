import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { District, DISTRICTS } from '@/data/districts';
import { Product } from '@/data/products';

export interface CartItem {
  id: string; // unique key e.g. "pepperoni-pizza-34cm"
  productId: string;
  title: string;
  variant?: string; // e.g. "34 см" or "40 см"
  price: number;
  weight: string;
  quantity: number;
  image: string;
  category: string;
}

export interface AppliedPromo {
  code: string;
  discountPercent: number;
  description: string;
}

interface AppState {
  // District state
  district: District | null;
  isDistrictModalOpen: boolean;
  setDistrict: (district: District) => void;
  openDistrictModal: () => void;
  closeDistrictModal: () => void;

  // Cart state
  cart: CartItem[];
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  appliedPromo: AppliedPromo | null;
  addToCart: (product: Product, variant?: string, customPrice?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;
  setCheckoutOpen: (open: boolean) => void;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;

  // Search & Filter state
  searchQuery: string;
  selectedCategory: string;
  activeFilter: string; // 'all' | 'hit' | 'spicy' | 'baked' | 'nomeat'
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setActiveFilter: (filter: string) => void;

  // Modal Detail state
  selectedProductForModal: Product | null;
  setSelectedProductForModal: (product: Product | null) => void;

  // Order tracking
  activeOrder: any | null;
  setActiveOrder: (order: any | null) => void;
  isOrderTrackerOpen: boolean;
  setOrderTrackerOpen: (open: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // District defaults to Zavolzhye if not explicitly set
      district: DISTRICTS[0],
      isDistrictModalOpen: false,
      setDistrict: (district) => set({ district, isDistrictModalOpen: false }),
      openDistrictModal: () => set({ isDistrictModalOpen: true }),
      closeDistrictModal: () => set({ isDistrictModalOpen: false }),

      // Cart
      cart: [],
      isCartOpen: false,
      isCheckoutOpen: false,
      appliedPromo: null,

      addToCart: (product, variant, customPrice) => {
        const itemPrice = customPrice !== undefined ? customPrice : product.price;
        const variantSuffix = variant ? `-${variant}` : '';
        const cartItemId = `${product.id}${variantSuffix}`;

        const existingItem = get().cart.find((item) => item.id === cartItemId);
        if (existingItem) {
          set({
            cart: get().cart.map((item) =>
              item.id === cartItemId
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({
            cart: [
              ...get().cart,
              {
                id: cartItemId,
                productId: product.id,
                title: product.title,
                variant: variant,
                price: itemPrice,
                weight: product.weight,
                quantity: 1,
                image: product.imageUrl || `/images/${product.image_filename}`,
                category: product.category,
              },
            ],
          });
        }
      },

      removeFromCart: (id) =>
        set({ cart: get().cart.filter((item) => item.id !== id) }),

      updateQuantity: (id, delta) => {
        const currentCart = get().cart;
        const targetItem = currentCart.find((item) => item.id === id);
        if (!targetItem) return;

        const newQty = targetItem.quantity + delta;
        if (newQty <= 0) {
          set({ cart: currentCart.filter((item) => item.id !== id) });
        } else {
          set({
            cart: currentCart.map((item) =>
              item.id === id ? { ...item, quantity: newQty } : item
            ),
          });
        }
      },

      clearCart: () => set({ cart: [], appliedPromo: null }),
      setCartOpen: (open) => set({ isCartOpen: open }),
      setCheckoutOpen: (open) => set({ isCheckoutOpen: open }),

      applyPromoCode: (code) => {
        const upperCode = code.trim().toUpperCase();
        if (upperCode === 'SUSHIMIN10') {
          const promo = { code: 'SUSHIMIN10', discountPercent: 10, description: 'Скидка 10% на ваш заказ' };
          set({ appliedPromo: promo });
          return { success: true, message: 'Промокод SUSHIMIN10 применён! Скидка 10%' };
        } else if (upperCode === 'ROLLFREE') {
          const promo = { code: 'ROLLFREE', discountPercent: 15, description: 'Скидка 15% от 2000 ₽' };
          set({ appliedPromo: promo });
          return { success: true, message: 'Промокод ROLLFREE применён! Скидка 15%' };
        } else if (upperCode === 'PIZZA20') {
          const promo = { code: 'PIZZA20', discountPercent: 20, description: 'Скидка 20% от 3000 ₽' };
          set({ appliedPromo: promo });
          return { success: true, message: 'Промокод PIZZA20 применён! Скидка 20%' };
        }
        return { success: false, message: 'Неверный промокод' };
      },

      removePromoCode: () => set({ appliedPromo: null }),

      // Filters
      searchQuery: '',
      selectedCategory: 'all',
      activeFilter: 'all',
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setActiveFilter: (filter) => set({ activeFilter: filter }),

      // Modal Detail
      selectedProductForModal: null,
      setSelectedProductForModal: (product) => set({ selectedProductForModal: product }),

      // Tracking
      activeOrder: null,
      setActiveOrder: (order) => set({ activeOrder: order }),
      isOrderTrackerOpen: false,
      setOrderTrackerOpen: (open) => set({ isOrderTrackerOpen: open }),
    }),
    {
      name: 'sushimin_storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        district: state.district,
        cart: state.cart,
        appliedPromo: state.appliedPromo,
        activeOrder: state.activeOrder,
      }),
    }
  )
);
