import { useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
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

  // Group items by product across all today's dispatches
  const summary: Record<string, { name: string; quantity: number }> = {};
  todayDispatches.forEach(d => {
    d.items.forEach(item => {
      const p = getProductById(item.productId);
      if (!p) return;
      if (summary[item.productId]) {
        summary[item.productId].quantity += item.quantity;
      } else {
        summary[item.productId] = { name: p.name, quantity: item.quantity };
      }
    });
  });

  const summaryList = Object.values(summary).sort((a, b) => b.quantity - a.quantity);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html><head><title>Dispatch Summary</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; font-size: 11pt; padding: 10px; }
          .text-center { text-align: center; }
          .divider { border-top: 1.5pt dashed #000; margin: 8pt 0; }
          table { width: 100%; border-collapse: collapse; }
          th { border-bottom: 1pt solid #000; text-align: left; }
          td { padding: 4pt 0; }
          .header { font-size: 14pt; font-weight: bold; margin-bottom: 5pt; }
        </style></head>
        <body>
          ${content.innerHTML}
          <script>window.onload = () => { window.print(); };</script>
        </body></html>
      `);
      doc.close();

      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 5000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-stone-50">
        <div ref={printRef} className="bg-white p-6 rounded shadow-sm">
          <div className="text-center font-bold text-xl mb-1">{receiptSettings?.brandName || 'BAKEWISE'}</div>
          <div className="text-center font-bold text-lg border-y py-2 border-black my-4">DAILY DISPATCH SUMMARY</div>
          
          <div className="flex justify-between text-sm mb-4">
            <span>Date: <strong>{date}</strong></span>
            <span>Total Dispatches: <strong>{todayDispatches.length}</strong></span>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style={{ textAlign: 'right' }}>Total Qty</th>
              </tr>
            </thead>
            <tbody>
              {summaryList.map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.quantity}</td>
                </tr>
              ))}
              {summaryList.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center py-8 text-stone-400 italic">No dispatch data for this date</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="divider"></div>
          <div className="text-center text-xs text-stone-500 mt-4">
            Summary generated on {new Date().toLocaleString()}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
          <Button onClick={handlePrint} className="flex-1" disabled={summaryList.length === 0}>
            <Printer className="h-4 w-4 mr-2" /> Print Summary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
