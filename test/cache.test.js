import test from 'node:test'
import assert from 'node:assert/strict'
import { sincronizarCacheEquipamentos } from '../src/lib/cache.js'

test('reordering equipments does not update cache', () => {
  const key = 'equipamentos-test'
  const store = {}
  let setCalls = 0
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      setCalls++
      store[k] = String(v)
    },
  }
  globalThis.alert = () => {}

  const original = [
    { id: 1, descricao: 'Eq1' },
    { id: 2, descricao: 'Eq2' },
  ]
  store[key] = JSON.stringify(original)

  const reordered = [
    { id: 2, descricao: 'Eq2' },
    { id: 1, descricao: 'Eq1' },
  ]

  sincronizarCacheEquipamentos(key, reordered)
  assert.equal(setCalls, 0)
})
