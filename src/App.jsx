import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Checklist from './components/Checklist'

function App() {
  const [equipamentos, setEquipamentos] = useState([])
  const [modoAdmin, setModoAdmin] = useState(false)
  const [editados, setEditados] = useState({})

  useEffect(() => {
    carregarEquipamentos()
    console.log("Arquivo App.jsx atualizado!");
  }, [])

  const carregarEquipamentos = async () => {
    const { data, error } = await supabase.from('equipamentos').select('*').order('id')
    if (!error) setEquipamentos(data)
  }

  const ativarModoAdmin = () => {
    const senha = prompt('Digite a senha de administrador:')
    if (senha === 'Brick$2016') {
      setModoAdmin(true)
    } else {
      alert('Senha incorreta!')
    }
  }

  const editarCampo = (id, campo, valor) => {
    setEditados(prev => ({
      ...prev,
      [id]: { ...prev[id], [campo]: valor }
    }))
  }

  const salvarAlteracoes = async () => {
    const atualizacoes = Object.entries(editados).map(([id, campos]) => ({
      id: parseInt(id),
      ...campos
    }))

    for (let item of atualizacoes) {
      await supabase.from('equipamentos').update(item).eq('id', item.id)
    }

    alert('Alterações salvas com sucesso.')
    setModoAdmin(false)
    setEditados({})
    carregarEquipamentos()
  }

  return (
    <div className="min-h-screen bg-[#f5f8ff] p-6">
      <div className="flex justify-between items-center mb-4">
        <img src="/logo.png" alt="BRICK" className="h-10" />
        <div className="flex gap-2">
          <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
            Checklist
          </button>
          <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
            Histórico
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={ativarModoAdmin}
          >
            Modo Administrador (debug)
          </button>
        </div>
      </div>

      <Checklist
        equipamentos={equipamentos}
        modoAdmin={modoAdmin}
        editados={editados}
        editarCampo={editarCampo}
      />
    </div>
  )
}

export default App
