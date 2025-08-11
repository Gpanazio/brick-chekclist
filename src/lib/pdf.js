import jsPDF from 'jspdf'

export function gerarPDFDoLog(log, PDFClass = jsPDF, ImageClass = Image, logo = '') {
  const pdf = new PDFClass()
  const pageWidth = pdf.internal.pageSize.width
  const margin = 20
  let yPosition = margin
  return new Promise((resolve) => {
    const img = new ImageClass()
    img.src = logo
    img.onload = function () {
      const imgWidth = 30
      const imgHeight = (this.height * imgWidth) / this.width
      pdf.addImage(img, 'PNG', margin, yPosition, imgWidth, imgHeight)
      yPosition += imgHeight + 5

      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Checklist - Equipamentos Selecionados', margin, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Responsável: ${log.responsavel}`, margin, yPosition)
      yPosition += 5
      pdf.text(`Data/Job: ${log.data_job}`, margin, yPosition)
      yPosition += 5
      pdf.text(`Gerado originalmente em: ${new Date(log.data_exportacao).toLocaleString('pt-BR')}`, margin, yPosition)
      yPosition += 5
      pdf.text(`PDF regenerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPosition)
      yPosition += 15

      pdf.text(`Equipamentos selecionados: ${log.total_checados}`, margin, yPosition)
      yPosition += 10

      const equipamentosPorCategoria = (log.itens_checados || []).reduce((acc, eq) => {
        if (!acc[eq.categoria]) acc[eq.categoria] = []
        acc[eq.categoria].push(eq)
        return acc
      }, {})

      Object.entries(equipamentosPorCategoria).forEach(([categoria, itens]) => {
        if (yPosition > 250) { pdf.addPage(); yPosition = margin }
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`${categoria} (${itens.length} itens)`, margin, yPosition)
        yPosition += 10
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        itens.forEach(item => {
          if (yPosition > 270) { pdf.addPage(); yPosition = margin }
          let texto = `${item.descricao}`
          if (item.quantidade > 1) {
            texto += ` (Levando: ${item.quantidadeLevando} de ${item.quantidade})`
          } else {
            texto += ` (Qtd: ${item.quantidade})`
          }
          texto += ` - ${item.estado}`
          if (item.observacoes) {
            texto += ` | Obs: ${item.observacoes}`
          }
          const linhas = pdf.splitTextToSize(texto, pageWidth - 2 * margin)
          pdf.text(linhas, margin + 5, yPosition)
          yPosition += linhas.length * 4
        })
        yPosition += 5
      })

      const nomeArquivo = `checklist-${log.responsavel.replace(/\s+/g, '-')}-${log.data_job.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(nomeArquivo)
      resolve(pdf)
    }
  })
}

export function gerarPDFEquipamentos(equipamentosChecados, { responsavel, dataJob }, PDFClass = jsPDF, ImageClass = Image, logo = '') {
  const pdf = new PDFClass()
  const pageWidth = pdf.internal.pageSize.width
  const margin = 20
  let yPosition = margin
  return new Promise((resolve) => {
    const img = new ImageClass()
    img.src = logo
    img.onload = function () {
      const imgWidth = 30
      const imgHeight = (this.height * imgWidth) / this.width
      pdf.addImage(img, 'PNG', margin, yPosition, imgWidth, imgHeight)
      yPosition += imgHeight + 5

      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Checklist - Equipamentos Selecionados', margin, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Responsável: ${responsavel}`, margin, yPosition)
      yPosition += 5
      pdf.text(`Data/Job: ${dataJob}`, margin, yPosition)
      yPosition += 5
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPosition)
      yPosition += 15

      pdf.text(`Equipamentos selecionados: ${equipamentosChecados.length}`, margin, yPosition)
      yPosition += 10

      const equipamentosPorCategoria = equipamentosChecados.reduce((acc, eq) => {
        if (!acc[eq.categoria]) acc[eq.categoria] = []
        acc[eq.categoria].push(eq)
        return acc
      }, {})

      Object.entries(equipamentosPorCategoria).forEach(([categoria, itens]) => {
        if (yPosition > 250) { pdf.addPage(); yPosition = margin }
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`${categoria} (${itens.length} itens)`, margin, yPosition)
        yPosition += 10
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        itens.forEach(item => {
          if (yPosition > 270) { pdf.addPage(); yPosition = margin }
          let texto = `${item.descricao}`
          if (item.quantidade > 1) {
            texto += ` (Levando: ${item.quantidadeLevando} de ${item.quantidade})`
          } else {
            texto += ` (Qtd: ${item.quantidade})`
          }
          texto += ` - ${item.estado}`
          if (item.observacoes) {
            texto += ` | Obs: ${item.observacoes}`
          }
          const linhas = pdf.splitTextToSize(texto, pageWidth - 2 * margin)
          pdf.text(linhas, margin + 5, yPosition)
          yPosition += linhas.length * 4
        })
        yPosition += 5
      })

      const nomeArquivo = `checklist-equipamentos-${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(nomeArquivo)
      resolve(pdf)
    }
  })
}
