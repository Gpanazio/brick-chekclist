import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase.js'

function Checklist() {
  const [equipamentos, setEquipamentos] = useState([])
  const [selecionados, setSelecionados] = useState({})

  useEffect(() => {
    carregarEquipamentos()
  }, [])

  const carregarEquipamentos = async () => {
    const { data, error } = await supabase.from('equipamentos').select('*')
    if (!error) {
      setEquipamentos(data)
    }
  }

  const toggleItem = (id) => {
    setSelecionados(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Checklist de Equipamentos</h2>
      <ul className="space-y-2">
        {equipamentos.map(eq => (
          <li key={eq.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selecionados[eq.id] || false}
              onChange={() => toggleItem(eq.id)}
            />
            <span>{eq.descricao} ({eq.quantidade})</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Checklist
