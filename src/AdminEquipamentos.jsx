import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase.js'
import { sincronizarCacheEquipamentos } from '@/lib/cache.js'
import { Input } from '@/components/ui/input.jsx'
import { Button, buttonVariants } from '@/components/ui/button.jsx'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table.jsx'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog.jsx'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs.jsx'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select.jsx'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form.jsx'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

const equipamentoSchema = z.object({
  categoria: z.string().min(1, 'Informe a categoria'),
  descricao: z.string().min(1, 'Informe a descrição'),
  quantidade: z.coerce.number().min(1, 'Quantidade mínima 1'),
  estado: z.string().min(1, 'Informe o estado'),
  observacoes: z.string().optional(),
})

const STORAGE_KEY = 'equipamentos-admin'

function AdminEquipamentos({ onEquipamentosChanged }) {
  const [equipamentos, setEquipamentos] = useState([])
  const [tab, setTab] = useState('adicionar')
  const [selectedId, setSelectedId] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePwd, setDeletePwd] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [addPwd, setAddPwd] = useState('')
  const [addValues, setAddValues] = useState(null)
  const [editId, setEditId] = useState('')
  const [editValues, setEditValues] = useState({
    categoria: '',
    descricao: '',
    quantidade: 1,
    estado: 'BOM',
    observacoes: '',
  })
  const form = useForm({
    resolver: zodResolver(equipamentoSchema),
    defaultValues: {
      categoria: '',
      descricao: '',
      quantidade: 1,
      estado: 'BOM',
      observacoes: '',
    },
  })

  useEffect(() => {
    (async () => {
      const lista = await carregarEquipamentos()
      if (lista) sincronizarCacheEquipamentos(STORAGE_KEY, lista)
    })()
  }, [])

  useEffect(() => {
    if (!editId && equipamentos.length) {
      setEditId(String(equipamentos[0].id))
    }
  }, [equipamentos, editId])

  useEffect(() => {
    if (editId) {
      const eq = equipamentos.find((e) => String(e.id) === String(editId))
      if (eq) {
        setEditValues({
          categoria: eq.categoria,
          descricao: eq.descricao,
          quantidade: eq.quantidade,
          estado: eq.estado,
          observacoes: eq.observacoes || '',
        })
      }
    }
  }, [editId, equipamentos])

  useEffect(() => {
    if (!selectedId && equipamentos.length) {
      setSelectedId(String(equipamentos[0].id))
    }
  }, [equipamentos, selectedId])

  const carregarEquipamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('*')

      if (error) throw error

      const lista = data || []
      setEquipamentos([...lista].sort((a, b) => a.id - b.id))
      return lista
    } catch (err) {
      console.error('Erro ao carregar equipamentos:', err)
      alert('Erro ao carregar equipamentos')
      return null
    }
  }

  const salvarNovo = async () => {
    if (addPwd !== 'Brick$2016') {
      alert('Senha incorreta')
      return
    }
    const { error } = await supabase.from('equipamentos').insert([addValues])
    if (error) {
      toast.error('Erro ao adicionar equipamento')
      return
    }
    toast.success('Equipamento adicionado com sucesso')
    form.reset()
    const lista = await carregarEquipamentos()
    if (lista) sincronizarCacheEquipamentos(STORAGE_KEY, lista)
    if (onEquipamentosChanged) onEquipamentosChanged()
    setAddPwd('')
    setAddOpen(false)
    setAddValues(null)
  }

  const handleAddSubmit = (values) => {
    const nextId = equipamentos.length
      ? Math.max(...equipamentos.map((e) => e.id)) + 1
      : 1
    setAddValues({ ...values, id: nextId })
    setAddOpen(true)
  }

  const atualizarEquipamento = async (equip) => {
    try {
      const { error } = await supabase
        .from('equipamentos')
        .update({
          categoria: equip.categoria,
          descricao: equip.descricao,
          quantidade: equip.quantidade,
          estado: equip.estado,
          observacoes: equip.observacoes,
        })
        .eq('id', equip.id)
      if (error) throw error
      const lista = await carregarEquipamentos()
      if (lista) sincronizarCacheEquipamentos(STORAGE_KEY, lista)
      if (onEquipamentosChanged) onEquipamentosChanged()
      return true
    } catch (error) {
      console.error('Erro ao atualizar equipamento:', error)
      alert('Erro ao atualizar equipamento')
      const lista = await carregarEquipamentos()
      if (lista) sincronizarCacheEquipamentos(STORAGE_KEY, lista)
      return false
    }
  }

  const deletarEquipamento = async (id) => {
    try {
      const { error } = await supabase.from('equipamentos').delete().eq('id', id)
      if (error) throw error
      const lista = await carregarEquipamentos()
      if (lista) sincronizarCacheEquipamentos(STORAGE_KEY, lista)
      if (onEquipamentosChanged) onEquipamentosChanged()
      return true
    } catch (error) {
      console.error('Erro ao excluir equipamento:', error)
      alert('Erro ao excluir equipamento')
      const lista = await carregarEquipamentos()
      if (lista) sincronizarCacheEquipamentos(STORAGE_KEY, lista)
      return false
    }
  }

  const handleEditChange = (campo, valor) => {
    setEditValues((prev) => ({ ...prev, [campo]: valor }))
  }

  const handleUpdateSelectedFromForm = async () => {
    if (!editId) return
    const senha = prompt('Digite a senha:')
    if (senha !== 'Brick$2016') {
      alert('Senha incorreta')
      return
    }
    await atualizarEquipamento({ id: parseInt(editId), ...editValues })
  }

  const handleDeleteSelected = async () => {
    if (!selectedId) return
    if (deletePwd !== 'Brick$2016') {
      alert('Senha incorreta')
      return
    }
    const success = await deletarEquipamento(parseInt(selectedId))
    if (success) {
      setDeletePwd('')
      setDeleteOpen(false)
    }
  }

  const atualizarLocal = (id, campo, valor) => {
    setEquipamentos(prev => prev.map(eq => (eq.id === id ? { ...eq, [campo]: valor } : eq)))
  }

  const EquipmentRow = ({ equip }) => {
    const [updateOpen, setUpdateOpen] = useState(false)
    const [updatePwd, setUpdatePwd] = useState('')

    const handleUpdate = async () => {
      if (updatePwd !== 'Brick$2016') {
        alert('Senha incorreta')
        return
      }
      const success = await atualizarEquipamento(equip)
      if (success) {
        setUpdateOpen(false)
        setUpdatePwd('')
      }
    }

    return (
      <TableRow key={equip.id} className="odd:bg-gray-50">
        <TableCell>
          <Input
            className="w-full"
            value={equip.categoria}
            onChange={(e) => atualizarLocal(equip.id, 'categoria', e.target.value)}
          />
        </TableCell>
        <TableCell>
          <Input
            className="w-full"
            value={equip.descricao}
            onChange={(e) => atualizarLocal(equip.id, 'descricao', e.target.value)}
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            className="w-16"
            value={equip.quantidade}
            onChange={(e) => atualizarLocal(equip.id, 'quantidade', parseInt(e.target.value) || 1)}
          />
        </TableCell>
        <TableCell>
          <Input
            className="w-full"
            value={equip.estado}
            onChange={(e) => atualizarLocal(equip.id, 'estado', e.target.value)}
          />
        </TableCell>
        <TableCell>
          <Input
            className="w-full"
            value={equip.observacoes || ''}
            onChange={(e) => atualizarLocal(equip.id, 'observacoes', e.target.value)}
          />
        </TableCell>
        <TableCell className="space-x-2">
          <AlertDialog open={updateOpen} onOpenChange={(o) => { setUpdateOpen(o); if (!o) setUpdatePwd('') }}>
            <AlertDialogTrigger asChild>
              <Button size="sm">Salvar</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar atualização</AlertDialogTitle>
                <AlertDialogDescription>Digite a senha para salvar as alterações.</AlertDialogDescription>
              </AlertDialogHeader>
              <Input type="password" value={updatePwd} onChange={(e) => setUpdatePwd(e.target.value)} placeholder="Senha" />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleUpdate}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Administração de Equipamentos</h2>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="adicionar">Incluir</TabsTrigger>
          <TabsTrigger value="alterar">Alterar</TabsTrigger>
          <TabsTrigger value="excluir">Excluir</TabsTrigger>
        </TabsList>

        <TabsContent value="adicionar">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddSubmit)} className="grid grid-cols-2 gap-2">
              <FormField
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Categoria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Descrição" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="number" placeholder="Quantidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Estado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="observacoes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormControl>
                      <Input placeholder="Observações" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="col-span-2">Adicionar</Button>
            </form>
          </Form>
          <AlertDialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) { setAddPwd(''); setAddValues(null) } }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar inclusão</AlertDialogTitle>
                <AlertDialogDescription>Digite a senha para adicionar o equipamento.</AlertDialogDescription>
              </AlertDialogHeader>
              <Input type="password" value={addPwd} onChange={(e) => setAddPwd(e.target.value)} placeholder="Senha" />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={salvarNovo}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="alterar">
          <div className="space-y-2">
            <Select value={editId} onValueChange={setEditId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Selecione o equipamento" />
              </SelectTrigger>
              <SelectContent>
                {equipamentos.map((eq) => (
                  <SelectItem key={eq.id} value={String(eq.id)}>
                    {eq.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {editId && (
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateSelectedFromForm() }} className="grid grid-cols-2 gap-2">
                <Input
                  value={editValues.categoria}
                  onChange={(e) => handleEditChange('categoria', e.target.value)}
                  placeholder="Categoria"
                />
                <Input
                  value={editValues.descricao}
                  onChange={(e) => handleEditChange('descricao', e.target.value)}
                  placeholder="Descrição"
                />
                <Input
                  type="number"
                  value={editValues.quantidade}
                  onChange={(e) => handleEditChange('quantidade', parseInt(e.target.value) || 1)}
                  placeholder="Quantidade"
                  className="w-20"
                />
                <Input
                  value={editValues.estado}
                  onChange={(e) => handleEditChange('estado', e.target.value)}
                  placeholder="Estado"
                />
                <Input
                  value={editValues.observacoes}
                  onChange={(e) => handleEditChange('observacoes', e.target.value)}
                  placeholder="Observações"
                  className="col-span-2"
                />
                <Button type="submit" className="col-span-2">Salvar</Button>
              </form>
            )}
          </div>
        </TabsContent>

        <TabsContent value="excluir">
          <div className="flex items-end gap-2">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Selecione o equipamento" />
              </SelectTrigger>
              <SelectContent>
                {equipamentos.map((eq) => (
                  <SelectItem key={eq.id} value={String(eq.id)}>
                    {eq.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AlertDialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeletePwd('') }}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Excluir</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>Digite a senha para excluir o equipamento.</AlertDialogDescription>
                </AlertDialogHeader>
                <Input type="password" value={deletePwd} onChange={(e) => setDeletePwd(e.target.value)} placeholder="Senha" />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction className={buttonVariants({ variant: 'destructive' })} onClick={handleDeleteSelected}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>
      </Tabs>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Categoria</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Qtd.</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Observações</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipamentos.map((eq) => (
            <EquipmentRow key={eq.id} equip={eq} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default AdminEquipamentos
