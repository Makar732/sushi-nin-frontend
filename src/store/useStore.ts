import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { District, DISTRICTS } from '@/data/districts';
import { Product } from '@/data/products';

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  variant?: string;
  price: number;
  weight: string;
  quantity: number;
  image: string;
  category: string;
}

export interface AppliedPromo {
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  description: string;
}

interface AppState {
  district: District | null;
  isDistrictModalOpen: boolean;
  setDistrict: (district: District) => void;
  openDistrictModal: () => void;
  closeDistrictModal: () => void;

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
  applyPromoCode: (code: string, subtotal: number) => Promise<{ success: boolean; message: string }>;
  removePromoCode: () => void;

  searchQuery: string;
  selectedCategory: string;
  activeFilter: string;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setActiveFilter: (filter: string) => void;

  selectedProductForModal: Product | null;
  setSelectedProductForModal: (product: Product | null) => void;

  activeOrder: any | null;
  setActiveOrder: (order: any | null) => void;
  isOrderTrackerOpen: boolean;
  setOrderTrackerOpen: (open: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      district: DISTRICTS[0],
      isDistrictModalOpen: false,
      setDistrict: (district) => set({ district, isDistrictModalOpen: false }),
      openDistrictModal: () => set({ isDistrictModalOpen: true }),
      closeDistrictModal: () => set({ isDistrictModalOpen: false }),

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

      applyPromoCode: async (code, subtotal) => {
        try {
          const res = await fetch('/api/promotions/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, subtotal }),
          });
          const data = await res.json();
          if (data.success && data.promo) {
            set({ appliedPromo: data.promo });
            return { success: true, message: data.message || 'Промокод применён!' };
          }
          return { success: false, message: data.message || 'Неверный промокод' };
        } catch {
          return { success: false, message: 'Ошибка сети. Попробуйте позже.' };
        }
      },

      removePromoCode: () => set({ appliedPromo: null }),

      searchQuery: '',
      selectedCategory: 'all',
      activeFilter: 'all',
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setActiveFilter: (filter) => set({ activeFilter: filter }),

      selectedProductForModal: null,
      setSelectedProductForModal: (product) => set({ selectedProductForModal: product }),

      activeOrder: null,
      setActiveOrder: (order) => set({ activeOrder: order }),
      isOrderTrackerOpen: false,
      setOrderTrackerOpen: (open) => set({ isOrderTrackerOpen: open }),
    }),
    {
      name: 'sushinin_storage',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState: any, version) => {
        // В версии 1 appliedPromo хранил discountPercent — сбрасываем при миграции
        if (version < 2 && persistedState) {
          return { ...persistedState, appliedPromo: null };
        }
        return persistedState;
      },
      partialize: (state) => ({
        district: state.district,
        cart: state.cart,
        appliedPromo: state.appliedPromo,
        activeOrder: state.activeOrder,
      }),
    }
  )
);