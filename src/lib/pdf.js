import jsPDF from 'jspdf'

const logoBrick = new URL('../assets/02.png', import.meta.url).href

export function gerarChecklistPDF({ responsavel, dataJob, itens, totalChecados, nomeArquivo, dataOriginal }, PDFClass = jsPDF, ImageClass = Image) {
  return new Promise((resolve) => {
    const pdf = new PDFClass()
    const pageWidth = pdf.internal.pageSize.width
    const margin = 20
    let yPosition = margin

    const img = new ImageClass()
    img.onload = function () {
      const imgWidth = 30
      const imgHeight = (img.height * imgWidth) / img.width
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

      if (dataOriginal) {
        pdf.text(`Gerado originalmente em: ${new Date(dataOriginal).toLocaleString('pt-BR')}`, margin, yPosition)
        yPosition += 5
        pdf.text(
          `PDF regenerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
          margin,
          yPosition
        )
        yPosition += 5
      } else {
        pdf.text(
          `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
          margin,
          yPosition
        )
        yPosition += 5
      }

      yPosition += 10
      pdf.text(`Equipamentos selecionados: ${totalChecados}`, margin, yPosition)
      yPosition += 10

      const equipamentosPorCategoria = (itens || []).reduce((acc, eq) => {
        if (!acc[eq.categoria]) {
          acc[eq.categoria] = []
        }
        acc[eq.categoria].push(eq)
        return acc
      }, {})

      Object.entries(equipamentosPorCategoria).forEach(([categoria, itensCat]) => {
        if (yPosition > 250) {
          pdf.addPage()
          yPosition = margin
        }

        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`${categoria} (${itensCat.length} itens)`, margin, yPosition)
        yPosition += 10

        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')

        itensCat.forEach(item => {
          if (yPosition > 270) {
            pdf.addPage()
            yPosition = margin
          }

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

      pdf.save(nomeArquivo)
      resolve(pdf)
    }
    img.src = logoBrick
  })
}
