import { jsPDF } from 'jspdf';

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return d.getDate().toString().padStart(2, '0') + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

function drawHeader(doc, marginL, marginR, pageW, label, sublabel, docNumber) {
  let y = 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor('#1a1a1a');
  doc.text('EM-WORKS', marginL, y);

  doc.setFontSize(14);
  doc.text(label, pageW - marginR, y - 2, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#888888');
  doc.text(sublabel, pageW - marginR, y + 3, { align: 'right' });

  if (docNumber) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor('#1a1a1a');
    doc.text(docNumber, pageW - marginR, y + 8, { align: 'right' });
  }

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor('#1a1a1a');
  doc.text('Freelance Academic & Writing Services', marginL, y);
  return y + 6;
}

function drawBilledToBox(doc, marginL, marginR, pageW, contentW, y, clientName, clientCourse, dateLabel, dateValue) {
  y += 10;
  const boxY = y - 5;
  const boxH = clientCourse ? 24 : 18;
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(marginL, boxY, contentW, boxH, 2, 2, 'F');
  doc.setDrawColor('#dddddd');
  doc.setLineWidth(0.3);
  doc.line(marginL, boxY, marginL, boxY + boxH);

  y += 2;
  doc.setFontSize(9);
  doc.setTextColor('#888888');
  doc.text('BILLED TO', marginL + 5, y);
  doc.text(dateLabel, pageW - marginR - 5, y, { align: 'right' });

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor('#1a1a1a');
  doc.text(clientName, marginL + 5, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(dateValue, pageW - marginR - 5, y, { align: 'right' });

  if (clientCourse) {
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor('#555555');
    doc.text(clientCourse, marginL + 5, y);
  }
  return y + 14;
}

function drawItemsTable(doc, marginL, marginR, pageW, contentW, y, items) {
  const col1 = marginL, col2 = marginL + 24, col3 = marginL + 92, col4 = pageW - marginR;
  const descWidth = col3 - col2 - 3;
  const headerH = 10;
  const lineH = 5;
  const minRowH = 10;

  doc.setFillColor(26, 26, 26);
  doc.rect(marginL, y, contentW, headerH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('WORK ID', col1 + 3, y + headerH / 2 + 1.2);
  doc.text('DESCRIPTION', col2, y + headerH / 2 + 1.2);
  doc.text('DATE ASSIGNED', col3, y + headerH / 2 + 1.2);
  doc.text('AMOUNT (Rs.)', col4 - 3, y + headerH / 2 + 1.2, { align: 'right' });

  y += headerH;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor('#1a1a1a');

  items.forEach((item) => {
    const descLines = doc.splitTextToSize(item.description || '-', descWidth);
    const rowH = Math.max(minRowH, descLines.length * lineH + 4);
    const textY = y + 6;

    doc.text(item.workId || '-', col1 + 3, textY);
    doc.text(descLines, col2, textY);
    doc.text(fmtDate(item.dateAssigned), col3, textY);
    doc.text(Number(item.amount || 0).toFixed(2), col4 - 3, textY, { align: 'right' });

    y += rowH;
    doc.setDrawColor('#e0e0e0');
    doc.setLineWidth(0.2);
    doc.line(marginL, y, pageW - marginR, y);
  });

  return y;
}

function drawFooterPayment(doc, marginL, y) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#888888');
  doc.text('PAYMENT DUE TO', marginL, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor('#1a1a1a');
  doc.text('EM-WORKS', marginL, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Phone / UPI: 8590328268', marginL, y);
}

export function generateInvoicePDF(document, { download = true } = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const marginL = 18, marginR = 18, pageW = 210;
  const contentW = pageW - marginL - marginR;

  let y = drawHeader(doc, marginL, marginR, pageW, 'INVOICE', document.status === 'paid' ? 'Paid' : 'Payment Due', document.doc_number);
  y = drawBilledToBox(doc, marginL, marginR, pageW, contentW, y, document.client_name, document.client_course, 'DATE ISSUED', fmtDate(document.date_issued));
  y = drawItemsTable(doc, marginL, marginR, pageW, contentW, y, document.work_items || []);

  y += 12;
  const total = document.total || 0;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor('#1a1a1a');
  doc.text('TOTAL DUE', marginL + 92, y);
  doc.setFontSize(13);
  doc.text('Rs. ' + Number(total).toFixed(2), pageW - marginR, y + 1, { align: 'right' });

  y += 24;
  drawFooterPayment(doc, marginL, y);

  doc.setFontSize(8);
  doc.setTextColor('#aaaaaa');
  doc.text('Thank you for choosing EM-WORKS.', pageW / 2, 280, { align: 'center' });

  const nameForFile = (document.label || document.client_name || 'client').replace(/\s+/g, '_');
  const fileName = `${document.doc_number}_${nameForFile}.pdf`;
  if (download) doc.save(fileName);
  return doc;
}

export function generateReceiptPDF(document, { download = true } = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const marginL = 18, marginR = 18, pageW = 210;
  const contentW = pageW - marginL - marginR;

  const discount = document.discount_amount || 0;
  const bonus = document.bonus_amount || 0;
  const total = document.total || 0;
  const netPayable = Math.max(0, total - discount - bonus);
  const paid = document.amount_paid || 0;
  const balance = document.balance_due || 0;
  const isPartial = balance > 0;

  let y = drawHeader(doc, marginL, marginR, pageW, 'RECEIPT', isPartial ? 'Partial Payment' : 'Payment Received', document.doc_number);
  y = drawBilledToBox(doc, marginL, marginR, pageW, contentW, y, document.client_name, document.client_course, 'PAYMENT DATE', fmtDate(document.payment_date));

  if (document.linked_invoice_number) {
    doc.setFontSize(9);
    doc.setTextColor('#888888');
    doc.text(`Against Invoice: ${document.linked_invoice_number}`, marginL, y);
    y += 8;
  }

  y = drawItemsTable(doc, marginL, marginR, pageW, contentW, y, document.work_items || []);

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor('#1a1a1a');
  doc.text('TOTAL WORK VALUE', marginL + 82, y);
  doc.setFontSize(11);
  doc.text('Rs. ' + Number(total).toFixed(2), pageW - marginR, y, { align: 'right' });

  if (discount > 0) {
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#a06a00');
    doc.text('DISCOUNT', marginL + 82, y);
    doc.text('- Rs. ' + Number(discount).toFixed(2), pageW - marginR, y, { align: 'right' });
  }
  if (bonus > 0) {
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#a06a00');
    doc.text('BONUS', marginL + 82, y);
    doc.text('- Rs. ' + Number(bonus).toFixed(2), pageW - marginR, y, { align: 'right' });
  }
  if (discount > 0 || bonus > 0) {
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor('#1a1a1a');
    doc.text('NET PAYABLE', marginL + 82, y);
    doc.text('Rs. ' + Number(netPayable).toFixed(2), pageW - marginR, y, { align: 'right' });
  }

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor('#1a1a1a');
  doc.text('AMOUNT PAID', marginL + 82, y);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#1a7a34');
  doc.text('Rs. ' + Number(paid).toFixed(2), pageW - marginR, y, { align: 'right' });

  if (balance > 0) {
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#a06a00');
    doc.text('BALANCE DUE', marginL + 82, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Rs. ' + Number(balance).toFixed(2), pageW - marginR, y, { align: 'right' });
  }

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor('#555555');
  const methodLine = `Received via ${document.payment_method || '-'} on ${fmtDate(document.payment_date)}.`;
  doc.text(methodLine, marginL, y);

  y += 18;
  drawFooterPayment(doc, marginL, y);

  doc.setFontSize(8);
  doc.setTextColor('#aaaaaa');
  doc.text('Thank you for choosing EM-WORKS.', pageW / 2, 280, { align: 'center' });

  const nameForFile = (document.label || document.client_name || 'client').replace(/\s+/g, '_');
  const fileName = `${document.doc_number}_Receipt_${nameForFile}.pdf`;
  if (download) doc.save(fileName);
  return doc;
}
