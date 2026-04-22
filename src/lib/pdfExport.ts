export function printToPDF(title: string) {
  const originalTitle = document.title;
  document.title = title;

  const style = document.createElement('style');
  style.id = 'print-override';
  style.textContent = `
    @media print {
      body { background: white !important; color: black !important; }
      .glass-panel, .glass-sidebar, header { background: white !important; border: 1px solid #e2e8f0 !important; box-shadow: none !important; }
      .text-white { color: #1e293b !important; }
      .text-muted-foreground { color: #64748b !important; }
      button, [role="button"] { display: none !important; }
      aside, header { display: none !important; }
      main { margin: 0 !important; padding: 0 !important; }
    }
  `;
  document.head.appendChild(style);

  window.print();

  setTimeout(() => {
    document.title = originalTitle;
    document.head.removeChild(style);
  }, 500);
}
