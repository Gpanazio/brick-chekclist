import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchLogs } from '../src/lib/fetchLogs.js'

test('fetchLogs retorna lista de logs', async () => {
  const supabase = {
    from(table) {
      assert.equal(table, 'logs')
      return {
        select(cols) {
          assert.equal(cols, '*')
          return {
            order(field, opts) {
              assert.equal(field, 'data_exportacao')
              assert.deepEqual(opts, { ascending: false })
              return Promise.resolve({ data: [{ id: 1 }], error: null })
            }
          }
        }
      }
    }
  }
  const logs = await fetchLogs({ supabase })
  assert.deepEqual(logs, [{ id: 1 }])
})

test('fetchLogs lança erro quando supabase retorna erro', async () => {
  const supabase = {
    from() {
      return {
        select() {
          return {
            order() {
              return Promise.resolve({ data: null, error: new Error('fail') })
            }
          }
        }
      }
    }
  }
  await assert.rejects(() => fetchLogs({ supabase }), /fail/)
})
