import { useRef, useEffect } from 'react';
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
  autoPrint?: boolean;
}

export default function ReceiptDialog({ open, onClose, items, total, paymentMethod, branch, saleId, date, autoPrint }: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { receiptSettings, currentUser } = useApp();

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html><head><title>Receipt</title>
        <style>
          @page { size: auto; margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 11px; 
            color: #000; 
            background: #fff;
            margin: 0; 
            padding: 10px; 
            width: 260px; 
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .border-full { border: 1.5px solid #000; padding: 6px; margin-bottom: 8px; }
          .border-b { border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 4px; }
          .dashed-t { border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
          .flex-between { display: flex; justify-content: space-between; align-items: start; }
          .order-num-box { border: 2px solid #000; padding: 4px; margin: 8px 0; font-size: 24px; font-weight: bold; text-align: center; }
          
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .meta-label { font-weight: bold; }
          
          .table-header { display: flex; border-bottom: 1.5px solid #000; padding-bottom: 2px; margin-bottom: 4px; font-weight: bold; }
          .w-qty { width: 30px; }
          .w-item { flex: 1; padding: 0 4px; }
          .w-rate { width: 50px; text-align: right; }
          .w-amount { width: 60px; text-align: right; }
          
          .item-row { display: flex; align-items: start; margin-bottom: 4px; line-height: 1.2; }
          
          .totals-section { margin-top: 8px; border-top: 1px solid #000; padding-top: 4px; }
          .highlight-row { background: #f0f0f0; margin: 4px 0; padding: 2px 0; font-size: 14px; display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #000; border-bottom: 1px solid #000; }
          
          @media print { 
            body { padding: 0; width: 100%; } 
            .highlight-row { -webkit-print-color-adjust: exact; background: #eee !important; }
          }
        </style></head>
        <body>
          ${content.innerHTML}
          <script>window.onload = () => { window.print(); };</script>
        </body></html>
      `);
      doc.close();

      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);
    }
  };

  useEffect(() => {
    if (open && autoPrint) {
      setTimeout(() => {
        handlePrint();
      }, 500);
    }
  }, [open, autoPrint]);

  const shortId = saleId.slice(-2).padStart(2, '0');
  const dDate = new Date(date);
  const formattedDate = dDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
  const formattedTime = dDate.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto bg-stone-100 border-none p-6 shadow-2xl">
        <div className="bg-white text-black p-4 mx-auto w-full max-w-[280px] shadow-sm border border-stone-200" ref={receiptRef} style={{ fontFamily: '"Courier New", Courier, monospace' }}>
          
          {/* Header Box */}
          <div className="border-[1.5px] border-black p-2 text-center mb-2">
            {receiptSettings?.logoUrl ? (
              <img src={receiptSettings.logoUrl} alt="Logo" className="max-h-16 max-w-[150px] mx-auto mb-2 object-contain filter grayscale" />
            ) : (
               <div className="flex justify-center mb-1">
                 <svg width="60" height="40" viewBox="0 0 100 60" fill="currentColor">
                   <path d="M50 0 L60 20 L80 20 L65 35 L70 55 L50 40 L30 55 L35 35 L20 20 L40 20 Z" fill="#000" />
                   <path d="M50 10 L55 25 L70 25 L60 35 L65 50 L50 40 L35 50 L40 35 L30 25 L45 25 Z" fill="#fff" />
                 </svg>
               </div>
            )}
            
            <div className="text-[10px] leading-tight whitespace-pre-line mb-1">
              {receiptSettings?.address}
            </div>
            <div className="text-[10px] font-bold mb-1">
              {receiptSettings?.phone}
            </div>
            
            <div className="border-t border-black border-dotted my-1"></div>
            <div className="text-[9px] font-bold">
              {receiptSettings?.printedBy}
            </div>
          </div>

          {/* Large Order Number Box */}
          <div className="border-[1.5px] border-black py-1 text-center text-2xl font-bold mb-2">
            {shortId}
          </div>

          {/* Metadata Section */}
          <div className="space-y-0.5 text-[11px] mb-2">
            <div className="flex justify-between">
              <span>Invoice #: <span className="font-bold">{shortId}</span></span>
              <span>DAY-{(parseInt(shortId) + 1000).toString().padStart(4, '0')}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="font-bold">Restaurant:</span>
              <span className="font-bold text-right uppercase">{receiptSettings?.brandName}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{currentUser?.name || 'SYS_ADMIN'}</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="font-bold uppercase">WALK IN</span>
            </div>
            <div className="flex justify-between">
              <span>{formattedDate}</span>
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* Table */}
          <div className="border-t-[1.5px] border-black pt-1">
            <div className="flex font-bold text-[11px] border-b border-black pb-0.5 mb-1">
              <div className="w-[30px]">Qty</div>
              <div className="flex-1 px-1">Item</div>
              <div className="w-[50px] text-right">Rate</div>
              <div className="w-[60px] text-right">Amount</div>
            </div>
            
            <div className="space-y-1 min-h-[40px]">
              {items.map((item, i) => (
                <div key={i} className="flex items-start text-[10px] leading-[1.1]">
                  <div className="w-[30px] font-bold">{item.quantity}</div>
                  <div className="flex-1 px-1 uppercase">{item.name}</div>
                  <div className="w-[50px] text-right">{item.unitPrice}</div>
                  <div className="w-[60px] text-right font-bold">{(item.quantity * item.unitPrice)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="mt-4 space-y-0.5 text-[11px]">
            <div className="flex justify-between">
              <span>SubTotal :</span>
              <span className="font-bold">{total}</span>
            </div>
            
            <div className="bg-gray-100 border-y border-black font-bold flex justify-between py-0.5 px-1 items-center my-1">
              <span className="text-sm">Net Bill :</span>
              <span className="text-lg">{total}</span>
            </div>
            
            <div className="flex justify-between">
              <span>TIP :</span>
              <span></span>
            </div>
          </div>

          {/* Footer Box */}
          <div className="border-[1.5px] border-black p-1 text-center mt-3">
            <div className="font-bold text-[10px] mb-0.5">
              {receiptSettings?.footerMessage1}
            </div>
            <div className="text-[8px] leading-tight">
              {receiptSettings?.footerMessage2}
            </div>
          </div>

        </div>

        <DialogFooter className="flex flex-row gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-white hover:bg-stone-50 border-stone-300">Close Preview</Button>
          <Button onClick={handlePrint} className="flex-1 bg-black text-white hover:bg-stone-900 border-none">
            <Printer className="h-4 w-4 mr-2" /> Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

