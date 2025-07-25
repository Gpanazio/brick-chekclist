import React, { useState } from 'react'
import AdminEquipamentos from './AdminEquipamentos'
import Checklist from './Checklist'

function App() {
  const [modoAdmin, setModoAdmin] = useState(false)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sistema de Equipamentos Brick</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setModoAdmin(!modoAdmin)}
        >
          {modoAdmin ? 'Ver Checklist' : 'Modo Admin'}
        </button>
      </div>
      {modoAdmin ? <AdminEquipamentos /> : <Checklist />}
    </div>
  )
}

export default App
