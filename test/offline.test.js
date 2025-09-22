import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchEquipamentos } from '../src/lib/fetchEquipamentos.js'

const storageFactory = (initial = {}) => {
  const store = { ...initial }
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v)
    },
    store,
  }
}

test('merge base and local data when supabase offline', async () => {
  const localItem = {
    id: 999,
    categoria: 'EXTRA',
    quantidade: 1,
    descricao: 'LOCAL ITEM',
    estado: 'BOM',
    observacoes: '',
    quantidadeLevando: 1,
    checado: true,
  }

  const storage = storageFactory({
    'equipamentos-checklist': JSON.stringify([localItem]),
  })

  globalThis.alert = () => {}

  const supabase = {
    from() {
      return {
        select() {
          return {
            order() {
              return Promise.resolve({ data: null, error: new Error('offline') })
            },
          }
        },
      }
    },
  }

  const merged = await fetchEquipamentos({ supabase, storage })

  assert(merged.some((eq) => eq.id === 1), 'includes base item')
  assert(
    merged.some((eq) => eq.id === 999 && eq.descricao === 'LOCAL ITEM'),
    'includes local item'
  )

  const persisted = JSON.parse(storage.store['equipamentos-checklist'])
  assert(persisted.some((eq) => eq.id === 1), 'persisted base item')
  assert(persisted.some((eq) => eq.id === 999), 'persisted local item')
})

test('ignores invalid cached JSON and rewrites cache', async () => {
  const storage = storageFactory({
    'equipamentos-checklist': 'not json',
  })

  const remoteItem = {
    id: 10000,
    categoria: 'REMOTO',
    quantidade: 2,
    descricao: 'REMOTE ITEM',
    estado: 'BOM',
    observacoes: '',
  }

  const supabase = {
    from() {
      return {
        select() {
          return {
            order() {
              return Promise.resolve({ data: [remoteItem], error: null })
            },
          }
        },
      }
    },
  }

  const originalError = console.error
  const errors = []
  console.error = (...args) => {
    errors.push(args)
  }

  try {
    const merged = await fetchEquipamentos({ supabase, storage })

    assert(merged.some((eq) => eq.id === 1), 'includes base item')
    assert(
      merged.some((eq) => eq.id === remoteItem.id && eq.descricao === remoteItem.descricao),
      'includes remote item'
    )

    const persisted = JSON.parse(storage.store['equipamentos-checklist'])
    assert.deepStrictEqual(persisted, merged)
  } finally {
    console.error = originalError
  }

  assert(errors.length > 0, 'logs error when cache is invalid')
})
