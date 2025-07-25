import React, { useEffect } from 'react'
import { supabase } from '../lib/supabase'

const Checklist = ({ equipamentos, modoAdmin, editados, editarCampo }) => {
  // Agrupa equipamentos por categoria
  const categorias = equipamentos.reduce((acc, eq) => {
    if (!acc[eq.categoria]) acc[eq.categoria] = []
    acc[eq.categoria].push(eq)
    return acc
  }, {})

  // Renderiza um campo (editável ou não)
  const renderCampo = (item, campo) => {
    const valor = editados[item.id]?.[campo] ?? item[campo]
    return modoAdmin ? (
      <input
        type="text"
        className="border border-gray-300 rounded px-2 py-1 w-full"
        value={valor}
        onChange={(e) => editarCampo(item.id, campo, e.target.value)}
      />
    ) : (
      <span>{valor}</span>
    )
  }

  useEffect(() => {
    document.title = "Equipamentos - Brick"
  }, [])

  return (
    <div className="space-y-8">
      {Object.entries(categorias).map(([categoria, itens]) => (
        <div key={categoria}>
          <h2 className="text-xl font-bold text-gray-700 mb-2">{categoria}</h2>
          <table className="w-full table-auto border border-gray-300 bg-white shadow-sm text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 border">Nome</th>
                <th className="px-2 py-1 border">Marca</th>
                <th className="px-2 py-1 border">Qtd</th>
                <th className="px-2 py-1 border">Observações</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border px-2 py-1">{renderCampo(item, 'nome')}</td>
                  <td className="border px-2 py-1">{renderCampo(item, 'marca')}</td>
                  <td className="border px-2 py-1">{renderCampo(item, 'quantidade')}</td>
                  <td className="border px-2 py-1">{renderCampo(item, 'observacoes')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

export default Checklist
