import React, { useEffect, useState } from 'react'
import Checklist from './components/Checklist'
import { supabase } from './lib/supabase'
import './App.css'

export default function App() {
  const [equipamentos, setEquipamentos] = useState([])
  const [modoAdmin, setModoAdmin] = useState(false)
  console.log('modoAdmin:', modoAdmin)
  const [editados, setEditados] = useState({})

  useEffect(() => {
    carregarEquipamentos()
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

  const salvarAlteracoes = async () => {
    const updates = Object.entries(editados).map(([id, campos]) => ({
      id: parseInt(id),
      ...campos,
    }))

    const { error } = await supabase.from('equipamentos').upsert(updates)
    if (!error) {
      alert('Alterações salvas com sucesso!')
      setEditados({})
      carregarEquipamentos()
      setModoAdmin(false)
    } else {
      alert('Erro ao salvar alterações!')
    }
  }

  const editarCampo = (id, campo, valor) => {
    setEditados(prev => ({
      ...prev,
      [id]: { ...prev[id], [campo]: valor }
    }))
  }

  return (
    <div className="min-h-screen bg-[#f5f8ff] p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="BRICK" className="h-10" />
          <h1 className="text-2xl font-bold">Sistema de Checklist</h1>
        </div>
        <div className="flex gap-2">
          <button className="bg-white text-black px-4 py-2 rounded border">Checklist</button>
          <button className="bg-white text-black px-4 py-2 rounded border">Histórico</button>
          {!modoAdmin ? (
            <button
              className="bg-black text-white px-4 py-2 rounded"
              onClick={ativarModoAdmin}
            >
              Modo Administrador
            </button>
          ) : (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={salvarAlteracoes}
            >
              Salvar Alterações
            </button>
          )}
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
