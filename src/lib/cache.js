export function sincronizarCacheEquipamentos(cacheKey, listaAtual) {
  try {
    const cache = JSON.parse(localStorage.getItem(cacheKey) || '[]')
    const cacheHash = JSON.stringify(cache)
    const dataHash = JSON.stringify(listaAtual || [])

    if (cacheHash !== dataHash) {
      localStorage.setItem(cacheKey, JSON.stringify(listaAtual))
      if (cache.length) alert('Lista de equipamentos atualizada')
    }
    return true
  } catch (err) {
    console.error('Erro ao sincronizar cache de equipamentos:', err)
    alert('Erro ao sincronizar cache de equipamentos. Verifique manualmente.')
    return false
  }
}
