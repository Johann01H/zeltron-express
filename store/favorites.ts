'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type FavoritesState = {
  ids: string[]
  toggleFavorite: (productId: string) => void
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set) => ({
      ids: [],
      toggleFavorite: (productId) =>
        set((state) => ({
          ids: state.ids.includes(productId) ? state.ids.filter((id) => id !== productId) : [...state.ids, productId],
        })),
    }),
    { name: 'zx-favorites', version: 1 },
  ),
)
