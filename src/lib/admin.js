export async function carregarEquipamentos({ supabase }) {
  const { data, error } = await supabase.from('equipamentos').select('*')
  if (error) throw error
  return [...(data || [])].sort((a, b) => a.id - b.id)
}

export async function salvarNovo({ supabase }, equipamento) {
  const { error } = await supabase.from('equipamentos').insert([equipamento])
  if (error) throw error
  return true
}

export async function deletarEquipamento({ supabase }, id) {
  const { error } = await supabase.from('equipamentos').delete().eq('id', id)
  if (error) throw error
  return true
}
