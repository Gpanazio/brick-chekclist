import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { supabase } from '@/lib/supabase.js'
import { fetchEquipamentos } from '@/lib/fetchEquipamentos.js'
import Layout from '@/components/Layout.jsx'
import ChecklistPage from '@/pages/ChecklistPage.jsx'
import HistoryPage from '@/pages/HistoryPage.jsx'
import AdminPage from '@/pages/AdminPage.jsx'
import QuickSearch from './QuickSearch.jsx'
import './App.css'

function App() {
  const [equipamentos, setEquipamentos] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [progresso, setProgresso] = useState({ checados: 0, total: 0 })

  // Carregar dados
  const carregarEquipamentos = () =>
    fetchEquipamentos({ supabase }).then(setEquipamentos)

  useEffect(() => {
    carregarEquipamentos()
  }, [])

  // Atualizar progresso sempre que equipamentos mudarem
  useEffect(() => {
    const checados = equipamentos.reduce((sum, eq) => {
      if (eq.checado) {
        return sum + (eq.quantidadeLevando || 0)
      }
      return sum
    }, 0)
    const totalItensUnicos = equipamentos.length
    setProgresso({ checados, total: totalItensUnicos })
  }, [equipamentos])

  // Atalho de teclado para busca (Ctrl+J)
  useEffect(() => {
    const down = (e) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Funções de manipulação do estado global dos equipamentos
  const salvarNoCache = (novosEquipamentos) => {
    localStorage.setItem('equipamentos-checklist', JSON.stringify(novosEquipamentos))
  }

  const alternarEquipamento = (id) => {
    const novos = equipamentos.map(eq => 
      eq.id === id ? { ...eq, checado: !eq.checado } : eq
    )
    setEquipamentos(novos)
    salvarNoCache(novos)
  }

  const alterarQuantidadeLevando = (id, novaQtd) => {
    const eq = equipamentos.find(e => e.id === id)
    if (novaQtd >= 0 && novaQtd <= eq.quantidade) {
      const novos = equipamentos.map(e => 
        e.id === id ? { ...e, quantidadeLevando: novaQtd, checado: novaQtd > 0 } : e
      )
      setEquipamentos(novos)
      salvarNoCache(novos)
    }
  }

  const resetarTodos = () => {
    const novos = equipamentos.map(eq => ({
      ...eq,
      checado: false,
      quantidadeLevando: eq.quantidade > 1 ? 0 : eq.quantidade
    }))
    setEquipamentos(novos)
    salvarNoCache(novos)
  }

  // Helpers para busca
  const getCategoriaId = (nome) => `cat-${nome.replace(/\s+/g, '-')}`

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout progresso={progresso} setSearchOpen={setSearchOpen} />}>
          <Route 
            index 
            element={
              <ChecklistPage 
                equipamentos={equipamentos}
                alternarEquipamento={alternarEquipamento}
                alterarQuantidadeLevando={alterarQuantidadeLevando}
                resetarTodos={resetarTodos}
              />
            } 
          />
          <Route path="historico" element={<HistoryPage />} />
          <Route 
            path="admin" 
            element={<AdminPage onEquipamentosChanged={carregarEquipamentos} />} 
          />
        </Route>
      </Routes>

      <QuickSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        equipamentos={equipamentos}
        onSelect={(id) => {
          alternarEquipamento(id)
          setSearchOpen(false)
          // Pequeno delay para permitir a navegação/renderização se necessário
          setTimeout(() => {
            const eq = equipamentos.find(e => e.id === id)
            if (eq) {
              const el = document.getElementById(getCategoriaId(eq.categoria))
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }, 100)
        }}
      />
    </BrowserRouter>
  )
}

export default App
