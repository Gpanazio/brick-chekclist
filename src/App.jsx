import React, { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Checklist de Equipamentos Brick</h1>
        {!modoAdmin && (
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={ativarModoAdmin}>
            Modo Administrador
          </button>
        )}
      </div>

      <table className="w-full text-left border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Categoria</th>
            <th className="p-2">Descrição</th>
            <th className="p-2">Qtd</th>
            <th className="p-2">Estado</th>
            <th className="p-2">Obs</th>
          </tr>
        </thead>
        <tbody>
          {equipamentos.map(eq => (
            <tr key={eq.id} className="border-t">
              {['categoria', 'descricao', 'quantidade', 'estado', 'observacoes'].map(campo => (
                <td key={campo} className="p-2">
                  {modoAdmin ? (
                    <input
                      className="w-full border px-1 py-0.5 text-sm"
                      value={editados[eq.id]?.[campo] ?? eq[campo]}
                      onChange={e => editarCampo(eq.id, campo, e.target.value)}
                    />
                  ) : (
                    eq[campo]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {modoAdmin && (
        <div className="mt-4 text-right">
          <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={salvarAlteracoes}>
            Salvar Alterações
          </button>
        </div>
      )}
    </div>
  )
}

export default App
