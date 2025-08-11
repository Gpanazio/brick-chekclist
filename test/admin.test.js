import test from 'node:test'
import assert from 'node:assert/strict'
import { carregarEquipamentos, salvarNovo, deletarEquipamento } from '../src/lib/admin.js'

globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
}

test('carregarEquipamentos ordena por id', async () => {
  const supabase = {
    from() {
      return {
        select() {
          return Promise.resolve({ data: [{ id: 2 }, { id: 1 }], error: null })
        },
      }
    },
  }
  const lista = await carregarEquipamentos({ supabase })
  assert.deepEqual(lista.map((e) => e.id), [1, 2])
})

test('salvarNovo envia dados ao supabase', async () => {
  let inserted
  const supabase = {
    from() {
      return {
        insert(vals) {
          inserted = vals
          return Promise.resolve({ error: null })
        },
      }
    },
  }
  await salvarNovo({ supabase }, { id: 3 })
  assert.equal(inserted[0].id, 3)
})

test('deletarEquipamento remove por id', async () => {
  let deletedId
  const supabase = {
    from() {
      return {
        delete() {
          return {
            eq(_col, id) {
              deletedId = id
              return Promise.resolve({ error: null })
            },
          }
        },
      }
    },
  }
  await deletarEquipamento({ supabase }, 5)
  assert.equal(deletedId, 5)
})
