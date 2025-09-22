import React, { useState, useEffect } from 'react'
import { Button, buttonVariants } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { CheckCircle, Upload, RotateCcw, FileText, Minus, Plus, History, Trash2, Search, ArrowUpDown } from 'lucide-react'
import AdminEquipamentos from './AdminEquipamentos.jsx'
import QuickSearch from './QuickSearch.jsx'
import logoBrick from './assets/02.png'
import { gerarChecklistPDF } from '@/lib/pdf.js'
import { supabase } from '@/lib/supabase.js'
import { fetchEquipamentos } from '@/lib/fetchEquipamentos.js'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog.jsx'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog.jsx'
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

  // Atualizar progresso quando equipamentos mudarem
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

  // Função para salvar automaticamente no localStorage
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
    toast('Itens desmarcados')
    setResetOpen(false)
  }

  // Alternar estado de um equipamento
  const alternarEquipamento = (id) => {
    const novosEquipamentos = equipamentos.map(eq => 
      eq.id === id ? { ...eq, checado: !eq.checado } : eq
    )
    setEquipamentos(novosEquipamentos)
    salvarAutomaticamente(novosEquipamentos) // Salvamento automático
  }

  // Alterar quantidade levando
  const alterarQuantidadeLevando = (id, novaQuantidade) => {
    const equipamento = equipamentos.find(eq => eq.id === id)
    if (novaQuantidade >= 0 && novaQuantidade <= equipamento.quantidade) {
      const novosEquipamentos = equipamentos.map(eq => 
        eq.id === id ? { ...eq, quantidadeLevando: novaQuantidade, checado: novaQuantidade > 0 } : eq
      )
      setEquipamentos(novosEquipamentos)
      salvarAutomaticamente(novosEquipamentos) // Salvamento automático
    }
  }

  // Carregar logs do Supabase
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

  // Carregar logs quando a aba de logs for ativada
  useEffect(() => {
    if (abaAtiva === 'logs') {
      carregarLogs()
    }
  }, [abaAtiva])

  // Salvar log no Supabase
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
      
      if (error) {
        console.error('Erro ao salvar log no Supabase:', error)
        toast.error('Erro ao salvar log no banco de dados')
      } else {
        console.log('Log salvo no Supabase com sucesso')
      }
    } catch (error) {
      console.error('Erro ao conectar com o Supabase para salvar log:', error)
      toast.error('Erro ao conectar com o banco de dados')
    }
  }

  // Deletar log do Supabase (com proteção por senha)
  const handleDeleteLog = async () => {
    if (!logSelecionado) return
    if (deleteLogPwd !== import.meta.env.VITE_ADMIN_PASSWORD) {
      toast.error('Senha incorreta!')
      return
    }

    try {
      const { error } = await supabase
        .from('logs')
        .delete()
        .eq('id', logSelecionado.id)

      if (error) {
        console.error('Erro ao deletar log:', error)
        toast.error('Erro ao deletar log')
      } else {
        setLogs(logs.filter(log => log.id !== logSelecionado.id))
        toast.success('Log deletado com sucesso!')
        setDeleteLogOpen(false)
        setDeleteLogPwd('')
        setLogSelecionado(null)
      }
    } catch (error) {
      console.error('Erro ao deletar log:', error)
      toast.error('Erro ao conectar com o banco de dados')
    }
  }

  // Gerar PDF a partir de um log existente
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

  // Exportar para PDF (apenas itens selecionados)
  const exportarPDF = () => {
    if (!responsavel || !dataJob) {
      toast.error('Preencha todos os campos')
      return
    }

    const equipamentosChecados = equipamentos.filter(eq => eq.checado)
    if (equipamentosChecados.length === 0) {
      toast.error('Nenhum item selecionado para exportar!')
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
  }

  // Agrupar equipamentos por categoria
  const equipamentosPorCategoria = equipamentos.reduce((acc, eq) => {
    if (!acc[eq.categoria]) {
      acc[eq.categoria] = []
    }
    acc[eq.categoria].push(eq)
    return acc
  }, {})

  const categorias = Object.keys(equipamentosPorCategoria)
  const getCategoriaId = (nome) => `cat-${nome.replace(/\s+/g, '-')}`

  const logsFiltrados = logs.filter((log) => {
    const data = new Date(log.data_exportacao)
    if (filtroInicio && data < new Date(filtroInicio)) return false
    if (filtroFim && data > new Date(filtroFim)) return false
    return true
  })

  const totalLogs = logsFiltrados.length
  const totalEquipamentosSelecionados = logsFiltrados.reduce(
    (sum, l) => sum + (l.total_checados || 0),
    0
  )

  const alternarOrdem = (categoria) => {
    setOrdemCategorias((ordensAnteriores) => {
      const proximaOrdem = ordensAnteriores[categoria] === 'asc' ? 'desc' : 'asc'
      return { ...ordensAnteriores, [categoria]: proximaOrdem }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={logoBrick}
              alt="BRICK Logo"
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Sistema de Checklist
              </h1>
            </div>
            <Button variant="outline" size="icon" onClick={() => setSearchOpen(true)}>
              <Search className="w-4 h-4" />
              <span className="sr-only">Buscar</span>
            </Button>
          </div>
          
          {/* Navegação por abas */}
          <div className="flex gap-2">
            <Button
              variant={abaAtiva === 'checklist' ? 'default' : 'outline'}
              onClick={() => setAbaAtiva('checklist')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Checklist
            </Button>
          <Button
            variant={abaAtiva === 'logs' ? 'default' : 'outline'}
            onClick={() => setAbaAtiva('logs')}
          >
            <History className="w-4 h-4 mr-2" />
            Histórico
          </Button>
          <Button
            variant={abaAtiva === 'admin' ? 'default' : 'outline'}
            onClick={() => setAbaAtiva('admin')}
          >
            <Upload className="w-4 h-4 mr-2" />
            Admin
          </Button>
        </div>
      </div>

        {/* Conteúdo da aba Checklist */}
        {abaAtiva === 'checklist' && (
          <>
          <div className="flex gap-2 mb-6">
            <Dialog open={exportOpen} onOpenChange={(o) => { setExportOpen(o); if (!o) { setResponsavel(''); setDataJob(''); } }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Exportar PDF</DialogTitle>
                  <DialogDescription>Informe os dados para gerar o PDF.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Responsável" />
                  <Input value={dataJob} onChange={(e) => setDataJob(e.target.value)} placeholder="Data ou Nome do Job" />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button onClick={exportarPDF}>Exportar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resetar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Desmarcar todos?</AlertDialogTitle>
                  <AlertDialogDescription>Essa ação irá desmarcar todos os itens.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={resetarTodos}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Barra de Progresso */}
          <div className="mb-6">
            <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
              <span>Itens Checados: {progresso.checados}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${(progresso.checados / progresso.total) * 100}%` }}
              ></div>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="flex flex-wrap gap-2 p-4">
              {categorias.map((cat) => (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() =>
                    document
                      .getElementById(getCategoriaId(cat))
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  {cat}
                </Badge>
              ))}
            </CardContent>
          </Card>

          {/* Lista de equipamentos por categoria */}
          <div className="space-y-6">
            {Object.entries(equipamentosPorCategoria).map(([categoria, itens]) => {
              const ordemAtual = ordemCategorias[categoria] ?? 'asc'
              const itensOrdenados = [...itens].sort((a, b) => {
                const descricaoA = a.descricao || ''
                const descricaoB = b.descricao || ''
                const comparacao = descricaoA.localeCompare(descricaoB, 'pt-BR', { sensitivity: 'base' })
                return ordemAtual === 'asc' ? comparacao : -comparacao
              })

              return (
                <Card
                  key={categoria}
                  id={getCategoriaId(categoria)}
                  className="overflow-hidden"
                >
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span>{categoria}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => alternarOrdem(categoria)}
                          aria-label={`Alternar ordenação da categoria ${categoria}`}
                        >
                          <ArrowUpDown
                            className={`h-4 w-4 transition-transform ${
                              ordemAtual === 'desc' ? 'rotate-180' : ''
                            }`}
                          />
                        </Button>
                      </div>
                      <Badge variant="secondary">
                        {itens.filter(item => item.checado).length}/{itens.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {itensOrdenados.map(equipamento => (
                        <div
                          key={equipamento.id}
                          className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                            equipamento.checado ? 'bg-green-50' : ''
                          }`}
                        >
                          <Checkbox
                            checked={equipamento.checado}
                            onCheckedChange={() => alternarEquipamento(equipamento.id)}
                            className="w-5 h-5"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${equipamento.checado ? 'text-gray-500' : ''}`}>
                                {equipamento.descricao}
                              </span>
                              {equipamento.checado && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              {equipamento.quantidade > 1 ? (
                                <div className="flex items-center gap-2">
                                  <span>Levando:</span>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 w-6 p-0"
                                      onClick={() => alterarQuantidadeLevando(equipamento.id, equipamento.quantidadeLevando - 1)}
                                      disabled={equipamento.quantidadeLevando <= 0}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <Input
                                      type="number"
                                      min="0"
                                      max={equipamento.quantidade}
                                      value={equipamento.quantidadeLevando}
                                      onChange={(e) => alterarQuantidadeLevando(equipamento.id, parseInt(e.target.value) || 0)}
                                      className="w-16 h-6 text-center text-xs"
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 w-6 p-0"
                                      onClick={() => alterarQuantidadeLevando(equipamento.id, equipamento.quantidadeLevando + 1)}
                                      disabled={equipamento.quantidadeLevando >= equipamento.quantidade}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <span>de {equipamento.quantidade}</span>
                                </div>
                              ) : (
                                <span>Qtd: {equipamento.quantidade}</span>
                              )}
                              <Badge 
                                variant={equipamento.estado === 'BOM' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {equipamento.estado}
                              </Badge>
                              {equipamento.observacoes && (
                                <span className="italic">Obs: {equipamento.observacoes}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          </>
        )}

        {/* Conteúdo da aba Logs */}
        {abaAtiva === 'logs' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Histórico de Checklists</span>
                <Button onClick={carregarLogs} variant="outline" size="sm" disabled={carregandoLogs}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {carregandoLogs ? 'Carregando...' : 'Atualizar'}
                </Button>
              </CardTitle>
              <div className="flex items-center gap-2 mt-4">
                <Input type="date" value={filtroInicio} onChange={(e) => setFiltroInicio(e.target.value)} />
                <span className="mx-1">-</span>
                <Input type="date" value={filtroFim} onChange={(e) => setFiltroFim(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent>
              {carregandoLogs ? (
                <div className="text-center py-8">
                  <p>Carregando logs...</p>
                </div>
              ) : logsFiltrados.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum log encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-700">
                    {totalLogs} registros - {totalEquipamentosSelecionados} equipamentos selecionados
                  </div>
                  {logsFiltrados.map(log => (
                    <Card key={log.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{log.responsavel}</Badge>
                              <span className="text-sm text-gray-600">
                                {new Date(log.data_exportacao).toLocaleString("pt-BR")}
                              </span>
                            </div>
                            <p className="font-medium mb-1">{log.data_job}</p>
                            <p className="text-sm text-gray-600">
                              {log.total_checados} equipamentos selecionados
                            </p>
                            <details className="mt-2">
                              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                                Ver equipamentos
                              </summary>
                              <div className="mt-2 pl-4 border-l-2 border-gray-200">
                                {log.itens_checados && log.itens_checados.map((eq, index) => (
                                  <div key={index} className="text-xs text-gray-600 py-1">
                                    • {eq.descricao} 
                                    {eq.quantidade > 1 && ` (${eq.quantidadeLevando}/${eq.quantidade})`}
                                    - {eq.estado}
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => gerarPDFDoLog(log)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              PDF
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setLogSelecionado(log); setDeleteLogOpen(true) }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Conteúdo da aba Admin */}
        {abaAtiva === 'admin' && (
          <Card>
            <CardContent>
              <AdminEquipamentos onEquipamentosChanged={carregarEquipamentos} />
            </CardContent>
          </Card>
        )}

        {/* Rodapé */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Sistema de Checklist - Equipamentos Brick 2025</p>
          <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
      <AlertDialog open={deleteLogOpen} onOpenChange={(o) => { setDeleteLogOpen(o); if (!o) { setDeleteLogPwd(''); setLogSelecionado(null) } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Digite a senha para deletar este log.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input type="password" value={deleteLogPwd} onChange={(e) => setDeleteLogPwd(e.target.value)} placeholder="Senha" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: 'destructive' })} onClick={handleDeleteLog}>Excluir</AlertDialogAction>
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
        }}
      />
    </div>
  )
}

export default App
