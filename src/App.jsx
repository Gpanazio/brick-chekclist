import React, { useState, useEffect } from 'react'
import { Button, buttonVariants } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { CheckCircle, RotateCcw, FileText, Minus, Plus, History, Trash2, Search, ArrowUpDown, Camera, FileDown, ChevronDown } from 'lucide-react'
import AdminEquipamentos from './AdminEquipamentos.jsx'
import QuickSearch from './QuickSearch.jsx'
import logoBrick from './assets/02.png'
import { gerarChecklistPDF } from '@/lib/pdf.js'
import { supabase } from '@/lib/supabase.js'
import { fetchEquipamentos } from '@/lib/fetchEquipamentos.js'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog.jsx'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog.jsx'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible.jsx'
import { toast } from 'sonner'
import './App.css'

const ORDEM_CATEGORIAS_STORAGE_KEY = 'ordem-categorias-checklist'

function App() {
  const [equipamentos, setEquipamentos] = useState([])
  const [progresso, setProgresso] = useState({ checados: 0, total: 0 })
  const [abaAtiva, setAbaAtiva] = useState("checklist") // 'checklist', 'logs' ou 'admin'
  const [logs, setLogs] = useState([])
  const [carregandoLogs, setCarregandoLogs] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [filtroInicio, setFiltroInicio] = useState('')
  const [filtroFim, setFiltroFim] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [responsavel, setResponsavel] = useState('')
  const [dataJob, setDataJob] = useState('')
  const [deleteLogOpen, setDeleteLogOpen] = useState(false)
  const [deleteLogPwd, setDeleteLogPwd] = useState('')
  const [logSelecionado, setLogSelecionado] = useState(null)
  const [ordemCategorias, setOrdemCategorias] = useState({})

  const carregarEquipamentos = () =>
    fetchEquipamentos({ supabase }).then(setEquipamentos)

  // Carregar dados dos equipamentos
  useEffect(() => {
    carregarEquipamentos()
  }, [])

  // Atalho de teclado para busca (Ctrl+J ou Cmd+J)
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

  useEffect(() => {
    try {
      const armazenado = localStorage.getItem(ORDEM_CATEGORIAS_STORAGE_KEY)
      if (armazenado) {
        const parsed = JSON.parse(armazenado)
        if (parsed && typeof parsed === 'object') {
          setOrdemCategorias(parsed)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar ordem das categorias:', error)
    }
  }, [])

  // Atualizar progresso
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

  const salvarAutomaticamente = (novosEquipamentos) => {
    localStorage.setItem('equipamentos-checklist', JSON.stringify(novosEquipamentos))
  }

  useEffect(() => {
    try {
      localStorage.setItem(ORDEM_CATEGORIAS_STORAGE_KEY, JSON.stringify(ordemCategorias))
    } catch (error) {
      console.error('Erro ao salvar ordem das categorias:', error)
    }
  }, [ordemCategorias])

  // Resetar todos os checkboxes
  const resetarTodos = () => {
    const equipamentosResetados = equipamentos.map(eq => ({
      ...eq,
      checado: false,
      quantidadeLevando: eq.quantidade > 1 ? 0 : eq.quantidade
    }))
    setEquipamentos(equipamentosResetados)
    salvarAutomaticamente(equipamentosResetados)
    toast.success('Todos os itens foram desmarcados')
    setResetOpen(false)
  }

  const alternarEquipamento = (id) => {
    const novosEquipamentos = equipamentos.map(eq => 
      eq.id === id ? { ...eq, checado: !eq.checado } : eq
    )
    setEquipamentos(novosEquipamentos)
    salvarAutomaticamente(novosEquipamentos)
  }

  const alterarQuantidadeLevando = (id, novaQuantidade) => {
    const equipamento = equipamentos.find(eq => eq.id === id)
    if (novaQuantidade >= 0 && novaQuantidade <= equipamento.quantidade) {
      const novosEquipamentos = equipamentos.map(eq => 
        eq.id === id ? { ...eq, quantidadeLevando: novaQuantidade, checado: novaQuantidade > 0 } : eq
      )
      setEquipamentos(novosEquipamentos)
      salvarAutomaticamente(novosEquipamentos)
    }
  }

  // Logs e Supabase
  const carregarLogs = async () => {
    setCarregandoLogs(true)
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('data_exportacao', { ascending: false })
      
      if (error) {
        console.error('Erro ao carregar logs:', error)
        toast.error('Erro ao carregar histórico de logs')
      } else {
        setLogs(data || [])
      }
    } catch (error) {
      console.error('Erro ao conectar com o Supabase:', error)
      toast.error('Erro ao conectar com o banco de dados')
    } finally {
      setCarregandoLogs(false)
    }
  }

  useEffect(() => {
    if (abaAtiva === 'logs') {
      carregarLogs()
    }
  }, [abaAtiva])

  const salvarLogSupabase = async (responsavel, dataJob, equipamentosChecados) => {
    try {
      const { error } = await supabase
        .from('logs')
        .insert([
          {
            responsavel,
            data_job: dataJob,
            itens_checados: equipamentosChecados,
            total_itens: equipamentos.length,
            total_checados: equipamentosChecados.length
          }
        ])
      
      if (error) throw error
    } catch (error) {
      console.error('Erro ao salvar log:', error)
      toast.error('Erro ao salvar log no banco de dados')
    }
  }

  const handleDeleteLog = async () => {
    if (!logSelecionado) return
    if (deleteLogPwd !== import.meta.env.VITE_ADMIN_PASSWORD) {
      toast.error('Senha incorreta!')
      return
    }

    try {
      const { error } = await supabase.from('logs').delete().eq('id', logSelecionado.id)
      if (error) {
        toast.error('Erro ao deletar log')
      } else {
        setLogs(logs.filter(log => log.id !== logSelecionado.id))
        toast.success('Log deletado com sucesso!')
        setDeleteLogOpen(false)
        setDeleteLogPwd('')
        setLogSelecionado(null)
      }
    } catch (error) {
      toast.error('Erro ao conectar com o banco de dados')
    }
  }

  const gerarPDFDoLog = (log) => {
    gerarChecklistPDF({
      responsavel: log.responsavel,
      dataJob: log.data_job,
      itens: log.itens_checados || [],
      totalChecados: log.total_checados,
      dataOriginal: log.data_exportacao,
      nomeArquivo: `checklist-${log.responsavel.replace(/\s+/g, '-')}-${log.data_job.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
    })
  }

  const exportarPDF = () => {
    if (!responsavel || !dataJob) {
      toast.error('Preencha Responsável e Data/Job')
      return
    }

    const equipamentosChecados = equipamentos.filter(eq => eq.checado)
    if (equipamentosChecados.length === 0) {
      toast.error('Nenhum item selecionado!')
      return
    }

    salvarLogSupabase(responsavel, dataJob, equipamentosChecados)

    gerarChecklistPDF({
      responsavel,
      dataJob,
      itens: equipamentosChecados,
      totalChecados: equipamentosChecados.length,
      nomeArquivo: `checklist-equipamentos-${new Date().toISOString().split('T')[0]}.pdf`
    })
    setExportOpen(false)
    setResponsavel('')
    setDataJob('')
    toast.success('PDF gerado e log salvo!')
  }

  // Agrupar e Ordenar
  const equipamentosPorCategoria = equipamentos.reduce((acc, eq) => {
    if (!acc[eq.categoria]) acc[eq.categoria] = []
    acc[eq.categoria].push(eq)
    return acc
  }, {})

  const categorias = Object.keys(equipamentosPorCategoria).sort()
  const getCategoriaId = (nome) => `cat-${nome.replace(/\s+/g, '-')}`

  const alternarOrdem = (categoria) => {
    setOrdemCategorias((prev) => {
      const proxima = prev[categoria] === 'asc' ? 'desc' : 'asc'
      return { ...prev, [categoria]: proxima }
    })
  }

  const logsFiltrados = logs.filter((log) => {
    const data = new Date(log.data_exportacao)
    if (filtroInicio && data < new Date(filtroInicio)) return false
    if (filtroFim && data > new Date(filtroFim)) return false
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* Cabeçalho Fixo (Sticky) */}
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
            {/* Espaço para toggle theme ou user menu no futuro */}
          </div>

          {/* Linha 2: Busca e Navegação */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Botão de Busca (Fake Input) */}
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

            {/* Abas de Navegação (Segmented Control style) */}
            <div className="flex p-1 bg-gray-100 rounded-lg shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setAbaAtiva('checklist')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  abaAtiva === 'checklist' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-4 h-4" /> Checklist
              </button>
              <button
                onClick={() => setAbaAtiva('logs')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  abaAtiva === 'logs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <History className="w-4 h-4" /> Histórico
              </button>
              <button
                onClick={() => setAbaAtiva('admin')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  abaAtiva === 'admin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Camera className="w-4 h-4" /> ADMIN
              </button>
            </div>
          </div>

          {/* Linha 3: Barra de Progresso (apenas no Checklist) */}
          {abaAtiva === 'checklist' && (
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

      <div className="max-w-5xl mx-auto p-4 pt-6">
        
        {/* Conteúdo: CHECKLIST */}
        {abaAtiva === 'checklist' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Ações Rápidas */}
            <div className="flex flex-wrap gap-2 mb-6 items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <div className="text-sm font-medium text-gray-600 pl-2">Ações Rápidas:</div>
              <div className="flex gap-2">
                <Dialog open={exportOpen} onOpenChange={(o) => { setExportOpen(o); if (!o) { setResponsavel(''); setDataJob(''); } }}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                      <FileDown className="w-4 h-4 mr-2" />
                      Exportar PDF
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Exportar PDF</DialogTitle>
                      <DialogDescription>Informe os dados para gerar o PDF.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase">Responsável</label>
                        <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Ex: João Silva" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase">Job / Data</label>
                        <Input value={dataJob} onChange={(e) => setDataJob(e.target.value)} placeholder="Ex: Comercial Coca-Cola - 25/10" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setExportOpen(false)}>Cancelar</Button>
                      <Button onClick={exportarPDF} className="bg-blue-600 hover:bg-blue-700 text-white">Gerar PDF</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Limpar Tudo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>Isso irá desmarcar todos os itens da lista atual.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction onClick={resetarTodos} className="bg-red-600 hover:bg-red-700 text-white">Sim, limpar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Navegação Rápida de Categorias */}
            <Card className="mb-8 border-none shadow-sm bg-white/50">
              <CardContent className="flex flex-wrap gap-2 p-4">
                {categorias.map((cat) => (
                  <Badge
                    key={cat}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors px-3 py-1 text-sm font-normal text-gray-600 bg-white"
                    onClick={() =>
                      document
                        .getElementById(getCategoriaId(cat))
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  >
                    {cat}
                  </Badge>
                ))}
              </CardContent>
            </Card>

            {/* Listagem */}
            <div className="space-y-8">
              {categorias.map((categoria) => {
                const itens = equipamentosPorCategoria[categoria]
                const ordemAtual = ordemCategorias[categoria] ?? 'asc'
                const itensOrdenados = [...itens].sort((a, b) => {
                  const comp = a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' })
                  return ordemAtual === 'asc' ? comp : -comp
                })

                return (
                  <Card
                    key={categoria}
                    id={getCategoriaId(categoria)}
                    className="overflow-hidden border-gray-200 shadow-sm scroll-mt-32"
                  >
                    <Collapsible defaultOpen className="group/collapsible">
                      <CardHeader className="bg-gray-50/80 py-3 px-4 border-b border-gray-100 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-bold text-gray-800">{categoria}</CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-gray-600"
                            onClick={() => alternarOrdem(categoria)}
                          >
                            <ArrowUpDown className={`h-3 w-3 transition-transform ${ordemAtual === 'desc' ? 'rotate-180' : ''}`} />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-white border-gray-200 text-gray-600 font-normal">
                            {itens.filter(item => item.checado).length} / {itens.length}
                          </Badge>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/50">
                              <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                              <span className="sr-only">Toggle</span>
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent className="p-0">
                          <div className="divide-y divide-gray-100">
                            {itensOrdenados.map(equipamento => (
                              <div
                                key={equipamento.id}
                                className={`group p-3 sm:p-4 flex items-start sm:items-center gap-3 transition-all duration-200 ${
                                  equipamento.checado ? 'bg-blue-50/40' : 'hover:bg-gray-50'
                                }`}
                              >
                                <Checkbox
                                  checked={equipamento.checado}
                                  onCheckedChange={() => alternarEquipamento(equipamento.id)}
                                  className="mt-1 sm:mt-0 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-sm font-medium leading-tight ${equipamento.checado ? 'text-gray-500 line-through decoration-gray-300' : 'text-gray-900'}`}>
                                      {equipamento.descricao}
                                    </span>
                                    {equipamento.checado && (
                                      <CheckCircle className="w-3.5 h-3.5 text-blue-500 animate-in zoom-in spin-in-12 duration-300" />
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1.5 text-xs text-gray-500">
                                    {/* Controle de Quantidade */}
                                    {equipamento.quantidade > 1 ? (
                                      <div className="flex items-center gap-2 bg-white rounded-md border border-gray-200 px-1.5 py-0.5 shadow-sm">
                                        <span className="text-[10px] uppercase font-semibold text-gray-400">Levando</span>
                                        <div className="flex items-center gap-1">
                                          <button
                                            className="h-5 w-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30"
                                            onClick={() => alterarQuantidadeLevando(equipamento.id, equipamento.quantidadeLevando - 1)}
                                            disabled={equipamento.quantidadeLevando <= 0}
                                          >
                                            <Minus className="w-3 h-3" />
                                          </button>
                                          <span className="font-mono font-medium w-4 text-center text-gray-900">
                                            {equipamento.quantidadeLevando}
                                          </span>
                                          <button
                                            className="h-5 w-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30"
                                            onClick={() => alterarQuantidadeLevando(equipamento.id, equipamento.quantidadeLevando + 1)}
                                            disabled={equipamento.quantidadeLevando >= equipamento.quantidade}
                                          >
                                            <Plus className="w-3 h-3" />
                                          </button>
                                        </div>
                                        <span className="text-gray-400">/ {equipamento.quantidade}</span>
                                      </div>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-200 text-gray-500 font-normal">
                                        Qtd: {equipamento.quantidade}
                                      </Badge>
                                    )}

                                    {/* Estado e Obs */}
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                                        equipamento.estado === 'BOM' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                                        equipamento.estado === 'REGULAR' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : 
                                        'bg-red-50 text-red-700 ring-red-600/10'
                                      }`}>
                                        {equipamento.estado}
                                      </span>
                                      
                                      {equipamento.observacoes && (
                                        <span className="text-gray-400 truncate max-w-[150px] sm:max-w-xs" title={equipamento.observacoes}>
                                          • {equipamento.observacoes}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Conteúdo: LOGS */}
        {abaAtiva === 'logs' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="border-none shadow-md">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Histórico</span>
                  <Button onClick={carregarLogs} variant="ghost" size="sm" disabled={carregandoLogs}>
                    <RotateCcw className={`w-4 h-4 mr-2 ${carregandoLogs ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <Input 
                    type="date" 
                    className="w-auto" 
                    value={filtroInicio} 
                    onChange={(e) => setFiltroInicio(e.target.value)} 
                  />
                  <span className="text-gray-400">até</span>
                  <Input 
                    type="date" 
                    className="w-auto" 
                    value={filtroFim} 
                    onChange={(e) => setFiltroFim(e.target.value)} 
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {carregandoLogs ? (
                  <div className="text-center py-12 text-gray-500">Carregando registros...</div>
                ) : logsFiltrados.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">Nenhum histórico encontrado para o período.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {logsFiltrados.map(log => (
                      <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{log.data_job}</span>
                            <Badge variant="outline" className="text-xs font-normal text-gray-500 bg-white">
                              {new Date(log.data_exportacao).toLocaleDateString('pt-BR')}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            Responsável: <span className="font-medium">{log.responsavel}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {log.total_checados} itens selecionados
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => gerarPDFDoLog(log)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1.5" /> PDF
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setLogSelecionado(log); setDeleteLogOpen(true) }}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Conteúdo: ADMIN */}
        {abaAtiva === 'admin' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <AdminEquipamentos onEquipamentosChanged={carregarEquipamentos} />
          </div>
        )}

        {/* Rodapé e Botão de Exportar no Final */}
        {abaAtiva === 'checklist' && (
          <div className="mt-8 mb-6 text-center">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg w-full sm:w-auto px-8 py-6 text-lg mb-8"
              onClick={() => setExportOpen(true)}
            >
              <FileDown className="w-6 h-6 mr-2" />
              Finalizar e Exportar PDF
            </Button>
          </div>
        )}

        <div className="mt-4 mb-6 text-center">
          <p className="text-xs text-gray-400">Sistema de Checklist Brick • v1.0.4</p>
        </div>
      </div>

      {/* Modais Globais */}
      <AlertDialog open={deleteLogOpen} onOpenChange={(o) => { setDeleteLogOpen(o); if (!o) { setDeleteLogPwd(''); setLogSelecionado(null) } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita. Digite a senha de administrador.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input type="password" value={deleteLogPwd} onChange={(e) => setDeleteLogPwd(e.target.value)} placeholder="Senha" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteLog}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QuickSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        equipamentos={equipamentos}
        onSelect={(id) => {
          alternarEquipamento(id)
          setSearchOpen(false)
          // Tenta rolar até o item
          setTimeout(() => {
            const el = document.getElementById(getCategoriaId(equipamentos.find(e => e.id === id)?.categoria || ''))
            if (el) el.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }}
      />
    </div>
  )
}

export default App
