import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { CheckCircle, Upload, RotateCcw, FileText, Minus, Plus, History, Trash2, Search } from 'lucide-react'
import AdminEquipamentos from './AdminEquipamentos.jsx'
import QuickSearch from './QuickSearch.jsx'
import jsPDF from 'jspdf'
import equipamentosData from './data/equipamentos.json'
import logoBrick from './assets/02.png'
import { supabase } from '@/lib/supabase.js'
import './App.css'

function App() {
  const [equipamentos, setEquipamentos] = useState([])
  const [progresso, setProgresso] = useState({ checados: 0, total: 0 })
  const [abaAtiva, setAbaAtiva] = useState("checklist") // 'checklist', 'logs' ou 'admin'
  const [logs, setLogs] = useState([])
  const [carregandoLogs, setCarregandoLogs] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [filtroInicio, setFiltroInicio] = useState('')
  const [filtroFim, setFiltroFim] = useState('')

  async function fetchEquipamentos() {
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('*')
        .order('id')

      if (error) throw error

      const local = JSON.parse(localStorage.getItem('equipamentos-checklist') || '[]')

      const listaSupabase = (data || []).map(eq => ({
        ...eq,
        quantidadeLevando: eq.quantidade > 1 ? 0 : eq.quantidade,
        checado: false,
      }))

      const lista = listaSupabase.map(eq => {
        const itemLocal = local.find(l => l.id === eq.id)
        return itemLocal
          ? { ...eq, quantidadeLevando: itemLocal.quantidadeLevando, checado: itemLocal.checado }
          : eq
      })

      const normalizar = lista =>
        lista.map(({ id, categoria, quantidade, descricao, estado, observacoes }) => ({
          id,
          categoria,
          quantidade,
          descricao,
          estado,
          observacoes,
        }))

      const localNormalizado = normalizar(local)
      const supabaseNormalizado = normalizar(listaSupabase)

      if (JSON.stringify(localNormalizado) !== JSON.stringify(supabaseNormalizado)) {
        console.warn('Diferença detectada entre cache local e Supabase. Cache local será atualizado.')
        console.log({ local: localNormalizado, supabase: supabaseNormalizado })
      }

      localStorage.setItem('equipamentos-checklist', JSON.stringify(lista))
      setEquipamentos(lista)
    } catch (error) {
      console.error('Erro ao carregar equipamentos do Supabase:', error)
      alert('Erro ao carregar equipamentos do servidor. Verificando dados locais.')

      const local = JSON.parse(localStorage.getItem('equipamentos-checklist') || '[]')
      if (local.length) {
        setEquipamentos(local)
      } else {
        const base = (equipamentosData || []).map(eq => ({
          ...eq,
          quantidadeLevando: eq.quantidade > 1 ? 0 : eq.quantidade,
          checado: false,
        }))
        alert('Nenhum dado local encontrado. Utilizando arquivo interno de equipamentos.')
        setEquipamentos(base)
        localStorage.setItem('equipamentos-checklist', JSON.stringify(base))
      }
    }
  }

  // Carregar dados dos equipamentos
  useEffect(() => {
    fetchEquipamentos()
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

  // Resetar todos os checkboxes
  const resetarTodos = () => {
    if (confirm('Tem certeza que deseja desmarcar todos os itens?')) {
      const equipamentosResetados = equipamentos.map(eq => ({ 
        ...eq, 
        checado: false,
        quantidadeLevando: eq.quantidade > 1 ? 0 : eq.quantidade
      }))
      setEquipamentos(equipamentosResetados)
      salvarAutomaticamente(equipamentosResetados) // Salvamento automático
    }
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
        alert('Erro ao carregar histórico de logs')
      } else {
        setLogs(data || [])
      }
    } catch (error) {
      console.error('Erro ao conectar com o Supabase:', error)
      alert('Erro ao conectar com o banco de dados')
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
        alert('Erro ao salvar log no banco de dados')
      } else {
        console.log('Log salvo no Supabase com sucesso')
      }
    } catch (error) {
      console.error('Erro ao conectar com o Supabase para salvar log:', error)
      alert('Erro ao conectar com o banco de dados')
    }
  }

  // Deletar log do Supabase (com proteção por senha)
  const deletarLog = async (logId) => {
    const senha = prompt('Digite a senha para deletar este log:')
    if (senha !== 'Brick$2016') {
      alert('Senha incorreta!')
      return
    }
    
    if (!confirm('Tem certeza que deseja deletar este log?')) return
    
    try {
      const { error } = await supabase
        .from('logs')
        .delete()
        .eq('id', logId)
      
      if (error) {
        console.error('Erro ao deletar log:', error)
        alert('Erro ao deletar log')
      } else {
        setLogs(logs.filter(log => log.id !== logId))
        alert('Log deletado com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao deletar log:', error)
      alert('Erro ao conectar com o banco de dados')
    }
  }

  // Gerar PDF a partir de um log existente
  const gerarPDFDoLog = (log) => {
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.width
    const margin = 20
    let yPosition = margin

    // Adicionar Logo
    const img = new Image()
    img.src = logoBrick
    img.onload = function() {
      const imgWidth = 30
      const imgHeight = (this.height * imgWidth) / this.width
      pdf.addImage(img, 'PNG', margin, yPosition, imgWidth, imgHeight)
      yPosition += imgHeight + 5

      // Título
      pdf.setFontSize(18)
      pdf.setFont("helvetica", "bold")
      pdf.text("Checklist - Equipamentos Selecionados", margin, yPosition)
      yPosition += 10

      // Informações do Responsável e Job
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.text(`Responsável: ${log.responsavel}`, margin, yPosition)
      yPosition += 5
      pdf.text(`Data/Job: ${log.data_job}`, margin, yPosition)
      yPosition += 5
      pdf.text(`Gerado originalmente em: ${new Date(log.data_exportacao).toLocaleString("pt-BR")}`, margin, yPosition)
      yPosition += 5
      pdf.text(`PDF regenerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, margin, yPosition)
      yPosition += 15

      // Progresso
      pdf.text(`Equipamentos selecionados: ${log.total_checados}`, margin, yPosition)
      yPosition += 10

      // Agrupar equipamentos por categoria
      const equipamentosPorCategoria = (log.itens_checados || []).reduce((acc, eq) => {
        if (!acc[eq.categoria]) {
          acc[eq.categoria] = []
        }
        acc[eq.categoria].push(eq)
        return acc
      }, {})

      // Iterar por categoria
      Object.entries(equipamentosPorCategoria).forEach(([categoria, itens]) => {
        // Verificar se precisa de nova página
        if (yPosition > 250) {
          pdf.addPage()
          yPosition = margin
        }

        // Título da categoria
        pdf.setFontSize(14)
        pdf.setFont("helvetica", "bold")
        pdf.text(`${categoria} (${itens.length} itens)`, margin, yPosition)
        yPosition += 10

        // Itens da categoria
        pdf.setFontSize(9)
        pdf.setFont("helvetica", "normal")
        
        itens.forEach(item => {
          // Verificar se precisa de nova página
          if (yPosition > 270) {
            pdf.addPage()
            yPosition = margin
          }

          let texto = `${item.descricao}`
          
          // Adicionar informação de quantidade se relevante
          if (item.quantidade > 1) {
            texto += ` (Levando: ${item.quantidadeLevando} de ${item.quantidade})`
          } else {
            texto += ` (Qtd: ${item.quantidade})`
          }
          
          texto += ` - ${item.estado}`
          
          if (item.observacoes) {
            texto += ` | Obs: ${item.observacoes}`
          }

          // Quebrar texto se muito longo
          const linhas = pdf.splitTextToSize(texto, pageWidth - 2 * margin)
          pdf.text(linhas, margin + 5, yPosition)
          yPosition += linhas.length * 4
        })
        
        yPosition += 5 // Espaço entre categorias
      })

      // Salvar PDF
      const nomeArquivo = `checklist-${log.responsavel.replace(/\s+/g, '-')}-${log.data_job.replace(/\s+/g, '-')}-${new Date().toISOString().split("T")[0]}.pdf`
      pdf.save(nomeArquivo)
    }
  }

  // Exportar para PDF (apenas itens selecionados)
  const exportarPDF = () => {
    const responsavel = prompt("Nome do Responsável:")
    if (!responsavel) return

    const dataJob = prompt("Data ou Nome do Job (Ex: 10/06/2025 - Projeto X):")
    if (!dataJob) return

    // Filtrar apenas equipamentos checados
    const equipamentosChecados = equipamentos.filter(eq => eq.checado)
    
    if (equipamentosChecados.length === 0) {
      alert("Nenhum item selecionado para exportar!")
      return
    }

    // Salvar log no Supabase
    salvarLogSupabase(responsavel, dataJob, equipamentosChecados)

    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.width
    const margin = 20
    let yPosition = margin

    // Adicionar Logo
    const img = new Image()
    img.src = logoBrick
    img.onload = function() {
      const imgWidth = 30
      const imgHeight = (this.height * imgWidth) / this.width
      pdf.addImage(img, 'PNG', margin, yPosition, imgWidth, imgHeight)
      yPosition += imgHeight + 5

      // Título
      pdf.setFontSize(18)
      pdf.setFont("helvetica", "bold")
      pdf.text("Checklist - Equipamentos Selecionados", margin, yPosition)
      yPosition += 10

      // Informações do Responsável e Job
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.text(`Responsável: ${responsavel}`, margin, yPosition)
      yPosition += 5
      pdf.text(`Data/Job: ${dataJob}`, margin, yPosition)
      yPosition += 5
      pdf.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, margin, yPosition)
      yPosition += 15

      // Progresso
      pdf.text(`Equipamentos selecionados: ${equipamentosChecados.length}`, margin, yPosition)
      yPosition += 10

      // Agrupar equipamentos checados por categoria
      const equipamentosPorCategoria = equipamentosChecados.reduce((acc, eq) => {
        if (!acc[eq.categoria]) {
          acc[eq.categoria] = []
        }
        acc[eq.categoria].push(eq)
        return acc
      }, {})

      // Iterar por categoria
      Object.entries(equipamentosPorCategoria).forEach(([categoria, itens]) => {
        // Verificar se precisa de nova página
        if (yPosition > 250) {
          pdf.addPage()
          yPosition = margin
        }

        // Título da categoria
        pdf.setFontSize(14)
        pdf.setFont("helvetica", "bold")
        pdf.text(`${categoria} (${itens.length} itens)`, margin, yPosition)
        yPosition += 10

        // Itens da categoria
        pdf.setFontSize(9)
        pdf.setFont("helvetica", "normal")
        
        itens.forEach(item => {
          // Verificar se precisa de nova página
          if (yPosition > 270) {
            pdf.addPage()
            yPosition = margin
          }

          let texto = `${item.descricao}`
          
          // Adicionar informação de quantidade se relevante
          if (item.quantidade > 1) {
            texto += ` (Levando: ${item.quantidadeLevando} de ${item.quantidade})`
          } else {
            texto += ` (Qtd: ${item.quantidade})`
          }
          
          texto += ` - ${item.estado}`
          
          if (item.observacoes) {
            texto += ` | Obs: ${item.observacoes}`
          }

          // Quebrar texto se muito longo
          const linhas = pdf.splitTextToSize(texto, pageWidth - 2 * margin)
          pdf.text(linhas, margin + 5, yPosition)
          yPosition += linhas.length * 4
        })
        
        yPosition += 5 // Espaço entre categorias
      })

      // Salvar PDF
      const nomeArquivo = `checklist-equipamentos-${new Date().toISOString().split("T")[0]}.pdf`
      pdf.save(nomeArquivo)
    }
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
            <Button onClick={exportarPDF} variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button onClick={resetarTodos} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Resetar
            </Button>
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
            {Object.entries(equipamentosPorCategoria).map(([categoria, itens]) => (
                <Card
                  key={categoria}
                  id={getCategoriaId(categoria)}
                  className="overflow-hidden"
                >
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="flex items-center justify-between">
                      <span>{categoria}</span>
                      <Badge variant="secondary">
                        {itens.filter(item => item.checado).length}/{itens.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {itens.map(equipamento => (
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
              ))}
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
                              onClick={() => deletarLog(log.id)}
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
              <AdminEquipamentos onEquipamentosChanged={fetchEquipamentos} />
            </CardContent>
          </Card>
        )}

        {/* Rodapé */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Sistema de Checklist - Equipamentos Brick 2025</p>
          <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
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
