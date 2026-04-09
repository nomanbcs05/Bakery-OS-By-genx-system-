import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useApp } from '@/context/AppContext';

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
  const { receiptSettings, currentUser } = useApp();

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=320,height=600');
    if (!win) return;
    win.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body { 
          font-family: 'Courier New', Courier, monospace; 
          font-size: 13px; 
          color: #000; 
          background: #fff;
          margin: 0; 
          padding: 10px; 
          width: 280px; 
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .dashed-line { 
          border-top: 1px dashed #000; 
          margin: 8px 0; 
        }
        .flex-between { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start;
          margin-bottom: 3px;
        }
        .block-item { margin-bottom: 6px; }
        .title { font-size: 15px; font-weight: bold; margin-bottom: 2px; }
        .subtitle { font-weight: bold; font-size: 13px; margin-bottom: 2px; }
        .info-lines { line-height: 1.3; font-size: 12px; }
      </style></head><body>
      \${content.innerHTML}
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    win.document.close();
  };

  const formattedDate = new Date(date).toLocaleString();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Print Receipt</DialogTitle>
        </DialogHeader>

        <div className="bg-white text-black p-4 mx-auto w-[280px] font-mono text-[13px] border shadow-sm" ref={receiptRef}>
          {/* Header */}
          <div className="text-center info-lines mb-2">
            <div className="title" style={{ fontFamily: 'monospace' }}>{receiptSettings?.brandName || 'BakeryPOS'}</div>
            <div className="subtitle">{receiptSettings?.tagline || 'Premium Quality'}</div>
            <div>{receiptSettings?.address || 'City, Country'}</div>
            <div>{receiptSettings?.phone || '000-0000000'}</div>
          </div>

          <div className="dashed-line"></div>

          {/* Metadata */}
          <div className="info-lines mb-2">
            <div className="flex-between">
              <span>Invoice:</span>
              <span className="font-bold">{saleId.toUpperCase().slice(0, 12)}</span>
            </div>
            <div className="flex-between">
              <span>Date:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex-between">
              <span>Cashier:</span>
              <span>{currentUser?.name || branch}</span>
            </div>
            <div className="flex-between">
              <span>Customer:</span>
              <span>Walk-in</span>
            </div>
          </div>

          <div className="dashed-line"></div>

          {/* Items */}
          <div className="mb-2">
            {items.map((item, i) => (
              <div key={i} className="block-item">
                <div className="font-bold">{item.name}</div>
                <div className="flex-between text-[12px]">
                  <span>{item.quantity} x Rs.{item.unitPrice.toLocaleString()}</span>
                  <span>Rs.{(item.quantity * item.unitPrice).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="dashed-line"></div>

          {/* Totals */}
          <div className="info-lines mb-2">
            <div className="flex-between">
              <span>Subtotal:</span>
              <span>Rs.{total.toLocaleString()}</span>
            </div>
            <div className="flex-between">
              <span>Discount:</span>
              <span>-Rs.0</span>
            </div>
            <div className="flex-between font-bold" style={{ fontSize: '14px', marginTop: '4px' }}>
              <span>TOTAL:</span>
              <span>Rs.{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="dashed-line"></div>

          {/* Payment */}
          <div className="info-lines mb-2">
            <div className="font-bold mb-1 uppercase tracking-wider text-[12px]">{paymentMethod}</div>
            <div className="flex-between">
              <span>Received:</span>
              <span>Rs.{total.toLocaleString()}</span>
            </div>
            <div className="flex-between">
              <span>Change:</span>
              <span>Rs.0</span>
            </div>
          </div>

          <div className="dashed-line"></div>

          {/* Footer */}
          <div className="text-center mt-3">
            <div className="font-bold mb-2" style={{ fontSize: '13px' }}>
              {receiptSettings?.footerMessage1 || 'Thank you for shopping!'}
            </div>
            <div style={{ fontSize: '10px', lineHeight: '1.2', color: '#333' }}>
              <div>{receiptSettings?.footerMessage2 || 'Items cannot be returned.'}</div>
              <div className="mt-2 text-[#666]">{receiptSettings?.printedBy || 'Software by GenX'}</div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
          <Button onClick={handlePrint} className="flex-1 shrink-0">
            <Printer className="h-4 w-4 mr-1" /> Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
