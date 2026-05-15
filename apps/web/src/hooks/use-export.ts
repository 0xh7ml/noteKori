import { format } from 'date-fns'
import type { Transaction, AnalyticsSummary, Category } from '@notekori/types'

export function useExport() {
  async function exportToPDF(
    transactions: (Transaction & { categoryName?: string })[],
    summary: AnalyticsSummary,
    from: Date,
    to: Date,
    currency = 'USD',
  ) {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()
    const fmt = (n: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)

    // Header
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('NoteKori', 14, 18)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text('Financial Report', 14, 25)
    doc.text(`${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`, 14, 31)
    doc.setTextColor(0)

    // Summary table
    autoTable(doc, {
      startY: 40,
      head: [['Summary', 'Amount']],
      body: [
        ['Total Income',  fmt(summary.totalIncome)],
        ['Total Expense', fmt(summary.totalExpense)],
        ['Net Balance',   fmt(summary.balance)],
        ['Transactions',  String(summary.count)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [15, 15, 15], textColor: 255 },
      columnStyles: { 1: { halign: 'right' } },
    })

    const afterSummary = (doc as any).lastAutoTable.finalY + 12
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Transaction Details', 14, afterSummary)

    autoTable(doc, {
      startY: afterSummary + 4,
      head: [['Date', 'Title', 'Category', 'Type', 'Amount']],
      body: transactions.map(t => [
        format(new Date(t.date), 'MMM d, yyyy'),
        t.title,
        t.categoryName ?? '—',
        t.type.toUpperCase(),
        (t.type === 'income' ? '+' : '-') + fmt(t.amount),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [15, 15, 15], textColor: 255 },
      columnStyles: {
        4: { halign: 'right' },
      },
      didParseCell(data) {
        if (data.column.index === 4 && data.section === 'body') {
          const val = data.cell.raw as string
          data.cell.styles.textColor = val.startsWith('+') ? [22, 163, 74] : [220, 38, 38]
        }
      },
    })

    doc.save(
      `notekori_${format(from, 'yyyy-MM-dd')}_${format(to, 'yyyy-MM-dd')}.pdf`
    )
  }

  return { exportToPDF }
}
