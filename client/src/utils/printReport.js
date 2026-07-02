export function openPrintableHtml(html) {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    throw new Error('No se pudo abrir la ventana de impresion. Revisa el bloqueador de ventanas emergentes.');
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.setTimeout(() => printWindow.print(), 300);
}
