import React, { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function AdminEquipamentos() {
  const [equipamentos, setEquipamentos] = useState([])
  const [novo, setNovo] = useState({ categoria: '', descricao: '', quantidade: 1, estado: 'BOM', observacoes: '' })

  useEffect(() => {
    carregarEquipamentos()
  }, [])

  const carregarEquipamentos = async () => {
    const { data, error } = await supabase.from('equipamentos').select('*').order('id')
    if (!error) setEquipamentos(data)
  }

  const salvar = async () => {
    const senha = prompt('Digite a senha:')
    if (senha !== 'Brick$2016') return alert('Senha incorreta')
    const { error } = await supabase.from('equipamentos').insert([novo])
    if (!error) {
      setNovo({ categoria: '', descricao: '', quantidade: 1, estado: 'BOM', observacoes: '' })
      carregarEquipamentos()
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Administração</h2>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <input placeholder="Categoria" value={novo.categoria} onChange={e => setNovo({ ...novo, categoria: e.target.value })} />
        <input placeholder="Descrição" value={novo.descricao} onChange={e => setNovo({ ...novo, descricao: e.target.value })} />
        <input type="number" placeholder="Quantidade" value={novo.quantidade} onChange={e => setNovo({ ...novo, quantidade: parseInt(e.target.value) || 1 })} />
        <input placeholder="Estado" value={novo.estado} onChange={e => setNovo({ ...novo, estado: e.target.value })} />
        <input placeholder="Observações" value={novo.observacoes} onChange={e => setNovo({ ...novo, observacoes: e.target.value })} />
      </div>
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={salvar}>Salvar</button>
      <ul className="mt-6 space-y-2">
        {equipamentos.map(eq => (
          <li key={eq.id}>{eq.categoria} - {eq.descricao} ({eq.quantidade})</li>
        ))}
      </ul>
    </div>
  )
}

export default AdminEquipamentos
