import { defineStore } from "pinia"

interface Album {
  id: string
  title: string
  slug: string
  visibility: string
  coverPhoto: { title: string, thumbnailPath: string } | null
  _count: { photos: number }
  createdAt: Date
  updatedAt: Date
}

export const useAlbumsStore = defineStore("albums", () => {
  const albums = ref<Album[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function fetchAlbums(limit = 20): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const data = await $fetch("/api/v1/albums", {
        query: { limit },
      })
      albums.value = data.albums
        .map(album => ({
          ...album,
          createdAt: new Date(album.createdAt),
          updatedAt: new Date(album.updatedAt),
        }))
        .sort((a: Album, b: Album) => a.title.localeCompare(b.title))
    } catch (e) {
      error.value = e as Error
      console.error("Failed to fetch albums:", e)
    } finally {
      loading.value = false
    }
  }

  function addAlbum(album: Album): void {
    albums.value.push(album)
    albums.value.sort((a, b) => a.title.localeCompare(b.title))
  }

  function updateAlbum(id: string, updates: Partial<Album>): void {
    const index = albums.value.findIndex(a => a.id === id)
    if (index !== -1) {
      albums.value[index] = { ...albums.value[index], ...updates } as Album
    }
  }

  function removeAlbum(id: string): void {
    const index = albums.value.findIndex(a => a.id === id)
    if (index !== -1) {
      albums.value.splice(index, 1)
    }
  }

  return {
    albums,
    loading,
    error,
    fetchAlbums,
    addAlbum,
    updateAlbum,
    removeAlbum,
  }
})
