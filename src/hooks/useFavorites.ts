import { useEffect, useState } from 'react'

const STORAGE_KEY = 'ap-tools-favorites'

function getInitialFavorites(): string[] {
  try {
    const storedFavorites = localStorage.getItem(STORAGE_KEY)

    if (!storedFavorites) {
      return []
    }

    const parsedFavorites = JSON.parse(storedFavorites)

    if (!Array.isArray(parsedFavorites)) {
      return []
    }

    return parsedFavorites.filter(
      (item): item is string => typeof item === 'string',
    )
  } catch {
    return []
  }
}

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] =
    useState<string[]>(getInitialFavorites)

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(favoriteIds),
    )
  }, [favoriteIds])

  function toggleFavorite(toolId: string) {
    setFavoriteIds((currentFavorites) => {
      const alreadyFavorite =
        currentFavorites.includes(toolId)

      if (alreadyFavorite) {
        return currentFavorites.filter(
          (id) => id !== toolId,
        )
      }

      return [...currentFavorites, toolId]
    })
  }

  function isFavorite(toolId: string) {
    return favoriteIds.includes(toolId)
  }

  return {
    favoriteIds,
    toggleFavorite,
    isFavorite,
  }
}