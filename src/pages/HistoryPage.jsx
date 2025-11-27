import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Button, buttonVariants } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog.jsx'
import { RotateCcw, Trash2, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase.js'
import { gerarChecklistPDF } from '@/lib/pdf.js'
import { toast } from 'sonner'

export default function HistoryPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [filtroInicio, setFiltroInicio] = useState('')
  const [filtroFim, setFiltroFim] = useState('')
  
  // Estados para delete
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
                    <div className="text-xs text-gray-400">{log.total_checados} itens</div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button variant="outline" size="sm" onClick={() => gerarPDF(log)} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                      <FileText className="w-3.5 h-3.5 mr-1.5" /> PDF
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setLogSelecionado(log); setDeleteLogOpen(true) }} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
