import test from 'node:test'
import assert from 'node:assert/strict'
import { gerarPDFDoLog, gerarPDFEquipamentos } from '../src/lib/pdf.js'

globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
}

class MockPDF {
  constructor() {
    this.saved = null
    this.internal = { pageSize: { width: 210 } }
  }
  addImage() {}
  setFontSize() {}
  setFont() {}
  text() {}
  splitTextToSize(text) {
    return [text]
  }
  addPage() {}
  save(name) {
    this.saved = name
  }
}

class MockImage {
  constructor() {
    setImmediate(() => {
      if (this.onload) this.onload()
    })
  }
}

test('gerarPDFDoLog salva arquivo com nome correto', async () => {
  const log = {
    responsavel: 'João Silva',
    data_job: 'Projeto X',
    data_exportacao: new Date().toISOString(),
    total_checados: 1,
    itens_checados: [
      { id: 1, categoria: 'A', descricao: 'Item', quantidade: 1, quantidadeLevando: 1, estado: 'BOM' },
    ],
  }
  const pdf = await gerarPDFDoLog(log, MockPDF, MockImage)
  assert(pdf.saved.startsWith('checklist-João-Silva-Projeto-X'), 'nome do arquivo incorreto')
})

test('gerarPDFEquipamentos salva arquivo padrão', async () => {
  const equipamentos = [
    { id: 1, categoria: 'A', descricao: 'Item', quantidade: 1, quantidadeLevando: 1, estado: 'BOM' },
  ]
  const pdf = await gerarPDFEquipamentos(equipamentos, { responsavel: 'Maria', dataJob: 'Job Y' }, MockPDF, MockImage)
  assert(pdf.saved.startsWith('checklist-equipamentos-'), 'nome padrão não utilizado')
})
