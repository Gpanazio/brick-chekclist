import test from 'node:test'
import assert from 'node:assert/strict'
import { carregarLogs } from '../src/lib/logs.js'

globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
}

test('carregarLogs retorna dados do supabase', async () => {
  const supabase = {
    from() {
      return {
        select() {
          return {
            order() {
              return Promise.resolve({ data: [{ id: 1 }, { id: 2 }], error: null })
            },
          }
        },
      }
    },
  }
  const dados = await carregarLogs({ supabase })
  assert.equal(dados.length, 2)
})

test('carregarLogs rejeita em caso de erro', async () => {
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
  await assert.rejects(() => carregarLogs({ supabase }), /offline/)
})
