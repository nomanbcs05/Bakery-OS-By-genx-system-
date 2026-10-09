import { useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, LayoutList } from 'lucide-react';
import type { Dispatch } from '@/types';
import { useApp } from '@/context/AppContext';

interface DispatchItemSummaryModalProps {
  open: boolean;
  onClose: () => void;
  filteredDispatches: Dispatch[];
  filterLabel?: string; // e.g. "September 2026" or "2026-09-01 to 2026-09-12"
}

export default function DispatchItemSummaryModal({
  open,
  onClose,
  filteredDispatches,
  filterLabel,
}: DispatchItemSummaryModalProps) {
  const { getProductById } = useApp();
  const printAreaRef = useRef<HTMLDivElement>(null);

  // ── Aggregate product quantities across all filtered dispatches ──
  const { summaryRows, totalItems, totalSales } = useMemo(() => {
    const summary: Record<string, { name: string; unit: string; quantity: number; value: number }> = {};

    filteredDispatches.forEach(dispatch => {
      dispatch.items.forEach(item => {
        const product = getProductById(item.productId);
        const name = product?.name || `Product (${item.productId})`;
        const unit = product?.unit || 'pc';
        const price = item.customPrice ?? product?.price ?? 0;
        if (!summary[item.productId]) {
          summary[item.productId] = { name, unit, quantity: 0, value: 0 };
        }
        summary[item.productId].quantity += item.quantity;
        summary[item.productId].value += item.quantity * price;
      });
    });

    const rows = Object.values(summary).sort((a, b) => b.quantity - a.quantity);
    const totalItems = rows.reduce((s, r) => s + r.quantity, 0);
    const totalSales = rows.reduce((s, r) => s + r.value, 0);
    return { summaryRows: rows, totalItems, totalSales };
  }, [filteredDispatches, getProductById]);

  const today = new Date().toLocaleDateString('en-PK', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML;
    if (!printContent) return;

    const win = window.open('', '_blank', 'width=400,height=900');
    if (!win) return;

    win.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Bakery Dispatch Summary</title>
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
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .header h1 {
      font-size: 11pt;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .header .date-line {
      font-size: 7.5pt;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
    }
    th {
      text-align: left;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding: 3px 2px;
    }
    th.right, td.right { text-align: right; }
    td {
      padding: 3px 2px;
      border-bottom: 1px dashed #aaa;
      font-size: 8pt;
    }
    tr:last-child td { border-bottom: none; }
    .product-name { font-weight: 700; font-size: 8pt; }
    .totals-table { margin-top: 6px; border-top: 1.5px solid #000; }
    .totals-table td {
      padding: 3px 2px;
      border: none;
      font-size: 9pt;
      font-weight: 700;
    }
    .grand-total { font-size: 10pt; font-weight: 900; }
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
    <h1>Bakery Dispatch Summary</h1>
    <div class="date-line">Date: ${filterLabel || today} &nbsp;|&nbsp; Printed: ${today}</div>
    <div class="date-line">Total Dispatches in Filter: ${filteredDispatches.length}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Product Name</th>
        <th class="right">Unit</th>
        <th class="right">Qty</th>
        <th class="right">Sales Value</th>
      </tr>
    </thead>
    <tbody>
      ${summaryRows.map((r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td class="product-name">${r.name}</td>
          <td class="right">${r.unit}</td>
          <td class="right"><strong>${r.quantity.toLocaleString()}</strong></td>
          <td class="right">${r.value > 0 ? 'Rs. ' + r.value.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '—'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <table class="totals-table">
    <tr>
      <td style="width:60%">Total Items Dispatched:</td>
      <td class="right grand-total">${totalItems.toLocaleString()}</td>
    </tr>
    ${totalSales > 0 ? `
    <tr>
      <td>Total Sales Value:</td>
      <td class="right grand-total">Rs. ${totalSales.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>` : ''}
  </table>

  <div class="footer">
    Bakery OS by GenX System &nbsp;|&nbsp; bakery-os-by-genx-system.vercel.app
  </div>
</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
          <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="h-9 w-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/25">
              <LayoutList className="h-4.5 w-4.5" />
            </div>
            Dispatch Item Summary
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1 pl-0.5">
            Aggregated from <strong className="text-indigo-600">{filteredDispatches.length}</strong> dispatch record{filteredDispatches.length !== 1 ? 's' : ''}
            {filterLabel && <span className="ml-1">— <em>{filterLabel}</em></span>}
          </p>
        </DialogHeader>

        {/* Summary Table */}
        <div ref={printAreaRef} className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {summaryRows.length === 0 ? (
            <div className="text-center py-12 text-slate-400 italic text-sm">
              No dispatches to summarise for the current filter.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 text-xs font-black uppercase tracking-wider text-slate-400 w-8">#</th>
                  <th className="text-left py-2 text-xs font-black uppercase tracking-wider text-slate-400">Product Name</th>
                  <th className="text-right py-2 text-xs font-black uppercase tracking-wider text-slate-400">Unit</th>
                  <th className="text-right py-2 text-xs font-black uppercase tracking-wider text-slate-400">Qty</th>
                  <th className="text-right py-2 text-xs font-black uppercase tracking-wider text-slate-400">Sales Value</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((row, idx) => (
                  <tr key={row.name} className="border-b border-slate-50 dark:border-slate-800 hover:bg-indigo-50/30 transition-colors">
                    <td className="py-2.5 text-xs text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-100">{row.name}</td>
                    <td className="py-2.5 text-right text-xs text-slate-500">{row.unit}</td>
                    <td className="py-2.5 text-right font-mono font-black text-slate-900 dark:text-white text-base">
                      {row.quantity.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right font-mono text-sm">
                      {row.value > 0 ? (
                        <span className="text-emerald-600 font-bold">
                          Rs. {row.value.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Totals Footer */}
        {summaryRows.length > 0 && (
          <div className="border-t-2 border-slate-200 dark:border-slate-700 mx-6 pt-3 pb-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Items Dispatched</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {totalItems.toLocaleString()}
              </span>
            </div>
            {totalSales > 0 && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Sales Value</span>
                <span className="text-xl font-black text-emerald-600 font-mono">
                  Rs. {totalSales.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 rounded-xl font-semibold flex items-center gap-1.5"
          >
            <X className="h-4 w-4" /> Close
          </Button>
          <Button
            onClick={handlePrint}
            disabled={summaryRows.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 font-bold rounded-xl px-5 flex items-center gap-2"
          >
            <Printer className="h-4 w-4" /> Print / Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
