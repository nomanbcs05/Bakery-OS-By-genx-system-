import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Printer } from 'lucide-react';
import type { SaleItem } from '@/types';

interface ReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  items: { name: string; quantity: number; unitPrice: number }[];
  total: number;
  paymentMethod: string;
  branch: string;
  saleId: string;
  date: string;
}

export default function ReceiptDialog({ open, onClose, items, total, paymentMethod, branch, saleId, date }: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=320,height=600');
    if (!win) return;
    win.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; max-width: 280px; margin: 0 auto; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        .total-row { font-size: 14px; font-weight: bold; }
        @media print { body { margin: 0; } }
      </style></head><body>
      ${content.innerHTML}
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Sale Receipt</DialogTitle>
        </DialogHeader>

        <div ref={receiptRef} className="space-y-2 text-sm font-mono">
          <div className="text-center">
            <p className="font-bold text-base">🍞 BakeryOS</p>
            <p className="text-muted-foreground text-xs">{branch}</p>
            <p className="text-muted-foreground text-xs">{date}</p>
            <p className="text-muted-foreground text-xs">Receipt #{saleId}</p>
          </div>

          <Separator className="my-2" />

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Item</span>
              <span>Amount</span>
            </div>
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="flex-1 truncate pr-2">
                  {item.name} x{item.quantity}
                </span>
                <span className="font-medium">Rs. {(item.quantity * item.unitPrice).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Separator className="my-2" />

          <div className="flex justify-between font-bold text-base">
            <span>TOTAL</span>
            <span className="text-primary">Rs. {total.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Payment</span>
            <span className="capitalize">{paymentMethod}</span>
          </div>

          <Separator className="my-2" />

          <p className="text-center text-xs text-muted-foreground">Thank you for your purchase!</p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
