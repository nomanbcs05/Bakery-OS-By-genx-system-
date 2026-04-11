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

  const commonStyles = `
    body { 
      font-family: 'Courier New', Courier, monospace; 
      font-size: 11pt; 
      color: #000; 
      margin: 0; 
      padding: 0; 
      width: 300px; 
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    
    .receipt-logo {
      max-height: 70pt !important;
      max-width: 200pt !important;
      margin: 0 auto 5pt auto;
      display: block;
      object-fit: contain;
      filter: grayscale(1);
    }

    .receipt-box { 
      border: 1.5pt solid #000 !important; 
      padding: 6pt; 
      margin-bottom: 8pt; 
    }
    .receipt-order-num { 
      border: 2pt solid #000 !important; 
      padding: 6pt; 
      margin: 8pt 0; 
      font-size: 22pt; 
      font-weight: bold; 
      text-align: center; 
      display: block;
    }
    .receipt-divider { 
      border-top: 1.5pt dashed #000; 
      margin: 4pt 0; 
    }
    .receipt-line { 
      border-top: 1.5pt solid #000; 
      margin: 4pt 0; 
    }
    
    .flex-row { display: flex; justify-content: space-between; }
    .highlight-bill { 
      border-top: 1pt solid #000; 
      border-bottom: 2pt solid #000; 
      padding: 4pt 2pt; 
      font-size: 14pt; 
      font-weight: bold; 
      display: flex; 
      justify-content: space-between; 
      background: #eee !important;
      -webkit-print-color-adjust: exact;
    }
    .item-table-header { 
      border-bottom: 1.5pt solid #000; 
      font-weight: bold; 
      display: flex; 
      margin-bottom: 4pt; 
      padding-bottom: 2pt;
    }
    .w-qty { width: 40px; }
    .w-item { flex: 1; padding: 0 4px; }
    .w-rate { width: 60px; text-align: right; }
    .w-amount { width: 70px; text-align: right; }
    
    .phone-pill {
      background: #000 !important;
      color: #fff !important;
      padding: 1px 4px;
      font-weight: bold;
      -webkit-print-color-adjust: exact;
    }
  `;

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
          ${commonStyles}
          body { padding: 10px; }
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

  const shortId = saleId.slice(-4).toUpperCase();
  const dDate = new Date(date);
  const formattedDate = dDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  const formattedTime = dDate.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-stone-100 border-none p-6 shadow-2xl">
        <style>{commonStyles}</style>
        <div className="bg-white text-black p-4 mx-auto w-full max-w-[320px] shadow-sm" ref={receiptRef}>
          
          {/* Header Box */}
          <div className="receipt-box text-center">
            {receiptSettings?.logoUrl ? (
              <img src={receiptSettings.logoUrl} alt="Logo" className="receipt-logo" />
            ) : (
               <div className="flex justify-center mb-1">
                 <svg width="60" height="40" viewBox="0 0 100 60" fill="currentColor">
                   <path d="M50 0 L60 20 L80 20 L65 35 L70 55 L50 40 L30 55 L35 35 L20 20 L40 20 Z" fill="#000" />
                   <path d="M50 10 L55 25 L70 25 L60 35 L65 50 L50 40 L35 50 L40 35 L30 25 L45 25 Z" fill="#fff" />
                 </svg>
               </div>
            )}
            
            <div className="text-[10pt] leading-tight whitespace-pre-line mb-1">
              {receiptSettings?.address}
            </div>
            <div className="text-[10pt] font-bold">
              {receiptSettings?.phone}
            </div>
            
            <div className="receipt-divider"></div>
            <div className="text-[9pt] font-bold">
              {receiptSettings?.printedBy}
            </div>
          </div>

          {/* Large Order Number Box */}
          <div className="receipt-order-num">
            {shortId.slice(-2)}
          </div>

          {/* Metadata Section */}
          <div className="text-[11pt] space-y-0.5 mb-2">
            <div className="flex-row">
              <span>Invoice #: <span className="font-bold">{shortId.slice(-2)}</span></span>
              <span>DAY-{shortId}</span>
            </div>
            <div className="flex-row font-bold">
              <span>Restaurant:</span>
              <span className="uppercase">{receiptSettings?.brandName}</span>
            </div>
            <div className="flex-row">
              <span>Cashier:</span>
              <span>{currentUser?.name || 'SYS_ADMIN'}</span>
            </div>
            <div className="flex-row">
              <span>Type:</span>
              <span className="font-bold uppercase">WALK IN</span>
            </div>
            <div className="flex-row">
              <span>{formattedDate}</span>
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* Table */}
          <div className="receipt-line"></div>
          <div className="item-table-header">
            <div className="w-qty">Qty</div>
            <div className="w-item">Item</div>
            <div className="w-rate">Rate</div>
            <div className="w-amount">Amount</div>
          </div>
          
          <div className="space-y-1 min-h-[40px]">
            {items.map((item, i) => (
              <div key={i} className="flex text-[10pt] leading-[1.2]">
                <div className="w-qty font-bold">{item.quantity}</div>
                <div className="w-item uppercase">{item.name}</div>
                <div className="w-rate">{item.unitPrice}</div>
                <div className="w-amount font-bold">{(item.quantity * item.unitPrice)}</div>
              </div>
            ))}
          </div>

          {/* Totals Section */}
          <div className="receipt-line mt-4"></div>
          <div className="text-[11pt] space-y-1">
            <div className="flex-row">
              <span>SubTotal :</span>
              <span className="font-bold">{total}</span>
            </div>
            
            <div className="highlight-bill">
              <span>Net Bill :</span>
              <span>{total}</span>
            </div>
            
            <div className="flex-row">
              <span>TIP :</span>
              <span></span>
            </div>
          </div>

          {/* New Locations Footer Section */}
          <div className="receipt-divider !mt-4"></div>
          <div className="text-[7.5pt] space-y-1 py-1 uppercase leading-tight">
            <div className="flex-row items-center">
              <span>BRANCH 1: <span className="font-bold underline">{receiptSettings?.branch1Location || 'DHAMRA ROAD'}</span></span>
              <span>ORDER: <span className="phone-pill">{receiptSettings?.branch1OnlineOrder || '03297040402'}</span></span>
            </div>
            <div className="flex-row items-center">
              <span>BRANCH 2: <span className="font-bold underline">{receiptSettings?.branch2Location || 'JAM SAHAB RD'}</span></span>
              <span>ORDER: <span className="phone-pill">{receiptSettings?.branch2OnlineOrder || '03093660360'}</span></span>
            </div>
          </div>
          <div className="receipt-divider"></div>

          {/* Tagline Footer */}
          <div className="receipt-box text-center mt-2">
            <div className="font-bold text-[10pt] mb-1">
              {receiptSettings?.footerMessage1}
            </div>
            <div className="text-[9pt] leading-tight font-bold">
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

