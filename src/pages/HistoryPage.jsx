import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Button, buttonVariants } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog.jsx'
import { RotateCcw, Trash2, FileText, ClipboardCheck, CheckCircle2, AlertTriangle, PackageCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase.js'
import { gerarChecklistPDF } from '@/lib/pdf.js'
import { toast } from 'sonner'

export default function HistoryPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [filtroInicio, setFiltroInicio] = useState('')
  const [filtroFim, setFiltroFim] = useState('')
  
  // --- Estados para Devolução (Check-in) ---
  const [isReturnOpen, setIsReturnOpen] = useState(false)
  const [returnLog, setReturnLog] = useState(null)
  const [returnItems, setReturnItems] = useState([])

  // --- Estados para Delete ---
  const [deleteLogOpen, setDeleteLogOpen] = useState(false)
  const [deleteLogPwd, setDeleteLogPwd] = useState('')
  const [logSelecionado, setLogSelecionado] = useState(null)

  const carregarLogs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('data_exportacao', { ascending: false })
      
      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarLogs()
  }, [])

  // --- Lógica de Devolução ---

  const abrirDevolucao = (log) => {
    setReturnLog(log)
    // Cria uma cópia profunda dos itens para edição local
    const items = log.itens_checados || []
    // Se o item não tiver status de devolvido ainda, assume false
    const initializedItems = items.map(item => ({
      ...item,
      devolvido: item.devolvido === true, // garante booleano
      devolucao_obs: item.devolucao_obs || ''
    }))
    setReturnItems(initializedItems)
    setIsReturnOpen(true)
  }

  const toggleItemDevolvido = (index) => {
    const novosItens = [...returnItems]
    novosItens[index].devolvido = !novosItens[index].devolvido
    setReturnItems(novosItens)
  }

  const alterarObsItem = (index, texto) => {
    const novosItens = [...returnItems]
    novosItens[index].devolucao_obs = texto
    setReturnItems(novosItens)
  }

  const marcarTodosDevolvidos = () => {
    const todos = returnItems.map(i => ({ ...i, devolvido: true }))
    setReturnItems(todos)
  }

  const salvarDevolucao = async () => {
    try {
      // Atualiza o JSON de itens no banco com os novos status
      const { error } = await supabase
        .from('logs')
        .update({ 
          itens_checados: returnItems 
        })
        .eq('id', returnLog.id)

      if (error) throw error

      toast.success('Status de devolução atualizado!')
      setIsReturnOpen(false)
      carregarLogs() // Recarrega a lista para mostrar os novos status
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar devolução')
    }
  }

  // Calcula status visual do log
  const getLogStatus = (log) => {
    const items = log.itens_checados || []
    if (items.length === 0) return { label: 'Vazio', color: 'bg-gray-100 text-gray-600' }
    
    const devolvidos = items.filter(i => i.devolvido).length
    
    if (devolvidos === 0) return { label: 'Pendente', color: 'bg-gray-100 text-gray-600 border-gray-200' }
    if (devolvidos === items.length) return { label: 'Devolvido', color: 'bg-green-100 text-green-700 border-green-200' }
    return { label: `Parcial (${devolvidos}/${items.length})`, color: 'bg-amber-100 text-amber-700 border-amber-200' }
  }

  // --- Lógica de Delete e PDF ---

  const handleDeleteLog = async () => {
    if (!logSelecionado) return
    if (deleteLogPwd !== import.meta.env.VITE_ADMIN_PASSWORD) {
      toast.error('Senha incorreta!')
      return
    }
    try {
      const { error } = await supabase.from('logs').delete().eq('id', logSelecionado.id)
      if (error) throw error
      setLogs(logs.filter(log => log.id !== logSelecionado.id))
      toast.success('Log deletado!')
      setDeleteLogOpen(false)
      setDeleteLogPwd('')
      setLogSelecionado(null)
    } catch (error) {
      toast.error('Erro ao deletar log')
    }
  }

  const gerarPDF = (log) => {
    gerarChecklistPDF({
      responsavel: log.responsavel,
      dataJob: log.data_job,
      itens: log.itens_checados || [],
      totalChecados: log.total_checados,
      dataOriginal: log.data_exportacao,
      nomeArquivo: `checklist-${log.responsavel.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
    })
  }

  const logsFiltrados = logs.filter((log) => {
    const data = new Date(log.data_exportacao)
    if (filtroInicio && data < new Date(filtroInicio)) return false
    if (filtroFim && data > new Date(filtroFim)) return false
    return true
  })

  // Estatísticas do Check-in Atual
  const checkInStats = useMemo(() => {
    const total = returnItems.length
    const devolvidos = returnItems.filter(i => i.devolvido).length
    const pendentes = total - devolvidos
    return { total, devolvidos, pendentes }
  }, [returnItems])

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="border-none shadow-md">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Histórico</span>
            <Button onClick={carregarLogs} variant="ghost" size="sm" disabled={loading}>
              <RotateCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Input type="date" className="w-auto" value={filtroInicio} onChange={(e) => setFiltroInicio(e.target.value)} />
            <span className="text-gray-400">até</span>
            <Input type="date" className="w-auto" value={filtroFim} onChange={(e) => setFiltroFim(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Carregando registros...</div>
          ) : logsFiltrados.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhum histórico encontrado.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logsFiltrados.map(log => {
                const status = getLogStatus(log)
                return (
                  <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{log.data_job}</span>
                        <Badge variant="outline" className="text-xs font-normal text-gray-500 bg-white">
                          {new Date(log.data_exportacao).toLocaleDateString('pt-BR')}
                        </Badge>
                        <Badge variant="outline" className={`text-xs font-medium ${status.color}`}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Responsável: <span className="font-medium">{log.responsavel}</span>
                      </div>
                      <div className="text-xs text-gray-400">{log.total_checados} itens selecionados</div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => abrirDevolucao(log)}
                        className="text-green-700 border-green-200 hover:bg-green-50"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" /> 
                        Devolução
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => gerarPDF(log)} className="text-blue-600 hover:bg-blue-50">
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setLogSelecionado(log); setDeleteLogOpen(true) }} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- MODAL DE CHECK-IN (DEVOLUÇÃO) --- */}
      <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-green-600" />
              Realizar Devolução
            </DialogTitle>
            <DialogDescription>
              Marque os itens que retornaram. Adicione observações se houver avarias.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 px-1">
            {returnItems.length > 0 ? (
              <div className="space-y-3">
                 <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={marcarTodosDevolvidos} className="text-xs h-7">Marcar todos</Button>
                 </div>
                 {returnItems.map((item, index) => (
                   <div key={index} className={`p-3 rounded-lg border transition-colors ${item.devolvido ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                     <div className="flex items-start gap-3">
                       <Checkbox 
                          id={`item-${index}`} 
                          checked={item.devolvido} 
                          onCheckedChange={() => toggleItemDevolvido(index)}
                          className="mt-1 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                       />
                       <div className="flex-1 grid gap-1.5">
                          <label htmlFor={`item-${index}`} className="text-sm font-medium leading-none cursor-pointer select-none">
                            {item.descricao}
                            {item.quantidade > 1 && <span className="ml-1 text-gray-500 font-normal">(Qtd: {item.quantidadeLevando})</span>}
                          </label>
                          
                          <Input 
                            placeholder="Obs: Avaria, peça faltando..." 
                            value={item.devolucao_obs}
                            onChange={(e) => alterarObsItem(index, e.target.value)}
                            className={`h-7 text-xs bg-transparent border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-gray-400 placeholder:text-gray-300 ${item.devolucao_obs ? 'border-red-300' : 'border-transparent'}`}
                          />
                       </div>
                     </div>
                   </div>
                 ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">Nenhum item neste checklist.</p>
            )}
          </div>

          <DialogFooter className="sm:justify-between flex-col sm:flex-row gap-2 border-t pt-4">
            <div className="flex items-center gap-2 text-sm">
              {checkInStats.pendentes === 0 ? (
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Tudo devolvido ({checkInStats.devolvidos}/{checkInStats.total})
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                  <AlertTriangle className="w-4 h-4" /> {checkInStats.pendentes} item(s) pendente(s)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsReturnOpen(false)}>Cancelar</Button>
              <Button onClick={salvarDevolucao} className="bg-green-600 hover:bg-green-700 text-white">
                Salvar Devolução
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL DE EXCLUSÃO --- */}
      <AlertDialog open={deleteLogOpen} onOpenChange={(o) => { setDeleteLogOpen(o); if (!o) { setDeleteLogPwd(''); setLogSelecionado(null) } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro?</AlertDialogTitle>
            <AlertDialogDescription>Digite a senha de administrador.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input type="password" value={deleteLogPwd} onChange={(e) => setDeleteLogPwd(e.target.value)} placeholder="Senha" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: 'destructive' })} onClick={handleDeleteLog}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
