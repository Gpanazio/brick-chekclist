import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog.jsx'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from '@/components/ui/alert-dialog.jsx'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible.jsx'
import { CheckCircle, Minus, Plus, ArrowUpDown, ChevronDown, RotateCcw, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { gerarChecklistPDF } from '@/lib/pdf.js'
import { supabase } from '@/lib/supabase.js'

const ORDEM_CATEGORIAS_STORAGE_KEY = 'ordem-categorias-checklist'

export default function ChecklistPage({ 
  equipamentos, 
  alternarEquipamento, 
  alterarQuantidadeLevando, 
  resetarTodos 
}) {
  const [ordemCategorias, setOrdemCategorias] = useState({})
  const [exportOpen, setExportOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [responsavel, setResponsavel] = useState('')
  const [dataJob, setDataJob] = useState('')

  // Carregar ordem salva
  useEffect(() => {
    try {
      const armazenado = localStorage.getItem(ORDEM_CATEGORIAS_STORAGE_KEY)
      if (armazenado) setOrdemCategorias(JSON.parse(armazenado))
    } catch (error) {
      console.error('Erro ao carregar ordem:', error)
    }
  }, [])

  // Salvar ordem ao mudar
  useEffect(() => {
    localStorage.setItem(ORDEM_CATEGORIAS_STORAGE_KEY, JSON.stringify(ordemCategorias))
  }, [ordemCategorias])

  // Agrupamento
  const equipamentosPorCategoria = useMemo(() => {
    return equipamentos.reduce((acc, eq) => {
      if (!acc[eq.categoria]) acc[eq.categoria] = []
      acc[eq.categoria].push(eq)
      return acc
    }, {})
  }, [equipamentos])

  const categorias = useMemo(() => Object.keys(equipamentosPorCategoria).sort(), [equipamentosPorCategoria])
  
  const getCategoriaId = (nome) => `cat-${nome.replace(/\s+/g, '-')}`

  const alternarOrdem = (categoria) => {
    setOrdemCategorias((prev) => ({
      ...prev,
      [categoria]: prev[categoria] === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Exportação
  const exportarPDF = async () => {
    if (!responsavel || !dataJob) {
      toast.error('Preencha Responsável e Data/Job')
      return
    }

    const checados = equipamentos.filter(eq => eq.checado)
    if (checados.length === 0) {
      toast.error('Nenhum item selecionado!')
      return
    }

    // Salvar log no banco
    try {
      await supabase.from('logs').insert([{
        responsavel,
        data_job: dataJob,
        itens_checados: checados,
        total_itens: equipamentos.length,
        total_checados: checados.length
      }])
    } catch (error) {
      console.error('Erro ao salvar log:', error)
      toast.error('Erro ao salvar no histórico (PDF gerado mesmo assim)')
    }

    gerarChecklistPDF({
      responsavel,
      dataJob,
      itens: checados,
      totalChecados: checados.length,
      nomeArquivo: `checklist-equipamentos-${new Date().toISOString().split('T')[0]}.pdf`
    })
    
    setExportOpen(false)
    setResponsavel('')
    setDataJob('')
    toast.success('PDF gerado e log salvo!')
  }

  return (
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

      {/* Navegação Rápida (Badges) */}
      <Card className="mb-8 border-none shadow-sm bg-white/50">
        <CardContent className="flex flex-wrap gap-2 p-4">
          {categorias.map((cat) => (
            <Badge
              key={cat}
              variant="outline"
              className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors px-3 py-1 text-sm font-normal text-gray-600 bg-white"
              onClick={() => document.getElementById(getCategoriaId(cat))?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              {cat}
            </Badge>
          ))}
        </CardContent>
      </Card>

      {/* Lista de Categorias e Itens */}
      <div className="space-y-8">
        {categorias.map((categoria) => {
          const itens = equipamentosPorCategoria[categoria]
          const ordemAtual = ordemCategorias[categoria] ?? 'asc'
          const itensOrdenados = [...itens].sort((a, b) => {
            const comp = a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' })
            return ordemAtual === 'asc' ? comp : -comp
          })

          return (
            <Card key={categoria} id={getCategoriaId(categoria)} className="overflow-hidden border-gray-200 shadow-sm scroll-mt-32">
              <Collapsible defaultOpen className="group/collapsible">
                <CardHeader className="bg-gray-50/80 py-3 px-4 border-b border-gray-100 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-gray-800">{categoria}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600" onClick={() => alternarOrdem(categoria)}>
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
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                      {itensOrdenados.map(eq => (
                        <div key={eq.id} className={`group p-3 sm:p-4 flex items-start sm:items-center gap-3 transition-all duration-200 ${eq.checado ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}>
                          <Checkbox checked={eq.checado} onCheckedChange={() => alternarEquipamento(eq.id)} className="mt-1 sm:mt-0 data-[state=checked]:bg-blue-600" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-medium leading-tight ${eq.checado ? 'text-gray-500 line-through decoration-gray-300' : 'text-gray-900'}`}>{eq.descricao}</span>
                              {eq.checado && <CheckCircle className="w-3.5 h-3.5 text-blue-500 animate-in zoom-in spin-in-12 duration-300" />}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1.5 text-xs text-gray-500">
                              {eq.quantidade > 1 ? (
                                <div className="flex items-center gap-2 bg-white rounded-md border border-gray-200 px-1.5 py-0.5 shadow-sm">
                                  <span className="text-[10px] uppercase font-semibold text-gray-400">Levando</span>
                                  <div className="flex items-center gap-1">
                                    <button className="h-5 w-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30" onClick={() => alterarQuantidadeLevando(eq.id, eq.quantidadeLevando - 1)} disabled={eq.quantidadeLevando <= 0}><Minus className="w-3 h-3" /></button>
                                    <span className="font-mono font-medium w-4 text-center text-gray-900">{eq.quantidadeLevando}</span>
                                    <button className="h-5 w-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30" onClick={() => alterarQuantidadeLevando(eq.id, eq.quantidadeLevando + 1)} disabled={eq.quantidadeLevando >= eq.quantidade}><Plus className="w-3 h-3" /></button>
                                  </div>
                                  <span className="text-gray-400">/ {eq.quantidade}</span>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-200 text-gray-500 font-normal">Qtd: {eq.quantidade}</Badge>
                              )}
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${eq.estado === 'BOM' ? 'bg-green-50 text-green-700 ring-green-600/20' : eq.estado === 'REGULAR' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : 'bg-red-50 text-red-700 ring-red-600/10'}`}>{eq.estado}</span>
                                {eq.observacoes && <span className="text-gray-400 truncate max-w-[150px] sm:max-w-xs" title={eq.observacoes}>• {eq.observacoes}</span>}
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

      <div className="mt-8 mb-6 text-center">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg w-full sm:w-auto px-8 py-6 text-lg mb-8" onClick={() => setExportOpen(true)}>
          <FileDown className="w-6 h-6 mr-2" />
          Finalizar e Exportar PDF
        </Button>
      </div>
    </div>
  )
}
