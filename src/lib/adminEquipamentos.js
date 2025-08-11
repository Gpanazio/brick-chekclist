export async function loadEquipamentos({ supabase }) {
  const { data, error } = await supabase.from('equipamentos').select('*')
  if (error) throw error
  return (data || []).sort((a, b) => a.id - b.id)
}

export async function addEquipamento({ supabase }, equip) {
  const { error } = await supabase.from('equipamentos').insert([equip])
  if (error) throw error
}

export async function updateEquipamento({ supabase }, equip) {
  const { error } = await supabase
    .from('equipamentos')
    .update({
      categoria: equip.categoria,
      descricao: equip.descricao,
      quantidade: equip.quantidade,
      estado: equip.estado,
      observacoes: equip.observacoes,
    })
    .eq('id', equip.id)
  if (error) throw error
}

export async function deleteEquipamento({ supabase }, id) {
  const { error } = await supabase.from('equipamentos').delete().eq('id', id)
  if (error) throw error
}
