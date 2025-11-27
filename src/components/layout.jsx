import React from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Search, FileText, History, Camera } from 'lucide-react'
import logoBrick from '@/assets/02.png'

export default function Layout({ progresso, setSearchOpen }) {
  const location = useLocation()
  const isChecklist = location.pathname === '/'

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Cabeçalho Fixo */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 space-y-3">
          
          {/* Linha 1: Logo e Título */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoBrick} alt="Brick" className="h-10 w-auto" />
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight hidden sm:block">
                CHECKLIST
              </h1>
            </div>
          </div>

          {/* Linha 2: Busca e Navegação */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Botão de Busca */}
            <Button 
              variant="outline" 
              className="flex-1 justify-start text-gray-500 bg-gray-50 hover:bg-white border-gray-200 h-10"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-4 h-4 mr-2 text-gray-400" />
              <span className="flex-1 text-left font-normal">Buscar equipamento...</span>
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>J
              </kbd>
            </Button>

            {/* Navegação (Abas) */}
            <nav className="flex p-1 bg-gray-100 rounded-lg shrink-0 self-start sm:self-auto">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                <FileText className="w-4 h-4" /> Checklist
              </NavLink>
              <NavLink
                to="/historico"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                <History className="w-4 h-4" /> Histórico
              </NavLink>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                <Camera className="w-4 h-4" /> Estoque
              </NavLink>
            </nav>
          </div>

          {/* Linha 3: Barra de Progresso (Visível apenas na Home) */}
          {isChecklist && (
            <div className="pt-1">
              <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                <span>Progresso da seleção</span>
                <span>{progresso.checados} de {progresso.total} itens</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500 ease-out" 
                  style={{ width: `${(progresso.checados / (progresso.total || 1)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo das Páginas */}
      <div className="max-w-5xl mx-auto p-4 pt-6">
        <Outlet />
      </div>

      <div className="mt-8 mb-6 text-center">
        <p className="text-xs text-gray-400">Sistema de Checklist Brick • v1.0.4</p>
      </div>
    </div>
  )
}
