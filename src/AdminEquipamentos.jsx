import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase.js'
import { sincronizarCacheEquipamentos } from '@/lib/cache.js'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Search, 
  Package, // Novo ícone sugerido
  Save,
  X
} from 'lucide-react'

// UI Components
import { Input } from '@/components/ui/input.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog.jsx'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog.jsx'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form.jsx'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'

// Validação
const equipamentoSchema = z.object({
  categoria: z.string().trim().min(1, 'Informe a categoria'),
  descricao: z.string().trim().min(1, 'Informe a descrição'),
  quantidade: z.coerce.number().min(1, 'Mínimo 1'),
  estado: z.string().trim().min(1, 'Informe o estado'),
  observacoes: z.string().optional(),
})

const STORAGE_KEY = 'equipamentos-admin'

export default function AdminEquipamentos({ onEquipamentosChanged }) {
  const [equipamentos, setEquipamentos] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Controle dos Modais
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [adminPwd, setAdminPwd] = useState('')

  // Carregar dados
  useEffect(() => {
    carregarEquipamentos()
  }, [])

  const carregarEquipamentos = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('*')
        .order('categoria', { ascending: true })
        .order('descricao', { ascending: true })

      if (error) throw error

      setEquipamentos(data || [])
      // Atualiza o cache local para o app funcionar offline se precisar
      sincronizarCacheEquipamentos(STORAGE_KEY, data || [])
    } catch (err) {
      console.error('Erro:', err)
      toast.error('Erro ao carregar equipamentos')
    } finally {
      setLoading(false)
    }
  }

  // Agrupamento e Filtro Automático
  const dadosFiltrados = useMemo(() => {
    const termo = searchTerm.toLowerCase()
    const lista = equipamentos.filter(eq => 
      eq.descricao.toLowerCase().includes(termo) || 
      eq.categoria.toLowerCase().includes(termo)
    )

    // Agrupar por categoria
    return lista.reduce((acc, item) => {
      if (!acc[item.categoria]) acc[item.categoria] = []
      acc[item.categoria].push(item)
      return acc
    }, {})
  }, [equipamentos, searchTerm])

  // Extrai lista única de categorias para sugestão
  const categoriasDisponiveis = useMemo(() => {
    return [...new Set(equipamentos.map(e => e.categoria))].sort()
  }, [equipamentos])

  // Salvar (Criar ou Editar)
  const handleSave = async (values) => {
    // Validação da senha hardcoded no .env (1234)
    if (adminPwd !== import.meta.env.VITE_ADMIN_PASSWORD) {
      toast.error('Senha incorreta!')
      return
    }

    try {
      const payload = {
        categoria: values.categoria.toUpperCase(), // Força maiúscula na categoria
        descricao: values.descricao,
        quantidade: values.quantidade,
        estado: values.estado,
        observacoes: values.observacoes || ''
      }

      let error
      if (editingItem) {
        // Update
        const { error: updateError } = await supabase
          .from('equipamentos')
          .update(payload)
          .eq('id', editingItem.id)
        error = updateError
        toast.success('Item atualizado!')
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('equipamentos')
          .insert([payload])
        error = insertError
        toast.success('Item criado!')
      }

      if (error) throw error

      await carregarEquipamentos()
      if (onEquipamentosChanged) onEquipamentosChanged()
      fecharModal()

    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar no banco.')
    }
  }

  // Excluir
  const handleDelete = async () => {
    if (adminPwd !== import.meta.env.VITE_ADMIN_PASSWORD) {
      toast.error('Senha incorreta!')
      return
    }

    try {
      const { error } = await supabase
        .from('equipamentos')
        .delete()
        .eq('id', deleteItem.id)

      if (error) throw error

      toast.success('Item removido.')
      await carregarEquipamentos()
      if (onEquipamentosChanged) onEquipamentosChanged()
      setDeleteItem(null)
      setAdminPwd('')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir item.')
    }
  }

  // Helpers de Modal
  const abrirModalNovo = () => {
    setEditingItem(null)
    setAdminPwd('')
    setIsFormOpen(true)
  }

  const abrirModalEditar = (item) => {
    setEditingItem(item)
    setAdminPwd('')
    setIsFormOpen(true)
  }

  const fecharModal = () => {
    setIsFormOpen(false)
    setEditingItem(null)
    setAdminPwd('')
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Topo: Título e Busca */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Gestão de Equipamentos
          </h2>
          <p className="text-sm text-gray-500">Adicione ou remova itens do checklist.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar item ou categoria..."
              className="pl-9 bg-gray-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={abrirModalNovo} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo Item</span>
          </Button>
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto animate-pulse mb-4" />
            <p className="text-gray-500">Carregando inventário...</p>
          </div>
        ) : Object.keys(dadosFiltrados).length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-gray-500 mb-2">Nenhum equipamento encontrado.</p>
            <Button variant="link" onClick={abrirModalNovo}>Adicionar o primeiro item</Button>
          </div>
        ) : (
          Object.entries(dadosFiltrados).map(([categoria, itens]) => (
            <Card key={categoria} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-gray-50/80 py-3 px-4 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  {categoria}
                </CardTitle>
                <Badge variant="secondary" className="bg-white text-gray-600 border-gray-200">
                  {itens.length} itens
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {itens.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 hover:bg-blue-50/30 transition-colors group">
                      
                      {/* Dados do Item */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="font-medium text-gray-900 truncate">{item.descricao}</div>
                        <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-1 items-center">
                          <Badge variant="outline" className="text-xs py-0 h-5 font-normal">
                            Qtd: {item.quantidade}
                          </Badge>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.estado === 'BOM' ? 'bg-green-100 text-green-700' : 
                            item.estado === 'REGULAR' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.estado}
                          </span>
                          {item.observacoes && (
                            <span className="text-gray-400 truncate max-w-[150px] sm:max-w-xs" title={item.observacoes}>
                              • {item.observacoes}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                          onClick={() => abrirModalEditar(item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" 
                          onClick={() => { setDeleteItem(item); setAdminPwd(''); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* --- MODAL FORMULÁRIO (ADD/EDIT) --- */}
      <EquipamentoFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        item={editingItem}
        categorias={categoriasDisponiveis}
        onSave={handleSave}
        adminPwd={adminPwd}
        setAdminPwd={setAdminPwd}
      />

      {/* --- MODAL DELETE --- */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Equipamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Você vai apagar <b>{deleteItem?.descricao}</b>. <br/>
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <label className="text-xs font-bold text-gray-500 mb-1.5 block uppercase">Senha de Aprovação</label>
            <Input 
              type="password" 
              value={adminPwd} 
              onChange={(e) => setAdminPwd(e.target.value)}
              placeholder="Digite a senha..."
              className="text-center tracking-widest"
              autoFocus
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!adminPwd}
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Subcomponente do Formulário para manter o código limpo
function EquipamentoFormDialog({ open, onOpenChange, item, categorias, onSave, adminPwd, setAdminPwd }) {
  const form = useForm({
    resolver: zodResolver(equipamentoSchema),
    defaultValues: {
      categoria: '', descricao: '', quantidade: 1, estado: 'BOM', observacoes: '',
    },
  })

  // Popula o form ao abrir
  useEffect(() => {
    if (open) {
      if (item) {
        form.reset({
          categoria: item.categoria,
          descricao: item.descricao,
          quantidade: item.quantidade,
          estado: item.estado,
          observacoes: item.observacoes || '',
        })
      } else {
        form.reset({
          categoria: '', descricao: '', quantidade: 1, estado: 'BOM', observacoes: '',
        })
      }
    }
  }, [open, item, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar Item' : 'Novo Item'}</DialogTitle>
          <DialogDescription>Preencha os dados e informe a senha para salvar.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              
              {/* Categoria com Datalist (Sugestão + Digitação livre) */}
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          list="cat-suggestions" 
                          placeholder="Selecione ou digite uma nova..." 
                          {...field} 
                          className="uppercase"
                        />
                        <datalist id="cat-suggestions">
                          {categorias.map(cat => <option key={cat} value={cat} />)}
                        </datalist>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nome do Equipamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Câmera Sony A7s III" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BOM">BOM</SelectItem>
                        <SelectItem value="REGULAR">REGULAR</SelectItem>
                        <SelectItem value="RUIM">RUIM</SelectItem>
                        <SelectItem value="MANUTENCAO">MANUTENÇÃO</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Observações (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Falta tampa, bateria viciada..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4 border-t mt-2 bg-gray-50 -mx-6 px-6 pb-2">
              <FormLabel className="text-xs uppercase text-gray-500 font-bold block mb-2 mt-4">Senha de Aprovação</FormLabel>
              <div className="flex gap-3">
                <Input 
                  type="password" 
                  placeholder="Senha" 
                  value={adminPwd}
                  onChange={(e) => setAdminPwd(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={!adminPwd} className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
