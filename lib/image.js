// Renders the same invoice/receipt layout onto a canvas and downloads as PNG.
// Coordinate system: A4 at ~150 DPI => 1240 x 1754 px. All positions scaled from the mm-based PDF layout.

const PX_PER_MM = 1240 / 210; // ~5.9

function mm(v) {
  return v * PX_PER_MM;
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return d.getDate().toString().padStart(2, '0') + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

function wrapText(ctx, text, maxWidthPx) {
  const words = String(text || '-').split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidthPx && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function setupCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = mm(210);
  canvas.height = mm(297);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

function drawHeader(ctx, marginL, marginR, pageW, label, sublabel, docNumber) {
  let y = mm(22);
  ctx.fillStyle = '#1a1a1a';
  ctx.font = `bold ${mm(8.5)}px Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('EM-WORKS', marginL, y);

  ctx.font = `bold ${mm(5)}px Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(label, pageW - marginR, y - mm(0.5));

  ctx.font = `${mm(3.2)}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = '#888888';
  ctx.fillText(sublabel, pageW - marginR, y + mm(3));

  if (docNumber) {
    ctx.fillStyle = '#1a1a1a';
    ctx.font = `bold ${mm(3.5)}px Helvetica, Arial, sans-serif`;
    ctx.fillText(docNumber, pageW - marginR, y + mm(8));
  }

  y += mm(5);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1a1a1a';
  ctx.font = `${mm(3.5)}px Helvetica, Arial, sans-serif`;
  ctx.fillText('Freelance Academic & Writing Services', marginL, y);
  return y + mm(6);
}

function drawBilledToBox(ctx, marginL, marginR, pageW, contentW, y, clientName, clientCourse, dateLabel, dateValue) {
  y += mm(10);
  const boxY = y - mm(5);
  const boxH = clientCourse ? mm(24) : mm(18);
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(marginL, boxY, contentW, boxH);
  ctx.strokeStyle = '#dddddd';
  ctx.lineWidth = mm(0.3);
  ctx.beginPath();
  ctx.moveTo(marginL, boxY);
  ctx.lineTo(marginL, boxY + boxH);
  ctx.stroke();

  y += mm(2);
  ctx.font = `${mm(3.2)}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = '#888888';
  ctx.textAlign = 'left';
  ctx.fillText('BILLED TO', marginL + mm(5), y);
  ctx.textAlign = 'right';
  ctx.fillText(dateLabel, pageW - marginR - mm(5), y);

  y += mm(6);
  ctx.font = `bold ${mm(4.2)}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = 'left';
  ctx.fillText(clientName, marginL + mm(5), y);
  ctx.font = `${mm(3.8)}px Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(dateValue, pageW - marginR - mm(5), y);

  if (clientCourse) {
    y += mm(6);
    ctx.font = `${mm(3.5)}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle = '#555555';
    ctx.textAlign = 'left';
    ctx.fillText(clientCourse, marginL + mm(5), y);
  }
  return y + mm(14);
}

function drawItemsTable(ctx, marginL, marginR, pageW, contentW, y, items) {
  const col1 = marginL, col2 = marginL + mm(24), col3 = marginL + mm(92), col4 = pageW - marginR;
  const descWidthPx = col3 - col2 - mm(3);
  const headerH = mm(10);
  const lineH = mm(5);
  const minRowH = mm(10);

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(marginL, y, contentW, headerH);
  ctx.font = `bold ${mm(3.2)}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('WORK ID', col1 + mm(3), y + headerH / 2 + mm(1.2));
  ctx.fillText('DESCRIPTION', col2, y + headerH / 2 + mm(1.2));
  ctx.fillText('DATE ASSIGNED', col3, y + headerH / 2 + mm(1.2));
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT (Rs.)', col4 - mm(3), y + headerH / 2 + mm(1.2));

  y += headerH;
  ctx.font = `${mm(3.7)}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = '#1a1a1a';

  items.forEach((item) => {
    const lines = wrapText(ctx, item.description, descWidthPx);
    const rowH = Math.max(minRowH, lines.length * lineH + mm(4));
    const textY = y + mm(6);

    ctx.textAlign = 'left';
    ctx.fillText(item.workId || '-', col1 + mm(3), textY);
    lines.forEach((line, idx) => ctx.fillText(line, col2, textY + idx * lineH));
    ctx.fillText(fmtDate(item.dateAssigned), col3, textY);
    ctx.textAlign = 'right';
    ctx.fillText(Number(item.amount || 0).toFixed(2), col4 - mm(3), textY);

    y += rowH;
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = mm(0.2);
    ctx.beginPath();
    ctx.moveTo(marginL, y);
    ctx.lineTo(pageW - marginR, y);
    ctx.stroke();
  });

  return y;
}

function drawFooterPayment(ctx, marginL, y) {
  ctx.textAlign = 'left';
  ctx.font = `${mm(3.2)}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = '#888888';
  ctx.fillText('PAYMENT DUE TO', marginL, y);
  y += mm(6);
  ctx.font = `bold ${mm(4)}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillText('EM-WORKS', marginL, y);
  y += mm(6);
  ctx.font = `${mm(3.5)}px Helvetica, Arial, sans-serif`;
  ctx.fillText('Phone / UPI: 8590328268', marginL, y);
}

function downloadCanvas(canvas, fileName) {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

export function generateInvoicePNG(document_) {
  const { canvas, ctx } = setupCanvas();
  const marginL = mm(18), marginR = mm(18), pageW = mm(210);
  const contentW = pageW - marginL - marginR;

  let y = drawHeader(ctx, marginL, marginR, pageW, 'INVOICE', document_.status === 'paid' ? 'Paid' : 'Payment Due', document_.doc_number);
  y = drawBilledToBox(ctx, marginL, marginR, pageW, contentW, y, document_.client_name, document_.client_course, 'DATE ISSUED', fmtDate(document_.date_issued));
  y = drawItemsTable(ctx, marginL, marginR, pageW, contentW, y, document_.work_items || []);

  y += mm(12);
  const total = document_.total || 0;
  ctx.font = `bold ${mm(3.2)}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL DUE', marginL + mm(92), y);
  ctx.font = `bold ${mm(4.2)}px Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('Rs. ' + Number(total).toFixed(2), pageW - marginR, y + mm(1));

  y += mm(24);
  drawFooterPayment(ctx, marginL, y);

  ctx.textAlign = 'center';
  ctx.font = `${mm(2.8)}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText('Thank you for choosing EM-WORKS.', pageW / 2, mm(280));

  const nameForFile = (document_.file_label || document_.client_name || 'client').replace(/\s+/g, '_');
  downloadCanvas(canvas, `${document_.doc_number}_${nameForFile}.png`);
}

export function generateReceiptPNG(document_) {
  const { canvas, ctx } = setupCanvas();
  const marginL = mm(18), marginR = mm(18), pageW = mm(210);
  const contentW = pageW - marginL - marginR;

  const discount = document_.discount_amount || 0;
  const bonus = document_.bonus_amount || 0;
  const total = document_.total || 0;
  const netPayable = Math.max(0, total - discount - bonus);
  const paid = document_.amount_paid || 0;
  const balance = document_.balance_due || 0;
  const isPartial = balance > 0;

  let y = drawHeader(ctx, marginL, marginR, pageW, 'RECEIPT', isPartial ? 'Partial Payment' : 'Payment Received', document_.doc_number);
  y = drawBilledToBox(ctx, marginL, marginR, pageW, contentW, y, document_.client_name, document_.client_course, 'PAYMENT DATE', fmtDate(document_.payment_date));

  if (document_.linked_invoice_number) {
    ctx.font = `${mm(3.2)}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'left';
    ctx.fillText(`Against Invoice: ${document_.linked_invoice_number}`, marginL, y);
    y += mm(8);
  }

  y = drawItemsTable(ctx, marginL, marginR, pageW, contentW, y, document_.work_items || []);

  y += mm(12);
  ctx.textAlign = 'left';
  ctx.font = `bold ${mm(3.2)}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillText('TOTAL WORK VALUE', marginL + mm(82), y);
  ctx.font = `${mm(3.6)}px Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('Rs. ' + Number(total).toFixed(2), pageW - marginR, y);

  if (discount > 0) {
    y += mm(7);
    ctx.textAlign = 'left';
    ctx.font = `${mm(3.2)}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle = '#a06a00';
    ctx.fillText('DISCOUNT', marginL + mm(82), y);
    ctx.textAlign = 'right';
    ctx.fillText('- Rs. ' + Number(discount).toFixed(2), pageW - marginR, y);
  }
  if (bonus > 0) {
    y += mm(7);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#a06a00';
    ctx.fillText('BONUS', marginL + mm(82), y);
    ctx.textAlign = 'right';
    ctx.fillText('- Rs. ' + Number(bonus).toFixed(2), pageW - marginR, y);
  }
  if (discount > 0 || bonus > 0) {
    y += mm(7);
    ctx.textAlign = 'left';
    ctx.font = `bold ${mm(3.2)}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillText('NET PAYABLE', marginL + mm(82), y);
    ctx.textAlign = 'right';
    ctx.fillText('Rs. ' + Number(netPayable).toFixed(2), pageW - marginR, y);
  }

  y += mm(7);
  ctx.textAlign = 'left';
  ctx.font = `${mm(3.2)}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillText('AMOUNT PAID', marginL + mm(82), y);
  ctx.font = `bold ${mm(4.2)}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = '#1a7a34';
  ctx.textAlign = 'right';
  ctx.fillText('Rs. ' + Number(paid).toFixed(2), pageW - marginR, y);

  if (balance > 0) {
    y += mm(7);
    ctx.textAlign = 'left';
    ctx.font = `${mm(3.2)}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle = '#a06a00';
    ctx.fillText('BALANCE DUE', marginL + mm(82), y);
    ctx.font = `bold ${mm(3.8)}px Helvetica, Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('Rs. ' + Number(balance).toFixed(2), pageW - marginR, y);
  }

  y += mm(10);
  ctx.textAlign = 'left';
  ctx.font = `${mm(3)}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = '#555555';
  const methodLine = `Received via ${document_.payment_method || '-'} on ${fmtDate(document_.payment_date)}.`;
  ctx.fillText(methodLine, marginL, y);

  y += mm(18);
  drawFooterPayment(ctx, marginL, y);

  ctx.textAlign = 'center';
  ctx.font = `${mm(2.8)}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText('Thank you for choosing EM-WORKS.', pageW / 2, mm(280));

  const nameForFile = (document_.file_label || document_.client_name || 'client').replace(/\s+/g, '_');
  downloadCanvas(canvas, `${document_.doc_number}_Receipt_${nameForFile}.png`);
}
