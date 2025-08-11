import test from 'node:test'
import assert from 'node:assert/strict'
import {
  loadEquipamentos,
  addEquipamento,
  updateEquipamento,
  deleteEquipamento,
} from '../src/lib/adminEquipamentos.js'

test('loadEquipamentos retorna lista ordenada', async () => {
  const supabase = {
    from(table) {
      assert.equal(table, 'equipamentos')
      return {
        select() {
          return Promise.resolve({ data: [{ id: 2 }, { id: 1 }], error: null })
        }
      }
    }
  }
  const lista = await loadEquipamentos({ supabase })
  assert.deepEqual(lista, [{ id: 1 }, { id: 2 }])
})

test('addEquipamento envia item para supabase', async () => {
  let inserted
  const supabase = {
    from(table) {
      assert.equal(table, 'equipamentos')
      return {
        insert(values) {
          inserted = values
          return Promise.resolve({ error: null })
        }
      }
    }
  }
  await addEquipamento({ supabase }, { id: 3 })
  assert.deepEqual(inserted, [{ id: 3 }])
})

test('updateEquipamento envia dados e id corretos', async () => {
  let updated
  let eqArgs
  const supabase = {
    from(table) {
      assert.equal(table, 'equipamentos')
      return {
        update(values) {
          updated = values
          return {
            eq(field, value) {
              eqArgs = [field, value]
              return Promise.resolve({ error: null })
            }
          }
        }
      }
    }
  }
  const equip = { id: 5, categoria: 'cat', descricao: 'desc', quantidade: 1, estado: 'BOM', observacoes: '' }
  await updateEquipamento({ supabase }, equip)
  assert.deepEqual(updated, {
    categoria: 'cat',
    descricao: 'desc',
    quantidade: 1,
    estado: 'BOM',
    observacoes: '',
  })
  assert.deepEqual(eqArgs, ['id', 5])
})

test('deleteEquipamento remove item com id correto', async () => {
  let eqArgs
  const supabase = {
    from(table) {
      assert.equal(table, 'equipamentos')
      return {
        delete() {
          return {
            eq(field, value) {
              eqArgs = [field, value]
              return Promise.resolve({ error: null })
            }
          }
        }
      }
    }
  }
  await deleteEquipamento({ supabase }, 7)
  assert.deepEqual(eqArgs, ['id', 7])
})

test('loadEquipamentos lança erro quando supabase falha', async () => {
  const supabase = {
    from() {
      return {
        select() {
          return Promise.resolve({ data: null, error: new Error('fail') })
        }
      }
    }
  }
  await assert.rejects(() => loadEquipamentos({ supabase }), /fail/)
})
