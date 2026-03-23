interface ReceiptItem {
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface ReceiptData {
  empresa: string;
  sucursal: string;
  direccion?: string;
  cuit?: string;
  numero: string;
  fecha: string;
  cliente: string;
  vendedor?: string;
  items: ReceiptItem[];
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  condicion_pago: string;
  observaciones?: string;
}

function padRight(text: string, width: number): string {
  return text.slice(0, width).padEnd(width);
}

function padLeft(text: string, width: number): string {
  return text.slice(0, width).padStart(width);
}

function formatMoney(amount: number): string {
  return `$${amount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function centerText(text: string, width: number = 32): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(padding) + text;
}

export function buildReceiptHtml(data: ReceiptData): string {
  const W = 32; // characters per line for 58mm
  const SEP = "\u2500".repeat(W);

  const lines: string[] = [];

  // Header
  lines.push(centerText(data.empresa, W));
  lines.push(centerText(data.sucursal, W));
  if (data.direccion) lines.push(centerText(data.direccion, W));
  if (data.cuit) lines.push(centerText(`CUIT: ${data.cuit}`, W));
  lines.push(SEP);

  // Receipt info
  lines.push(`Ticket: ${data.numero}`);
  lines.push(`Fecha: ${data.fecha}`);
  lines.push(`Cliente: ${data.cliente}`);
  if (data.vendedor) lines.push(`Vendedor: ${data.vendedor}`);
  lines.push(`Pago: ${data.condicion_pago}`);
  lines.push(SEP);

  // Items header
  lines.push(`${padRight("Producto", 16)} ${padLeft("Cant", 4)} ${padLeft("Total", 10)}`);
  lines.push(SEP);

  // Items
  for (const item of data.items) {
    const name = padRight(item.nombre.slice(0, 16), 16);
    const qty = padLeft(item.cantidad.toString(), 4);
    const total = padLeft(formatMoney(item.subtotal), 10);
    lines.push(`${name} ${qty} ${total}`);
    if (item.nombre.length > 16) {
      lines.push(`  ${item.nombre.slice(16, 30)}`);
    }
  }

  lines.push(SEP);

  // Totals
  lines.push(`${padRight("Subtotal:", 20)} ${padLeft(formatMoney(data.subtotal), 12)}`);
  if (data.descuento > 0) {
    lines.push(`${padRight("Descuento:", 20)} ${padLeft(`-${formatMoney(data.descuento)}`, 12)}`);
  }
  if (data.impuestos > 0) {
    lines.push(`${padRight("Impuestos:", 20)} ${padLeft(formatMoney(data.impuestos), 12)}`);
  }
  lines.push(SEP);
  lines.push(`${padRight("TOTAL:", 20)} ${padLeft(formatMoney(data.total), 12)}`);
  lines.push(SEP);

  // Footer
  if (data.observaciones) {
    lines.push(data.observaciones);
    lines.push(SEP);
  }
  lines.push(centerText("\u00a1Gracias por su compra!", W));
  lines.push(centerText(new Date().toLocaleTimeString("es-AR"), W));

  // Build HTML for thermal print
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ticket ${data.numero}</title>
  <style>
    @page { margin: 0; size: 58mm auto; }
    body {
      font-family: "Courier New", monospace;
      font-size: 10px;
      line-height: 1.3;
      width: 58mm;
      margin: 0 auto;
      padding: 4mm 2mm;
      color: #000;
    }
    pre {
      margin: 0;
      font-family: inherit;
      font-size: inherit;
      white-space: pre-wrap;
      word-break: break-all;
    }
    @media print {
      body { padding: 0 2mm; }
    }
  </style>
</head>
<body>
  <pre>${lines.join("\n")}</pre>
</body>
</html>`;
}

export function printReceipt(data: ReceiptData): void {
  const html = buildReceiptHtml(data);
  const printWindow = window.open("", "_blank", "width=300,height=600");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };
}
