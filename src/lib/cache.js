import { toast } from 'sonner'

export function sincronizarCacheEquipamentos(cacheKey, listaAtual) {
  try {
    const cache = JSON.parse(localStorage.getItem(cacheKey) || '[]')
    const data = listaAtual || []

    if (!deepEqualById(cache, data)) {
      localStorage.setItem(cacheKey, JSON.stringify(data))
      if (cache.length) toast('Lista de equipamentos atualizada')
    }
    return true
  } catch (err) {
    console.error('Erro ao sincronizar cache de equipamentos:', err)
    toast.error('Erro ao sincronizar cache de equipamentos. Verifique manualmente.')
    return false
  }
}

function deepEqualById(a, b) {
  const sortById = (list) =>
    [...list].sort((x, y) => {
      if (x.id < y.id) return -1
      if (x.id > y.id) return 1
      return 0
    })

  const sortedA = sortById(a)
  const sortedB = sortById(b)

  if (sortedA.length !== sortedB.length) return false

  for (let i = 0; i < sortedA.length; i++) {
    const itemA = sortedA[i]
    const itemB = sortedB[i]
    if (JSON.stringify(itemA) !== JSON.stringify(itemB)) return false
  }

  return true
}
