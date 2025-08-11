import equipamentosData from '../data/equipamentos.json' with { type: 'json' }

export function mergeEquipamentos(base = [], local = [], remote = []) {
  const map = new Map()
  base.forEach(eq => {
    map.set(eq.id, { ...eq })
  })
  local.forEach(eq => {
    const existing = map.get(eq.id)
    map.set(eq.id, existing ? { ...existing, ...eq } : { ...eq })
  })
  remote.forEach(eq => {
    const existing = map.get(eq.id)
    if (existing) {
      map.set(eq.id, {
        ...existing,
        ...eq,
        quantidadeLevando: existing.quantidadeLevando ?? eq.quantidadeLevando,
        checado: existing.checado ?? eq.checado,
      })
    } else {
      map.set(eq.id, { ...eq })
    }
  })
  return Array.from(map.values()).sort((a, b) => a.id - b.id)
}

export async function fetchEquipamentos({ supabase, storage = globalThis.localStorage } = {}) {
  const base = (equipamentosData || []).map(eq => ({
    ...eq,
    quantidadeLevando: eq.quantidade > 1 ? 0 : eq.quantidade,
    checado: false,
  }))

  const local = JSON.parse(storage.getItem('equipamentos-checklist') || '[]')
  let remote = []

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('*')
        .order('id')

      if (error) throw error

      remote = (data || []).map(eq => ({
        ...eq,
        quantidadeLevando: eq.quantidade > 1 ? 0 : eq.quantidade,
        checado: false,
      }))
    } catch (err) {
      console.error('Erro ao carregar equipamentos do Supabase:', err)
      alert('Erro ao carregar equipamentos do servidor. Verificando dados locais.')
    }
  }

  const merged = mergeEquipamentos(base, local, remote)
  storage.setItem('equipamentos-checklist', JSON.stringify(merged))
  return merged
}
