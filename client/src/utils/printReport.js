export function openPrintableHtml(html) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  const cleanup = () => {
    iframe.remove();
  };

  iframe.onload = () => {
    const iframeWindow = iframe.contentWindow;

    // Small delay so images (e.g. the logo) finish rendering before the print snapshot is taken.
    window.setTimeout(() => {
      iframeWindow.focus();
      iframeWindow.print();
    }, 150);
  };

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    cleanup();
    throw new Error('No se pudo preparar el documento de impresión.');
  }

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow.addEventListener('afterprint', cleanup, { once: true });
  // Fallback in case `afterprint` never fires (e.g. some mobile browsers).
  window.setTimeout(cleanup, 60000);
}
