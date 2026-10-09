import { useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

interface DispatchSummaryDialogProps {
  open: boolean;
  onClose: () => void;
  date: string;
}

export default function DispatchSummaryDialog({ open, onClose, date }: DispatchSummaryDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { dispatches, getProductById, receiptSettings } = useApp();

  const todayDispatches = dispatches.filter(d => d.date === date);

  // Group items by product — include unit, qty, and sale value
  const summary: Record<string, { name: string; unit: string; quantity: number; value: number }> = {};
  todayDispatches.forEach(d => {
    d.items.forEach(item => {
      const p = getProductById(item.productId);
      if (!p) return;
      const price = item.customPrice ?? p.price ?? 0;
      if (summary[item.productId]) {
        summary[item.productId].quantity += item.quantity;
        summary[item.productId].value += item.quantity * price;
      } else {
        summary[item.productId] = {
          name: p.name,
          unit: p.unit || 'pc',
          quantity: item.quantity,
          value: item.quantity * price,
        };
      }
    });
  });

  const summaryList = Object.values(summary).sort((a, b) => b.quantity - a.quantity);
  const totalQty = summaryList.reduce((s, r) => s + r.quantity, 0);
  const totalValue = summaryList.reduce((s, r) => s + r.value, 0);
  const brandName = receiptSettings?.brandName || 'BAKEWISE';

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const win = window.open('', '_blank', 'width=400,height=900');
    if (!win) return;

    win.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Daily Dispatch Summary</title>
  <style>
    @page { size: 80mm auto; margin: 3mm 2mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      color: #000;
      background: #fff;
      width: 76mm;
    }
    .header {
      text-align: center;
      border-bottom: 1.5px solid #000;
      padding-bottom: 5px;
      margin-bottom: 6px;
    }
    .brand { font-size: 12pt; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
    .title { font-size: 9pt; font-weight: 700; text-transform: uppercase; margin-top: 2px; }
    .meta { font-size: 7.5pt; margin-top: 3px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 5px;
    }
    th {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding: 3px 2px;
      text-align: left;
    }
    th.r, td.r { text-align: right; }
    td {
      padding: 3px 2px;
      border-bottom: 1px dashed #bbb;
      font-size: 8pt;
      vertical-align: top;
    }
    tr:last-child td { border-bottom: none; }
    .pname { font-weight: 700; }
    .totals {
      margin-top: 6px;
      border-top: 1.5px solid #000;
      padding-top: 4px;
    }
    .totals td {
      font-size: 9pt;
      font-weight: 700;
      padding: 2px 2px;
      border: none;
    }
    .grand { font-size: 10pt; }
    .footer {
      margin-top: 8px;
      text-align: center;
      font-size: 6.5pt;
      border-top: 1px dashed #aaa;
      padding-top: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">${brandName}</div>
    <div class="title">Daily Dispatch Summary</div>
    <div class="meta">Date: ${date} &nbsp;|&nbsp; Dispatches: ${todayDispatches.length}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Product</th>
        <th class="r">Unit</th>
        <th class="r">Qty</th>
        <th class="r">Value</th>
      </tr>
    </thead>
    <tbody>
      ${summaryList.map((item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td class="pname">${item.name}</td>
          <td class="r">${item.unit}</td>
          <td class="r"><strong>${item.quantity.toLocaleString()}</strong></td>
          <td class="r">${item.value > 0 ? 'Rs.' + item.value.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-'}</td>
        </tr>
      `).join('')}
      ${summaryList.length === 0 ? `<tr><td colspan="5" style="text-align:center;padding:10px;font-style:italic;">No dispatches for this date</td></tr>` : ''}
    </tbody>
  </table>

  <table class="totals">
    <tr>
      <td style="width:60%">Total Items Qty:</td>
      <td class="r grand">${totalQty.toLocaleString()}</td>
    </tr>
    ${totalValue > 0 ? `
    <tr>
      <td>Total Sale Value:</td>
      <td class="r grand">Rs. ${totalValue.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
    </tr>` : ''}
  </table>

  <div class="footer">
    Bakery OS by GenX System &nbsp;|&nbsp; Printed: ${new Date().toLocaleString('en-PK')}
  </div>
</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 400);
    onClose();
  };

  useEffect(() => {
    if (open) {
      handlePrint();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return null;
}
