import React, { useEffect, useState } from 'react'
import Checklist from './components/Checklist'
import { supabase } from './lib/supabase'
import { Button } from './components/ui/button'
import './App.css'

export default function App() {
  const [equipamentos, setEquipamentos] = useState([])
  const [modoAdmin, setModoAdmin] = useState(false)
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
          <Button variant="outline">Checklist</Button>
          <Button variant="outline">Histórico</Button>

          {!modoAdmin ? (
            <Button onClick={ativarModoAdmin}>Modo Administrador</Button>
          ) : (
            <Button onClick={salvarAlteracoes} className="bg-green-600 hover:bg-green-700 text-white">
              Salvar Alterações
            </Button>
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
