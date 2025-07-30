import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase.js'

function AdminEquipamentos() {
  const [equipamentos, setEquipamentos] = useState([])
  const [novo, setNovo] = useState({
    categoria: '',
    descricao: '',
    quantidade: 1,
    estado: 'BOM',
    observacoes: ''
  })

  useEffect(() => {
    carregarEquipamentos()
  }, [])

  const carregarEquipamentos = async () => {
    const { data, error } = await supabase
      .from('equipamentos')
      .select('*')
      .order('id')
    if (!error) {
      setEquipamentos(data)
    }
  }

  const salvarNovo = async () => {
    const senha = prompt('Digite a senha:')
    if (senha !== 'Brick$2016') return alert('Senha incorreta')
    const { error } = await supabase.from('equipamentos').insert([novo])
    if (!error) {
      setNovo({ categoria: '', descricao: '', quantidade: 1, estado: 'BOM', observacoes: '' })
      carregarEquipamentos()
    }
  }

  const atualizarEquipamento = async (equip) => {
    const senha = prompt('Digite a senha:')
    if (senha !== 'Brick$2016') return alert('Senha incorreta')
    const { error } = await supabase
      .from('equipamentos')
      .update({
        categoria: equip.categoria,
        descricao: equip.descricao,
        quantidade: equip.quantidade,
        estado: equip.estado,
        observacoes: equip.observacoes
      })
      .eq('id', equip.id)
    if (!error) {
      carregarEquipamentos()
    }
  }

  const deletarEquipamento = async (id) => {
    const senha = prompt('Digite a senha:')
    if (senha !== 'Brick$2016') return alert('Senha incorreta')
    const { error } = await supabase.from('equipamentos').delete().eq('id', id)
    if (!error) {
      carregarEquipamentos()
    }
  }

  const atualizarLocal = (id, campo, valor) => {
    setEquipamentos(prev => prev.map(eq => (eq.id === id ? { ...eq, [campo]: valor } : eq)))
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Administração de Equipamentos</h2>

      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder="Categoria"
          value={novo.categoria}
          onChange={(e) => setNovo({ ...novo, categoria: e.target.value })}
        />
        <input
          placeholder="Descrição"
          value={novo.descricao}
          onChange={(e) => setNovo({ ...novo, descricao: e.target.value })}
        />
        <input
          type="number"
          placeholder="Quantidade"
          value={novo.quantidade}
          onChange={(e) => setNovo({ ...novo, quantidade: parseInt(e.target.value) || 1 })}
        />
        <input
          placeholder="Estado"
          value={novo.estado}
          onChange={(e) => setNovo({ ...novo, estado: e.target.value })}
        />
        <input
          placeholder="Observações"
          value={novo.observacoes}
          onChange={(e) => setNovo({ ...novo, observacoes: e.target.value })}
        />
      </div>
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={salvarNovo}>
        Adicionar
      </button>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead>
            <tr>
              <th className="p-2 border">Categoria</th>
              <th className="p-2 border">Descrição</th>
              <th className="p-2 border">Qtd.</th>
              <th className="p-2 border">Estado</th>
              <th className="p-2 border">Observações</th>
              <th className="p-2 border">Ações</th>
            </tr>
          </thead>
          <tbody>
            {equipamentos.map((eq) => (
              <tr key={eq.id} className="odd:bg-gray-50">
                <td className="p-1 border">
                  <input
                    className="w-full"
                    value={eq.categoria}
                    onChange={(e) => atualizarLocal(eq.id, 'categoria', e.target.value)}
                  />
                </td>
                <td className="p-1 border">
                  <input
                    className="w-full"
                    value={eq.descricao}
                    onChange={(e) => atualizarLocal(eq.id, 'descricao', e.target.value)}
                  />
                </td>
                <td className="p-1 border">
                  <input
                    type="number"
                    className="w-16"
                    value={eq.quantidade}
                    onChange={(e) => atualizarLocal(eq.id, 'quantidade', parseInt(e.target.value) || 1)}
                  />
                </td>
                <td className="p-1 border">
                  <input
                    className="w-full"
                    value={eq.estado}
                    onChange={(e) => atualizarLocal(eq.id, 'estado', e.target.value)}
                  />
                </td>
                <td className="p-1 border">
                  <input
                    className="w-full"
                    value={eq.observacoes || ''}
                    onChange={(e) => atualizarLocal(eq.id, 'observacoes', e.target.value)}
                  />
                </td>
                <td className="p-1 border space-x-2">
                  <button
                    className="bg-green-600 text-white px-2 py-1 rounded"
                    onClick={() => atualizarEquipamento(eq)}
                  >
                    Salvar
                  </button>
                  <button
                    className="bg-red-600 text-white px-2 py-1 rounded"
                    onClick={() => deletarEquipamento(eq.id)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminEquipamentos
