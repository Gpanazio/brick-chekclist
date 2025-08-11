import test from 'node:test'
import assert from 'node:assert/strict'
import { gerarChecklistPDF } from '../src/lib/pdf.js'

class MockJsPDF {
  constructor() {
    this.texts = []
    this.saved = null
    this.internal = { pageSize: { width: 210 } }
  }
  addImage() {}
  setFontSize() {}
  setFont() {}
  text(t) {
    this.texts.push(Array.isArray(t) ? t.join(' ') : t)
  }
  addPage() {}
  splitTextToSize(text) {
    return [text]
  }
  save(name) {
    this.saved = name
  }
}

class MockImage {
  constructor() {
    this.width = 100
    this.height = 100
  }
  set src(value) {
    this._src = value
    if (this.onload) this.onload()
  }
}

test('gera PDF com dados básicos', async () => {
  const dados = {
    responsavel: 'João',
    dataJob: '10/10/2025 - Projeto X',
    itens: [
      { categoria: 'Câmeras', descricao: 'Camera A', quantidade: 2, quantidadeLevando: 1, estado: 'OK', observacoes: 'Nada' },
      { categoria: 'Câmeras', descricao: 'Camera B', quantidade: 1, estado: 'OK' },
      { categoria: 'Luzes', descricao: 'Luz A', quantidade: 1, estado: 'OK' }
    ],
    totalChecados: 3,
    nomeArquivo: 'teste.pdf'
  }

  const pdf = await gerarChecklistPDF(dados, MockJsPDF, MockImage)
  assert.equal(pdf.saved, 'teste.pdf')
  assert.ok(pdf.texts.includes('Responsável: João'))
  assert.ok(pdf.texts.includes('Data/Job: 10/10/2025 - Projeto X'))
  assert.ok(pdf.texts.some(t => t.includes('Equipamentos selecionados: 3')))
})

test('inclui informações de regeneração quando dataOriginal é passada', async () => {
  const dados = {
    responsavel: 'Maria',
    dataJob: 'Evento',
    itens: [],
    totalChecados: 0,
    nomeArquivo: 'log.pdf',
    dataOriginal: '2024-01-01T12:00:00Z'
  }

  const pdf = await gerarChecklistPDF(dados, MockJsPDF, MockImage)
  assert.ok(pdf.texts.some(t => t.startsWith('Gerado originalmente em:')))
  assert.ok(pdf.texts.some(t => t.startsWith('PDF regenerado em:')))
  assert.ok(!pdf.texts.some(t => t.startsWith('Gerado em:')))
})
