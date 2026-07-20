'use client'

import { create } from 'zustand'

export type ViewKey =
  | 'dashboard'
  | 'kasir'
  | 'transaksi'
  | 'pricelist'
  | 'cabang'
  | 'pelanggan'
  | 'tutup-buku'
  | 'rekap'
  | 'laporan'

interface NavState {
  currentView: ViewKey
  setView: (view: ViewKey) => void
  selectedBranchId: string | null
  setSelectedBranchId: (id: string | null) => void
}

export const useNavStore = create<NavState>((set) => ({
  currentView: 'dashboard',
  setView: (view) => set({ currentView: view }),
  selectedBranchId: null,
  setSelectedBranchId: (id) => set({ selectedBranchId: id }),
}))

export interface CartItem {
  id: string
  serviceId: string | null
  serviceName: string
  category: string
  variant: string | null
  price: number
  unit: string
  quantity: number
  subtotal: number
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id' | 'subtotal'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  updatePrice: (id: string, price: number) => void
  clearCart: () => void
  total: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      // If same service+variant+price exists, increment quantity
      const existing = state.items.find(
        (i) =>
          i.serviceId === item.serviceId &&
          i.serviceName === item.serviceName &&
          i.variant === item.variant &&
          i.price === item.price
      )
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === existing.id
              ? { ...i, quantity: i.quantity + item.quantity, subtotal: (i.quantity + item.quantity) * i.price }
              : i
          ),
        }
      }
      const newItem: CartItem = {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        subtotal: item.price * item.quantity,
      }
      return { items: [...state.items, newItem] }
    }),
  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(0.1, quantity), subtotal: Math.max(0.1, quantity) * i.price } : i
      ),
    })),
  updatePrice: (id, price) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, price: Math.max(0, price), subtotal: Math.max(0, price) * i.quantity } : i
      ),
    })),
  clearCart: () => set({ items: [] }),
  total: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
}))
